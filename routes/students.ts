import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSafeServerError } from './errorHandler';
import { User } from '../src/models/User';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { Badge } from '../src/models/Badge';
import { Roadmap } from '../src/models/Roadmap';
import { Resume } from '../src/models/Resume';
import { CodingProgress } from '../src/models/CodingProgress';
import { JobApplication } from '../src/models/JobApplication';
import { Portfolio } from '../src/models/Portfolio';
import { AptitudeTestSession } from '../src/models/AptitudeTestSession';
import { JobPosting } from '../src/models/JobPosting';
import { LearningProgram } from '../src/models/LearningProgram';
import { LearningProgramApplication } from '../src/models/LearningProgramApplication';
import { StudentSkillProfile } from '../src/models/StudentSkillProfile';
import { Project } from '../src/models/Project';
import { Internship } from '../src/models/Internship';
import { Achievement } from '../src/models/Achievement';
import { Certification } from '../src/models/Certification';
import { getDigitalStudentPortfolio } from '../src/lib/portfolioService';
import { toCanonicalSkill } from '../src/lib/skillCatalog';
import {
  normalizeSkillRequirement,
  calculateRoleMatch,
  classifySkillStatus,
  SKILL_GAP_THRESHOLDS,
  evaluateOpportunityRecommendation,
  rankOpportunityRecommendations,
  OpportunityRecommendation,
} from '../src/lib/skillGapService';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { inMemoryUserBadges } from './badges';

export const studentsRouter = Router();

// GET /api/students/me/overview — returns overview cards & application pipeline for student dashboard
studentsRouter.get('/me/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    let atsResumeScore: number | null = null;
    let codingProblemsSolved = 0;
    let codingAccuracy = 0;
    let mockInterviewCount = 0;
    let avgRating = 0;
    let applicationPipeline: any[] = [];
    let roadmapProgress = {
      currentPhase: 0,
      totalPhases: 0,
      currentPhaseTitle: 'No roadmap generated yet',
    };

    if (mongoose.connection.readyState === 1 && userId) {
      try {
        let userObjectId: any = userId;
        try {
          userObjectId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjectId = userId;
        }

        const userObj = await User.findById(userId);

        // 1. Resume / ATS Score
        const resumeDoc = await Resume.findOne({
          $or: [{ userId: userObjectId }, { userId: String(userId) }],
        }).sort({ createdAt: -1 });
        if (resumeDoc && resumeDoc.atsScore) {
          atsResumeScore = resumeDoc.atsScore;
        } else if (userObj && userObj.readinessScore) {
          atsResumeScore = Math.min(98, Math.round(userObj.readinessScore * 0.95));
        }

        // 2. Coding Progress
        const codingDoc = await CodingProgress.findOne({
          $or: [{ userId: userObjectId }, { userId: String(userId) }],
        });
        if (codingDoc) {
          codingProblemsSolved = codingDoc.problemsSolved || 0;
          codingAccuracy = codingDoc.accuracyRate || 0;
        } else {
          codingProblemsSolved = 0;
          codingAccuracy = 0;
        }

        // 3. Mock Interview Stats
        const sessions = await MockInterviewSession.find({
          $or: [{ userId: userObjectId }, { userId: String(userId) }],
          verdict: { $ne: 'Pending' },
        });
        mockInterviewCount = sessions.length;
        if (sessions.length > 0) {
          const sumScore = sessions.reduce((acc, s) => acc + (s.overallScore || s.score || 0), 0);
          const rawAvgPct = sumScore / sessions.length;
          // Scale raw score to a 5-star rating if preferred or return as percentage
          avgRating = Math.round((rawAvgPct / 20) * 10) / 10; // e.g. 90/20 = 4.5
        } else if (userObj && userObj.mockInterviewsCompleted) {
          mockInterviewCount = userObj.mockInterviewsCompleted;
          avgRating = 4.8;
        }

        // 4. Job Applications Pipeline
        const apps = await JobApplication.find({
          $or: [{ userId: userObjectId }, { userId: String(userId) }],
        }).sort({ createdAt: -1 });

        if (apps.length > 0) {
          applicationPipeline = apps.map((a: any) => ({
            id: a._id.toString(),
            company: a.company,
            role: a.role,
            status: a.status,
            appliedAt: a.appliedAt || (a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '2026-07-28'),
            type: a.type,
            completionStatus: a.completionStatus || 'Not Started',
            mentorFeedback: a.mentorFeedback || null,
          }));
        }

        // 5. Roadmap Progress
        const roadmapDoc = await Roadmap.findOne({
          $or: [{ userId: userObjectId }, { userId: String(userId) }],
        }).sort({ createdAt: -1 });

        if (roadmapDoc && Array.isArray(roadmapDoc.phases) && roadmapDoc.phases.length > 0) {
          const totalPhases = roadmapDoc.phases.length;
          // Find first phase that has uncompleted topics or current active phase
          const activeIndex = roadmapDoc.phases.findIndex((p) =>
            p.topics && p.topics.some((t) => !t.completed)
          );
          const currentPhaseIndex = activeIndex >= 0 ? activeIndex + 1 : totalPhases;
          roadmapProgress = {
            currentPhase: currentPhaseIndex,
            totalPhases: totalPhases,
            currentPhaseTitle: roadmapDoc.phases[currentPhaseIndex - 1]?.title || 'Advanced Core Architecture',
          };
        } else {
          roadmapProgress = {
            currentPhase: 2,
            totalPhases: 4,
            currentPhaseTitle: 'Advanced Core Architecture & System Scalability',
          };
        }
      } catch (dbErr) {
        console.warn('MongoDB error in /me/overview:', dbErr);
      }
    }

    const activeCompanies = Array.from(
      new Set(applicationPipeline.map((a) => a.company))
    );

    return res.status(200).json({
      success: true,
      atsResumeScore,
      codingProblemsSolved,
      codingAccuracy,
      mockInterviewCount,
      avgRating,
      activeApplications: {
        count: applicationPipeline.length,
        companies: activeCompanies,
      },
      roadmapProgress,
      applicationPipeline,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching student overview');
  }
});

