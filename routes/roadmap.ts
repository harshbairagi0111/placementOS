import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Type } from '@google/genai';
import { Roadmap } from '../src/models/Roadmap';
import { User } from '../src/models/User';
import { Resume } from '../src/models/Resume';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { CodingProgress } from '../src/models/CodingProgress';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { awardBadgeForUser } from './badges';
import { sendSafeServerError } from './errorHandler';
import { callGeminiResilient } from './geminiClient';

export const roadmapRouter = Router();

// In-memory fallback roadmap cache
let inMemoryLatestRoadmap: any = null;

export interface StudentPerformanceData {
  resume?: {
    atsScore?: number;
    missingSkills?: string[];
    skillsFound?: string[];
    targetRole?: string;
  } | null;
  mockInterviews?: {
    totalSessions: number;
    avgPosture: number;
    avgConfidence: number;
    avgComm: number;
    avgTech: number;
    weakestArea?: string;
    weakestAreaScore?: number;
    strongestArea?: string;
    strongestAreaScore?: number;
    categoryAverages?: { category: string; avg: number; count: number }[];
  } | null;
  codingProgress?: {
    problemsSolved: number;
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    accuracyRate: number;
    languagesUsed?: number;
  } | null;
}

async function fetchStudentPerformanceData(userId: string | mongoose.Types.ObjectId): Promise<StudentPerformanceData | null> {
  if (mongoose.connection.readyState !== 1 || !userId) {
    return null;
  }

  let userObjId: any = userId;
  try {
    userObjId = new mongoose.Types.ObjectId(userId);
  } catch {
    userObjId = userId;
  }

  const userFilter = { $or: [{ userId: userObjId }, { userId: String(userId) }] };

  let resumeData: StudentPerformanceData['resume'] = null;
  let mockInterviewData: StudentPerformanceData['mockInterviews'] = null;
  let codingData: StudentPerformanceData['codingProgress'] = null;

  // 1. Fetch most recent Resume analysis
  try {
    const latestResume = await Resume.findOne(userFilter).sort({ createdAt: -1 });
    if (latestResume) {
      resumeData = {
        atsScore: typeof latestResume.atsScore === 'number' ? latestResume.atsScore : undefined,
        missingSkills: Array.isArray(latestResume.missingSkills) ? latestResume.missingSkills : [],
        skillsFound: Array.isArray(latestResume.skillsFound) ? latestResume.skillsFound : [],
        targetRole: latestResume.targetRole,
      };
    }
  } catch (err) {
    console.warn('[Roadmap] Error fetching resume data for personalization:', err);
  }

  // 2. Fetch Mock Interview Sessions
  try {
    const sessions = await MockInterviewSession.find({
      ...userFilter,
      verdict: { $ne: 'Pending' },
    });

    if (sessions && sessions.length > 0) {
      let totalPosture = 0;
      let totalConfidence = 0;
      let totalComm = 0;
      let totalTech = 0;
      let validSessionCount = 0;

      const categoryMap = new Map<string, { totalScore: number; count: number }>();

      sessions.forEach((s) => {
        const posture = typeof s.postureScore === 'number' ? s.postureScore : 85;
        const confidence = typeof s.confidenceScore === 'number' ? s.confidenceScore : 85;
        const comm = typeof s.commScore === 'number' ? s.commScore : 85;
        const tech = typeof s.techScore === 'number' ? s.techScore : (typeof s.score === 'number' ? s.score : 85);

        totalPosture += posture;
        totalConfidence += confidence;
        totalComm += comm;
        totalTech += tech;
        validSessionCount++;

        // Analyze questions for category scores
        if (Array.isArray(s.questionLogs) && s.questionLogs.length > 0) {
          s.questionLogs.forEach((q) => {
            const cat = (q.category || s.category || 'General Tech').trim();
            const qTech = typeof q.techScore === 'number' ? q.techScore : (typeof q.score === 'number' ? q.score : tech);
            const curr = categoryMap.get(cat) || { totalScore: 0, count: 0 };
            curr.totalScore += qTech;
            curr.count += 1;
            categoryMap.set(cat, curr);
          });
        } else if (s.category) {
          const cat = s.category.trim();
          const curr = categoryMap.get(cat) || { totalScore: 0, count: 0 };
          curr.totalScore += tech;
          curr.count += 1;
          categoryMap.set(cat, curr);
        }
      });

      const avgPosture = Math.round(totalPosture / validSessionCount);
      const avgConfidence = Math.round(totalConfidence / validSessionCount);
      const avgComm = Math.round(totalComm / validSessionCount);
      const avgTech = Math.round(totalTech / validSessionCount);

      const categoryAverages: { category: string; avg: number; count: number }[] = [];
      categoryMap.forEach((val, cat) => {
        if (val.count > 0) {
          categoryAverages.push({
            category: cat,
            avg: Math.round(val.totalScore / val.count),
            count: val.count,
          });
        }
      });

      let weakestArea: string | undefined;
      let weakestAreaScore: number | undefined;
      let strongestArea: string | undefined;
      let strongestAreaScore: number | undefined;

      if (categoryAverages.length > 0) {
        categoryAverages.sort((a, b) => a.avg - b.avg);
        weakestArea = categoryAverages[0].category;
        weakestAreaScore = categoryAverages[0].avg;
        strongestArea = categoryAverages[categoryAverages.length - 1].category;
        strongestAreaScore = categoryAverages[categoryAverages.length - 1].avg;
      }

      mockInterviewData = {
        totalSessions: validSessionCount,
        avgPosture,
        avgConfidence,
        avgComm,
        avgTech,
        weakestArea,
        weakestAreaScore,
        strongestArea,
        strongestAreaScore,
        categoryAverages,
      };
    }
  } catch (err) {
    console.warn('[Roadmap] Error fetching mock interview data for personalization:', err);
  }

  // 3. Fetch Coding Progress
  try {
    const codingDoc = await CodingProgress.findOne(userFilter);
    if (codingDoc) {
      codingData = {
        problemsSolved: codingDoc.problemsSolved || 0,
        easySolved: codingDoc.easySolved || 0,
        mediumSolved: codingDoc.mediumSolved || 0,
        hardSolved: codingDoc.hardSolved || 0,
        accuracyRate: codingDoc.accuracyRate || 0,
        languagesUsed: codingDoc.languagesUsed || 0,
      };
    }
  } catch (err) {
    console.warn('[Roadmap] Error fetching coding progress for personalization:', err);
  }

  return {
    resume: resumeData,
    mockInterviews: mockInterviewData,
    codingProgress: codingData,
  };
}

