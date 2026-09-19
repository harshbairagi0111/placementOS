import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { SkillQuestion, ISkillQuestion } from '../src/models/SkillQuestion';
import { SkillAssessmentResult } from '../src/models/SkillAssessmentResult';
import { StudentSkillProfile, IProfileSkillEntry } from '../src/models/StudentSkillProfile';
import { User } from '../src/models/User';
import { JobPosting } from '../src/models/JobPosting';
import {
  CANONICAL_SKILLS,
  toCanonicalSkill,
  calculateProficiencyLevel,
  evaluateStrengthsAndGaps,
  PROFICIENCY_THRESHOLDS,
  SkillCategory,
  ProficiencyLevel,
} from '../src/lib/skillCatalog';
import {
  calculateRoleMatch,
  calculateSkillGap,
  classifySkillStatus,
  normalizeSkillRequirement,
  consolidateSkillRequirements,
  INDUSTRY_ROLES,
  getIndustryRoleByName,
  SKILL_GAP_THRESHOLDS,
  RawSkillRequirement,
} from '../src/lib/skillGapService';

export const skillsRouter = express.Router();

// Fallback in-memory loader for questions if DB is offline or empty
function loadLocalQuestions(): any[] {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'skillQuestions.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn('[Skill Route] Unable to read local skillQuestions.json fallback:', err);
  }
  return [];
}

/**
 * GET /api/skills/catalog
 * Returns canonical skill registry, categories, and evaluation thresholds.
 */
skillsRouter.get('/catalog', (req, res) => {
  res.json({
    success: true,
    skills: CANONICAL_SKILLS,
    thresholds: PROFICIENCY_THRESHOLDS,
    categories: [
      {
        id: 'technical',
        title: 'Technical Skills Assessment',
        description: 'Rigorous objective evaluation across CS fundamentals, full-stack technologies, databases, and system design.',
        availableSkills: CANONICAL_SKILLS.filter((s) => s.category === 'technical').map((s) => s.name),
      },
      {
        id: 'soft',
        title: 'Soft Skills & Behavioral Assessment',
        description: 'Scenario-based workplace evaluations testing leadership, teamwork, adaptability, communication, and decision-making.',
        availableSkills: CANONICAL_SKILLS.filter((s) => s.category === 'soft').map((s) => s.name),
      },
    ],
  });
});

/**
 * GET /api/skills/assessments
 * Overview of available assessments for the student dashboard.
 */