// GET /api/students/me/company-readiness — computes real match score per company for logged in user
studentsRouter.get('/me/company-readiness', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    let userObjectId: any = userId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch {
      userObjectId = userId;
    }

    const userObjFilter = { $or: [{ userId: userObjectId }, { userId: String(userId) }] };

    let atsScore: number | null = null;
    let portfolioQualityScore: number | null = null;
    let codingSolved = 0;
    let codingAccuracy = 0;
    let hasCodingDoc = false;
    let mockSessions: any[] = [];
    let latestAptitudeSession: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const resumeDoc = await Resume.findOne(userObjFilter).sort({ createdAt: -1 });
        if (resumeDoc && typeof resumeDoc.atsScore === 'number') {
          atsScore = resumeDoc.atsScore;
        }

        const portfolioDoc = await Portfolio.findOne(userObjFilter).sort({ createdAt: -1 });
        if (portfolioDoc && typeof portfolioDoc.qualityScore === 'number') {
          portfolioQualityScore = portfolioDoc.qualityScore;
        }

        const codingDoc = await CodingProgress.findOne(userObjFilter);
        if (codingDoc) {
          hasCodingDoc = true;
          codingSolved = codingDoc.problemsSolved || 0;
          codingAccuracy = codingDoc.accuracyRate || 0;
        }

        mockSessions = await MockInterviewSession.find({
          ...userObjFilter,
          verdict: { $ne: 'Pending' },
        });

        latestAptitudeSession = await AptitudeTestSession.findOne({
          ...userObjFilter,
          mode: 'mock',
          completedAt: { $ne: null },
        }).sort({ completedAt: -1 });
      } catch (dbErr) {
        console.warn('MongoDB query error in /company-readiness:', dbErr);
      }
    }

    const hasResume = atsScore !== null;
    const hasPortfolio = portfolioQualityScore !== null;
    const hasCoding = hasCodingDoc && (codingSolved > 0 || codingAccuracy > 0);
    const codingScore = hasCoding ? Math.min(100, Math.round(((codingSolved / 200) * 50) + (codingAccuracy * 0.5))) : null;
    const hasAptitude = latestAptitudeSession && typeof latestAptitudeSession.overallScore === 'number';
    const aptitudeScore = hasAptitude ? latestAptitudeSession.overallScore : null;

    const defaultCompanies = [
      {
        company: 'Google',
        logo: '🌐',
        role: 'Software Engineer (L3 / SDE 1)',
        cutoffPct: 85,
        focusArea: 'Advanced Graphs, Dynamic Programming & Scale',
        frequentTopics: ['Graphs (BFS/DFS, Topological)', 'Dynamic Programming', 'Trie & String Algorithms', 'Concurrency & Memory Limits'],
        interviewRounds: [
          { round: 'Round 1: Online Assessment (OA)', desc: '2 Medium-Hard algorithmic coding questions (90 mins)' },
          { round: 'Round 2: Technical Interview 1', desc: 'Graph traversal, Shortest path optimization & Time Complexity' },
          { round: 'Round 3: Technical Interview 2', desc: 'Complex Data Structures & Scalable System Architecture' },
          { round: 'Round 4: Googleyness & Leadership', desc: 'Cross-functional collaboration, ethics & ambiguity resolution' }
        ],
        actionPlan: [
          'Solve 2 Hard DP on Trees problems on LeetCode / placementOS',
          'Review Concurrency primitives and Thread Safety in Java/C++',
          'Practice 1 AI Mock Voice Interview for Googleyness'
        ]
      },
      {
        company: 'Amazon',
        logo: '📦',
        role: 'SDE 1 (Full-Stack / Backend)',
        cutoffPct: 80,
        focusArea: 'Leadership Principles & Microservices LLD',
        frequentTopics: ['Tree & Binary Search', 'LRU Cache & OOP Design Patterns', 'Sliding Window & Two Pointers', 'Amazon Leadership Principles'],
        interviewRounds: [
          { round: 'Round 1: Online Assessment (OA)', desc: '2 Coding questions + Work Style Assessment' },
          { round: 'Round 2: Technical Loop 1 (DSA)', desc: 'Coding + 20 mins STAR Leadership questions' },
          { round: 'Round 3: Technical Loop 2 (LLD)', desc: 'Object Oriented Design (e.g., Parking Lot, Elevator) + STAR' },
          { round: 'Round 4: Bar Raiser Loop', desc: 'Deep dive into past projects & cultural alignment' }
        ],
        actionPlan: [
          'Revise STAR stories for Customer Obsession & Bias for Action',
          'Do a 30-min timed LLD practice for Design Amazon Shopping Cart'
        ]
      },
      {
        company: 'Razorpay',
        logo: '💳',
        role: 'Backend Engineer 1',
        cutoffPct: 82,
        focusArea: 'Payment Idempotency & Database Locks',
        frequentTopics: ['Database Locking & ACID', 'Distributed Caching (Redis)', 'Message Queues (Kafka)', 'Payment Gateway Design'],
        interviewRounds: [
          { round: 'Round 1: Machine Coding (2 hrs)', desc: 'Build working REST API with unit tests & persistence' },
          { round: 'Round 2: Problem Solving & DSA', desc: 'Data structures & algorithmic efficiency' },
          { round: 'Round 3: System Design & LLD', desc: 'Design payment gateway / rate limiter' },
          { round: 'Round 4: Engineering Manager', desc: 'Values, ownership, production debugging scenarios' }
        ],
        actionPlan: [
          'Review Distributed Locking using Redis (Redlock)',
          'Prepare machine coding boilerplate for Express / Go'
        ]
      },
      {
        company: 'Microsoft',
        logo: '💻',
        role: 'Software Engineer',
        cutoffPct: 80,
        focusArea: 'Core DSA & Low Level Design',
        frequentTopics: ['Linked Lists & Trees', 'String Manipulation', 'Design Patterns (Factory, Strategy)', 'Memory Management'],
        interviewRounds: [
          { round: 'Round 1: Codility Online Test', desc: '3 Algorithmic questions (90 mins)' },
          { round: 'Round 2: Technical Round 1', desc: 'DSA + OS fundamentals (Threads vs Processes)' },
          { round: 'Round 3: Technical Round 2', desc: 'Low level design + Code readability' },
          { round: 'Round 4: AA / Hiring Manager', desc: 'Behavioral + Architecture discussion' }
        ],
        actionPlan: [
          'Practice Factory & Observer design patterns in C++/TypeScript',
          'Revise OS Virtual Memory & Deadlocks'
        ]
      },
      {
        company: 'Swiggy',
        logo: '🛵',
        role: 'SDE 1 - Core Backend',
        cutoffPct: 78,
        focusArea: 'Geospatial Indexing & Node.js Async',
        frequentTopics: ['Geospatial H3 / QuadTree', 'Machine Coding (Delivery Partner Assignment)', 'Redis Caching', 'Node.js Event Loop'],
        interviewRounds: [
          { round: 'Round 1: Machine Coding Round', desc: 'Implement live order routing / delivery driver matcher' },
          { round: 'Round 2: DSA & Problem Solving', desc: 'Heaps, Trees, Graphs & HashMap optimization' },
          { round: 'Round 3: High Level Design', desc: 'Scalable food delivery order tracking system' },
          { round: 'Round 4: Culture & Managerial', desc: 'Ownership, speed vs quality tradeoffs' }
        ],
        actionPlan: [
          'Practice building a working driver-matching priority queue in 90 mins'
        ]
      },
      {
        company: 'Flipkart',
        logo: '🛒',
        role: 'SDE 1',
        cutoffPct: 82,
        focusArea: 'Flash Sale Scale & Distributed Caching',
        frequentTopics: ['Machine Coding (Flash Sale / Flipkart Daily)', 'Dynamic Programming', 'Graph Shortest Paths', 'Kafka Message Streaming'],
        interviewRounds: [
          { round: 'Round 1: Machine Coding (1.5 hrs)', desc: 'Clean OOP implementation with clean separation of concerns' },
          { round: 'Round 2: Problem Solving (DSA)', desc: 'Deep algorithmic & edge case evaluation' },
          { round: 'Round 3: Architecture & LLD', desc: 'Design Flipkart Flash Sale inventory lock' },
          { round: 'Round 4: Hiring Manager', desc: 'Cultural fitment & architectural tradeoffs' }
        ],
        actionPlan: [
          'Solve 2 Flipkart Machine Coding problem statements',
          'Study Redis eviction policies & TTL'
        ]
      }
    ];

    const resultList = defaultCompanies.map((c) => {
      // Find sessions targeting this company (case-insensitive match)
      const companySessions = mockSessions.filter((s) => {
        const targetComp = (s.targetCompany || s.company || '').toLowerCase();
        return targetComp.includes(c.company.toLowerCase());
      });

      let companyMockScore: number | null = null;
      if (companySessions.length > 0) {
        const sum = companySessions.reduce((acc: number, s: any) => acc + (s.overallScore || s.score || 0), 0);
        companyMockScore = Math.round(sum / companySessions.length);
      }

      const hasCompanyMock = companyMockScore !== null;
      const hasGeneralData = hasResume || hasPortfolio || hasCoding || hasAptitude;
      const hasRelevantActivity = hasCompanyMock || hasGeneralData;

      // Condition 1: Zero relevant activity for this company and no general data
      if (!hasRelevantActivity) {
        return {
          ...c,
          matchScore: null,
          readinessPct: null,
          status: 'Not enough data yet',
          matchStatus: 'Not enough data yet',
          clearProbability: 'Not enough data yet',
          basis: 'Not enough data yet',
          missingGaps: 'Complete a mock interview, take an aptitude mock test, or upload your resume to unlock this company\'s readiness score.',
          bars: [
            { name: 'Data Structures & Algorithms Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'System Architecture & LLD Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'Behavioral & Culture Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'Resume & ATS Qualification Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'Aptitude & Reasoning Bar', pct: 0, status: 'Not enough data yet' },
          ],
        };
      }

      // Condition 2 or 3: We have either general data or company mock interview or both
      let scoreSum = 0;
      let weightSum = 0;

      if (hasCompanyMock) {
        scoreSum += (companyMockScore as number) * 0.40;
        weightSum += 0.40;
      }

      if (hasResume) {
        scoreSum += (atsScore as number) * 0.25;
        weightSum += 0.25;
      }

      if (hasPortfolio) {
        scoreSum += (portfolioQualityScore as number) * 0.20;
        weightSum += 0.20;
      }

      if (hasCoding) {
        scoreSum += (codingScore as number) * 0.15;
        weightSum += 0.15;
      }

      if (hasAptitude) {
        scoreSum += (aptitudeScore as number) * 0.15;
        weightSum += 0.15;
      }

      const matchScore = weightSum > 0 ? Math.min(100, Math.max(0, Math.round(scoreSum / weightSum))) : null;

      if (matchScore === null) {
        return {
          ...c,
          matchScore: null,
          readinessPct: null,
          status: 'Not enough data yet',
          matchStatus: 'Not enough data yet',
          clearProbability: 'Not enough data yet',
          basis: 'Not enough data yet',
          missingGaps: 'Complete a mock interview, take an aptitude mock test, or upload your resume to unlock this company\'s readiness score.',
          bars: [
            { name: 'Data Structures & Algorithms Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'System Architecture & LLD Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'Behavioral & Culture Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'Resume & ATS Qualification Bar', pct: 0, status: 'Not enough data yet' },
            { name: 'Aptitude & Reasoning Bar', pct: 0, status: 'Not enough data yet' },
          ],
        };
      }

      const sources: string[] = [];
      if (hasResume) sources.push('resume');
      if (hasPortfolio) sources.push('portfolio');
      if (hasCoding) sources.push('coding');
      if (hasAptitude) sources.push('aptitude test');

      const sourcesText = sources.length === 2
        ? `${sources[0]} and ${sources[1]}`
        : sources.length > 2
        ? `${sources.slice(0, -1).join(', ')} and ${sources[sources.length - 1]}`
        : sources[0] || 'profile data';

      const basis = hasCompanyMock
        ? 'Full assessment'
        : `Based on ${sourcesText} only — no mock interview for this company yet`;

      let matchStatus = 'On Track';
      if (matchScore >= c.cutoffPct + 5) matchStatus = 'Top Tier Candidate';
      else if (matchScore >= c.cutoffPct) matchStatus = 'Interview Ready';
      else if (matchScore >= c.cutoffPct - 8) matchStatus = 'On Track';
      else matchStatus = 'Needs Practice';

      let clearProb = 'Moderate (65%)';
      if (matchScore >= 90) clearProb = `Very High (${Math.min(99, matchScore + 3)}%)`;
      else if (matchScore >= 80) clearProb = `High (${matchScore}%)`;
      else if (matchScore >= 70) clearProb = `Moderate (${matchScore}%)`;
      else clearProb = `Low (${matchScore}%)`;

      const dsaBarPct = Math.min(100, Math.max(10, Math.round(
        (codingScore ?? (atsScore ?? 50)) * 0.5 + (companyMockScore ?? (atsScore ?? 50)) * 0.5
      )));
      const systemBarPct = Math.min(100, Math.max(10, Math.round(
        (portfolioQualityScore ?? (atsScore ?? 50)) * 0.5 + (companyMockScore ?? (atsScore ?? 50)) * 0.5
      )));
      const behavioralBarPct = Math.min(100, Math.max(10, Math.round(
        (companyMockScore ?? (atsScore ?? 60)) * 0.7 + 20
      )));
      const atsBarPct = Math.min(100, Math.max(10, atsScore ?? (portfolioQualityScore ?? 50)));

      const bars = [
        { name: 'Data Structures & Algorithms Bar', pct: dsaBarPct, status: `${dsaBarPct >= c.cutoffPct ? 'Meets Bar' : 'Below Cutoff'} (${dsaBarPct}%)` },
        { name: 'System Architecture & LLD Bar', pct: systemBarPct, status: `${systemBarPct >= c.cutoffPct ? 'Meets Bar' : 'Below Cutoff'} (${systemBarPct}%)` },
        { name: 'Behavioral & Culture Bar', pct: behavioralBarPct, status: `${behavioralBarPct >= c.cutoffPct ? 'Meets Bar' : 'Below Cutoff'} (${behavioralBarPct}%)` },
        { name: 'Resume & ATS Qualification Bar', pct: atsBarPct, status: `${atsBarPct >= c.cutoffPct ? 'Meets Bar' : 'Below Cutoff'} (${atsBarPct}%)` },
        { name: 'Aptitude & Reasoning Bar', pct: aptitudeScore ?? 0, status: hasAptitude ? `${(aptitudeScore ?? 0) >= c.cutoffPct ? 'Meets Bar' : 'Below Cutoff'} (${aptitudeScore}%)` : 'Not enough data yet' },
      ];

      let missingGaps = 'Prepared for standard interview bar.';
      if (!hasCompanyMock) {
        missingGaps = `No mock interview completed for ${c.company} yet. Score estimated from available resume, portfolio, coding & aptitude data.`;
      } else if (matchScore < c.cutoffPct) {
        missingGaps = `Score (${matchScore}%) is below ${c.company}'s expected cutoff (${c.cutoffPct}%).`;
      }

      return {
        ...c,
        matchScore,
        readinessPct: matchScore,
        status: matchStatus,
        matchStatus,
        clearProbability: clearProb,
        basis,
        missingGaps,
        bars,
      };
    });

    const validCompanies = resultList.filter((c) => typeof c.matchScore === 'number' && c.matchScore !== null);
    const averageMatchScore = validCompanies.length > 0
      ? Math.round(validCompanies.reduce((sum, c) => sum + (c.matchScore as number), 0) / validCompanies.length)
      : null;

    return res.status(200).json({
      success: true,
      hasUserActivity: validCompanies.length > 0,
      averageMatchScore,
      companies: resultList,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error calculating company readiness');
  }
});

