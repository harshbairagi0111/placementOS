import express, { Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import {
  User,
  MockInterviewSession,
  Resume,
  Portfolio,
  CodingProgress,
  AptitudeTestSession,
  InterviewExperience,
  Certification,
  Badge,
  JobApplication,
} from '../src/models';
import { normalizeInterviewQuestions } from '../src/models/InterviewExperience';
import { inMemoryExperiences } from './experiences';

export const tpoRouter = express.Router();

/**
 * Helper to fetch and validate the logged-in TPO's collegeName.
 * If missing/empty, returns a 400 error response.
 */
async function getValidatedTpoCollege(
  userId: string,
  res: Response
): Promise<{ tpoCollegeName: string; tpoUser: any } | null> {
  const tpoUser = await User.findById(userId);
  if (!tpoUser) {
    res.status(404).json({ error: 'TPO user profile not found.' });
    return null;
  }

  const tpoCollegeName = (tpoUser.collegeName || tpoUser.college || '').trim();
  if (!tpoCollegeName) {
    res.status(400).json({
      error:
        'Please complete your profile with your College / University Name before viewing analytics or moderating student submissions.',
    });
    return null;
  }

  return { tpoCollegeName, tpoUser };
}

// GET /api/tpo/analytics - Protected route for Institution / Training & Placement Officers
tpoRouter.get('/analytics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'institution') {
      return res.status(403).json({
        error: 'Access forbidden. Only registered Institution users / Training & Placement Officers can access batch analytics.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database connection unavailable',
      });
    }

    // 1. Fetch TPO's own User document and validate collegeName
    const tpoContext = await getValidatedTpoCollege(req.user.userId, res);
    if (!tpoContext) return;
    const { tpoCollegeName } = tpoContext;

    // Filter matching students of this college
    const collegeStudentFilter = {
      role: 'student' as const,
      $or: [{ collegeName: tpoCollegeName }, { college: tpoCollegeName }],
    };

    // 2. Total Registered Students Count scoped to TPO's college
    const totalStudents = await User.countDocuments(collegeStudentFilter);

    // Common aggregation stages to lookup user and filter by TPO's college
    const studentLookupStage = {
      $lookup: {
        from: 'users',
        let: { uid: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ['$_id', '$$uid'] },
                      { $eq: [{ $toString: '$_id' }, { $toString: '$$uid' }] },
                    ],
                  },
                  {
                    $or: [
                      { $eq: ['$collegeName', tpoCollegeName] },
                      { $eq: ['$college', tpoCollegeName] },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: 'studentUser',
      },
    };

    const studentMatchStage = {
      $match: {
        'studentUser.0': { $exists: true },
      },
    };

    // 3. Resume ATS Averages (MongoDB Aggregation scoped to TPO's college)
    const resumeStats = await Resume.aggregate([
      { $match: { atsScore: { $ne: null, $gte: 0 } } },
      studentLookupStage,
      studentMatchStage,
      {
        $group: {
          _id: null,
          avgAts: { $avg: '$atsScore' },
          count: { $sum: 1 },
        },
      },
    ]);
    const avgResumeScore = resumeStats.length > 0 ? Math.round(resumeStats[0].avgAts) : 0;
    const resumesEvaluated = resumeStats.length > 0 ? resumeStats[0].count : 0;

    // 4. Mock Interview Averages & Category Diagnostics (MongoDB Aggregation scoped to TPO's college)
    const mockStats = await MockInterviewSession.aggregate([
      { $match: { verdict: { $ne: 'Pending' } } },
      studentLookupStage,
      studentMatchStage,
      {
        $group: {
          _id: null,
          avgOverall: { $avg: { $ifNull: ['$overallScore', '$score'] } },
          avgPosture: { $avg: '$postureScore' },
          avgEyeContact: { $avg: '$eyeContactScore' },
          avgConfidence: { $avg: '$confidenceScore' },
          avgComm: { $avg: '$commScore' },
          avgTech: { $avg: '$techScore' },
          count: { $sum: 1 },
        },
      },
    ]);
    const avgMockScore = mockStats.length > 0 ? Math.round(mockStats[0].avgOverall || 0) : 0;
    const mockCount = mockStats.length > 0 ? mockStats[0].count : 0;

    // 5. Aptitude Test Mock Session Averages (MongoDB Aggregation scoped to TPO's college)
    const aptitudeStats = await AptitudeTestSession.aggregate([
      { $match: { mode: 'mock', completedAt: { $ne: null } } },
      studentLookupStage,
      studentMatchStage,
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$overallScore' },
          avgQuantitative: { $avg: '$categoryScores.quantitative' },
          avgLogical: { $avg: '$categoryScores.logical' },
          avgVerbal: { $avg: '$categoryScores.verbal' },
          avgCoreCS: { $avg: '$categoryScores.coreCS' },
          count: { $sum: 1 },
        },
      },
    ]);
    const avgAptitudeScore = aptitudeStats.length > 0 ? Math.round(aptitudeStats[0].avgScore || 0) : 0;
    const aptitudeCount = aptitudeStats.length > 0 ? aptitudeStats[0].count : 0;

    // 6. Portfolio Quality Averages (MongoDB Aggregation scoped to TPO's college)
    const portfolioStats = await Portfolio.aggregate([
      { $match: { qualityScore: { $ne: null, $gte: 0 } } },
      studentLookupStage,
      studentMatchStage,
      {
        $group: {
          _id: null,
          avgQuality: { $avg: '$qualityScore' },
          count: { $sum: 1 },
        },
      },
    ]);
    const avgPortfolioScore = portfolioStats.length > 0 ? Math.round(portfolioStats[0].avgQuality || 0) : 0;
    const portfolioCount = portfolioStats.length > 0 ? portfolioStats[0].count : 0;

    // 7. Coding Progress Averages (MongoDB Aggregation scoped to TPO's college)
    const codingStats = await CodingProgress.aggregate([
      { $match: { problemsSolved: { $gt: 0 } } },
      studentLookupStage,
      studentMatchStage,
      {
        $group: {
          _id: null,
          avgSolved: { $avg: '$problemsSolved' },
          avgAccuracy: { $avg: '$accuracyRate' },
          count: { $sum: 1 },
        },
      },
    ]);
    const avgCodingSolved = codingStats.length > 0 ? Math.round(codingStats[0].avgSolved || 0) : 0;
    const avgCodingAccuracy = codingStats.length > 0 ? Math.round(codingStats[0].avgAccuracy || 0) : 0;

    // 8. Most Common Weak Areas Diagnostics
    const mockRow = mockStats[0] || {};
    const aptRow = aptitudeStats[0] || {};

    const categoryBreakdown = [
      { key: 'posture', label: 'Posture & Physical Poise', score: mockRow.avgPosture != null ? Math.round(mockRow.avgPosture) : null, module: 'Interview' },
      { key: 'eyeContact', label: 'Eye Contact & Gaze Stability', score: mockRow.avgEyeContact != null ? Math.round(mockRow.avgEyeContact) : null, module: 'Interview' },
      { key: 'confidence', label: 'Voice Confidence & Fluency', score: mockRow.avgConfidence != null ? Math.round(mockRow.avgConfidence) : null, module: 'Interview' },
      { key: 'communication', label: 'Verbal Articulation & Conciseness', score: mockRow.avgComm != null ? Math.round(mockRow.avgComm) : null, module: 'Interview' },
      { key: 'technical', label: 'Technical Depth & Architecture', score: mockRow.avgTech != null ? Math.round(mockRow.avgTech) : null, module: 'Interview' },
      { key: 'quantitative', label: 'Quantitative & Math Aptitude', score: aptRow.avgQuantitative != null ? Math.round(aptRow.avgQuantitative) : null, module: 'Aptitude' },
      { key: 'logical', label: 'Logical & Analytical Reasoning', score: aptRow.avgLogical != null ? Math.round(aptRow.avgLogical) : null, module: 'Aptitude' },
      { key: 'verbal', label: 'Verbal English & Comprehension', score: aptRow.avgVerbal != null ? Math.round(aptRow.avgVerbal) : null, module: 'Aptitude' },
      { key: 'coreCS', label: 'Core Computer Science Fundamentals', score: aptRow.avgCoreCS != null ? Math.round(aptRow.avgCoreCS) : null, module: 'Aptitude' },
    ];

    const activeCategories = categoryBreakdown.filter((c) => c.score !== null);
    activeCategories.sort((a, b) => (a.score as number) - (b.score as number));
    const mostCommonWeakArea = activeCategories.length > 0 ? activeCategories[0] : null;

    // 9. Individual Student Readiness Computation & Distribution (Scoped to TPO's college)
    const students = await User.find(collegeStudentFilter)
      .select('name email college collegeName degree targetRole readinessScore dsaSolved mockInterviewsCompleted createdAt')
      .sort({ createdAt: -1 })
      .lean();

    let placementReadyCount = 0;
    let developingCount = 0;
    let needsSupportCount = 0;

    const studentRoster = await Promise.all(
      students.map(async (student) => {
        const sId = student._id;
        const stringId = sId.toString();

        const [resumeDoc, portfolioDoc, codingDoc, latestAptitude, mockSessions] = await Promise.all([
          Resume.findOne({ $or: [{ userId: sId }, { userId: stringId }] }).sort({ createdAt: -1 }).lean(),
          Portfolio.findOne({ $or: [{ userId: sId }, { userId: stringId }] }).sort({ createdAt: -1 }).lean(),
          CodingProgress.findOne({ $or: [{ userId: sId }, { userId: stringId }] }).lean(),
          AptitudeTestSession.findOne({
            $or: [{ userId: sId }, { userId: stringId }],
            mode: 'mock',
            completedAt: { $ne: null },
          }).sort({ completedAt: -1 }).lean(),
          MockInterviewSession.find({
            $or: [{ userId: sId }, { userId: stringId }],
            verdict: { $ne: 'Pending' },
          }).lean(),
        ]);

        const atsScore = resumeDoc && typeof resumeDoc.atsScore === 'number' ? resumeDoc.atsScore : null;
        const portfolioScore = portfolioDoc && typeof portfolioDoc.qualityScore === 'number' ? portfolioDoc.qualityScore : null;
        const codingSolved = codingDoc?.problemsSolved || 0;
        const codingAccuracy = codingDoc?.accuracyRate || 0;
        const hasCoding = codingDoc && (codingSolved > 0 || codingAccuracy > 0);
        const codingScore = hasCoding ? Math.min(100, Math.round(((codingSolved / 200) * 50) + (codingAccuracy * 0.5))) : null;
        const aptitudeScore = latestAptitude && typeof latestAptitude.overallScore === 'number' ? latestAptitude.overallScore : null;

        let mockAverage: number | null = null;
        if (mockSessions && mockSessions.length > 0) {
          const sum = mockSessions.reduce((acc: number, s: any) => acc + (s.overallScore || s.score || 0), 0);
          mockAverage = Math.round(sum / mockSessions.length);
        }

        // Weighted Readiness Calculation
        let scoreSum = 0;
        let weightSum = 0;

        if (mockAverage !== null) {
          scoreSum += mockAverage * 0.40;
          weightSum += 0.40;
        }
        if (atsScore !== null) {
          scoreSum += atsScore * 0.25;
          weightSum += 0.25;
        }
        if (portfolioScore !== null) {
          scoreSum += portfolioScore * 0.20;
          weightSum += 0.20;
        }
        if (codingScore !== null) {
          scoreSum += codingScore * 0.15;
          weightSum += 0.15;
        }
        if (aptitudeScore !== null) {
          scoreSum += aptitudeScore * 0.15;
          weightSum += 0.15;
        }

        const computedMatch = weightSum > 0 ? Math.min(100, Math.max(0, Math.round(scoreSum / weightSum))) : null;

        // Categorize
        if (computedMatch !== null && computedMatch >= 70) {
          placementReadyCount++;
        } else if (computedMatch !== null && computedMatch >= 40) {
          developingCount++;
        } else {
          needsSupportCount++;
        }

        return {
          id: stringId,
          name: student.name,
          email: student.email,
          college: student.collegeName || student.college || tpoCollegeName,
          degree: student.degree || 'B.Tech',
          targetRole: student.targetRole || 'Software Engineer',
          readinessScore: computedMatch,
          atsScore,
          portfolioScore,
          aptitudeScore,
          mockScore: mockAverage,
          mockCount: mockSessions ? mockSessions.length : 0,
          dsaSolved: codingSolved || student.dsaSolved || 0,
          status: computedMatch !== null && computedMatch >= 70 
            ? 'Placement Ready' 
            : (computedMatch !== null && computedMatch >= 40 ? 'Developing' : 'Needs Support'),
        };
      })
    );

    return res.status(200).json({
      success: true,
      college: tpoCollegeName,
      summary: {
        totalStudents,
        resumesEvaluated,
        mockInterviewsCompleted: mockCount,
        aptitudeTestsAttempted: aptitudeCount,
        portfoliosAudited: portfolioCount,
        averageScores: {
          resumeAts: avgResumeScore,
          mockInterview: avgMockScore,
          aptitudeTest: avgAptitudeScore,
          portfolioQuality: avgPortfolioScore,
          codingSolved: avgCodingSolved,
          codingAccuracy: avgCodingAccuracy,
        },
      },
      readinessDistribution: {
        placementReady: {
          count: placementReadyCount,
          percentage: totalStudents > 0 ? Math.round((placementReadyCount / totalStudents) * 100) : 0,
          label: 'Placement Ready (Score ≥ 70%)',
          color: 'emerald',
        },
        developing: {
          count: developingCount,
          percentage: totalStudents > 0 ? Math.round((developingCount / totalStudents) * 100) : 0,
          label: 'Developing (Score 40%–69%)',
          color: 'amber',
        },
        needsSupport: {
          count: needsSupportCount,
          percentage: totalStudents > 0 ? Math.round((needsSupportCount / totalStudents) * 100) : 0,
          label: 'Needs Support (Score < 40% / No Data)',
          color: 'rose',
        },
      },
      weakAreasDiagnostic: {
        mostCommonWeakArea: mostCommonWeakArea ? mostCommonWeakArea.label : null,
        lowestScore: mostCommonWeakArea ? mostCommonWeakArea.score : null,
        module: mostCommonWeakArea ? mostCommonWeakArea.module : null,
        categories: categoryBreakdown,
      },
      students: studentRoster,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error computing TPO batch analytics');
  }
});

