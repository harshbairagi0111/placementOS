import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { JobPosting } from '../src/models/JobPosting';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { Badge } from '../src/models/Badge';
import { Resume } from '../src/models/Resume';
import { Portfolio } from '../src/models/Portfolio';
import { Certification } from '../src/models/Certification';
import { JobApplication, JOB_APPLICATION_STATUSES, normalizeJobApplicationStatus } from '../src/models/JobApplication';
import { LearningProgram } from '../src/models/LearningProgram';
import { LearningProgramApplication } from '../src/models/LearningProgramApplication';
import { AcademicOpportunity, AcademicOpportunityType } from '../src/models/AcademicOpportunity';
import { StudentSkillProfile } from '../src/models/StudentSkillProfile';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { getStudentRecommendedOpportunities } from './students';
import { getDigitalStudentPortfolio, getLatestGitHubPortfolioAudit } from '../src/lib/portfolioService';
import {
  calculateRoleMatch,
  getMatchCategory,
  evaluateCandidateJobMatch,
  rankCandidatesForJob,
  CandidateJobMatchItem,
} from '../src/lib/skillGapService';

export const recruitersRouter = Router();

// GET /api/jobs/recommended (and /api/recruiters/jobs/recommended)
recruitersRouter.get('/jobs/recommended', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }

    const data = await getStudentRecommendedOpportunities(userId, {
      type: req.query.type as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
    });

    return res.json(data);
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching recommendations');
  }
});

// GET /api/jobs (and /api/recruiters/jobs)
recruitersRouter.get('/jobs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    let jobs: any[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = recruiterId;
        try {
          if (recruiterId) userObjId = new mongoose.Types.ObjectId(recruiterId);
        } catch {
          userObjId = recruiterId;
        }

        const filter = recruiterId
          ? { $or: [{ recruiterId }, { recruiterId: userObjId }, { recruiterId: { $exists: false } }] }
          : {};

        const dbJobs = await JobPosting.find(filter).sort({ createdAt: -1 });
        if (dbJobs.length > 0) {
          jobs = dbJobs.map((j) => ({
            id: j._id,
            _id: j._id,
            recruiterId: j.recruiterId,
            company: j.company,
            title: j.title,
            type: j.type || 'Job',
            ctc: j.ctc,
            stipend: j.stipend,
            duration: j.duration,
            applicants: j.applicantsCount || 0,
            openPositions: j.openPositions || 1,
            cutoffPct: j.cutoffPct || 75,
            status: j.status || 'Active',
            requiredSkills: j.requiredSkills && j.requiredSkills.length > 0
              ? j.requiredSkills
              : ['Node.js', 'PostgreSQL', 'System Design'],
            createdAt: j.createdAt,
          }));
        }
      } catch (dbErr) {
        console.warn('MongoDB query error in GET /jobs:', dbErr);
      }
    }

    if (jobs.length === 0) {
      jobs = [
        { id: 'j_1', _id: 'j_1', company: 'Razorpay', title: 'Backend Engineer 1', type: 'Job', ctc: '₹20.5 LPA', openPositions: 3, applicants: 98, cutoffPct: 80, status: 'Active', requiredSkills: ['Node.js', 'PostgreSQL', 'System Design', 'Go', 'Docker'] },
        { id: 'j_2', _id: 'j_2', company: 'Razorpay', title: 'SDE 1 / Backend', type: 'Job', ctc: '₹18.0 LPA', openPositions: 5, applicants: 142, cutoffPct: 75, status: 'Active', requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'] },
        { id: 'j_3', _id: 'j_3', company: 'Razorpay', title: 'Frontend Engineer', type: 'Job', ctc: '₹18.5 LPA', openPositions: 2, applicants: 64, cutoffPct: 80, status: 'Active', requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind'] },
        { id: 'j_4', _id: 'j_4', company: 'Razorpay', title: 'AI / Machine Learning Engineer', type: 'Job', ctc: '₹22.0 LPA', openPositions: 2, applicants: 45, cutoffPct: 85, status: 'Active', requiredSkills: ['PyTorch', 'Python', 'LLMs', 'FastAPI'] },
      ];
    }

    return res.status(200).json({ success: true, jobs });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching jobs');
  }
});

// POST /api/jobs (and /api/recruiters/jobs)
recruitersRouter.post('/jobs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { company, title, ctc, openPositions, cutoffPct, requiredSkills, description, location, type, stipend, duration } = req.body;

    let createdJob: any = null;

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills
      : typeof requiredSkills === 'string'
      ? requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
      : ['Node.js', 'PostgreSQL', 'System Design'];

    const validTypes = ['Job', 'Internship', 'Apprenticeship'];
    const postingType: 'Job' | 'Internship' | 'Apprenticeship' = validTypes.includes(type) ? type : 'Job';

    if (mongoose.connection.readyState === 1) {
      const newJob = await JobPosting.create({
        recruiterId,
        company: company || 'Razorpay Tech Hiring',
        title: title || 'Software Development Engineer',
        type: postingType,
        ctc: ctc || (postingType === 'Job' ? '₹18 LPA' : (stipend || 'Competitive Stipend')),
        stipend: stipend ? String(stipend).trim() : undefined,
        duration: duration ? String(duration).trim() : undefined,
        openPositions: Number(openPositions) || 1,
        cutoffPct: Number(cutoffPct) || 75,
        requiredSkills: skillsArray,
        description: description || '',
        location: location || 'Remote / Hybrid',
        status: 'Active',
      });

      createdJob = {
        id: newJob._id,
        _id: newJob._id,
        recruiterId: newJob.recruiterId,
        company: newJob.company,
        title: newJob.title,
        type: newJob.type,
        ctc: newJob.ctc,
        stipend: newJob.stipend,
        duration: newJob.duration,
        openPositions: newJob.openPositions,
        cutoffPct: newJob.cutoffPct,
        requiredSkills: newJob.requiredSkills,
        status: newJob.status,
        applicants: 0,
      };
    } else {
      createdJob = {
        id: `j_${Date.now()}`,
        _id: `j_${Date.now()}`,
        recruiterId,
        company: company || 'Razorpay Tech Hiring',
        title: title || 'Software Development Engineer',
        type: postingType,
        ctc: ctc || (postingType === 'Job' ? '₹18 LPA' : (stipend || 'Competitive Stipend')),
        stipend: stipend ? String(stipend).trim() : undefined,
        duration: duration ? String(duration).trim() : undefined,
        openPositions: Number(openPositions) || 1,
        cutoffPct: Number(cutoffPct) || 75,
        requiredSkills: skillsArray,
        status: 'Active',
        applicants: 0,
      };
    }

    return res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job: createdJob,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error creating job');
  }
});

// PATCH /api/jobs/:jobId (and /api/recruiters/jobs/:jobId)
// Updates an existing job posting owned by the authenticated recruiter with strict field allowlisting
recruitersRouter.patch('/jobs/:jobId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Job posting updated successfully (demo mode)',
        job: { id: jobId, _id: jobId, ...req.body, recruiterId },
      });
    }

    let jobObjId: any = jobId;
    try {
      if (mongoose.Types.ObjectId.isValid(jobId)) {
        jobObjId = new mongoose.Types.ObjectId(jobId);
      }
    } catch {
      jobObjId = jobId;
    }

    const job = await JobPosting.findOne({
      $or: [{ _id: jobObjId }, { _id: jobId }],
    });

    if (!job) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    // Strict ownership verification: must match authenticated recruiter
    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this job posting' });
    }

    // Explicit field allowlist - NEVER allow mass assignment of recruiterId, applicantsCount, _id, createdAt, etc.
    const { title, description, company, type, ctc, stipend, duration, openPositions, cutoffPct, requiredSkills, location, status } = req.body;

    if (title !== undefined) job.title = String(title).trim();
    if (description !== undefined) job.description = String(description).trim();
    if (company !== undefined) job.company = String(company).trim();
    if (type !== undefined && ['Job', 'Internship', 'Apprenticeship'].includes(type)) job.type = type;
    if (ctc !== undefined) job.ctc = String(ctc).trim();
    if (stipend !== undefined) job.stipend = String(stipend).trim();
    if (duration !== undefined) job.duration = String(duration).trim();
    if (openPositions !== undefined) job.openPositions = Math.max(1, Number(openPositions) || 1);
    if (cutoffPct !== undefined) job.cutoffPct = Math.min(100, Math.max(0, Number(cutoffPct) || 75));
    if (requiredSkills !== undefined) {
      if (Array.isArray(requiredSkills)) {
        job.requiredSkills = requiredSkills.map((s) => String(s).trim()).filter(Boolean);
      }
    }
    if (location !== undefined) job.location = String(location).trim();
    if (status !== undefined && ['Active', 'Closed', 'Draft'].includes(status)) job.status = status;

    await job.save();

    return res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating job');
  }
});

/**
 * Deterministically ranks candidates against a specific job opportunity.
 * (PlacementOS SIH 2026 FIX #4)
 *
 * Strict Recruiter Ownership Check:
 * - Only the recruiter who owns the JobPosting may access ranked candidates.
 * - Centralized scoring via calculateRoleMatch ensures candidate match percentage
 *   is identical to student-side opportunity recommendation match percentage.
 */