function buildPerformanceSummaryText(perf: StudentPerformanceData | null): string {
  if (!perf) return '';

  const summaryBullets: string[] = [];

  // Resume summary
  if (perf.resume) {
    const parts: string[] = [];
    if (typeof perf.resume.atsScore === 'number') {
      parts.push(`ATS score is ${perf.resume.atsScore}/100`);
    }
    if (perf.resume.missingSkills && perf.resume.missingSkills.length > 0) {
      parts.push(`missing keywords: ${perf.resume.missingSkills.slice(0, 10).join(', ')}`);
    }
    if (perf.resume.skillsFound && perf.resume.skillsFound.length > 0) {
      parts.push(`verified resume skills: ${perf.resume.skillsFound.slice(0, 10).join(', ')}`);
    }
    if (parts.length > 0) {
      summaryBullets.push(`Resume Analysis: Their resume ${parts.join(', ')}.`);
    }
  }

  // Mock Interview summary
  if (perf.mockInterviews && perf.mockInterviews.totalSessions > 0) {
    const mi = perf.mockInterviews;
    let miText = `Mock Interview Performance (${mi.totalSessions} completed session${mi.totalSessions > 1 ? 's' : ''}): Average scores across categories show Technical avg ${mi.avgTech}%, Communication avg ${mi.avgComm}%, Confidence avg ${mi.avgConfidence}%, and Posture avg ${mi.avgPosture}%.`;
    if (mi.weakestArea && mi.strongestArea && mi.weakestArea !== mi.strongestArea) {
      miText += ` This student's mock interview data shows their weakest area is ${mi.weakestArea} (avg ${mi.weakestAreaScore}%) and strongest is ${mi.strongestArea} (avg ${mi.strongestAreaScore}%).`;
    }
    summaryBullets.push(miText);
  }

  // Coding Progress summary
  if (perf.codingProgress && (perf.codingProgress.problemsSolved > 0 || perf.codingProgress.accuracyRate > 0)) {
    const cp = perf.codingProgress;
    summaryBullets.push(`Coding Practice Stats: ${cp.problemsSolved} questions solved (Easy: ${cp.easySolved || 0}, Medium: ${cp.mediumSolved || 0}, Hard: ${cp.hardSolved || 0}) with ${cp.accuracyRate}% submission accuracy.`);
  }

  if (summaryBullets.length === 0) {
    return '';
  }

  return `
STUDENT'S REAL PERFORMANCE & DIAGNOSTIC PROFILE:
${summaryBullets.map((b) => `- ${b}`).join('\n')}

PERSONALIZATION & WEIGHTING INSTRUCTIONS:
- Personalize the roadmap curriculum directly around the student's real performance data above.
- Weight the roadmap to spend more time on their weakest demonstrated areas (e.g. lower-scoring mock interview domains, missing resume keywords, or problem-solving areas) rather than treating all topics equally.
- For missing resume keywords (such as specific tools, databases, or frameworks), explicitly incorporate dedicated study modules, implementation projects, and problem sets to bridge these exact skill gaps.
- Calibrate the difficulty progression and question targets to build directly on their existing problem-solving volume.`;
}

