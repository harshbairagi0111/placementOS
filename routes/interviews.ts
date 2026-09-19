import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Type } from '@google/genai';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { InterviewExperience, normalizeInterviewQuestions } from '../src/models/InterviewExperience';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { awardBadgeForUser } from './badges';
import { inMemoryExperiences } from './experiences';
import { callGeminiResilient } from './geminiClient';
import { sendSafeServerError } from './errorHandler';
import {
  EYE_CONTACT_THRESHOLD,
  EYE_CONTACT_VIOLATION_DURATION_MS,
  EYE_CONTACT_VIOLATION_TYPE,
  EYE_CONTACT_VIOLATION_MESSAGE,
  MAX_PROCTORING_VIOLATIONS,
  MULTIPLE_VIOLATIONS_TERMINATION_REASON,
  MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
  isActualProctoringViolation,
  countActualProctoringViolations,
} from '../src/utils/eyeContactProctoring';

export const interviewsRouter = Router();

// Helper to generate personalized strengths & improvements via Gemini based on actual session metrics
async function generateReportFeedbackWithGemini(data: {
  companyName: string;
  roleName: string;
  avgPosture: number;
  avgEyeContact: number;
  avgConfidence: number;
  avgComm: number;
  avgTech: number;
  proctoringScore: number;
  violations: any[];
  questionLogs: any[];
}): Promise<{ strengths: string[]; improvements: string[] }> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      strengths: [
        `Maintained upright posture alignment (${data.avgPosture}%) throughout the session.`,
        `Demonstrated technical foundation for ${data.roleName} at ${data.companyName}.`,
        `Proctoring integrity sustained at ${data.proctoringScore}%.`,
      ],
      improvements: [
        `Focus on maintaining consistent eye contact (${data.avgEyeContact}%) locked on camera lens.`,
        `Structure complex answers cleanly using the STAR method.`,
      ],
    };
  }

  try {
    const prompt = `You are an expert AI interview evaluator assessing a candidate interviewing for ${data.roleName} at ${data.companyName}.
Based strictly on the candidate's actual mock interview session metrics and question logs below, generate:
- 3 to 4 genuine, personalized candidate strengths (specific to their actual answers, technical performance, posture, communication, eye contact, or proctoring integrity).
- 2 to 3 genuine, actionable improvements (specific to areas where scores were lower, questions were unanswered or brief, violations occurred, or feedback suggested room for growth).

Session Performance Metrics & Logs:
- Company: ${data.companyName}
- Role: ${data.roleName}
- Posture Alignment Score: ${data.avgPosture}%
- Eye Contact Score: ${data.avgEyeContact}%
- Confidence Score: ${data.avgConfidence}%
- Communication Score: ${data.avgComm}%
- Technical Score: ${data.avgTech}%
- Proctoring Integrity Score: ${data.proctoringScore}%
- Proctoring Violations Logged (${data.violations.length}): ${JSON.stringify(data.violations)}
- Question Logs (${data.questionLogs.length} questions):
${JSON.stringify(
  data.questionLogs.map((q: any, i: number) => ({
    questionIndex: i + 1,
    question: q.question,
    userAnswer: q.userAnswer || q.answer,
    techScore: q.techScore,
    commScore: q.commScore,
    postureScore: q.postureScore,
    eyeContactScore: q.eyeContactScore,
    aiFeedback: q.aiFeedback,
  })),
  null,
  2
)}

Return strictly a JSON object with two keys: "strengths" (array of 3-4 strings) and "improvements" (array of 2-3 strings). Do not invent stats not present in the data.`;

    const response = await callGeminiResilient({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 genuine candidate strengths based on actual session data',
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 genuine candidate improvements based on actual session data',
            },
          },
          required: ['strengths', 'improvements'],
        },
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    const strengths =
      Array.isArray(parsed.strengths) && parsed.strengths.length > 0
        ? parsed.strengths
        : [
            `Demonstrated technical foundation for ${data.roleName}.`,
            `Maintained ${data.avgPosture}% posture score throughout the interview.`,
            `Achieved ${data.proctoringScore}% proctoring integrity score.`,
          ];
    const improvements =
      Array.isArray(parsed.improvements) && parsed.improvements.length > 0
        ? parsed.improvements
        : [
            `Maintain continuous eye contact (${data.avgEyeContact}%) with camera lens.`,
            `Structure answers concisely using STAR method.`,
          ];

    return { strengths, improvements };
  } catch (err: any) {
    console.error('[Gemini Report Feedback Generation Error]:', {
      message: err?.message || String(err),
      status: err?.status,
      errorDetails: err?.errorDetails || err,
    });
    return {
      strengths: [
        `Maintained solid posture alignment (${data.avgPosture}%) during the technical session.`,
        `Demonstrated technical potential for the ${data.roleName} position at ${data.companyName}.`,
        `Sustained a ${data.proctoringScore}% proctoring score.`,
      ],
      improvements: [
        `Focus on keeping eye contact focused on camera lens (${data.avgEyeContact}%).`,
        `Provide more structured and detailed examples in candidate responses.`,
      ],
    };
  }
}

// In-memory fallback session cache
const inMemorySessions = new Map<string, any>();

// In-process mutex to serialize concurrent state mutations per interview session
const sessionMutexes = new Map<string, Promise<void>>();

async function withSessionLock<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
  const previous = sessionMutexes.get(sessionId) || Promise.resolve();
  let release: () => void = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  sessionMutexes.set(
    sessionId,
    previous.catch(() => {}).then(() => current)
  );

  try {
    await previous.catch(() => {});
    return await task();
  } finally {
    release();
    if (sessionMutexes.get(sessionId) === current) {
      sessionMutexes.delete(sessionId);
    }
  }
}