skillsRouter.get('/assessments', async (req, res) => {
  try {
    let techCount = 0;
    let softCount = 0;

    if (mongoose.connection.readyState === 1) {
      techCount = await SkillQuestion.countDocuments({ category: 'technical', isActive: true });
      softCount = await SkillQuestion.countDocuments({ category: 'soft', isActive: true });
    }

    if (techCount === 0 || softCount === 0) {
      const local = loadLocalQuestions();
      techCount = local.filter((q) => q.category === 'technical').length;
      softCount = local.filter((q) => q.category === 'soft').length;
    }

    res.json({
      success: true,
      assessments: [
        {
          id: 'technical',
          title: 'Technical Skills Assessment',
          category: 'technical',
          questionCount: techCount || 20,
          estimatedMinutes: 25,
          format: 'Multiple Choice & Code Output Analysis',
          skillsCovered: CANONICAL_SKILLS.filter((s) => s.category === 'technical').map((s) => s.name),
        },
        {
          id: 'soft',
          title: 'Soft Skills & Workplace Scenarios',
          category: 'soft',
          questionCount: softCount || 10,
          estimatedMinutes: 15,
          format: 'Scenario-Based Behavioral Rubric',
          skillsCovered: CANONICAL_SKILLS.filter((s) => s.category === 'soft').map((s) => s.name),
        },
        {
          id: 'combined',
          title: 'Full Industry Readiness Diagnostic',
          category: 'combined',
          questionCount: (techCount || 20) + (softCount || 10),
          estimatedMinutes: 35,
          format: 'Comprehensive Technical & Soft Skills Evaluation',
          skillsCovered: CANONICAL_SKILLS.map((s) => s.name),
        },
      ],
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch assessments');
  }
});

/**
 * GET /api/skills/questions
 * Retrieves questions for an assessment.
 * CRITICAL: Strips correctAnswerIndex, optionWeights, and explanation so students cannot inspect answers!
 */
skillsRouter.get('/questions', async (req, res) => {
  try {
    const category = (req.query.category as string) || 'all';
    const skillsParam = (req.query.skills as string) || '';
    const count = parseInt(req.query.count as string, 10) || 0;

    let filter: any = { isActive: true };
    if (category === 'technical' || category === 'soft') {
      filter.category = category;
    }

    if (skillsParam) {
      const requestedSkills = skillsParam
        .split(',')
        .map((s) => toCanonicalSkill(s.trim()).name)
        .filter(Boolean);
      if (requestedSkills.length > 0) {
        filter.skill = { $in: requestedSkills };
      }
    }

    let questions: any[] = [];

    if (mongoose.connection.readyState === 1) {
      questions = await SkillQuestion.find(filter).lean();
    }

    // Fallback if MongoDB is not initialized or questions collection is empty
    if (!questions || questions.length === 0) {
      let local = loadLocalQuestions();
      if (category === 'technical' || category === 'soft') {
        local = local.filter((q) => q.category === category);
      }
      if (skillsParam) {
        const requested = new Set(
          skillsParam.split(',').map((s) => toCanonicalSkill(s.trim()).name.toLowerCase())
        );
        local = local.filter((q) => requested.has(q.skill.toLowerCase()));
      }
      questions = local.map((q, idx) => ({ ...q, _id: q._id || `local_q_${idx + 1}` }));
    }

    // Shuffle questions deterministically for freshness
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = count > 0 ? shuffled.slice(0, count) : shuffled;

    // Sanitize questions: strip correctAnswerIndex, optionWeights, and explanation
    const sanitizedQuestions = selected.map((q) => ({
      id: q._id.toString(),
      _id: q._id.toString(),
      category: q.category,
      skill: q.skill,
      skillId: q.skillId || toCanonicalSkill(q.skill).id,
      difficulty: q.difficulty,
      questionText: q.questionText,
      scenarioText: q.scenarioText || null,
      codeSnippet: q.codeSnippet || null,
      options: q.options,
    }));

    res.json({
      success: true,
      total: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to retrieve assessment questions');
  }
});

/**
 * POST /api/skills/submit
 * Submits student answers, calculates score per skill, assigns proficiency levels,
 * identifies strengths and gaps, persists the result, and updates the student's profile.
 */
skillsRouter.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can take and submit skill assessments' });
    }

    const { assessmentType = 'technical', answers = [] } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'No answers provided for evaluation' });
    }

    // Load full question records from DB or local fallback to compare answers securely
    const questionIds = answers.map((a) => a.questionId).filter(Boolean);
    let questionMap = new Map<string, any>();

    if (mongoose.connection.readyState === 1 && questionIds.length > 0) {
      const dbQuestions = await SkillQuestion.find({
        $or: [
          { _id: { $in: questionIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id)) } },
          { _id: { $in: questionIds } },
        ],
      }).lean();

      for (const q of dbQuestions) {
        questionMap.set(q._id.toString(), q);
      }
    }

    // Local fallback support if questions were served from local memory
    if (questionMap.size === 0) {
      const local = loadLocalQuestions();
      local.forEach((q, idx) => {
        const id = q._id ? q._id.toString() : `local_q_${idx + 1}`;
        questionMap.set(id, { ...q, _id: id });
      });
    }

    // Group evaluations by skill
    const skillStats = new Map<
      string,
      {
        skill: string;
        skillId: string;
        category: SkillCategory;
        totalQuestions: number;
        correctCount: number;
        totalPointsEarned: number;
        maxPossiblePoints: number;
      }
    >();

    const answerRecords: any[] = [];
    let totalQuestionsCount = 0;
    let totalCorrectCount = 0;
    let grandTotalPoints = 0;
    let grandMaxPoints = 0;

    for (const ans of answers) {
      const q = questionMap.get(ans.questionId?.toString());
      if (!q) continue;

      totalQuestionsCount += 1;
      const canonical = toCanonicalSkill(q.skill);
      const isTechnical = q.category === 'technical';
      const selectedIdx = ans.selectedOptionIndex;

      let isCorrect = false;
      let scoreEarned = 0;

      if (isTechnical) {
        isCorrect = selectedIdx === q.correctAnswerIndex;
        scoreEarned = isCorrect ? 100 : 0;
        if (isCorrect) totalCorrectCount += 1;
        grandTotalPoints += scoreEarned;
        grandMaxPoints += 100;
      } else {
        // Soft skill scenario rubric scoring
        const weights = Array.isArray(q.optionWeights) && q.optionWeights.length > 0
          ? q.optionWeights
          : [100, 75, 45, 15];
        const weightEarned = typeof weights[selectedIdx] === 'number' ? weights[selectedIdx] : 0;
        scoreEarned = weightEarned;
        isCorrect = weightEarned >= 70;
        if (isCorrect) totalCorrectCount += 1;
        grandTotalPoints += scoreEarned;
        grandMaxPoints += 100;
      }

      answerRecords.push({
        questionId: q._id.toString(),
        skill: canonical.name,
        category: q.category,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: selectedIdx,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect,
        scoreEarned,
        explanation: q.explanation || '',
      });

      // Update per-skill stats
      const existing = skillStats.get(canonical.name) || {
        skill: canonical.name,
        skillId: canonical.id,
        category: q.category as SkillCategory,
        totalQuestions: 0,
        correctCount: 0,
        totalPointsEarned: 0,
        maxPossiblePoints: 0,
      };

      existing.totalQuestions += 1;
      if (isCorrect) existing.correctCount += 1;
      existing.totalPointsEarned += scoreEarned;
      existing.maxPossiblePoints += 100;

      skillStats.set(canonical.name, existing);
    }

    if (totalQuestionsCount === 0) {
      return res.status(400).json({ error: 'Could not match any submitted answers with assessment questions' });
    }

    // Compute final percentage and proficiency level for each skill
    const skillScores: any[] = [];
    for (const stat of skillStats.values()) {
      const percentage = stat.maxPossiblePoints > 0
        ? Math.round((stat.totalPointsEarned / stat.maxPossiblePoints) * 100)
        : 0;

      skillScores.push({
        skill: stat.skill,
        skillId: stat.skillId,
        category: stat.category,
        score: percentage,
        proficiencyLevel: calculateProficiencyLevel(percentage),
        attemptedQuestions: stat.totalQuestions,
        correctAnswers: stat.correctCount,
      });
    }

    const overallScore = grandMaxPoints > 0
      ? Math.round((grandTotalPoints / grandMaxPoints) * 100)
      : 0;

    // Load active jobs to benchmark industry requirements
    let benchmarkSkills: string[] = [];
    try {
      if (mongoose.connection.readyState === 1) {
        const activeJobs = await JobPosting.find({ status: 'Active' }, 'requiredSkills').lean();
        for (const j of activeJobs) {
          if (Array.isArray(j.requiredSkills)) {
            for (const r of j.requiredSkills) {
              if (r) {
                const norm = normalizeSkillRequirement(r);
                benchmarkSkills.push(norm.skill);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Skill Submit] Could not fetch job postings for benchmark:', e);
    }

    // Evaluate Strengths and Skill Gaps deterministically
    const { strengths, skillGaps } = evaluateStrengthsAndGaps(
      skillScores.map((s) => ({ skill: s.skill, score: s.score, category: s.category })),
      benchmarkSkills
    );

    // Save individual assessment submission record
    let assessmentResult: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        assessmentResult = await SkillAssessmentResult.create({
          userId,
          assessmentType,
          skillsEvaluated: skillScores.map((s) => s.skill),
          skillScores,
          overallScore,
          totalQuestions: totalQuestionsCount,
          totalCorrect: totalCorrectCount,
          answers: answerRecords.map((a) => ({
            questionId: a.questionId,
            skill: a.skill,
            category: a.category,
            selectedOptionIndex: a.selectedOptionIndex,
            isCorrect: a.isCorrect,
            scoreEarned: a.scoreEarned,
          })),
          completedAt: new Date(),
        });
      } catch (err) {
        console.error('[Skill Submit] Error saving SkillAssessmentResult:', err);
      }

      // Upsert consolidated StudentSkillProfile
      try {
        let profile = await StudentSkillProfile.findOne({ userId });
        if (!profile) {
          profile = new StudentSkillProfile({
            userId,
            technicalSkills: [],
            softSkills: [],
            overallTechnicalScore: 0,
            overallSoftScore: 0,
            strengths: [],
            skillGaps: [],
          });
        }

        // Merge newly assessed skills with profile
        for (const item of skillScores) {
          const targetArray = item.category === 'technical' ? profile.technicalSkills : profile.softSkills;
          const idx = targetArray.findIndex((entry) => entry.skill === item.skill);

          if (idx >= 0) {
            // Update existing entry (weighted moving average of new and existing score)
            const existingEntry = targetArray[idx];
            const updatedScore = Math.round((existingEntry.score + item.score) / 2);
            targetArray[idx].score = updatedScore;
            targetArray[idx].proficiencyLevel = calculateProficiencyLevel(updatedScore);
            targetArray[idx].assessmentType = assessmentType;
            targetArray[idx].lastAssessedAt = new Date();
            targetArray[idx].assessmentCount = (existingEntry.assessmentCount || 1) + 1;
          } else {
            targetArray.push({
              skill: item.skill,
              skillId: item.skillId,
              category: item.category,
              score: item.score,
              proficiencyLevel: item.proficiencyLevel,
              assessmentType,
              lastAssessedAt: new Date(),
              assessmentCount: 1,
            });
          }
        }

        // Calculate overall technical and soft score averages
        if (profile.technicalSkills.length > 0) {
          profile.overallTechnicalScore = Math.round(
            profile.technicalSkills.reduce((sum, s) => sum + s.score, 0) / profile.technicalSkills.length
          );
        }
        if (profile.softSkills.length > 0) {
          profile.overallSoftScore = Math.round(
            profile.softSkills.reduce((sum, s) => sum + s.score, 0) / profile.softSkills.length
          );
        }

        profile.strengths = strengths.map((s) => s.skill);
        profile.skillGaps = skillGaps.map((g) => g.skill);
        profile.lastUpdated = new Date();

        await profile.save();

        // Also sync verified technical skills (>= 50% / Intermediate+) into User.skills
        const qualifyingSkills = profile.technicalSkills
          .filter((s) => s.score >= PROFICIENCY_THRESHOLDS.intermediate.min)
          .map((s) => s.skill);

        if (qualifyingSkills.length > 0) {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { skills: { $each: qualifyingSkills } },
          });
        }
      } catch (err) {
        console.error('[Skill Submit] Error updating StudentSkillProfile:', err);
      }
    }

    res.json({
      success: true,
      assessmentId: assessmentResult?._id || 'local_result',
      assessmentType,
      overallScore,
      totalQuestions: totalQuestionsCount,
      totalCorrect: totalCorrectCount,
      skillScores,
      strengths,
      skillGaps,
      answersReview: answerRecords,
      completedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to evaluate assessment submission');
  }
});

