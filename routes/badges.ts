import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Badge } from '../src/models/Badge';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';

export const badgesRouter = Router();

// In-memory store for fallback mode
export const inMemoryUserBadges: any[] = [];

export async function awardBadgeForUser(
  userId: string | mongoose.Types.ObjectId | undefined,
  badgeData: { title: string; description: string; icon: string }
) {
  if (!userId) return;

  if (mongoose.connection.readyState === 1) {
    try {
      const existing = await Badge.findOne({ userId, title: badgeData.title });
      if (!existing) {
        await Badge.create({
          userId,
          title: badgeData.title,
          description: badgeData.description,
          icon: badgeData.icon,
          earnedAt: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      console.warn('MongoDB badge create error:', err);
    }
  } else {
    const exists = inMemoryUserBadges.some(
      (b) => String(b.userId) === String(userId) && b.title === badgeData.title
    );
    if (!exists) {
      inMemoryUserBadges.push({
        _id: `badge_${Date.now()}`,
        userId,
        title: badgeData.title,
        description: badgeData.description,
        icon: badgeData.icon,
        earnedAt: new Date().toISOString().split('T')[0],
      });
    }
  }
}

// GET /api/badges/me — returns badges earned by the logged-in user
badgesRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    let userBadges: any[] = [];

    if (mongoose.connection.readyState === 1 && userId) {
      try {
        userBadges = await Badge.find({ userId }).sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('MongoDB fetch user badges error, falling back to in-memory store:', dbErr);
        userBadges = inMemoryUserBadges.filter((b) => String(b.userId) === String(userId));
      }
    } else if (userId) {
      userBadges = inMemoryUserBadges.filter((b) => String(b.userId) === String(userId));
    }

    return res.status(200).json({
      success: true,
      badges: userBadges,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch badges');
  }
});