async function evaluateAnswerWithGemini(question: string, answer: string, snapshotBase64?: string) {
  const trimmed = (answer || '').trim();
  const isNoAnswer = !trimmed || trimmed.toLowerCase() === 'no answer provided.' || trimmed.toLowerCase() === 'no answer';

  if (!process.env.GEMINI_API_KEY) {
    if (isNoAnswer) {
      return {
        postureScore: 85,
        eyeContactScore: 85,
        confidenceScore: 20,
        commScore: 10,
        techScore: 0,
        aiFeedback: 'No answer was provided for this question.',
      };
    }
    const len = trimmed.length;
    const techScore = Math.min(96, Math.max(50, 65 + Math.floor(len / 20)));
    return {
      postureScore: 90,
      eyeContactScore: 88,
      confidenceScore: 85,
      commScore: 82,
      techScore,
      aiFeedback: 'Response recorded. Good attempt covering core concepts.',
    };
  }

  try {
    const parts: any[] = [];
    if (snapshotBase64) {
      let cleanBase64 = snapshotBase64;
      let mimeType = 'image/jpeg';
      if (cleanBase64.includes(';base64,')) {
        const split = cleanBase64.split(';base64,');
        const mimeMatch = split[0].match(/data:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        cleanBase64 = split[1];
      }
      if (cleanBase64) {
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        });
      }
    }

    parts.push({
      text: `You are an expert AI technical interviewer and multimodal candidate evaluator.
Assess the candidate's interview answer and webcam posture snapshot (if provided).

Question: "${question}"
Candidate Answer: "${answer}"

CRITICAL SCORING AND EVALUATION RULES (Scores must be integers on a 0 to 100 percentage scale):
1. Missing/No Answer: If the candidate answer is empty, "No answer provided.", "I don't know", or completely off-topic gibberish:
   - techScore MUST be between 0 and 15
   - commScore MUST be between 0 and 20
   - confidenceScore MUST be between 10 and 35
   - aiFeedback MUST explicitly state that no substantive answer was provided, and briefly summarize what key concepts/points should have been discussed.
2. Incomplete or Weak Answer: If the candidate answered but was vague or missed crucial details:
   - techScore between 35 and 65
   - commScore between 40 and 70
   - aiFeedback should note what was correct and what key points were missing.
3. Strong or Excellent Answer: If the candidate provided a detailed, accurate explanation:
   - techScore between 75 and 98
   - commScore between 75 and 95
   - aiFeedback should highlight the strong points of their explanation and any subtle refinements.

Evaluate and output a JSON object with strictly these fields (all scores integer 0-100):
- postureScore: Body alignment, posture uprightness, shoulder symmetry (default 85 if no snapshot)
- eyeContactScore: Lens gaze focus and stability (default 85 if no snapshot)
- confidenceScore: Facial poise, calmness, and lack of hesitation (0-100)
- commScore: Structure, clarity, articulation rate and vocabulary (0-100)
- techScore: Relevance, accuracy, and depth of technical answer (0-100)
- aiFeedback: A concise, constructive 1-2 sentence feedback summary specifically addressing their response.`,
    });

    const response = await callGeminiResilient({
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            postureScore: { type: Type.INTEGER },
            eyeContactScore: { type: Type.INTEGER },
            confidenceScore: { type: Type.INTEGER },
            commScore: { type: Type.INTEGER },
            techScore: { type: Type.INTEGER },
            aiFeedback: { type: Type.STRING },
          },
          required: ['postureScore', 'eyeContactScore', 'confidenceScore', 'commScore', 'techScore', 'aiFeedback'],
        },
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return {
      postureScore: typeof parsed.postureScore === 'number' ? parsed.postureScore : 85,
      eyeContactScore: typeof parsed.eyeContactScore === 'number' ? parsed.eyeContactScore : 85,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : (isNoAnswer ? 20 : 80),
      commScore: typeof parsed.commScore === 'number' ? parsed.commScore : (isNoAnswer ? 10 : 75),
      techScore: typeof parsed.techScore === 'number' ? parsed.techScore : (isNoAnswer ? 0 : 75),
      aiFeedback: String(parsed.aiFeedback || (isNoAnswer ? 'No answer was provided for this question.' : 'Response evaluated.')),
    };
  } catch (err: any) {
    console.error('[Gemini Interview Evaluation Error]:', {
      message: err?.message || String(err),
      status: err?.status,
      errorDetails: err?.errorDetails || err,
    });
    if (isNoAnswer) {
      return {
        postureScore: 85,
        eyeContactScore: 85,
        confidenceScore: 20,
        commScore: 10,
        techScore: 0,
        aiFeedback: 'No answer was provided for this question.',
      };
    }
    const len = trimmed.length;
    const techScore = Math.min(95, Math.max(50, 65 + Math.floor(len / 25)));
    return {
      postureScore: 88,
      eyeContactScore: 86,
      confidenceScore: 80,
      commScore: 78,
      techScore,
      aiFeedback: 'Candidate answer logged and assessed.',
    };
  }
}

// Static fallback questions dictionary if Gemini is unavailable or errors
const STATIC_COMPANY_QUESTIONS: Record<string, string[]> = {
  google: [
    'How would you design a distributed real-time rate limiter for Google Cloud APIs handling 100k RPS?',
    'Given a stream of integers, implement a data structure to compute the median in O(1) time. Explain time and space complexity tradeoffs.',
    'Explain how Google Spanner achieves external consistency and high availability across globally distributed data centers.',
  ],
  microsoft: [
    'How would you architect a resilient microservices backend on Azure for enterprise single sign-on (SSO)?',
    'Implement an LRU Cache with O(1) get and put operations in your preferred programming language.',
    'How would you optimize SQL queries and indexing for a high-traffic relational database table with 50M rows?',
  ],
  amazon: [
    'Tell me about a time you made a significant technical architectural decision with incomplete data. Which Leadership Principle applied?',
    'How would you design Amazon Prime Video live streaming pipeline to scale to 20 million concurrent viewers with minimal latency?',
    'Given an array of strings representing product IDs, group anagrams together with optimal asymptotic runtime.',
  ],
  meta: [
    'How would you design the Instagram Explore feed recommendation system to handle ranking 1 billion candidate posts in under 100ms?',
    'Implement an algorithm to find the lowest common ancestor (LCA) of two nodes in a binary tree.',
    'Explain how GraphQL query batching and DataLoader reduce the N+1 problem in high-scale social graph applications.',
  ],
  netflix: [
    'Design a fault-tolerant distributed video transcoding service that splits 4K videos into chunks and processes them across worker pools.',
    'How does Netflix Chaos Engineering (e.g. Chaos Monkey) ensure microservice resilience during AWS region outages?',
    'Implement a custom memory-efficient Trie data structure with autocomplete search and prefix ranking.',
  ],
  apple: [
    'Explain how memory management and Automatic Reference Counting (ARC) work under the hood in Swift / Objective-C / C++.',
    'Design an end-to-end encrypted notification delivery system for 500 million active iOS devices.',
    'Given a 2D grid representing a circuit board, find the shortest path between two microchips avoiding obstacles.',
  ],
  tcs: [
    'Explain the core differences between monolithic architectures and microservices, including database decoupling strategies.',
    'Write a function to detect and remove a cycle in a singly linked list in O(n) time and O(1) space.',
    'How do Java Garbage Collection algorithms (G1, ZGC) work and how would you diagnose memory leaks in production?',
  ],
  infosys: [
    'Explain the ACID properties of relational databases and how BASE consistency differs in NoSQL distributed databases.',
    'Implement binary search on a rotated sorted array in O(log n) time.',
    'How does Spring Boot handle dependency injection, bean lifecycle, and transaction management under concurrent loads?',
  ],
  default: [
    'Walk me through the design of a scalable URL shortening service (like Bitly) handling 10,000 writes per second.',
    'Given an unsorted array of integers, find the length of the longest consecutive elements sequence in O(n) time.',
    'Explain the differences between optimistic and pessimistic locking in high-concurrency database transactions.',
  ],
};

function getStaticFallbackQuestions(comp: string, count: number, excludeList: string[] = []): string[] {
  const key = comp.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matched = Object.keys(STATIC_COMPANY_QUESTIONS).find((k) => key.includes(k)) || 'default';
  const pool = STATIC_COMPANY_QUESTIONS[matched] || STATIC_COMPANY_QUESTIONS.default;
  const excludeLower = new Set(excludeList.map((q) => q.toLowerCase()));
  const available = pool.filter((q) => !excludeLower.has(q.toLowerCase()));
  if (available.length < count) {
    for (const q of STATIC_COMPANY_QUESTIONS.default) {
      if (!excludeLower.has(q.toLowerCase()) && !available.includes(q)) {
        available.push(q);
      }
    }
  }
  return available.slice(0, count);
}