async function generateRoadmapWithGemini(
  targetRole: string,
  company: string,
  degree: string,
  currentSkills: string,
  focus?: string,
  performanceData?: StudentPerformanceData | null
) {
  const roleStr = targetRole || 'Software Development Engineer';
  const companyStr = company || 'Target Company';
  const degreeStr = degree || 'B.Tech Computer Science';
  const skillsStr = currentSkills || 'C++, Data Structures, Basic Web Development';
  const focusStr = (focus || '').trim();

  if (!process.env.GEMINI_API_KEY) {
    return {
      targetRole: roleStr,
      company: companyStr,
      degree: degreeStr,
      phases: [
        {
          weekNum: 1,
          phase: 'Phase 1: High-Performance Data Structures',
          title: 'Arrays, Strings & Hash Tables Mastery for ' + companyStr,
          description: `Focus on two-pointer patterns, sliding window, prefix sums, and fast O(1) hash map lookups required for ${roleStr} at ${companyStr}.`,
          topics: [
            { id: 'w1_t1', title: 'Sliding Window & Two Pointer Techniques', completed: true, resourceType: 'Problem Practice' },
            { id: 'w1_t2', title: 'Prefix Sums, Difference Arrays & Subarray Optimization', completed: true, resourceType: 'Problem Practice' },
            { id: 'w1_t3', title: 'Hash Map Internal Collision Resolution & Load Factor', completed: false, resourceType: 'Theory & Core' },
            { id: 'w1_t4', title: 'String Manipulation & KMP Pattern Matching Algorithm', completed: false, resourceType: 'Problem Practice' },
          ],
          targetQuestions: 18,
          solvedQuestions: 10,
          easyTarget: 5,
          mediumTarget: 10,
          hardTarget: 3,
          resources: ['LeetCode Top 150', 'GeeksforGeeks Advanced DSA', 'NeetCode Roadmap'],
          estimatedTimeline: 'Week 1',
        },
        {
          weekNum: 2,
          phase: 'Phase 1: High-Performance Data Structures',
          title: 'Trees, Heaps & Priority Queues',
          description: `Master Binary Search Trees, Segment Trees, and Heap Priority Queues relevant for ${degreeStr} background.`,
          topics: [
            { id: 'w2_t1', title: 'Binary Tree Traversal (DFS/BFS) & Ancestor Queries', completed: true, resourceType: 'Problem Practice' },
            { id: 'w2_t2', title: 'BST Operations & Balancing Concepts', completed: false, resourceType: 'Theory & Practice' },
            { id: 'w2_t3', title: 'Min/Max Heap Construction & Top-K Frequent Elements', completed: false, resourceType: 'Problem Practice' },
            { id: 'w2_t4', title: 'Running Median in Data Streams using Dual Heaps', completed: false, resourceType: 'Advanced Coding' },
          ],
          targetQuestions: 20,
          solvedQuestions: 5,
          easyTarget: 4,
          mediumTarget: 12,
          hardTarget: 4,
          resources: ['MIT OpenCourseWare Algorithms', 'Striver SDE Sheet'],
          estimatedTimeline: 'Week 2',
        },
        {
          weekNum: 3,
          phase: 'Phase 2: Advanced Algorithms & Problem Solving',
          title: 'Graph Traversal, Shortest Paths & Topological Sorting',
          description: `Graph modeling for microservice networks, routing, and task scheduling for ${companyStr}.`,
          topics: [
            { id: 'w3_t1', title: 'BFS / DFS on Grids and Adjacency Lists', completed: false, resourceType: 'Problem Practice' },
            { id: 'w3_t2', title: 'Dijkstra & Bellman-Ford Shortest Path Algorithms', completed: false, resourceType: 'Algorithm Analysis' },
            { id: 'w3_t3', title: 'Topological Sorting & Kahn Algorithm for Task Dependencies', completed: false, resourceType: 'Problem Practice' },
            { id: 'w3_t4', title: 'Disjoint Set Union (DSU) & Kruskal Minimum Spanning Tree', completed: false, resourceType: 'Advanced Graphs' },
          ],
          targetQuestions: 22,
          solvedQuestions: 0,
          easyTarget: 4,
          mediumTarget: 14,
          hardTarget: 4,
          resources: ['CP-Algorithms Graph Theory', 'LeetCode Graph Study Plan'],
          estimatedTimeline: 'Week 3',
        },
        {
          weekNum: 4,
          phase: 'Phase 2: Advanced Algorithms & Problem Solving',
          title: 'Dynamic Programming & Memoization Patterns',
          description: `Crucial for ${companyStr} technical rounds: 1D/2D DP, Knapsack, and String Edit Distances.`,
          topics: [
            { id: 'w4_t1', title: '1D DP: Climbing Stairs, House Robber, Coin Change', completed: false, resourceType: 'DP Patterns' },
            { id: 'w4_t2', title: '2D DP: Grid Unique Paths, Minimum Path Sum', completed: false, resourceType: 'DP Patterns' },
            { id: 'w4_t3', title: 'Subsequence & String DP: LCS, LIS, Edit Distance', completed: false, resourceType: 'DP Hard' },
          ],
          targetQuestions: 25,
          solvedQuestions: 0,
          easyTarget: 3,
          mediumTarget: 16,
          hardTarget: 6,
          resources: ['Aditya Verma DP Playlist', 'CSES Problem Set'],
          estimatedTimeline: 'Week 4',
        },
        {
          weekNum: 5,
          phase: 'Phase 3: System Design & Architecture',
          title: 'Low-Level & High-Level System Architecture',
          description: `Designing scalable backend systems, database sharding, and API rate limiters tailored for ${roleStr}.`,
          topics: [
            { id: 'w5_t1', title: 'SOLID Principles & Design Patterns (Factory, Strategy, Observer)', completed: false, resourceType: 'LLD' },
            { id: 'w5_t2', title: 'Database Sharding, Replication & CAP Theorem', completed: false, resourceType: 'HLD' },
            { id: 'w5_t3', title: 'Distributed Caching (Redis) & Message Queues (Kafka)', completed: false, resourceType: 'Distributed Systems' },
          ],
          targetQuestions: 12,
          solvedQuestions: 0,
          easyTarget: 2,
          mediumTarget: 8,
          hardTarget: 2,
          resources: ['Designing Data-Intensive Applications', 'System Design Primer'],
          estimatedTimeline: 'Week 5',
        },
        {
          weekNum: 6,
          phase: 'Phase 4: Company Drills & Mock Interviews',
          title: `${companyStr} Interview Drills & Behavioral Preparation`,
          description: `Final interview simulation and STAR framework response preparation for ${roleStr}.`,
          topics: [
            { id: 'w6_t1', title: `Solve Top 20 Frequently Asked ${companyStr} Problems`, completed: false, resourceType: 'Company Drill' },
            { id: 'w6_t2', title: 'Prepare 5 STAR Method Stories for Leadership & Conflict', completed: false, resourceType: 'Behavioral' },
            { id: 'w6_t3', title: 'Complete AI Voice & Video Mock Interview Simulation', completed: false, resourceType: 'Mock Test' },
          ],
          targetQuestions: 15,
          solvedQuestions: 0,
          easyTarget: 3,
          mediumTarget: 9,
          hardTarget: 3,
          resources: [`${companyStr} Tech Blog`, 'AI Studio Mock Interviewer'],
          estimatedTimeline: 'Week 6',
        },
      ],
    };
  }

  const perfSummary = buildPerformanceSummaryText(performanceData || null);

  const companyFocusInstruction = focusStr
    ? `TARGET COMPANY INTERVIEW FOCUS & PROCESS SPECIFICATION:
This roadmap is specifically for ${companyStr}, whose interview process is known for: "${focusStr}".
The week-by-week structure, topic emphasis, and practice question mix MUST reflect this specific focus — do not produce a generic FAANG-style DSA roadmap if the focus area points to something different (e.g. competitive programming contests, specific frameworks, payment systems, concurrency & distributed transactions, or leadership behavioral rounds). Two students targeting different companies should get meaningfully different roadmaps, not the same generic curriculum with the company name swapped in.`
    : `TARGET COMPANY INTERVIEW FOCUS SPECIFICATION:
This roadmap is specifically tailored for ${companyStr}. The curriculum, topics, and problem targets must directly reflect ${companyStr}'s actual hiring bar and interview rounds.`;

  try {
    const promptText = `You are a career advisor and technical curriculum architect for top tech companies.
Create a personalized, week-by-week career preparation roadmap for a candidate with:
- Target Role: "${roleStr}"
- Target Company: "${companyStr}"
- Degree / Background: "${degreeStr}"
- Current Skills: "${skillsStr}"

${companyFocusInstruction}

${perfSummary}

CRITICAL DUAL-CONSTRAINT STEERING RULES (EQUALLY WEIGHTED):
1. TARGET COMPANY FOCUS EMPHASIS: ${focusStr ? `Strictly anchor the curriculum, coding targets, and weekly topics to ${companyStr}'s distinct emphasis (${focusStr}).` : `Tailor all weekly topics to ${companyStr}'s specific hiring rounds.`}
2. STUDENT WEAKNESS PERSONALIZATION: If student performance data is provided above, heavily weight the roadmap to spend extra time, dedicated topic modules, and targeted problem sets on their demonstrated weak areas (such as low mock interview scores, missing resume keywords, or coding volume gaps) rather than treating all topics equally. If no prior student diagnostic data exists, rely cleanly on the company focus and role requirements without fabricating artificial weaknesses.

Both constraints (Company Specific Focus + Student Real Weak Areas) are equally mandatory.

Generate a 6 to 8 week roadmap containing structured phases with detailed topics, coding targets, resources, and timelines.
Return JSON matching schema:
{
  "targetRole": "${roleStr}",
  "company": "${companyStr}",
  "degree": "${degreeStr}",
  "phases": [
    {
      "weekNum": 1,
      "phase": "Phase 1: Phase Name",
      "title": "Week Title",
      "description": "Week description reflecting ${companyStr} focus",
      "topics": [
        { "id": "w1_t1", "title": "Topic title", "completed": false, "resourceType": "Concept/Practice" }
      ],
      "targetQuestions": 18,
      "solvedQuestions": 0,
      "easyTarget": 5,
      "mediumTarget": 10,
      "hardTarget": 3,
      "resources": ["Resource 1", "Resource 2"],
      "estimatedTimeline": "Week 1"
    }
  ]
}`;

    const response = await callGeminiResilient({
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetRole: { type: Type.STRING },
            company: { type: Type.STRING },
            degree: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNum: { type: Type.INTEGER },
                  phase: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN },
                        resourceType: { type: Type.STRING },
                      },
                      required: ['id', 'title', 'completed'],
                    },
                  },
                  targetQuestions: { type: Type.INTEGER },
                  solvedQuestions: { type: Type.INTEGER },
                  easyTarget: { type: Type.INTEGER },
                  mediumTarget: { type: Type.INTEGER },
                  hardTarget: { type: Type.INTEGER },
                  resources: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedTimeline: { type: Type.STRING },
                },
                required: ['weekNum', 'phase', 'title', 'description', 'topics', 'targetQuestions'],
              },
            },
          },
          required: ['targetRole', 'phases'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
      return {
        targetRole: parsed.targetRole || roleStr,
        company: parsed.company || companyStr,
        degree: parsed.degree || degreeStr,
        phases: parsed.phases.map((p: any, idx: number) => ({
          weekNum: Number(p.weekNum) || idx + 1,
          phase: String(p.phase || `Phase ${Math.ceil((idx + 1) / 2)}: Skill Mastery`),
          title: String(p.title || `Week ${idx + 1} Plan`),
          description: String(p.description || ''),
          topics: Array.isArray(p.topics)
            ? p.topics.map((t: any, tIdx: number) => ({
                id: String(t.id || `w${idx + 1}_t${tIdx + 1}`),
                title: String(t.title || 'Core Concept'),
                completed: Boolean(t.completed),
                resourceType: String(t.resourceType || 'Theory & Practice'),
              }))
            : [],
          targetQuestions: Number(p.targetQuestions) || 15,
          solvedQuestions: Number(p.solvedQuestions) || 0,
          easyTarget: Number(p.easyTarget) || 4,
          mediumTarget: Number(p.mediumTarget) || 8,
          hardTarget: Number(p.hardTarget) || 3,
          resources: Array.isArray(p.resources) ? p.resources : ['LeetCode', 'GeeksforGeeks'],
          estimatedTimeline: String(p.estimatedTimeline || `Week ${idx + 1}`),
        })),
      };
    }
  } catch (err) {
    console.warn('[Gemini Roadmap Generation Error]:', err);
  }

  // Fallback if parsing or call failed
  return {
    targetRole: roleStr,
    company: companyStr,
    degree: degreeStr,
    phases: [
      {
        weekNum: 1,
        phase: 'Phase 1: Foundations & High-Performance Data Structures',
        title: 'Arrays, Strings & Hash Tables Mastery for ' + companyStr,
        description: `Focus on two-pointer patterns, sliding window, prefix sums required for ${roleStr}.`,
        topics: [
          { id: 'w1_t1', title: 'Sliding Window & Two Pointer Techniques', completed: true, resourceType: 'Problem Practice' },
          { id: 'w1_t2', title: 'Prefix Sums & Subarray Optimization', completed: true, resourceType: 'Problem Practice' },
          { id: 'w1_t3', title: 'Hash Map Collision Resolution & Load Factor', completed: false, resourceType: 'Theory' },
        ],
        targetQuestions: 18,
        solvedQuestions: 8,
        easyTarget: 5,
        mediumTarget: 10,
        hardTarget: 3,
        resources: ['LeetCode Top 150', 'GeeksforGeeks'],
        estimatedTimeline: 'Week 1',
      },
    ],
  };
}