/**
 * GET /api/skills/profile
 * Returns the student's complete aggregated Skill Profile, strengths, and skill gaps.
 */
skillsRouter.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    let profile: any = null;
    let user: any = null;
    let recentResults: any[] = [];

    if (mongoose.connection.readyState === 1) {
      profile = await StudentSkillProfile.findOne({ userId }).lean();
      user = await User.findById(userId).select('name email targetRole skills').lean();
      recentResults = await SkillAssessmentResult.find({ userId })
        .sort({ completedAt: -1 })
        .limit(5)
        .select('-answers')
        .lean();
    }

    const hasCompletedAssessment = Boolean(
      profile &&
        ((profile.technicalSkills && profile.technicalSkills.length > 0) ||
          (profile.softSkills && profile.softSkills.length > 0))
    );

    const studentData = {
      id: user?._id?.toString() || userId,
      name: user?.name || 'Student',
      email: user?.email || '',
      targetRole: user?.targetRole || null,
      skills: Array.isArray(user?.skills) ? user.skills : [],
    };

    // If profile exists in DB, return it
    if (profile) {
      return res.json({
        success: true,
        hasCompletedAssessment,
        student: studentData,
        profile: {
          technicalSkills: profile.technicalSkills || [],
          softSkills: profile.softSkills || [],
          overallTechnicalScore: profile.overallTechnicalScore || 0,
          overallSoftScore: profile.overallSoftScore || 0,
          strengths: profile.strengths || [],
          skillGaps: profile.skillGaps || [],
          lastUpdated: profile.lastUpdated,
        },
        recentAssessments: recentResults,
      });
    }

    // Default unassessed state with clear diagnostic prompt
    res.json({
      success: true,
      hasCompletedAssessment: false,
      student: studentData,
      profile: {
        technicalSkills: [],
        softSkills: [],
        overallTechnicalScore: null,
        overallSoftScore: null,
        strengths: [],
        skillGaps: [
          'Data Structures & Algorithms',
          'SQL',
          'System Design',
          'Communication',
          'Teamwork',
        ],
        lastUpdated: null,
      },
      recentAssessments: [],
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to retrieve skill profile');
  }
});