// GET /api/interviews/questions?company=X&role=Y — Returns interview questions grounded in approved experiences
interviewsRouter.get('/questions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const companyParam = typeof req.query.company === 'string' ? req.query.company.trim() : '';
    const roleParam = typeof req.query.role === 'string' ? req.query.role.trim() : 'Software Engineer';
    const companyName = companyParam || 'Google';
    const roleName = roleParam || 'Software Engineer';

    // 1. Fetch approved InterviewExperience documents matching that company (case-insensitive)
    let approvedDocs: any[] = [];
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      try {
        const escaped = companyName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Try exact match case-insensitive
        approvedDocs = await InterviewExperience.find({
          status: 'approved',
          company: { $regex: new RegExp(`^${escaped}$`, 'i') },
        })
          .sort({ createdAt: -1 })
          .lean();

        // If none found with exact match, try substring match (e.g. "Google Cloud" matching "Google")
        if (approvedDocs.length === 0) {
          approvedDocs = await InterviewExperience.find({
            status: 'approved',
            company: { $regex: new RegExp(escaped, 'i') },
          })
            .sort({ createdAt: -1 })
            .lean();
        }
      } catch (dbErr) {
        console.warn('MongoDB query approved experiences error:', dbErr);
      }
    }

    // Also search in-memory if MongoDB returned none or is not connected
    if (approvedDocs.length === 0 && inMemoryExperiences.length > 0) {
      const targetLower = companyName.toLowerCase();
      let memApproved = inMemoryExperiences.filter(
        (e) => e.status === 'approved' && e.company && e.company.toLowerCase() === targetLower
      );
      if (memApproved.length === 0) {
        memApproved = inMemoryExperiences.filter(
          (e) =>
            e.status === 'approved' &&
            e.company &&
            (e.company.toLowerCase().includes(targetLower) || targetLower.includes(e.company.toLowerCase()))
        );
      }
      approvedDocs = memApproved;
    }

    // 2. Collect real THEORY/BEHAVIORAL questions asked across approved submissions, preferring variety across submissions
    // (Strictly omit coding/DSA problems which belong exclusively in the Problem Arena)
    const submissionQuestionLists: string[][] = approvedDocs
      .map((doc) => {
        const questions = normalizeInterviewQuestions(doc.questionsAsked);
        return questions
          .filter((q) => q.type === 'theory' && q.text && q.text.trim().length > 0)
          .map((q) => q.text.trim());
      })
      .filter((list) => list.length > 0);

    // Pick real questions with round-robin variety across submissions
    const realQuestions: string[] = [];
    const seenLower = new Set<string>();

    const maxQuestionsPerSub = Math.max(...submissionQuestionLists.map((l) => l.length), 0);
    for (let round = 0; round < maxQuestionsPerSub; round++) {
      for (const subList of submissionQuestionLists) {
        if (round < subList.length) {
          const qText = subList[round];
          const lower = qText.toLowerCase();
          if (!seenLower.has(lower)) {
            seenLower.add(lower);
            realQuestions.push(qText);
            if (realQuestions.length >= 3) break;
          }
        }
      }
      if (realQuestions.length >= 3) break;
    }

    // 3. Logic based on real questions availability:
    // Case 1: 3 or more real questions -> return 3 real questions directly (no AI needed)
    if (realQuestions.length >= 3) {
      return res.json({
        company: companyName,
        role: roleName,
        questions: realQuestions.slice(0, 3).map((q) => ({
          text: q,
          source: 'real' as const,
        })),
      });
    }

    // Case 2: 1 or 2 real questions -> use real questions + generate 1-2 with Gemini grounded on real ones
    if (realQuestions.length > 0) {
      const neededCount = 3 - realQuestions.length;
      let generatedQuestions: string[] = [];

      try {
        const prompt = `You are an expert technical interviewer assessing a candidate for the role of "${roleName}" at "${companyName}".
Here are real, verified interview questions previously asked to candidates at ${companyName} during placement/hiring rounds:
${realQuestions.map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}

Generate exactly ${neededCount} additional interview question${neededCount > 1 ? 's' : ''} in a similar technical depth, style, and difficulty for ${companyName} (${roleName}).
Requirements:
- Do not repeat or directly rephrase the real questions listed above.
- Make the questions specific, practical, and tailored to ${companyName}'s engineering culture, technical bar, and domain.
- Return ONLY a JSON object with a "questions" array of strings.`;

        const response = await callGeminiResilient({
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['questions'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (Array.isArray(parsed.questions)) {
          generatedQuestions = parsed.questions
            .filter((q: any) => typeof q === 'string' && q.trim().length > 0)
            .map((q: any) => q.trim())
            .slice(0, neededCount);
        }
      } catch (geminiErr) {
        console.warn('[Gemini Question Generation Fallback]:', geminiErr);
      }

      // If Gemini failed or didn't return enough questions, fill from static pool
      if (generatedQuestions.length < neededCount) {
        const fallbacks = getStaticFallbackQuestions(
          companyName,
          neededCount - generatedQuestions.length,
          [...realQuestions, ...generatedQuestions]
        );
        generatedQuestions.push(...fallbacks);
      }

      const combined = [
        ...realQuestions.map((q) => ({ text: q, source: 'real' as const })),
        ...generatedQuestions.slice(0, neededCount).map((q) => ({ text: q, source: 'ai-generated' as const })),
      ];

      return res.json({
        company: companyName,
        role: roleName,
        questions: combined,
      });
    }

    // Case 3: 0 real questions -> generate 3 with Gemini or fallback to static questions
    let aiQuestions: string[] = [];
    try {
      const prompt = `You are an expert technical interviewer assessing a candidate for the role of "${roleName}" at "${companyName}".
Generate exactly 3 challenging and realistic technical interview questions tailored specifically to ${companyName}'s known hiring bar, engineering tech stack, core values, and interview style for the position of ${roleName}.
Requirements:
- Cover diverse areas (e.g. data structures/algorithms, system architecture/tradeoffs, domain-specific problem solving).
- Keep each question clear, concise, and interview-ready.
- Return ONLY a JSON object with a "questions" array of strings.`;

      const response = await callGeminiResilient({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.questions)) {
        aiQuestions = parsed.questions
          .filter((q: any) => typeof q === 'string' && q.trim().length > 0)
          .map((q: any) => q.trim())
          .slice(0, 3);
      }
    } catch (geminiErr) {
      console.warn('[Gemini Question Generation Fallback for 0 real questions]:', geminiErr);
    }

    // If Gemini failed or didn't return 3, fill from static pool
    if (aiQuestions.length < 3) {
      const fallbacks = getStaticFallbackQuestions(
        companyName,
        3 - aiQuestions.length,
        aiQuestions
      );
      aiQuestions.push(...fallbacks);
    }

    return res.json({
      company: companyName,
      role: roleName,
      questions: aiQuestions.slice(0, 3).map((q) => ({
        text: q,
        source: 'ai-generated' as const,
      })),
    });
  } catch (error: any) {
    console.error('[Get Interview Questions Error]:', error);
    // Never return an empty array or 500 error on question fetch
    return res.json({
      company: req.query.company || 'Default',
      role: req.query.role || 'Software Engineer',
      questions: [
        {
          text: 'Walk me through the design of a scalable URL shortening service (like Bitly) handling 10,000 writes per second.',
          source: 'ai-generated',
        },
        {
          text: 'Given an unsorted array of integers, find the length of the longest consecutive elements sequence in O(n) time.',
          source: 'ai-generated',
        },
        {
          text: 'Explain the differences between optimistic and pessimistic locking in high-concurrency database transactions.',
          source: 'ai-generated',
        },
      ],
    });
  }
});

// POST /api/interviews/start — creates a new MockInterviewSession document for the logged-in user
interviewsRouter.post('/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { company, jobRole, role, category } = req.body;
    const companyName = company || 'Google';
    const roleName = jobRole || role || 'Software Engineer';
    const categoryName = category || 'General Coding & System Design';

    let sessionId = `int_${Date.now()}`;
    let sessionObj: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const newSession = await MockInterviewSession.create({
          userId: req.user?.userId,
          company: companyName,
          role: roleName,
          category: categoryName,
          date: new Date().toISOString().split('T')[0],
          score: 0,
          verdict: 'Pending',
          status: 'active',
          questionLogs: [],
        });
        sessionId = String(newSession._id);
        sessionObj = newSession;
      } catch (dbErr) {
        console.warn('MongoDB create session error:', dbErr);
      }
    }

    if (!sessionObj) {
      sessionObj = {
        _id: sessionId,
        userId: req.user?.userId,
        company: companyName,
        role: roleName,
        category: categoryName,
        date: new Date().toISOString().split('T')[0],
        score: 0,
        verdict: 'Pending',
        status: 'active',
        questionLogs: [],
      };
      inMemorySessions.set(sessionId, sessionObj);
    }

    return res.status(201).json({
      _id: sessionId,
      sessionId,
      session: sessionObj,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to start interview session');
  }
});