/**
 * GET /api/tpo/experiences/pending
 * Protected, role === 'institution' only.
 * Returns all InterviewExperience documents with status: 'pending',
 * scoped to students from the logged-in TPO's own college,
 * sorted oldest first (FIFO), populated with the submitting student's name and college.
 */
tpoRouter.get('/experiences/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'institution') {
      return res.status(403).json({
        error: 'Access forbidden. Only registered Institution users / Training & Placement Officers can access the moderation queue.',
      });
    }

    // 1. Fetch TPO's own User document and validate collegeName
    const tpoContext = await getValidatedTpoCollege(req.user.userId, res);
    if (!tpoContext) return;
    const { tpoCollegeName } = tpoContext;

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // Find all students belonging to the TPO's college
      const collegeStudentDocs = await User.find({
        role: 'student' as const,
        $or: [{ collegeName: tpoCollegeName }, { college: tpoCollegeName }],
      })
        .select('_id')
        .lean();

      const collegeStudentIds = collegeStudentDocs.map((s) => s._id);

      const pendingDocs = await InterviewExperience.find({
        status: 'pending',
        studentId: { $in: collegeStudentIds },
      })
        .sort({ createdAt: 1 }) // Oldest first (FIFO queue)
        .populate('studentId', 'name email college collegeName degree targetRole')
        .lean();

      const formatted = pendingDocs.map((exp: any) => {
        const student = exp.studentId;
        return {
          ...exp,
          questionsAsked: normalizeInterviewQuestions(exp.questionsAsked),
          studentName: student?.name || 'Student Candidate',
          studentEmail: student?.email || '',
          studentCollege: student?.collegeName || student?.college || tpoCollegeName,
          studentDegree: student?.degree || 'B.Tech',
          studentTargetRole: student?.targetRole || exp.role,
        };
      });

      return res.json({
        success: true,
        college: tpoCollegeName,
        count: formatted.length,
        experiences: formatted,
      });
    } else {
      // In-memory fallback (scoped to TPO college)
      const pendingMem = inMemoryExperiences
        .filter((e) => e.status === 'pending')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const formatted = pendingMem.map((exp) => ({
        ...exp,
        questionsAsked: normalizeInterviewQuestions(exp.questionsAsked),
        studentName: 'Student Candidate',
        studentEmail: 'student@campus.edu',
        studentCollege: tpoCollegeName,
        studentDegree: 'B.Tech',
        studentTargetRole: exp.role,
      }));

      return res.json({
        success: true,
        college: tpoCollegeName,
        count: formatted.length,
        experiences: formatted,
      });
    }
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching pending interview experiences');
  }
});