export async function getCandidatesRankedForJob(
  jobId: string,
  recruiterId: string,
  options?: {
    scope?: 'applicants' | 'all';
    search?: string;
    limit?: number;
  }
): Promise<{
  status: number;
  success: boolean;
  error?: string;
  job?: any;
  totalCandidates?: number;
  applicantsCount?: number;
  candidates?: CandidateJobMatchItem[];
  message?: string;
}> {
  if (mongoose.connection.readyState !== 1) {
    return {
      status: 200,
      success: true,
      job: { id: jobId, _id: jobId, title: 'Requisition', requiredSkills: [] },
      totalCandidates: 0,
      applicantsCount: 0,
      candidates: [],
      message: 'Database connection not ready (demo mode)',
    };
  }

  let jobObjId: any = jobId;
  try {
    if (mongoose.Types.ObjectId.isValid(jobId)) {
      jobObjId = new mongoose.Types.ObjectId(jobId);
    }
  } catch {
    jobObjId = jobId;
  }

  // 1. Fetch JobPosting
  const job = await JobPosting.findOne({
    $or: [{ _id: jobObjId }, { _id: jobId }],
  });

  if (!job) {
    return { status: 404, success: false, error: 'Job opportunity not found' };
  }

  // 2. Strict Recruiter Ownership Check
  const recruiterIdStr = recruiterId.toString();
  const jobRecruiterIdStr = job.recruiterId ? job.recruiterId.toString() : '';

  if (jobRecruiterIdStr && jobRecruiterIdStr !== recruiterIdStr) {
    return {
      status: 403,
      success: false,
      error: 'Forbidden: You do not have permission to view candidate rankings for this job requisition',
    };
  }

  // 3. Fetch applications specifically for this job
  const jobKeyList = [job._id, job._id.toString(), jobId];
  const applications = await JobApplication.find({
    jobPostingId: { $in: jobKeyList },
  });

  const appMap = new Map<string, any>();
  applications.forEach((app) => {
    if (app.userId) {
      appMap.set(app.userId.toString(), app);
    }
  });

  // 4. Determine student candidate pool
  let students: any[] = [];
  if (options?.scope === 'applicants') {
    const applicantUserIds = applications
      .map((a) => a.userId)
      .filter(Boolean)
      .map((id) => {
        try {
          return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
        } catch {
          return id;
        }
      });

    if (applicantUserIds.length > 0) {
      students = await User.find({ _id: { $in: applicantUserIds } });
    }
  } else {
    // All candidates pool: retrieve the eligible candidate pool (bounded to safe cap of 300 to avoid memory exhaustion)
    // and guarantee all actual applicants are included in the pool before ranking
    const CANDIDATE_POOL_CAP = 300;
    students = await User.find({ role: 'student' }).limit(CANDIDATE_POOL_CAP);

    const applicantUserIds = applications.map((a) => a.userId?.toString()).filter(Boolean);
    const existingStudentIdSet = new Set(students.map((s) => s._id.toString()));
    const missingApplicantIds = applicantUserIds.filter((id) => !existingStudentIdSet.has(id));

    if (missingApplicantIds.length > 0) {
      const missingStudents = await User.find({
        _id: { $in: missingApplicantIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
      students = [...missingStudents, ...students];
    }
  }

  const jobRequiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
  const hasConfiguredRequirements = jobRequiredSkills.length > 0;

  if (students.length === 0) {
    return {
      status: 200,
      success: true,
      job: {
        id: job._id.toString(),
        _id: job._id.toString(),
        title: job.title,
        company: job.company,
        type: job.type,
        status: job.status,
        cutoffPct: job.cutoffPct,
        openPositions: job.openPositions,
        requiredSkills: jobRequiredSkills,
        hasRequirements: hasConfiguredRequirements,
      },
      totalCandidates: 0,
      applicantsCount: applications.length,
      candidates: [],
      message:
        options?.scope === 'applicants'
          ? 'No applications received for this job opportunity yet.'
          : 'No student candidates available in the talent pool.',
    };
  }

  // 5. Fetch StudentSkillProfile for all candidate students in single batch query
  const studentIds = students.map((s) => s._id);
  const studentIdStrings = students.map((s) => s._id.toString());
  const allIdQueries = Array.from(new Set([...studentIds, ...studentIdStrings]));

  const profiles = await StudentSkillProfile.find({
    userId: { $in: allIdQueries },
  });

  const profileMap = new Map<string, any>();
  profiles.forEach((p) => {
    profileMap.set(String(p.userId), p);
  });

  // 6. Aggregate MockInterview scores, resumes, badges and evaluate match
  const evaluatedCandidates: CandidateJobMatchItem[] = await Promise.all(
    students.map(async (student) => {
      const studentIdStr = student._id.toString();
      const profile = profileMap.get(studentIdStr) || profileMap.get(String(student._id));
      const existingApp = appMap.get(studentIdStr);

      const assessedSkills = profile
        ? [...(profile.technicalSkills || []), ...(profile.softSkills || [])]
        : [];

      let skills = (profile && profile.technicalSkills)
        ? profile.technicalSkills.map((s: any) => s.skill)
        : [];

      let atsMatch = 0;
      try {
        const latestResume = await Resume.findOne({
          $or: [{ userId: student._id }, { userId: studentIdStr }],
        }).sort({ createdAt: -1 });

        if (latestResume) {
          if (latestResume.skillsFound && latestResume.skillsFound.length > 0 && skills.length === 0) {
            skills = latestResume.skillsFound;
          }
          if (typeof latestResume.atsScore === 'number') {
            atsMatch = latestResume.atsScore;
          }
        }
      } catch {}

      let readinessScore = student.readinessScore || 0;
      try {
        const scoreAgg = await MockInterviewSession.aggregate([
          {
            $match: {
              $or: [{ userId: student._id }, { userId: studentIdStr }],
              verdict: { $ne: 'Pending' },
            },
          },
          {
            $group: {
              _id: null,
              avgScore: { $avg: { $ifNull: ['$overallScore', '$score'] } },
            },
          },
        ]);
        if (scoreAgg.length > 0 && typeof scoreAgg[0].avgScore === 'number') {
          readinessScore = Math.round(scoreAgg[0].avgScore);
        }
      } catch {}

      let badgeCount = 0;
      try {
        badgeCount = await Badge.countDocuments({
          $or: [{ userId: student._id }, { userId: studentIdStr }],
        });
      } catch {}

      const candidateInfo = {
        id: studentIdStr,
        name: student.name || 'Candidate',
        college: student.college || student.collegeName || 'Engineering College',
        role: student.targetRole || '',
        readinessScore: readinessScore || student.readinessScore || 0,
        dsaSolved: student.dsaSolved || 0,
        badgeCount,
        atsMatch: atsMatch || Math.min(98, Math.round((readinessScore || 70) * 1.05)),
        skills,
      };

      return evaluateCandidateJobMatch(
        assessedSkills,
        jobRequiredSkills,
        candidateInfo,
        {
          hasAssessedSkills: Boolean(profile && assessedSkills.length > 0),
          application: existingApp,
        }
      );
    })
  );

  // 7. Deterministically rank candidates via centralized ranking function
  let ranked = rankCandidatesForJob(evaluatedCandidates);

  // 8. Apply search keyword if provided
  if (options?.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    ranked = ranked.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const collegeMatch = (c.college || '').toLowerCase().includes(q);
      const roleMatch = (c.targetRole || c.role || '').toLowerCase().includes(q);
      const skillMatch = (c.skills || []).some((s) => s.toLowerCase().includes(q));
      const strengthMatch = (c.strengths || []).some((s) => s.toLowerCase().includes(q));
      return nameMatch || collegeMatch || roleMatch || skillMatch || strengthMatch;
    });
  }

  const totalEvaluated = ranked.length;
  const paginatedCandidates = typeof options?.limit === 'number' && options.limit > 0
    ? ranked.slice(0, options.limit)
    : ranked;

  return {
    status: 200,
    success: true,
    job: {
      id: job._id.toString(),
      _id: job._id.toString(),
      title: job.title,
      company: job.company,
      type: job.type,
      status: job.status,
      cutoffPct: job.cutoffPct,
      openPositions: job.openPositions,
      requiredSkills: jobRequiredSkills,
      hasRequirements: hasConfiguredRequirements,
    },
    totalCandidates: totalEvaluated,
    applicantsCount: applications.length,
    candidates: paginatedCandidates,
    message: !hasConfiguredRequirements
      ? 'No skill requirements configured for this job opportunity.'
      : undefined,
  };
}

// GET /api/recruiters/jobs/:jobId/candidates (and /api/jobs/:jobId/candidates)
recruitersRouter.get('/jobs/:jobId/candidates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { jobId } = req.params;
    const scope = req.query.scope === 'applicants' ? 'applicants' : 'all';
    const search = req.query.search as string;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const result = await getCandidatesRankedForJob(jobId, recruiterId, {
      scope,
      search,
      limit,
    });

    if (!result.success) {
      return res.status(result.status || 500).json({ error: result.error || 'Failed to rank candidates' });
    }

    return res.status(result.status).json(result);
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error ranking candidates');
  }
});