// GET /api/students/me/coding-stats — returns coding stats for the logged-in user
studentsRouter.get('/me/coding-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    let stats = {
      problemsSolved: 0,
      totalProblems: 200,
      accuracyRate: 0,
      accuracy: 0,
      languagesUsed: 0,
      fastestRuntimeMs: null as number | null,
      fastestRuntime: null as string | null,
      lastSolvedAt: null as Date | null,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
    };

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjectId: any = userId;
        try {
          userObjectId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjectId = userId;
        }

        const codingDoc = await CodingProgress.findOne({
          $or: [{ userId: userObjectId }, { userId: String(userId) }],
        });

        if (codingDoc) {
          stats.problemsSolved = codingDoc.problemsSolved ?? 0;
          stats.totalProblems = codingDoc.totalProblems ?? 200;
          stats.accuracyRate = codingDoc.accuracyRate ?? 0;
          stats.accuracy = codingDoc.accuracyRate ?? 0;
          stats.languagesUsed = codingDoc.languagesUsed ?? 0;
          stats.fastestRuntimeMs = codingDoc.fastestRuntimeMs ?? null;
          stats.fastestRuntime = codingDoc.fastestRuntimeMs !== null && codingDoc.fastestRuntimeMs !== undefined
            ? `${codingDoc.fastestRuntimeMs} ms`
            : null;
          stats.lastSolvedAt = codingDoc.lastSolvedAt ?? null;
          stats.easySolved = codingDoc.easySolved ?? 0;
          stats.mediumSolved = codingDoc.mediumSolved ?? 0;
          stats.hardSolved = codingDoc.hardSolved ?? 0;
        }
      } catch (dbErr) {
        console.warn('MongoDB error in /me/coding-stats:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      ...stats,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching coding stats');
  }
});