/**
 * POST /api/tpo/experiences/:experienceId/review
 * Protected, role === 'institution' only.
 * Accepts { decision: 'approved' | 'rejected', reviewNote }
 * Updates experience status, reviewedBy, and reviewNote.
 * Ensures the TPO can ONLY review submissions from students of their own college.
 * Rejects if already reviewed (status !== 'pending').
 * Rejects if rejection without reviewNote (HTTP 400).
 */
tpoRouter.post('/experiences/:experienceId/review', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'institution') {
      return res.status(403).json({
        error: 'Access forbidden. Only registered Institution users / Training & Placement Officers can moderate submissions.',
      });
    }

    // 1. Fetch TPO's own User document and validate collegeName
    const tpoContext = await getValidatedTpoCollege(req.user.userId, res);
    if (!tpoContext) return;
    const { tpoCollegeName } = tpoContext;

    const { experienceId } = req.params;
    const { decision, reviewNote } = req.body;

    if (!experienceId) {
      return res.status(400).json({ error: 'Experience ID parameter is required' });
    }

    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return res.status(400).json({
        error: "Invalid review decision. Must be either 'approved' or 'rejected'.",
      });
    }

    // A rejection MUST include a review note to explain the reason to the student
    if (decision === 'rejected' && (!reviewNote || typeof reviewNote !== 'string' || !reviewNote.trim())) {
      return res.status(400).json({
        error: 'A review note is required when rejecting a submission so the student understands the feedback.',
      });
    }

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      if (!mongoose.Types.ObjectId.isValid(experienceId)) {
        return res.status(400).json({ error: 'Invalid interview experience ID format' });
      }

      const experience = await InterviewExperience.findById(experienceId);
      if (!experience) {
        return res.status(404).json({ error: 'Interview experience not found' });
      }

      // Verify that the submitting student belongs to the TPO's own college
      const submittingStudent = await User.findById(experience.studentId);
      const studentCollege = (submittingStudent?.collegeName || submittingStudent?.college || '').trim();
      if (!submittingStudent || studentCollege.toLowerCase() !== tpoCollegeName.toLowerCase()) {
        return res.status(403).json({
          error: `Access forbidden. You can only moderate interview experiences submitted by students from your own institution (${tpoCollegeName}).`,
        });
      }

      // Ensure single-review policy
      if (experience.status !== 'pending') {
        return res.status(400).json({
          error: `This interview experience has already been reviewed (current status: ${experience.status}). Submissions can only be reviewed once.`,
        });
      }

      experience.status = decision;
      experience.reviewedBy = new mongoose.Types.ObjectId(req.user.userId);
      experience.reviewNote = reviewNote && typeof reviewNote === 'string' ? reviewNote.trim() : null;
      await experience.save();

      return res.json({
        success: true,
        message: `Interview experience has been successfully ${decision}.`,
        experience,
      });
    } else {
      // In-memory fallback
      const expIndex = inMemoryExperiences.findIndex((e) => String(e._id) === String(experienceId));
      if (expIndex === -1) {
        return res.status(404).json({ error: 'Interview experience not found' });
      }

      const exp = inMemoryExperiences[expIndex];
      if (exp.status !== 'pending') {
        return res.status(400).json({
          error: `This interview experience has already been reviewed (current status: ${exp.status}). Submissions can only be reviewed once.`,
        });
      }

      exp.status = decision;
      exp.reviewedBy = req.user.userId;
      exp.reviewNote = reviewNote && typeof reviewNote === 'string' ? reviewNote.trim() : null;
      exp.updatedAt = new Date();

      return res.json({
        success: true,
        message: `Interview experience has been successfully ${decision}.`,
        experience: exp,
      });
    }
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error moderating interview experience');
  }
});