// POST /api/roadmap/generate — generates custom Gemini roadmap for logged-in user
roadmapRouter.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { targetRole, company, degree, currentSkills, focus, companyFocus } = req.body;
    const targetFocus = (focus || companyFocus || '').trim();

    let userDegree = degree || '';
    let userTargetRole = targetRole || '';

    // Fetch user details if missing
    if (mongoose.connection.readyState === 1 && req.user?.userId) {
      try {
        const userDoc = await User.findById(req.user.userId);
        if (userDoc) {
          if (!userDegree) userDegree = userDoc.degree || 'B.Tech CS';
          if (!userTargetRole) userTargetRole = userDoc.targetRole || 'Software Development Engineer';
        }
      } catch (dbErr) {
        console.warn('MongoDB find user error:', dbErr);
      }
    }

    if (!userTargetRole) userTargetRole = 'Software Development Engineer (SDE 1)';
    if (!userDegree) userDegree = 'B.Tech Computer Science';

    // Fetch real student performance diagnostic data (Resume, Mock Interviews, Coding Progress)
    let performanceData: StudentPerformanceData | null = null;
    if (req.user?.userId) {
      performanceData = await fetchStudentPerformanceData(req.user.userId);
    }

    const generated = await generateRoadmapWithGemini(
      userTargetRole,
      company || 'Google',
      userDegree,
      currentSkills || '',
      targetFocus,
      performanceData
    );

    let savedRoadmap: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        savedRoadmap = await Roadmap.create({
          userId: req.user?.userId,
          targetRole: generated.targetRole,
          degree: generated.degree,
          company: generated.company,
          phases: generated.phases,
          generatedAt: new Date(),
        });
      } catch (dbErr) {
        console.warn('MongoDB save roadmap error:', dbErr);
      }
    }

    if (!savedRoadmap) {
      savedRoadmap = {
        _id: `rm_${Date.now()}`,
        userId: req.user?.userId,
        targetRole: generated.targetRole,
        degree: generated.degree,
        company: generated.company,
        phases: generated.phases,
        generatedAt: new Date(),
      };
      inMemoryLatestRoadmap = savedRoadmap;
    } else {
      inMemoryLatestRoadmap = savedRoadmap;
    }

    // Award Roadmap Architect Badge
    if (req.user?.userId) {
      await awardBadgeForUser(req.user.userId, {
        title: 'Roadmap Architect',
        description: 'Generated your first personalized AI Career Preparation Roadmap.',
        icon: '🗺️',
      });
    }

    return res.status(200).json({
      success: true,
      roadmap: savedRoadmap,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to generate career roadmap');
  }
});

