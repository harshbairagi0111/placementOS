import mongoose from 'mongoose';
import { User, StudentSkillProfile, Certification, Portfolio, Project, Internship, Achievement } from '../models';

export interface PortfolioProfile {
  id: string;
  name: string;
  fullName: string;
  email: string;
  college: string;
  degree: string;
  department: string;
  targetRole: string;
  targetCtc: string;
  phone: string;
  githubUrl: string;
  linkedinUrl: string;
  bio: string;
  cgpa: number | null;
  graduationYear: number | null;
  readinessScore: number;
}

export interface PortfolioSkillItem {
  skill: string;
  skillId: string;
  category: 'technical' | 'soft';
  score: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  lastAssessedAt?: Date | string;
  assessmentCount?: number;
}

export interface PortfolioSkills {
  technical: PortfolioSkillItem[];
  soft: PortfolioSkillItem[];
  overallTechnicalScore: number;
  overallSoftScore: number;
  strengths: string[];
  skillGaps: string[];
  lastUpdated?: Date | string;
}

export interface PortfolioEducation {
  college: string;
  degree: string;
  department: string;
  graduationYear: number | null;
  cgpa: number | null;
  year: string;
}

export interface PortfolioCertificationItem {
  id: string;
  title: string;
  issuer: string;
  category: string;
  dateIssued: string;
  credentialUrl: string;
  fileUrl: string;
  fileId?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  addedAt?: Date;
}

export interface PortfolioProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  role: string;
  duration: string;
  githubUrl: string;
  liveUrl: string;
  outcomes: string;
  source: 'manual' | 'github_audit';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  fileId?: string;
  createdAt?: Date;
}

export interface PortfolioInternshipItem {
  id: string;
  organization: string;
  role: string;
  duration: string;
  description: string;
  skills: string[];
  location: string;
  status: 'Completed' | 'Ongoing' | 'Offer';
  certificateUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  fileId?: string;
  createdAt?: Date;
}

export interface PortfolioAchievementItem {
  id: string;
  title: string;
  organization: string;
  date: string;
  description: string;
  rank: string;
  credentialUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  fileId?: string;
  createdAt?: Date;
}

export interface PortfolioCompleteness {
  score: number; // 0 - 100
  factors: {
    profileComplete: { weight: number; earned: number; complete: boolean };
    skillsAssessed: { weight: number; earned: number; complete: boolean };
    projects: { weight: number; earned: number; complete: boolean };
    certifications: { weight: number; earned: number; complete: boolean };
    internships: { weight: number; earned: number; complete: boolean };
    achievements: { weight: number; earned: number; complete: boolean };
  };
}

export interface AggregatedStudentPortfolio {
  profile: PortfolioProfile;
  skills: PortfolioSkills;
  education: PortfolioEducation;
  certifications: PortfolioCertificationItem[];
  projects: PortfolioProjectItem[];
  internships: PortfolioInternshipItem[];
  achievements: PortfolioAchievementItem[];
  completeness: PortfolioCompleteness;
  codeQualityAudit?: {
    qualityScore: number | null;
    githubUsername: string;
    githubUrl: string;
    strengths: string[];
    recommendations: string[];
    feedback: string;
  } | null;
}

/**
 * Calculates deterministic portfolio completeness percentage (0-100%).
 * Separated cleanly from any job matching score.
 */
