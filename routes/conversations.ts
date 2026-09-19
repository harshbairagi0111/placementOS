import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { Conversation } from '../src/models/Conversation';
import {
  createConversation,
  listStudentConversations,
  getConversation,
  addMessage,
  getMessages,
  deleteConversation,
  MAX_MESSAGE_CONTENT_LENGTH,
} from '../src/services/conversationService';
import { sendSafeServerError } from './errorHandler';

export const conversationsRouter = Router();

// Enforce authentication on all conversation routes
conversationsRouter.use(authMiddleware);

// Helper for student role enforcement
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
 * POST /api/conversations
 * Creates a new conversation for the authenticated student.
 */
conversationsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;

    const { title, assistantType } = req.body || {};

    const conversation = await createConversation(studentId, {
      title: typeof title === 'string' ? title : undefined,
      assistantType: typeof assistantType === 'string' ? (assistantType as any) : undefined,
    });

    return res.status(201).json({ conversation });
  } catch (err: any) {
    if (err.name === 'ValidationError' || err.message?.includes('Invalid')) {
      return res.status(400).json({ error: err.message });
    }
    return sendSafeServerError(res, err, 'Failed to create conversation');
  }
});

/**
 * GET /api/conversations
 * Lists conversations for the authenticated student.
 */
conversationsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;

    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const skip = req.query.skip ? parseInt(String(req.query.skip), 10) : undefined;
    const assistantType = req.query.assistantType ? String(req.query.assistantType) : undefined;

    const conversations = await listStudentConversations(studentId, {
      limit: !isNaN(limit as number) ? limit : undefined,
      skip: !isNaN(skip as number) ? skip : undefined,
      assistantType,
    });

    return res.json({ conversations });
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to list conversations');
  }
});

/**
 * GET /api/conversations/:conversationId
 * Retrieves a specific conversation, enforcing student ownership.
 */
conversationsRouter.get('/:conversationId', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversationId format' });
    }

    const conversation = await Conversation.findById(conversationId).exec();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.studentId.toString() !== studentId) {
      return res.status(403).json({ error: 'Access denied: You do not own this conversation' });
    }

    return res.json({ conversation });
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to retrieve conversation');
  }
});

/**
 * GET /api/conversations/:conversationId/messages
 * Retrieves paginated messages for a conversation, enforcing student ownership.
 */
conversationsRouter.get('/:conversationId/messages', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversationId format' });
    }

    const conversation = await Conversation.findById(conversationId).exec();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.studentId.toString() !== studentId) {
      return res.status(403).json({ error: 'Access denied: You do not own this conversation' });
    }

    const limit = req.query.limit !== undefined ? parseInt(String(req.query.limit), 10) : undefined;
    const skip = req.query.skip !== undefined ? parseInt(String(req.query.skip), 10) : undefined;
    const before = req.query.before ? String(req.query.before) : undefined;
    const after = req.query.after ? String(req.query.after) : undefined;

    const messages = await getMessages(studentId, conversationId, {
      limit: !isNaN(limit as number) ? limit : undefined,
      skip: !isNaN(skip as number) ? skip : undefined,
      before,
      after,
    });

    return res.json({ messages });
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to retrieve messages');
  }
});

/**
 * POST /api/conversations/:conversationId/messages
 * Appends a new message to the conversation, enforcing student ownership.
 */
conversationsRouter.post('/:conversationId/messages', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversationId format' });
    }

    const conversation = await Conversation.findById(conversationId).exec();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.studentId.toString() !== studentId) {
      return res.status(403).json({ error: 'Access denied: You do not own this conversation' });
    }

    const { role, content, tokenCount, model, source, metadata } = req.body || {};

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required and cannot be empty' });
    }
    if (content.trim().length > MAX_MESSAGE_CONTENT_LENGTH) {
      return res.status(400).json({
        error: `Message content exceeds maximum length of ${MAX_MESSAGE_CONTENT_LENGTH} characters`,
      });
    }

    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Allowed: user, assistant, system' });
    }

    const message = await addMessage(studentId, conversationId, {
      role,
      content,
      tokenCount: typeof tokenCount === 'number' ? tokenCount : undefined,
      model: typeof model === 'string' ? model : undefined,
      source: typeof source === 'string' ? source : undefined,
      metadata: typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : undefined,
    });

    return res.status(201).json({ message });
  } catch (err: any) {
    if (err.message?.includes('not found') || err.message?.includes('denied')) {
      return res.status(403).json({ error: err.message });
    }
    return sendSafeServerError(res, err, 'Failed to add message');
  }
});

/**
 * DELETE /api/conversations/:conversationId
 * Deletes a conversation and all its messages.
 */
conversationsRouter.delete('/:conversationId', async (req: AuthRequest, res: Response) => {
  try {
    if (!requireStudent(req, res)) return;
    const studentId = req.user!.userId;
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversationId format' });
    }

    const conversation = await Conversation.findById(conversationId).exec();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.studentId.toString() !== studentId) {
      return res.status(403).json({ error: 'Access denied: You do not own this conversation' });
    }

    await deleteConversation(studentId, conversationId);

    return res.json({ message: 'Conversation and messages deleted successfully' });
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to delete conversation');
  }
});