// POST /api/interviews/:sessionId/answer — evaluates response with Gemini and pushes to questionLogs
interviewsRouter.post('/:sessionId/answer', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { sessionId } = req.params;
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const currentUserId = req.user.userId;

    let session: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        session = await MockInterviewSession.findById(sessionId);
      } catch (dbErr) {
        console.warn('MongoDB find session error:', dbErr);
      }
    }

    const memSession = inMemorySessions.get(sessionId);

    if (!session && !memSession) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Verify ownership for DB session if found
    if (session) {
      const sessionOwnerId = session.userId ? String(session.userId) : null;
      if (!sessionOwnerId || sessionOwnerId !== String(currentUserId)) {
        return res.status(403).json({ error: 'You do not have access to this interview session' });
      }
    }

    // Verify ownership for in-memory session if present (fail closed if owner cannot be safely established)
    if (memSession) {
      const memOwnerId = memSession.userId ? String(memSession.userId) : null;
      if (!memOwnerId || memOwnerId !== String(currentUserId)) {
        return res.status(403).json({ error: 'You do not have access to this interview session' });
      }
    }

    // Verify session is active and not terminated
    const isTerminated =
      (session && (session.status === 'TERMINATED' || session.verdict === 'TERMINATED')) ||
      (memSession && (memSession.status === 'TERMINATED' || memSession.verdict === 'TERMINATED'));

    if (isTerminated) {
      return res.status(403).json({
        error: 'Interview has been terminated due to a proctoring violation.',
        terminated: true,
        reason: session?.terminationReason || memSession?.terminationReason || 'TAB_SWITCH',
        remark: session?.remark || memSession?.remark || 'Cheating detected: Candidate attempted to switch tabs or leave the interview.',
      });
    }

    const isCompleted =
      (session && (session.status === 'completed' || (session.verdict && !['Pending', 'TERMINATED'].includes(session.verdict)))) ||
      (memSession && (memSession.status === 'completed' || (memSession.verdict && !['Pending', 'TERMINATED'].includes(memSession.verdict))));

    if (isCompleted) {
      return res.status(400).json({ error: 'Interview has already been completed.' });
    }

    const { question, questionText, answer, userAnswer, snapshotBase64 } = req.body;

    const qText = question || questionText || 'Technical Question';
    const aText = answer || userAnswer || 'No answer provided.';

    // Gemini evaluation
    const evalResult = await evaluateAnswerWithGemini(qText, aText, snapshotBase64);

    const logEntry = {
      question: qText,
      questionText: qText,
      answer: aText,
      userAnswer: aText,
      postureScore: evalResult.postureScore,
      eyeContactScore: evalResult.eyeContactScore,
      confidenceScore: evalResult.confidenceScore,
      commScore: evalResult.commScore,
      techScore: evalResult.techScore,
      aiFeedback: evalResult.aiFeedback,
      feedback: evalResult.aiFeedback,
      score: evalResult.techScore,
    };

    if (session) {
      try {
        session.questionLogs.push(logEntry);
        await session.save();
      } catch (dbErr) {
        console.warn('MongoDB push questionLog error:', dbErr);
      }
    }

    // Mirror in memory
    if (memSession) {
      memSession.questionLogs = memSession.questionLogs || [];
      memSession.questionLogs.push(logEntry);
    }

    return res.json({
      ...evalResult,
      questionLog: logEntry,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to evaluate answer');
  }
});

// POST /api/interviews/:sessionId/terminate — terminates an interview session immediately due to a proctoring violation (e.g. TAB_SWITCH)
interviewsRouter.post('/:sessionId/terminate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { sessionId } = req.params;
    if (!sessionId || (!mongoose.Types.ObjectId.isValid(sessionId) && !inMemorySessions.has(sessionId))) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const currentUserId = String(req.user.userId);

    return await withSessionLock(sessionId, async () => {
      let session: any = null;
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
        try {
          session = await MockInterviewSession.findById(sessionId);
        } catch (dbErr) {
          console.warn('MongoDB find session error:', dbErr);
        }
      }

      const memSession = inMemorySessions.get(sessionId);

      if (!session && !memSession) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      // Verify ownership for DB session if found
      if (session) {
        const sessionOwnerId = session.userId ? String(session.userId) : null;
        if (!sessionOwnerId || sessionOwnerId !== currentUserId) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this interview session' });
        }
      }

      // Verify ownership for in-memory session if found
      if (memSession) {
        const memOwnerId = memSession.userId ? String(memSession.userId) : null;
        if (!memOwnerId || memOwnerId !== currentUserId) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this interview session' });
        }
      }

      // Check if session has already been completed - do not overwrite final completed result
      const isAlreadyCompleted =
        (session && (String(session.status).toLowerCase() === 'completed' || (session.verdict && !['Pending', 'TERMINATED'].includes(session.verdict)))) ||
        (memSession && (String(memSession.status).toLowerCase() === 'completed' || (memSession.verdict && !['Pending', 'TERMINATED'].includes(memSession.verdict))));

      if (isAlreadyCompleted) {
        return res.status(409).json({
          error: 'Interview session is already completed and cannot be terminated',
          alreadyCompleted: true,
          session: session || memSession,
        });
      }

      const TERMINATION_REMARK = 'Cheating detected: Candidate attempted to switch tabs or leave the interview.';
      const VIOLATION_TYPE = 'TAB_SWITCH';
      const nowIso = new Date().toISOString();

      // Check if session has already been terminated - idempotent response
      const isAlreadyTerminated =
        (session && (String(session.status).toUpperCase() === 'TERMINATED' || String(session.verdict).toUpperCase() === 'TERMINATED')) ||
        (memSession && (String(memSession.status).toUpperCase() === 'TERMINATED' || String(memSession.verdict).toUpperCase() === 'TERMINATED'));

      if (isAlreadyTerminated) {
        return res.status(200).json({
          success: true,
          alreadyTerminated: true,
          status: 'TERMINATED',
          verdict: 'TERMINATED',
          terminationReason: session?.terminationReason || memSession?.terminationReason || VIOLATION_TYPE,
          remark: session?.remark || memSession?.remark || TERMINATION_REMARK,
          session: session || memSession,
        });
      }

      const violationEntry = {
        type: VIOLATION_TYPE,
        timestamp: nowIso,
        details: TERMINATION_REMARK,
      };

      let terminatedSession: any = null;

      if (session) {
        try {
          // Atomic conditional update in MongoDB ensuring single termination execution and idempotent violation push
          terminatedSession = await MockInterviewSession.findOneAndUpdate(
            {
              _id: sessionId,
              userId: req.user.userId,
              verdict: 'Pending',
              status: { $ne: 'TERMINATED' },
            },
            {
              $set: {
                status: 'TERMINATED',
                verdict: 'TERMINATED',
                terminationReason: VIOLATION_TYPE,
                remark: TERMINATION_REMARK,
                reviewNote: TERMINATION_REMARK,
                flaggedForReview: true,
                proctoringScore: 0,
                feedback: TERMINATION_REMARK,
              },
              $push: {
                violations: violationEntry,
              },
            },
            { returnDocument: 'after' }
          );

          if (!terminatedSession) {
            terminatedSession = await MockInterviewSession.findById(sessionId);
          }
        } catch (dbErr) {
          console.warn('MongoDB atomic terminate error:', dbErr);
        }
      }

      if (memSession) {
        memSession.status = 'TERMINATED';
        memSession.verdict = 'TERMINATED';
        memSession.terminationReason = VIOLATION_TYPE;
        memSession.remark = TERMINATION_REMARK;
        memSession.reviewNote = TERMINATION_REMARK;
        memSession.flaggedForReview = true;
        memSession.proctoringScore = 0;
        memSession.feedback = TERMINATION_REMARK;
        memSession.violations = memSession.violations || [];
        if (!memSession.violations.some((v: any) => v.type === VIOLATION_TYPE)) {
          memSession.violations.push(violationEntry);
        }
        if (!terminatedSession) {
          terminatedSession = memSession;
        }
      }

      return res.status(200).json({
        success: true,
        status: 'TERMINATED',
        verdict: 'TERMINATED',
        terminationReason: VIOLATION_TYPE,
        remark: TERMINATION_REMARK,
        session: terminatedSession,
      });
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to terminate interview session');
  }
});