// GET /api/candidates (and /api/recruiters/candidates)
recruitersRouter.get('/candidates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    // If jobId query parameter is passed, route directly through the unified ranking engine!
    const jobId = (req.query.jobId || req.query.jobPostingId) as string;
    if (jobId) {
      const scope = req.query.scope === 'applicants' ? 'applicants' : 'all';
      const search = req.query.search as string;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const result = await getCandidatesRankedForJob(jobId, recruiterId, {
        scope,
        search,
        limit,
      });

      if (!result.success) {
        return res.status(result.status || 500).json({ error: result.error || 'Failed to rank candidates' });
      }

      return res.status(result.status).json(result);
    }

    // General talent pool search (no specific job selected)
    let candidates: any[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = recruiterId;
        try {
          if (recruiterId) userObjId = new mongoose.Types.ObjectId(recruiterId);
        } catch {
          userObjId = recruiterId;
        }

        const filter: any = recruiterId
          ? { $or: [{ recruiterId }, { recruiterId: userObjId }, { recruiterId: { $exists: false } }], status: 'Active' }
          : { status: 'Active' };

        const recruiterJobs = await JobPosting.find(filter);
        const openJobTitles = recruiterJobs.map((j) => j.title.toLowerCase());

        // Fetch student candidates from User collection
        const students = await User.find({ role: 'student' }).limit(50);

        // Filter students whose targetRole matches recruiter's open posting titles
        let matchingStudents = students.filter((s) => {
          if (!s.targetRole) return true;
          if (openJobTitles.length === 0) return true;
          const sRole = s.targetRole.toLowerCase();
          return openJobTitles.some((title) =>
            title.includes(sRole) || sRole.includes(title) ||
            (sRole.includes('backend') && title.includes('backend')) ||
            (sRole.includes('frontend') && title.includes('frontend')) ||
            (sRole.includes('sde') && title.includes('sde')) ||
            (sRole.includes('machine learning') && title.includes('machine learning')) ||
            (sRole.includes('ai') && title.includes('ai'))
          );
        });

        if (matchingStudents.length === 0) {
          matchingStudents = students;
        }

        // Fetch StudentSkillProfile for all matching students
        const studentIds = matchingStudents.map((s) => s._id);
        const profiles = await StudentSkillProfile.find({
          userId: { $in: [...studentIds, ...studentIds.map((id) => id.toString())] },
        });
        const profileMap = new Map<string, any>();
        profiles.forEach((p) => {
          profileMap.set(String(p.userId), p);
        });

        // For each student, aggregate actual scores, skills, badges, and skill profile
        const candidatePromises = matchingStudents.map(async (student) => {
          const studentIdStr = student._id.toString();
          let studentObjId: any = student._id;
          try {
            studentObjId = new mongoose.Types.ObjectId(student._id);
          } catch {
            studentObjId = student._id;
          }

          const scoreAgg = await MockInterviewSession.aggregate([
            {
              $match: {
                $or: [{ userId: studentObjId }, { userId: studentIdStr }],
                verdict: { $ne: 'Pending' },
              },
            },
            {
              $group: {
                _id: null,
                avgScore: { $avg: { $ifNull: ['$overallScore', '$score'] } },
              },
            },
          ]);

          const avgOverallScore = scoreAgg.length > 0 && typeof scoreAgg[0].avgScore === 'number'
            ? Math.round(scoreAgg[0].avgScore)
            : (student.readinessScore || 0);

          const badgeCount = await Badge.countDocuments({
            $or: [{ userId: studentObjId }, { userId: studentIdStr }],
          });

          const latestResume = await Resume.findOne({
            $or: [{ userId: studentObjId }, { userId: studentIdStr }],
          }).sort({ createdAt: -1 });

          const studentProfile = profileMap.get(studentIdStr) || profileMap.get(String(studentObjId));

          let skills = (studentProfile && studentProfile.technicalSkills)
            ? studentProfile.technicalSkills.map((s: any) => s.skill)
            : [];

          if (skills.length === 0 && latestResume && latestResume.skillsFound && latestResume.skillsFound.length > 0) {
            skills = latestResume.skillsFound;
          }

          const atsMatch = (latestResume && typeof latestResume.atsScore === 'number')
            ? latestResume.atsScore
            : (avgOverallScore ? Math.min(99, Math.round(avgOverallScore * 1.05)) : 0);

          const candidateObj: any = {
            id: student._id.toString(),
            _id: student._id.toString(),
            name: student.name,
            college: student.college || '',
            role: student.targetRole || '',
            readinessScore: avgOverallScore,
            overallScore: avgOverallScore,
            atsMatch,
            dsaSolved: student.dsaSolved || 0,
            badgeCount: badgeCount || 0,
            skills,
            strengths: studentProfile?.strengths || [],
            hasSkillProfile: Boolean(studentProfile),
            shortlisted: false,
          };

          return candidateObj;
        });

        candidates = await Promise.all(candidatePromises);
      } catch (dbErr) {
        console.warn('MongoDB candidates query error:', dbErr);
      }
    }

    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        candidates: [],
        message: 'No candidates match your open job postings yet.',
      });
    }

    return res.status(200).json({ success: true, candidates });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching candidates');
  }
});

/**
 * Helper: Asserts that an authenticated recruiter owns a specific JobPosting.
 * Verifies:
 *   - jobId is a valid ObjectId
 *   - JobPosting exists
 *   - Job belongs to the authenticated recruiter (recruiterId)
 */
export interface JobOwnershipResult {
  authorized: boolean;
  status: number;
  error?: string;
  job?: any;
}

export async function assertRecruiterOwnsJob(
  recruiterId: string | mongoose.Types.ObjectId,
  jobId: string | mongoose.Types.ObjectId
): Promise<JobOwnershipResult> {
  const jobIdStr = jobId ? jobId.toString().trim() : '';
  if (!jobIdStr || !mongoose.Types.ObjectId.isValid(jobIdStr)) {
    return { authorized: false, status: 400, error: 'Invalid job ID' };
  }

  const jobObjId = new mongoose.Types.ObjectId(jobIdStr);
  const job = await JobPosting.findOne({
    $or: [{ _id: jobObjId }, { _id: jobIdStr }],
  });

  if (!job) {
    return { authorized: false, status: 404, error: 'Job opportunity not found' };
  }

  const jobRecruiterIdStr = job.recruiterId ? job.recruiterId.toString() : '';
  const currentRecruiterIdStr = recruiterId.toString();

  if (!jobRecruiterIdStr || jobRecruiterIdStr !== currentRecruiterIdStr) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: You do not have permission to access candidates for this job posting',
    };
  }

  return { authorized: true, status: 200, job };
}

/**
 * Helper: Verifies legitimate recruiter candidate access.
 * Enforces:
 *   1. studentId is a valid ObjectId and points to an existing student User.
 *   2. If jobId is specified, verifies recruiter owns that job.
 *   3. If jobId is not specified, verifies candidate has submitted an application for at least one job owned by this recruiter.
 *   4. Returns 403 if no legitimate recruitment relationship exists.
 */
export interface CandidateAccessResult {
  authorized: boolean;
  status: number;
  error?: string;
  student?: any;
  job?: any;
}

export async function verifyRecruiterCandidateAccess(
  recruiterId: string | mongoose.Types.ObjectId,
  studentId: string | mongoose.Types.ObjectId,
  jobId?: string | mongoose.Types.ObjectId | null
): Promise<CandidateAccessResult> {
  const studentIdStr = studentId ? studentId.toString().trim() : '';
  if (!studentIdStr || !mongoose.Types.ObjectId.isValid(studentIdStr)) {
    return { authorized: false, status: 400, error: 'Invalid candidate ID' };
  }

  const studentObjId = new mongoose.Types.ObjectId(studentIdStr);
  const student = await User.findById(studentObjId);
  if (!student || student.role !== 'student') {
    return { authorized: false, status: 404, error: 'Candidate not found' };
  }

  const currentRecruiterIdStr = recruiterId.toString();

  // 1. If jobId query parameter is supplied: verify recruiter owns this job
  if (jobId) {
    const jobIdStr = jobId.toString().trim();
    if (!jobIdStr || !mongoose.Types.ObjectId.isValid(jobIdStr)) {
      return { authorized: false, status: 400, error: 'Invalid job ID' };
    }

    const jobCheck = await assertRecruiterOwnsJob(currentRecruiterIdStr, jobIdStr);
    if (!jobCheck.authorized) {
      return {
        authorized: false,
        status: jobCheck.status,
        error: jobCheck.error,
      };
    }

    return { authorized: true, status: 200, student, job: jobCheck.job };
  }

  // 2. If no jobId is specified: verify candidate has applied to ANY job owned by this recruiter
  let recruiterJobs: any[] = [];
  try {
    recruiterJobs = await JobPosting.find({
      $or: [
        { recruiterId: currentRecruiterIdStr },
        { recruiterId: new mongoose.Types.ObjectId(currentRecruiterIdStr) },
      ],
    }).select('_id');
  } catch {
    recruiterJobs = [];
  }

  const recruiterJobIds = recruiterJobs.map((j) => j._id);
  const recruiterJobIdStrings = recruiterJobs.map((j) => j._id.toString());
  const allJobKeys = [...recruiterJobIds, ...recruiterJobIdStrings];

  if (allJobKeys.length > 0) {
    const application = await JobApplication.findOne({
      $or: [{ userId: studentObjId }, { userId: studentIdStr }],
      jobPostingId: { $in: allJobKeys },
    });

    if (application) {
      return { authorized: true, status: 200, student };
    }
  }

  // 3. Fallback: No legitimate recruitment context established (arbitrary student ID)
  return {
    authorized: false,
    status: 403,
    error: 'Forbidden: You do not have legitimate recruitment access to this candidate',
  };
}