/**
 * GET /api/tpo/students/:studentId/profile
 * Protected, role === 'institution' only.
 * Returns comprehensive student profile details including:
 * - Student info
 * - Latest Resume analysis (score, skills, missing skills, etc.)
 * - Latest Portfolio analysis (quality score, githubUrl, auditedProjects, strengths, recommendations)
 * - All Certifications grouped by category (Global, National, Local/College, Other)
 * - Badges and badge count
 *
 * Verifies that the student's college matches the TPO's own college.
 */
tpoRouter.get('/students/:studentId/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'institution') {
      return res.status(403).json({
        error: 'Access forbidden. Only registered Institution users / Training & Placement Officers can access student profile details.',
      });
    }

    // 1. Fetch TPO's own User document and validate collegeName
    const tpoContext = await getValidatedTpoCollege(req.user.userId, res);
    if (!tpoContext) return;
    const { tpoCollegeName } = tpoContext;

    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID parameter is required' });
    }

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      let userObjId: any = studentId;
      try {
        userObjId = new mongoose.Types.ObjectId(studentId);
      } catch {
        userObjId = studentId;
      }

      // Fetch the target student
      const student = await User.findById(studentId).lean();
      if (!student || student.role !== 'student') {
        return res.status(404).json({ error: 'Student record not found.' });
      }

      const studentCollege = (student.collegeName || student.college || '').trim();
      if (studentCollege.toLowerCase() !== tpoCollegeName.toLowerCase()) {
        return res.status(403).json({
          error: `Access forbidden. You can only view profiles of students from your own institution (${tpoCollegeName}).`,
        });
      }

      // Fetch student data in parallel
      const [resumeDoc, portfolioDoc, certificationsDocs, badgesDocs] = await Promise.all([
        Resume.findOne({ $or: [{ userId: userObjId }, { userId: String(studentId) }] } as any)
          .sort({ createdAt: -1 })
          .lean(),
        Portfolio.findOne({ $or: [{ userId: userObjId }, { userId: String(studentId) }] } as any)
          .sort({ createdAt: -1 })
          .lean(),
        Certification.find({ $or: [{ userId: userObjId }, { userId: String(studentId) }] } as any)
          .sort({ addedAt: -1, createdAt: -1 })
          .lean(),
        Badge.find({ $or: [{ userId: userObjId }, { userId: String(studentId) }] } as any)
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      const groupedCertifications: Record<'Global' | 'National' | 'Local/College' | 'Other', any[]> = {
        Global: [],
        National: [],
        'Local/College': [],
        Other: [],
      };

      (certificationsDocs || []).forEach((cert: any) => {
        const cat = (cert.category as 'Global' | 'National' | 'Local/College' | 'Other') || 'Other';
        if (groupedCertifications[cat]) {
          groupedCertifications[cat].push(cert);
        } else {
          groupedCertifications.Other.push(cert);
        }
      });

      return res.status(200).json({
        success: true,
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          college: studentCollege,
          degree: student.degree || 'B.Tech',
          targetRole: student.targetRole || 'Software Engineer',
        },
        resume: resumeDoc
          ? {
              atsScore: typeof resumeDoc.atsScore === 'number' ? resumeDoc.atsScore : null,
              fileName: resumeDoc.fileName || 'Resume.pdf',
              skillsFound: resumeDoc.skillsFound || [],
              missingSkills: resumeDoc.missingSkills || [],
              formattingScore: typeof resumeDoc.formattingScore === 'number' ? resumeDoc.formattingScore : null,
              quantifiedImpactScore:
                typeof resumeDoc.quantifiedImpactScore === 'number' ? resumeDoc.quantifiedImpactScore : null,
              keywordMatchPct: typeof resumeDoc.keywordMatchPct === 'number' ? resumeDoc.keywordMatchPct : null,
              suggestions: resumeDoc.suggestions || [],
              feedback: resumeDoc.feedback || '',
              targetRole: resumeDoc.targetRole || '',
              createdAt: resumeDoc.createdAt,
            }
          : null,
        portfolio: portfolioDoc
          ? {
              qualityScore: typeof portfolioDoc.qualityScore === 'number' ? portfolioDoc.qualityScore : null,
              githubUrl: portfolioDoc.githubUrl || '',
              githubUsername: portfolioDoc.githubUsername || '',
              feedback: portfolioDoc.feedback || '',
              strengths: portfolioDoc.strengths || [],
              recommendations: portfolioDoc.recommendations || [],
              auditedProjects: portfolioDoc.auditedProjects || [],
              createdAt: portfolioDoc.createdAt,
            }
          : null,
        certifications: certificationsDocs || [],
        groupedCertifications,
        badgeCount: badgesDocs ? badgesDocs.length : 0,
        badges: badgesDocs || [],
      });
    } else {
      // In-memory fallback
      return res.status(200).json({
        success: true,
        student: {
          id: studentId,
          name: 'Student Candidate',
          email: 'student@campus.edu',
          college: tpoCollegeName,
          degree: 'B.Tech',
          targetRole: 'Software Engineer',
        },
        resume: null,
        portfolio: null,
        certifications: [],
        groupedCertifications: {
          Global: [],
          National: [],
          'Local/College': [],
          Other: [],
        },
        badgeCount: 0,
        badges: [],
      });
    }
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching student profile details');
  }
});

