import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from './authMiddleware';
import {
  getStudentMemories,
  getStudentMemory,
  upsertStudentMemory,
  deleteStudentMemory,
  normalizeMemoryKey,
  validateMemoryCategory,
  validateMemoryConfidence,
} from '../src/services/memoryService';
import { sendSafeServerError } from './errorHandler';

export const studentMemoryRouter = Router();

studentMemoryRouter.use(authMiddleware);

function requireStudent(req: AuthRequest, res: Response): boolean {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  if (req.user.role !== 'student') {
    res.status(403).json({ error: 'Forbidden: Student role required' });
    return false;
  }
  return true;
}

/**
 * GET /api/student-memory
 * Lists all durable memories for the authenticated student.
 */
studentMemoryRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;

    const category = req.query.category ? String(req.query.category) : undefined;
    const memories = await getStudentMemories(studentId, { category });

    return res.json({ memories });
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to fetch student memories');
  }
});

/**
 * GET /api/student-memory/:key
 * Retrieves a single student memory by key.
 */
studentMemoryRouter.get('/:key', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;
    const { key } = req.params;

    if (!key || !key.trim()) {
      return res.status(400).json({ error: 'Memory key is required' });
    }

    const memory = await getStudentMemory(studentId, key);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    return res.json({ memory });
  } catch (err: any) {
    if (err.message?.includes('non-empty string') || err.message?.includes('alphanumeric')) {
      return res.status(400).json({ error: err.message });
    }
    return sendSafeServerError(res, err, 'Failed to fetch student memory');
  }
});

/**
 * PUT /api/student-memory/:key
 * Upserts a durable student memory record.
 * Mass assignment strictly prevented by only extracting allowed fields.
 */
studentMemoryRouter.put('/:key', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;
    const { key } = req.params;

    if (!key || !key.trim()) {
      return res.status(400).json({ error: 'Memory key is required' });
    }

    const { value, category, confidence } = req.body || {};

    if (!value || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'Memory value is required and must be non-empty' });
    }

    if (!category || !validateMemoryCategory(category)) {
      return res.status(400).json({
        error: `Invalid category. Allowed: goal, target_role, target_company, skill, preference, learning_goal, career_goal, other`,
      });
    }

    if (!validateMemoryConfidence(confidence)) {
      return res.status(400).json({
        error: 'Confidence must be a numeric value between 0 and 1',
      });
    }

    // Provenance security: Force source to 'user_confirmed' and lastConfirmedAt to server time
    const memory = await upsertStudentMemory(studentId, {
      key,
      value,
      category,
      confidence,
      source: 'user_confirmed',
      lastConfirmedAt: new Date(),
    });

    return res.json({ memory });
  } catch (err: any) {
    if (
      err.name === 'ValidationError' ||
      err.message?.includes('Invalid') ||
      err.message?.includes('cannot exceed') ||
      err.message?.includes('alphanumeric')
    ) {
      return res.status(400).json({ error: err.message });
    }
    return sendSafeServerError(res, err, 'Failed to update student memory');
  }
});

/**
 * DELETE /api/student-memory/:key
 * Deletes a durable student memory record.
 */
studentMemoryRouter.delete('/:key', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;
    const { key } = req.params;

    if (!key || !key.trim()) {
      return res.status(400).json({ error: 'Memory key is required' });
    }

    const deleted = await deleteStudentMemory(studentId, key);
    if (!deleted) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    return res.json({ message: 'Student memory deleted successfully' });
  } catch (err: any) {
    if (err.message?.includes('alphanumeric') || err.message?.includes('non-empty string')) {
      return res.status(400).json({ error: err.message });
    }
    return sendSafeServerError(res, err, 'Failed to delete student memory');
  }
});