// GET /api/roadmap/latest — retrieves most recent saved roadmap for logged-in user
roadmapRouter.get('/latest', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let latest: any = null;

    if (mongoose.connection.readyState === 1 && req.user?.userId) {
      try {
        latest = await Roadmap.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('MongoDB find latest roadmap error:', dbErr);
      }
    }

    if (!latest) {
      latest = inMemoryLatestRoadmap;
    }

    return res.status(200).json({
      roadmap: latest,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch latest roadmap');
  }
});

// PUT /api/roadmap/:roadmapId/progress — updates topics completion or solved questions in a roadmap
roadmapRouter.put('/:roadmapId/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { roadmapId } = req.params;
    const { phases } = req.body;

    if (!roadmapId) {
      return res.status(400).json({ error: 'Roadmap ID required' });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
          return res.status(400).json({ error: 'Invalid roadmap ID format' });
        }

        const doc = await Roadmap.findById(roadmapId);
        if (!doc) {
          return res.status(404).json({ error: 'Roadmap not found' });
        }

        // Enforce user ownership check
        if (doc.userId && String(doc.userId) !== String(userId)) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to update this roadmap' });
        }

        if (phases) {
          doc.phases = phases;
          await doc.save();
          return res.json({ success: true, roadmap: doc });
        }
        return res.json({ success: true, roadmap: doc });
      } catch (dbErr) {
        console.warn('MongoDB update roadmap error:', dbErr);
      }
    }

    if (inMemoryLatestRoadmap) {
      if (inMemoryLatestRoadmap.userId && String(inMemoryLatestRoadmap.userId) !== String(userId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to update this roadmap' });
      }
      if (phases) {
        inMemoryLatestRoadmap.phases = phases;
      }
    }

    return res.json({ success: true, roadmap: inMemoryLatestRoadmap });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to update roadmap progress');
  }
});

