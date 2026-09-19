import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { GoogleGenAI, Type } from '@google/genai';
import { AptitudeQuestion } from '../src/models/AptitudeQuestion';
import { AptitudeTestSession } from '../src/models/AptitudeTestSession';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';

export const aptitudeRouter = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Cache for generated numeric variations: keyed by question ID/template, TTL = 5 minutes
export interface CachedVariation {
  variedQuestionText: string;
  variedOptions: string[];
  variedCorrectAnswerIndex: number;
  workingSteps: string;
  cachedAt: number;
}

const variationCache = new Map<string, CachedVariation>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory session cache for resilience across all MongoDB states
const mockSessionsMemory = new Map<string, any>();

// JSON schema for strict Gemini structured variation generation
const variationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    variedQuestionText: {
      type: Type.STRING,
      description: 'The varied question text with new numeric values but identical conceptual structure and question intent',
    },
    variedOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Array of exactly 4 distinct multiple-choice options corresponding to the varied question',
    },
    variedCorrectAnswerIndex: {
      type: Type.INTEGER,
      description: 'The 0-based index (0, 1, 2, or 3) of the correct answer in variedOptions',
    },
    workingSteps: {
      type: Type.STRING,
      description: 'Independent step-by-step mathematical and logical derivation verifying the correct answer',
    },
  },
  required: ['variedQuestionText', 'variedOptions', 'variedCorrectAnswerIndex', 'workingSteps'],
};

// Resilient Gemini variation generator with model failover
async function callGeminiVariationResilient(promptText: string) {
  const models = ['gemini-2.5-flash', 'gemini-3.7-flash'];
  let lastErr: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: variationResponseSchema,
          temperature: 0.4,
        },
      });
      return response;
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Aptitude Gemini Variation Attempt on ${model} Failed]:`, err?.message || err);
    }
  }
  throw lastErr;
}

/**
 * Generate or fetch a cached numeric variation for a variable aptitude question.
 * If Gemini fails or produces malformed output, falls back to the original verified question.
 */
async function getOrGenerateVariation(q: any): Promise<{
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}> {
  const questionKey = String(q._id || q.questionTemplate || 'question');

  // Check 5-minute in-memory cache first
  const cached = variationCache.get(questionKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      questionText: cached.variedQuestionText,
      options: cached.variedOptions,
      correctAnswerIndex: cached.variedCorrectAnswerIndex,
      explanation: cached.workingSteps,
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn(`[Aptitude Gemini Variation Fallback]: No GEMINI_API_KEY set for ${questionKey}. Serving verified ground truth.`);
    return {
      questionText: q.questionTemplate,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    };
  }

  try {
    const promptText = `You are an expert quantitative and technical aptitude question generator.
We have a verified ground-truth aptitude question:
- Question Template: "${q.questionTemplate}"
- Original Options: ${JSON.stringify(q.options)}
- Original Correct Answer Index: ${q.correctAnswerIndex} (Option: "${q.options?.[q.correctAnswerIndex]}")
- Original Explanation / Working: "${q.explanation}"
- Category: ${q.category} / Subtopic: ${q.subtopic} / Difficulty: ${q.difficulty}

TASK:
Generate ONE new variant of this question by changing ONLY the numeric values (not the underlying concept, story, or mathematical structure).
Select realistic, clean numbers that yield clean calculations (avoiding awkward recurring decimals where practical).