// POST /api/interviews/:sessionId/device-event — records an informational connected device event (WebUSB)
interviewsRouter.post('/:sessionId/device-event', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { sessionId } = req.params;
    if (!sessionId || (!mongoose.Types.ObjectId.isValid(sessionId) && !inMemorySessions.has(sessionId))) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const currentUserId = String(req.user.userId);

    return await withSessionLock(sessionId, async () => {
      let session: any = null;
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
        try {
          session = await MockInterviewSession.findById(sessionId);
        } catch (dbErr) {
          console.warn('MongoDB find session error:', dbErr);
        }
      }

      const memSession = inMemorySessions.get(sessionId);

      if (!session && !memSession) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      // Verify ownership for DB session if found
      if (session) {
        const sessionOwnerId = session.userId ? String(session.userId) : null;
        if (!sessionOwnerId || sessionOwnerId !== currentUserId) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this interview session' });
        }
      }

      // Verify ownership for in-memory session if found
      if (memSession) {
        const memOwnerId = memSession.userId ? String(memSession.userId) : null;
        if (!memOwnerId || memOwnerId !== currentUserId) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this interview session' });
        }
      }

      // Check if session is already completed or terminated - reject device events against inactive sessions
      const isCompleted =
        (session && (String(session.status).toLowerCase() === 'completed' || (session.verdict && !['Pending', 'TERMINATED'].includes(session.verdict)))) ||
        (memSession && (String(memSession.status).toLowerCase() === 'completed' || (memSession.verdict && !['Pending', 'TERMINATED'].includes(memSession.verdict))));

      const isTerminated =
        (session && (String(session.status).toUpperCase() === 'TERMINATED' || String(session.verdict).toUpperCase() === 'TERMINATED')) ||
        (memSession && (String(memSession.status).toUpperCase() === 'TERMINATED' || String(memSession.verdict).toUpperCase() === 'TERMINATED'));

      if (isCompleted || isTerminated) {
        return res.status(409).json({
          error: isTerminated
            ? 'Interview session is terminated and cannot receive device events'
            : 'Interview session is already completed and cannot receive device events',
          active: false,
          status: isTerminated ? 'TERMINATED' : 'completed',
        });
      }

      // Validate event type
      const rawEventType = req.body?.eventType || req.body?.type;
      const ALLOWED_EVENT_TYPES = ['CONNECTED_DEVICE_DETECTED', 'CONNECTED_DEVICE_DISCONNECTED'];
      if (!rawEventType || !ALLOWED_EVENT_TYPES.includes(rawEventType)) {
        return res.status(400).json({
          error: `Invalid event type. Allowed: ${ALLOWED_EVENT_TYPES.join(', ')}`,
        });
      }
      const eventType = rawEventType;

      // Sanitize safe metadata only - strip any sensitive hardware/file/serial info
      const safeApi = String(req.body.api || 'webusb').slice(0, 30);
      const safeVendorId = req.body.vendorId !== undefined && req.body.vendorId !== null ? String(req.body.vendorId).trim().slice(0, 32) : '';
      const safeProductId = req.body.productId !== undefined && req.body.productId !== null ? String(req.body.productId).trim().slice(0, 32) : '';
      const safeDeviceClass = req.body.deviceClass !== undefined && req.body.deviceClass !== null ? String(req.body.deviceClass).trim().slice(0, 50) : 'Unknown';
      const detectionStatus = eventType === 'CONNECTED_DEVICE_DETECTED' ? 'DETECTED' : 'DISCONNECTED';

      // Deduplication check: debounce identical events within 5 seconds
      const existingEvents: any[] = [
        ...(session?.deviceEvents || []),
        ...(session?.violations || []),
        ...(memSession?.deviceEvents || []),
        ...(memSession?.violations || []),
      ];

      const isDuplicate = existingEvents.some((ev: any) => {
        if (ev.type !== eventType) return false;
        const sameVendor = (ev.vendorId || '') === safeVendorId;
        const sameProduct = (ev.productId || '') === safeProductId;
        if (!sameVendor || !sameProduct) return false;
        if (!ev.timestamp) return false;
        const diffMs = Math.abs(Date.now() - new Date(ev.timestamp).getTime());
        return diffMs < 5000;
      });

      const currentActualCount = countActualProctoringViolations(session?.violations || memSession?.violations || []);

      if (isDuplicate) {
        return res.status(200).json({
          success: true,
          deduplicated: true,
          message: 'Duplicate device event ignored within debounce window',
          eventType,
          actualViolationsCount: currentActualCount,
          maxViolations: MAX_PROCTORING_VIOLATIONS,
        });
      }

      const timestamp = new Date().toISOString();
      const deviceEventEntry = {
        id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: eventType,
        timestamp,
        api: safeApi,
        vendorId: safeVendorId,
        productId: safeProductId,
        deviceClass: safeDeviceClass,
        detectionStatus,
        details: `Browser device event: ${eventType} (Vendor: ${safeVendorId || 'N/A'}, Product: ${safeProductId || 'N/A'}) - Informational proctoring log`,
        isInformational: true,
      };

      // Update DB session if available
      if (session) {
        try {
          await MockInterviewSession.findByIdAndUpdate(sessionId, {
            $push: {
              deviceEvents: deviceEventEntry,
              violations: deviceEventEntry,
            },
          });
        } catch (dbErr) {
          console.warn('MongoDB device-event update error:', dbErr);
        }
      }

      // Update in-memory session if available
      if (memSession) {
        memSession.deviceEvents = memSession.deviceEvents || [];
        memSession.deviceEvents.push(deviceEventEntry);
        memSession.violations = memSession.violations || [];
        memSession.violations.push(deviceEventEntry);
      }

      return res.status(200).json({
        success: true,
        eventType,
        event: deviceEventEntry,
        sessionStatus: session?.status || memSession?.status || 'active',
        actualViolationsCount: currentActualCount,
        maxViolations: MAX_PROCTORING_VIOLATIONS,
      });
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to record connected device event');
  }
});

