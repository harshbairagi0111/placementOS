import express, { Response } from 'express';
import mongoose from 'mongoose';
import {
  InterviewExperience,
  IInterviewExperience,
  normalizeInterviewQuestions,
  IInterviewQuestion,
} from '../src/models/InterviewExperience';
import { User } from '../src/models/User';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';

export const experiencesRouter = express.Router();

// In-memory store fallback when MongoDB is not connected
export const inMemoryExperiences: any[] = [];

/**
 * POST /api/experiences
 * Protected, students only.
 * Submit a new interview experience. Always created with status: 'pending'.
 */
experiencesRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      company,
      role,
      interviewDate,
      roundsDescription,
      questionsAsked,
      difficulty,
      outcome,
    } = req.body;

    if (!company || typeof company !== 'string' || !company.trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ error: 'Role title is required' });
    }

    if (!roundsDescription || typeof roundsDescription !== 'string' || !roundsDescription.trim()) {
      return res.status(400).json({ error: 'Rounds description is required' });
    }

    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be Easy, Medium, or Hard' });
    }

    const validOutcomes = ['Selected', 'Rejected', 'Awaiting Result'];
    if (!outcome || !validOutcomes.includes(outcome)) {
      return res.status(400).json({ error: 'Outcome must be Selected, Rejected, or Awaiting Result' });
    }

    const cleanedQuestions = normalizeInterviewQuestions(questionsAsked);

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const newExperience = await InterviewExperience.create({
        studentId: new mongoose.Types.ObjectId(user.userId),
        company: company.trim(),
        role: role.trim(),
        interviewDate: interviewDate || new Date().toISOString().split('T')[0],
        roundsDescription: roundsDescription.trim(),
        questionsAsked: cleanedQuestions,
        difficulty,
        outcome,
        status: 'pending', // Strictly set to pending
        reviewedBy: null,
        reviewNote: null,
      });

      return res.status(201).json({
        success: true,
        message: 'Interview experience submitted successfully! It will be reviewed by the placement officer.',
        experience: newExperience,
      });
    } else {
      // In-memory fallback
      const fallbackExperience = {
        _id: `mem_exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentId: user.userId,
        company: company.trim(),
        role: role.trim(),
        interviewDate: interviewDate || new Date().toISOString().split('T')[0],
        roundsDescription: roundsDescription.trim(),
        questionsAsked: cleanedQuestions,
        difficulty,
        outcome,
        status: 'pending',
        reviewedBy: null,
        reviewNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryExperiences.unshift(fallbackExperience);

      return res.status(201).json({
        success: true,
        message: 'Interview experience submitted successfully! It will be reviewed by the placement officer.',
        experience: fallbackExperience,
      });
    }
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to submit interview experience');
  }
});

/**
 * GET /api/experiences/coding-questions
 * Protected.
 * Returns a deduplicated list of type: 'coding' questions from approved interview experiences,
 * optionally filtered by company.
 */
experiencesRouter.get('/coding-questions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { company } = req.query;
    const isConnected = mongoose.connection.readyState === 1;
    let approvedDocs: any[] = [];

    if (isConnected) {
      const query: any = { status: 'approved' };
      if (typeof company === 'string' && company.trim() && company !== 'ALL' && company !== 'All Companies') {
        query.company = { $regex: new RegExp(`^${company.trim()}$`, 'i') };
      }
      approvedDocs = await InterviewExperience.find(query).sort({ createdAt: -1 }).lean();
    }

    if (approvedDocs.length === 0 && inMemoryExperiences.length > 0) {
      let filtered = inMemoryExperiences.filter((e) => e.status === 'approved');
      if (typeof company === 'string' && company.trim() && company !== 'ALL' && company !== 'All Companies') {
        const target = company.trim().toLowerCase();
        filtered = filtered.filter((e) => e.company && e.company.toLowerCase() === target);
      }
      approvedDocs = filtered;
    }

    // Extract, filter by type === 'coding', and deduplicate
    const seenTexts = new Set<string>();
    const codingQuestions: Array<{
      id: string;
      text: string;
      company: string;
      role: string;
      difficulty: string;
      outcome: string;
      interviewDate: string;
      experienceId: string;
      source: string;
    }> = [];

    for (const exp of approvedDocs) {
      const questions = normalizeInterviewQuestions(exp.questionsAsked);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.type === 'coding') {
          const lower = q.text.toLowerCase().trim();
          if (!seenTexts.has(lower)) {
            seenTexts.add(lower);
            codingQuestions.push({
              id: `${exp._id}_q${i}`,
              text: q.text,
              company: exp.company,
              role: exp.role,
              difficulty: exp.difficulty,
              outcome: exp.outcome,
              interviewDate: typeof exp.interviewDate === 'string' ? exp.interviewDate.split('T')[0] : 'Recent',
              experienceId: String(exp._id),
              source: 'community_approved',
            });
          }
        }
      }
    }

    return res.json({
      success: true,
      company: typeof company === 'string' ? company : 'ALL',
      count: codingQuestions.length,
      codingQuestions,
    });
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to fetch coding questions');
  }
});

/**
 * GET /api/experiences/mine
 * Protected.
 * Returns the logged-in student's own submissions regardless of status,
 * so they can see pending, approved, and rejected submissions with review notes.
 */
experiencesRouter.get('/mine', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const studentObjectId = new mongoose.Types.ObjectId(user.userId);
      const myExperiences = await InterviewExperience.find({
        studentId: studentObjectId,
      })
        .sort({ createdAt: -1 })
        .lean();

      const formatted = myExperiences.map((exp: any) => ({
        ...exp,
        questionsAsked: normalizeInterviewQuestions(exp.questionsAsked),
      }));

      return res.json({
        success: true,
        experiences: formatted,
      });
    } else {
      const myExperiences = inMemoryExperiences
        .filter((e) => String(e.studentId) === String(user.userId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const formatted = myExperiences.map((exp) => ({
        ...exp,
        questionsAsked: normalizeInterviewQuestions(exp.questionsAsked),
      }));

      return res.json({
        success: true,
        experiences: formatted,
      });
    }
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to fetch your interview experiences');
  }
});

/**
 * GET /api/experiences
 * Protected.
 * Returns ONLY status: 'approved' experiences, optionally filtered by company, sorted newest first.
 * Never exposes pending/rejected submissions to regular students.
 */
experiencesRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { company, search } = req.query;
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const query: any = { status: 'approved' };

      if (typeof company === 'string' && company.trim() && company !== 'ALL' && company !== 'All Companies') {
        query.company = { $regex: new RegExp(`^${company.trim()}$`, 'i') };
      } else if (typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ company: regex }, { role: regex }];
      }

      const approvedExperiences = await InterviewExperience.find(query)
        .populate('studentId', 'name college targetRole degree')
        .sort({ createdAt: -1 })
        .lean();

      const formatted = approvedExperiences.map((exp: any) => {
        const student = exp.studentId;
        return {
          ...exp,
          questionsAsked: normalizeInterviewQuestions(exp.questionsAsked),
          authorName: student?.name || 'Verified Student',
          authorCollege: student?.college || 'Engineering Institute',
          authorRole: student?.targetRole || exp.role,
        };
      });

      return res.json({
        success: true,
        experiences: formatted,
      });
    } else {
      let filtered = inMemoryExperiences.filter((e) => e.status === 'approved');

      if (typeof company === 'string' && company.trim() && company !== 'ALL' && company !== 'All Companies') {
        const target = company.trim().toLowerCase();
        filtered = filtered.filter((e) => e.company.toLowerCase() === target);
      } else if (typeof search === 'string' && search.trim()) {
        const s = search.trim().toLowerCase();
        filtered = filtered.filter(
          (e) => e.company.toLowerCase().includes(s) || e.role.toLowerCase().includes(s)
        );
      }

      const sorted = filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const formatted = sorted.map((exp) => ({
        ...exp,
        questionsAsked: normalizeInterviewQuestions(exp.questionsAsked),
        authorName: 'Verified Student',
        authorCollege: 'Engineering Institute',
        authorRole: exp.role,
      }));

      return res.json({
        success: true,
        experiences: formatted,
      });
    }
  } catch (err: any) {
    return sendSafeServerError(res, err, 'Failed to fetch interview experiences');
  }
});