// GET /api/candidates/:studentId/profile (Verified Candidate Report)
recruitersRouter.get('/candidates/:studentId/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { studentId } = req.params;
    const requestedJobId = (req.query.jobId || req.query.jobPostingId) as string | undefined;

    // Verify legitimate recruiter candidate access
    const accessCheck = await verifyRecruiterCandidateAccess(recruiterId, studentId, requestedJobId);
    if (!accessCheck.authorized) {
      return res.status(accessCheck.status).json({ error: accessCheck.error });
    }

    const student = accessCheck.student;
    const studentObjId = student._id;

    // 2. Fetch Latest Resume Analysis
    const latestResume = await Resume.findOne({
      $or: [{ userId: studentObjId }, { userId: studentId }],
    }).sort({ createdAt: -1 });

    const resume = latestResume
      ? {
          atsScore: latestResume.atsScore ?? null,
          skillsFound: latestResume.skillsFound || [],
          missingSkills: latestResume.missingSkills || [],
          formattingScore: latestResume.formattingScore ?? null,
          quantifiedImpactScore: latestResume.quantifiedImpactScore ?? null,
          targetRole: latestResume.targetRole || null,
          createdAt: latestResume.createdAt || null,
          fileUrl: latestResume.fileUrl || (latestResume.fileId ? `/api/files/${latestResume.fileId}` : null),
          fileName: latestResume.fileName || null,
        }
      : null;

    // 3. Fetch Latest GitHub Portfolio Audit (Fix #5.1)
    const githubAudit = await getLatestGitHubPortfolioAudit(studentObjId);
    const portfolio = githubAudit
      ? {
          qualityScore: githubAudit.qualityScore ?? null,
          githubUrl: githubAudit.githubUrl || null,
          githubUsername: githubAudit.githubUsername || null,
          feedback: githubAudit.feedback || '',
          strengths: githubAudit.strengths || [],
          recommendations: githubAudit.recommendations || [],
          auditedProjects: (githubAudit.auditedProjects || []).map((p) => ({
            name: p.name,
            language: p.language || '',
            description: p.description || '',
            commits: p.commits || '',
            stars: p.stars || 0,
            status: p.status || '',
            url: p.url || '',
            summary: p.summary || '',
          })),
        }
      : null;

    // 4. Fetch Certifications Grouped by Category
    const certs = await Certification.find({
      $or: [{ userId: studentObjId }, { userId: studentId }],
    } as any).sort({ addedAt: -1, createdAt: -1 });

    const certificationsGrouped: Record<string, any[]> = {
      Global: [],
      National: [],
      'Local/College': [],
      Other: [],
    };

    certs.forEach((c) => {
      const cat = c.category || 'Other';
      const item = {
        id: c._id.toString(),
        title: c.title,
        issuer: c.issuer,
        category: c.category,
        dateIssued: c.dateIssued || '',
        credentialUrl: c.credentialUrl || '',
      };
      if (certificationsGrouped[cat]) {
        certificationsGrouped[cat].push(item);
      } else {
        certificationsGrouped.Other.push(item);
      }
    });

    // 5. Fetch Badge Count
    const badgeCount = await Badge.countDocuments({
      $or: [{ userId: studentObjId }, { userId: studentId }],
    });

    // 6. Compute Average Mock Interview Score
    const interviewAgg = await MockInterviewSession.aggregate([
      {
        $match: {
          $or: [{ userId: studentObjId }, { userId: studentId }],
          verdict: { $ne: 'Pending' },
        },
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: { $ifNull: ['$overallScore', '$score'] } },
        },
      },
    ]);

    const avgMockInterviewScore = interviewAgg.length > 0 && typeof interviewAgg[0].avgScore === 'number'
      ? Math.round(interviewAgg[0].avgScore)
      : null;

    // 7. Fetch StudentSkillProfile & calculate Job Match if jobId is provided
    const profile = await StudentSkillProfile.findOne({
      $or: [{ userId: studentObjId }, { userId: studentId }],
    });

    let jobMatch: any = null;
    const jobId = (req.query.jobId || req.query.jobPostingId) as string;
    const job = accessCheck.job || (jobId ? await JobPosting.findOne({ $or: [{ _id: jobId }, { _id: new mongoose.Types.ObjectId(jobId) }] }) : null);
    if (job) {
      const assessedSkills = profile
        ? [...(profile.technicalSkills || []), ...(profile.softSkills || [])]
        : [];
      const matchResult = calculateRoleMatch(assessedSkills, job.requiredSkills || []);
      const matchCat = getMatchCategory(matchResult.matchPercentage);
      jobMatch = {
        jobId: job._id.toString(),
        jobTitle: job.title,
        company: job.company,
        matchPercentage: matchResult.matchPercentage,
        matchCategory: matchCat,
        hasRequirements: matchResult.hasRequirements,
        strengths: matchResult.strengths.map((s) => s.skill),
        gaps: matchResult.gaps.map((s) => s.skill),
        needsImprovement: matchResult.needsImprovement.map((s) => s.skill),
        notAssessed: matchResult.notAssessed.map((s) => s.skill),
        detailedBreakdown: [
          ...matchResult.strengths,
          ...matchResult.needsImprovement,
          ...matchResult.gaps,
          ...matchResult.notAssessed,
        ],
      };
    }

    // 8. Fetch Unified Digital Student Portfolio (Fix #5.1)
    const digitalPortfolio = await getDigitalStudentPortfolio(student._id);

    return res.status(200).json({
      success: true,
      candidate: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        college: student.college || null,
        degree: student.degree || null,
        department: student.department || null,
        graduationYear: student.graduationYear || null,
        cgpa: student.cgpa || null,
        targetRole: student.targetRole || null,
        targetCtc: student.targetCtc || null,
        bio: student.bio || null,
        githubUrl: student.githubUrl || null,
        linkedinUrl: student.linkedinUrl || null,
        readinessScore: student.readinessScore || 0,
        dsaSolved: student.dsaSolved || 0,
      },
      digitalPortfolio,
      resume,
      portfolio,
      certificationsGrouped,
      certificationsCount: certs.length,
      badgeCount,
      avgMockInterviewScore,
      skillProfile: profile
        ? {
            technicalSkills: profile.technicalSkills || [],
            softSkills: profile.softSkills || [],
            strengths: profile.strengths || [],
            skillGaps: profile.skillGaps || [],
          }
        : null,
      jobMatch,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching candidate profile');
  }
});

// GET /api/candidates/:studentId/portfolio (and /api/recruiters/candidates/:studentId/portfolio)
recruitersRouter.get('/candidates/:studentId/portfolio', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { studentId } = req.params;
    const requestedJobId = (req.query.jobId || req.query.jobPostingId) as string | undefined;

    const accessCheck = await verifyRecruiterCandidateAccess(recruiterId, studentId, requestedJobId);
    if (!accessCheck.authorized) {
      return res.status(accessCheck.status).json({ error: accessCheck.error });
    }

    const student = accessCheck.student;
    const digitalPortfolio = await getDigitalStudentPortfolio(student._id);
    if (!digitalPortfolio) {
      return res.status(404).json({ error: 'Candidate portfolio not found' });
    }

    return res.status(200).json({
      success: true,
      portfolio: digitalPortfolio,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching candidate portfolio');
  }
});

// POST /api/candidates/:studentId/invite (Interview Invitation)
recruitersRouter.post('/candidates/:studentId/invite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { studentId } = req.params;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // 1. Confirm target student is a valid student
    const student = await User.findById(new mongoose.Types.ObjectId(studentId));
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // 2. Validate relevant job ID from body (or query)
    const rawJobId = req.body?.jobId || req.body?.jobPostingId || req.query?.jobId;
    if (!rawJobId || !mongoose.Types.ObjectId.isValid(String(rawJobId))) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    // 3. Confirm recruiter owns the job using helper
    const jobCheck = await assertRecruiterOwnsJob(recruiterId, String(rawJobId));
    if (!jobCheck.authorized) {
      return res.status(jobCheck.status).json({ error: jobCheck.error });
    }

    const job = jobCheck.job;

    // 4. Authoritative creation: never trust body recruiterId, companyId, etc.
    let createdApp: any = null;
    if (mongoose.connection.readyState === 1) {
      createdApp = await JobApplication.create({
        userId: student._id,
        jobPostingId: job._id,
        company: job.company,
        role: job.title,
        type: job.type || 'Job',
        status: 'Interview Invited',
        appliedAt: new Date().toISOString().split('T')[0],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Interview invitation sent to candidate successfully.',
      application: createdApp ? {
        id: createdApp._id.toString(),
        userId: createdApp.userId.toString(),
        jobPostingId: createdApp.jobPostingId.toString(),
        company: createdApp.company,
        role: createdApp.role,
        status: createdApp.status,
      } : undefined,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error inviting candidate');
  }
});

// GET /api/recruiters/applications
// Returns all JobApplication documents where jobPostingId belongs to a JobPosting owned by the authenticated recruiter
recruitersRouter.get('/applications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        applications: [],
        message: 'Database connection not ready (demo mode)',
      });
    }

    let userObjId: any = recruiterId;
    try {
      if (mongoose.Types.ObjectId.isValid(recruiterId)) {
        userObjId = new mongoose.Types.ObjectId(recruiterId);
      }
    } catch {
      userObjId = recruiterId;
    }

    // 1. Find all JobPosting documents owned by the authenticated recruiter
    const ownedJobs = await JobPosting.find({
      $or: [{ recruiterId: recruiterId }, { recruiterId: userObjId }],
    }).select('_id title company type');

    if (!ownedJobs || ownedJobs.length === 0) {
      return res.status(200).json({
        success: true,
        applications: [],
      });
    }

    const jobMap = new Map<string, any>();
    const jobIds: any[] = [];
    const jobIdStrings: string[] = [];

    ownedJobs.forEach((job) => {
      const idStr = job._id.toString();
      jobMap.set(idStr, job);
      jobIds.push(job._id);
      jobIdStrings.push(idStr);
    });

    const allJobKeys = Array.from(new Set([...jobIds, ...jobIdStrings]));

    // 2. Find all JobApplication documents where jobPostingId is in that set of job IDs
    const applications = await JobApplication.find({
      jobPostingId: { $in: allJobKeys },
    }).sort({ createdAt: -1 });

    if (!applications || applications.length === 0) {
      return res.status(200).json({
        success: true,
        applications: [],
      });
    }

    // 3. For each application, include student's name, college, readinessScore from User model, and evaluated skill match
    const userIds = applications.map((a) => a.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select(
      'name college collegeName readinessScore email targetRole'
    );

    const userMap = new Map<string, any>();
    users.forEach((u) => {
      userMap.set(u._id.toString(), u);
    });

    // Batch fetch StudentSkillProfile for all applicants
    const profiles = await StudentSkillProfile.find({
      userId: { $in: [...userIds, ...userIds.map((id) => id.toString())] },
    });
    const profileMap = new Map<string, any>();
    profiles.forEach((p) => {
      profileMap.set(String(p.userId), p);
    });

    const formattedApplications = applications.map((app) => {
      const studentUser = app.userId ? userMap.get(app.userId.toString()) : null;
      const linkedJob = app.jobPostingId ? jobMap.get(app.jobPostingId.toString()) : null;
      const appId = app._id.toString();

      const studentName = studentUser?.name || 'Applicant Candidate';
      const studentCollege = studentUser?.college || studentUser?.collegeName || 'Engineering College';
      const readinessScore = typeof studentUser?.readinessScore === 'number' ? studentUser.readinessScore : 75;

      const profile = app.userId ? profileMap.get(app.userId.toString()) : null;
      const assessedSkills = profile
        ? [...(profile.technicalSkills || []), ...(profile.softSkills || [])]
        : [];

      const jobReqs = linkedJob?.requiredSkills || [];
      const matchResult = calculateRoleMatch(assessedSkills, jobReqs);
      const matchCategory = getMatchCategory(matchResult.matchPercentage);

      let formattedDate = '';
      if (typeof app.appliedAt === 'string') {
        formattedDate = app.appliedAt;
      } else if (app.appliedAt instanceof Date) {
        formattedDate = app.appliedAt.toISOString().split('T')[0];
      } else if (app.createdAt) {
        formattedDate = new Date(app.createdAt).toISOString().split('T')[0];
      } else {
        formattedDate = new Date().toISOString().split('T')[0];
      }

      return {
        id: appId,
        _id: appId,
        jobPostingId: app.jobPostingId ? app.jobPostingId.toString() : null,
        company: app.company || linkedJob?.company || 'Industry Partner',
        role: app.role || linkedJob?.title || 'Engineering Role',
        type: app.type || linkedJob?.type || 'Job',
        status: app.status || 'Applied',
        appliedAt: formattedDate,
        createdAt: app.createdAt,
        studentName,
        studentCollege,
        readinessScore,
        matchPercentage: matchResult.matchPercentage,
        matchCategory,
        hasRequirements: matchResult.hasRequirements,
        strengths: matchResult.strengths.map((s) => s.skill),
        gaps: matchResult.gaps.map((s) => s.skill),
        needsImprovement: matchResult.needsImprovement.map((s) => s.skill),
        notAssessed: matchResult.notAssessed.map((s) => s.skill),
        student: {
          id: studentUser ? studentUser._id.toString() : (app.userId ? app.userId.toString() : ''),
          name: studentName,
          college: studentCollege,
          readinessScore,
          email: studentUser?.email || '',
        },
      };
    });

    return res.status(200).json({
      success: true,
      applications: formattedApplications,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching applications');
  }
});