// POST /api/interviews/:sessionId/violation — records a proctoring violation (e.g. Rule 3 EYE_CONTACT)
interviewsRouter.post('/:sessionId/violation', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { sessionId } = req.params;
    if (!sessionId || (!mongoose.Types.ObjectId.isValid(sessionId) && !inMemorySessions.has(sessionId))) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const currentUserId = String(req.user.userId);

    return await withSessionLock(sessionId, async () => {
      let session: any = null;
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
        try {
          session = await MockInterviewSession.findById(sessionId);
        } catch (dbErr) {
          console.warn('MongoDB find session error:', dbErr);
        }
      }

      const memSession = inMemorySessions.get(sessionId);

      if (!session && !memSession) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      // Verify ownership for DB session if found (IDOR protection)
      if (session) {
        const sessionOwnerId = session.userId ? String(session.userId) : null;
        if (!sessionOwnerId || sessionOwnerId !== currentUserId) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this interview session' });
        }
      }

      // Verify ownership for in-memory session if found (IDOR protection)
      if (memSession) {
        const memOwnerId = memSession.userId ? String(memSession.userId) : null;
        if (!memOwnerId || memOwnerId !== currentUserId) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this interview session' });
        }
      }

      // Check if session is already completed or terminated - reject violations against inactive sessions (Rule 8)
      const isCompleted =
        (session && (String(session.status).toLowerCase() === 'completed' || (session.verdict && !['Pending', 'TERMINATED'].includes(session.verdict)))) ||
        (memSession && (String(memSession.status).toLowerCase() === 'completed' || (memSession.verdict && !['Pending', 'TERMINATED'].includes(memSession.verdict))));

      const isTerminated =
        (session && (String(session.status).toUpperCase() === 'TERMINATED' || String(session.verdict).toUpperCase() === 'TERMINATED')) ||
        (memSession && (String(memSession.status).toUpperCase() === 'TERMINATED' || String(memSession.verdict).toUpperCase() === 'TERMINATED'));

      if (isCompleted || isTerminated) {
        const currentCount = countActualProctoringViolations(session?.violations || memSession?.violations || []);
        return res.status(409).json({
          error: isTerminated
            ? 'Interview session is terminated and cannot receive violations'
            : 'Interview session is already completed and cannot receive violations',
          active: false,
          status: isTerminated ? 'TERMINATED' : 'completed',
          terminated: isTerminated,
          terminationReason: isTerminated ? (session?.terminationReason || memSession?.terminationReason || MULTIPLE_VIOLATIONS_TERMINATION_REASON) : undefined,
          remark: isTerminated ? (session?.remark || memSession?.remark || MULTIPLE_VIOLATIONS_TERMINATION_REMARK) : undefined,
          actualViolationsCount: currentCount,
          maxViolations: MAX_PROCTORING_VIOLATIONS,
        });
      }

    // Validate violation type
    const rawType = req.body?.type || req.body?.violationType;
    if (!rawType || typeof rawType !== 'string') {
      return res.status(400).json({ error: 'Violation type is required' });
    }

    const violationType =
      rawType.toUpperCase() === 'EYE_CONTACT' || rawType === 'eye_contact'
        ? EYE_CONTACT_VIOLATION_TYPE
        : String(rawType).trim();

    // Specific validation for EYE_CONTACT violations (Rule 2 & Rule 3 & Rule 9)
    if (violationType === EYE_CONTACT_VIOLATION_TYPE) {
      const score = req.body.eyeContactScore;
      if (typeof score === 'number' && score >= EYE_CONTACT_THRESHOLD) {
        return res.status(400).json({
          error: `Eye contact score (${score}%) is not below threshold (${EYE_CONTACT_THRESHOLD}%). Exactly 50% or higher is not a violation.`,
        });
      }

      const durationMs = req.body.durationMs;
      if (typeof durationMs === 'number' && durationMs < EYE_CONTACT_VIOLATION_DURATION_MS) {
        return res.status(400).json({
          error: `Eye contact violation requires at least ${EYE_CONTACT_VIOLATION_DURATION_MS}ms continuous duration.`,
        });
      }
    }

    // Deduplication check: ignore duplicate violation IDs or exact timestamp matches
    const existingViolations: any[] = [
      ...(session?.violations || []),
      ...(memSession?.violations || []),
    ];

    const targetId = req.body.id ? String(req.body.id).trim() : null;
    const isDuplicate = existingViolations.some((v: any) => {
      if (targetId && v.id === targetId) return true;
      if (req.body.timestamp && v.timestamp === req.body.timestamp && v.type === violationType) return true;
      return false;
    });

    if (isDuplicate) {
      const currentStatus = session?.status || memSession?.status || 'active';
      const currentCount = countActualProctoringViolations(existingViolations);
      const isAlreadyTerminated = currentStatus === 'TERMINATED';
      return res.status(200).json({
        success: true,
        deduplicated: true,
        message: 'Duplicate violation ignored within debounce window',
        violationType,
        sessionStatus: currentStatus,
        status: currentStatus,
        actualViolationsCount: currentCount,
        maxViolations: MAX_PROCTORING_VIOLATIONS,
        terminated: isAlreadyTerminated,
        ...(isAlreadyTerminated
          ? {
              terminationReason: session?.terminationReason || memSession?.terminationReason || MULTIPLE_VIOLATIONS_TERMINATION_REASON,
              remark: session?.remark || memSession?.remark || MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
            }
          : {}),
      });
    }

    const nowIso = new Date().toISOString();
    const violationEntry = {
      id: targetId || `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: violationType,
      timestamp: req.body.timestamp || nowIso,
      durationMs: typeof req.body.durationMs === 'number' ? Math.round(req.body.durationMs) : (violationType === EYE_CONTACT_VIOLATION_TYPE ? 3000 : undefined),
      details: req.body.details || (violationType === EYE_CONTACT_VIOLATION_TYPE ? EYE_CONTACT_VIOLATION_MESSAGE : 'Proctoring violation detected'),
      eyeContactScore: typeof req.body.eyeContactScore === 'number' ? Math.round(req.body.eyeContactScore) : undefined,
    };

    let updatedDbSession: any = null;

    // Update DB session if available - atomic conditional push only if not already TERMINATED or completed
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
      try {
        updatedDbSession = await MockInterviewSession.findOneAndUpdate(
          {
            _id: sessionId,
            userId: req.user.userId,
            status: { $ne: 'TERMINATED' },
            verdict: { $nin: ['TERMINATED', 'STRONG HIRE', 'HIRE', 'BORDERLINE', 'NEEDS IMPROVEMENT'] },
          },
          {
            $push: { violations: violationEntry },
          },
          { returnDocument: 'after' }
        );
      } catch (dbErr) {
        console.warn('MongoDB violation update error:', dbErr);
      }

      if (!updatedDbSession) {
        const checkDoc = await MockInterviewSession.findById(sessionId);
        if (checkDoc) {
          if (checkDoc.status === 'TERMINATED' || checkDoc.verdict === 'TERMINATED') {
            return res.status(409).json({
              error: 'Interview session is terminated and cannot receive violations',
              active: false,
              status: 'TERMINATED',
              terminationReason: checkDoc.terminationReason,
            });
          }
          if (checkDoc.status === 'completed' || ['STRONG HIRE', 'HIRE', 'BORDERLINE', 'NEEDS IMPROVEMENT'].includes(checkDoc.verdict)) {
            return res.status(409).json({
              error: 'Interview session is already completed and cannot receive violations',
              active: false,
              status: 'completed',
            });
          }
        }
      }
    }

    // Update in-memory session if available
    if (memSession) {
      if (memSession.status === 'TERMINATED' || memSession.verdict === 'TERMINATED') {
        return res.status(409).json({
          error: 'Interview session is terminated and cannot receive violations',
          active: false,
          status: 'TERMINATED',
          terminationReason: memSession.terminationReason,
        });
      }
      if (memSession.status === 'completed' || ['STRONG HIRE', 'HIRE', 'BORDERLINE', 'NEEDS IMPROVEMENT'].includes(memSession.verdict)) {
        return res.status(409).json({
          error: 'Interview session is already completed and cannot receive violations',
          active: false,
          status: 'completed',
        });
      }
      memSession.violations = memSession.violations || [];
      memSession.violations.push(violationEntry);
    }

    const sessionDocForCount = updatedDbSession || memSession;
    const actualCount = countActualProctoringViolations(sessionDocForCount?.violations || [violationEntry]);

    let isTerminatedNow = false;
    if (actualCount >= MAX_PROCTORING_VIOLATIONS) {
      isTerminatedNow = true;

      // Atomically mark session as TERMINATED in MongoDB
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
        try {
          const termDoc = await MockInterviewSession.findOneAndUpdate(
            {
              _id: sessionId,
              userId: req.user.userId,
              status: { $ne: 'TERMINATED' },
            },
            {
              $set: {
                status: 'TERMINATED',
                verdict: 'TERMINATED',
                terminationReason: MULTIPLE_VIOLATIONS_TERMINATION_REASON,
                remark: MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
                reviewNote: MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
                flaggedForReview: true,
                proctoringScore: 0,
                feedback: MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
              },
            },
            { returnDocument: 'after' }
          );
          if (termDoc) {
            updatedDbSession = termDoc;
          } else {
            updatedDbSession = await MockInterviewSession.findById(sessionId);
          }
        } catch (termErr) {
          console.warn('MongoDB violation termination error:', termErr);
        }
      }

      if (memSession) {
        memSession.status = 'TERMINATED';
        memSession.verdict = 'TERMINATED';
        memSession.terminationReason = MULTIPLE_VIOLATIONS_TERMINATION_REASON;
        memSession.remark = MULTIPLE_VIOLATIONS_TERMINATION_REMARK;
        memSession.reviewNote = MULTIPLE_VIOLATIONS_TERMINATION_REMARK;
        memSession.flaggedForReview = true;
        memSession.proctoringScore = 0;
        memSession.feedback = MULTIPLE_VIOLATIONS_TERMINATION_REMARK;
      }
    }

    const finalSession = updatedDbSession || memSession;
    const finalActualCount = countActualProctoringViolations(finalSession?.violations);
    const finalIsTerminated =
      isTerminatedNow ||
      (finalSession && (finalSession.status === 'TERMINATED' || finalSession.verdict === 'TERMINATED')) ||
      finalActualCount >= MAX_PROCTORING_VIOLATIONS;

    const currentStatus = finalIsTerminated ? 'TERMINATED' : 'active';

    return res.status(200).json({
      success: true,
      violation: violationEntry,
      sessionStatus: currentStatus,
      status: currentStatus,
      terminated: finalIsTerminated,
      terminationReason: finalIsTerminated ? (finalSession?.terminationReason || MULTIPLE_VIOLATIONS_TERMINATION_REASON) : undefined,
      remark: finalIsTerminated ? (finalSession?.remark || MULTIPLE_VIOLATIONS_TERMINATION_REMARK) : undefined,
      actualViolationsCount: finalActualCount,
      maxViolations: MAX_PROCTORING_VIOLATIONS,
      session: finalSession,
    });
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to record proctoring violation');
  }
});

// GET /api/interviews/:sessionId — retrieves specific session details with ownership check
interviewsRouter.get('/:sessionId', authMiddleware, async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { sessionId } = req.params;
    if (sessionId === 'sessions') {
      return next();
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!sessionId || (!mongoose.Types.ObjectId.isValid(sessionId) && !inMemorySessions.has(sessionId))) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    let session: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
      session = await MockInterviewSession.findById(sessionId);
    }
    const memSession = inMemorySessions.get(sessionId);
    const targetSession = session || memSession;

    if (!targetSession) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    const ownerId = targetSession.userId ? String(targetSession.userId) : null;
    if (ownerId && ownerId !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this session' });
    }

    const actualViolationsCount = countActualProctoringViolations(targetSession.violations || []);

    return res.json({
      session: targetSession,
      actualViolationsCount,
      maxViolations: MAX_PROCTORING_VIOLATIONS,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch interview session');
  }
});

// POST /api/interviews/:sessionId/complete — computes average scores, verdict, saves report
interviewsRouter.post('/:sessionId/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    const {
      violations = [],
      questionLogs,
      realtimePostureScore,
      realtimeEyeContactScore,
      postureScore,
      eyeContactScore,
    } = req.body || {};

    let logs: any[] = [];
    let companyName = 'Target Company';
    let roleName = 'Software Engineer';
    let dbSession: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(sessionId)) {
          dbSession = await MockInterviewSession.findById(sessionId);
          if (dbSession) {
            // Ownership authorization check
            if (userId && dbSession.userId && String(dbSession.userId) !== String(userId)) {
              return res.status(403).json({ error: 'Forbidden: You do not have permission to complete this interview session' });
            }
            logs = dbSession.questionLogs || [];
            companyName = dbSession.company || companyName;
            roleName = dbSession.role || roleName;
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB find session error:', dbErr);
      }
    }

    if (logs.length === 0) {
      const memSession = inMemorySessions.get(sessionId);
      if (memSession) {
        if (userId && memSession.userId && String(memSession.userId) !== String(userId)) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to complete this interview session' });
        }
        logs = memSession.questionLogs || [];
        companyName = memSession.company || companyName;
        roleName = memSession.role || roleName;
      }
    }

    // Guard against completing an already terminated session
    const isTerminated =
      (dbSession && (dbSession.status === 'TERMINATED' || dbSession.verdict === 'TERMINATED')) ||
      (inMemorySessions.get(sessionId)?.status === 'TERMINATED' || inMemorySessions.get(sessionId)?.verdict === 'TERMINATED');

    if (isTerminated) {
      return res.status(403).json({
        error: 'Cannot complete an interview that has been terminated for violations.',
        terminated: true,
        reason: dbSession?.terminationReason || inMemorySessions.get(sessionId)?.terminationReason || 'TAB_SWITCH',
      });
    }

    // Fallback to req.body.questionLogs if DB and in-memory lookups were empty
    if (logs.length === 0 && Array.isArray(questionLogs) && questionLogs.length > 0) {
      logs = questionLogs;
      if (dbSession) {
        dbSession.questionLogs = questionLogs;
      }
      const memSession = inMemorySessions.get(sessionId);
      if (memSession) {
        memSession.questionLogs = questionLogs;
      }
    }

    // Also ensure that if dbSession exists but its questionLogs is empty while logs has items, we sync back
    if (dbSession && (!dbSession.questionLogs || dbSession.questionLogs.length === 0) && logs.length > 0) {
      dbSession.questionLogs = logs;
    }

    // Only return 400 if all three sources (DB, in-memory, and request body) are empty
    if (logs.length === 0) {
      return res.status(400).json({ error: 'No question logs found for this session — cannot generate a report.' });
    }

    const existingDbViolations: any[] = dbSession?.violations || inMemorySessions.get(sessionId)?.violations || [];
    const mergedViolationsMap = new Map<string, any>();
    for (const v of existingDbViolations) {
      const key = v.id || `${v.type}_${v.timestamp}`;
      mergedViolationsMap.set(key, v);
    }
    for (const v of violations) {
      const key = v.id || `${v.type}_${v.timestamp}`;
      if (!mergedViolationsMap.has(key)) {
        mergedViolationsMap.set(key, v);
      }
    }
    const sessionViolations = Array.from(mergedViolationsMap.values());

    // Compute proctoring score (100 minus penalties)
    let proctoringPenalty = 0;
    for (const v of sessionViolations) {
      if (v.type === 'face_lost') proctoringPenalty += 5;
      else if (v.type === 'multiple_faces') proctoringPenalty += 15;
      else if (v.type === 'looking_away') proctoringPenalty += 3;
      else if (v.type === EYE_CONTACT_VIOLATION_TYPE || v.type === 'eye_contact') proctoringPenalty += 5;
    }
    const proctoringScore = Math.max(0, 100 - proctoringPenalty);

    // Session-wide posture and eye contact averages
    const logsPostureAvg = Math.round(
      logs.reduce((acc, curr) => acc + (typeof curr.postureScore === 'number' ? curr.postureScore : 85), 0) / logs.length
    );
    const logsEyeContactAvg = Math.round(
      logs.reduce((acc, curr) => acc + (typeof curr.eyeContactScore === 'number' ? curr.eyeContactScore : 85), 0) / logs.length
    );

    const avgPosture =
      typeof realtimePostureScore === 'number'
        ? Math.round(realtimePostureScore)
        : typeof postureScore === 'number'
        ? Math.round(postureScore)
        : logsPostureAvg;

    const avgEyeContact =
      typeof realtimeEyeContactScore === 'number'
        ? Math.round(realtimeEyeContactScore)
        : typeof eyeContactScore === 'number'
        ? Math.round(eyeContactScore)
        : logsEyeContactAvg;

    const avgConfidence = Math.round(
      logs.reduce((acc, curr) => acc + (typeof curr.confidenceScore === 'number' ? curr.confidenceScore : 85), 0) / logs.length
    );
    const avgComm = Math.round(
      logs.reduce((acc, curr) => acc + (typeof curr.commScore === 'number' ? curr.commScore : 85), 0) / logs.length
    );
    const avgTech = Math.round(
      logs.reduce((acc, curr) => acc + (typeof curr.techScore === 'number' ? curr.techScore : 85), 0) / logs.length
    );

    const overallScore = Math.round(
      avgPosture * 0.15 +
        avgEyeContact * 0.15 +
        avgConfidence * 0.2 +
        avgComm * 0.2 +
        avgTech * 0.2 +
        proctoringScore * 0.1
    );

    let verdict: 'STRONG HIRE' | 'HIRE' | 'BORDERLINE' | 'NEEDS IMPROVEMENT' = 'STRONG HIRE';
    if (overallScore < 70) verdict = 'NEEDS IMPROVEMENT';
    else if (overallScore < 80) verdict = 'BORDERLINE';
    else if (overallScore < 88) verdict = 'HIRE';

    let flaggedForReview = false;
    let reviewNote = '';

    if (proctoringScore < 40) {
      verdict = 'NEEDS IMPROVEMENT';
      flaggedForReview = true;
      reviewNote = 'This session had significant proctoring violations and should be manually reviewed.';
    } else if (proctoringScore < 70) {
      if (verdict === 'STRONG HIRE' || verdict === 'HIRE') {
        verdict = 'BORDERLINE';
      }
    }

    // Generate dynamic strengths & improvements via Gemini based on actual session metrics & logs
    const { strengths, improvements } = await generateReportFeedbackWithGemini({
      companyName,
      roleName,
      avgPosture,
      avgEyeContact,
      avgConfidence,
      avgComm,
      avgTech,
      proctoringScore,
      violations: sessionViolations,
      questionLogs: logs,
    });

    const finalReport = {
      overallScore,
      proctoringScore,
      flaggedForReview,
      reviewNote: reviewNote || undefined,
      postureScore: avgPosture,
      eyeContactScore: avgEyeContact,
      confidenceScore: avgConfidence,
      commScore: avgComm,
      techScore: avgTech,
      verdict,
      companyFitName: companyName,
      jobRoleName: roleName,
      violations: sessionViolations,
      strengths,
      improvements,
      questionLogs: logs,
    };

    if (dbSession) {
      dbSession.score = overallScore;
      dbSession.overallScore = overallScore;
      dbSession.postureScore = avgPosture;
      dbSession.eyeContactScore = avgEyeContact;
      dbSession.confidenceScore = avgConfidence;
      dbSession.commScore = avgComm;
      dbSession.techScore = avgTech;
      dbSession.proctoringScore = proctoringScore;
      dbSession.flaggedForReview = flaggedForReview;
      dbSession.reviewNote = reviewNote;
      dbSession.verdict = verdict;
      dbSession.status = 'completed';
      if (sessionViolations.length > 0) {
        dbSession.violations = sessionViolations;
      }
      dbSession.feedback = `Overall AI Interview Score: ${overallScore}/100 (${verdict})`;
      await dbSession.save();
    }

    const currentMemSession = inMemorySessions.get(sessionId);
    if (currentMemSession) {
      currentMemSession.status = 'completed';
      currentMemSession.verdict = verdict;
      currentMemSession.score = overallScore;
      currentMemSession.overallScore = overallScore;
      currentMemSession.feedback = `Overall AI Interview Score: ${overallScore}/100 (${verdict})`;
    }

    // Award milestones
    const recipientUserId = userId || dbSession?.userId;
    if (recipientUserId) {
      // Milestone 1: First completed interview
      await awardBadgeForUser(recipientUserId, {
        title: 'First Step',
        description: 'Completed your first AI Mock Interview simulation.',
        icon: '🎯',
      });

      // Milestone 2: Score >= 85
      if (overallScore >= 85) {
        await awardBadgeForUser(recipientUserId, {
          title: 'Interview Master',
          description: 'Achieved an overall interview score of 85% or higher.',
          icon: '🏆',
        });
      }

      // Milestone 3: 5 interviews completed
      let totalCompleted = 1;
      if (mongoose.connection.readyState === 1) {
        try {
          totalCompleted = await MockInterviewSession.countDocuments({ userId: recipientUserId, verdict: { $ne: 'Pending' } });
        } catch (cntErr) {
          console.warn('Count interview error:', cntErr);
        }
      }
      if (totalCompleted >= 5) {
        await awardBadgeForUser(recipientUserId, {
          title: 'AI Voice Mock Pro',
          description: 'Completed 5 full AI Voice Interview simulations.',
          icon: '🎙️',
        });
      }
    }

    return res.json(finalReport);
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to complete interview');
  }
});

// GET /api/interviews/sessions
interviewsRouter.get('/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: Only students can access interview sessions' });
  }

  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const studentObjId = mongoose.Types.ObjectId.isValid(req.user.userId)
          ? new mongoose.Types.ObjectId(req.user.userId)
          : req.user.userId;

        const sessions = await MockInterviewSession.find({
          $or: [{ userId: req.user.userId }, { userId: studentObjId }],
        })
          .sort({ createdAt: -1 })
          .limit(10);

        return res.json({
          sessions: sessions.map((s) => ({
            id: s._id,
            company: s.company,
            category: s.category,
            role: s.role,
            date: s.date,
            score: s.score,
            verdict: s.verdict,
            status: s.status,
            terminationReason: s.terminationReason,
            remark: s.remark,
            reviewNote: s.reviewNote,
            flaggedForReview: s.flaggedForReview,
            violations: s.violations,
            feedback: s.feedback,
            questionLogs: s.questionLogs,
          })),
        });
      } catch (dbErr) {
        console.warn('MongoDB sessions query error:', dbErr);
      }
    }

    // In-memory fallback if database is unavailable: check sessions belonging to authenticated student
    const userInMemorySessions = Array.from(inMemorySessions.values()).filter(
      (s) => s.userId === req.user?.userId
    );

    if (userInMemorySessions.length > 0) {
      return res.json({
        sessions: userInMemorySessions.map((s) => ({
          id: s.id || s._id,
          company: s.company,
          category: s.category,
          role: s.role,
          date: s.date,
          score: s.score,
          verdict: s.verdict,
          status: s.status,
          terminationReason: s.terminationReason,
          remark: s.remark,
          reviewNote: s.reviewNote,
          flaggedForReview: s.flaggedForReview,
          violations: s.violations,
          feedback: s.feedback,
          questionLogs: s.questionLogs,
        })),
      });
    }

    // Static fallback data for development/demo mode when database is not connected
    return res.json({
      sessions: [
        {
          id: 'int_101',
          company: 'Google',
          category: 'System Design & High Concurrency',
          role: 'Software Engineer',
          date: '2026-07-25',
          score: 88,
          verdict: 'Strong Hire',
          feedback: 'Excellent breakdown of distributed caching and DB sharding strategies.',
          questionLogs: [
            {
              questionText: 'How do you handle cache invalidation in distributed microservices?',
              category: 'System Design',
              userAnswer: 'Used Redis Pub/Sub with CDC from PostgreSQL write ahead log.',
              feedback: 'Great approach leveraging CDC to avoid race conditions.',
              score: 90,
              confidenceScore: 88,
            },
          ],
        },
        {
          id: 'int_102',
          company: 'Amazon',
          category: 'Data Structures & Algorithms',
          role: 'SDE 2',
          date: '2026-07-20',
          score: 92,
          verdict: 'Strong Hire',
          feedback: 'Optimal O(N log N) solution provided for tree serialization with clean code.',
          questionLogs: [
            {
              questionText: 'Serialize and Deserialize Binary Tree with O(N) space complexity.',
              category: 'Algorithms',
              userAnswer: 'Pre-order traversal with delimiter string output.',
              feedback: 'Clean recursive implementation.',
              score: 95,
              confidenceScore: 92,
            },
          ],
        },
      ],
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching interview sessions');
  }
});

// POST /api/interviews/schedule
interviewsRouter.post('/schedule', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: Only students can schedule mock interview sessions' });
  }

  try {
    const { company, role, date, category, questionLogs } = req.body;
    const authoritativeUserId = req.user.userId;

    if (mongoose.connection.readyState === 1) {
      const newSession = await MockInterviewSession.create({
        userId: authoritativeUserId,
        company: company || 'Google',
        role: role || 'Software Engineer',
        category: category || 'General Coding & System Design',
        date: date || new Date().toISOString().split('T')[0],
        score: 85,
        verdict: 'Hire',
        questionLogs: questionLogs || [],
      });

      return res.status(201).json({
        message: 'Interview session scheduled and created in database',
        session: {
          id: newSession._id,
          company: newSession.company,
          role: newSession.role,
          category: newSession.category,
          date: newSession.date,
          status: 'Scheduled',
          questionLogs: newSession.questionLogs,
        },
      });
    }

    const fallbackId = `int_${Date.now()}`;
    inMemorySessions.set(fallbackId, {
      id: fallbackId,
      userId: authoritativeUserId,
      company: company || 'Google',
      role: role || 'Software Engineer',
      category: category || 'General Coding & System Design',
      date: date || new Date().toISOString(),
      status: 'Scheduled',
      score: 85,
      verdict: 'Hire',
      questionLogs: questionLogs || [],
    });

    return res.status(201).json({
      message: 'Interview session scheduled successfully',
      session: {
        id: fallbackId,
        company: company || 'Google',
        role: role || 'Software Engineer',
        date: date || new Date().toISOString(),
        type: 'AI Mock Interview',
        status: 'Scheduled',
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error scheduling interview session');
  }
});
