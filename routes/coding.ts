import express, { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { CodingQuestion, ICodingQuestion, ICodingTestCase } from '../src/models/CodingQuestion';
import { CodingProgress } from '../src/models/CodingProgress';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { getJwtSecret } from './securityConfig';
import { sendSafeServerError } from './errorHandler';

export const codingRouter = express.Router();

/**
 * Optional authentication middleware for read routes.
 * If token is present and valid, attaches user to req.
 * If absent, request proceeds gracefully so preview/guest can view challenge bank.
 */
function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  if (token) {
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as { userId: string; email: string; role: string };
      req.user = decoded;
    } catch {
      // ignore invalid token for public reading
    }
  }
  next();
}

/**
 * Middleware ensuring only admin or tpo roles can mutate the question catalog.
 * Students and unauthenticated callers receive 403 / 401.
 */
function requireAdminRole(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'tpo') {
      res.status(403).json({ error: 'Forbidden: Coding question authoring requires admin or tpo credentials' });
      return;
    }
    next();
  });
}

/**
 * Format a public test case safely for the client.
 * HIDDEN test cases must never reach this transformer.
 */
function formatPublicTestCase(tc: ICodingTestCase) {
  return {
    id: tc.testCaseId,
    testCaseId: tc.testCaseId,
    visibility: 'PUBLIC' as const,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    expected: tc.expectedOutput, // compatibility with existing UI
  };
}

/**
 * Transform a database CodingQuestion into a safe student-facing payload.
 * Strips all hidden test cases and internal-only metadata.
 */
function formatStudentQuestion(doc: ICodingQuestion) {
  const publicTestCases = (doc.testCases || [])
    .filter((tc) => tc.visibility === 'PUBLIC' && tc.isActive !== false)
    .map(formatPublicTestCase);

  const starterCodeObj =
    doc.starterCode instanceof Map
      ? Object.fromEntries(doc.starterCode.entries())
      : doc.starterCode || {};

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    difficulty: doc.difficulty,
    category: doc.category,
    categoryLabel: doc.categoryLabel || doc.category,
    tags: doc.tags || [],
    company: doc.company || '',
    acceptance: doc.acceptance || '85%',
    timeComplexity: doc.timeComplexity || 'O(N)',
    spaceComplexity: doc.spaceComplexity || 'O(1)',
    constraints: doc.constraints || [],
    inputFormat: doc.inputFormat || '',
    outputFormat: doc.outputFormat || '',
    examples: doc.examples || [],
    starterCode: starterCodeObj,
    stubs: starterCodeObj,
    supportedLanguages: doc.supportedLanguages || [
      'cpp',
      'python',
      'java',
      'javascript',
      'typescript',
      'c',
      'go',
      'rust',
    ],
    timeLimitMs: doc.timeLimitMs || 2000,
    memoryLimitMb: doc.memoryLimitMb || 256,
    testCases: publicTestCases,
    publicTestCaseCount: publicTestCases.length,
    legacyId: doc.legacyId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /api/coding/questions
 * Returns list of active coding questions with public test cases only.
 * Supports filtering by difficulty, category, and search query.
 */
codingRouter.get('/questions', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { difficulty, category, search } = req.query;

    const filter: Record<string, any> = {
      isActive: true,
    };

    if (difficulty && typeof difficulty === 'string' && difficulty.toUpperCase() !== 'ALL') {
      filter.difficulty = difficulty.toUpperCase();
    }

    if (category && typeof category === 'string' && category.toUpperCase() !== 'ALL') {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
        { slug: searchRegex },
      ];
    }

    const questions = await CodingQuestion.find(filter).sort({ legacyId: 1, createdAt: 1 });

    const sanitizedQuestions = questions.map(formatStudentQuestion);

    res.json({
      success: true,
      count: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    sendSafeServerError(res, error, 'Failed to fetch coding questions');
  }
});

/**
 * GET /api/coding/questions/:id
 * Fetch a single question by MongoDB ObjectId or slug or legacyId.
 * Rejects non-active questions.
 * Only returns PUBLIC test cases.
 */
codingRouter.get('/questions/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Question ID or slug is required' });
      return;
    }

    let question: ICodingQuestion | null = null;

    // 1. Try finding by ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(id)) {
      question = await CodingQuestion.findOne({ _id: id, isActive: true });
    }

    // 2. Try finding by slug
    if (!question) {
      question = await CodingQuestion.findOne({ slug: id.toLowerCase().trim(), isActive: true });
    }

    // 3. Try finding by numeric legacyId
    if (!question && !isNaN(Number(id))) {
      question = await CodingQuestion.findOne({ legacyId: Number(id), isActive: true });
    }

    if (!question) {
      res.status(404).json({ error: 'Coding question not found or inactive' });
      return;
    }

    res.json({
      success: true,
      question: formatStudentQuestion(question),
    });
  } catch (error) {
    sendSafeServerError(res, error, 'Failed to fetch coding question');
  }
});

/**
 * Prevent student role from mutating question definitions.
 */
codingRouter.post('/questions', authMiddleware, (req: AuthRequest, res: Response): void => {
  res.status(403).json({ error: 'Students are not permitted to create coding questions' });
});

codingRouter.put('/questions/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  res.status(403).json({ error: 'Students are not permitted to modify coding questions' });
});

codingRouter.delete('/questions/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  res.status(403).json({ error: 'Students are not permitted to delete coding questions' });
});

/**
 * GET /api/coding/progress
 * Get current user's coding readiness progress.
 */
codingRouter.get('/progress', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id || (req.user as any)?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    let progress = await CodingProgress.findOne({ userId });
    if (!progress) {
      progress = await CodingProgress.create({
        userId,
        problemsSolved: 0,
        totalProblems: 40,
        accuracyRate: 0,
        languagesUsed: 1,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      });
    }

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    sendSafeServerError(res, error, 'Failed to fetch coding progress');
  }
});

/**
 * POST /api/coding/progress/record-solution
 * Record a solved problem for the current student.
 */
codingRouter.post('/progress/record-solution', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id || (req.user as any)?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { difficulty, runtimeMs } = req.body;

    let progress = await CodingProgress.findOne({ userId });
    if (!progress) {
      progress = new CodingProgress({
        userId,
        problemsSolved: 0,
        totalProblems: 40,
        accuracyRate: 100,
        languagesUsed: 1,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      });
    }

    progress.problemsSolved = (progress.problemsSolved || 0) + 1;
    progress.lastSolvedAt = new Date();

    if (difficulty === 'EASY') progress.easySolved = (progress.easySolved || 0) + 1;
    else if (difficulty === 'MEDIUM') progress.mediumSolved = (progress.mediumSolved || 0) + 1;
    else if (difficulty === 'HARD') progress.hardSolved = (progress.hardSolved || 0) + 1;

    if (runtimeMs && typeof runtimeMs === 'number') {
      if (!progress.fastestRuntimeMs || runtimeMs < progress.fastestRuntimeMs) {
        progress.fastestRuntimeMs = runtimeMs;
      }
    }

    await progress.save();

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    sendSafeServerError(res, error, 'Failed to record coding solution');
  }
});