// PATCH /api/recruiters/applications/:applicationId/status
// Updates the status field on a JobApplication, with strict recruiter ownership check
recruitersRouter.patch('/applications/:applicationId/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { applicationId } = req.params;
    const { status } = req.body;

    const canonicalStatus = normalizeJobApplicationStatus(status);
    if (!canonicalStatus) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${JOB_APPLICATION_STATUSES.join(', ')}`,
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Application status updated (mock mode)',
        application: {
          id: applicationId,
          _id: applicationId,
          status: canonicalStatus,
        },
      });
    }

    let appObjectId: any = applicationId;
    try {
      if (mongoose.Types.ObjectId.isValid(applicationId)) {
        appObjectId = new mongoose.Types.ObjectId(applicationId);
      }
    } catch {
      appObjectId = applicationId;
    }

    // 1. Find the application
    const application = await JobApplication.findOne({
      $or: [{ _id: appObjectId }, { _id: applicationId }],
    });

    if (!application) {
      return res.status(404).json({ error: 'Job application not found' });
    }

    if (!application.jobPostingId) {
      return res.status(403).json({
        error: 'Forbidden: Cannot verify ownership for this application because it is not linked to a job posting',
      });
    }

    // 2. Fetch the linked JobPosting to verify ownership
    let jobPostingIdObj: any = application.jobPostingId;
    try {
      if (mongoose.Types.ObjectId.isValid(application.jobPostingId)) {
        jobPostingIdObj = new mongoose.Types.ObjectId(application.jobPostingId);
      }
    } catch {
      jobPostingIdObj = application.jobPostingId;
    }

    const jobPosting = await JobPosting.findOne({
      $or: [{ _id: jobPostingIdObj }, { _id: application.jobPostingId }],
    });

    if (!jobPosting) {
      return res.status(404).json({ error: 'Associated job posting not found' });
    }

    // 3. Strict Recruiter Ownership Check
    // Verifies that the job posting strictly belongs to the requesting recruiter
    const recruiterIdStr = recruiterId.toString();
    const postingRecruiterIdStr = jobPosting.recruiterId ? jobPosting.recruiterId.toString() : null;

    if (!postingRecruiterIdStr || postingRecruiterIdStr !== recruiterIdStr) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to modify applications for this job posting',
      });
    }

    // 4. Update status and persist
    application.status = canonicalStatus;
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${canonicalStatus}`,
      application: {
        id: application._id.toString(),
        _id: application._id.toString(),
        jobPostingId: application.jobPostingId ? application.jobPostingId.toString() : null,
        company: application.company,
        role: application.role,
        type: application.type,
        status: application.status,
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating application status');
  }
});

// GET /api/recruiters/learning-programs
// Returns all learning programs created by the authenticated recruiter
recruitersRouter.get('/learning-programs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        programs: [],
        message: 'Database connection not ready (demo mode)',
      });
    }

    let userObjId: any = recruiterId;
    try {
      if (mongoose.Types.ObjectId.isValid(recruiterId)) {
        userObjId = new mongoose.Types.ObjectId(recruiterId);
      }
    } catch {
      userObjId = recruiterId;
    }

    const programs = await LearningProgram.find({
      $or: [{ recruiterId: recruiterId }, { recruiterId: userObjId }],
    }).sort({ createdAt: -1 }).lean();

    // Attach applicant counts for each program
    const programIds = programs.map((p) => p._id);
    let appCountMap = new Map<string, number>();
    try {
      const appCounts = await LearningProgramApplication.aggregate([
        { $match: { programId: { $in: programIds } } },
        { $group: { _id: '$programId', count: { $sum: 1 } } },
      ]);
      appCountMap = new Map<string, number>(
        appCounts.map((c: any) => [c._id.toString(), c.count])
      );
    } catch (countErr) {
      console.warn('Could not aggregate applicant counts:', countErr);
    }

    const enrichedPrograms = programs.map((p) => ({
      ...p,
      applicantCount: appCountMap.get(p._id.toString()) || 0,
    }));

    return res.status(200).json({
      success: true,
      programs: enrichedPrograms,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching learning programs');
  }
});

// POST /api/recruiters/learning-programs
// Creates a new learning program. recruiterId is taken strictly from authenticated req.user.userId
recruitersRouter.post('/learning-programs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const {
      title,
      type,
      description,
      skillsCovered,
      duration,
      mode,
      capacity,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Program title is required' });
    }

    const VALID_TYPES = ['Certification', 'Workshop', 'Training Program', 'Mentorship'] as const;
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid program type. Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    const VALID_MODES = ['Online', 'Offline', 'Hybrid'] as const;
    const selectedMode = mode && VALID_MODES.includes(mode) ? mode : 'Online';

    // Parse skillsCovered
    let parsedSkills: string[] = [];
    if (Array.isArray(skillsCovered)) {
      parsedSkills = skillsCovered.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof skillsCovered === 'string') {
      parsedSkills = skillsCovered
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Default company from recruiter profile if not explicitly given
    let companyName = req.body.company?.trim();
    if (!companyName && mongoose.connection.readyState === 1) {
      try {
        const recruiterUser = await User.findById(recruiterId).select('company');
        if (recruiterUser?.company) {
          companyName = recruiterUser.company;
        }
      } catch (err) {
        console.warn('Could not fetch recruiter company:', err);
      }
    }
    if (!companyName) {
      companyName = 'Industry Partner';
    }

    const parsedCapacity = capacity != null && capacity !== '' ? Math.max(1, Number(capacity)) : undefined;

    let userObjId: any = recruiterId;
    try {
      if (mongoose.Types.ObjectId.isValid(recruiterId)) {
        userObjId = new mongoose.Types.ObjectId(recruiterId);
      }
    } catch {
      userObjId = recruiterId;
    }

    if (mongoose.connection.readyState !== 1) {
      const mockProgram = {
        _id: 'lp_' + Date.now(),
        id: 'lp_' + Date.now(),
        recruiterId: userObjId,
        company: companyName,
        title: title.trim(),
        type,
        description: description?.trim() || '',
        skillsCovered: parsedSkills,
        duration: duration?.trim() || '4 Weeks',
        mode: selectedMode,
        capacity: parsedCapacity,
        enrolledCount: 0,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return res.status(201).json({
        success: true,
        message: 'Learning program created successfully (demo mode)',
        program: mockProgram,
      });
    }

    // Strictly enforce recruiterId from req.user.userId (ignoring any client-supplied recruiterId)
    const newProgram = await LearningProgram.create({
      recruiterId: userObjId,
      company: companyName,
      title: title.trim(),
      type,
      description: description?.trim() || '',
      skillsCovered: parsedSkills,
      duration: duration?.trim() || '4 Weeks',
      mode: selectedMode,
      capacity: parsedCapacity,
      enrolledCount: 0,
      status: 'Active',
    });

    return res.status(201).json({
      success: true,
      message: 'Learning program created successfully',
      program: newProgram,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error creating learning program');
  }
});

// DELETE /api/recruiters/learning-programs/:programId
// Deletes a learning program only after verifying recruiter ownership
recruitersRouter.delete('/learning-programs/:programId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { programId } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Learning program deleted successfully (demo mode)',
      });
    }

    let progObjId: any = programId;
    try {
      if (mongoose.Types.ObjectId.isValid(programId)) {
        progObjId = new mongoose.Types.ObjectId(programId);
      }
    } catch {
      progObjId = programId;
    }

    // Fetch the program to verify existence
    const program = await LearningProgram.findOne({
      $or: [{ _id: progObjId }, { _id: programId }],
    });

    if (!program) {
      return res.status(404).json({ error: 'Learning program not found' });
    }

    // Strict ownership check: compare program.recruiterId to req.user.userId
    const recruiterIdStr = recruiterId.toString();
    const programRecruiterIdStr = program.recruiterId ? program.recruiterId.toString() : null;

    if (!programRecruiterIdStr || programRecruiterIdStr !== recruiterIdStr) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to delete this learning program',
      });
    }

    // Verified owner: proceed with deletion and clean up applications
    await LearningProgramApplication.deleteMany({ programId: program._id });
    await LearningProgram.deleteOne({ _id: program._id });

    return res.status(200).json({
      success: true,
      message: 'Learning program deleted successfully',
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error deleting learning program');
  }
});