export function calculatePortfolioCompleteness(params: {
  hasBasicProfile: boolean;
  hasDegreeOrDept: boolean;
  hasBioOrTargetRole: boolean;
  hasAssessedSkills: boolean;
  projectCount: number;
  certCount: number;
  internshipCount: number;
  achievementCount: number;
}): PortfolioCompleteness {
  // 1. Profile completeness (up to 20%)
  let profileEarned = 0;
  if (params.hasBasicProfile) profileEarned += 10;
  if (params.hasDegreeOrDept) profileEarned += 5;
  if (params.hasBioOrTargetRole) profileEarned += 5;

  // 2. Assessed skills (20%)
  const skillsEarned = params.hasAssessedSkills ? 20 : 0;

  // 3. Projects (20%)
  const projectsEarned = params.projectCount >= 2 ? 20 : params.projectCount === 1 ? 10 : 0;

  // 4. Certifications (15%)
  const certsEarned = params.certCount >= 1 ? 15 : 0;

  // 5. Internships (15%)
  const internshipsEarned = params.internshipCount >= 1 ? 15 : 0;

  // 6. Achievements (10%)
  const achievementsEarned = params.achievementCount >= 1 ? 10 : 0;

  const totalScore = Math.min(
    100,
    profileEarned + skillsEarned + projectsEarned + certsEarned + internshipsEarned + achievementsEarned
  );

  return {
    score: totalScore,
    factors: {
      profileComplete: { weight: 20, earned: profileEarned, complete: profileEarned >= 20 },
      skillsAssessed: { weight: 20, earned: skillsEarned, complete: skillsEarned > 0 },
      projects: { weight: 20, earned: projectsEarned, complete: projectsEarned >= 20 },
      certifications: { weight: 15, earned: certsEarned, complete: certsEarned > 0 },
      internships: { weight: 15, earned: internshipsEarned, complete: internshipsEarned > 0 },
      achievements: { weight: 10, earned: achievementsEarned, complete: achievementsEarned > 0 },
    },
  };
}

