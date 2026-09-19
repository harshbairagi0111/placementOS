import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { processMentorChat } from '../src/services/aiMentorService';

export function createMentorRouter(deps: {
  geminiCaller?: any;
  retriever?: any;
} = {}) {
  const router = Router();

  router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      // 1. Authentication & Student Role Verification
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Forbidden: Student role required' });
      }

      const studentId = req.user.userId;

      // 2. Extract strictly allowed fields (prevent mass assignment of studentId/role/timestamps)
      const {
        message,
        conversationId,
        targetRole,
        college,
        targetCtc,
      } = req.body || {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message string is required' });
      }

      // 3. Execute AI Mentor with RAG & Conversational Memory
      const result = await processMentorChat(studentId, message, {
        conversationId: typeof conversationId === 'string' ? conversationId : undefined,
        targetRole: typeof targetRole === 'string' ? targetRole : undefined,
        college: typeof college === 'string' ? college : undefined,
        targetCtc: typeof targetCtc === 'string' ? targetCtc : undefined,
        geminiCaller: deps.geminiCaller,
        retriever: deps.retriever,
      });

      return res.json(result);
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      if (
        error.name === 'ValidationError' ||
        error.message?.includes('Invalid') ||
        error.message?.includes('required') ||
        error.message?.includes('cannot exceed')
      ) {
        return res.status(400).json({ error: error.message });
      }
      return sendSafeServerError(res, error, "Sorry, I couldn't respond right now — please try again");
    }
  });

  return router;
}

export const mentorRouter = createMentorRouter();