/**
 * GET /api/skills/roles
 * Returns all canonical industry roles with benchmark minimum skill levels (SIH 26044).
 */
skillsRouter.get('/roles', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      roles: INDUSTRY_ROLES,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch industry roles');
  }
});

/**
 * Helper function to run deterministic gap analysis for a student against a role or job posting
 */
async function performStudentGapAnalysis(
  userId: string,
  roleOrJobIdentifier?: string
) {
  let profile: any = null;
  let user: any = null;
  let activeJobs: any[] = [];

  if (mongoose.connection.readyState === 1) {
    profile = await StudentSkillProfile.findOne({ userId }).lean();
    user = await User.findById(userId).select('name email targetRole skills').lean();
    activeJobs = await JobPosting.find({ status: 'Active' }).lean();
  }

  // Combine student's assessed skills
  const studentAssessedSkills: any[] = [];
  if (profile) {
    if (Array.isArray(profile.technicalSkills)) {
      studentAssessedSkills.push(...profile.technicalSkills);
    }
    if (Array.isArray(profile.softSkills)) {
      studentAssessedSkills.push(...profile.softSkills);
    }
  }

  // Determine which role / job to benchmark against
  let roleInfo: {
    id: string;
    title: string;
    type: 'industry_role' | 'job_posting';
    company?: string;
    industry: string;
    description: string;
    jobId?: string;
  } | null = null;
  let requirementsToBenchmark: any[] = [];

  const candidateId = roleOrJobIdentifier?.trim();

  if (candidateId) {
    // 1. Check if identifier is an industry role by id or exact title
    const matchedIndustryRole = INDUSTRY_ROLES.find(
      (r) =>
        r.id.toLowerCase() === candidateId.toLowerCase() ||
        r.title.toLowerCase() === candidateId.toLowerCase()
    );

    if (matchedIndustryRole) {
      roleInfo = {
        id: matchedIndustryRole.id,
        title: matchedIndustryRole.title,
        type: 'industry_role',
        industry: matchedIndustryRole.industry,
        description: matchedIndustryRole.description,
      };
      requirementsToBenchmark = matchedIndustryRole.requirements;
    } else if (mongoose.Types.ObjectId.isValid(candidateId)) {
      // 2. Check if identifier is a MongoDB JobPosting ID
      const targetJob = activeJobs.find((j) => j._id?.toString() === candidateId);
      if (targetJob) {
        roleInfo = {
          id: targetJob._id.toString(),
          jobId: targetJob._id.toString(),
          title: targetJob.title,
          company: targetJob.company,
          type: 'job_posting',
          industry: 'Campus Recruitment',
          description: targetJob.description || `Campus recruitment drive by ${targetJob.company}`,
        };
        requirementsToBenchmark = Array.isArray(targetJob.requiredSkills)
          ? targetJob.requiredSkills
          : [];
      } else {
        return { notFound: true };
      }
    } else {
      // Check partial or fuzzy industry role name
      const matchedRole = INDUSTRY_ROLES.find(
        (r) =>
          r.id.toLowerCase().includes(candidateId.toLowerCase()) ||
          candidateId.toLowerCase().includes(r.id.toLowerCase()) ||
          r.title.toLowerCase().includes(candidateId.toLowerCase())
      );
      if (matchedRole) {
        roleInfo = {
          id: matchedRole.id,
          title: matchedRole.title,
          type: 'industry_role',
          industry: matchedRole.industry,
          description: matchedRole.description,
        };
        requirementsToBenchmark = matchedRole.requirements;
      } else {
        return { notFound: true };
      }
    }
  } else {
    // 3. No specific identifier provided:
    // If student has a targetRole defined, use that target role.
    if (user?.targetRole && user.targetRole.trim() !== '') {
      const targetMatch = getIndustryRoleByName(user.targetRole);
      roleInfo = {
        id: targetMatch.id,
        title: targetMatch.title,
        type: 'industry_role',
        industry: targetMatch.industry,
        description: targetMatch.description,
      };
      requirementsToBenchmark = targetMatch.requirements;
    } else {
      // Student has NO targetRole: DO NOT automatically select an arbitrary job or role!
      // Provide clean selection prompt while student profile remains independent.
      roleInfo = null;
      requirementsToBenchmark = [];
    }
  }

  // Run deterministic calculation only when a role or job benchmark is selected
  const matchResult = roleInfo
    ? calculateRoleMatch(studentAssessedSkills, requirementsToBenchmark)
    : null;

  return {
    student: {
      id: user?._id?.toString() || userId,
      name: user?.name || 'Student',
      email: user?.email || '',
      targetRole: user?.targetRole || null,
      skills: Array.isArray(user?.skills) ? user.skills : [],
    },
    hasCompletedAssessment: studentAssessedSkills.length > 0,
    roleInfo,
    analysis: matchResult,
    message: !roleInfo ? 'Select a target role to view your industry skill gap.' : undefined,
    availableRoles: INDUSTRY_ROLES.map((r) => ({
      id: r.id,
      title: r.title,
      industry: r.industry,
      description: r.description,
      requirementsCount: r.requirements.length,
    })),
    activeJobs: activeJobs.map((j) => ({
      id: j._id?.toString(),
      title: j.title,
      company: j.company,
      type: j.type,
      location: j.location,
      requiredSkillsCount: Array.isArray(j.requiredSkills) ? j.requiredSkills.length : 0,
    })),
  };
}