/**
 * GET /api/tpo/placements
 * Protected, role === 'institution' only.
 * Scoped strictly to the logged-in TPO's college.
 * Returns:
 * - placementRate: percentage of unique students in this college who have at least one application with status 'Offer'
 * - totalApplications, totalOffers, totalStudentsPlaced (unique count)
 * - byCompany: array of { company, applicantCount, offerCount } aggregated from the applications (sorted most offers first)
 * - byType: counts split between 'Job' and 'Internship' application types
 * - recentPlacements: the most recent applications with status 'Offer', populated with student name and college, sorted newest first, limited to 20
 */
tpoRouter.get('/placements', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'institution') {
      return res.status(403).json({
        error: 'Access forbidden. Only registered Institution users / Training & Placement Officers can access placement records.',
      });
    }

    // 1. Fetch TPO's own User document and validate collegeName
    const tpoContext = await getValidatedTpoCollege(req.user.userId, res);
    if (!tpoContext) return;
    const { tpoCollegeName } = tpoContext;

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // Find all students belonging to the TPO's college
      const collegeStudentDocs = await User.find({
        role: 'student' as const,
        $or: [{ collegeName: tpoCollegeName }, { college: tpoCollegeName }],
      })
        .select('_id name email college collegeName degree targetRole')
        .lean();

      const totalStudentsCount = collegeStudentDocs.length;
      const collegeStudentIds = collegeStudentDocs.map((s) => s._id);

      if (collegeStudentIds.length === 0) {
        return res.json({
          success: true,
          college: tpoCollegeName,
          placementRate: 0,
          totalApplications: 0,
          totalOffers: 0,
          totalStudentsPlaced: 0,
          totalStudents: 0,
          byCompany: [],
          byType: { job: 0, internship: 0, Job: 0, Internship: 0 },
          recentPlacements: [],
        });
      }

      // Support both ObjectId and string representation for robust matching
      const stringIds = collegeStudentIds.map((id) => String(id));
      const objectIds = collegeStudentIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const studentMap = new Map<string, any>();
      collegeStudentDocs.forEach((s) => {
        studentMap.set(String(s._id), s);
      });

      // Find all JobApplication documents where userId is in that set of student IDs
      const applications = await JobApplication.find({
        userId: { $in: [...objectIds, ...stringIds] },
      })
        .sort({ createdAt: -1 })
        .lean();

      // Offer status helper
      const isOfferStatus = (status?: string): boolean => {
        if (!status) return false;
        const s = status.trim().toLowerCase();
        return s === 'offer' || s === 'offer received' || s === 'offered' || s === 'accepted';
      };

      const placedStudentIdSet = new Set<string>();
      let totalOffers = 0;
      const byType = {
        job: 0,
        internship: 0,
        Job: 0,
        Internship: 0,
      };

      const companyMap = new Map<string, { company: string; applicants: Set<string>; offerCount: number }>();
      const offerApplications: any[] = [];

      for (const app of applications) {
        const applicantId = String(app.userId);
        const isOffer = isOfferStatus(app.status);

        // Application type tracking
        const appType = (app.type || 'Job').trim().toLowerCase();
        if (appType === 'internship') {
          byType.internship++;
          byType.Internship++;
        } else {
          byType.job++;
          byType.Job++;
        }

        // Company aggregation
        const companyName = (app.company || 'Direct Partner').trim();
        let cStats = companyMap.get(companyName);
        if (!cStats) {
          cStats = { company: companyName, applicants: new Set<string>(), offerCount: 0 };
          companyMap.set(companyName, cStats);
        }
        cStats.applicants.add(applicantId);

        if (isOffer) {
          totalOffers++;
          placedStudentIdSet.add(applicantId);
          cStats.offerCount++;
          offerApplications.push(app);
        }
      }

      const totalStudentsPlaced = placedStudentIdSet.size;
      const placementRate = totalStudentsCount > 0
        ? Math.round((totalStudentsPlaced / totalStudentsCount) * 100)
        : 0;

      // Ranked by most offers first, then most applicants
      const byCompany = Array.from(companyMap.values())
        .map((c) => ({
          company: c.company,
          applicantCount: c.applicants.size,
          offerCount: c.offerCount,
        }))
        .sort((a, b) => {
          if (b.offerCount !== a.offerCount) {
            return b.offerCount - a.offerCount;
          }
          return b.applicantCount - a.applicantCount;
        });

      // Recent placements (limited to 20, sorted newest first)
      const recentPlacements = offerApplications.slice(0, 20).map((app) => {
        const student = studentMap.get(String(app.userId));
        return {
          id: String(app._id),
          company: app.company,
          role: app.role,
          type: app.type || 'Job',
          status: app.status || 'Offer',
          studentName: student?.name || 'Student Candidate',
          studentEmail: student?.email || '',
          studentCollege: student?.collegeName || student?.college || tpoCollegeName,
          studentDegree: student?.degree || 'B.Tech',
          studentTargetRole: student?.targetRole || app.role,
          date: app.appliedAt || (app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : 'Recently'),
          createdAt: app.createdAt,
        };
      });

      return res.json({
        success: true,
        college: tpoCollegeName,
        placementRate,
        totalApplications: applications.length,
        totalOffers,
        totalStudentsPlaced,
        totalStudents: totalStudentsCount,
        byCompany,
        byType,
        recentPlacements,
      });
    } else {
      // In-memory fallback
      return res.json({
        success: true,
        college: tpoCollegeName,
        placementRate: 0,
        totalApplications: 0,
        totalOffers: 0,
        totalStudentsPlaced: 0,
        totalStudents: 0,
        byCompany: [],
        byType: { job: 0, internship: 0, Job: 0, Internship: 0 },
        recentPlacements: [],
      });
    }
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error computing placement records');
  }
});