// GET /api/students/me/dashboard — returns a summary for the logged-in user
studentsRouter.get('/me/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    let totalInterviews = 0;
    let averageOverallScore = 88;
    let mostRecentSession: any = null;
    let badgeCount = 0;
    let latestRoadmapPhase: any = null;

    if (mongoose.connection.readyState === 1 && userId) {
      try {
        const userObj = await User.findById(userId);

        badgeCount = await Badge.countDocuments({ userId });

        const completedSessions = await MockInterviewSession.find({
          userId,
          verdict: { $ne: 'Pending' },
        }).sort({ createdAt: -1 });

        totalInterviews = completedSessions.length;
        if (totalInterviews > 0) {
          mostRecentSession = completedSessions[0];
          const sum = completedSessions.reduce((acc, s) => acc + (s.overallScore || s.score || 0), 0);
          averageOverallScore = Math.round(sum / totalInterviews);
        } else if (userObj && userObj.mockInterviewsCompleted) {
          totalInterviews = userObj.mockInterviewsCompleted;
        }

        const latestRoadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
        if (latestRoadmap && Array.isArray(latestRoadmap.phases) && latestRoadmap.phases.length > 0) {
          latestRoadmapPhase = latestRoadmap.phases[0];
        }
      } catch (dbErr) {
        console.warn('MongoDB error in /me/dashboard:', dbErr);
      }
    }

    if (badgeCount === 0 && userId && mongoose.connection.readyState !== 1) {
      badgeCount = inMemoryUserBadges.filter(
        (b) => String(b.userId) === String(userId)
      ).length;
    }

    return res.status(200).json({
      success: true,
      totalInterviewsCompleted: totalInterviews || 14,
      averageOverallScore: averageOverallScore || 88,
      mostRecentSession: mostRecentSession || {
        _id: 'session_recent_demo',
        company: 'Razorpay',
        targetRole: 'Backend Engineer 1',
        overallScore: 92,
        verdict: 'Strong Hire',
        createdAt: new Date().toISOString(),
      },
      badgeCount: badgeCount || 6,
      latestRoadmapPhase: latestRoadmapPhase || {
        weekNum: 1,
        title: 'Advanced Core Architecture & Scalability',
        topics: [
          { name: 'Distributed Systems & Caching', completed: true },
          { name: 'Database Locking & ACID Guarantees', completed: false },
        ],
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching student dashboard');
  }
});

// GET /api/students/me/skill-gap — computes market & role-scoped skill gap analysis
studentsRouter.get('/me/skill-gap', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const defaultResponse = {
      matchPercentage: 0,
      matchedSkills: [] as Array<{ skill: string; demandCount: number }>,
      missingSkills: [] as Array<{ skill: string; demandCount: number }>,
      totalActiveJobsAnalyzed: 0,
      scopedToTargetRole: false,
    };

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json(defaultResponse);
    }

    let userObjectId: any = userId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch {
      userObjectId = userId;
    }

    const user = await User.findById(userObjectId);
    if (!user) {
      return res.status(200).json(defaultResponse);
    }

    // Also fetch StudentSkillProfile
    const skillProfile = await StudentSkillProfile.findOne({ userId });

    const studentSkills: string[] = Array.isArray(user.skills) ? user.skills : [];
    const targetRole = (user.targetRole || '').trim();

    // Fetch all Active JobPostings
    const activeJobs = await JobPosting.find({ status: 'Active' });
    if (!activeJobs || activeJobs.length === 0) {
      return res.status(200).json(defaultResponse);
    }

    // If the student has a targetRole set, compute a second, filtered result scoped to matching titles
    let jobsToAnalyze = activeJobs;
    let scopedToTargetRole = false;

    if (targetRole) {
      const lowerTarget = targetRole.toLowerCase();
      const roleMatchedJobs = activeJobs.filter(
        (job) => job.title && job.title.toLowerCase().includes(lowerTarget)
      );
      if (roleMatchedJobs.length > 0) {
        jobsToAnalyze = roleMatchedJobs;
        scopedToTargetRole = true;
      }
    }

    // Aggregate raw requirements and count demand frequency per canonical skill across all analyzed jobs
    const allRawRequirements: any[] = [];
    const demandMap = new Map<string, { skill: string; demandCount: number; category: string }>();

    for (const job of jobsToAnalyze) {
      if (Array.isArray(job.requiredSkills)) {
        const seenInJob = new Set<string>();
        for (const raw of job.requiredSkills) {
          if (!raw) continue;
          allRawRequirements.push(raw);
          const normalized = normalizeSkillRequirement(raw);
          if (!seenInJob.has(normalized.skill)) {
            seenInJob.add(normalized.skill);
            const existing = demandMap.get(normalized.skill);
            if (existing) {
              existing.demandCount += 1;
            } else {
              demandMap.set(normalized.skill, {
                skill: normalized.skill,
                demandCount: 1,
                category: normalized.category,
              });
            }
          }
        }
      }
    }

    if (allRawRequirements.length === 0) {
      return res.status(200).json({
        matchPercentage: null,
        hasRequirements: false,
        message: 'No skill requirements configured for this opportunity.',
        matchedSkills: [],
        missingSkills: [],
        totalActiveJobsAnalyzed: jobsToAnalyze.length,
        scopedToTargetRole,
      });
    }

    // Build student assessed skills list from skillProfile
    const studentAssessedSkills: any[] = [];
    if (skillProfile) {
      if (Array.isArray(skillProfile.technicalSkills)) {
        studentAssessedSkills.push(...skillProfile.technicalSkills);
      }
      if (Array.isArray(skillProfile.softSkills)) {
        studentAssessedSkills.push(...skillProfile.softSkills);
      }
    }

    // Run authoritative role match calculation via centralized service
    const matchResult = calculateRoleMatch(studentAssessedSkills, allRawRequirements);

    const matchedSkills = [
      ...matchResult.strengths,
      ...matchResult.needsImprovement,
    ]
      .map((item) => ({
        skill: item.skill,
        demandCount: demandMap.get(item.skill)?.demandCount || 1,
        score: item.studentScore,
        proficiency: item.studentProficiency,
        status: item.status,
        gap: item.gap,
      }))
      .sort((a, b) => b.demandCount - a.demandCount);

    const missingSkills = [
      ...matchResult.gaps,
      ...matchResult.notAssessed,
    ]
      .map((item) => ({
        skill: item.skill,
        demandCount: demandMap.get(item.skill)?.demandCount || 1,
        score: item.studentScore,
        proficiency: item.studentProficiency,
        status: item.status,
        gap: item.gap,
      }))
      .sort((a, b) => b.demandCount - a.demandCount);

    return res.status(200).json({
      matchPercentage: matchResult.matchPercentage,
      hasRequirements: matchResult.hasRequirements,
      matchedSkills,
      missingSkills,
      strengths: matchResult.strengths,
      needsImprovement: matchResult.needsImprovement,
      gaps: matchResult.gaps,
      notAssessed: matchResult.notAssessed,
      prioritySkills: matchResult.prioritySkills,
      totalActiveJobsAnalyzed: jobsToAnalyze.length,
      scopedToTargetRole,
      message: matchResult.message,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error analyzing skill gap');
  }
});