CRITICAL SAFETY & ARITHMETIC INSTRUCTIONS:
1. Solve the varied problem yourself step by step before finalizing the answer. Double-check your arithmetic is correct before responding.
2. Formulate 4 realistic multiple-choice options (with 1 unambiguously correct option and 3 plausible distractors in identical unit formatting).
3. Ensure variedCorrectAnswerIndex strictly matches the exact 0-based index (0, 1, 2, or 3) of the correct option in variedOptions.
4. Provide the exact step-by-step working steps demonstrating the calculation clearly.`;

    const response = await callGeminiVariationResilient(promptText);
    const parsed = JSON.parse(response.text || '{}');

    // Strict validation of Gemini response
    const hasText = typeof parsed.variedQuestionText === 'string' && parsed.variedQuestionText.trim().length > 0;
    const hasValidOptions =
      Array.isArray(parsed.variedOptions) &&
      parsed.variedOptions.length === 4 &&
      parsed.variedOptions.every((opt: any) => typeof opt === 'string' && opt.trim().length > 0);
    const hasValidIndex =
      typeof parsed.variedCorrectAnswerIndex === 'number' &&
      Number.isInteger(parsed.variedCorrectAnswerIndex) &&
      parsed.variedCorrectAnswerIndex >= 0 &&
      parsed.variedCorrectAnswerIndex <= 3;
    const hasWorking = typeof parsed.workingSteps === 'string' && parsed.workingSteps.trim().length > 0;

    if (!hasText || !hasValidOptions || !hasValidIndex || !hasWorking) {
      throw new Error(`Validation failed: text=${hasText}, optionsCount=${parsed?.variedOptions?.length}, index=${parsed?.variedCorrectAnswerIndex}, working=${hasWorking}`);
    }

    const variationResult: CachedVariation = {
      variedQuestionText: parsed.variedQuestionText.trim(),
      variedOptions: parsed.variedOptions.map((o: string) => o.trim()),
      variedCorrectAnswerIndex: parsed.variedCorrectAnswerIndex,
      workingSteps: parsed.workingSteps.trim(),
      cachedAt: Date.now(),
    };

    // Store in cache
    variationCache.set(questionKey, variationResult);

    return {
      questionText: variationResult.variedQuestionText,
      options: variationResult.variedOptions,
      correctAnswerIndex: variationResult.variedCorrectAnswerIndex,
      explanation: variationResult.workingSteps,
    };
  } catch (error: any) {
    console.warn(
      `[Aptitude Gemini Variation Fallback]: Failed to generate valid variation for question ${questionKey}, serving original ground truth. Reason:`,
      error?.message || error
    );
    return {
      questionText: q.questionTemplate,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    };
  }
}

// Fallback in-memory loader from curated JSON
let cachedJsonQuestions: any[] | null = null;
function getFallbackQuestions(): any[] {
  if (!cachedJsonQuestions) {
    try {
      const jsonPath = path.join(process.cwd(), 'data', 'aptitudeQuestions.json');
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        cachedJsonQuestions = JSON.parse(raw).map((q: any, idx: number) => ({
          _id: `fallback_${idx + 1}`,
          ...q,
        }));
      } else {
        cachedJsonQuestions = [];
      }
    } catch (err) {
      console.warn('[Aptitude] Error loading fallback JSON questions:', err);
      cachedJsonQuestions = [];
    }
  }
  return cachedJsonQuestions || [];
}

/**
 * Reusable helper to retrieve and optionally vary questions by category
 */
async function getResolvedQuestionsForCategory(categoryParam: string | null, count: number): Promise<any[]> {
  let rawQuestions: any[] = [];

  if (mongoose.connection.readyState === 1) {
    try {
      const matchStage: Record<string, any> = {};
      if (categoryParam && ['Quantitative', 'Logical', 'Verbal'].includes(categoryParam)) {
        matchStage.category = categoryParam;
      }

      const pipeline: any[] = [];
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }
      pipeline.push({ $sample: { size: count } });

      rawQuestions = await AptitudeQuestion.aggregate(pipeline);

      if (!rawQuestions || rawQuestions.length < count) {
        const fallback = getFallbackQuestions();
        let filtered = fallback;
        if (categoryParam) {
          filtered = fallback.filter((q) => q.category.toLowerCase() === categoryParam.toLowerCase());
        }
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        
        // Merge without duplicate IDs/templates
        const existingKeys = new Set(rawQuestions.map((q) => String(q._id || q.questionTemplate)));
        for (const item of shuffled) {
          if (rawQuestions.length >= count) break;
          const key = String(item._id || item.questionTemplate);
          if (!existingKeys.has(key)) {
            existingKeys.add(key);
            rawQuestions.push(item);
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Aptitude] DB query error, using JSON fallback:', dbErr);
      const fallback = getFallbackQuestions();
      let filtered = fallback;
      if (categoryParam) {
        filtered = fallback.filter((q) => q.category.toLowerCase() === categoryParam.toLowerCase());
      }
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      rawQuestions = shuffled.slice(0, count);
    }
  } else {
    const fallback = getFallbackQuestions();
    let filtered = fallback;
    if (categoryParam) {
      filtered = fallback.filter((q) => q.category.toLowerCase() === categoryParam.toLowerCase());
    }
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    rawQuestions = shuffled.slice(0, count);
  }

  // Process variations
  const resolved = await Promise.all(
    rawQuestions.map(async (q) => {
      if (q.isVariable) {
        const varied = await getOrGenerateVariation(q);
        return {
          _id: q._id ? String(q._id) : undefined,
          category: q.category,
          subtopic: q.subtopic,
          difficulty: q.difficulty,
          questionTemplate: varied.questionText,
          questionText: varied.questionText,
          options: varied.options,
          correctAnswerIndex: varied.correctAnswerIndex,
          explanation: varied.explanation,
          isVariable: true,
        };
      }

      return {
        _id: q._id ? String(q._id) : undefined,
        category: q.category,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        questionTemplate: q.questionTemplate,
        questionText: q.questionTemplate,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        isVariable: false,
      };
    })
  );

  return resolved;
}

/**
 * Reusable answer lookup helper: checks variation cache -> MongoDB -> static fallback.
 */
async function lookupAnswerVerification(questionId: string, selectedAnswerIndex: number): Promise<{
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation: string;
} | null> {
  const questionKey = String(questionId);

  // 1. Check in-memory variation cache first if this was a varied question
  const cachedVar = variationCache.get(questionKey);
  if (cachedVar) {
    return {
      isCorrect: selectedAnswerIndex === cachedVar.variedCorrectAnswerIndex,
      correctAnswerIndex: cachedVar.variedCorrectAnswerIndex,
      explanation: cachedVar.workingSteps,
    };
  }

  // 2. Query MongoDB if connected
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(questionKey)) {
    try {
      const dbQuestion = await AptitudeQuestion.findById(questionKey);
      if (dbQuestion) {
        return {
          isCorrect: selectedAnswerIndex === dbQuestion.correctAnswerIndex,
          correctAnswerIndex: dbQuestion.correctAnswerIndex,
          explanation: dbQuestion.explanation,
        };
      }
    } catch (err) {
      console.warn('[Aptitude] MongoDB findById error in answer verification:', err);
    }
  }

  // 3. Fallback search in static JSON
  const fallbackList = getFallbackQuestions();
  const foundFallback = fallbackList.find(
    (q, idx) =>
      String(q._id) === questionKey ||
      String(idx + 1) === questionKey ||
      `fallback_${idx + 1}` === questionKey ||
      q.questionTemplate === questionKey
  );

  if (foundFallback) {
    return {
      isCorrect: selectedAnswerIndex === foundFallback.correctAnswerIndex,
      correctAnswerIndex: foundFallback.correctAnswerIndex,
      explanation: foundFallback.explanation,
    };
  }

  return null;
}

/**
 * GET /api/aptitude/questions
 * Protected endpoint returning a randomized selection of aptitude questions.
 * Strips correctAnswerIndex and explanation for integrity.
 */
aptitudeRouter.get('/questions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const categoryParam = req.query.category ? String(req.query.category).trim() : null;
    const requestedCount = parseInt(String(req.query.count || '20'), 10);
    const count = isNaN(requestedCount) || requestedCount <= 0 ? 20 : Math.min(requestedCount, 100);

    const resolvedQuestions = await getResolvedQuestionsForCategory(categoryParam, count);

    // Sanitize before client response
    const sanitized = resolvedQuestions.map((q) => ({
      _id: q._id,
      category: q.category,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      questionTemplate: q.questionTemplate,
      questionText: q.questionText,
      options: q.options,
      isVariable: q.isVariable,
    }));

    return res.status(200).json({
      success: true,
      count: sanitized.length,
      questions: sanitized,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch aptitude questions');
  }
});

/**
 * POST /api/aptitude/practice/check
 * Verifies a submitted answer server-side for Practice Mode.
 * Body: { questionId: string, selectedAnswerIndex: number }
 * Returns: { isCorrect: boolean, correctAnswerIndex: number, explanation: string }
 */
aptitudeRouter.post('/practice/check', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { questionId, selectedAnswerIndex } = req.body;

    if (!questionId || typeof selectedAnswerIndex !== 'number') {
      return res.status(400).json({ error: 'questionId and selectedAnswerIndex (number) are required' });
    }

    const verified = await lookupAnswerVerification(String(questionId), selectedAnswerIndex);

    if (verified) {
      return res.status(200).json({
        success: true,
        isCorrect: verified.isCorrect,
        correctAnswerIndex: verified.correctAnswerIndex,
        explanation: verified.explanation,
      });
    }

    return res.status(404).json({ error: 'Question not found' });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to verify answer');
  }
});

/**
 * POST /api/aptitude/mock/start
 * Initializes a new timed 30-question Aptitude Mock Test Session.
 * Proportional split: 12 Quantitative, 9 Logical, 9 Verbal.
 * Time limit: 1800 seconds (30 minutes).
 */
aptitudeRouter.post('/mock/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'guest_user';

    // 1. Fetch proportional split
    const [quantQuestions, logicalQuestions, verbalQuestions] = await Promise.all([
      getResolvedQuestionsForCategory('Quantitative', 12),
      getResolvedQuestionsForCategory('Logical', 9),
      getResolvedQuestionsForCategory('Verbal', 9),
    ]);

    const combinedQuestions = [...quantQuestions, ...logicalQuestions, ...verbalQuestions];

    // Ensure we have exactly 30 questions (or as many as available)
    const sessionQuestions = combinedQuestions.map((q, idx) => ({
      questionId: q._id ? String(q._id) : `mock_q_${idx + 1}`,
      category: q.category as 'Quantitative' | 'Logical' | 'Verbal',
      subtopic: q.subtopic,
      difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
      questionText: q.questionText || q.questionTemplate,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      selectedAnswerIndex: null,
      isCorrect: false,
      timeSpentSeconds: 0,
      explanation: q.explanation || '',
    }));

    const timeLimitSeconds = 1800; // 30 minutes
    const sessionId = new mongoose.Types.ObjectId().toString();

    const sessionData = {
      _id: sessionId,
      userId,
      mode: 'mock' as const,
      category: null,
      startedAt: new Date(),
      completedAt: null,
      timeLimitSeconds,
      questions: sessionQuestions,
      categoryScores: {
        Quantitative: 0,
        Logical: 0,
        Verbal: 0,
      },
      overallScore: 0,
    };

    // Save to MongoDB if available
    if (mongoose.connection.readyState === 1) {
      try {
        await AptitudeTestSession.create(sessionData as any);
      } catch (dbErr) {
        console.warn('[Aptitude Mock Start] DB session save warning, persisting in memory cache:', dbErr);
      }
    }
    mockSessionsMemory.set(sessionId, sessionData);

    // Sanitize questions for client
    const sanitizedQuestions = sessionQuestions.map((q) => ({
      _id: String(q.questionId),
      category: q.category,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options,
    }));

    return res.status(200).json({
      success: true,
      sessionId,
      timeLimitSeconds,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to initialize mock test session');
  }
});

/**
 * POST /api/aptitude/mock/:sessionId/submit
 * Submits answers for a mock test session and computes detailed category & overall diagnostics.
 * Rejects submissions if unauthorized or already completed.
 */
aptitudeRouter.post('/mock/:sessionId/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId || 'guest_user';
    const submittedAnswers: Array<{ questionId: string; selectedAnswerIndex: number; timeSpentSeconds?: number }> =
      req.body.answers || [];

    // 1. Fetch Session from MongoDB or Memory
    let session: any = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
      try {
        session = await AptitudeTestSession.findById(sessionId);
      } catch (dbErr) {
        console.warn('[Aptitude Mock Submit] DB lookup error:', dbErr);
      }
    }

    if (!session) {
      session = mockSessionsMemory.get(sessionId);
    }

    if (!session) {
      return res.status(404).json({ error: 'Mock test session not found' });
    }

    // 2. Validate session ownership
    if (session.userId && String(session.userId) !== String(userId) && session.userId !== 'guest_user') {
      return res.status(403).json({ error: 'Unauthorized to submit this test session' });
    }

    // 3. Check if already completed (submit-once constraint)
    if (session.completedAt) {
      return res.status(400).json({ error: 'This mock test session has already been completed and submitted.' });
    }

    // 4. Score all questions
    const answerMap = new Map<string, { selectedAnswerIndex: number; timeSpentSeconds?: number }>();
    submittedAnswers.forEach((ans) => {
      if (ans && ans.questionId) {
        answerMap.set(String(ans.questionId), ans);
      }
    });

    const categoryStats: Record<string, { total: number; correct: number }> = {
      Quantitative: { total: 0, correct: 0 },
      Logical: { total: 0, correct: 0 },
      Verbal: { total: 0, correct: 0 },
    };

    let totalCorrect = 0;
    const scoredQuestions = [];

    for (let i = 0; i < session.questions.length; i++) {
      const q = session.questions[i];
      const qId = String(q.questionId || q._id);
      const studentSubmission = answerMap.get(qId);
      
      const selectedAnswerIndex =
        studentSubmission && typeof studentSubmission.selectedAnswerIndex === 'number'
          ? studentSubmission.selectedAnswerIndex
          : null;

      // Real correctAnswerIndex stored server-side on session or verified via lookup
      let correctAnswerIndex = q.correctAnswerIndex;
      let explanation = q.explanation;

      if (typeof correctAnswerIndex !== 'number' || correctAnswerIndex < 0) {
        const verified = await lookupAnswerVerification(qId, selectedAnswerIndex ?? -1);
        if (verified) {
          correctAnswerIndex = verified.correctAnswerIndex;
          explanation = verified.explanation;
        }
      }

      const isCorrect = selectedAnswerIndex !== null && selectedAnswerIndex === correctAnswerIndex;

      if (isCorrect) {
        totalCorrect += 1;
      }

      const cat = q.category || 'Quantitative';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, correct: 0 };
      }
      categoryStats[cat].total += 1;
      if (isCorrect) {
        categoryStats[cat].correct += 1;
      }

      // Update question record
      q.selectedAnswerIndex = selectedAnswerIndex;
      q.isCorrect = isCorrect;
      q.timeSpentSeconds = studentSubmission?.timeSpentSeconds || 0;
      if (explanation) q.explanation = explanation;

      scoredQuestions.push({
        questionId: qId,
        category: q.category,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options,
        selectedAnswerIndex,
        correctAnswerIndex,
        isCorrect,
        explanation: explanation || 'Refer to fundamental principles for this concept.',
        timeSpentSeconds: q.timeSpentSeconds,
      });
    }

    const totalQuestions = session.questions.length || 30;
    const overallScore = Math.round((totalCorrect / totalQuestions) * 100);

    const categoryScores = {
      Quantitative: Math.round(
        ((categoryStats.Quantitative?.correct || 0) / (categoryStats.Quantitative?.total || 1)) * 100
      ),
      Logical: Math.round(
        ((categoryStats.Logical?.correct || 0) / (categoryStats.Logical?.total || 1)) * 100
      ),
      Verbal: Math.round(
        ((categoryStats.Verbal?.correct || 0) / (categoryStats.Verbal?.total || 1)) * 100
      ),
    };

    const completedAt = new Date();
    const startedAt = new Date(session.startedAt || Date.now());
    const timeTakenSeconds = Math.min(
      session.timeLimitSeconds || 1800,
      Math.max(1, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000))
    );

    // 5. Update session in MongoDB and memory
    session.completedAt = completedAt;
    session.categoryScores = categoryScores;
    session.overallScore = overallScore;
    session.questions = session.questions;

    if (session.save && typeof session.save === 'function') {
      try {
        await session.save();
      } catch (saveErr) {
        console.warn('[Aptitude Mock Submit] DB session update warning:', saveErr);
      }
    }
    mockSessionsMemory.set(sessionId, session);

    return res.status(200).json({
      success: true,
      sessionId,
      overallScore,
      totalCorrect,
      totalQuestions,
      categoryScores,
      timeTakenSeconds,
      completedAt,
      perQuestionResults: scoredQuestions,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to submit mock test session');
  }
});

/**
 * GET /api/aptitude/mock/history
 * Returns lightweight list of all completed mock test sessions for the logged-in user.
 * Sorted newest first (completedAt: -1).
 */
aptitudeRouter.get('/mock/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'guest_user';
    let history: any[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const query: Record<string, any> = {
          mode: 'mock',
          completedAt: { $ne: null },
        };
        if (userId && userId !== 'guest_user') {
          query.userId = userId;
        }

        const dbSessions = await AptitudeTestSession.find(query)
          .sort({ completedAt: -1 })
          .select('_id userId completedAt startedAt overallScore categoryScores questions timeLimitSeconds');

        history = dbSessions.map((s) => {
          const startedAt = s.startedAt ? new Date(s.startedAt).getTime() : 0;
          const completedAt = s.completedAt ? new Date(s.completedAt).getTime() : 0;
          const timeTakenSeconds =
            startedAt && completedAt
              ? Math.max(1, Math.round((completedAt - startedAt) / 1000))
              : 0;

          return {
            sessionId: String(s._id),
            completedAt: s.completedAt,
            overallScore: s.overallScore ?? 0,
            categoryScores: s.categoryScores || { Quantitative: 0, Logical: 0, Verbal: 0 },
            totalQuestions: Array.isArray(s.questions) ? s.questions.length : 30,
            timeTakenSeconds,
          };
        });
      } catch (dbErr) {
        console.warn('[Aptitude Mock History] DB query error:', dbErr);
      }
    }

    // Merge in-memory fallback sessions if present
    if (mockSessionsMemory.size > 0) {
      const memorySessions = Array.from(mockSessionsMemory.values()).filter(
        (s) =>
          s.mode === 'mock' &&
          s.completedAt &&
          (userId === 'guest_user' || s.userId === userId || s.userId === 'guest_user')
      );
      const existingIds = new Set(history.map((h) => String(h.sessionId)));
      for (const s of memorySessions) {
        const sId = String(s._id || s.sessionId);
        if (!existingIds.has(sId)) {
          const startedAt = s.startedAt ? new Date(s.startedAt).getTime() : 0;
          const completedAt = s.completedAt ? new Date(s.completedAt).getTime() : 0;
          const timeTakenSeconds =
            startedAt && completedAt
              ? Math.max(1, Math.round((completedAt - startedAt) / 1000))
              : 0;

          history.push({
            sessionId: sId,
            completedAt: s.completedAt,
            overallScore: s.overallScore ?? 0,
            categoryScores: s.categoryScores || { Quantitative: 0, Logical: 0, Verbal: 0 },
            totalQuestions: Array.isArray(s.questions) ? s.questions.length : 30,
            timeTakenSeconds,
          });
        }
      }
      history.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    }

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to retrieve mock test history');
  }
});

/**
 * GET /api/aptitude/mock/:sessionId/report
 * Returns the full saved report for a past mock test session.
 */
aptitudeRouter.get('/mock/:sessionId/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId || 'guest_user';

    let session: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
      try {
        session = await AptitudeTestSession.findById(sessionId);
      } catch (dbErr) {
        console.warn('[Aptitude Mock Report] DB lookup error:', dbErr);
      }
    }

    if (!session) {
      session = mockSessionsMemory.get(sessionId);
    }

    if (!session) {
      return res.status(404).json({ error: 'Mock test session not found' });
    }

    // Ownership check (allow guest_user)
    if (
      session.userId &&
      String(session.userId) !== String(userId) &&
      session.userId !== 'guest_user' &&
      userId !== 'guest_user'
    ) {
      return res.status(403).json({ error: 'Unauthorized to view this test report' });
    }

    const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : 0;
    const completedAt = session.completedAt ? new Date(session.completedAt).getTime() : 0;
    const timeTakenSeconds =
      startedAt && completedAt
        ? Math.max(1, Math.round((completedAt - startedAt) / 1000))
        : 0;

    let totalCorrect = 0;
    const perQuestionResults = (session.questions || []).map((q: any, idx: number) => {
      if (q.isCorrect) totalCorrect++;
      return {
        questionId: q.questionId ? String(q.questionId) : `mock_q_${idx + 1}`,
        category: q.category,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options,
        selectedAnswerIndex: q.selectedAnswerIndex ?? null,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect: !!q.isCorrect,
        explanation: q.explanation || 'Refer to fundamental principles for this concept.',
        timeSpentSeconds: q.timeSpentSeconds || 0,
      };
    });

    return res.status(200).json({
      success: true,
      sessionId: String(session._id || session.sessionId),
      overallScore: session.overallScore ?? 0,
      totalCorrect,
      totalQuestions: perQuestionResults.length,
      categoryScores: session.categoryScores || { Quantitative: 0, Logical: 0, Verbal: 0 },
      timeTakenSeconds,
      completedAt: session.completedAt,
      perQuestionResults,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to retrieve test report');
  }
});