export interface GitHubPortfolioAuditData {
  id: string;
  githubUrl: string;
  githubUsername: string;
  qualityScore: number;
  feedback: string;
  strengths: string[];
  recommendations: string[];
  auditedProjects: Array<{
    name: string;
    language?: string;
    description?: string;
    commits?: string | number;
    stars?: number;
    status?: string;
    url?: string;
    summary?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Centrally fetches the student's latest GitHub Portfolio Audit analysis.
 * Cleanly separated from the primary unified Digital Student Portfolio.
 */
export async function getLatestGitHubPortfolioAudit(
  userId: string | mongoose.Types.ObjectId
): Promise<GitHubPortfolioAuditData | null> {
  try {
    const userObjId = typeof userId === 'string' && mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const latestPortfolio = await Portfolio.findOne({
      $or: [{ userId: userObjId }, { userId: String(userId) }],
    }).sort({ createdAt: -1 });

    if (!latestPortfolio) {
      return null;
    }

    return {
      id: latestPortfolio._id.toString(),
      githubUrl: latestPortfolio.githubUrl || '',
      githubUsername: latestPortfolio.githubUsername || '',
      qualityScore: typeof latestPortfolio.qualityScore === 'number' ? latestPortfolio.qualityScore : 80,
      feedback: latestPortfolio.feedback || '',
      strengths: Array.isArray(latestPortfolio.strengths) ? latestPortfolio.strengths : [],
      recommendations: Array.isArray(latestPortfolio.recommendations) ? latestPortfolio.recommendations : [],
      auditedProjects: Array.isArray(latestPortfolio.auditedProjects) ? latestPortfolio.auditedProjects : [],
      createdAt: latestPortfolio.createdAt,
      updatedAt: latestPortfolio.updatedAt,
    };
  } catch (err) {
    console.warn('Error fetching latest GitHub portfolio audit in portfolioService:', err);
    return null;
  }
}

/**
 * Centrally aggregates student portfolio data across existing collections:
 * User (Profile + Education) + StudentSkillProfile + Certifications + Projects + Internships + Achievements.
 * Reuses existing models without duplication.
 */
export async function getDigitalStudentPortfolio(
  userId: string | mongoose.Types.ObjectId
): Promise<AggregatedStudentPortfolio | null> {
  const userObjId = typeof userId === 'string' && mongoose.isValidObjectId(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const userQuery = { $in: [userObjId, userId.toString()] };

  // Parallel fetch of all related records
  const [
    user,
    skillProfile,
    certificationsDocs,
    projectsDocs,
    portfolioDoc,
    internshipsDocs,
    achievementsDocs,
  ] = await Promise.all([
    User.findById(userObjId).select('-password'),
    StudentSkillProfile.findOne({ userId: userQuery }),
    (Certification as any).find({ userId: userQuery }).sort({ addedAt: -1, createdAt: -1 }),
    Project.find({ userId: userQuery }).sort({ createdAt: -1 }),
    Portfolio.findOne({ userId: userQuery }).sort({ createdAt: -1 }),
    Internship.find({ userId: userQuery }).sort({ createdAt: -1 }),
    Achievement.find({ userId: userQuery }).sort({ createdAt: -1 }),
  ]);

  if (!user) {
    return null;
  }

  // 1. Profile information
  const profile: PortfolioProfile = {
    id: user._id.toString(),
    name: user.name || '',
    fullName: user.name || '',
    email: user.email || '',
    college: user.college || user.collegeName || '',
    degree: user.degree || '',
    department: user.department || '',
    targetRole: user.targetRole || '',
    targetCtc: user.targetCtc || '',
    phone: user.phone || '',
    githubUrl: user.githubUrl || '',
    linkedinUrl: user.linkedinUrl || '',
    bio: user.bio || '',
    cgpa: user.cgpa ?? null,
    graduationYear: user.graduationYear ?? null,
    readinessScore: user.readinessScore || 0,
  };

  // 2. Skills from StudentSkillProfile (Fix #2 unified source)
  const rawTechSkills = skillProfile?.technicalSkills || [];
  const rawSoftSkills = skillProfile?.softSkills || [];

  const technicalSkills: PortfolioSkillItem[] = rawTechSkills
    .map((s: any) => ({
      skill: s.skill,
      skillId: s.skillId || s.skill.toLowerCase().replace(/\s+/g, '-'),
      category: 'technical' as const,
      score: Math.round(s.score || 0),
      proficiencyLevel: s.proficiencyLevel || (s.score >= 85 ? 'Expert' : s.score >= 70 ? 'Advanced' : s.score >= 50 ? 'Intermediate' : 'Beginner'),
      lastAssessedAt: s.lastAssessedAt,
      assessmentCount: s.assessmentCount || 1,
    }))
    .sort((a, b) => b.score - a.score);

  const softSkills: PortfolioSkillItem[] = rawSoftSkills
    .map((s: any) => ({
      skill: s.skill,
      skillId: s.skillId || s.skill.toLowerCase().replace(/\s+/g, '-'),
      category: 'soft' as const,
      score: Math.round(s.score || 0),
      proficiencyLevel: s.proficiencyLevel || (s.score >= 85 ? 'Expert' : s.score >= 70 ? 'Advanced' : s.score >= 50 ? 'Intermediate' : 'Beginner'),
      lastAssessedAt: s.lastAssessedAt,
      assessmentCount: s.assessmentCount || 1,
    }))
    .sort((a, b) => b.score - a.score);

  const skills: PortfolioSkills = {
    technical: technicalSkills,
    soft: softSkills,
    overallTechnicalScore: skillProfile?.overallTechnicalScore || 0,
    overallSoftScore: skillProfile?.overallSoftScore || 0,
    strengths: skillProfile?.strengths || [],
    skillGaps: skillProfile?.skillGaps || [],
    lastUpdated: skillProfile?.lastUpdated,
  };

  // 3. Education
  const education: PortfolioEducation = {
    college: user.college || user.collegeName || '',
    degree: user.degree || '',
    department: user.department || '',
    graduationYear: user.graduationYear ?? null,
    cgpa: user.cgpa ?? null,
    year: user.graduationYear ? `Class of ${user.graduationYear}` : '',
  };

  // Helper to normalize verification status
  const normalizeStatus = (raw: any, isVerifiedFlag?: boolean): 'PENDING' | 'VERIFIED' | 'REJECTED' => {
    if (raw === 'VERIFIED' || raw === 'Verified' || isVerifiedFlag === true) {
      return 'VERIFIED';
    }
    if (raw === 'REJECTED' || raw === 'Rejected') {
      return 'REJECTED';
    }
    return 'PENDING';
  };

  // 4. Certifications
  const certifications: PortfolioCertificationItem[] = certificationsDocs.map((cert) => {
    const status = normalizeStatus((cert as any).verificationStatus, (cert as any).isVerified === true);

    return {
      id: cert._id.toString(),
      title: cert.title || '',
      issuer: cert.issuer || '',
      category: cert.category || 'Other',
      dateIssued: cert.dateIssued || '',
      credentialUrl: cert.credentialUrl || '',
      fileUrl: cert.fileUrl || '',
      fileId: (cert as any).fileId || '',
      verificationStatus: status,
      verificationNote: (cert as any).verificationNote || '',
      verifiedBy: (cert as any).verifiedBy || null,
      verifiedAt: (cert as any).verifiedAt || null,
      addedAt: cert.addedAt,
    };
  });

  // 5. Projects (from student's Project records)
  const projects: PortfolioProjectItem[] = projectsDocs.map((p) => {
    const status = normalizeStatus((p as any).verificationStatus);
    return {
      id: p._id.toString(),
      title: p.title || '',
      description: p.description || '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      role: p.role || 'Developer',
      duration: p.duration || '',
      githubUrl: p.githubUrl || '',
      liveUrl: p.liveUrl || '',
      outcomes: p.outcomes || '',
      source: p.source || 'manual',
      verificationStatus: status,
      verificationNote: (p as any).verificationNote || '',
      verifiedBy: (p as any).verifiedBy || null,
      verifiedAt: (p as any).verifiedAt || null,
      fileId: (p as any).fileId || '',
      createdAt: p.createdAt,
    };
  });

  // 6. Internships
  const internships: PortfolioInternshipItem[] = internshipsDocs.map((item) => {
    const status = normalizeStatus((item as any).verificationStatus);
    return {
      id: item._id.toString(),
      organization: item.organization || '',
      role: item.role || '',
      duration: item.duration || '',
      description: item.description || '',
      skills: Array.isArray(item.skills) ? item.skills : [],
      location: item.location || '',
      status: item.status || 'Completed',
      certificateUrl: item.certificateUrl || '',
      verificationStatus: status,
      verificationNote: (item as any).verificationNote || '',
      verifiedBy: (item as any).verifiedBy || null,
      verifiedAt: (item as any).verifiedAt || null,
      fileId: (item as any).fileId || '',
      createdAt: item.createdAt,
    };
  });

  // 7. Achievements
  const achievements: PortfolioAchievementItem[] = achievementsDocs.map((item) => {
    const status = normalizeStatus((item as any).verificationStatus);
    return {
      id: item._id.toString(),
      title: item.title || '',
      organization: item.organization || '',
      date: item.date || '',
      description: item.description || '',
      rank: item.rank || '',
      credentialUrl: item.credentialUrl || '',
      verificationStatus: status,
      verificationNote: (item as any).verificationNote || '',
      verifiedBy: (item as any).verifiedBy || null,
      verifiedAt: (item as any).verifiedAt || null,
      fileId: (item as any).fileId || '',
      createdAt: item.createdAt,
    };
  });

  // 8. Completeness calculation
  const completeness = calculatePortfolioCompleteness({
    hasBasicProfile: Boolean(profile.name && profile.college),
    hasDegreeOrDept: Boolean(profile.degree || profile.department),
    hasBioOrTargetRole: Boolean(profile.bio || profile.targetRole),
    hasAssessedSkills: technicalSkills.length > 0 || softSkills.length > 0,
    projectCount: projects.length,
    certCount: certifications.length,
    internshipCount: internships.length,
    achievementCount: achievements.length,
  });

  // 9. Optional Code Quality Audit summary from GitHub analysis
  const codeQualityAudit = portfolioDoc ? {
    qualityScore: typeof portfolioDoc.qualityScore === 'number' ? portfolioDoc.qualityScore : null,
    githubUsername: portfolioDoc.githubUsername || '',
    githubUrl: portfolioDoc.githubUrl || '',
    strengths: Array.isArray(portfolioDoc.strengths) ? portfolioDoc.strengths : [],
    recommendations: Array.isArray(portfolioDoc.recommendations) ? portfolioDoc.recommendations : [],
    feedback: portfolioDoc.feedback || '',
  } : null;

  return {
    profile,
    skills,
    education,
    certifications,
    projects,
    internships,
    achievements,
    completeness,
    codeQualityAudit,
  };
}

// Aliases for clear architecture & backward compatibility
export const getStudentPortfolio = getDigitalStudentPortfolio;
export const getAggregatedStudentPortfolio = getDigitalStudentPortfolio;
