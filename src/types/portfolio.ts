export interface DigitalPortfolioProfile {
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

export interface DigitalPortfolioSkillItem {
  skill: string;
  skillId: string;
  category: 'technical' | 'soft';
  score: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  lastAssessedAt?: Date | string;
  assessmentCount?: number;
}

export interface DigitalPortfolioSkills {
  technical: DigitalPortfolioSkillItem[];
  soft: DigitalPortfolioSkillItem[];
  overallTechnicalScore: number;
  overallSoftScore: number;
  strengths: string[];
  skillGaps: string[];
  lastUpdated?: Date | string;
}

export interface DigitalPortfolioEducation {
  college: string;
  degree: string;
  department: string;
  graduationYear: number | null;
  cgpa: number | null;
  year: string;
}

export interface DigitalPortfolioCertificationItem {
  id: string;
  title: string;
  issuer: string;
  category: string;
  dateIssued: string;
  credentialUrl: string;
  fileUrl: string;
  fileId?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  addedAt?: Date | string;
}

export interface DigitalPortfolioProjectItem {
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
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  fileId?: string;
  createdAt?: Date | string;
}

export interface DigitalPortfolioInternshipItem {
  id: string;
  organization: string;
  role: string;
  duration: string;
  description: string;
  skills: string[];
  location: string;
  status: 'Completed' | 'Ongoing' | 'Offer';
  certificateUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  fileId?: string;
  createdAt?: Date | string;
}

export interface DigitalPortfolioAchievementItem {
  id: string;
  title: string;
  organization: string;
  date: string;
  description: string;
  rank: string;
  credentialUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  fileId?: string;
  createdAt?: Date | string;
}

export interface DigitalPortfolioCompletenessFactor {
  weight: number;
  earned: number;
  complete: boolean;
}

export interface DigitalPortfolioCompleteness {
  score: number; // 0 - 100
  factors: {
    profileComplete: DigitalPortfolioCompletenessFactor;
    skillsAssessed: DigitalPortfolioCompletenessFactor;
    projects: DigitalPortfolioCompletenessFactor;
    certifications: DigitalPortfolioCompletenessFactor;
    internships: DigitalPortfolioCompletenessFactor;
    achievements: DigitalPortfolioCompletenessFactor;
  };
}

export interface DigitalPortfolioGithubAudit {
  qualityScore: number;
  githubUrl: string;
  githubUsername: string;
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
  feedback?: string;
  strengths?: string[];
  recommendations?: string[];
  updatedAt?: Date | string;
}

export interface DigitalStudentPortfolio {
  profile: DigitalPortfolioProfile;
  skills: DigitalPortfolioSkills;
  education: DigitalPortfolioEducation;
  certifications: DigitalPortfolioCertificationItem[];
  projects: DigitalPortfolioProjectItem[];
  internships: DigitalPortfolioInternshipItem[];
  achievements: DigitalPortfolioAchievementItem[];
  githubAudit: DigitalPortfolioGithubAudit | null;
  completeness: DigitalPortfolioCompleteness;
}