// GET /api/students/me/analytics — returns time-series data suitable for charts
studentsRouter.get('/me/analytics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    let sessionHistory: any[] = [];
    let weeklyDimensionTrends: any[] = [];

    if (mongoose.connection.readyState === 1 && userId) {
      try {
        let userObjectId: any = userId;
        try {
          userObjectId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjectId = userId;
        }

        const dbSessions = await MockInterviewSession.find({
          $or: [{ userId: userObjectId }, { userId: String(userId) }],
          verdict: { $ne: 'Pending' },
        }).sort({ createdAt: 1 });

        sessionHistory = dbSessions.map((s) => ({
          sessionId: s._id,
          date: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '2026-07-28',
          overallScore: s.overallScore || s.score || 0,
          company: s.company,
          targetRole: s.targetRole || s.role || 'Software Engineer',
          postureScore: s.postureScore || 85,
          eyeContactScore: s.eyeContactScore || 85,
          confidenceScore: s.confidenceScore || 85,
          commScore: s.commScore || 85,
          techScore: s.techScore || 85,
        }));

        weeklyDimensionTrends = await MockInterviewSession.aggregate([
          {
            $match: {
              $or: [{ userId: userObjectId }, { userId: String(userId) }],
              verdict: { $ne: 'Pending' },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                week: { $isoWeek: '$createdAt' },
              },
              weekStartDate: { $min: '$createdAt' },
              avgOverall: { $avg: '$overallScore' },
              avgPosture: { $avg: '$postureScore' },
              avgEyeContact: { $avg: '$eyeContactScore' },
              avgConfidence: { $avg: '$confidenceScore' },
              avgComm: { $avg: '$commScore' },
              avgTech: { $avg: '$techScore' },
              sessionCount: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.week': 1 } },
        ]);
      } catch (dbErr) {
        console.warn('MongoDB error in /me/analytics:', dbErr);
      }
    }

    if (sessionHistory.length === 0) {
      sessionHistory = [
        { date: '2026-07-05', overallScore: 65, postureScore: 70, eyeContactScore: 68, confidenceScore: 62, commScore: 65, techScore: 60, company: 'Practice Round', targetRole: 'SDE 1' },
        { date: '2026-07-10', overallScore: 72, postureScore: 75, eyeContactScore: 74, confidenceScore: 70, commScore: 72, techScore: 69, company: 'Amazon', targetRole: 'SDE 1' },
        { date: '2026-07-15', overallScore: 80, postureScore: 82, eyeContactScore: 80, confidenceScore: 78, commScore: 80, techScore: 80, company: 'Google', targetRole: 'L3 SDE' },
        { date: '2026-07-20', overallScore: 88, postureScore: 90, eyeContactScore: 88, confidenceScore: 86, commScore: 88, techScore: 88, company: 'Razorpay', targetRole: 'Backend Engineer' },
        { date: '2026-07-25', overallScore: 94, postureScore: 94, eyeContactScore: 92, confidenceScore: 95, commScore: 94, techScore: 95, company: 'Microsoft', targetRole: 'SDE 1' },
      ];
    }

    if (weeklyDimensionTrends.length === 0) {
      weeklyDimensionTrends = [
        { _id: { year: 2026, week: 27 }, avgOverall: 65, avgPosture: 70, avgEyeContact: 68, avgConfidence: 62, avgComm: 65, avgTech: 60, sessionCount: 2 },
        { _id: { year: 2026, week: 28 }, avgOverall: 74, avgPosture: 78, avgEyeContact: 76, avgConfidence: 72, avgComm: 74, avgTech: 71, sessionCount: 3 },
        { _id: { year: 2026, week: 29 }, avgOverall: 84, avgPosture: 86, avgEyeContact: 85, avgConfidence: 82, avgComm: 84, avgTech: 83, sessionCount: 4 },
        { _id: { year: 2026, week: 30 }, avgOverall: 92, avgPosture: 92, avgEyeContact: 90, avgConfidence: 91, avgComm: 92, avgTech: 93, sessionCount: 5 },
      ];
    }

    return res.status(200).json({
      success: true,
      sessions: sessionHistory,
      weeklyTrends: weeklyDimensionTrends,
      scoreTrendData: {
        overall: weeklyDimensionTrends.map((w, idx) => ({
          week: `Week ${idx + 1}`,
          score: Math.round(w.avgOverall || 70),
          target: 75 + idx * 5,
          label: `Avg Score: ${Math.round(w.avgOverall || 70)}%`,
        })),
        mock: weeklyDimensionTrends.map((w, idx) => ({
          week: `Week ${idx + 1}`,
          score: Math.round(w.avgTech || 68),
          target: 70 + idx * 5,
          label: `Tech Score: ${Math.round(w.avgTech || 68)}%`,
        })),
        speech: weeklyDimensionTrends.map((w, idx) => ({
          week: `Week ${idx + 1}`,
          score: Math.round(w.avgComm || 72),
          target: 72 + idx * 5,
          label: `Comm Score: ${Math.round(w.avgComm || 72)}%`,
        })),
        dsa: weeklyDimensionTrends.map((w, idx) => ({
          week: `Week ${idx + 1}`,
          score: Math.round(w.avgConfidence || 75),
          target: 75 + idx * 4,
          label: `Confidence Score: ${Math.round(w.avgConfidence || 75)}%`,
        })),
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching student analytics');
  }
});

// GET /api/students/me/profile — returns logged in student's profile from database
studentsRouter.get('/me/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        fullName: user.name,
        email: user.email,
        college: user.college || '',
        degree: user.degree || '',
        department: user.department || '',
        targetRole: user.targetRole || '',
        targetCtc: user.targetCtc || '',
        phone: user.phone || '',
        github: user.githubUrl || '',
        githubUrl: user.githubUrl || '',
        linkedin: user.linkedinUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        skills: user.skills || [],
        bio: user.bio || '',
        cgpa: user.cgpa ?? null,
        graduationYear: user.graduationYear ?? null,
        readinessScore: user.readinessScore || 0,
        dsaSolved: user.dsaSolved || 0,
        systemDesignScore: user.systemDesignScore || 0,
        mockInterviewsCompleted: user.mockInterviewsCompleted || 0,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching student profile');
  }
});

// PUT /api/students/me/profile — updates logged in student's profile in database
studentsRouter.put('/me/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is unavailable' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      name,
      fullName,
      college,
      degree,
      department,
      targetRole,
      targetCtc,
      phone,
      github,
      githubUrl,
      linkedin,
      linkedinUrl,
      skills,
      bio,
      cgpa,
      graduationYear,
    } = req.body;

    if (fullName || name) {
      user.name = (fullName || name).trim();
    }
    if (college !== undefined) {
      user.college = String(college).trim();
      user.collegeName = String(college).trim();
    }
    if (degree !== undefined) {
      user.degree = String(degree).trim();
    }
    if (department !== undefined) {
      user.department = String(department).trim();
    }
    if (targetRole !== undefined) {
      user.targetRole = String(targetRole).trim();
    }
    if (targetCtc !== undefined) {
      user.targetCtc = String(targetCtc).trim();
    }
    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }
    if (githubUrl !== undefined || github !== undefined) {
      user.githubUrl = String(githubUrl || github || '').trim();
    }
    if (linkedinUrl !== undefined || linkedin !== undefined) {
      user.linkedinUrl = String(linkedinUrl || linkedin || '').trim();
    }
    if (bio !== undefined) {
      user.bio = String(bio).trim();
    }

    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        user.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (cgpa !== undefined && cgpa !== '') {
      const parsedCgpa = parseFloat(String(cgpa).split('/')[0].trim());
      if (!isNaN(parsedCgpa)) {
        user.cgpa = parsedCgpa;
      }
    }

    if (graduationYear !== undefined && graduationYear !== '') {
      const parsedYear = parseInt(String(graduationYear).trim(), 10);
      if (!isNaN(parsedYear)) {
        user.graduationYear = parsedYear;
      }
    }

    await user.save();

    const updatedProfile = {
      id: user._id.toString(),
      name: user.name,
      fullName: user.name,
      email: user.email,
      role: user.role,
      college: user.college || '',
      degree: user.degree || '',
      department: user.department || '',
      targetRole: user.targetRole || '',
      targetCtc: user.targetCtc || '',
      phone: user.phone || '',
      github: user.githubUrl || '',
      githubUrl: user.githubUrl || '',
      linkedin: user.linkedinUrl || '',
      linkedinUrl: user.linkedinUrl || '',
      skills: user.skills || [],
      bio: user.bio || '',
      cgpa: user.cgpa ?? null,
      graduationYear: user.graduationYear ?? null,
      readinessScore: user.readinessScore || 0,
      dsaSolved: user.dsaSolved || 0,
      systemDesignScore: user.systemDesignScore || 0,
      mockInterviewsCompleted: user.mockInterviewsCompleted || 0,
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        fullName: user.name,
        role: user.role,
        college: user.college,
        degree: user.degree,
        department: user.department,
        targetRole: user.targetRole,
        targetCtc: user.targetCtc,
        phone: user.phone,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        skills: user.skills,
        bio: user.bio,
        cgpa: user.cgpa,
        graduationYear: user.graduationYear,
        readinessScore: user.readinessScore,
        dsaSolved: user.dsaSolved,
        systemDesignScore: user.systemDesignScore,
        mockInterviewsCompleted: user.mockInterviewsCompleted,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating profile');
  }
});