// PATCH /api/recruiters/learning-programs/:programId (and /api/learning-programs/:programId)
// Updates an existing learning program owned by the authenticated recruiter with strict field allowlisting
recruitersRouter.patch('/learning-programs/:programId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { programId } = req.params;
    if (!programId) {
      return res.status(400).json({ error: 'Program ID is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Learning program updated successfully (demo mode)',
        program: { id: programId, _id: programId, ...req.body, recruiterId },
      });
    }

    let progObjId: any = programId;
    try {
      if (mongoose.Types.ObjectId.isValid(programId)) {
        progObjId = new mongoose.Types.ObjectId(programId);
      }
    } catch {
      progObjId = programId;
    }

    const program = await LearningProgram.findOne({
      $or: [{ _id: progObjId }, { _id: programId }],
    });

    if (!program) {
      return res.status(404).json({ error: 'Learning program not found' });
    }

    // Ownership check: must be owned by authenticated recruiter
    if (program.recruiterId?.toString() !== recruiterId.toString()) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this learning program' });
    }

    // Explicit field allowlist - NEVER allow mass assignment of recruiterId, enrolledCount, _id, createdAt, etc.
    const { title, description, type, skillsCovered, duration, mode, capacity, status } = req.body;

    if (title !== undefined) program.title = String(title).trim();
    if (description !== undefined) program.description = String(description).trim();
    if (type !== undefined && ['Certification', 'Workshop', 'Training Program', 'Mentorship'].includes(type)) {
      program.type = type;
    }
    if (skillsCovered !== undefined) {
      if (Array.isArray(skillsCovered)) {
        program.skillsCovered = skillsCovered.map((s) => String(s).trim()).filter(Boolean);
      }
    }
    if (duration !== undefined) program.duration = String(duration).trim();
    if (mode !== undefined && ['Online', 'Offline', 'Hybrid'].includes(mode)) program.mode = mode;
    if (capacity !== undefined) {
      program.capacity = capacity != null && capacity !== '' ? Math.max(1, Number(capacity)) : undefined;
    }
    if (status !== undefined && ['Active', 'Archived', 'Draft'].includes(status)) program.status = status;

    await program.save();

    return res.status(200).json({
      success: true,
      message: 'Learning program updated successfully',
      program,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating learning program');
  }
});

// GET /api/recruiters/learning-programs/:programId/applications (and /applicants)
// Returns all applicants for a specific learning program owned by the authenticated recruiter
recruitersRouter.get(
  ['/learning-programs/:programId/applications', '/learning-programs/:programId/applicants'],
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const recruiterId = req.user?.userId;
      if (!recruiterId) {
        return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
      }
      if (req.user?.role !== 'industry') {
        return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
      }

      const { programId } = req.params;
      if (!programId) {
        return res.status(400).json({ error: 'Program ID is required' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
          success: true,
          program: { id: programId, title: 'Demo Program', capacity: 30, enrolledCount: 0 },
          applications: [],
          count: 0,
        });
      }

      let progObjId: any = programId;
      try {
        if (mongoose.Types.ObjectId.isValid(programId)) {
          progObjId = new mongoose.Types.ObjectId(programId);
        }
      } catch {
        progObjId = programId;
      }

      const program = await LearningProgram.findOne({
        $or: [{ _id: progObjId }, { _id: programId }],
      });

      if (!program) {
        return res.status(404).json({ error: 'Learning program not found' });
      }

      // Strict ownership check: recruiter must own the program
      const recruiterIdStr = recruiterId.toString();
      const programRecruiterIdStr = program.recruiterId ? program.recruiterId.toString() : null;

      if (!programRecruiterIdStr || programRecruiterIdStr !== recruiterIdStr) {
        return res.status(403).json({
          error: 'Forbidden: You do not have permission to view applicants for this learning program',
        });
      }

      const applications = await LearningProgramApplication.find({
        programId: program._id,
      })
        .sort({ createdAt: -1 })
        .populate({
          path: 'studentId',
          select: 'name email college collegeName degree targetRole skills bio cgpa githubUrl linkedinUrl graduationYear',
        })
        .lean();

      const formatted = applications.map((app: any) => {
        const student = app.studentId || {};
        return {
          id: app._id.toString(),
          programId: program._id.toString(),
          status: app.status,
          message: app.message || '',
          reviewedAt: app.reviewedAt,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          student: {
            id: student._id ? student._id.toString() : (app.studentId ? app.studentId.toString() : ''),
            name: student.name || 'Student Candidate',
            email: student.email || '',
            college: student.collegeName || student.college || '',
            degree: student.degree || '',
            targetRole: student.targetRole || '',
            skills: student.skills || [],
            bio: student.bio || '',
            cgpa: student.cgpa,
            graduationYear: student.graduationYear,
            githubUrl: student.githubUrl || '',
            linkedinUrl: student.linkedinUrl || '',
          },
        };
      });

      return res.status(200).json({
        success: true,
        program: {
          id: program._id.toString(),
          title: program.title,
          type: program.type,
          capacity: program.capacity,
          enrolledCount: program.enrolledCount ?? 0,
          status: program.status,
        },
        applications: formatted,
        count: formatted.length,
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Server error loading applicants');
    }
  }
);