/**
 * GET /api/tpo/companies
 * Protected, role === 'institution' only.
 * Scoped strictly to the logged-in TPO's college.
 * Returns all companies engaging with the college's students via applications,
 * along with recruiter contact info where available.
 */
tpoRouter.get('/companies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'institution') {
      return res.status(403).json({
        error:
          'Access forbidden. Only registered Institution users / Training & Placement Officers can access company engagement records.',
      });
    }

    // 1. Fetch TPO's own User document and validate collegeName
    const tpoContext = await getValidatedTpoCollege(req.user.userId, res);
    if (!tpoContext) return;
    const { tpoCollegeName } = tpoContext;

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // Find all students belonging to the TPO's college
      const collegeStudentDocs = await User.find({
        role: 'student' as const,
        $or: [{ collegeName: tpoCollegeName }, { college: tpoCollegeName }],
      })
        .select('_id name email college collegeName degree targetRole')
        .lean();

      const totalStudentsCount = collegeStudentDocs.length;
      const collegeStudentIds = collegeStudentDocs.map((s) => s._id);

      if (collegeStudentIds.length === 0) {
        return res.json({
          success: true,
          college: tpoCollegeName,
          totalCompanies: 0,
          totalApplicants: 0,
          totalOffers: 0,
          totalStudents: 0,
          companies: [],
        });
      }

      // Support both ObjectId and string representation for robust matching
      const stringIds = collegeStudentIds.map((id) => String(id));
      const objectIds = collegeStudentIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      // Find all JobApplication documents where userId is in that set of student IDs
      const applications = await JobApplication.find({
        userId: { $in: [...objectIds, ...stringIds] },
      })
        .sort({ createdAt: -1 })
        .lean();

      // Offer status helper
      const isOfferStatus = (status?: string): boolean => {
        if (!status) return false;
        const s = status.trim().toLowerCase();
        return s === 'offer' || s === 'offer received' || s === 'offered' || s === 'accepted';
      };

      // Query recruiter accounts (role === 'industry') to link contact info
      // STRICT SECURITY: explicitly project ONLY public/safe contact fields. NEVER password, tokens, etc.
      const recruiterDocs = await User.find({
        role: 'industry',
      })
        .select('_id name email company designation department phone linkedinUrl bio industryExperience')
        .lean();

      // Map recruiters by normalized lowercase company name
      const recruiterMap = new Map<string, any>();
      for (const rec of recruiterDocs) {
        if (rec.company && rec.company.trim()) {
          const normKey = rec.company.trim().toLowerCase();
          // Store first matching or prefer one with designation/email
          if (!recruiterMap.has(normKey) || (!recruiterMap.get(normKey).designation && rec.designation)) {
            recruiterMap.set(normKey, {
              id: String(rec._id),
              name: rec.name,
              email: rec.email,
              company: rec.company,
              designation: rec.designation || 'Talent Acquisition & Campus Recruiter',
              department: rec.department || 'Human Resources',
              phone: rec.phone || '',
              linkedinUrl: rec.linkedinUrl || '',
              bio: rec.bio || '',
            });
          }
        }
      }

      // Aggregate all companies
      const companyMap = new Map<
        string,
        {
          company: string;
          applicants: Set<string>;
          totalApplications: number;
          offerCount: number;
          roles: Set<string>;
          statusBreakdown: Record<string, number>;
          latestApplicationDate: string;
        }
      >();

      const overallApplicantsSet = new Set<string>();
      let overallOfferCount = 0;

      for (const app of applications) {
        const applicantId = String(app.userId);
        const companyName = (app.company || 'Direct Partner').trim();
        const isOffer = isOfferStatus(app.status);
        const rawStatus = (app.status || 'Under Review').trim();

        overallApplicantsSet.add(applicantId);
        if (isOffer) overallOfferCount++;

        let cStats = companyMap.get(companyName);
        if (!cStats) {
          cStats = {
            company: companyName,
            applicants: new Set<string>(),
            totalApplications: 0,
            offerCount: 0,
            roles: new Set<string>(),
            statusBreakdown: {},
            latestApplicationDate: '',
          };
          companyMap.set(companyName, cStats);
        }

        cStats.applicants.add(applicantId);
        cStats.totalApplications++;
        if (app.role) {
          cStats.roles.add(app.role.trim());
        }
        cStats.statusBreakdown[rawStatus] = (cStats.statusBreakdown[rawStatus] || 0) + 1;

        if (isOffer) {
          cStats.offerCount++;
        }

        const appDate =
          app.appliedAt || (app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : '');
        if (appDate && (!cStats.latestApplicationDate || String(appDate) > cStats.latestApplicationDate)) {
          cStats.latestApplicationDate = String(appDate);
        }
      }

      // Format companies list, find matched recruiter, compute conversion rate, sort by applicant count desc
      const companiesList = Array.from(companyMap.values())
        .map((c) => {
          const applicantCount = c.applicants.size;
          const offerCount = c.offerCount;
          const conversionRate =
            applicantCount > 0 ? Math.round((offerCount / applicantCount) * 100) : 0;

          // Attempt case-insensitive match against recruiterMap
          const normName = c.company.toLowerCase();
          let matchedRecruiter = recruiterMap.get(normName) || null;

          // If not exact match, attempt substring match (e.g. "Google India" vs "Google")
          if (!matchedRecruiter) {
            for (const [key, rec] of recruiterMap.entries()) {
              if (key === normName || normName.includes(key) || key.includes(normName)) {
                matchedRecruiter = rec;
                break;
              }
            }
          }

          return {
            company: c.company,
            applicantCount,
            totalApplications: c.totalApplications,
            offerCount,
            conversionRate,
            roles: Array.from(c.roles),
            statusBreakdown: c.statusBreakdown,
            latestApplicationDate: c.latestApplicationDate,
            recruiter: matchedRecruiter
              ? {
                  id: matchedRecruiter.id,
                  name: matchedRecruiter.name,
                  email: matchedRecruiter.email,
                  company: matchedRecruiter.company,
                  designation: matchedRecruiter.designation,
                  department: matchedRecruiter.department,
                  phone: matchedRecruiter.phone,
                  linkedinUrl: matchedRecruiter.linkedinUrl,
                }
              : null,
          };
        })
        .sort((a, b) => {
          if (b.applicantCount !== a.applicantCount) {
            return b.applicantCount - a.applicantCount;
          }
          if (b.offerCount !== a.offerCount) {
            return b.offerCount - a.offerCount;
          }
          return a.company.localeCompare(b.company);
        });

      return res.json({
        success: true,
        college: tpoCollegeName,
        totalCompanies: companiesList.length,
        totalApplicants: overallApplicantsSet.size,
        totalOffers: overallOfferCount,
        totalStudents: totalStudentsCount,
        companies: companiesList,
      });
    } else {
      // In-memory fallback
      return res.json({
        success: true,
        college: tpoCollegeName,
        totalCompanies: 0,
        totalApplicants: 0,
        totalOffers: 0,
        totalStudents: 0,
        companies: [],
      });
    }
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error computing company engagement records');
  }
});