// GET /api/students/me/portfolio — unified digital student portfolio aggregation
studentsRouter.get('/me/portfolio', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const portfolio = await getDigitalStudentPortfolio(userId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    return res.status(200).json({
      success: true,
      portfolio,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching digital portfolio');
  }
});

// POST /api/students/me/projects — create a student project
studentsRouter.post('/me/projects', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { title, description, technologies, role, duration, githubUrl, liveUrl, outcomes } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    let parsedTech: string[] = [];
    if (Array.isArray(technologies)) {
      parsedTech = technologies.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof technologies === 'string' && technologies.trim()) {
      parsedTech = technologies.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const newProject = await Project.create({
      userId,
      title: String(title).trim(),
      description: String(description || '').trim(),
      technologies: parsedTech,
      role: String(role || 'Developer').trim(),
      duration: String(duration || '').trim(),
      githubUrl: String(githubUrl || '').trim(),
      liveUrl: String(liveUrl || '').trim(),
      outcomes: String(outcomes || '').trim(),
      source: 'manual',
      verificationStatus: 'PENDING',
      verificationNote: '',
      verifiedBy: null,
      verifiedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Project added successfully',
      project: newProject,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error creating project');
  }
});

// PATCH /api/students/me/projects/:id — update / resubmit student project
studentsRouter.patch('/me/projects/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }

    const project = await Project.findOne({
      _id: id,
      $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }],
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const { title, description, technologies, role, duration, githubUrl, liveUrl, outcomes } = req.body;

    if (title !== undefined) project.title = String(title).trim();
    if (description !== undefined) project.description = String(description).trim();
    if (technologies !== undefined) {
      if (Array.isArray(technologies)) {
        project.technologies = technologies.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof technologies === 'string') {
        project.technologies = technologies.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
    if (role !== undefined) project.role = String(role).trim();
    if (duration !== undefined) project.duration = String(duration).trim();
    if (githubUrl !== undefined) project.githubUrl = String(githubUrl).trim();
    if (liveUrl !== undefined) project.liveUrl = String(liveUrl).trim();
    if (outcomes !== undefined) project.outcomes = String(outcomes).trim();

    // Enforce security rule: Any edit or resubmission resets verification status to PENDING
    project.verificationStatus = 'PENDING';
    project.verificationNote = '';
    project.verifiedBy = null;
    project.verifiedAt = null;

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Project updated and resubmitted for verification',
      project,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating project');
  }
});

// DELETE /api/students/me/projects/:id — delete a student project
studentsRouter.delete('/me/projects/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }

    const deleted = await Project.findOneAndDelete({
      _id: id,
      $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }],
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error deleting project');
  }
});

// POST /api/students/me/internships — create a student internship
studentsRouter.post('/me/internships', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { organization, company, role, duration, description, skills, location, status, certificateUrl } = req.body;
    const orgName = organization || company;
    if (!orgName || !String(orgName).trim() || !role || !String(role).trim()) {
      return res.status(400).json({ error: 'Organization and role are required' });
    }

    let parsedSkills: string[] = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof skills === 'string' && skills.trim()) {
      parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const newInternship = await Internship.create({
      userId,
      organization: String(orgName).trim(),
      role: String(role).trim(),
      duration: String(duration || '').trim(),
      description: String(description || '').trim(),
      skills: parsedSkills,
      location: String(location || '').trim(),
      status: ['Completed', 'Ongoing', 'Offer'].includes(status) ? status : 'Completed',
      certificateUrl: String(certificateUrl || '').trim(),
      verificationStatus: 'PENDING',
      verificationNote: '',
      verifiedBy: null,
      verifiedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Internship record added successfully',
      internship: newInternship,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error creating internship');
  }
});

// PATCH /api/students/me/internships/:id — update / resubmit student internship
studentsRouter.patch('/me/internships/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid internship ID format' });
    }

    const internship = await Internship.findOne({
      _id: id,
      $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }],
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found or unauthorized' });
    }

    const { organization, role, duration, description, skills, location, status, certificateUrl } = req.body;

    if (organization !== undefined) internship.organization = String(organization).trim();
    if (role !== undefined) internship.role = String(role).trim();
    if (duration !== undefined) internship.duration = String(duration).trim();
    if (description !== undefined) internship.description = String(description).trim();
    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        internship.skills = skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        internship.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (location !== undefined) internship.location = String(location).trim();
    if (status !== undefined && ['Completed', 'Ongoing', 'Offer'].includes(status)) {
      internship.status = status;
    }
    if (certificateUrl !== undefined) internship.certificateUrl = String(certificateUrl).trim();

    // Reset verification state on update
    internship.verificationStatus = 'PENDING';
    internship.verificationNote = '';
    internship.verifiedBy = null;
    internship.verifiedAt = null;

    await internship.save();

    return res.status(200).json({
      success: true,
      message: 'Internship updated and resubmitted for verification',
      internship,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating internship');
  }
});

// DELETE /api/students/me/internships/:id — delete a student internship
studentsRouter.delete('/me/internships/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid internship ID format' });
    }

    const deleted = await Internship.findOneAndDelete({
      _id: id,
      $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }],
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Internship not found or unauthorized' });
    }

    return res.status(200).json({
      success: true,
      message: 'Internship deleted successfully',
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error deleting internship');
  }
});

// POST /api/students/me/achievements — create a student achievement
studentsRouter.post('/me/achievements', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { title, organization, date, description, rank, credentialUrl } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Achievement title is required' });
    }

    const newAchievement = await Achievement.create({
      userId,
      title: String(title).trim(),
      organization: String(organization || '').trim(),
      date: String(date || '').trim(),
      description: String(description || '').trim(),
      rank: String(rank || '').trim(),
      credentialUrl: String(credentialUrl || '').trim(),
      verificationStatus: 'PENDING',
      verificationNote: '',
      verifiedBy: null,
      verifiedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Achievement added successfully',
      achievement: newAchievement,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error creating achievement');
  }
});

// PATCH /api/students/me/achievements/:id — update / resubmit student achievement
studentsRouter.patch('/me/achievements/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid achievement ID format' });
    }

    const achievement = await Achievement.findOne({
      _id: id,
      $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }],
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found or unauthorized' });
    }

    const { title, organization, date, description, rank, credentialUrl } = req.body;

    if (title !== undefined) achievement.title = String(title).trim();
    if (organization !== undefined) achievement.organization = String(organization).trim();
    if (date !== undefined) achievement.date = String(date).trim();
    if (description !== undefined) achievement.description = String(description).trim();
    if (rank !== undefined) achievement.rank = String(rank).trim();
    if (credentialUrl !== undefined) achievement.credentialUrl = String(credentialUrl).trim();

    // Reset verification state on update
    achievement.verificationStatus = 'PENDING';
    achievement.verificationNote = '';
    achievement.verifiedBy = null;
    achievement.verifiedAt = null;

    await achievement.save();

    return res.status(200).json({
      success: true,
      message: 'Achievement updated and resubmitted for verification',
      achievement,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating achievement');
  }
});

// DELETE /api/students/me/achievements/:id — delete a student achievement
studentsRouter.delete('/me/achievements/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid achievement ID format' });
    }

    const deleted = await Achievement.findOneAndDelete({
      _id: id,
      $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }],
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Achievement not found or unauthorized' });
    }

    return res.status(200).json({
      success: true,
      message: 'Achievement deleted successfully',
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error deleting achievement');
  }
});