// PATCH /api/recruiters/learning-programs/:programId/applications/:applicationId
// Industry recruiter reviews an applicant and transitions status to UNDER_REVIEW, SELECTED, or REJECTED
// Uses MongoDB session transactions to ensure atomic capacity reservation and prevent overbooking
const handleLearningProgramApplicationStatusUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    let { programId, applicationId } = req.params;
    const { status } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    const ALLOWED_STATUSES = ['UNDER_REVIEW', 'SELECTED', 'REJECTED'] as const;
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: `Application status updated to ${status} (demo mode)`,
        application: {
          id: applicationId,
          status,
          reviewedAt: new Date(),
        },
      });
    }

    let appObjId: any = applicationId;
    try {
      if (mongoose.Types.ObjectId.isValid(applicationId)) {
        appObjId = new mongoose.Types.ObjectId(applicationId);
      }
    } catch {
      appObjId = applicationId;
    }

    // If programId wasn't in URL params (e.g. /applications/:applicationId/status), infer it from application
    if (!programId) {
      const existingAppDoc = await LearningProgramApplication.findOne({
        $or: [{ _id: appObjId }, { _id: applicationId }],
      });
      if (!existingAppDoc) {
        return res.status(404).json({ error: 'Application not found' });
      }
      programId = existingAppDoc.programId.toString();
    }

    let progObjId: any = programId;
    try {
      if (mongoose.Types.ObjectId.isValid(programId)) {
        progObjId = new mongoose.Types.ObjectId(programId);
      }
    } catch {
      progObjId = programId;
    }

    // Verify program exists
    const initialProgram = await LearningProgram.findOne({
      $or: [{ _id: progObjId }, { _id: programId }],
    });

    if (!initialProgram) {
      return res.status(404).json({ error: 'Learning program not found' });
    }

    // Ownership authorization check
    const recruiterIdStr = recruiterId.toString();
    const programRecruiterIdStr = initialProgram.recruiterId ? initialProgram.recruiterId.toString() : null;

    if (!programRecruiterIdStr || programRecruiterIdStr !== recruiterIdStr) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to review applications for this program',
      });
    }

    // Check current application state
    const currentApp = await LearningProgramApplication.findOne({
      $or: [{ _id: appObjId }, { _id: applicationId }],
      programId: initialProgram._id,
    });

    if (!currentApp) {
      return res.status(404).json({ error: 'Application not found for this program' });
    }

    // Terminal states cannot be transitioned
    if (currentApp.status === 'SELECTED') {
      return res.status(409).json({
        error: 'Conflict: Application is already in terminal state "SELECTED" and has been enrolled.',
      });
    }

    if (currentApp.status === 'REJECTED') {
      return res.status(409).json({
        error: 'Conflict: Application is already in terminal state "REJECTED" and cannot be modified.',
      });
    }

    // Handle UNDER_REVIEW transition
    if (status === 'UNDER_REVIEW') {
      if (currentApp.status === 'UNDER_REVIEW') {
        return res.status(200).json({
          success: true,
          message: 'Applicant is already Under Review',
          application: {
            id: currentApp._id.toString(),
            status: currentApp.status,
          },
          program: {
            id: initialProgram._id.toString(),
            enrolledCount: initialProgram.enrolledCount ?? 0,
            capacity: initialProgram.capacity,
          },
        });
      }

      const updatedApp = await LearningProgramApplication.findOneAndUpdate(
        {
          _id: currentApp._id,
          programId: initialProgram._id,
          status: 'APPLIED',
        },
        {
          $set: {
            status: 'UNDER_REVIEW',
          },
        },
        { new: true }
      );

      if (!updatedApp) {
        return res.status(409).json({
          error: 'Conflict: Application is not in APPLIED state or was concurrently modified',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Applicant moved to Under Review',
        application: {
          id: updatedApp._id.toString(),
          status: updatedApp.status,
        },
        program: {
          id: initialProgram._id.toString(),
          enrolledCount: initialProgram.enrolledCount ?? 0,
          capacity: initialProgram.capacity,
        },
      });
    }

    // Handle REJECTED transition
    if (status === 'REJECTED') {
      const updatedApp = await LearningProgramApplication.findOneAndUpdate(
        {
          _id: currentApp._id,
          programId: initialProgram._id,
          status: { $in: ['APPLIED', 'UNDER_REVIEW'] },
        },
        {
          $set: {
            status: 'REJECTED',
            reviewedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!updatedApp) {
        return res.status(409).json({
          error: 'Conflict: Application was concurrently modified by another action',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Applicant rejected',
        application: {
          id: updatedApp._id.toString(),
          status: updatedApp.status,
          reviewedAt: updatedApp.reviewedAt,
        },
        program: {
          id: initialProgram._id.toString(),
          enrolledCount: initialProgram.enrolledCount ?? 0,
          capacity: initialProgram.capacity,
        },
      });
    }

    // Handle SELECTED transition
    if (status === 'SELECTED') {
      // Pre-check capacity before starting transaction
      if (
        typeof initialProgram.capacity === 'number' &&
        initialProgram.capacity > 0 &&
        (initialProgram.enrolledCount ?? 0) >= initialProgram.capacity
      ) {
        return res.status(409).json({
          error: `Learning program capacity has been reached (${initialProgram.capacity} seats).`,
          capacityReached: true,
        });
      }

      // Check allowed source state
      if (!['UNDER_REVIEW', 'APPLIED'].includes(currentApp.status)) {
        return res.status(409).json({
          error: `Conflict: Application in state "${currentApp.status}" cannot be selected.`,
        });
      }

      // Attempt MongoDB Session Transaction first
      let session: mongoose.ClientSession | null = null;
      let transactionSucceeded = false;
      let txErrorResult: any = null;

      try {
        session = await mongoose.startSession();
        try {
          let programDoc: any = null;
          let appDoc: any = null;

          await session.withTransaction(async () => {
            // 1. Fetch program within transaction
            const txProg = await LearningProgram.findOne({
              $or: [{ _id: progObjId }, { _id: programId }],
            }).session(session);

            if (!txProg) {
              const err: any = new Error('Learning program not found');
              err.status = 404;
              throw err;
            }

            // 2. Fetch application within transaction
            const txApp = await LearningProgramApplication.findOne({
              _id: currentApp._id,
              programId: txProg._id,
            }).session(session);

            if (!txApp) {
              const err: any = new Error('Application not found for this program');
              err.status = 404;
              throw err;
            }

            if (txApp.status === 'SELECTED') {
              const err: any = new Error('Conflict: Application has already been selected.');
              err.status = 409;
              throw err;
            }

            if (txApp.status === 'REJECTED') {
              const err: any = new Error('Conflict: Application has already been rejected and cannot be selected.');
              err.status = 409;
              throw err;
            }

            if (!['UNDER_REVIEW', 'APPLIED'].includes(txApp.status)) {
              const err: any = new Error(`Conflict: Application in state "${txApp.status}" cannot be selected.`);
              err.status = 409;
              throw err;
            }

            // 3. Atomically reserve seat if capacity is set
            if (typeof txProg.capacity === 'number' && txProg.capacity > 0) {
              const reservedProg = await LearningProgram.findOneAndUpdate(
                {
                  _id: txProg._id,
                  $or: [
                    { enrolledCount: { $lt: txProg.capacity } },
                    { enrolledCount: { $exists: false } },
                  ],
                },
                { $inc: { enrolledCount: 1 } },
                { session, new: true }
              );

              if (!reservedProg) {
                const err: any = new Error(`Learning program capacity has been reached (${txProg.capacity} seats).`);
                err.status = 409;
                err.capacityReached = true;
                throw err;
              }
              programDoc = reservedProg;
            } else {
              const reservedProg = await LearningProgram.findByIdAndUpdate(
                txProg._id,
                { $inc: { enrolledCount: 1 } },
                { session, new: true }
              );
              programDoc = reservedProg || txProg;
            }

            // 4. Atomically update application status to SELECTED
            const updatedApp = await LearningProgramApplication.findOneAndUpdate(
              {
                _id: txApp._id,
                programId: txProg._id,
                status: { $in: ['APPLIED', 'UNDER_REVIEW'] },
              },
              {
                $set: {
                  status: 'SELECTED',
                  reviewedAt: new Date(),
                },
              },
              { session, new: true }
            );

            if (!updatedApp) {
              const err: any = new Error('Conflict: Application was concurrently modified by another action');
              err.status = 409;
              throw err;
            }

            appDoc = updatedApp;
          });

          transactionSucceeded = true;
          return res.status(200).json({
            success: true,
            message: 'Applicant selected successfully',
            application: {
              id: appDoc._id.toString(),
              status: appDoc.status,
              reviewedAt: appDoc.reviewedAt,
            },
            program: {
              id: programDoc._id.toString(),
              enrolledCount: programDoc.enrolledCount ?? 1,
              capacity: programDoc.capacity,
            },
          });
        } catch (innerTxErr: any) {
          // If the error has a defined status (e.g. 409 Conflict, 404), return it directly
          if (innerTxErr?.status) {
            txErrorResult = innerTxErr;
            return res.status(innerTxErr.status).json({
              error: innerTxErr.message,
              ...(innerTxErr.capacityReached ? { capacityReached: true } : {}),
            });
          }

          // Check if this error is due to transactions not being supported on standalone mongo
          const isUnsupported =
            innerTxErr?.message?.includes('Transactions are not supported') ||
            innerTxErr?.message?.includes('replica set') ||
            innerTxErr?.message?.includes('Transaction numbers');

          if (!isUnsupported) {
            throw innerTxErr;
          }
          // If unsupported, we fall through to the non-transaction atomic update strategy
        } finally {
          await session.endSession();
        }
      } catch (sessInitErr: any) {
        // Session could not be started or transactions unsupported; fall through to non-transaction strategy
        console.warn('[LearningProgram Selection] Session/Transaction init note:', sessInitErr.message);
      }

      if (transactionSucceeded || txErrorResult) {
        return;
      }

      // Non-transactional atomic conditional update fallback
      // 1. Atomically reserve seat: enrolledCount < capacity
      let reservedProg: any = null;
      if (typeof initialProgram.capacity === 'number' && initialProgram.capacity > 0) {
        reservedProg = await LearningProgram.findOneAndUpdate(
          {
            _id: initialProgram._id,
            $or: [
              { enrolledCount: { $lt: initialProgram.capacity } },
              { enrolledCount: { $exists: false } },
            ],
          },
          { $inc: { enrolledCount: 1 } },
          { new: true }
        );

        if (!reservedProg) {
          return res.status(409).json({
            error: `Learning program capacity has been reached (${initialProgram.capacity} seats).`,
            capacityReached: true,
          });
        }
      } else {
        reservedProg = await LearningProgram.findByIdAndUpdate(
          initialProgram._id,
          { $inc: { enrolledCount: 1 } },
          { new: true }
        );
      }

      // 2. Atomically transition application to SELECTED
      const updatedApp = await LearningProgramApplication.findOneAndUpdate(
        {
          _id: currentApp._id,
          programId: initialProgram._id,
          status: { $in: ['APPLIED', 'UNDER_REVIEW'] },
        },
        {
          $set: {
            status: 'SELECTED',
            reviewedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!updatedApp) {
        // Application was concurrently modified; roll back reserved seat
        await LearningProgram.findByIdAndUpdate(initialProgram._id, { $inc: { enrolledCount: -1 } });
        return res.status(409).json({
          error: 'Conflict: Application was concurrently modified by another action',
        });
      }

      const refreshedProg = await LearningProgram.findById(initialProgram._id);

      return res.status(200).json({
        success: true,
        message: 'Applicant selected successfully',
        application: {
          id: updatedApp._id.toString(),
          status: updatedApp.status,
          reviewedAt: updatedApp.reviewedAt,
        },
        program: {
          id: initialProgram._id.toString(),
          enrolledCount: refreshedProg?.enrolledCount ?? (reservedProg?.enrolledCount ?? 1),
          capacity: initialProgram.capacity,
        },
      });
    }

    return res.status(400).json({ error: 'Unhandled status transition request' });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating application status');
  }
};

recruitersRouter.patch(
  [
    '/learning-programs/:programId/applications/:applicationId',
    '/learning-programs/:programId/applications/:applicationId/status',
    '/learning-programs/applications/:applicationId/status',
  ],
  authMiddleware,
  handleLearningProgramApplicationStatusUpdate
);

// PUT /api/recruiters/me/profile — updates the logged-in recruiter's own User document
// Authenticated; strictly uses req.user.userId (never accepts or trusts client-supplied userId)
recruitersRouter.put('/me/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { company, phone, linkedinUrl, bio, designation, department } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully (demo mode)',
        user: {
          id: recruiterId,
          ...(company !== undefined && { company: String(company).trim() }),
          ...(phone !== undefined && { phone: String(phone).trim() }),
          ...(linkedinUrl !== undefined && { linkedinUrl: String(linkedinUrl).trim() }),
          ...(bio !== undefined && { bio: String(bio).trim() }),
          ...(designation !== undefined && { designation: String(designation).trim() }),
          ...(department !== undefined && { department: String(department).trim() }),
        },
      });
    }

    let userObjId: any = recruiterId;
    try {
      if (mongoose.Types.ObjectId.isValid(recruiterId)) {
        userObjId = new mongoose.Types.ObjectId(recruiterId);
      }
    } catch {
      userObjId = recruiterId;
    }

    const user = await User.findOne({
      $or: [{ _id: userObjId }, { _id: recruiterId }],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Partial update only fields present in body
    if (company !== undefined) user.company = String(company).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (linkedinUrl !== undefined) user.linkedinUrl = String(linkedinUrl).trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (designation !== undefined) user.designation = String(designation).trim();
    if (department !== undefined) user.department = String(department).trim();

    await user.save();

    const safeUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company || '',
      phone: user.phone || '',
      linkedinUrl: user.linkedinUrl || '',
      bio: user.bio || '',
      designation: user.designation || '',
      department: user.department || '',
    };

    return res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      user: safeUser,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating profile');
  }
});