/**
 * GET /api/skills/gap-analysis
 * Deterministic Industry & Job Role Skill Gap Analysis (SIH 26044).
 * Query params: ?role=<roleId|roleName> or ?jobId=<jobId>
 */
skillsRouter.get('/gap-analysis', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const roleOrJobIdentifier =
      (req.query.role as string) || (req.query.jobId as string) || undefined;

    const result: any = await performStudentGapAnalysis(userId, roleOrJobIdentifier);

    if (result.notFound) {
      return res.status(404).json({ error: 'Role or job posting not found' });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to calculate skill gap analysis');
  }
});

/**
 * GET /api/skills/gap-analysis/:jobId
 * Evaluates skill gap against a specific job posting or industry role id.
 */
skillsRouter.get('/gap-analysis/:jobId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { jobId } = req.params;
    const result: any = await performStudentGapAnalysis(userId, jobId);

    if (result.notFound) {
      return res.status(404).json({ error: 'Role or job posting not found' });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to calculate job-specific skill gap analysis');
  }
});

/**
 * GET /api/skills/gaps
 * Computes deterministic skill gaps against active Job Postings & Target Roles.
 */
skillsRouter.get('/gaps', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    let profile: any = null;
    let user: any = null;
    let activeJobs: any[] = [];

    if (mongoose.connection.readyState === 1) {
      profile = await StudentSkillProfile.findOne({ userId }).lean();
      user = await User.findById(userId).select('skills targetRole').lean();
      activeJobs = await JobPosting.find({ status: 'Active' }).lean();
    }

    const roleOrJobIdentifier =
      (req.query.role as string) || (req.query.jobId as string) || undefined;

    // If a specific role or job is requested, delegate to the centralized performStudentGapAnalysis
    if (roleOrJobIdentifier) {
      const gapRes = await performStudentGapAnalysis(userId, roleOrJobIdentifier);
      if (gapRes.notFound) {
        return res.status(404).json({ error: 'Target role or job posting not found' });
      }

      const analysis = gapRes.analysis;
      const verifiedStrengths = analysis?.strengths || [];
      const improvementSkills = analysis?.needsImprovement || [];
      const identifiedGaps = analysis?.prioritySkills || [];

      return res.json({
        success: true,
        totalActiveJobsAnalyzed: activeJobs.length,
        matchPercentage: analysis?.matchPercentage ?? null,
        hasRequirements: analysis?.hasRequirements ?? false,
        verifiedStrengths,
        strengths: verifiedStrengths,
        needsImprovement: improvementSkills,
        improvementSkills,
        identifiedGaps,
        gaps: analysis?.gaps || [],
        notAssessed: analysis?.notAssessed || [],
        prioritySkills: identifiedGaps,
        totalRequirements: analysis?.totalRequirements ?? 0,
        assessedRequirementsCount: analysis?.assessedRequirementsCount ?? 0,
        userTargetRole: user?.targetRole || null,
        roleInfo: gapRes.roleInfo,
        message: analysis?.message,
      });
    }

    // Default: Benchmark against requirements demanded by active campus job postings
    const studentAssessedSkills: IProfileSkillEntry[] = [];
    if (profile) {
      if (Array.isArray(profile.technicalSkills)) {
        studentAssessedSkills.push(...profile.technicalSkills);
      }
      if (Array.isArray(profile.softSkills)) {
        studentAssessedSkills.push(...profile.softSkills);
      }
    }

    // Aggregate raw requirements and count demand frequency per canonical skill across all active jobs
    const allRawRequirements: any[] = [];
    const demandCountMap = new Map<string, { count: number; category: SkillCategory }>();

    for (const job of activeJobs) {
      if (Array.isArray(job.requiredSkills)) {
        const seenInThisJob = new Set<string>();
        for (const raw of job.requiredSkills) {
          if (!raw) continue;
          allRawRequirements.push(raw);
          const normalized = normalizeSkillRequirement(raw);
          if (!seenInThisJob.has(normalized.skill)) {
            seenInThisJob.add(normalized.skill);
            const curr = demandCountMap.get(normalized.skill) || {
              count: 0,
              category: normalized.category,
            };
            curr.count += 1;
            demandCountMap.set(normalized.skill, curr);
          }
        }
      }
    }

    // Authoritative calculation via the centralized skill-gap service
    const matchResult = calculateRoleMatch(studentAssessedSkills, allRawRequirements);

    const decorateItem = (item: any) => {
      const demand = demandCountMap.get(item.skill);
      return {
        ...item,
        marketDemandCount: demand?.count || 1,
        currentScore: item.studentScore,
        score: item.studentScore,
        level: item.studentProficiency,
        gapSeverity:
          item.status === 'STRONG'
            ? 'Verified Strength'
            : item.status === 'NEEDS_IMPROVEMENT'
            ? 'Moderate (Needs Polish)'
            : item.status === 'NOT_ASSESSED'
            ? 'Critical (Unverified)'
            : 'High (Foundational Gaps)',
      };
    };

    const verifiedStrengths = (matchResult.strengths || []).map(decorateItem);
    const improvementSkills = (matchResult.needsImprovement || []).map(decorateItem);
    const gapsList = (matchResult.gaps || []).map(decorateItem);
    const notAssessedList = (matchResult.notAssessed || []).map(decorateItem);
    const identifiedGaps = (matchResult.prioritySkills || []).map(decorateItem);

    res.json({
      success: true,
      totalActiveJobsAnalyzed: activeJobs.length,
      matchPercentage: matchResult.matchPercentage,
      hasRequirements: matchResult.hasRequirements,
      verifiedStrengths,
      strengths: verifiedStrengths,
      needsImprovement: improvementSkills,
      improvementSkills,
      identifiedGaps,
      gaps: gapsList,
      notAssessed: notAssessedList,
      prioritySkills: identifiedGaps,
      totalRequirements: matchResult.totalRequirements,
      assessedRequirementsCount: matchResult.assessedRequirementsCount,
      userTargetRole: user?.targetRole || null,
      message: matchResult.message,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to analyze skill gaps');
  }
});

/**
 * GET /api/skills/history
 * Returns the student's past assessment submissions.
 */
skillsRouter.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    let history: any[] = [];
    if (mongoose.connection.readyState === 1) {
      history = await SkillAssessmentResult.find({ userId })
        .sort({ completedAt: -1 })
        .limit(20)
        .lean();
    }

    res.json({
      success: true,
      total: history.length,
      history,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch assessment history');
  }
});