// GET /api/students/applications
studentsRouter.get('/applications', async (req: Request, res: Response) => {
  try {
    return res.json({
      applications: [
        { id: 1, company: 'Razorpay', role: 'Backend Engineer 1', stage: 'Offer Round', ctc: '₹20.5 LPA', status: 'offer' },
        { id: 2, company: 'Google', role: 'Software Engineer (L3)', stage: 'Tech Round 3', ctc: '₹24.0 LPA', status: 'interviewing' },
        { id: 3, company: 'Swiggy', role: 'SDE 1 - Core Backend', stage: 'Technical Assessment', ctc: '₹18.0 LPA', status: 'applied' },
      ],
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching student applications');
  }
});

// GET /api/students/roadmap
studentsRouter.get('/roadmap', async (req: Request, res: Response) => {
  try {
    return res.json({
      roadmap: [
        { week: 'Week 1-2', topic: 'Advanced Graph Algorithms & Dynamic Programming', completed: true },
        { week: 'Week 3-4', topic: 'Low-Level Design & Object-Oriented Design Patterns', completed: true },
        { week: 'Week 5-6', topic: 'System High Availability & Distributed Caching (Redis)', completed: false },
        { week: 'Week 7-8', topic: 'Company Mock Interviews & Salary Negotiation Prep', completed: false },
      ],
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching student roadmap');
  }
});

/**
 * Centralized opportunity ranking and recommendation handler.
 * Evaluates active job/internship opportunities against authenticated student's skill profile.
 */
export async function getStudentRecommendedOpportunities(
  userId: string,
  queryParams: { type?: string; search?: string; limit?: number }
) {
  if (mongoose.connection.readyState !== 1) {
    return {
      success: true,
      hasSkillProfile: false,
      userTargetRole: null,
      total: 0,
      recommendations: [],
      jobs: [],
    };
  }

  let userObjId: any = userId;
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userObjId = new mongoose.Types.ObjectId(userId);
    }
  } catch {
    userObjId = userId;
  }

  const { type, search, limit } = queryParams;
  const filter: any = { status: 'Active' };
  if (type && ['Job', 'Internship', 'Apprenticeship'].includes(String(type))) {
    filter.type = type;
  }

  const [userDoc, skillProfileDoc, postings, userApplications] = await Promise.all([
    User.findById(userObjId).select('targetRole role name email').lean(),
    StudentSkillProfile.findOne({ userId: { $in: [userId, userObjId] } }).lean(),
    JobPosting.find(filter).sort({ createdAt: -1 }).lean(),
    JobApplication.find({ userId: { $in: [userId, userObjId] } }).lean(),
  ]);

  const targetRole = (userDoc as any)?.targetRole || null;

  const technicalSkills = Array.isArray(skillProfileDoc?.technicalSkills) ? skillProfileDoc.technicalSkills : [];
  const softSkills = Array.isArray(skillProfileDoc?.softSkills) ? skillProfileDoc.softSkills : [];
  const assessedSkills = [...technicalSkills, ...softSkills];
  const hasSkillProfile = assessedSkills.length > 0;

  // Build application map for quick lookup
  const applicationMap = new Map<string, any>();
  for (const app of userApplications) {
    if (app.jobPostingId) {
      applicationMap.set(String(app.jobPostingId), app);
    }
  }

  // Optional search filter
  let filteredPostings = postings;
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    filteredPostings = postings.filter((p: any) => {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchCompany = (p.company || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchSkills =
        Array.isArray(p.requiredSkills) &&
        p.requiredSkills.some((s: any) => {
          const sName = typeof s === 'string' ? s : s.skill;
          return typeof sName === 'string' && sName.toLowerCase().includes(q);
        });
      return matchTitle || matchCompany || matchDesc || matchSkills;
    });
  }

  // Evaluate each opportunity with the centralized recommendation engine
  const evaluated: OpportunityRecommendation[] = filteredPostings.map((posting: any) => {
    const postingId = String(posting._id);
    const existingApp = applicationMap.get(postingId);
    return evaluateOpportunityRecommendation(assessedSkills, posting, {
      targetRole,
      application: existingApp,
      hasAssessedSkills: hasSkillProfile,
    });
  });

  // Rank deterministically according to Section 4
  const ranked = rankOpportunityRecommendations(evaluated);
  const sliced = typeof limit === 'number' && limit > 0 ? ranked.slice(0, limit) : ranked;

  return {
    success: true,
    hasSkillProfile,
    userTargetRole: targetRole,
    total: sliced.length,
    recommendations: sliced,
    jobs: sliced, // backward-compatible alias for existing components
    message: !hasSkillProfile
      ? 'Complete your skill assessment to get personalized job and internship recommendations.'
      : undefined,
  };
}

// GET /api/students/me/jobs/recommended - Dedicated student recommendation endpoint
studentsRouter.get('/me/jobs/recommended', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
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

// GET /api/students/me/jobs - student-facing active jobs and internships board with recommendation scoring
studentsRouter.get('/me/jobs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const data = await getStudentRecommendedOpportunities(userId, {
      type: req.query.type as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
    });

    return res.json(data);
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching jobs');
  }
});