const VALID_ACADEMIC_OPPORTUNITY_TYPES: AcademicOpportunityType[] = [
  'Faculty Internship',
  'Industrial Training',
  'FDP',
  'Consultancy',
  'Research Collaboration',
];

// POST /api/recruiters/academic-opportunities
recruitersRouter.post('/academic-opportunities', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: missing authenticated recruiter credentials' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const {
      title,
      type,
      description,
      duration,
      mode,
      requiredExpertise,
      stipendOrHonorarium,
      deadline,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Opportunity title is required' });
    }

    if (!type || !VALID_ACADEMIC_OPPORTUNITY_TYPES.includes(type as AcademicOpportunityType)) {
      return res.status(400).json({
        error: `Opportunity type must be one of: ${VALID_ACADEMIC_OPPORTUNITY_TYPES.join(', ')}`,
      });
    }

    // Default company from recruiter profile if not provided or empty in body
    let companyName = typeof req.body.company === 'string' ? req.body.company.trim() : '';
    if (!companyName && mongoose.connection.readyState === 1) {
      try {
        const recruiterUser = await User.findById(recruiterId).select('company');
        if (recruiterUser?.company) {
          companyName = recruiterUser.company.trim();
        }
      } catch (err) {
        console.warn('Could not fetch recruiter company for academic opportunity:', err);
      }
    }
    if (!companyName) {
      companyName = 'Industry Partner';
    }

    // Safely parse requiredExpertise
    const expertiseArray: string[] = Array.isArray(requiredExpertise)
      ? requiredExpertise.map((item: any) => String(item).trim()).filter(Boolean)
      : typeof requiredExpertise === 'string'
      ? requiredExpertise.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    // Valid modes: 'Online' | 'Offline' | 'Hybrid'
    const validModes = ['Online', 'Offline', 'Hybrid'];
    const oppMode = validModes.includes(mode) ? mode : 'Online';

    let userObjId: any = recruiterId;
    try {
      if (mongoose.Types.ObjectId.isValid(recruiterId)) {
        userObjId = new mongoose.Types.ObjectId(recruiterId);
      }
    } catch {
      userObjId = recruiterId;
    }

    let parsedDeadline: Date | undefined = undefined;
    if (deadline) {
      const d = new Date(deadline);
      if (!isNaN(d.getTime())) {
        parsedDeadline = d;
      }
    }

    if (mongoose.connection.readyState === 1) {
      const opportunity = await AcademicOpportunity.create({
        postedBy: userObjId, // Never trust body
        company: companyName,
        title: title.trim(),
        type: type as AcademicOpportunityType,
        description: description ? String(description).trim() : '',
        duration: duration ? String(duration).trim() : '4 Weeks',
        mode: oppMode as 'Online' | 'Offline' | 'Hybrid',
        requiredExpertise: expertiseArray,
        stipendOrHonorarium: stipendOrHonorarium ? String(stipendOrHonorarium).trim() : undefined,
        deadline: parsedDeadline,
        status: 'Active',
      });

      return res.status(201).json({
        success: true,
        message: 'Academic opportunity created successfully',
        opportunity,
      });
    }

    // Fallback if DB is offline
    const mockOpportunity = {
      _id: 'ao_' + Date.now(),
      id: 'ao_' + Date.now(),
      postedBy: userObjId,
      company: companyName,
      title: title.trim(),
      type: type as AcademicOpportunityType,
      description: description ? String(description).trim() : '',
      duration: duration ? String(duration).trim() : '4 Weeks',
      mode: oppMode,
      requiredExpertise: expertiseArray,
      stipendOrHonorarium: stipendOrHonorarium ? String(stipendOrHonorarium).trim() : undefined,
      deadline: parsedDeadline,
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return res.status(201).json({
      success: true,
      message: 'Academic opportunity created successfully (offline mode)',
      opportunity: mockOpportunity,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error creating academic opportunity');
  }
});

// GET /api/recruiters/academic-opportunities
recruitersRouter.get('/academic-opportunities', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: missing authenticated recruiter credentials' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    let opportunities: any[] = [];

    if (mongoose.connection.readyState === 1) {
      let userObjId: any = recruiterId;
      try {
        if (mongoose.Types.ObjectId.isValid(recruiterId)) {
          userObjId = new mongoose.Types.ObjectId(recruiterId);
        }
      } catch {
        userObjId = recruiterId;
      }

      opportunities = await AcademicOpportunity.find({
        $or: [{ postedBy: recruiterId }, { postedBy: userObjId }],
      }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      opportunities,
      count: opportunities.length,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching academic opportunities');
  }
});

// PATCH /api/recruiters/applications/:applicationId/completion
// Updates completion tracking and mentor feedback for an offered application, with strict recruiter ownership check
recruitersRouter.patch('/applications/:applicationId/completion', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recruiterId = req.user?.userId;
    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: Recruiter authentication required' });
    }
    if (req.user?.role !== 'industry') {
      return res.status(403).json({ error: 'Forbidden: Industry recruiter access required' });
    }

    const { applicationId } = req.params;
    const { completionStatus, rating, comments } = req.body;

    const VALID_COMPLETION_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Discontinued'] as const;
    if (completionStatus && !VALID_COMPLETION_STATUSES.includes(completionStatus)) {
      return res.status(400).json({
        error: `Invalid completionStatus. Must be one of: ${VALID_COMPLETION_STATUSES.join(', ')}`,
      });
    }

    if (rating !== undefined && rating !== null) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          error: 'Invalid rating. Must be a number between 1 and 5',
        });
      }
    }

    if (mongoose.connection.readyState !== 1) {
      let mentorFeedback: any = undefined;
      if (rating !== undefined || comments !== undefined) {
        mentorFeedback = {
          rating: rating !== undefined ? Number(rating) : 5,
          comments: comments ? String(comments).trim() : '',
          submittedAt: new Date(),
        };
      }
      return res.status(200).json({
        success: true,
        message: 'Application completion tracking updated (mock mode)',
        application: {
          id: applicationId,
          _id: applicationId,
          status: 'Offer',
          completionStatus: completionStatus || 'Not Started',
          mentorFeedback,
          completedAt: completionStatus === 'Completed' ? new Date() : undefined,
        },
      });
    }

    let appObjectId: any = applicationId;
    try {
      if (mongoose.Types.ObjectId.isValid(applicationId)) {
        appObjectId = new mongoose.Types.ObjectId(applicationId);
      }
    } catch {
      appObjectId = applicationId;
    }

    // 1. Fetch application
    const application = await JobApplication.findOne({
      $or: [{ _id: appObjectId }, { _id: applicationId }],
    });

    if (!application) {
      return res.status(404).json({ error: 'Job application not found' });
    }

    if (!application.jobPostingId) {
      return res.status(403).json({
        error: 'Forbidden: Cannot verify ownership for this application because it is not linked to a job posting',
      });
    }

    // 2. Fetch the linked JobPosting to verify ownership
    let jobPostingIdObj: any = application.jobPostingId;
    try {
      if (mongoose.Types.ObjectId.isValid(application.jobPostingId)) {
        jobPostingIdObj = new mongoose.Types.ObjectId(application.jobPostingId);
      }
    } catch {
      jobPostingIdObj = application.jobPostingId;
    }

    const jobPosting = await JobPosting.findOne({
      $or: [{ _id: jobPostingIdObj }, { _id: application.jobPostingId }],
    });

    if (!jobPosting) {
      return res.status(404).json({ error: 'Associated job posting not found' });
    }

    // 3. Strict Recruiter Ownership Check
    // Verifies that the job posting strictly belongs to the requesting recruiter
    const recruiterIdStr = recruiterId.toString();
    const postingRecruiterIdStr = jobPosting.recruiterId ? jobPosting.recruiterId.toString() : null;

    if (!postingRecruiterIdStr || postingRecruiterIdStr !== recruiterIdStr) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to modify applications for this job posting',
      });
    }

    // Additionally validate that the application's current status is 'Offer' before allowing a completion update
    if (application.status !== 'Offer') {
      return res.status(400).json({
        error: 'Cannot update completion tracking: application must have reached Offer status before tracking completion and mentor feedback',
      });
    }

    // 4. Update completionStatus, mentorFeedback, and completedAt
    if (completionStatus) {
      application.completionStatus = completionStatus;
      if (completionStatus === 'Completed') {
        application.completedAt = new Date();
      }
    }

    if (rating !== undefined || comments !== undefined) {
      application.mentorFeedback = {
        rating: rating !== undefined ? Number(rating) : (application.mentorFeedback?.rating ?? 5),
        comments: comments !== undefined ? String(comments).trim() : (application.mentorFeedback?.comments ?? ''),
        submittedAt: new Date(),
      };
    }

    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Application completion tracking and feedback updated successfully',
      application: {
        id: application._id.toString(),
        _id: application._id.toString(),
        jobPostingId: application.jobPostingId ? application.jobPostingId.toString() : null,
        company: application.company,
        role: application.role,
        type: application.type,
        status: application.status,
        completionStatus: application.completionStatus,
        mentorFeedback: application.mentorFeedback,
        completedAt: application.completedAt,
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating application completion');
  }
});