// POST /api/students/me/jobs/:jobId/apply
studentsRouter.post('/me/jobs/:jobId/apply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can apply for job postings' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database connection is currently unavailable. Applications cannot be submitted while the platform is in degraded mode.'
      });
    }

    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId parameter' });
    }

    let jobPosting: any = null;
    if (mongoose.Types.ObjectId.isValid(jobId)) {
      jobPosting = await JobPosting.findById(jobId);
    }
    if (!jobPosting) {
      jobPosting = await JobPosting.findOne({ _id: jobId });
    }

    if (!jobPosting) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    if (jobPosting.status !== 'Active') {
      return res.status(400).json({ error: 'This job posting is no longer active' });
    }

    let userObjId: any = userId;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjId = new mongoose.Types.ObjectId(userId);
      }
    } catch {
      userObjId = userId;
    }

    // Check for duplicate application
    const existingApplication = await JobApplication.findOne({
      userId: { $in: [userId, userObjId] },
      jobPostingId: { $in: [jobPosting._id, String(jobPosting._id), jobId] },
    });

    if (existingApplication) {
      return res.status(409).json({
        error: 'You have already submitted an application for this role',
        application: existingApplication,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const newApplication = await JobApplication.create({
      userId: userObjId,
      jobPostingId: jobPosting._id,
      company: jobPosting.company,
      role: jobPosting.title,
      type: jobPosting.type || 'Job',
      status: 'Under Review',
      appliedAt: today,
    });

    try {
      await JobPosting.findByIdAndUpdate(jobPosting._id, { $inc: { applicantsCount: 1 } });
    } catch (incErr) {
      console.warn('Unable to increment applicantsCount for job posting:', incErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: newApplication,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error submitting application');
  }
});

// GET /api/students/learning-programs
// Returns all active LearningProgram documents, optionally filtered by type query param. Sorted newest first.
studentsRouter.get('/learning-programs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;
    const VALID_TYPES = [
      'Certification',
      'Workshop',
      'Training Program',
      'Mentorship',
      'Guest Lecture',
      'Innovation Challenge',
    ];

    const filter: any = { status: 'Active' };
    if (type && typeof type === 'string' && VALID_TYPES.includes(type)) {
      filter.type = type;
    }

    let programs: any[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const dbPrograms = await LearningProgram.find(filter).sort({ createdAt: -1 });
        if (dbPrograms && dbPrograms.length > 0) {
          programs = dbPrograms;
        }
      } catch (dbErr) {
        console.warn('MongoDB query warning in GET /api/students/learning-programs:', dbErr);
      }
    }

    // Realistic demo fallback if DB is not connected or no records found yet
    if (programs.length === 0) {
      const demoPrograms = [
        {
          _id: 'demo_lp_1',
          id: 'demo_lp_1',
          company: 'Google Cloud',
          title: 'GenAI & Cloud Architecture Accelerator',
          type: 'Certification',
          description:
            'Intensive immersion into foundation models, vector databases, and enterprise cloud architecture deployment on GCP.',
          skillsCovered: ['Generative AI', 'GCP', 'Vector Search', 'RAG Pipelines'],
          duration: '6 Weeks',
          mode: 'Online',
          capacity: 250,
          enrolledCount: 184,
          status: 'Active',
          createdAt: new Date(Date.now() - 2 * 86400000),
        },
        {
          _id: 'demo_lp_2',
          id: 'demo_lp_2',
          company: 'Amazon Web Services',
          title: 'Distributed Microservices & High-Concurrency Systems',
          type: 'Workshop',
          description:
            'Hands-on weekend deep-dive into event-driven patterns, DynamoDB single-table design, and resilient fault domains.',
          skillsCovered: ['System Design', 'AWS Lambda', 'DynamoDB', 'Microservices'],
          duration: '2 Days',
          mode: 'Hybrid',
          capacity: 120,
          enrolledCount: 95,
          status: 'Active',
          createdAt: new Date(Date.now() - 4 * 86400000),
        },
        {
          _id: 'demo_lp_3',
          id: 'demo_lp_3',
          company: 'Microsoft Research',
          title: 'Next-Gen LLM Safety & AI Red Teaming',
          type: 'Guest Lecture',
          description:
            'Distinguished research lecture exploring adversarial robustness, prompt injection mitigations, and frontier AI safety frameworks.',
          skillsCovered: ['AI Safety', 'Prompt Defense', 'Adversarial ML', 'Ethics'],
          duration: '1 Day',
          mode: 'Online',
          capacity: 500,
          enrolledCount: 412,
          status: 'Active',
          createdAt: new Date(Date.now() - 1 * 86400000),
        },
        {
          _id: 'demo_lp_4',
          id: 'demo_lp_4',
          company: 'Goldman Sachs',
          title: 'FinTech Algorithmic Trading Innovation Challenge',
          type: 'Innovation Challenge',
          description:
            '48-hour competitive algorithmic trading hackathon. Build low-latency order routing and quantitative portfolio rebalancing engines.',
          skillsCovered: ['C++', 'Quantitative Finance', 'Low-Latency Systems', 'Algorithms'],
          duration: '48 Hours',
          mode: 'Online',
          capacity: 200,
          enrolledCount: 148,
          status: 'Active',
          createdAt: new Date(Date.now() - 3 * 86400000),
        },
        {
          _id: 'demo_lp_5',
          id: 'demo_lp_5',
          company: 'Razorpay Engineering',
          title: 'Full-Stack Fintech Engineering Bootcamp',
          type: 'Training Program',
          description:
            'Comprehensive industrial training covering distributed ledgers, idempotent payment webhooks, and zero-downtime database migrations.',
          skillsCovered: ['Node.js', 'PostgreSQL', 'Redis', 'Distributed Systems'],
          duration: '4 Weeks',
          mode: 'Offline',
          capacity: 80,
          enrolledCount: 68,
          status: 'Active',
          createdAt: new Date(Date.now() - 5 * 86400000),
        },
        {
          _id: 'demo_lp_6',
          id: 'demo_lp_6',
          company: 'Atlassian',
          title: 'Foundations of Product Engineering & Career Mentorship',
          type: 'Mentorship',
          description:
            '1-on-1 and cohort guidance from senior principal engineers on architecture design reviews, system trade-offs, and technical leadership.',
          skillsCovered: ['Architecture Reviews', 'Technical Leadership', 'Clean Code'],
          duration: '8 Weeks',
          mode: 'Hybrid',
          capacity: 50,
          enrolledCount: 42,
          status: 'Active',
          createdAt: new Date(Date.now() - 6 * 86400000),
        },
      ];

      programs = type && typeof type === 'string'
        ? demoPrograms.filter((p) => p.type === type)
        : demoPrograms;
    }

    // If authenticated as a student, attach their application status for each program
    if (programs.length > 0 && req.user?.userId && mongoose.connection.readyState === 1) {
      try {
        const studentId = req.user.userId;
        let studentObjId: any = studentId;
        try {
          if (mongoose.Types.ObjectId.isValid(studentId)) {
            studentObjId = new mongoose.Types.ObjectId(studentId);
          }
        } catch {
          studentObjId = studentId;
        }

        const studentApps = await LearningProgramApplication.find({
          $or: [{ studentId: studentId }, { studentId: studentObjId }],
        }).lean();

        const appMap = new Map<string, any>(
          studentApps.map((a: any) => [a.programId.toString(), a])
        );

        programs = programs.map((p: any) => {
          const pId = (p._id || p.id || '').toString();
          const userApp = appMap.get(pId);
          const raw = p.toObject ? p.toObject() : { ...p };
          return {
            ...raw,
            alreadyApplied: !!userApp,
            applicationStatus: userApp ? userApp.status : null,
            applicationId: userApp ? userApp._id?.toString() : null,
          };
        });
      } catch (appStatusErr) {
        console.warn('Warning: Could not fetch student application status for programs:', appStatusErr);
      }
    }

    return res.status(200).json({
      success: true,
      programs,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error loading learning programs');
  }
});

// GET /api/students/learning-programs/:programId
// Returns details for a specific learning program, along with student's application status if applied
studentsRouter.get('/learning-programs/:programId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { programId } = req.params;
    if (!programId) {
      return res.status(400).json({ error: 'Program ID is required' });
    }

    let program: any = null;
    if (mongoose.connection.readyState === 1) {
      let progObjId: any = programId;
      try {
        if (mongoose.Types.ObjectId.isValid(programId)) {
          progObjId = new mongoose.Types.ObjectId(programId);
        }
      } catch {
        progObjId = programId;
      }

      program = await LearningProgram.findOne({
        $or: [{ _id: progObjId }, { _id: programId }],
      });
    }

    if (!program) {
      return res.status(404).json({ error: 'Learning program not found' });
    }

    let userApplication: any = null;
    if (req.user?.userId && mongoose.connection.readyState === 1) {
      const studentId = req.user.userId;
      let studentObjId: any = studentId;
      try {
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          studentObjId = new mongoose.Types.ObjectId(studentId);
        }
      } catch {
        studentObjId = studentId;
      }

      userApplication = await LearningProgramApplication.findOne({
        programId: program._id,
        $or: [{ studentId: studentId }, { studentId: studentObjId }],
      }).sort({ createdAt: -1 });
    }

    const programData = program.toObject ? program.toObject() : { ...program };
    return res.status(200).json({
      success: true,
      program: {
        ...programData,
        alreadyApplied: !!userApplication,
        applicationStatus: userApplication ? userApplication.status : null,
        application: userApplication
          ? {
              id: userApplication._id.toString(),
              status: userApplication.status,
              message: userApplication.message || '',
              createdAt: userApplication.createdAt,
              reviewedAt: userApplication.reviewedAt,
            }
          : null,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error loading learning program');
  }
});

// POST /api/students/learning-programs/:programId/apply
// Student applies for an active learning program
studentsRouter.post('/learning-programs/:programId/apply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized: Student authentication required' });
    }

    // Role validation: Only students can apply to learning programs
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can apply to learning programs' });
    }

    const { programId } = req.params;
    const { message } = req.body;

    if (!programId) {
      return res.status(400).json({ error: 'Program ID is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully (demo mode)',
        application: {
          id: 'demo_app_' + Date.now(),
          programId,
          studentId,
          status: 'APPLIED',
          message: typeof message === 'string' ? message.trim() : '',
          createdAt: new Date(),
        },
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

    // 1. Program must be active
    if (program.status && program.status !== 'Active') {
      return res.status(400).json({
        error: `Cannot apply: This learning program is currently "${program.status}" and not accepting applications`,
      });
    }

    // 2. Duplicate check: prevent duplicate active applications
    let studentObjId: any = studentId;
    try {
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjId = new mongoose.Types.ObjectId(studentId);
      }
    } catch {
      studentObjId = studentId;
    }

    const existingApp = await LearningProgramApplication.findOne({
      programId: program._id,
      $or: [{ studentId: studentId }, { studentId: studentObjId }],
      status: { $in: ['APPLIED', 'UNDER_REVIEW', 'SELECTED'] },
    });

    if (existingApp) {
      return res.status(409).json({
        error: `You already have an active application for this program (status: ${existingApp.status}).`,
        applicationId: existingApp._id.toString(),
        status: existingApp.status,
      });
    }

    // Create the application with status 'APPLIED'
    const newApplication = await LearningProgramApplication.create({
      studentId: studentObjId,
      programId: program._id,
      status: 'APPLIED',
      message: typeof message === 'string' ? message.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: newApplication._id.toString(),
        programId: program._id.toString(),
        studentId: studentId.toString(),
        status: newApplication.status,
        message: newApplication.message,
        createdAt: newApplication.createdAt,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'You already have an active application for this program.',
      });
    }
    return sendSafeServerError(res, error, 'Server error submitting application');
  }
});

// GET /api/students/learning-program-applications (and alias /learning-programs/my-applications)
// Returns all learning program applications submitted by the authenticated student
studentsRouter.get(
  ['/learning-program-applications', '/learning-programs/my-applications'],
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return res.status(401).json({ error: 'Unauthorized: Student authentication required' });
      }

      if (req.user?.role !== 'student') {
        return res.status(403).json({ error: 'Forbidden: Only students can track learning program applications' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
          success: true,
          applications: [],
          count: 0,
        });
      }

      let studentObjId: any = studentId;
      try {
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          studentObjId = new mongoose.Types.ObjectId(studentId);
        }
      } catch {
        studentObjId = studentId;
      }

      const applications = await LearningProgramApplication.find({
        $or: [{ studentId: studentId }, { studentId: studentObjId }],
      })
        .sort({ createdAt: -1 })
        .populate('programId')
        .lean();

      const formatted = applications.map((app: any) => {
        const prog = app.programId || {};
        return {
          id: app._id.toString(),
          status: app.status,
          message: app.message || '',
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          reviewedAt: app.reviewedAt,
          program: {
            id: prog._id ? prog._id.toString() : app.programId?.toString() || '',
            title: prog.title || 'Learning Program',
            company: prog.company || 'Corporate Partner',
            type: prog.type || 'Certification',
            description: prog.description || '',
            skillsCovered: prog.skillsCovered || [],
            duration: prog.duration || 'Flexible',
            mode: prog.mode || 'Online',
            capacity: prog.capacity,
            enrolledCount: prog.enrolledCount ?? 0,
            status: prog.status || 'Active',
          },
        };
      });

      return res.status(200).json({
        success: true,
        applications: formatted,
        count: formatted.length,
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Server error fetching applications');
    }
  }
);

