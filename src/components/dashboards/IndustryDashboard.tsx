import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DashboardShell } from './DashboardShell';
import {
  Briefcase,
  Users,
  Search,
  FileText,
  GraduationCap,
  LineChart,
  Building2,
  BarChart3,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  Plus,
  Edit3,
  X,
  Menu,
  LogOut,
  ChevronRight,
  TrendingUp,
  Award,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Target,
  ExternalLink,
  Sliders,
  Sparkles,
  MapPin,
  DollarSign,
  UserCheck,
  Loader2,
  Code,
  Github,
  Send,
  Check,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Star,
  UserX,
  BookOpen,
  Trash2,
  Monitor,
  Layers,
  Percent,
  ArrowRight,
  Phone,
  Linkedin,
  Mail,
  User,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge, VerifiedSeal } from '../ui/Badge';
import { SectionHeading } from '../ui/SectionHeading';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ListRow, LedgerContainer, RecordCard } from '../ui/ListRow';
import { DigitalStudentPortfolioView } from '../portfolio/DigitalStudentPortfolioView';
import type { DigitalStudentPortfolio } from '../../types/portfolio';
import { viewAuthenticatedFile } from '../../utils/fileViewer';

interface IndustryDashboardProps {
  onSwitchRole?: () => void;
  onLogout: () => void;
}

export type IndustryNavTab =
  | 'overview'
  | 'jobs'
  | 'talent'
  | 'applications'
  | 'learning'
  | 'analytics'
  | 'company_profile';

interface JobItem {
  id: string | number;
  _id?: string;
  recruiterId?: string;
  company: string;
  title: string;
  type?: 'Job' | 'Internship' | 'Apprenticeship';
  ctc?: string;
  stipend?: string;
  duration?: string;
  applicants?: number;
  openPositions?: number;
  cutoffPct?: number;
  status?: string;
  requiredSkills?: string[];
  location?: string;
  description?: string;
  createdAt?: string;
}

interface CandidateItem {
  id: string;
  _id?: string;
  name: string;
  college?: string;
  role?: string;
  targetRole?: string;
  readinessScore?: number;
  overallScore?: number;
  atsMatch?: number;
  dsaSolved?: number;
  badgeCount?: number;
  skills?: string[];
  shortlisted?: boolean;

  // PlacementOS FIX #4 Skill Matching fields
  matchPercentage?: number | null;
  hasRequirements?: boolean;
  matchCategory?: string;
  matchCategoryLabel?: string;
  totalRequirements?: number;
  assessedRequirementsCount?: number;
  strengths?: string[];
  needsImprovement?: string[];
  gaps?: string[];
  notAssessed?: string[];
  prioritySkills?: string[];
  explanation?: string;
  hasApplied?: boolean;
  applicationStatus?: string;
  applicationId?: string;
  appliedAt?: string | Date;
}

interface CandidateProfileData {
  candidate: {
    id: string;
    name: string;
    email?: string;
    college?: string | null;
    targetRole?: string | null;
    readinessScore?: number;
    dsaSolved?: number;
  };
  resume: {
    atsScore?: number | null;
    skillsFound?: string[];
    missingSkills?: string[];
    formattingScore?: number | null;
    quantifiedImpactScore?: number | null;
    targetRole?: string | null;
    createdAt?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
  } | null;
  portfolio: {
    qualityScore?: number | null;
    githubUrl?: string | null;
    githubUsername?: string | null;
    auditedProjects?: Array<{
      name: string;
      language?: string;
      description?: string;
      commits?: string;
      stars?: number;
      status?: string;
      url?: string;
      summary?: string;
    }>;
  } | null;
  certificationsGrouped?: Record<string, any[]>;
  certificationsCount?: number;
  badgeCount?: number;
  avgMockInterviewScore?: number | null;
  skillProfile?: {
    technicalSkills: any[];
    softSkills: any[];
    strengths: string[];
    skillGaps: string[];
  } | null;
  jobMatch?: {
    jobId: string;
    jobTitle: string;
    company: string;
    matchPercentage: number | null;
    matchCategory: string;
    hasRequirements: boolean;
    strengths: string[];
    gaps: string[];
    needsImprovement: string[];
    notAssessed: string[];
    detailedBreakdown: any[];
  } | null;
  digitalPortfolio?: DigitalStudentPortfolio | null;
}

export interface RecruiterApplicationItem {
  id: string;
  _id?: string;
  jobPostingId?: string | null;
  company: string;
  role: string;
  type?: 'Job' | 'Internship' | 'Apprenticeship';
  status: string;
  completionStatus?: 'Not Started' | 'In Progress' | 'Completed' | 'Discontinued';
  mentorFeedback?: {
    rating?: number;
    comments?: string;
    submittedAt?: string | Date;
  } | null;
  completedAt?: string | Date;
  appliedAt?: string;
  createdAt?: string;
  studentName?: string;
  studentCollege?: string;
  readinessScore?: number;
  matchPercentage?: number | null;
  matchCategory?: string;
  hasRequirements?: boolean;
  strengths?: string[];
  gaps?: string[];
  needsImprovement?: string[];
  notAssessed?: string[];
  student?: {
    id: string;
    name: string;
    college: string;
    readinessScore: number;
    email?: string;
  };
}

export interface LearningProgramItem {
  id?: string;
  _id?: string;
  recruiterId?: string;
  company: string;
  title: string;
  type: 'Certification' | 'Workshop' | 'Training Program' | 'Mentorship';
  description?: string;
  skillsCovered?: string[];
  duration?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  capacity?: number;
  enrolledCount?: number;
  applicantCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningProgramApplicantItem {
  id: string;
  programId: string;
  status: 'APPLIED' | 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED';
  message?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
  student: {
    id: string;
    name: string;
    email?: string;
    college?: string;
    degree?: string;
    targetRole?: string;
    skills?: string[];
    bio?: string;
    cgpa?: number;
    graduationYear?: number;
    githubUrl?: string;
    linkedinUrl?: string;
  };
}

export type AcademicOpportunityType =
  | 'Faculty Internship'
  | 'Industrial Training'
  | 'FDP'
  | 'Consultancy'
  | 'Research Collaboration';

export interface AcademicOpportunityItem {
  id?: string;
  _id?: string;
  postedBy?: string;
  company: string;
  title: string;
  type: AcademicOpportunityType;
  description?: string;
  duration?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  requiredExpertise?: string[];
  stipendOrHonorarium?: string;
  deadline?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const IndustryDashboard: React.FC<IndustryDashboardProps> = ({
  onSwitchRole,
  onLogout,
}) => {
  const { user, token, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<IndustryNavTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Real backend data states
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // PlacementOS FIX #4: Opportunity-specific candidate ranking states
  const [selectedJobForRankingId, setSelectedJobForRankingId] = useState<string>('all');
  const [rankedCandidates, setRankedCandidates] = useState<CandidateItem[]>([]);
  const [rankingLoading, setRankingLoading] = useState<boolean>(false);
  const [rankingScope, setRankingScope] = useState<'all' | 'applicants'>('all');

  // Applications pipeline states
  const [applications, setApplications] = useState<RecruiterApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState<boolean>(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [appJobFilter, setAppJobFilter] = useState<string>('all');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [appStatusUpdateError, setAppStatusUpdateError] = useState<string | null>(null);
  const [appStatusUpdateSuccess, setAppStatusUpdateSuccess] = useState<string | null>(null);
  const [showRejectedSection, setShowRejectedSection] = useState<boolean>(false);

  // Learning programs module state
  const [learningSubView, setLearningSubView] = useState<'programs' | 'academic'>('programs');
  const [learningPrograms, setLearningPrograms] = useState<LearningProgramItem[]>([]);
  const [learningLoading, setLearningLoading] = useState<boolean>(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [learningSuccessMessage, setLearningSuccessMessage] = useState<string | null>(null);

  // Academic collaboration module state
  const [academicOpportunities, setAcademicOpportunities] = useState<AcademicOpportunityItem[]>([]);
  const [academicLoading, setAcademicLoading] = useState<boolean>(false);
  const [academicError, setAcademicError] = useState<string | null>(null);
  const [academicSuccessMessage, setAcademicSuccessMessage] = useState<string | null>(null);

  // Filters & search for academic opportunities
  const [academicSearchQuery, setAcademicSearchQuery] = useState('');
  const [academicTypeFilter, setAcademicTypeFilter] = useState<
    'all' | AcademicOpportunityType
  >('all');
  const [academicModeFilter, setAcademicModeFilter] = useState<'all' | 'Online' | 'Offline' | 'Hybrid'>('all');

  // Modal states for Publish Academic Opportunity
  const [isCreateAcademicModalOpen, setIsCreateAcademicModalOpen] = useState(false);
  const [acadTitle, setAcadTitle] = useState('');
  const [acadType, setAcadType] = useState<AcademicOpportunityType>('Faculty Internship');
  const [acadDescription, setAcadDescription] = useState('');
  const [acadDuration, setAcadDuration] = useState('4 Weeks');
  const [acadMode, setAcadMode] = useState<'Online' | 'Offline' | 'Hybrid'>('Online');
  const [acadExpertise, setAcadExpertise] = useState('');
  const [acadStipend, setAcadStipend] = useState('');
  const [acadDeadline, setAcadDeadline] = useState('');
  const [acadSubmitting, setAcadSubmitting] = useState(false);
  const [acadFormError, setAcadFormError] = useState<string | null>(null);

  // Filters & search for learning programs
  const [learningSearchQuery, setLearningSearchQuery] = useState('');
  const [learningTypeFilter, setLearningTypeFilter] = useState<
    'all' | 'Certification' | 'Workshop' | 'Training Program' | 'Mentorship'
  >('all');
  const [learningModeFilter, setLearningModeFilter] = useState<'all' | 'Online' | 'Offline' | 'Hybrid'>('all');

  // Modal states for Publish New Program
  const [isCreateProgramModalOpen, setIsCreateProgramModalOpen] = useState(false);
  const [progTitle, setProgTitle] = useState('');
  const [progType, setProgType] = useState<
    'Certification' | 'Workshop' | 'Training Program' | 'Mentorship'
  >('Certification');
  const [progDescription, setProgDescription] = useState('');
  const [progSkills, setProgSkills] = useState('');
  const [progDuration, setProgDuration] = useState('4 Weeks');
  const [progMode, setProgMode] = useState<'Online' | 'Offline' | 'Hybrid'>('Online');
  const [progCapacity, setProgCapacity] = useState('');
  const [progSubmitting, setProgSubmitting] = useState(false);
  const [progFormError, setProgFormError] = useState<string | null>(null);

  // Modal states for Delete Program Confirmation
  const [programToDelete, setProgramToDelete] = useState<LearningProgramItem | null>(null);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const [programDeleteError, setProgramDeleteError] = useState<string | null>(null);

  // Modal states for Learning Program Applicants Review
  const [selectedProgramForApplicants, setSelectedProgramForApplicants] = useState<LearningProgramItem | null>(null);
  const [programApplicants, setProgramApplicants] = useState<LearningProgramApplicantItem[]>([]);
  const [loadingProgramApplicants, setLoadingProgramApplicants] = useState(false);
  const [programApplicantsError, setProgramApplicantsError] = useState<string | null>(null);
  const [updatingApplicantId, setUpdatingApplicantId] = useState<string | null>(null);
  const [applicantActionError, setApplicantActionError] = useState<string | null>(null);
  const [applicantActionSuccess, setApplicantActionSuccess] = useState<string | null>(null);

  const openProgramApplicantsModal = async (program: LearningProgramItem) => {
    setSelectedProgramForApplicants(program);
    setProgramApplicants([]);
    setLoadingProgramApplicants(true);
    setProgramApplicantsError(null);
    setApplicantActionError(null);
    setApplicantActionSuccess(null);

    const progId = program._id || program.id;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/recruiters/learning-programs/${progId}/applications`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load applicants (${res.status})`);
      }
      const data = await res.json();
      setProgramApplicants(data.applications || []);
      if (data.program) {
        setLearningPrograms((prev) =>
          prev.map((p) =>
            (p._id || p.id) === progId
              ? {
                  ...p,
                  enrolledCount: data.program.enrolledCount ?? p.enrolledCount,
                  capacity: data.program.capacity ?? p.capacity,
                }
              : p
          )
        );
      }
    } catch (err: any) {
      console.error('Error fetching program applicants:', err);
      setProgramApplicantsError(err.message || 'Unable to load applicants');
    } finally {
      setLoadingProgramApplicants(false);
    }
  };

  const handleUpdateApplicantStatus = async (
    applicationId: string,
    newStatus: 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED'
  ) => {
    if (!selectedProgramForApplicants) return;
    const progId = selectedProgramForApplicants._id || selectedProgramForApplicants.id;

    setUpdatingApplicantId(applicationId);
    setApplicantActionError(null);
    setApplicantActionSuccess(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/recruiters/learning-programs/${progId}/applications/${applicationId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update applicant status');
      }

      // Update applicant in local list
      setProgramApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: newStatus, reviewedAt: new Date().toISOString() }
            : app
        )
      );

      // If program enrollment updated, reflect in both selected program and dashboard state
      if (data.program && typeof data.program.enrolledCount === 'number') {
        setSelectedProgramForApplicants((prev) =>
          prev ? { ...prev, enrolledCount: data.program.enrolledCount } : null
        );
        setLearningPrograms((prev) =>
          prev.map((p) =>
            (p._id || p.id) === progId
              ? { ...p, enrolledCount: data.program.enrolledCount }
              : p
          )
        );
      }

      setApplicantActionSuccess(
        newStatus === 'SELECTED'
          ? 'Applicant selected and enrolled into cohort.'
          : newStatus === 'REJECTED'
          ? 'Applicant rejected.'
          : 'Applicant moved to Under Review.'
      );
    } catch (err: any) {
      console.error('Error updating applicant status:', err);
      setApplicantActionError(err.message || 'Failed to update applicant status');
    } finally {
      setUpdatingApplicantId(null);
    }
  };

  // Profile modal / notice state
  const [profileNoticeOpen, setProfileNoticeOpen] = useState(false);

  // Job Postings management & creation modal state
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | 'Active' | 'Closed'>('all');
  const [jobSuccessMessage, setJobSuccessMessage] = useState<string | null>(null);

  // Create Job Form fields
  const [formCompany, setFormCompany] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'Job' | 'Internship' | 'Apprenticeship'>('Job');
  const [formCtc, setFormCtc] = useState('');
  const [formStipend, setFormStipend] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formOpenPositions, setFormOpenPositions] = useState<number>(1);
  const [formCutoffPct, setFormCutoffPct] = useState<number>(75);
  const [formRequiredSkills, setFormRequiredSkills] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Talent Search & Filter states
  const [talentSearchQuery, setTalentSearchQuery] = useState('');
  const [talentSortBy, setTalentSortBy] = useState<'match' | 'readiness' | 'ats' | 'dsa'>('readiness');
  const [talentScoreFilter, setTalentScoreFilter] = useState<'all' | 'high' | 'moderate' | 'invited'>('all');

  // Candidate Profile Detail Modal states
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateModalTab, setCandidateModalTab] = useState<'overview' | 'portfolio' | 'github'>('overview');
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<CandidateProfileData | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Invite to Interview states
  const [inviteJobTitle, setInviteJobTitle] = useState<string>('');
  const [inviteCustomTitle, setInviteCustomTitle] = useState<string>('');
  const [isInviteCustom, setIsInviteCustom] = useState<boolean>(false);
  const [inviteSubmitting, setInviteSubmitting] = useState<boolean>(false);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitedCandidateMap, setInvitedCandidateMap] = useState<
    Record<string, { jobTitle: string; invitedAt: string }>
  >({});

  const companyName = user?.company || 'Industry Partner';
  const recruiterName = user?.name || user?.fullName || 'Recruiter';
  const recruiterDesignation = user?.designation || 'Talent Acquisition';

  // Company Profile tab edit & submission states
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileCompany, setProfileCompany] = useState<string>('');
  const [profileDesignation, setProfileDesignation] = useState<string>('');
  const [profileDepartment, setProfileDepartment] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>('');
  const [profileLinkedin, setProfileLinkedin] = useState<string>('');
  const [profileBio, setProfileBio] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [companyProfileError, setCompanyProfileError] = useState<string | null>(null);
  const [companyProfileSuccess, setCompanyProfileSuccess] = useState<string | null>(null);

  // Sync profile form values when user object updates or when toggling edit mode
  useEffect(() => {
    if (user) {
      setProfileCompany(user.company || '');
      setProfileDesignation(user.designation || '');
      setProfileDepartment(user.department || '');
      setProfilePhone(user.phone || '');
      setProfileLinkedin(user.linkedinUrl || '');
      setProfileBio(user.bio || '');
    }
  }, [user, isEditingProfile]);

  const handleCancelEditProfile = () => {
    if (user) {
      setProfileCompany(user.company || '');
      setProfileDesignation(user.designation || '');
      setProfileDepartment(user.department || '');
      setProfilePhone(user.phone || '');
      setProfileLinkedin(user.linkedinUrl || '');
      setProfileBio(user.bio || '');
    }
    setCompanyProfileError(null);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setCompanyProfileError(null);
    setCompanyProfileSuccess(null);

    const payload = {
      company: profileCompany.trim(),
      designation: profileDesignation.trim(),
      department: profileDepartment.trim(),
      phone: profilePhone.trim(),
      linkedinUrl: profileLinkedin.trim(),
      bio: profileBio.trim(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/recruiters/me/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update company profile');
      }

      // Update AuthContext user with changed fields so the update reflects immediately across the app
      updateUser(data.user || payload);
      setCompanyProfileSuccess('Company profile saved successfully.');
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error('Error saving company profile:', err);
      setCompanyProfileError(err.message || 'Failed to save company profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const hasLoadedDataRef = useRef(false);
  // Fetch real recruiter jobs & candidates data
  const fetchData = async (showRefreshSpinner = false, isSilent = false) => {
    const silent = isSilent || (hasLoadedDataRef.current && !showRefreshSpinner);
    if (showRefreshSpinner) setIsRefreshing(true);
    else if (!silent) setLoading(true);
    if (!silent) setError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // 1. Fetch Job Postings
      const jobsRes = await fetch('/api/recruiters/jobs', { headers });
      let jobsData: JobItem[] = [];
      if (jobsRes.ok) {
        const json = await jobsRes.json();
        if (json.success && Array.isArray(json.jobs)) {
          jobsData = json.jobs;
        }
      } else {
        // Fallback endpoint if needed
        const altJobsRes = await fetch('/api/jobs', { headers });
        if (altJobsRes.ok) {
          const json = await altJobsRes.json();
          if (json.success && Array.isArray(json.jobs)) {
            jobsData = json.jobs;
          }
        }
      }
      setJobs(jobsData);

      // 2. Fetch Candidates Pipeline
      try {
        const candRes = await fetch('/api/recruiters/candidates', { headers });
        if (candRes.ok) {
          const json = await candRes.json();
          if (json.success && Array.isArray(json.candidates)) {
            setCandidates(json.candidates);
          }
        }
      } catch (cErr) {
        console.warn('Non-blocking candidates fetch warning:', cErr);
      }

      // 3. Fetch Applications Pipeline
      try {
        const appRes = await fetch('/api/recruiters/applications', { headers });
        if (appRes.ok) {
          const json = await appRes.json();
          if (json.success && Array.isArray(json.applications)) {
            setApplications(json.applications);
          }
        }
      } catch (aErr) {
        console.warn('Non-blocking applications fetch warning:', aErr);
      }

      // 4. Fetch Learning Programs
      try {
        const progRes = await fetch('/api/recruiters/learning-programs', { headers });
        if (progRes.ok) {
          const json = await progRes.json();
          if (json.success && Array.isArray(json.programs)) {
            setLearningPrograms(json.programs);
          }
        }
      } catch (pErr) {
        console.warn('Non-blocking learning programs fetch warning:', pErr);
      }

      // 5. Fetch Academic Opportunities
      try {
        const acadRes = await fetch('/api/recruiters/academic-opportunities', { headers });
        if (acadRes.ok) {
          const json = await acadRes.json();
          if (json.success && Array.isArray(json.opportunities)) {
            setAcademicOpportunities(json.opportunities);
          }
        }
      } catch (acErr) {
        console.warn('Non-blocking academic opportunities fetch warning:', acErr);
      }
    } catch (err: any) {
      console.error('Error fetching recruiter data:', err);
      if (!silent) {
        setError(err.message || 'Unable to load recruitment data from server.');
      }
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
      hasLoadedDataRef.current = true;
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // PlacementOS FIX #4: Fetch and rank candidates specifically for a selected job opportunity
  const handleSelectJobForRanking = async (jobId: string, scope: 'all' | 'applicants' = 'all') => {
    setSelectedJobForRankingId(jobId);
    setRankingScope(scope);

    if (!jobId || jobId === 'all') {
      setRankedCandidates([]);
      if (talentSortBy === 'match') {
        setTalentSortBy('readiness');
      }
      return;
    }

    setTalentSortBy('match');
    setRankingLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/recruiters/jobs/${jobId}/candidates?scope=${scope}`, {
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.candidates)) {
          setRankedCandidates(json.candidates);
        }
      } else {
        // Alternative endpoint fallback
        const altRes = await fetch(`/api/recruiters/candidates?jobId=${jobId}&scope=${scope}`, {
          headers,
        });
        if (altRes.ok) {
          const json = await altRes.json();
          if (json.success && Array.isArray(json.candidates)) {
            setRankedCandidates(json.candidates);
          }
        }
      }
    } catch (rErr) {
      console.warn('Candidate ranking fetch error:', rErr);
    } finally {
      setRankingLoading(false);
    }
  };

  const handleRankingScopeChange = (newScope: 'all' | 'applicants') => {
    if (selectedJobForRankingId && selectedJobForRankingId !== 'all') {
      handleSelectJobForRanking(selectedJobForRankingId, newScope);
    }
  };

  // Polling safety ref: skip polling tick if user has modal open, is editing, or is mid-submit
  const isIndustryBusyRef = useRef(false);
  isIndustryBusyRef.current = Boolean(
    isCreateJobModalOpen ||
    formSubmitting ||
    isCreateProgramModalOpen ||
    progSubmitting ||
    Boolean(programToDelete) ||
    Boolean(selectedProgramForApplicants) ||
    isCreateAcademicModalOpen ||
    acadSubmitting ||
    Boolean(selectedCandidateId) ||
    inviteSubmitting ||
    isEditingProfile ||
    profileSaving
  );

  // Background polling (every 15s) for cross-role data sync
  useEffect(() => {
    let pollTimer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = setInterval(() => {
        // Pause if browser tab is hidden
        if (typeof document !== 'undefined' && document.hidden) return;
        // Skip tick if modal or form is open or action is in-progress
        if (isIndustryBusyRef.current) return;

        // Re-run existing primary data fetch silently in background
        fetchData(false);
      }, 15000);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    if (typeof document === 'undefined' || !document.hidden) {
      startPolling();
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [token]);

  // Dedicated applications loader
  const loadApplications = async (showSpinner = true) => {
    if (showSpinner) setApplicationsLoading(true);
    setApplicationsError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/recruiters/applications', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.applications)) {
          setApplications(json.applications);
        } else {
          setApplications([]);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setApplicationsError(errJson.error || 'Failed to load applications from server.');
      }
    } catch (err: any) {
      console.error('Error loading applications:', err);
      setApplicationsError(err.message || 'Unable to load applications pipeline.');
    } finally {
      if (showSpinner) setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications(false);
    }
  }, [activeTab]);

  // Dedicated learning programs loader
  const loadLearningPrograms = async (showSpinner = true) => {
    if (showSpinner) setLearningLoading(true);
    setLearningError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/recruiters/learning-programs', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.programs)) {
          setLearningPrograms(json.programs);
        } else {
          setLearningPrograms([]);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setLearningError(errJson.error || 'Failed to load learning programs from server.');
      }
    } catch (err: any) {
      console.error('Error loading learning programs:', err);
      setLearningError(err.message || 'Unable to load learning programs.');
    } finally {
      if (showSpinner) setLearningLoading(false);
    }
  };

  // Dedicated academic opportunities loader
  const loadAcademicOpportunities = async (showSpinner = true) => {
    if (showSpinner) setAcademicLoading(true);
    setAcademicError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/recruiters/academic-opportunities', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.opportunities)) {
          setAcademicOpportunities(json.opportunities);
        } else {
          setAcademicOpportunities([]);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setAcademicError(errJson.error || 'Failed to load academic opportunities from server.');
      }
    } catch (err: any) {
      console.error('Error loading academic opportunities:', err);
      setAcademicError(err.message || 'Unable to load academic opportunities.');
    } finally {
      if (showSpinner) setAcademicLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'learning') {
      if (learningSubView === 'programs') {
        loadLearningPrograms(false);
      } else {
        loadAcademicOpportunities(false);
      }
    }
  }, [activeTab, learningSubView]);

  const openCreateAcademicModal = () => {
    setAcadTitle('');
    setAcadType('Faculty Internship');
    setAcadDescription('');
    setAcadDuration('4 Weeks');
    setAcadMode('Online');
    setAcadExpertise('');
    setAcadStipend('');
    setAcadDeadline('');
    setAcadFormError(null);
    setIsCreateAcademicModalOpen(true);
  };

  const handleCreateAcademicOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acadTitle.trim()) {
      setAcadFormError('Please enter an opportunity title.');
      return;
    }

    setAcadSubmitting(true);
    setAcadFormError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const expertiseArray = acadExpertise
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/recruiters/academic-opportunities', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: acadTitle.trim(),
          type: acadType,
          description: acadDescription.trim(),
          duration: acadDuration.trim() || '4 Weeks',
          mode: acadMode,
          requiredExpertise: expertiseArray,
          stipendOrHonorarium: acadStipend.trim() || undefined,
          deadline: acadDeadline ? acadDeadline : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish academic opportunity.');
      }

      if (data.opportunity) {
        setAcademicOpportunities((prev) => [data.opportunity, ...prev]);
      } else {
        await loadAcademicOpportunities(false);
      }

      setIsCreateAcademicModalOpen(false);
      setAcademicSuccessMessage(`"${acadTitle.trim()}" published successfully.`);
      setTimeout(() => setAcademicSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error creating academic opportunity:', err);
      setAcadFormError(err.message || 'Failed to publish academic opportunity.');
    } finally {
      setAcadSubmitting(false);
    }
  };

  const openCreateProgramModal = () => {
    setProgTitle('');
    setProgType('Certification');
    setProgDescription('');
    setProgSkills('');
    setProgDuration('4 Weeks');
    setProgMode('Online');
    setProgCapacity('');
    setProgFormError(null);
    setIsCreateProgramModalOpen(true);
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) {
      setProgFormError('Please enter a program title.');
      return;
    }

    setProgSubmitting(true);
    setProgFormError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/recruiters/learning-programs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: progTitle.trim(),
          type: progType,
          description: progDescription.trim(),
          skillsCovered: progSkills,
          duration: progDuration.trim() || '4 Weeks',
          mode: progMode,
          capacity: progCapacity.trim() ? Number(progCapacity) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to publish learning program');
      }

      if (json.program) {
        setLearningPrograms((prev) => [json.program, ...prev]);
      } else {
        await loadLearningPrograms(false);
      }

      setIsCreateProgramModalOpen(false);
      setLearningSuccessMessage(`"${progTitle.trim()}" published successfully.`);
      setTimeout(() => setLearningSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error publishing program:', err);
      setProgFormError(err.message || 'Failed to publish learning program.');
    } finally {
      setProgSubmitting(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    const progId = programToDelete._id || programToDelete.id;
    if (!progId) return;

    setIsDeletingProgram(true);
    setProgramDeleteError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/recruiters/learning-programs/${progId}`, {
        method: 'DELETE',
        headers,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete learning program');
      }

      setLearningPrograms((prev) =>
        prev.filter((p) => (p._id || p.id) !== progId)
      );
      setLearningSuccessMessage(`Program "${programToDelete.title}" deleted.`);
      setTimeout(() => setLearningSuccessMessage(null), 4000);
      setProgramToDelete(null);
    } catch (err: any) {
      console.error('Error deleting program:', err);
      setProgramDeleteError(err.message || 'Could not delete program.');
    } finally {
      setIsDeletingProgram(false);
    }
  };

  // Filtered learning programs
  const filteredLearningPrograms = useMemo(() => {
    return learningPrograms.filter((prog) => {
      if (learningTypeFilter !== 'all' && prog.type !== learningTypeFilter) {
        return false;
      }
      if (learningModeFilter !== 'all' && prog.mode !== learningModeFilter) {
        return false;
      }
      if (learningSearchQuery.trim()) {
        const q = learningSearchQuery.trim().toLowerCase();
        const matchesTitle = (prog.title || '').toLowerCase().includes(q);
        const matchesDesc = (prog.description || '').toLowerCase().includes(q);
        const matchesSkills = (prog.skillsCovered || []).some((s) =>
          s.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesDesc && !matchesSkills) {
          return false;
        }
      }
      return true;
    });
  }, [learningPrograms, learningTypeFilter, learningModeFilter, learningSearchQuery]);

  // Filtered academic opportunities
  const filteredAcademicOpportunities = useMemo(() => {
    return academicOpportunities.filter((item) => {
      if (academicTypeFilter !== 'all' && item.type !== academicTypeFilter) {
        return false;
      }
      if (academicModeFilter !== 'all' && item.mode !== academicModeFilter) {
        return false;
      }
      if (academicSearchQuery.trim()) {
        const q = academicSearchQuery.trim().toLowerCase();
        const matchesTitle = (item.title || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesSkills = (item.requiredExpertise || []).some((s) =>
          s.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesDesc && !matchesSkills) {
          return false;
        }
      }
      return true;
    });
  }, [academicOpportunities, academicTypeFilter, academicModeFilter, academicSearchQuery]);

  // Academic KPIs
  const academicKpis = useMemo(() => {
    const total = academicOpportunities.length;
    const facultyAndTraining = academicOpportunities.filter(
      (o) => o.type === 'Faculty Internship' || o.type === 'Industrial Training'
    ).length;
    const researchAndConsultancy = academicOpportunities.filter(
      (o) => o.type === 'Research Collaboration' || o.type === 'Consultancy'
    ).length;
    const fdps = academicOpportunities.filter((o) => o.type === 'FDP').length;
    return { total, facultyAndTraining, researchAndConsultancy, fdps };
  }, [academicOpportunities]);

  // Normalizes application statuses to the 6 canonical stages
  const normalizeStage = (
    status?: string
  ): 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected' => {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('reject') || s.includes('decline') || s.includes('unsuccessful')) return 'Rejected';
    if (s.includes('offer')) return 'Offer';
    if (s.includes('interview')) return 'Interview';
    if (s.includes('shortlist')) return 'Shortlisted';
    if (s.includes('screen') || s.includes('review')) return 'Screening';
    return 'Applied';
  };

  // Stage progression flow for one-click advance
  const NEXT_STAGE_MAP: Record<string, 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | null> = {
    Applied: 'Screening',
    Screening: 'Shortlisted',
    Shortlisted: 'Interview',
    Interview: 'Offer',
    Offer: null,
    Rejected: null,
  };

  // Update applicant stage via PATCH endpoint with optimistic-on-success update
  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    setUpdatingAppId(applicationId);
    setAppStatusUpdateError(null);
    setAppStatusUpdateSuccess(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/recruiters/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update applicant stage');
      }

      // Update local state ONLY after server confirms success
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId || app._id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      );

      setAppStatusUpdateSuccess(`Applicant stage successfully moved to "${newStatus}".`);
      setTimeout(() => {
        setAppStatusUpdateSuccess(null);
      }, 3500);
    } catch (err: any) {
      console.error('Error updating application status:', err);
      setAppStatusUpdateError(err.message || 'Failed to update applicant stage.');
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Offer stage completion tracking & mentor feedback states
  const [expandedOfferAppId, setExpandedOfferAppId] = useState<string | null>(null);
  const [offerTrackingForms, setOfferTrackingForms] = useState<
    Record<
      string,
      {
        completionStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Discontinued';
        rating: number;
        comments: string;
      }
    >
  >({});
  const [savingCompletionAppId, setSavingCompletionAppId] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<Record<string, string>>({});

  const handleUpdateCompletion = async (applicationId: string) => {
    const formState = offerTrackingForms[applicationId] || {
      completionStatus: 'Not Started',
      rating: 5,
      comments: '',
    };

    setSavingCompletionAppId(applicationId);
    setCompletionError((prev) => ({ ...prev, [applicationId]: '' }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/recruiters/applications/${applicationId}/completion`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          completionStatus: formState.completionStatus,
          rating: formState.rating,
          comments: formState.comments,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update completion tracking');
      }

      setApplications((prev) =>
        prev.map((app) => {
          const id = app.id || app._id;
          if (id === applicationId) {
            return {
              ...app,
              completionStatus: data.application?.completionStatus || formState.completionStatus,
              mentorFeedback: data.application?.mentorFeedback || {
                rating: formState.rating,
                comments: formState.comments,
                submittedAt: new Date(),
              },
              completedAt: data.application?.completedAt,
            };
          }
          return app;
        })
      );

      setAppStatusUpdateSuccess('Internship completion and mentor feedback saved successfully.');
      setTimeout(() => {
        setAppStatusUpdateSuccess(null);
      }, 3500);
    } catch (err: any) {
      console.error('Error updating application completion:', err);
      setCompletionError((prev) => ({
        ...prev,
        [applicationId]: err.message || 'Failed to update completion tracking.',
      }));
    } finally {
      setSavingCompletionAppId(null);
    }
  };

  // Computed KPIs from real job and candidate records
  const kpis = useMemo(() => {
    const activeJobs = jobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active');
    const totalApplicants = jobs.reduce((sum, j) => sum + (Number(j.applicants) || 0), 0);
    const totalOpenPositions = activeJobs.reduce((sum, j) => sum + (Number(j.openPositions) || 1), 0);

    const cutoffScores = jobs
      .filter((j) => typeof j.cutoffPct === 'number' && j.cutoffPct > 0)
      .map((j) => j.cutoffPct as number);

    const avgCutoff = cutoffScores.length > 0
      ? Math.round(cutoffScores.reduce((sum, v) => sum + v, 0) / cutoffScores.length)
      : 75;

    const verifiedPoolCount = candidates.length;

    return {
      activeJobsCount: activeJobs.length,
      totalApplicants,
      totalOpenPositions,
      avgCutoff,
      verifiedPoolCount,
    };
  }, [jobs, candidates]);

  // Open modal with pre-filled recruiter context and clean defaults
  const openCreateJobModal = () => {
    setFormCompany(companyName !== 'Industry Partner' ? companyName : '');
    setFormTitle('');
    setFormType('Job');
    setFormCtc('₹18 - ₹22 LPA');
    setFormStipend('₹40,000 / month');
    setFormDuration('6 Months');
    setFormOpenPositions(2);
    setFormCutoffPct(75);
    setFormRequiredSkills('React, Node.js, TypeScript, PostgreSQL');
    setFormLocation('Bengaluru / Hybrid');
    setFormDescription('Seeking software engineers to build resilient, distributed financial backend services and scalable developer interfaces.');
    setFormError(null);
    setIsCreateJobModalOpen(true);
  };

  // Submit job requisition to POST /api/recruiters/jobs
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Please specify an opportunity title.');
      return;
    }

    setFormSubmitting(true);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      company: formCompany.trim() || companyName,
      title: formTitle.trim(),
      type: formType,
      ctc: formType === 'Job' ? (formCtc.trim() || '₹18 LPA') : undefined,
      stipend: formType !== 'Job' ? (formStipend.trim() || '₹35,000 / month') : undefined,
      duration: formType !== 'Job' ? (formDuration.trim() || '6 Months') : undefined,
      openPositions: Number(formOpenPositions) || 1,
      cutoffPct: Number(formCutoffPct) || 75,
      requiredSkills: formRequiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      location: formLocation.trim() || 'Remote / Hybrid',
      description: formDescription.trim(),
    };

    try {
      const res = await fetch('/api/recruiters/jobs', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to publish job requisition');
      }

      // Refresh real jobs from server
      await fetchData(true);
      setIsCreateJobModalOpen(false);
      setJobSuccessMessage(`Job requisition for "${payload.title}" created successfully!`);

      // Auto dismiss success toast after 6 seconds
      setTimeout(() => {
        setJobSuccessMessage(null);
      }, 6000);
    } catch (err: any) {
      console.error('Error creating job posting:', err);
      setFormError(err.message || 'Unable to publish opportunity to server. Please verify fields and retry.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered jobs for the Job Postings module
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = jobSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        (job.location && job.location.toLowerCase().includes(q)) ||
        (job.requiredSkills &&
          job.requiredSkills.some((s) => s.toLowerCase().includes(q)));

      const status = (job.status || 'Active').toLowerCase();
      const matchesStatus =
        jobStatusFilter === 'all' ||
        (jobStatusFilter === 'Active' && status === 'active') ||
        (jobStatusFilter === 'Closed' && status !== 'active');

      return matchesSearch && matchesStatus;
    });
  }, [jobs, jobSearchQuery, jobStatusFilter]);

  // List of active job postings for invitation selector
  const activeJobsList = useMemo(() => {
    return jobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active');
  }, [jobs]);

  // Readiness score visual styling helper (lime if >= 75, indigo if 50-74, coral if < 50)
  const getReadinessScoreStyle = (score: number) => {
    if (score >= 75) {
      return {
        bg: 'bg-[#A3E635]/20',
        border: 'border-[#A3E635]/60',
        badgeBg: 'bg-[#A3E635]',
        badgeText: 'text-[#14131F]',
        text: 'text-[#14131F]',
        label: 'Strong Match',
      };
    } else if (score >= 50) {
      return {
        bg: 'bg-[#4338CA]/10',
        border: 'border-[#4338CA]/25',
        badgeBg: 'bg-[#4338CA]',
        badgeText: 'text-white',
        text: 'text-[#4338CA]',
        label: 'Calibrated',
      };
    } else {
      return {
        bg: 'bg-[#FB7185]/15',
        border: 'border-[#FB7185]/35',
        badgeBg: 'bg-[#FB7185]',
        badgeText: 'text-white',
        text: 'text-[#E11D48]',
        label: 'Developing',
      };
    }
  };

  const getSkillMatchStyle = (pct: number | null | undefined) => {
    if (pct === null || pct === undefined) {
      return {
        bg: 'bg-[#FAFAF8]',
        border: 'border-[#14131F]/10',
        text: 'text-[#14131F]/60',
        badgeBg: 'bg-[#14131F]/5',
        badgeText: 'text-[#14131F]/70',
        label: 'Unassessed',
      };
    }
    if (pct >= 80) {
      return {
        bg: 'bg-[#A3E635]/20',
        border: 'border-[#A3E635]/60',
        text: 'text-emerald-800',
        badgeBg: 'bg-[#A3E635]/30',
        badgeText: 'text-emerald-900',
        label: 'High Match',
      };
    }
    if (pct >= 65) {
      return {
        bg: 'bg-[#4338CA]/10',
        border: 'border-[#4338CA]/30',
        text: 'text-[#4338CA]',
        badgeBg: 'bg-[#4338CA]/15',
        badgeText: 'text-[#4338CA]',
        label: 'Good Match',
      };
    }
    if (pct >= 50) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        label: 'Potential Match',
      };
    }
    return {
      bg: 'bg-[#FB7185]/15',
      border: 'border-[#FB7185]/35',
      text: 'text-[#E11D48]',
      badgeBg: 'bg-[#FB7185]/20',
      badgeText: 'text-[#E11D48]',
      label: 'Low Match',
    };
  };

  // Filter and sort candidates client-side over already-fetched candidates list (or ranked opportunity pool)
  const filteredCandidates = useMemo(() => {
    const isRankingMode = Boolean(selectedJobForRankingId && selectedJobForRankingId !== 'all');
    const basePool = isRankingMode ? rankedCandidates : candidates;
    let result = [...basePool];

    // Search query filter (name, college, target role, technical skills)
    if (talentSearchQuery.trim()) {
      const q = talentSearchQuery.trim().toLowerCase();
      result = result.filter((c) => {
        const matchesName = c.name && c.name.toLowerCase().includes(q);
        const matchesCollege = c.college && c.college.toLowerCase().includes(q);
        const matchesRole = c.role && c.role.toLowerCase().includes(q);
        const matchesSkills =
          c.skills && c.skills.some((s) => s.toLowerCase().includes(q));
        return matchesName || matchesCollege || matchesRole || matchesSkills;
      });
    }

    // Score / invitation status filter
    if (talentScoreFilter === 'high') {
      result = result.filter((c) =>
        isRankingMode
          ? (c.matchPercentage ?? 0) >= 75 || (c.readinessScore ?? c.overallScore ?? 0) >= 75
          : (c.readinessScore ?? c.overallScore ?? 0) >= 75
      );
    } else if (talentScoreFilter === 'moderate') {
      result = result.filter((c) => {
        if (isRankingMode) {
          const m = c.matchPercentage ?? 0;
          return m >= 50 && m < 75;
        }
        const s = c.readinessScore ?? c.overallScore ?? 0;
        return s >= 50 && s < 75;
      });
    } else if (talentScoreFilter === 'invited') {
      result = result.filter(
        (c) => !!invitedCandidateMap[c.id || c._id || '']
      );
    }

    // Backend ranking order is authoritative for match-based candidate ranking.
    // Preserving backend order ensures multi-tier tie-breakers (skill coverage, strong skills, applications) remain intact.
    if (talentSortBy === 'match') {
      return result;
    }

    // Secondary client-side sorting for alternate metrics (readiness, ats, dsa)
    result.sort((a, b) => {
      if (talentSortBy === 'readiness') {
        const scoreA = a.readinessScore ?? a.overallScore ?? 0;
        const scoreB = b.readinessScore ?? b.overallScore ?? 0;
        return scoreB - scoreA;
      }
      if (talentSortBy === 'ats') {
        const atsA = a.atsMatch ?? 0;
        const atsB = b.atsMatch ?? 0;
        return atsB - atsA;
      }
      if (talentSortBy === 'dsa') {
        const dsaA = a.dsaSolved ?? 0;
        const dsaB = b.dsaSolved ?? 0;
        return dsaB - dsaA;
      }
      return 0;
    });

    return result;
  }, [
    candidates,
    rankedCandidates,
    selectedJobForRankingId,
    talentSearchQuery,
    talentScoreFilter,
    talentSortBy,
    invitedCandidateMap,
  ]);

  // Stage configurations for the 5 main active stages in the Kanban pipeline
  const MAIN_STAGES: Array<{
    key: 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer';
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    indicatorColor: string;
  }> = [
    {
      key: 'Applied',
      label: 'Applied',
      description: 'Incoming applicants',
      badgeBg: 'bg-[#14131F]/10',
      badgeText: 'text-[#14131F]',
      indicatorColor: 'bg-[#14131F]/40',
    },
    {
      key: 'Screening',
      label: 'Screening',
      description: 'Resume & cutoff vetting',
      badgeBg: 'bg-[#4338CA]/10',
      badgeText: 'text-[#4338CA]',
      indicatorColor: 'bg-[#4338CA]',
    },
    {
      key: 'Shortlisted',
      label: 'Shortlisted',
      description: 'Qualified for tech eval',
      badgeBg: 'bg-[#A3E635]/25',
      badgeText: 'text-emerald-900',
      indicatorColor: 'bg-[#A3E635]',
    },
    {
      key: 'Interview',
      label: 'Interview',
      description: 'AI & live tech rounds',
      badgeBg: 'bg-[#4338CA]/20',
      badgeText: 'text-[#4338CA]',
      indicatorColor: 'bg-[#4338CA]',
    },
    {
      key: 'Offer',
      label: 'Offer',
      description: 'Selected candidates',
      badgeBg: 'bg-[#A3E635]',
      badgeText: 'text-[#14131F]',
      indicatorColor: 'bg-[#A3E635]',
    },
  ];

  // Applications filtered by job posting selection and search query
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (appJobFilter !== 'all') {
        const matchesId =
          app.jobPostingId &&
          (app.jobPostingId === appJobFilter || String(app.jobPostingId) === appJobFilter);
        const matchesTitle = app.role && app.role.toLowerCase() === appJobFilter.toLowerCase();
        if (!matchesId && !matchesTitle) return false;
      }

      if (appSearchQuery.trim()) {
        const q = appSearchQuery.trim().toLowerCase();
        const sName = (app.studentName || app.student?.name || '').toLowerCase();
        const sCollege = (app.studentCollege || app.student?.college || '').toLowerCase();
        const sRole = (app.role || '').toLowerCase();
        if (!sName.includes(q) && !sCollege.includes(q) && !sRole.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [applications, appJobFilter, appSearchQuery]);

  // Group filtered applications into stages
  const applicationsByStage = useMemo(() => {
    const groups: {
      Applied: RecruiterApplicationItem[];
      Screening: RecruiterApplicationItem[];
      Shortlisted: RecruiterApplicationItem[];
      Interview: RecruiterApplicationItem[];
      Offer: RecruiterApplicationItem[];
      Rejected: RecruiterApplicationItem[];
    } = {
      Applied: [],
      Screening: [],
      Shortlisted: [],
      Interview: [],
      Offer: [],
      Rejected: [],
    };

    filteredApplications.forEach((app) => {
      const stage = normalizeStage(app.status);
      groups[stage].push(app);
    });

    return groups;
  }, [filteredApplications]);

  // Analytics metrics computed entirely client-side from real jobs, candidates, applications, and learningPrograms state
  const analyticsMetrics = useMemo(() => {
    const totalApps = applications.length;

    // Funnel counts across the 5 progression stages + Rejected
    const stageCounts: Record<
      'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected',
      number
    > = {
      Applied: 0,
      Screening: 0,
      Shortlisted: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };

    applications.forEach((app) => {
      const stage = normalizeStage(app.status);
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });

    const activePipelineCount =
      stageCounts.Applied +
      stageCounts.Screening +
      stageCounts.Shortlisted +
      stageCounts.Interview;

    // Overall conversion rate: % of total applicants reaching Offer stage
    const offerCount = stageCounts.Offer;
    const conversionRatePct =
      totalApps > 0 ? ((offerCount / totalApps) * 100).toFixed(1) : '0.0';

    // Funnel progression step definitions
    const funnelStages = [
      {
        key: 'Applied' as const,
        label: 'Applied',
        stepNum: '01',
        description: 'Initial candidates applied',
        count: stageCounts.Applied,
        color: 'bg-[#4338CA]',
      },
      {
        key: 'Screening' as const,
        label: 'Screening',
        stepNum: '02',
        description: 'Passed initial cutoff & resume review',
        count: stageCounts.Screening,
        color: 'bg-[#4338CA]',
      },
      {
        key: 'Shortlisted' as const,
        label: 'Shortlisted',
        stepNum: '03',
        description: 'Qualified for technical assessments',
        count: stageCounts.Shortlisted,
        color: 'bg-[#4338CA]',
      },
      {
        key: 'Interview' as const,
        label: 'Interview',
        stepNum: '04',
        description: 'In active panel & technical rounds',
        count: stageCounts.Interview,
        color: 'bg-[#4338CA]',
      },
      {
        key: 'Offer' as const,
        label: 'Offer',
        stepNum: '05',
        description: 'Final employment offers extended',
        count: stageCounts.Offer,
        color: 'bg-[#A3E635]',
      },
    ];

    // Interview-to-Offer ratio
    const interviewPool = stageCounts.Interview + stageCounts.Offer;
    const interviewToOfferPct =
      interviewPool > 0
        ? ((stageCounts.Offer / interviewPool) * 100).toFixed(1)
        : '0.0';

    // Per-job breakdown
    const jobBreakdowns = jobs.map((job) => {
      const jobIdStr = (job._id || job.id || '').toString();
      const jobApps = applications.filter((app) => {
        const appJobIdStr = app.jobPostingId ? app.jobPostingId.toString() : '';
        return (
          (appJobIdStr && (appJobIdStr === jobIdStr || appJobIdStr === String(job.id))) ||
          (app.role && job.title && app.role.toLowerCase() === job.title.toLowerCase())
        );
      });

      const counts = {
        Applied: 0,
        Screening: 0,
        Shortlisted: 0,
        Interview: 0,
        Offer: 0,
        Rejected: 0,
      };

      jobApps.forEach((app) => {
        const st = normalizeStage(app.status);
        counts[st] = (counts[st] || 0) + 1;
      });

      const totalJobApplicants = jobApps.length;
      const jobOfferCount = counts.Offer;
      const jobConversionRate =
        totalJobApplicants > 0
          ? ((jobOfferCount / totalJobApplicants) * 100).toFixed(1)
          : '0.0';

      return {
        id: jobIdStr,
        title: job.title,
        company: job.company,
        type: job.type || 'Job',
        status: job.status || 'Active',
        openPositions: job.openPositions || 1,
        cutoffPct: job.cutoffPct ?? 75,
        totalApplicants: totalJobApplicants,
        stageCounts: counts,
        conversionPct: jobConversionRate,
      };
    });

    // Skill demand aggregation across requiredSkills in jobs
    const skillCounts: Record<string, number> = {};
    jobs.forEach((job) => {
      if (Array.isArray(job.requiredSkills)) {
        job.requiredSkills.forEach((raw) => {
          const s = raw.trim();
          if (s) {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          }
        });
      }
    });

    const rankedSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({
        skill,
        count,
        pct: jobs.length > 0 ? Math.round((count / jobs.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const maxSkillCount = rankedSkills.length > 0 ? rankedSkills[0].count : 1;

    // Learning programs engagement
    const totalEnrolled = learningPrograms.reduce(
      (acc, p) => acc + (p.enrolledCount || 0),
      0
    );
    const totalCapacity = learningPrograms.reduce(
      (acc, p) => acc + (p.capacity || 0),
      0
    );
    const programEngagement = learningPrograms.map((prog) => {
      const enrolled = prog.enrolledCount || 0;
      const cap = prog.capacity;
      const utilizationPct =
        typeof cap === 'number' && cap > 0
          ? Math.min(100, Math.round((enrolled / cap) * 100))
          : null;
      return {
        id: prog._id || prog.id || prog.title,
        title: prog.title,
        type: prog.type,
        mode: prog.mode || 'Online',
        duration: prog.duration || 'Flexible',
        enrolled,
        capacity: cap,
        utilizationPct,
        status: prog.status || 'Active',
      };
    });

    // Applicant average readiness score
    const scores = applications
      .map((app) =>
        typeof app.readinessScore === 'number'
          ? app.readinessScore
          : app.student?.readinessScore
      )
      .filter((s): s is number => typeof s === 'number');

    const avgReadiness =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    return {
      totalApps,
      stageCounts,
      activePipelineCount,
      offerCount,
      conversionRatePct,
      funnelStages,
      interviewToOfferPct,
      jobBreakdowns,
      rankedSkills,
      maxSkillCount,
      totalEnrolled,
      totalCapacity,
      programEngagement,
      avgReadiness,
    };
  }, [applications, jobs, learningPrograms]);

  // Open Candidate Detail Modal and fetch complete assessment report
  const openCandidateProfile = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setCandidateModalTab('overview');
    setProfileLoading(true);
    setProfileError(null);
    setProfileData(null);
    setInviteSuccessMessage(null);
    setInviteError(null);

    // Default invitation role to selected ranking job, first active job posting, or candidate's target role
    const activeRankingJob = (selectedJobForRankingId && selectedJobForRankingId !== 'all')
      ? jobs.find((j) => (j.id || j._id) === selectedJobForRankingId)
      : null;

    const activeJobs = jobs.filter(
      (j) => (j.status || 'Active').toLowerCase() === 'active'
    );
    if (activeRankingJob) {
      setInviteJobTitle(activeRankingJob.title);
      setIsInviteCustom(false);
      setInviteCustomTitle('');
    } else if (activeJobs.length > 0) {
      setInviteJobTitle(activeJobs[0].title);
      setIsInviteCustom(false);
      setInviteCustomTitle('');
    } else {
      const cand = (selectedJobForRankingId && selectedJobForRankingId !== 'all')
        ? rankedCandidates.find((c) => (c.id || c._id) === candidateId)
        : candidates.find((c) => (c.id || c._id) === candidateId);
      setInviteJobTitle(cand?.role || 'Campus Technical Requisition');
      setIsInviteCustom(false);
      setInviteCustomTitle('');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const resolvedJobId = (selectedJobForRankingId && selectedJobForRankingId !== 'all')
      ? selectedJobForRankingId
      : (activeJobsList.length > 0 ? (activeJobsList[0].id || activeJobsList[0]._id) : '');

    const jobQueryParam = resolvedJobId
      ? `?jobId=${resolvedJobId}`
      : '';

    try {
      let res = await fetch(`/api/recruiters/candidates/${candidateId}/profile${jobQueryParam}`, {
        headers,
      });
      if (!res.ok) {
        res = await fetch(`/api/candidates/${candidateId}/profile${jobQueryParam}`, { headers });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.error ||
            `Failed to fetch candidate assessment report (${res.status})`
        );
      }

      const data = await res.json();
      if (data.success) {
        setProfileData(data);
      } else {
        throw new Error(
          data.error || 'Failed to parse candidate profile data'
        );
      }
    } catch (err: any) {
      console.error('Error fetching candidate profile:', err);
      setProfileError(
        err.message ||
          'Unable to load candidate assessment report from server.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Real Interview Invitation Dispatcher
  const handleSendInvite = async (studentId: string) => {
    if (!studentId) return;

    const resolvedJobTitle = isInviteCustom
      ? inviteCustomTitle.trim()
      : inviteJobTitle.trim();
    if (!resolvedJobTitle) {
      setInviteError(
        'Please select or enter a requisition title for the interview invitation.'
      );
      return;
    }

    setInviteSubmitting(true);
    setInviteError(null);
    setInviteSuccessMessage(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const selectedJob = (selectedJobForRankingId && selectedJobForRankingId !== 'all')
      ? jobs.find((j) => (j.id || j._id) === selectedJobForRankingId)
      : (activeJobsList.find((j) => j.title === resolvedJobTitle) || activeJobsList[0]);

    const payload = {
      jobTitle: resolvedJobTitle,
      company: companyName,
      jobId: selectedJob?.id || selectedJob?._id,
    };

    try {
      let res = await fetch(
        `/api/recruiters/candidates/${studentId}/invite`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        res = await fetch(`/api/candidates/${studentId}/invite`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to dispatch interview invitation.'
        );
      }

      const invitedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      setInvitedCandidateMap((prev) => ({
        ...prev,
        [studentId]: {
          jobTitle: resolvedJobTitle,
          invitedAt: invitedDate,
        },
      }));

      const candName = profileData?.candidate?.name || 'Candidate';
      setInviteSuccessMessage(
        `Official interview invitation for "${resolvedJobTitle}" successfully transmitted to ${candName} at ${companyName}. This opportunity is now live and tracked on the candidate's dashboard.`
      );
    } catch (err: any) {
      console.error('Error dispatching interview invitation:', err);
      setInviteError(
        err.message ||
          'Failed to send interview invitation. Please try again.'
      );
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Sidebar navigation configuration
  const navItems: {
    id: IndustryNavTab;
    label: string;
    icon: React.ElementType;
    badge?: string | null;
  }[] = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, badge: null },
    {
      id: 'jobs',
      label: 'Job Postings',
      icon: Briefcase,
      badge: kpis.activeJobsCount > 0 ? `${kpis.activeJobsCount} Active` : null,
    },
    {
      id: 'talent',
      label: 'Talent Search',
      icon: Search,
      badge: kpis.verifiedPoolCount > 0 ? `${kpis.verifiedPoolCount} Vetted` : null,
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      badge: kpis.totalApplicants > 0 ? `${kpis.totalApplicants}` : null,
    },
    { id: 'learning', label: 'Learning Programs', icon: GraduationCap, badge: null },
    { id: 'analytics', label: 'Analytics', icon: LineChart, badge: null },
    { id: 'company_profile', label: 'Company Profile', icon: Building2, badge: null },
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  const filteredNav = sidebarSearch.trim()
    ? navItems.filter((n) => n.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : navItems;

  const renderSearchInput = () => (
    <div className="px-3 pt-3 pb-1">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#14131F]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          placeholder="Search modules..."
          className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] transition-colors"
        />
        {sidebarSearch && (
          <button
            onClick={() => setSidebarSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] text-xs cursor-pointer p-0.5"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );

  const renderNavList = (onItemClick?: () => void) => (
    <nav className="space-y-1 px-3 py-2 flex-1" aria-label="Industry Navigation">
      {filteredNav.length === 0 ? (
        <div className="py-6 px-3 text-center">
          <p className="text-xs text-[#14131F]/50">No modules found</p>
          <button
            onClick={() => setSidebarSearch('')}
            className="mt-1.5 text-[11px] font-medium text-[#4338CA] hover:underline cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : (
        filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onItemClick) onItemClick();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-colors duration-150 cursor-pointer text-left group ${
                isActive
                  ? 'bg-[#4338CA]/10 text-[#4338CA] font-semibold border border-[#4338CA]/20 shadow-2xs'
                  : 'text-[#14131F]/80 hover:text-[#14131F] hover:bg-[#14131F]/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#4338CA]' : 'text-[#14131F]/60 group-hover:text-[#14131F]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#4338CA] text-white'
                      : 'bg-[#14131F]/6 text-[#14131F]/70 group-hover:bg-[#14131F]/10'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })
      )}
    </nav>
  );

  const renderCompanyCard = () => (
    <div className="p-3.5 m-3 rounded-2xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#14131F]/60 font-display">
          Recruiting Tenant
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
          Industry
        </span>
      </div>
      <div className="flex items-center gap-2.5 pt-0.5">
        <div className="w-8 h-8 rounded-xl bg-white border border-[#14131F]/10 flex items-center justify-center shrink-0 text-[#4338CA]">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold font-display text-[#14131F] truncate">{companyName}</p>
          <p className="text-[11px] text-[#14131F]/60 truncate">{recruiterDesignation}</p>
        </div>
      </div>
    </div>
  );

  const renderProfileFooter = () => (
    <div className="p-3 border-t border-[#14131F]/8 bg-white flex items-center justify-between gap-2">
      <button
        onClick={() => setProfileNoticeOpen(true)}
        className="flex items-center gap-2 text-left p-1.5 rounded-xl hover:bg-[#FAFAF8] transition-colors flex-1 min-w-0 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 flex items-center justify-center shrink-0 font-bold text-xs">
          {recruiterName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#14131F] truncate leading-tight">
            {recruiterName}
          </p>
          <p className="text-[10px] text-[#14131F]/50 truncate">{user?.email || 'recruiter@company.com'}</p>
        </div>
      </button>

      <button
        onClick={onLogout}
        className="p-1.5 rounded-lg border border-[#14131F]/10 hover:bg-[#FAFAF8] text-[#14131F]/60 hover:text-[#14131F] transition-colors cursor-pointer shrink-0"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      <DashboardShell
        portalSubtitle="Industry Portal"
        portalIcon={Briefcase}
        currentModuleName={currentNav.label}
        renderSearch={renderSearchInput}
        renderNavList={renderNavList}
        renderSidebarBottom={() => (
          <>
            {renderCompanyCard()}
            {renderProfileFooter()}
          </>
        )}
        headerBadges={
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#4338CA]" />
            <span>Campus Recruiter Node</span>
          </div>
        }
        headerActions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              className="text-xs text-[#14131F]/70 border border-[#14131F]/10 hover:border-[#14131F]/20"
              title="Refresh recruitment metrics"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {onSwitchRole && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSwitchRole}
                className="hidden md:inline-flex text-xs text-[#14131F]/70 hover:text-[#14131F] border border-[#14131F]/10 hover:border-[#14131F]/20"
              >
                Switch Role
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveTab('jobs');
                openCreateJobModal();
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              <span className="hidden xs:inline">Post Opportunity</span>
              <span className="xs:hidden">Post</span>
            </Button>
          </>
        }
      >
        {/* Company Profile Header Strip */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display font-bold text-xl sm:text-2xl text-[#14131F] tracking-tight">
                    {companyName}
                  </h1>
                  <Badge variant="verified" size="sm">
                    Verified Industry Partner
                  </Badge>
                </div>
                <p className="font-sans text-xs sm:text-sm text-[#14131F]/65 flex items-center gap-2 flex-wrap">
                  <span>Talent Lead: <strong className="text-[#14131F] font-semibold">{recruiterName}</strong></span>
                  <span className="text-[#14131F]/30">•</span>
                  <span>{recruiterDesignation}</span>
                  <span className="text-[#14131F]/30">•</span>
                  <span className="text-[#14131F]/60">{user?.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProfileNoticeOpen(true)}
                icon={<Edit3 className="w-3.5 h-3.5 text-[#14131F]/70" />}
                className="text-xs"
              >
                Edit Profile
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab('jobs');
                  openCreateJobModal();
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                New Job Requisition
              </Button>
            </div>
          </div>

          {/* ACTIVE TAB ROUTING */}
          {activeTab === 'overview' ? (
            /* OVERVIEW TAB (Real Data) */
            <div className="space-y-6">
              {/* Error Banner */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchData()}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Section Heading */}
              <SectionHeading
                level="h2"
                title="Recruitment Pipeline & Requisitions"
                subtitle="Live telemetry across active openings, student applicants, and algorithmic readiness cutoffs."
                action={
                  <div className="flex items-center gap-2 text-xs text-[#14131F]/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Synced with campus ledger</span>
                  </div>
                }
              />

              {/* Real KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Active Requisitions */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Active Requisitions
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : kpis.activeJobsCount}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">postings live</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      {loading
                        ? 'Loading requisitions...'
                        : `${kpis.totalOpenPositions} open positions currently available`}
                    </p>
                  </div>
                </div>

                {/* 2. Total Inbound Applicants */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Inbound Applicants
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#14131F]/5 text-[#14131F]/70 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : kpis.totalApplicants}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">candidates</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      Across active and archived campus openings
                    </p>
                  </div>
                </div>

                {/* 3. Pre-Vetted Talent Pool */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Matched Talent Pool
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-[#65A30D] flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : kpis.verifiedPoolCount > 0 ? kpis.verifiedPoolCount : '50+'}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">vetted students</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      Calibrated for your target role competencies
                    </p>
                  </div>
                </div>

                {/* 4. Average Readiness Cutoff */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Average Cutoff
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : `${kpis.avgCutoff}%`}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">readiness threshold</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      AI mock interview + DSA benchmark criteria
                    </p>
                  </div>
                </div>
              </div>

              {/* RECENT JOB POSTINGS LEDGER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-[#14131F] tracking-tight">
                      Recent Job Requisitions
                    </h2>
                    <p className="text-xs text-[#14131F]/65 mt-0.5">
                      Active job and internship openings tracked in the campus placement network.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('jobs')}
                    className="text-xs text-[#4338CA] hover:text-[#3730A3]"
                  >
                    View All Postings
                  </Button>
                </div>

                {loading ? (
                  /* Skeletons */
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-[#14131F]/8 last:border-b-0 animate-pulse">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-[#14131F]/10 rounded w-1/3" />
                          <div className="h-3 bg-[#14131F]/5 rounded w-1/2" />
                        </div>
                        <div className="h-6 w-20 bg-[#14131F]/10 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  /* Empty state */
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-8 sm:p-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                      <Briefcase className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1.5">
                      <h3 className="text-lg font-bold font-display text-[#14131F]">
                        No job opportunities posted yet
                      </h3>
                      <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                        Create your first job or internship requisition to start discovering verified student candidates calibrated to your hiring criteria.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setActiveTab('jobs')}
                      icon={<Plus className="w-4 h-4" />}
                      className="text-xs font-semibold"
                    >
                      Post your first opportunity
                    </Button>
                  </div>
                ) : (
                  /* Render Job Postings List */
                  <LedgerContainer
                    header={
                      <div className="flex items-center justify-between w-full">
                        <span>Active Job Ledger ({jobs.length})</span>
                        <span className="text-[11px] font-normal text-[#14131F]/50 lowercase">
                          sorted by most recent
                        </span>
                      </div>
                    }
                  >
                    {jobs.map((job, idx) => {
                      const isActive = (job.status || 'Active').toLowerCase() === 'active';
                      const badgeVariant = isActive ? 'verified' : 'neutral';
                      const compensation = job.ctc || job.stipend || 'Competitive';
                      const openCount = job.openPositions || 1;
                      const cutoff = job.cutoffPct || 75;

                      return (
                        <ListRow
                          key={job.id || job._id || idx}
                          isLast={idx === jobs.length - 1}
                          leading={
                            <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold text-xs shrink-0">
                              <Briefcase className="w-4 h-4" />
                            </div>
                          }
                          title={job.title}
                          subtitle={
                            <div className="space-y-1.5 mt-0.5">
                              <div className="flex items-center gap-2 text-xs text-[#14131F]/65 flex-wrap">
                                <span className="font-semibold text-[#14131F]">{job.company}</span>
                                <span className="text-[#14131F]/30">•</span>
                                <span>{compensation}</span>
                                <span className="text-[#14131F]/30">•</span>
                                <span>{job.type || 'Job'}</span>
                                <span className="text-[#14131F]/30">•</span>
                                <span>{openCount} position{openCount > 1 ? 's' : ''}</span>
                                <span className="text-[#14131F]/30">•</span>
                                <span>Cutoff: {cutoff}%</span>
                              </div>
                              {job.requiredSkills && job.requiredSkills.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  {job.requiredSkills.slice(0, 4).map((skill, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAFAF8] text-[#14131F]/70 border border-[#14131F]/10 font-medium"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {job.requiredSkills.length > 4 && (
                                    <span className="text-[10px] text-[#14131F]/40 font-medium">
                                      +{job.requiredSkills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          }
                          badge={
                            <Badge variant={badgeVariant} size="sm">
                              {job.status || 'Active'}
                            </Badge>
                          }
                          metadata={
                            <div className="text-right">
                              <div className="text-xs font-bold font-display text-[#14131F]">
                                {job.applicants || 0}
                              </div>
                              <div className="text-[10px] text-[#14131F]/50">inbound applicants</div>
                            </div>
                          }
                          action={
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab('jobs')}
                              className="text-xs text-[#14131F]/70 hover:text-[#14131F] border border-[#14131F]/10"
                            >
                              Manage
                            </Button>
                          }
                        />
                      );
                    })}
                  </LedgerContainer>
                )}
              </div>

              {/* QUICK WORKSPACE SHORTCUTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div
                  onClick={() => setActiveTab('talent')}
                  className="bg-white border border-[#14131F]/8 rounded-2xl p-5 hover:border-[#4338CA]/30 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                    Talent Search & Filtering
                  </h3>
                  <p className="text-xs text-[#14131F]/60 mt-1 leading-relaxed">
                    Filter pre-vetted campus candidates by coding readiness, DSA solving velocity, and ATS compatibility.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('applications')}
                  className="bg-white border border-[#14131F]/8 rounded-2xl p-5 hover:border-[#4338CA]/30 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                    Application Pipeline
                  </h3>
                  <p className="text-xs text-[#14131F]/60 mt-1 leading-relaxed">
                    Track incoming student applications, schedule AI interview screens, and issue shortlisting decisions.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white border border-[#14131F]/8 rounded-2xl p-5 hover:border-[#4338CA]/30 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <LineChart className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                    Hiring Velocity & Analytics
                  </h3>
                  <p className="text-xs text-[#14131F]/60 mt-1 leading-relaxed">
                    Monitor candidate conversion rates, university distribution, and benchmark adherence over time.
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'jobs' ? (
            /* JOB POSTINGS TAB */
            <div className="space-y-6">
              {/* Success Notification Banner */}
              {jobSuccessMessage && (
                <div className="p-4 bg-[#A3E635]/15 border border-[#A3E635]/40 rounded-2xl flex items-center justify-between text-xs text-[#14131F] animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#A3E635] text-[#14131F] flex items-center justify-center shrink-0 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold">{jobSuccessMessage}</span>
                      <p className="text-[11px] text-[#14131F]/60">
                        The requisition is now published and active on the placementOS student discovery ledger.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setJobSuccessMessage(null)}
                    className="text-[#14131F]/40 hover:text-[#14131F] p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchData()}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Section Heading */}
              <SectionHeading
                level="h2"
                title="Job Requisitions & Campus Openings"
                subtitle="Manage your company's campus hiring drives, define readiness cutoff scores, and monitor applicant momentum."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateJobModal}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Post New Opportunity
                  </Button>
                }
              />

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Total Requisitions
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : jobs.length}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">postings</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      Across jobs, internships, and apprenticeships
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Active Listings
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-[#65A30D] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : kpis.activeJobsCount}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">live drives</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      Open to applications from calibrated cohorts
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Cumulative Openings
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : kpis.totalOpenPositions}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">seats</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      Total target candidate headcount
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#14131F]/60 font-display">
                      Inbound Pipeline
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-[#14131F]">
                        {loading ? '--' : kpis.totalApplicants}
                      </span>
                      <span className="text-xs font-sans text-[#14131F]/50">candidates</span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-1.5 leading-snug">
                      Submitted verification profiles
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    placeholder="Search by role title, skill, company, or location..."
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl pl-10 pr-8 py-2 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] transition-colors"
                  />
                  {jobSearchQuery && (
                    <button
                      onClick={() => setJobSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] text-xs cursor-pointer p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/10">
                  <button
                    onClick={() => setJobStatusFilter('all')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      jobStatusFilter === 'all'
                        ? 'bg-white text-[#14131F] shadow-2xs font-semibold'
                        : 'text-[#14131F]/60 hover:text-[#14131F]'
                    }`}
                  >
                    All ({jobs.length})
                  </button>
                  <button
                    onClick={() => setJobStatusFilter('Active')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      jobStatusFilter === 'Active'
                        ? 'bg-white text-[#4338CA] shadow-2xs font-semibold'
                        : 'text-[#14131F]/60 hover:text-[#14131F]'
                    }`}
                  >
                    Active ({kpis.activeJobsCount})
                  </button>
                  <button
                    onClick={() => setJobStatusFilter('Closed')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      jobStatusFilter === 'Closed'
                        ? 'bg-white text-[#14131F] shadow-2xs font-semibold'
                        : 'text-[#14131F]/60 hover:text-[#14131F]'
                    }`}
                  >
                    Closed ({Math.max(0, jobs.length - kpis.activeJobsCount)})
                  </button>
                </div>
              </div>

              {/* Postings Ledger List */}
              {loading ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-4 py-4 border-b border-[#14131F]/8 last:border-b-0 animate-pulse"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-[#14131F]/10 rounded w-1/3" />
                        <div className="h-3 bg-[#14131F]/5 rounded w-1/2" />
                      </div>
                      <div className="h-7 w-24 bg-[#14131F]/10 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-lg font-bold font-display text-[#14131F]">
                      {jobs.length === 0 ? 'No job opportunities posted yet' : 'No matching postings found'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                      {jobs.length === 0
                        ? 'Create your first job or internship requisition to calibrate student cutoffs and start receiving pre-vetted campus applications.'
                        : 'Try adjusting your search query or status filter to view other opportunities.'}
                    </p>
                  </div>
                  {jobs.length === 0 ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={openCreateJobModal}
                      icon={<Plus className="w-4 h-4" />}
                      className="text-xs font-semibold"
                    >
                      Post your first opportunity
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setJobSearchQuery('');
                        setJobStatusFilter('all');
                      }}
                      className="text-xs"
                    >
                      Clear search filters
                    </Button>
                  )}
                </div>
              ) : (
                <LedgerContainer
                  header={
                    <div className="flex items-center justify-between w-full">
                      <span>
                        Active Requisitions Ledger ({filteredJobs.length} of {jobs.length})
                      </span>
                      <span className="text-[11px] font-normal text-[#14131F]/50 lowercase">
                        ordered by posting date
                      </span>
                    </div>
                  }
                >
                  {filteredJobs.map((job, idx) => {
                    const isActive = (job.status || 'Active').toLowerCase() === 'active';
                    const compensation = job.ctc || job.stipend || 'Competitive';
                    const openCount = job.openPositions || 1;
                    const cutoff = job.cutoffPct || 75;
                    const postingType = job.type || 'Job';

                    return (
                      <ListRow
                        key={job.id || job._id || idx}
                        isLast={idx === filteredJobs.length - 1}
                        leading={
                          <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold text-xs shrink-0">
                            <Briefcase className="w-4.5 h-4.5" />
                          </div>
                        }
                        title={job.title}
                        subtitle={
                          <div className="space-y-2 mt-1">
                            <div className="flex items-center gap-2 text-xs text-[#14131F]/65 flex-wrap">
                              <span className="font-semibold text-[#14131F]">{job.company}</span>
                              <span className="text-[#14131F]/30">•</span>
                              <span className="px-2 py-0.5 rounded-md bg-[#14131F]/5 font-medium text-[11px] text-[#14131F]/80">
                                {postingType}
                              </span>
                              <span className="text-[#14131F]/30">•</span>
                              <span className="font-medium text-[#14131F]">{compensation}</span>
                              <span className="text-[#14131F]/30">•</span>
                              <span>{openCount} opening{openCount > 1 ? 's' : ''}</span>
                              <span className="text-[#14131F]/30">•</span>
                              <span className="text-[#4338CA] font-medium">Cutoff: {cutoff}%</span>
                              {job.duration && (
                                <>
                                  <span className="text-[#14131F]/30">•</span>
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Clock className="w-3 h-3 text-[#14131F]/50" />
                                    {job.duration}
                                  </span>
                                </>
                              )}
                              {job.location && (
                                <>
                                  <span className="text-[#14131F]/30">•</span>
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <MapPin className="w-3 h-3 text-[#14131F]/50" />
                                    {job.location}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Skills Badges */}
                            {job.requiredSkills && job.requiredSkills.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {job.requiredSkills.slice(0, 5).map((skill, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAFAF8] text-[#14131F]/70 border border-[#14131F]/10 font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {job.requiredSkills.length > 5 && (
                                  <span className="text-[10px] text-[#14131F]/40 font-medium">
                                    +{job.requiredSkills.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Brief Description Snippet */}
                            {job.description && (
                              <p className="text-[11px] text-[#14131F]/55 line-clamp-1 pt-0.5 max-w-2xl">
                                {job.description}
                              </p>
                            )}
                          </div>
                        }
                        badge={
                          <div className="flex items-center gap-1.5">
                            {isActive ? (
                              <Badge variant="verified" size="sm">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                Closed
                              </Badge>
                            )}
                          </div>
                        }
                        metadata={
                          <div className="text-right">
                            <div className="text-sm font-bold font-display text-[#14131F]">
                              {job.applicants || 0}
                            </div>
                            <div className="text-[10px] text-[#14131F]/50">inbound candidates</div>
                          </div>
                        }
                        action={
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const jId = String(job.id || job._id || '');
                                handleSelectJobForRanking(jId, 'all');
                                setActiveTab('talent');
                              }}
                              className="text-xs text-[#4338CA] bg-[#4338CA]/10 hover:bg-[#4338CA]/15 border-[#4338CA]/25 font-semibold"
                              icon={<Target className="w-3.5 h-3.5" />}
                            >
                              Rank Candidates
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const jId = String(job.id || job._id || '');
                                setAppJobFilter(jId);
                                setActiveTab('applications');
                              }}
                              className="text-xs text-[#14131F]/70 hover:text-[#4338CA] border border-[#14131F]/10 hover:border-[#4338CA]/30"
                            >
                              View Pipeline
                            </Button>
                          </div>
                        }
                      />
                    );
                  })}
                </LedgerContainer>
              )}
            </div>
          ) : activeTab === 'talent' ? (
            /* TALENT SEARCH & VERIFIED CANDIDATE POOL MODULE */
            <div className="space-y-6">
              {/* Header & Pool Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Verified Candidate Talent Pool"
                  subtitle="Pre-assessed engineering candidates calibrated against LeetCode DSA solves, AI mock interviews, and ATS resume audits."
                  badge={`${candidates.length} Available`}
                />
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchData(true)}
                    disabled={isRefreshing}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
                    className="text-xs shrink-0"
                  >
                    Refresh Pool
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveTab('jobs');
                      setIsCreateJobModalOpen(true);
                    }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold shrink-0"
                  >
                    Post Requisition
                  </Button>
                </div>
              </div>

              {/* PlacementOS FIX #4: Requisition Benchmark & Candidate Ranking Selector */}
              <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-2xl p-4 sm:p-5 text-left space-y-3.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#4338CA]" />
                      <h3 className="font-display font-bold text-sm text-[#14131F]">
                        Requisition Skill-Match & Candidate Ranking
                      </h3>
                      {selectedJobForRankingId && selectedJobForRankingId !== 'all' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4338CA] text-white">
                          Ranking Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#14131F]/60 mt-0.5">
                      Select an opportunity to rank candidates using the centralized PlacementOS match engine against required & optional skills.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs font-semibold text-[#14131F]/70 shrink-0">
                      Target Role:
                    </label>
                    <select
                      value={selectedJobForRankingId}
                      onChange={(e) => handleSelectJobForRanking(e.target.value, rankingScope)}
                      className="bg-white border border-[#14131F]/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#14131F] outline-none focus:border-[#4338CA] transition-colors cursor-pointer min-w-[220px]"
                    >
                      <option value="all">Uncalibrated (All Candidates)</option>
                      {jobs.map((job) => (
                        <option key={job.id || job._id} value={job.id || job._id}>
                          {job.title} — {job.company}
                        </option>
                      ))}
                    </select>

                    {selectedJobForRankingId && selectedJobForRankingId !== 'all' && (
                      <button
                        onClick={() => handleSelectJobForRanking('all')}
                        className="text-xs font-medium text-[#14131F]/50 hover:text-[#14131F] px-2 py-1 rounded-lg border border-[#14131F]/10 hover:bg-black/5 cursor-pointer"
                        title="Reset to general pool"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Scope selector when an opportunity is active */}
                {selectedJobForRankingId && selectedJobForRankingId !== 'all' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#14131F]/8 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#14131F]/70">Candidate Scope:</span>
                      <div className="inline-flex rounded-lg bg-black/5 p-0.5">
                        <button
                          onClick={() => handleRankingScopeChange('all')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                            rankingScope === 'all'
                              ? 'bg-white text-[#14131F] shadow-2xs'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          Entire Pool ({candidates.length})
                        </button>
                        <button
                          onClick={() => handleRankingScopeChange('applicants')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                            rankingScope === 'applicants'
                              ? 'bg-white text-[#14131F] shadow-2xs'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          Inbound Applicants Only
                        </button>
                      </div>
                    </div>

                    {rankingLoading ? (
                      <span className="text-[11px] text-[#4338CA] flex items-center gap-1.5 font-medium animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Calibrating match scores...
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#14131F]/50">
                        Ranked {rankedCandidates.length} candidate{rankedCandidates.length === 1 ? '' : 's'} by skill match
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* KPI Metrics Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {selectedJobForRankingId && selectedJobForRankingId !== 'all' ? (
                  <>
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">Ranked Talent</span>
                        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <Target className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {rankedCandidates.length}
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">
                        {rankingScope === 'applicants' ? 'Inbound applicants' : 'Evaluated candidates'}
                      </p>
                    </div>

                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">High Match (80%+)</span>
                        <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-[#14131F] flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {rankedCandidates.filter((c) => (c.matchPercentage ?? 0) >= 80).length}
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">Ready for immediate interview</p>
                    </div>

                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">Good Match (65-79%)</span>
                        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <Award className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {rankedCandidates.filter((c) => {
                          const m = c.matchPercentage ?? 0;
                          return m >= 65 && m < 80;
                        }).length}
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">Strong core skill fit</p>
                    </div>

                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">Avg Match Score</span>
                        <div className="w-8 h-8 rounded-xl bg-[#FB7185]/15 text-[#E11D48] flex items-center justify-center">
                          <Briefcase className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {rankedCandidates.length > 0
                          ? Math.round(
                              rankedCandidates.reduce((sum, c) => sum + (c.matchPercentage ?? 0), 0) /
                                rankedCandidates.length
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">Across all calibrated profiles</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">Vetted Pool Size</span>
                        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {candidates.length}
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">Across verified universities</p>
                    </div>

                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">High Readiness (75%+)</span>
                        <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-[#14131F] flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {candidates.filter((c) => (c.readinessScore ?? c.overallScore ?? 0) >= 75).length}
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">Ready for direct technical interview</p>
                    </div>

                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">Avg ATS Relevance</span>
                        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {candidates.length > 0
                          ? Math.round(
                              candidates.reduce((sum, c) => sum + (c.atsMatch ?? 0), 0) / candidates.length
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">Resume keyword alignment</p>
                    </div>

                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">Interview Invites Sent</span>
                        <div className="w-8 h-8 rounded-xl bg-[#FB7185]/15 text-[#E11D48] flex items-center justify-center">
                          <Send className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] mt-2">
                        {Object.keys(invitedCandidateMap).length}
                      </p>
                      <p className="text-[11px] text-[#14131F]/60 mt-1">Logged to student applications</p>
                    </div>
                  </>
                )}
              </div>

              {/* Search & Filtering Toolbar */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={talentSearchQuery}
                      onChange={(e) => setTalentSearchQuery(e.target.value)}
                      placeholder="Search candidates by name, university, target role, or technical skill..."
                      className="w-full pl-9 pr-8 py-2 bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl text-xs text-[#14131F] placeholder:text-[#14131F]/40 outline-none focus:border-[#4338CA] transition-colors"
                    />
                    {talentSearchQuery && (
                      <button
                        onClick={() => setTalentSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-[#14131F]/60 font-medium flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#4338CA]" />
                      Sort By:
                    </label>
                    <select
                      value={talentSortBy}
                      onChange={(e) => setTalentSortBy(e.target.value as any)}
                      className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs font-medium text-[#14131F] outline-none focus:border-[#4338CA] transition-colors cursor-pointer"
                    >
                      {selectedJobForRankingId && selectedJobForRankingId !== 'all' && (
                        <option value="match">Requisition Skill Match (High → Low)</option>
                      )}
                      <option value="readiness">Readiness Score (High → Low)</option>
                      <option value="ats">ATS Match % (High → Low)</option>
                      <option value="dsa">DSA Problems Solved (Most → Least)</option>
                    </select>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#14131F]/6 text-xs">
                  <span className="text-[11px] font-semibold text-[#14131F]/50 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filters:
                  </span>
                  {(() => {
                    const isRanking = Boolean(selectedJobForRankingId && selectedJobForRankingId !== 'all');
                    const basePool = isRanking ? rankedCandidates : candidates;
                    const highCount = basePool.filter((c) => {
                      const val = isRanking ? (c.matchPercentage ?? 0) : (c.readinessScore ?? c.overallScore ?? 0);
                      return val >= 75;
                    }).length;
                    const modCount = basePool.filter((c) => {
                      const val = isRanking ? (c.matchPercentage ?? 0) : (c.readinessScore ?? c.overallScore ?? 0);
                      return val >= 50 && val < 75;
                    }).length;
                    const invitedCount = basePool.filter((c) => !!invitedCandidateMap[c.id || c._id || '']).length;

                    const filterList = [
                      { id: 'all' as const, label: isRanking ? 'All Ranked' : 'All Candidates', count: basePool.length },
                      {
                        id: 'high' as const,
                        label: isRanking ? 'High Fit (75%+)' : 'Strong Match (75%+)',
                        count: highCount,
                      },
                      {
                        id: 'moderate' as const,
                        label: isRanking ? 'Moderate Fit (50-74%)' : 'Calibrated (50-74%)',
                        count: modCount,
                      },
                      {
                        id: 'invited' as const,
                        label: 'Invited by You',
                        count: invitedCount,
                      },
                    ];

                    return filterList.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setTalentScoreFilter(filter.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                          talentScoreFilter === filter.id
                            ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                            : 'bg-[#FAFAF8] text-[#14131F]/70 hover:text-[#14131F] hover:bg-black/5 border border-[#14131F]/8'
                        }`}
                      >
                        <span>{filter.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            talentScoreFilter === filter.id
                              ? 'bg-white/20 text-white'
                              : 'bg-[#14131F]/5 text-[#14131F]/60'
                          }`}
                        >
                          {filter.count}
                        </span>
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* Candidates Ledger / Empty States */}
              {loading ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                  <p className="text-xs text-[#14131F]/60">
                    Loading verified talent pool candidates...
                  </p>
                </div>
              ) : candidates.length === 0 ? (
                /* Empty state from API */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-lg font-bold font-display text-[#14131F]">
                      No candidates match your open job postings yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                      The talent pool matches students across colleges against your active job requisitions and readiness cutoffs. Post an opportunity to begin matching calibrated candidates.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setActiveTab('jobs');
                      setIsCreateJobModalOpen(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                    className="text-xs font-semibold"
                  >
                    Post an Opportunity
                  </Button>
                </div>
              ) : filteredCandidates.length === 0 ? (
                /* Filtered empty state */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-8 sm:p-10 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold font-display text-[#14131F]">
                    No candidates match your search filters
                  </h3>
                  <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                    Try adjusting your search keywords or switching back to "All Candidates".
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setTalentSearchQuery('');
                      setTalentScoreFilter('all');
                    }}
                    className="text-xs"
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <LedgerContainer
                  header={
                    <div className="flex items-center justify-between text-xs text-[#14131F]/60">
                      <span>Showing {filteredCandidates.length} calibrated candidate profiles</span>
                      <span>Click any candidate to inspect assessment & invite</span>
                    </div>
                  }
                >
                  {filteredCandidates.map((candidate, idx) => {
                    const cId = candidate.id || candidate._id || String(idx);
                    const score = candidate.readinessScore ?? candidate.overallScore ?? 0;
                    const scoreStyle = getReadinessScoreStyle(score);
                    const isRankingMode = Boolean(
                      selectedJobForRankingId && selectedJobForRankingId !== 'all'
                    );
                    const matchStyle = getSkillMatchStyle(candidate.matchPercentage);
                    const isInvited = !!invitedCandidateMap[cId];
                    const invitedData = invitedCandidateMap[cId];

                    return (
                      <ListRow
                        key={cId}
                        isLast={idx === filteredCandidates.length - 1}
                        onClick={() => openCandidateProfile(cId)}
                        leading={
                          isRankingMode && candidate.matchPercentage !== null && candidate.matchPercentage !== undefined ? (
                            <div
                              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${matchStyle.bg} ${matchStyle.border} shrink-0 transition-transform group-hover:scale-105`}
                              title={`PlacementOS unified skill match: ${candidate.matchPercentage}%`}
                            >
                              <span className={`text-base font-bold font-display ${matchStyle.text} leading-none`}>
                                {candidate.matchPercentage}%
                              </span>
                              <span className="text-[9px] font-medium text-[#14131F]/60 mt-1 leading-none">
                                Fit Score
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${scoreStyle.bg} ${scoreStyle.border} shrink-0 transition-transform group-hover:scale-105`}
                              title={`Readiness score: ${score}%`}
                            >
                              <span className={`text-base font-bold font-display ${scoreStyle.text} leading-none`}>
                                {score}%
                              </span>
                              <span className="text-[9px] font-medium text-[#14131F]/60 mt-1 leading-none">
                                Readiness
                              </span>
                            </div>
                          )
                        }
                        title={
                          <span className="flex items-center gap-2 flex-wrap">
                            <span>{candidate.name}</span>
                            {candidate.hasApplied && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-[#4338CA]" />
                                Inbound Applicant{candidate.applicationStatus ? ` (${candidate.applicationStatus})` : ''}
                              </span>
                            )}
                            {candidate.applicationStatus === 'Shortlisted' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 text-emerald-700" />
                                Shortlisted
                              </span>
                            )}
                            {isInvited && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-[#A3E635]/30 border border-[#A3E635]/60 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 text-emerald-700" />
                                Invited: {invitedData.jobTitle}
                              </span>
                            )}
                          </span>
                        }
                        subtitle={
                          <div className="space-y-1.5 mt-1">
                            <div className="flex items-center gap-2 flex-wrap text-xs text-[#14131F]/70">
                              <span className="font-medium text-[#14131F]">
                                {candidate.role || 'Engineering Candidate'}
                              </span>
                              {candidate.college && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-[#14131F]/65 truncate">
                                    <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#4338CA]" />
                                    {candidate.college}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Ranking Mode: Strengths & Gaps breakdown */}
                            {isRankingMode &&
                            ((candidate.strengths && candidate.strengths.length > 0) ||
                              (candidate.gaps && candidate.gaps.length > 0) ||
                              (candidate.needsImprovement && candidate.needsImprovement.length > 0) ||
                              (candidate.notAssessed && candidate.notAssessed.length > 0)) ? (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
                                {candidate.strengths?.slice(0, 3).map((skill, sIdx) => (
                                  <span
                                    key={`s-${sIdx}`}
                                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1"
                                    title="Verified Strength"
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    {skill}
                                  </span>
                                ))}
                                {candidate.needsImprovement?.slice(0, 2).map((skill, nIdx) => (
                                  <span
                                    key={`n-${nIdx}`}
                                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                                    title="Improving Benchmark"
                                  >
                                    {skill} (Improving)
                                  </span>
                                ))}
                                {candidate.gaps?.slice(0, 2).map((skill, gIdx) => (
                                  <span
                                    key={`g-${gIdx}`}
                                    className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium"
                                    title="Skill Gap"
                                  >
                                    {skill} (Gap)
                                  </span>
                                ))}
                                {candidate.notAssessed?.slice(0, 2).map((skill, naIdx) => (
                                  <span
                                    key={`na-${naIdx}`}
                                    className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 font-medium"
                                    title="Not Assessed"
                                  >
                                    {skill} (Not Assessed)
                                  </span>
                                ))}
                              </div>
                            ) : candidate.skills && candidate.skills.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {candidate.skills.slice(0, 5).map((skill, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FAFAF8] text-[#14131F]/80 border border-[#14131F]/10"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {candidate.skills.length > 5 && (
                                  <span className="text-[10px] text-[#14131F]/40 font-medium">
                                    +{candidate.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            ) : null}

                            {isRankingMode && candidate.explanation && (
                              <p className="text-[11px] text-[#14131F]/60 italic line-clamp-1 pt-0.5">
                                {candidate.explanation}
                              </p>
                            )}
                          </div>
                        }
                        badge={
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              isRankingMode && candidate.matchPercentage !== null && candidate.matchPercentage !== undefined
                                ? `${matchStyle.badgeBg} ${matchStyle.badgeText}`
                                : `${scoreStyle.badgeBg} ${scoreStyle.badgeText}`
                            }`}
                          >
                            {isRankingMode && candidate.matchCategory
                              ? candidate.matchCategory
                              : scoreStyle.label}
                          </span>
                        }
                        metadata={
                          <div className="flex items-center gap-3 sm:gap-4 text-xs">
                            {isRankingMode && candidate.matchPercentage !== null && candidate.matchPercentage !== undefined && (
                              <div
                                className="flex items-center gap-1 text-[#14131F]/75"
                                title="PlacementOS Fit Score"
                              >
                                <Target className="w-3.5 h-3.5 text-[#4338CA]" />
                                <span>
                                  Fit{' '}
                                  <strong className="font-semibold text-[#14131F]">
                                    {candidate.matchPercentage}%
                                  </strong>
                                </span>
                              </div>
                            )}
                            <div
                              className="flex items-center gap-1 text-[#14131F]/75"
                              title="ATS Resume Parity"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#4338CA]" />
                              <span>
                                ATS{' '}
                                <strong className="font-semibold text-[#14131F]">
                                  {candidate.atsMatch ?? 0}%
                                </strong>
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1 text-[#14131F]/75"
                              title="DSA Problems Solved"
                            >
                              <Code className="w-3.5 h-3.5 text-[#4338CA]" />
                              <span>
                                <strong className="font-semibold text-[#14131F]">
                                  {candidate.dsaSolved ?? 0}
                                </strong>{' '}
                                Solved
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1 text-[#14131F]/75"
                              title="Badges & Milestones"
                            >
                              <Award className="w-3.5 h-3.5 text-[#4338CA]" />
                              <span>
                                <strong className="font-semibold text-[#14131F]">
                                  {candidate.badgeCount ?? 0}
                                </strong>{' '}
                                Badges
                              </span>
                            </div>
                          </div>
                        }
                        action={
                          <div className="flex items-center gap-2 shrink-0">
                            {candidate.hasApplied && candidate.applicationId && candidate.applicationStatus !== 'Shortlisted' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleUpdateStatus(candidate.applicationId!, 'Shortlisted');
                                }}
                                disabled={updatingAppId === candidate.applicationId}
                                className="text-xs font-semibold shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                              >
                                {updatingAppId === candidate.applicationId ? 'Updating...' : 'Shortlist'}
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCandidateProfile(cId);
                              }}
                              icon={
                                isInvited ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )
                              }
                              className="text-xs font-medium shrink-0"
                            >
                              {isInvited ? 'View Invited Profile' : 'Inspect & Invite'}
                            </Button>
                          </div>
                        }
                      />
                    );
                  })}
                </LedgerContainer>
              )}
            </div>
          ) : activeTab === 'applications' ? (
            /* REAL APPLICATIONS PIPELINE MODULE */
            <div className="space-y-6">
              {/* Header & Pipeline Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Recruitment Applications Pipeline"
                  subtitle="Review campus applicants, evaluate readiness benchmarks, and advance qualified talent across interview and offer stages."
                  badge={`${filteredApplications.length} Applicants`}
                />
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadApplications(true)}
                    disabled={applicationsLoading}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          applicationsLoading ? 'animate-spin text-[#4338CA]' : ''
                        }`}
                      />
                    }
                    className="text-xs font-semibold"
                  >
                    Refresh Board
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateJobModal}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Post Requisition
                  </Button>
                </div>
              </div>

              {/* Status Update Feedback Banners */}
              {appStatusUpdateSuccess && (
                <div className="p-3.5 bg-[#A3E635]/20 border border-[#A3E635]/60 rounded-xl text-xs text-[#14131F] flex items-center justify-between gap-2 transition-all">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{appStatusUpdateSuccess}</span>
                  </div>
                  <button
                    onClick={() => setAppStatusUpdateSuccess(null)}
                    className="text-[#14131F]/50 hover:text-[#14131F] p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {appStatusUpdateError && (
                <div className="p-3.5 bg-[#FB7185]/15 border border-[#FB7185]/40 rounded-xl text-xs text-[#14131F] flex items-center justify-between gap-2 transition-all">
                  <div className="flex items-center gap-2 font-medium text-[#E11D48]">
                    <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span>{appStatusUpdateError}</span>
                  </div>
                  <button
                    onClick={() => setAppStatusUpdateError(null)}
                    className="text-[#14131F]/50 hover:text-[#14131F] p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {applicationsError && (
                <div className="p-4 bg-[#FB7185]/15 border border-[#FB7185]/40 rounded-xl text-xs text-[#14131F] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-[#E11D48] font-medium">
                    <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span>{applicationsError}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadApplications(true)}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Pipeline Metric KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Total Applicants
                  </span>
                  <div className="text-xl font-bold font-display text-[#14131F]">
                    {applications.length}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Across all job requisitions
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Screening & Vetting
                  </span>
                  <div className="text-xl font-bold font-display text-[#4338CA]">
                    {applicationsByStage.Applied.length + applicationsByStage.Screening.length}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    {applicationsByStage.Applied.length} applied • {applicationsByStage.Screening.length} screening
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Interview Rounds
                  </span>
                  <div className="text-xl font-bold font-display text-[#4338CA]">
                    {applicationsByStage.Shortlisted.length + applicationsByStage.Interview.length}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    {applicationsByStage.Shortlisted.length} shortlisted • {applicationsByStage.Interview.length} interviewing
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Offers Extended
                  </span>
                  <div className="text-xl font-bold font-display text-emerald-800">
                    {applicationsByStage.Offer.length}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Hiring target conversion
                  </span>
                </div>
              </div>

              {/* Filtering & Search Toolbar */}
              <div className="bg-white border border-[#14131F]/8 rounded-xl p-3 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Job Posting Selector */}
                  <div className="flex items-center gap-2 min-w-[240px]">
                    <span className="text-xs font-medium text-[#14131F]/70 shrink-0">
                      Requisition:
                    </span>
                    <select
                      value={appJobFilter}
                      onChange={(e) => setAppJobFilter(e.target.value)}
                      className="w-full text-xs font-medium bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-2.5 py-1.5 text-[#14131F] outline-none focus:border-[#4338CA] cursor-pointer"
                    >
                      <option value="all">
                        All Job Postings ({applications.length})
                      </option>
                      {jobs.map((j) => {
                        const jId = j._id || j.id || '';
                        return (
                          <option key={jId} value={jId}>
                            {j.title} ({j.type || 'Job'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Search by Candidate Name / College / Role */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#14131F]/40" />
                    <input
                      type="text"
                      placeholder="Search by student name, college, or role..."
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg pl-8 pr-8 py-1.5 text-[#14131F] placeholder:text-[#14131F]/40 outline-none focus:border-[#4338CA]"
                    />
                    {appSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAppSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Reset Filters if active */}
                  {(appJobFilter !== 'all' || appSearchQuery.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppJobFilter('all');
                        setAppSearchQuery('');
                      }}
                      className="text-xs font-semibold text-[#4338CA] hover:underline self-center shrink-0 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content: Pipeline Kanban vs. Empty State */}
              {applicationsLoading && applications.length === 0 ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#4338CA] mx-auto" />
                  <p className="text-xs text-[#14131F]/60">Loading candidate application pipeline...</p>
                </div>
              ) : applications.length === 0 ? (
                /* Empty state when no applications have arrived yet */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto space-y-4 my-6 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center mx-auto">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-lg text-[#14131F]">
                      No Applications Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                      Applications will appear here once candidates apply to your postings.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab('jobs')}
                      icon={<Briefcase className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                    >
                      View Active Postings
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateJobModal}
                      icon={<Plus className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                    >
                      Post New Requisition
                    </Button>
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                /* Empty state when filter produces no results */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 text-center max-w-md mx-auto space-y-3 my-6">
                  <Filter className="w-7 h-7 text-[#14131F]/40 mx-auto" />
                  <h4 className="font-display font-bold text-sm text-[#14131F]">
                    No Matching Applicants
                  </h4>
                  <p className="text-xs text-[#14131F]/60">
                    No candidates match the selected requisition or search criteria.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAppJobFilter('all');
                      setAppSearchQuery('');
                    }}
                    className="text-xs font-medium"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                /* Kanban Pipeline Board */
                <div className="space-y-6">
                  <div className="overflow-x-auto pb-4 -mx-1 px-1">
                    <div className="flex gap-4 min-w-[1280px]">
                      {MAIN_STAGES.map((stage) => {
                        const stageApps = applicationsByStage[stage.key] || [];

                        return (
                          <div
                            key={stage.key}
                            className="flex-1 min-w-[245px] max-w-[290px] flex flex-col bg-[#FAFAF8] border border-[#14131F]/10 rounded-2xl p-3.5 space-y-3"
                          >
                            {/* Stage Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-[#14131F]/8">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${stage.indicatorColor}`} />
                                <h3 className="font-display font-bold text-xs sm:text-sm text-[#14131F]">
                                  {stage.label}
                                </h3>
                              </div>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stage.badgeBg} ${stage.badgeText}`}
                              >
                                {stageApps.length}
                              </span>
                            </div>

                            {/* Column Description */}
                            <p className="text-[10px] text-[#14131F]/50 -mt-1 truncate">
                              {stage.description}
                            </p>

                            {/* Candidate Cards List */}
                            <div className="space-y-2.5 flex-1 min-h-[140px]">
                              {stageApps.length === 0 ? (
                                <div className="h-28 flex flex-col items-center justify-center border border-dashed border-[#14131F]/12 rounded-xl text-center p-3">
                                  <span className="text-[11px] text-[#14131F]/45">
                                    No candidates in {stage.label}
                                  </span>
                                </div>
                              ) : (
                                stageApps.map((app) => {
                                  const appId = app.id || app._id || '';
                                  const score =
                                    typeof app.readinessScore === 'number'
                                      ? app.readinessScore
                                      : app.student?.readinessScore ?? 75;
                                  const scoreStyle = getReadinessScoreStyle(score);
                                  const isUpdating = updatingAppId === appId;
                                  const nextStage = NEXT_STAGE_MAP[stage.key];

                                  return (
                                    <div
                                      key={appId}
                                      className="bg-white border border-[#14131F]/8 hover:border-[#4338CA]/35 rounded-xl p-3.5 space-y-2.5 shadow-2xs transition-colors"
                                    >
                                      {/* Student Header */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 min-w-0">
                                          <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-display font-bold text-xs shrink-0 mt-0.5">
                                            {(
                                              app.studentName ||
                                              app.student?.name ||
                                              'A'
                                            )
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <h4 className="font-display font-bold text-xs text-[#14131F] truncate leading-tight">
                                              {app.studentName || app.student?.name || 'Applicant'}
                                            </h4>
                                            <p className="text-[11px] text-[#14131F]/60 truncate flex items-center gap-1 mt-0.5">
                                              <GraduationCap className="w-3 h-3 text-[#4338CA] shrink-0" />
                                              <span className="truncate">
                                                {app.studentCollege ||
                                                  app.student?.college ||
                                                  'Engineering College'}
                                              </span>
                                            </p>
                                          </div>
                                        </div>

                                        {/* Readiness Score Pill */}
                                        <span
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${scoreStyle.badgeBg} ${scoreStyle.badgeText}`}
                                          title={`Readiness calibrated score: ${score}%`}
                                        >
                                          {score}%
                                        </span>
                                      </div>

                                      {/* Role & Date Meta */}
                                      <div className="pt-2 border-t border-[#14131F]/6 text-[11px] text-[#14131F]/70 flex items-center justify-between gap-2">
                                        <span className="font-medium text-[#14131F] truncate flex items-center gap-1">
                                          <Briefcase className="w-3 h-3 text-[#14131F]/40 shrink-0" />
                                          <span className="truncate">{app.role}</span>
                                        </span>
                                        {app.appliedAt && (
                                          <span className="text-[10px] text-[#14131F]/45 shrink-0 flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {app.appliedAt}
                                          </span>
                                        )}
                                      </div>

                                      {/* Offer Stage: Completion Tracking Status Badge & Expand Trigger */}
                                      {stage.key === 'Offer' && (
                                        <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[10px] text-[#14131F]/50 font-medium truncate">
                                              Progress:
                                            </span>
                                            {(() => {
                                              const statusVal = app.completionStatus || 'Not Started';
                                              switch (statusVal) {
                                                case 'Completed':
                                                  return (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#A3E635]/20 text-[#14131F] border border-[#A3E635]/50 shrink-0">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-[#65A30D]" />
                                                      Completed
                                                    </span>
                                                  );
                                                case 'In Progress':
                                                  return (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/25 shrink-0">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                                                      In Progress
                                                    </span>
                                                  );
                                                case 'Discontinued':
                                                  return (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FB7185]/15 text-[#14131F] border border-[#FB7185]/40 shrink-0">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
                                                      Discontinued
                                                    </span>
                                                  );
                                                default:
                                                  return (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#14131F]/5 text-[#14131F]/70 border border-[#14131F]/10 shrink-0">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-[#14131F]/30" />
                                                      Not Started
                                                    </span>
                                                  );
                                              }
                                            })()}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const isExpanded = expandedOfferAppId === appId;
                                              if (!isExpanded && !offerTrackingForms[appId]) {
                                                setOfferTrackingForms((prev) => ({
                                                  ...prev,
                                                  [appId]: {
                                                    completionStatus: app.completionStatus || 'Not Started',
                                                    rating: app.mentorFeedback?.rating || 5,
                                                    comments: app.mentorFeedback?.comments || '',
                                                  },
                                                }));
                                              }
                                              setExpandedOfferAppId(isExpanded ? null : appId);
                                            }}
                                            className="text-[10px] font-semibold text-[#4338CA] hover:text-[#3730A3] flex items-center gap-0.5 shrink-0 cursor-pointer"
                                          >
                                            <span>{expandedOfferAppId === appId ? 'Hide' : 'Track'}</span>
                                            {expandedOfferAppId === appId ? (
                                              <ChevronUp className="w-3 h-3" />
                                            ) : (
                                              <ChevronDown className="w-3 h-3" />
                                            )}
                                          </button>
                                        </div>
                                      )}

                                      {/* Offer Stage: Expanded Completion Tracking & Mentor Feedback Form */}
                                      {stage.key === 'Offer' && expandedOfferAppId === appId && (
                                        <div className="pt-2.5 pb-1 border-t border-[#14131F]/8 space-y-2.5 font-sans">
                                          {/* Segmented Control for Completion Status */}
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-[#14131F] block">
                                              Completion Status
                                            </label>
                                            <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#FAFAF8] rounded-lg border border-[#14131F]/10">
                                              {(['Not Started', 'In Progress', 'Completed', 'Discontinued'] as const).map((statusOption) => {
                                                const currentSelected =
                                                  offerTrackingForms[appId]?.completionStatus || app.completionStatus || 'Not Started';
                                                const isSelected = currentSelected === statusOption;
                                                return (
                                                  <button
                                                    key={statusOption}
                                                    type="button"
                                                    onClick={() =>
                                                      setOfferTrackingForms((prev) => ({
                                                        ...prev,
                                                        [appId]: {
                                                          ...(prev[appId] || {
                                                            completionStatus: app.completionStatus || 'Not Started',
                                                            rating: app.mentorFeedback?.rating || 5,
                                                            comments: app.mentorFeedback?.comments || '',
                                                          }),
                                                          completionStatus: statusOption,
                                                        },
                                                      }))
                                                    }
                                                    className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer text-center truncate ${
                                                      isSelected
                                                        ? 'bg-white text-[#14131F] shadow-2xs border border-[#14131F]/10'
                                                        : 'text-[#14131F]/60 hover:text-[#14131F]'
                                                    }`}
                                                  >
                                                    {statusOption}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {/* 1-5 Star Rating Input */}
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                              <label className="text-[10px] font-semibold text-[#14131F]">
                                                Mentor Rating
                                              </label>
                                              <span className="text-[10px] font-semibold text-[#4338CA]">
                                                {(offerTrackingForms[appId]?.rating ?? app.mentorFeedback?.rating ?? 5)} / 5
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between p-1.5 bg-[#FAFAF8] rounded-lg border border-[#14131F]/10">
                                              <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                  const currentRating =
                                                    offerTrackingForms[appId]?.rating ?? app.mentorFeedback?.rating ?? 5;
                                                  const isFilled = star <= currentRating;
                                                  return (
                                                    <button
                                                      key={star}
                                                      type="button"
                                                      onClick={() =>
                                                        setOfferTrackingForms((prev) => ({
                                                          ...prev,
                                                          [appId]: {
                                                            ...(prev[appId] || {
                                                              completionStatus: app.completionStatus || 'Not Started',
                                                              rating: 5,
                                                              comments: app.mentorFeedback?.comments || '',
                                                            }),
                                                            rating: star,
                                                          },
                                                        }))
                                                      }
                                                      className="p-0.5 rounded hover:scale-110 transition-transform cursor-pointer"
                                                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                                    >
                                                      <Star
                                                        className={`w-3.5 h-3.5 ${
                                                          isFilled
                                                            ? 'text-amber-500 fill-amber-500'
                                                            : 'text-[#14131F]/20'
                                                        }`}
                                                      />
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                              <span className="text-[9px] text-[#14131F]/50">
                                                {(offerTrackingForms[appId]?.rating ?? app.mentorFeedback?.rating ?? 5) >= 4
                                                  ? 'Commendable'
                                                  : (offerTrackingForms[appId]?.rating ?? app.mentorFeedback?.rating ?? 5) === 3
                                                  ? 'Satisfactory'
                                                  : 'Needs Support'}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Comments Textarea */}
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-[#14131F] block">
                                              Mentor Feedback
                                            </label>
                                            <textarea
                                              rows={2}
                                              value={
                                                offerTrackingForms[appId]?.comments ?? app.mentorFeedback?.comments ?? ''
                                              }
                                              onChange={(e) =>
                                                setOfferTrackingForms((prev) => ({
                                                  ...prev,
                                                  [appId]: {
                                                    ...(prev[appId] || {
                                                      completionStatus: app.completionStatus || 'Not Started',
                                                      rating: app.mentorFeedback?.rating || 5,
                                                      comments: '',
                                                    }),
                                                    comments: e.target.value,
                                                  },
                                                }))
                                              }
                                              placeholder="Evaluation remarks or milestone progress..."
                                              className="w-full text-[11px] bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg p-2 text-[#14131F] placeholder:text-[#14131F]/40 outline-none focus:border-[#4338CA] resize-none"
                                            />
                                          </div>

                                          {/* Error notice if saving fails */}
                                          {completionError[appId] && (
                                            <p className="text-[10px] text-[#E11D48] flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3 shrink-0" />
                                              <span>{completionError[appId]}</span>
                                            </p>
                                          )}

                                          {/* Submit Button calling PATCH */}
                                          <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                            <button
                                              type="button"
                                              onClick={() => setExpandedOfferAppId(null)}
                                              className="text-[10px] font-medium text-[#14131F]/60 hover:text-[#14131F] px-2 py-1 rounded cursor-pointer"
                                            >
                                              Close
                                            </button>
                                            <button
                                              type="button"
                                              disabled={savingCompletionAppId === appId}
                                              onClick={() => handleUpdateCompletion(appId)}
                                              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#4338CA] text-white hover:bg-[#3730A3] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                            >
                                              {savingCompletionAppId === appId ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <Check className="w-3 h-3" />
                                              )}
                                              <span>{savingCompletionAppId === appId ? 'Saving...' : 'Save Tracking'}</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Stage Transition Controls */}
                                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center gap-1.5">
                                        {/* Dropdown to change to ANY stage */}
                                        <div className="relative flex-1">
                                          <select
                                            value={normalizeStage(app.status)}
                                            disabled={isUpdating}
                                            onChange={(e) => handleUpdateStatus(appId, e.target.value)}
                                            className="w-full text-[11px] font-medium bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-2 py-1 text-[#14131F] outline-none focus:border-[#4338CA] cursor-pointer disabled:opacity-50"
                                            title="Move candidate to any pipeline stage"
                                          >
                                            <option value="Applied">Stage: Applied</option>
                                            <option value="Screening">Stage: Screening</option>
                                            <option value="Shortlisted">Stage: Shortlisted</option>
                                            <option value="Interview">Stage: Interview</option>
                                            <option value="Offer">Stage: Offer</option>
                                            <option value="Rejected">Status: Disqualify</option>
                                          </select>
                                        </div>

                                        {/* Quick One-Click Advance Button */}
                                        {nextStage && (
                                          <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() => handleUpdateStatus(appId, nextStage)}
                                            className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-[#4338CA]/10 text-[#4338CA] hover:bg-[#4338CA] hover:text-white transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                                            title={`Advance directly to ${nextStage}`}
                                          >
                                            {isUpdating ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <span>{nextStage} →</span>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Disqualified & Archived Section (Visually de-emphasized, Coral accent) */}
                  <div className="bg-white border border-[#FB7185]/30 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
                        <h3 className="font-display font-bold text-sm text-[#14131F]">
                          Disqualified & Archived Candidates
                        </h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FB7185]/15 text-[#E11D48] border border-[#FB7185]/30">
                          {applicationsByStage.Rejected.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowRejectedSection(!showRejectedSection)}
                        className="text-xs font-semibold text-[#14131F]/70 hover:text-[#14131F] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                      >
                        <span>
                          {showRejectedSection ? 'Hide Archived Candidates' : 'Inspect Disqualified'}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            showRejectedSection ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {showRejectedSection && (
                      <div className="pt-3 border-t border-[#FB7185]/20 space-y-3">
                        {applicationsByStage.Rejected.length === 0 ? (
                          <p className="text-xs text-[#14131F]/55 py-2">
                            No candidates have been disqualified from the active pipeline.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {applicationsByStage.Rejected.map((app) => {
                              const appId = app.id || app._id || '';
                              const score =
                                typeof app.readinessScore === 'number'
                                  ? app.readinessScore
                                  : app.student?.readinessScore ?? 65;
                              const isUpdating = updatingAppId === appId;

                              return (
                                <div
                                  key={appId}
                                  className="bg-[#FAFAF8] border border-[#FB7185]/20 rounded-xl p-3 space-y-2 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-display font-bold text-xs text-[#14131F]">
                                        {app.studentName || app.student?.name || 'Candidate'}
                                      </div>
                                      <div className="text-[11px] text-[#14131F]/60">
                                        {app.studentCollege ||
                                          app.student?.college ||
                                          'Engineering College'}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FB7185]/15 text-[#E11D48]">
                                      {score}%
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-[#14131F]/70 flex items-center justify-between gap-2">
                                    <span className="truncate">{app.role}</span>
                                    {app.appliedAt && (
                                      <span className="text-[10px] text-[#14131F]/45 shrink-0">
                                        {app.appliedAt}
                                      </span>
                                    )}
                                  </div>

                                  {/* Reconsider Action */}
                                  <div className="pt-2 border-t border-[#14131F]/8 flex items-center justify-between gap-2">
                                    <span className="text-[10px] text-[#14131F]/50">Status: Disqualified</span>
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateStatus(appId, 'Screening')}
                                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#4338CA]/10 text-[#4338CA] hover:bg-[#4338CA] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                                      title="Reopen candidate and move to screening"
                                    >
                                      {isUpdating ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        'Reconsider Candidate'
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'learning' ? (
            /* REAL LEARNING PROGRAMS & ACADEMIC COLLABORATION MODULE */
            <div className="space-y-6">
              {/* Segmented Sub-view Switcher Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-4">
                <div className="inline-flex items-center p-1 bg-[#14131F]/5 rounded-xl border border-[#14131F]/10">
                  <button
                    type="button"
                    onClick={() => setLearningSubView('programs')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      learningSubView === 'programs'
                        ? 'bg-white text-[#14131F] shadow-xs'
                        : 'text-[#14131F]/60 hover:text-[#14131F]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />
                    <span>Learning Programs</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        learningSubView === 'programs'
                          ? 'bg-[#4338CA]/10 text-[#4338CA]'
                          : 'bg-black/5 text-[#14131F]/60'
                      }`}
                    >
                      {learningPrograms.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearningSubView('academic')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      learningSubView === 'academic'
                        ? 'bg-white text-[#14131F] shadow-xs'
                        : 'text-[#14131F]/60 hover:text-[#14131F]'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[#4338CA]" />
                    <span>Academic Collaboration</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        learningSubView === 'academic'
                          ? 'bg-[#4338CA]/10 text-[#4338CA]'
                          : 'bg-black/5 text-[#14131F]/60'
                      }`}
                    >
                      {academicOpportunities.length}
                    </span>
                  </button>
                </div>
              </div>

              {learningSubView === 'programs' ? (
                /* EXISTING LEARNING PROGRAMS VIEW */
                <div className="space-y-6">
                  {/* Header & Module Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Campus Learning & Training Programs"
                  subtitle="Publish corporate certification tracks, technical workshops, and pre-skilling programs for university talent."
                  badge={`${filteredLearningPrograms.length} Programs`}
                />
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadLearningPrograms(true)}
                    disabled={learningLoading}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          learningLoading ? 'animate-spin text-[#4338CA]' : ''
                        }`}
                      />
                    }
                    className="text-xs font-semibold"
                  >
                    Refresh Programs
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateProgramModal}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Publish New Program
                  </Button>
                </div>
              </div>

              {/* Feedback Alerts */}
              {learningSuccessMessage && (
                <div className="p-3.5 bg-[#A3E635]/20 border border-[#A3E635]/60 rounded-xl text-xs text-[#14131F] flex items-center justify-between gap-2 transition-all">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{learningSuccessMessage}</span>
                  </div>
                  <button
                    onClick={() => setLearningSuccessMessage(null)}
                    className="text-[#14131F]/50 hover:text-[#14131F] p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {learningError && (
                <div className="p-4 bg-[#FB7185]/15 border border-[#FB7185]/40 rounded-xl text-xs text-[#14131F] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-[#E11D48] font-medium">
                    <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span>{learningError}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadLearningPrograms(true)}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Learning Programs Metric KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Published Tracks
                  </span>
                  <div className="text-xl font-bold font-display text-[#14131F]">
                    {learningPrograms.length}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Campus curricula & workshops
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Students Enrolled
                  </span>
                  <div className="text-xl font-bold font-display text-[#4338CA]">
                    {learningPrograms.reduce((acc, p) => acc + (p.enrolledCount || 0), 0)}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Across partner universities
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Digital & Hybrid Tracks
                  </span>
                  <div className="text-xl font-bold font-display text-[#4338CA]">
                    {learningPrograms.filter((p) => p.mode === 'Online' || p.mode === 'Hybrid').length}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Virtual campus access
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Certifications Offered
                  </span>
                  <div className="text-xl font-bold font-display text-emerald-800">
                    {learningPrograms.filter((p) => p.type === 'Certification').length}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Industry credential credentials
                  </span>
                </div>
              </div>

              {/* Filtering & Search Toolbar */}
              <div className="bg-white border border-[#14131F]/8 rounded-xl p-3 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Search by Program Title / Skills */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#14131F]/40" />
                    <input
                      type="text"
                      placeholder="Search tracks by title, skill, or curriculum..."
                      value={learningSearchQuery}
                      onChange={(e) => setLearningSearchQuery(e.target.value)}
                      className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg pl-8 pr-8 py-1.5 text-[#14131F] placeholder:text-[#14131F]/40 outline-none focus:border-[#4338CA]"
                    />
                    {learningSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLearningSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter by Program Type */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#14131F]/70 shrink-0">
                      Type:
                    </span>
                    <select
                      value={learningTypeFilter}
                      onChange={(e) => setLearningTypeFilter(e.target.value as any)}
                      className="text-xs font-medium bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-2.5 py-1.5 text-[#14131F] outline-none focus:border-[#4338CA] cursor-pointer"
                    >
                      <option value="all">All Track Types</option>
                      <option value="Certification">Certification</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Training Program">Training Program</option>
                      <option value="Mentorship">Mentorship</option>
                    </select>
                  </div>

                  {/* Filter by Delivery Mode */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#14131F]/70 shrink-0">
                      Mode:
                    </span>
                    <select
                      value={learningModeFilter}
                      onChange={(e) => setLearningModeFilter(e.target.value as any)}
                      className="text-xs font-medium bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-2.5 py-1.5 text-[#14131F] outline-none focus:border-[#4338CA] cursor-pointer"
                    >
                      <option value="all">All Delivery Modes</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  {(learningTypeFilter !== 'all' ||
                    learningModeFilter !== 'all' ||
                    learningSearchQuery.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLearningTypeFilter('all');
                        setLearningModeFilter('all');
                        setLearningSearchQuery('');
                      }}
                      className="text-xs font-semibold text-[#4338CA] hover:underline self-center shrink-0 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content: Programs List vs Empty State */}
              {learningLoading && learningPrograms.length === 0 ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#4338CA] mx-auto" />
                  <p className="text-xs text-[#14131F]/60">
                    Loading campus training tracks and learning programs...
                  </p>
                </div>
              ) : learningPrograms.length === 0 ? (
                /* Inviting empty state */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto space-y-4 my-6 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center mx-auto">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-lg text-[#14131F]">
                      No Learning Programs Published Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                      Sponsor certified campus curricula, run hands-on technical workshops, or offer structured mentorship tracks to build pre-placement talent pipelines directly with partner universities.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2.5">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateProgramModal}
                      icon={<Plus className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                    >
                      Publish Your First Program
                    </Button>
                  </div>
                </div>
              ) : filteredLearningPrograms.length === 0 ? (
                /* Empty state when filtering yields no match */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 text-center max-w-md mx-auto space-y-3 my-6">
                  <Filter className="w-7 h-7 text-[#14131F]/40 mx-auto" />
                  <h4 className="font-display font-bold text-sm text-[#14131F]">
                    No Matching Programs
                  </h4>
                  <p className="text-xs text-[#14131F]/60">
                    No programs match your selected type, mode, or search query.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setLearningTypeFilter('all');
                      setLearningModeFilter('all');
                      setLearningSearchQuery('');
                    }}
                    className="text-xs font-medium"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                /* Published Programs Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLearningPrograms.map((prog) => {
                    const progId = prog._id || prog.id || '';

                    // Badge styling based on program type
                    let typeBadgeStyle = 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20';
                    if (prog.type === 'Workshop') {
                      typeBadgeStyle = 'bg-[#A3E635]/25 text-emerald-900 border-[#A3E635]/60';
                    } else if (prog.type === 'Training Program') {
                      typeBadgeStyle = 'bg-[#4338CA]/20 text-[#4338CA] border-[#4338CA]/35';
                    } else if (prog.type === 'Mentorship') {
                      typeBadgeStyle = 'bg-[#FB7185]/15 text-[#E11D48] border-[#FB7185]/35';
                    }

                    return (
                      <div
                        key={progId}
                        className="bg-white border border-[#14131F]/8 hover:border-[#4338CA]/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs transition-colors"
                      >
                        <div className="space-y-3">
                          {/* Card Header: Type Badge, Mode & Delete Action */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${typeBadgeStyle}`}
                            >
                              {prog.type}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-[#14131F]/60 flex items-center gap-1 font-medium bg-[#FAFAF8] border border-[#14131F]/10 px-2 py-0.5 rounded-md">
                                {prog.mode === 'Online' ? (
                                  <Monitor className="w-3 h-3 text-[#4338CA]" />
                                ) : prog.mode === 'Offline' ? (
                                  <Building2 className="w-3 h-3 text-[#14131F]/50" />
                                ) : (
                                  <Layers className="w-3 h-3 text-[#4338CA]" />
                                )}
                                <span>{prog.mode || 'Online'}</span>
                              </span>

                              {/* Delete Action with Confirmation modal */}
                              <button
                                type="button"
                                onClick={() => {
                                  setProgramDeleteError(null);
                                  setProgramToDelete(prog);
                                }}
                                className="p-1 rounded-lg text-[#14131F]/40 hover:text-[#FB7185] hover:bg-[#FB7185]/10 transition-colors cursor-pointer"
                                title="Delete Program"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Title & Organization */}
                          <div className="space-y-1">
                            <h4 className="font-display font-bold text-sm sm:text-base text-[#14131F] leading-snug">
                              {prog.title}
                            </h4>
                            <p className="text-[11px] text-[#14131F]/60 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#4338CA]" />
                              <span>{prog.company || companyName}</span>
                            </p>
                          </div>

                          {/* Description */}
                          {prog.description && (
                            <p className="text-xs text-[#14131F]/65 leading-relaxed line-clamp-2">
                              {prog.description}
                            </p>
                          )}

                          {/* Skills Covered Tags */}
                          {prog.skillsCovered && prog.skillsCovered.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {prog.skillsCovered.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FAFAF8] border border-[#14131F]/10 text-[#14131F]/80"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Meta Footer: Duration, Capacity & Active Status */}
                        <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between gap-2 text-[11px] text-[#14131F]/70">
                          <div className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1" title="Program Duration">
                              <Clock className="w-3 h-3 text-[#14131F]/40" />
                              <span>{prog.duration || '4 Weeks'}</span>
                            </span>
                            <span>•</span>
                            <span
                              className="flex items-center gap-1"
                              title="Enrolled count / maximum capacity"
                            >
                              <Users className="w-3 h-3 text-[#14131F]/40" />
                              <span>
                                {prog.enrolledCount || 0}{' '}
                                {prog.capacity ? `/ ${prog.capacity} cap` : 'enrolled'}
                              </span>
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-[#A3E635]/25 border border-[#A3E635]/60 px-2 py-0.5 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{prog.status || 'Active'}</span>
                          </span>
                        </div>

                        {/* Applicants Review Action */}
                        <div className="pt-2.5 border-t border-[#14131F]/6 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openProgramApplicantsModal(prog)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#FAFAF8] hover:bg-[#4338CA]/10 text-[#4338CA] border border-[#14131F]/10 hover:border-[#4338CA]/30 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              View Applicants {prog.applicantCount != null ? `(${prog.applicantCount})` : ''}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ACADEMIC & FACULTY COLLABORATION SUB-VIEW */
            <div className="space-y-6 text-left">
              {/* Header & Module Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Academic & Faculty Collaboration"
                  subtitle="Publish faculty sabbaticals, industrial immersion, FDPs, corporate consultancy, and joint research projects for university academicians."
                  badge={`${filteredAcademicOpportunities.length} Opportunities`}
                />
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadAcademicOpportunities(true)}
                    disabled={academicLoading}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          academicLoading ? 'animate-spin text-[#4338CA]' : ''
                        }`}
                      />
                    }
                    className="text-xs font-semibold"
                  >
                    Refresh Opportunities
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateAcademicModal}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Publish New Opportunity
                  </Button>
                </div>
              </div>

              {/* Feedback Alerts */}
              {academicSuccessMessage && (
                <div className="p-3.5 bg-[#A3E635]/20 border border-[#A3E635]/60 rounded-xl text-xs text-[#14131F] flex items-center justify-between gap-2 transition-all">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{academicSuccessMessage}</span>
                  </div>
                  <button
                    onClick={() => setAcademicSuccessMessage(null)}
                    className="text-[#14131F]/50 hover:text-[#14131F] p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {academicError && (
                <div className="p-4 bg-[#FB7185]/15 border border-[#FB7185]/40 rounded-xl text-xs text-[#14131F] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-[#E11D48] font-medium">
                    <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span>{academicError}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadAcademicOpportunities(true)}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Academic Opportunities KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Total Published
                  </span>
                  <div className="text-xl font-bold font-display text-[#14131F]">
                    {academicKpis.total}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Active faculty collaboration posts
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Faculty Immersion & Training
                  </span>
                  <div className="text-xl font-bold font-display text-[#4338CA]">
                    {academicKpis.facultyAndTraining}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Internships & industrial programs
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Research & Consultancy
                  </span>
                  <div className="text-xl font-bold font-display text-emerald-700">
                    {academicKpis.researchAndConsultancy}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Joint investigations & advisory
                  </span>
                </div>

                <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] font-medium text-[#14131F]/60">
                    Faculty Development (FDP)
                  </span>
                  <div className="text-xl font-bold font-display text-purple-700">
                    {academicKpis.fdps}
                  </div>
                  <span className="text-[10px] text-[#14131F]/50 block">
                    Sponsored teaching enhancements
                  </span>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#14131F]/40" />
                    <input
                      type="text"
                      placeholder="Search opportunities by title, domain, or expertise..."
                      value={academicSearchQuery}
                      onChange={(e) => setAcademicSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 bg-[#FAFAF8] border border-[#14131F]/10 rounded-lg outline-none focus:border-[#4338CA] transition-colors"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-[#14131F]/40" />
                    <select
                      value={academicTypeFilter}
                      onChange={(e) => setAcademicTypeFilter(e.target.value as any)}
                      aria-label="Filter opportunities by category"
                      className="text-xs bg-[#FAFAF8] border border-[#14131F]/10 rounded-lg px-2.5 py-2 outline-none focus:border-[#4338CA] text-[#14131F] font-medium cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="Faculty Internship">Faculty Internship</option>
                      <option value="Industrial Training">Industrial Training</option>
                      <option value="FDP">FDP</option>
                      <option value="Consultancy">Consultancy</option>
                      <option value="Research Collaboration">Research Collaboration</option>
                    </select>
                  </div>

                  {/* Mode Filter */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={academicModeFilter}
                      onChange={(e) => setAcademicModeFilter(e.target.value as any)}
                      aria-label="Filter opportunities by engagement mode"
                      className="text-xs bg-[#FAFAF8] border border-[#14131F]/10 rounded-lg px-2.5 py-2 outline-none focus:border-[#4338CA] text-[#14131F] font-medium cursor-pointer"
                    >
                      <option value="all">All Modes</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  {(academicTypeFilter !== 'all' ||
                    academicModeFilter !== 'all' ||
                    academicSearchQuery.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAcademicTypeFilter('all');
                        setAcademicModeFilter('all');
                        setAcademicSearchQuery('');
                      }}
                      className="text-xs font-semibold text-[#4338CA] hover:underline self-center shrink-0 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content: Opportunities List vs Empty State */}
              {academicLoading && academicOpportunities.length === 0 ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#4338CA] mx-auto" />
                  <p className="text-xs text-[#14131F]/60">
                    Loading academic collaboration opportunities...
                  </p>
                </div>
              ) : academicOpportunities.length === 0 ? (
                /* Empty state when no posts yet */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto space-y-4 my-6 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center mx-auto">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-lg text-[#14131F]">
                      No Academic Opportunities Published Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                      Connect with university faculty and academic departments for internships, industrial training, Faculty Development Programs (FDP), corporate consultancy, and joint research collaborations.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2.5">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateAcademicModal}
                      icon={<Plus className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                    >
                      Publish Your First Opportunity
                    </Button>
                  </div>
                </div>
              ) : filteredAcademicOpportunities.length === 0 ? (
                /* Empty state when filtering yields no match */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 text-center max-w-md mx-auto space-y-3 my-6">
                  <Filter className="w-7 h-7 text-[#14131F]/40 mx-auto" />
                  <h4 className="font-display font-bold text-sm text-[#14131F]">
                    No Matching Opportunities
                  </h4>
                  <p className="text-xs text-[#14131F]/60">
                    No opportunities match your selected category, engagement mode, or search query.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAcademicTypeFilter('all');
                      setAcademicModeFilter('all');
                      setAcademicSearchQuery('');
                    }}
                    className="text-xs font-medium"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                /* Published Opportunities Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAcademicOpportunities.map((opp) => {
                    const oppId = opp._id || opp.id || '';
                    const typeBadgeStyle =
                      opp.type === 'Faculty Internship'
                        ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                        : opp.type === 'Industrial Training'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : opp.type === 'FDP'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : opp.type === 'Consultancy'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                    return (
                      <div
                        key={oppId}
                        className="bg-white border border-[#14131F]/8 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#14131F]/20 transition-all shadow-2xs"
                      >
                        <div className="space-y-3">
                          {/* Top row: Type Badge + Delivery Mode */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${typeBadgeStyle}`}
                            >
                              {opp.type}
                            </span>
                            <span className="text-[11px] font-medium text-[#14131F]/60 px-2 py-0.5 rounded-md bg-[#14131F]/5 border border-[#14131F]/8">
                              {opp.mode || 'Online'}
                            </span>
                          </div>

                          {/* Title & Company */}
                          <div>
                            <h4 className="font-display font-bold text-sm text-[#14131F] leading-snug line-clamp-2">
                              {opp.title}
                            </h4>
                            <p className="text-[11px] text-[#14131F]/60 flex items-center gap-1.5 mt-1">
                              <Building2 className="w-3 h-3 text-[#14131F]/40" />
                              <span>{opp.company || companyName}</span>
                            </p>
                          </div>

                          {/* Description snippet */}
                          {opp.description && (
                            <p className="text-xs text-[#14131F]/70 line-clamp-2 leading-relaxed">
                              {opp.description}
                            </p>
                          )}

                          {/* Required Expertise tags */}
                          {opp.requiredExpertise && opp.requiredExpertise.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-semibold text-[#14131F]/50 block">
                                Required Domain Expertise
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {opp.requiredExpertise.slice(0, 4).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAFAF8] border border-[#14131F]/8 text-[#14131F]/80 font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {opp.requiredExpertise.length > 4 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md text-[#14131F]/50 font-medium">
                                    +{opp.requiredExpertise.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Metadata strip */}
                        <div className="pt-3 border-t border-[#14131F]/8 space-y-2 text-xs text-[#14131F]/70">
                          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                            <span className="flex items-center gap-1" title="Duration">
                              <Clock className="w-3 h-3 text-[#14131F]/40" />
                              <span>{opp.duration || '4 Weeks'}</span>
                            </span>
                            {opp.stipendOrHonorarium && (
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {opp.stipendOrHonorarium}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            {opp.deadline ? (
                              <span className="flex items-center gap-1 text-[#14131F]/60">
                                <Calendar className="w-3 h-3 text-[#14131F]/40" />
                                <span>
                                  Deadline: {new Date(opp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[#14131F]/40">Rolling deadline</span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-[#A3E635]/25 border border-[#A3E635]/60 px-2 py-0.5 rounded-full shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>{opp.status || 'Active'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
          ) : activeTab === 'analytics' ? (
            /* ANALYTICS TAB CONTENT */
            <div className="space-y-7 animate-in fade-in duration-150 text-left">
              {/* Top Header & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Recruitment & Pipeline Analytics"
                  subtitle="Funnel conversion rates, stage drop-offs, requisition breakdowns, and campus skill demand."
                  badge={`${analyticsMetrics.totalApps} Total Applications`}
                />
                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchData(true)}
                    disabled={isRefreshing}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                      />
                    }
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('applications')}
                    icon={<Users className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Manage Pipeline
                  </Button>
                </div>
              </div>

              {/* EMPTY STATE: Shown only when both jobs and applications are empty */}
              {jobs.length === 0 && applications.length === 0 ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5 my-6 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center mx-auto">
                    <LineChart className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-display text-[#14131F]">
                      No Recruitment Analytics Available Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed max-w-md mx-auto">
                      Analytics and conversion funnels will populate automatically once you publish your first campus opportunity and candidates apply to your postings.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCreateJobModalOpen(true)}
                      icon={<Plus className="w-4 h-4" />}
                      className="text-xs font-semibold"
                    >
                      Post Your First Opportunity
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* KPI ROW: 4 Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Conversion Rate (Prominently featured) */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#14131F]/70">
                          Offer Conversion Rate
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#A3E635]/25 text-emerald-900 border border-[#A3E635]/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Final Stage
                        </span>
                      </div>
                      <div className="my-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F] tracking-tight">
                            {analyticsMetrics.conversionRatePct}%
                          </span>
                        </div>
                        <p className="text-xs text-[#14131F]/60 mt-1">
                          {analyticsMetrics.offerCount} offers from {analyticsMetrics.totalApps} applicants
                        </p>
                      </div>
                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px] text-[#14131F]/60">
                        <span>Application to Offer</span>
                        <span className="font-medium text-[#14131F]">
                          {analyticsMetrics.totalApps > 0
                            ? `${analyticsMetrics.offerCount} / ${analyticsMetrics.totalApps}`
                            : '0 / 0'}
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Active Evaluation Pipeline */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#14131F]/70">
                          Active In-Flight Pipeline
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                          <Clock className="w-3 h-3 text-[#4338CA]" />
                          In Review
                        </span>
                      </div>
                      <div className="my-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F] tracking-tight">
                            {analyticsMetrics.activePipelineCount}
                          </span>
                          <span className="text-xs text-[#14131F]/50 font-normal">candidates</span>
                        </div>
                        <p className="text-xs text-[#14131F]/60 mt-1">
                          Across applied, screening, shortlist & interview
                        </p>
                      </div>
                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px] text-[#14131F]/60">
                        <span>Pipeline Share</span>
                        <span className="font-medium text-[#14131F]">
                          {analyticsMetrics.totalApps > 0
                            ? `${Math.round((analyticsMetrics.activePipelineCount / analyticsMetrics.totalApps) * 100)}% of total`
                            : '0%'}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Interview-to-Offer Conversion */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#14131F]/70">
                          Interview to Offer
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                          <Target className="w-3 h-3 text-[#4338CA]" />
                          Selectivity
                        </span>
                      </div>
                      <div className="my-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F] tracking-tight">
                            {analyticsMetrics.interviewToOfferPct}%
                          </span>
                        </div>
                        <p className="text-xs text-[#14131F]/60 mt-1">
                          Interviewed candidates selected for offer
                        </p>
                      </div>
                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px] text-[#14131F]/60">
                        <span>Interview Pool</span>
                        <span className="font-medium text-[#14131F]">
                          {analyticsMetrics.stageCounts.Interview + analyticsMetrics.stageCounts.Offer} interviewed
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Candidate Average Readiness */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#14131F]/70">
                          Applicant Readiness
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/10">
                          <Award className="w-3 h-3 text-[#4338CA]" />
                          Verified
                        </span>
                      </div>
                      <div className="my-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F] tracking-tight">
                            {analyticsMetrics.avgReadiness !== null
                              ? `${analyticsMetrics.avgReadiness}%`
                              : 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-[#14131F]/60 mt-1">
                          Average readiness index of applicants
                        </p>
                      </div>
                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px] text-[#14131F]/60">
                        <span>Total Requisitions</span>
                        <span className="font-medium text-[#14131F]">
                          {jobs.length} published jobs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PIPELINE FUNNEL (CSS BARS) */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#14131F]/8">
                      <div>
                        <h3 className="font-display font-bold text-lg text-[#14131F]">
                          Application Pipeline Conversion Funnel
                        </h3>
                        <p className="text-xs text-[#14131F]/60 mt-0.5">
                          Candidate progression through evaluation stages from initial submission to final offer
                        </p>
                      </div>
                      <span className="text-xs text-[#14131F]/60 font-medium">
                        {analyticsMetrics.totalApps} Total Inbound
                      </span>
                    </div>

                    {/* Funnel Stages Bars */}
                    <div className="space-y-4">
                      {analyticsMetrics.funnelStages.map((stage) => {
                        const pctOfTotal =
                          analyticsMetrics.totalApps > 0
                            ? Math.round((stage.count / analyticsMetrics.totalApps) * 100)
                            : 0;
                        const barWidth =
                          analyticsMetrics.totalApps > 0
                            ? Math.max(
                                stage.count > 0 ? 4 : 0,
                                Math.round((stage.count / analyticsMetrics.totalApps) * 100)
                              )
                            : 0;

                        return (
                          <div key={stage.key} className="space-y-2">
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[11px] text-[#14131F]/40 font-semibold shrink-0">
                                  {stage.stepNum}
                                </span>
                                <span className="font-semibold text-[#14131F] shrink-0">
                                  {stage.label}
                                </span>
                                <span className="hidden md:inline text-[#14131F]/50 truncate">
                                  • {stage.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-display font-semibold text-[#14131F]">
                                  {stage.count}
                                </span>
                                <span className="text-[11px] text-[#14131F]/60 w-12 text-right">
                                  {pctOfTotal}%
                                </span>
                              </div>
                            </div>

                            {/* Bar Track */}
                            <div className="w-full bg-[#FAFAF8] border border-[#14131F]/8 rounded-full h-3.5 overflow-hidden p-0.5 flex items-center">
                              <div
                                style={{ width: `${barWidth}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Disqualified / Rejected Row */}
                    <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FB7185]/15 text-[#E11D48] flex items-center justify-center shrink-0">
                          <UserX className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#14131F]">
                            Disqualified / Non-Progressed Candidates
                          </p>
                          <p className="text-[11px] text-[#14131F]/60">
                            Applicants who did not pass academic criteria or technical benchmarks
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="font-display font-bold text-sm text-[#E11D48]">
                            {analyticsMetrics.stageCounts.Rejected}
                          </span>
                          <span className="text-[11px] text-[#14131F]/60 ml-1.5">
                            (
                            {analyticsMetrics.totalApps > 0
                              ? (
                                  (analyticsMetrics.stageCounts.Rejected /
                                    analyticsMetrics.totalApps) *
                                  100
                                ).toFixed(1)
                              : '0.0'}
                            %)
                          </span>
                        </div>
                        {/* Mini bar */}
                        <div className="w-24 bg-white border border-[#14131F]/10 rounded-full h-2.5 overflow-hidden">
                          <div
                            style={{
                              width: `${
                                analyticsMetrics.totalApps > 0
                                  ? Math.max(
                                      analyticsMetrics.stageCounts.Rejected > 0 ? 6 : 0,
                                      Math.round(
                                        (analyticsMetrics.stageCounts.Rejected /
                                          analyticsMetrics.totalApps) *
                                          100
                                      )
                                    )
                                  : 0
                              }%`,
                            }}
                            className="bg-[#FB7185] h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TWO-COLUMN GRID: REQUISITION BREAKDOWN & SKILLS DEMAND */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Per-Job Pipeline Breakdown */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-[#14131F]/8">
                          <div>
                            <h3 className="font-display font-bold text-base text-[#14131F]">
                              Requisition Breakdown
                            </h3>
                            <p className="text-xs text-[#14131F]/60 mt-0.5">
                              Applicant volume and stage distribution per job posting
                            </p>
                          </div>
                          <span className="text-xs text-[#14131F]/60 font-medium">
                            {analyticsMetrics.jobBreakdowns.length} Requisitions
                          </span>
                        </div>

                        {analyticsMetrics.jobBreakdowns.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[#14131F]/60">
                            No active job requisitions found.
                          </div>
                        ) : (
                          <div className="divide-y divide-[#14131F]/6 mt-2">
                            {analyticsMetrics.jobBreakdowns.map((job) => (
                              <div key={job.id} className="py-3.5 space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-xs text-[#14131F] truncate">
                                        {job.title}
                                      </h4>
                                      <span
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                          job.type === 'Internship'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}
                                      >
                                        {job.type}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#14131F]/60 mt-0.5">
                                      {job.openPositions} open positions • {job.cutoffPct}% cutoff threshold
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-display font-bold text-xs text-[#14131F]">
                                      {job.totalApplicants}
                                    </span>
                                    <span className="text-[11px] text-[#14131F]/60 ml-1">
                                      applicants
                                    </span>
                                    <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                                      {job.conversionPct}% offer rate
                                    </p>
                                  </div>
                                </div>

                                {/* Mini Stage Distribution Pills */}
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                  <span className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]">
                                    App: {job.stageCounts.Applied}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-[#4338CA]/10 text-[#4338CA]">
                                    Screen: {job.stageCounts.Screening}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-[#4338CA]/15 text-[#4338CA]">
                                    Shortlist: {job.stageCounts.Shortlisted}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-[#4338CA]/20 text-[#4338CA]">
                                    Interview: {job.stageCounts.Interview}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-[#A3E635]/30 text-emerald-900 font-medium">
                                    Offer: {job.stageCounts.Offer}
                                  </span>
                                  {job.stageCounts.Rejected > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-[#FB7185]/20 text-[#E11D48]">
                                      Rej: {job.stageCounts.Rejected}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#14131F]/6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveTab('jobs')}
                          className="text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] inline-flex items-center gap-1 cursor-pointer"
                        >
                          View all job requisitions
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Column 2: Skills Demand Frequency */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-[#14131F]/8">
                          <div>
                            <h3 className="font-display font-bold text-base text-[#14131F]">
                              Campus Skill Demand
                            </h3>
                            <p className="text-xs text-[#14131F]/60 mt-0.5">
                              Ranked competencies requested across published postings
                            </p>
                          </div>
                          <span className="text-xs text-[#14131F]/60 font-medium">
                            {analyticsMetrics.rankedSkills.length} Unique Skills
                          </span>
                        </div>

                        {analyticsMetrics.rankedSkills.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[#14131F]/60">
                            No specific skills declared across current job requisitions.
                          </div>
                        ) : (
                          <div className="space-y-3.5 mt-4">
                            {analyticsMetrics.rankedSkills.slice(0, 7).map((item) => {
                              const barWidth = Math.max(
                                8,
                                Math.round((item.count / analyticsMetrics.maxSkillCount) * 100)
                              );
                              return (
                                <div key={item.skill} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[#14131F]">
                                      {item.skill}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-[#14131F]">
                                        {item.count} {item.count === 1 ? 'posting' : 'postings'}
                                      </span>
                                      <span className="text-[11px] text-[#14131F]/60">
                                        ({item.pct}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-[#FAFAF8] border border-[#14131F]/8 rounded-full h-2.5 overflow-hidden">
                                    <div
                                      style={{ width: `${barWidth}%` }}
                                      className="h-full rounded-full bg-[#4338CA] transition-all duration-300"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#14131F]/6 flex justify-between items-center text-[11px] text-[#14131F]/60">
                        <span>Frequency computed across {jobs.length} requisitions</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('talent')}
                          className="text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] inline-flex items-center gap-1 cursor-pointer"
                        >
                          Find candidates with these skills
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LEARNING PROGRAMS ENGAGEMENT */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#14131F]/8">
                      <div>
                        <h3 className="font-display font-bold text-base text-[#14131F]">
                          Learning Program Engagement
                        </h3>
                        <p className="text-xs text-[#14131F]/60 mt-0.5">
                          Enrolled students and cohort capacity utilization across your published tracks
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-[#4338CA]/10 text-[#4338CA] font-semibold">
                          {analyticsMetrics.totalEnrolled} Total Enrolled
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveTab('learning')}
                          className="text-xs"
                        >
                          Manage Tracks
                        </Button>
                      </div>
                    </div>

                    {analyticsMetrics.programEngagement.length === 0 ? (
                      <div className="p-8 text-center bg-[#FAFAF8] border border-[#14131F]/6 rounded-xl space-y-2">
                        <BookOpen className="w-6 h-6 text-[#14131F]/40 mx-auto" />
                        <p className="text-xs font-semibold text-[#14131F]">
                          No learning programs published yet
                        </p>
                        <p className="text-[11px] text-[#14131F]/60 max-w-sm mx-auto">
                          Publish certification tracks, workshops, or mentorship programs to engage university cohorts before placements.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analyticsMetrics.programEngagement.map((prog) => {
                          return (
                            <div
                              key={prog.id}
                              className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                                    {prog.type}
                                  </span>
                                  <span className="text-[10px] text-[#14131F]/60">
                                    {prog.mode}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-xs text-[#14131F] leading-snug line-clamp-1">
                                  {prog.title}
                                </h4>
                                <p className="text-[11px] text-[#14131F]/60">
                                  Duration: {prog.duration}
                                </p>
                              </div>

                              <div className="space-y-1.5 pt-2 border-t border-[#14131F]/6">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[11px] text-[#14131F]/70">
                                    Enrolled: {prog.enrolled}
                                  </span>
                                  <span className="text-[11px] font-medium text-[#14131F]">
                                    {prog.capacity ? `Cap: ${prog.capacity}` : 'Unlimited'}
                                  </span>
                                </div>
                                {prog.capacity ? (
                                  <div className="w-full bg-white border border-[#14131F]/10 rounded-full h-2 overflow-hidden">
                                    <div
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.round((prog.enrolled / prog.capacity) * 100)
                                        )}%`,
                                      }}
                                      className="h-full rounded-full bg-[#4338CA] transition-all duration-300"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-emerald-800 font-medium">
                                    Open Cohort Registration
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : activeTab === 'company_profile' ? (
            /* COMPANY PROFILE TAB CONTENT */
            <div className="space-y-7 animate-in fade-in duration-150 text-left">
              {/* Header with Edit Toggle Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Company & Organization Profile"
                  subtitle="Manage your corporate identity, recruiter contact credentials, and enterprise campus presence."
                  badge={user?.company ? user.company : 'Enterprise Profile'}
                />
                <div className="flex items-center gap-2.5 shrink-0">
                  {isEditingProfile ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelEditProfile}
                      disabled={profileSaving}
                      icon={<X className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setCompanyProfileSuccess(null);
                        setCompanyProfileError(null);
                      }}
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Alert Banners */}
              {companyProfileSuccess && (
                <div className="bg-[#A3E635]/15 border border-[#A3E635]/40 text-[#14131F] rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-medium">{companyProfileSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompanyProfileSuccess(null)}
                    className="text-[#14131F]/50 hover:text-[#14131F] cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {companyProfileError && (
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#E11D48] rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span className="font-medium">{companyProfileError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompanyProfileError(null)}
                    className="text-[#E11D48]/60 hover:text-[#E11D48] cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left/Main Column: Profile Display or Edit Form (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {isEditingProfile ? (
                    /* EDIT MODE FORM */
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                      <div className="pb-4 border-b border-[#14131F]/8 flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-lg text-[#14131F]">
                            Edit Organization Details
                          </h3>
                          <p className="text-xs text-[#14131F]/60 mt-0.5">
                            Update company information and campus liaison credentials
                          </p>
                        </div>
                        <span className="text-[11px] font-medium text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-1 rounded-full border border-[#4338CA]/20">
                          Editing Mode
                        </span>
                      </div>

                      <form onSubmit={handleSaveProfile} className="space-y-5">
                        {/* Company Name (Primary Identity) */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-[#14131F]">
                            Company / Organization Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={profileCompany}
                            onChange={(e) => setProfileCompany(e.target.value)}
                            placeholder="e.g. Razorpay, Google, Acme Technologies"
                            required
                            className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] focus:bg-white transition-all font-medium"
                          />
                          <p className="text-[11px] text-[#14131F]/50">
                            Displayed prominently on job postings, candidate invitations, and learning certificates.
                          </p>
                        </div>

                        {/* Designation & Department */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#14131F]">
                              Recruiter Designation / Title
                            </label>
                            <input
                              type="text"
                              value={profileDesignation}
                              onChange={(e) => setProfileDesignation(e.target.value)}
                              placeholder="e.g. Lead Campus Recruiter, VP Engineering"
                              className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] focus:bg-white transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#14131F]">
                              Department / Division
                            </label>
                            <input
                              type="text"
                              value={profileDepartment}
                              onChange={(e) => setProfileDepartment(e.target.value)}
                              placeholder="e.g. University Relations, Core Engineering"
                              className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        {/* Phone & LinkedIn URL */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#14131F]">
                              Official Phone Number
                            </label>
                            <input
                              type="tel"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              placeholder="e.g. +91 98765 43210"
                              className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] focus:bg-white transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#14131F]">
                              LinkedIn Profile / Company Page URL
                            </label>
                            <input
                              type="url"
                              value={profileLinkedin}
                              onChange={(e) => setProfileLinkedin(e.target.value)}
                              placeholder="e.g. https://linkedin.com/company/acme"
                              className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        {/* Corporate Bio / Campus Overview */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-[#14131F]">
                            Corporate Overview & Campus Hiring Mission
                          </label>
                          <textarea
                            value={profileBio}
                            onChange={(e) => setProfileBio(e.target.value)}
                            rows={4}
                            placeholder="Introduce your organization, core engineering culture, tech stack values, and what qualities you look for in campus cohorts..."
                            className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] focus:bg-white transition-all resize-none leading-relaxed"
                          />
                        </div>

                        {/* Non-editable system notice */}
                        <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl p-3.5 flex items-start gap-3 text-xs">
                          <ShieldCheck className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="font-semibold text-[#14131F]">
                              Verified Recruiter Account
                            </p>
                            <p className="text-[11px] text-[#14131F]/60">
                              Linked Email: <span className="font-medium text-[#14131F]">{user?.email}</span> (managed via authentication credentials).
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#14131F]/8">
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={handleCancelEditProfile}
                            disabled={profileSaving}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            disabled={profileSaving}
                            icon={
                              profileSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )
                            }
                            className="text-xs font-semibold"
                          >
                            {profileSaving ? 'Saving Changes...' : 'Save Profile'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="space-y-6">
                      {/* Hero Identity Card */}
                      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#14131F]/8">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center font-display font-bold text-2xl shrink-0">
                              {user?.company ? (
                                user.company.charAt(0).toUpperCase()
                              ) : (
                                <Building2 className="w-7 h-7" />
                              )}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] tracking-tight truncate">
                                  {user?.company || 'Company Name Unconfigured'}
                                </h2>
                                <VerifiedSeal iconType="shield" label="Verified Partner" />
                              </div>
                              <p className="text-xs text-[#14131F]/65 font-medium">
                                {user?.designation || 'Talent Acquisition'}
                                {user?.department ? ` • ${user.department}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setIsEditingProfile(true);
                                setCompanyProfileSuccess(null);
                                setCompanyProfileError(null);
                              }}
                              icon={<Edit3 className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Edit Profile
                            </Button>
                          </div>
                        </div>

                        {/* Unconfigured Warning Banner for New Accounts */}
                        {!user?.company && (
                          <div className="bg-[#4338CA]/5 border border-[#4338CA]/15 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-[#14131F]">
                                Add Your Company Details
                              </p>
                              <p className="text-[11px] text-[#14131F]/60">
                                Set your official organization name and contact coordinates so students recognize your campus opportunities.
                              </p>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setIsEditingProfile(true);
                                setCompanyProfileSuccess(null);
                                setCompanyProfileError(null);
                              }}
                              icon={<Plus className="w-3.5 h-3.5" />}
                              className="text-xs font-semibold shrink-0"
                            >
                              Configure Now
                            </Button>
                          </div>
                        )}

                        {/* Corporate & Recruiter Information Ledger */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                          {/* Company Name */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[#14131F]/50">
                              Company / Organization
                            </span>
                            <p className="font-medium text-[#14131F]">
                              {user?.company || (
                                <button
                                  type="button"
                                  onClick={() => setIsEditingProfile(true)}
                                  className="text-[#4338CA] hover:underline cursor-pointer"
                                >
                                  + Add company name
                                </button>
                              )}
                            </p>
                          </div>

                          {/* Recruiter Lead Name */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[#14131F]/50">
                              Campus Recruiter Lead
                            </span>
                            <p className="font-medium text-[#14131F]">
                              {user?.name || user?.fullName || 'Authorized Recruiter'}
                            </p>
                          </div>

                          {/* Designation */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[#14131F]/50">
                              Designation / Role
                            </span>
                            <p className="font-medium text-[#14131F]">
                              {user?.designation || (
                                <span className="text-[#14131F]/40 italic">Not specified</span>
                              )}
                            </p>
                          </div>

                          {/* Department */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[#14131F]/50">
                              Department / Division
                            </span>
                            <p className="font-medium text-[#14131F]">
                              {user?.department || (
                                <span className="text-[#14131F]/40 italic">Not specified</span>
                              )}
                            </p>
                          </div>

                          {/* Email */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[#14131F]/50">
                              Official Email
                            </span>
                            <div className="flex items-center gap-1.5 font-medium text-[#14131F]">
                              <Mail className="w-3.5 h-3.5 text-[#4338CA]" />
                              <span>{user?.email || 'recruiter@enterprise.com'}</span>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-[#14131F]/50">
                              Phone Number
                            </span>
                            <div className="flex items-center gap-1.5 font-medium text-[#14131F]">
                              <Phone className="w-3.5 h-3.5 text-[#4338CA]" />
                              {user?.phone ? (
                                <span>{user.phone}</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setIsEditingProfile(true)}
                                  className="text-[#4338CA] hover:underline cursor-pointer"
                                >
                                  + Add phone number
                                </button>
                              )}
                            </div>
                          </div>

                          {/* LinkedIn Profile */}
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[11px] font-semibold text-[#14131F]/50">
                              LinkedIn Profile / Page
                            </span>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Linkedin className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                              {user?.linkedinUrl ? (
                                <a
                                  href={
                                    user.linkedinUrl.startsWith('http')
                                      ? user.linkedinUrl
                                      : `https://${user.linkedinUrl}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#4338CA] hover:underline font-medium inline-flex items-center gap-1 truncate"
                                >
                                  <span className="truncate">{user.linkedinUrl}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setIsEditingProfile(true)}
                                  className="text-[#4338CA] hover:underline cursor-pointer"
                                >
                                  + Add LinkedIn profile URL
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Corporate Bio Section */}
                        <div className="pt-4 border-t border-[#14131F]/8 space-y-2">
                          <span className="text-[11px] font-semibold text-[#14131F]/50">
                            About The Organization
                          </span>
                          {user?.bio ? (
                            <p className="text-xs sm:text-sm text-[#14131F]/75 leading-relaxed whitespace-pre-line bg-[#FAFAF8] border border-[#14131F]/6 rounded-xl p-4">
                              {user.bio}
                            </p>
                          ) : (
                            <div className="bg-[#FAFAF8] border border-[#14131F]/6 rounded-xl p-4 text-center space-y-2">
                              <p className="text-xs text-[#14131F]/60">
                                No corporate overview or campus hiring mission added yet.
                              </p>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsEditingProfile(true)}
                                icon={<Plus className="w-3.5 h-3.5" />}
                                className="text-xs"
                              >
                                Add Corporate Bio
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Activity Summary & Compliance (1 col) */}
                <div className="space-y-6">
                  {/* Activity Summary: "Your footprint on placementOS" */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="pb-3 border-b border-[#14131F]/8">
                      <h3 className="font-display font-bold text-base text-[#14131F]">
                        Your Footprint on placementOS
                      </h3>
                      <p className="text-xs text-[#14131F]/60 mt-0.5">
                        Live recruitment activity across university campuses
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Stat 1: Job Postings */}
                      <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#14131F]">
                              Job Requisitions
                            </p>
                            <p className="text-[11px] text-[#14131F]/60">
                              {jobs.filter((j) => (j.status || 'Active').toLowerCase() === 'active').length} active opportunities
                            </p>
                          </div>
                        </div>
                        <span className="font-display font-bold text-base text-[#14131F]">
                          {jobs.length}
                        </span>
                      </div>

                      {/* Stat 2: Applications In Pipeline */}
                      <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#A3E635]/20 text-emerald-900 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#14131F]">
                              Applicants In Pipeline
                            </p>
                            <p className="text-[11px] text-[#14131F]/60">
                              Total candidates evaluated
                            </p>
                          </div>
                        </div>
                        <span className="font-display font-bold text-base text-[#14131F]">
                          {applications.length}
                        </span>
                      </div>

                      {/* Stat 3: Learning Programs */}
                      <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#14131F]">
                              Learning Tracks
                            </p>
                            <p className="text-[11px] text-[#14131F]/60">
                              Corporate cohort programs
                            </p>
                          </div>
                        </div>
                        <span className="font-display font-bold text-base text-[#14131F]">
                          {learningPrograms.length}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#14131F]/6">
                      <p className="text-[11px] text-[#14131F]/60 leading-relaxed">
                        All postings, offers, and learning programs automatically inherit your updated company name and recruiter identity.
                      </p>
                    </div>
                  </div>

                  {/* Employer Verification & Quick Links */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#4338CA]" />
                      <h4 className="font-display font-bold text-sm text-[#14131F]">
                        Recruiter Security & Governance
                      </h4>
                    </div>

                    <p className="text-xs text-[#14131F]/65 leading-relaxed">
                      Your enterprise identity is cryptographically tied to your authenticated login. Student assessments and applicant dossiers are restricted to authorized university placement drives.
                    </p>

                    <div className="pt-2 space-y-2 border-t border-[#14131F]/6">
                      <button
                        type="button"
                        onClick={() => setActiveTab('jobs')}
                        className="w-full text-left py-1.5 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] flex items-center justify-between cursor-pointer"
                      >
                        <span>Manage Active Requisitions</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('applications')}
                        className="w-full text-left py-1.5 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] flex items-center justify-between cursor-pointer"
                      >
                        <span>Review Application Pipeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('learning')}
                        className="w-full text-left py-1.5 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] flex items-center justify-between cursor-pointer"
                      >
                        <span>Manage Learning Programs</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
      </DashboardShell>

      {/* Profile Notice Modal */}
      {profileNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#14131F]/10 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#14131F]">
                    Company Profile
                  </h3>
                  <p className="text-xs text-[#14131F]/60">Employer organization record</p>
                </div>
              </div>
              <button
                onClick={() => setProfileNoticeOpen(false)}
                className="p-1 rounded-lg text-[#14131F]/40 hover:text-[#14131F] hover:bg-[#14131F]/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#14131F]/60">Company Name:</span>
                <span className="font-bold text-[#14131F]">{companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#14131F]/60">Recruiter Lead:</span>
                <span className="font-medium text-[#14131F]">{recruiterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#14131F]/60">Role / Designation:</span>
                <span className="font-medium text-[#14131F]">{recruiterDesignation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#14131F]/60">Email:</span>
                <span className="font-medium text-[#14131F]">{user?.email}</span>
              </div>
            </div>

            <p className="text-xs text-[#14131F]/65 leading-relaxed">
              Full employer branding, brand asset uploads, and hiring manager seats will be editable in the dedicated <strong>Company Profile</strong> module.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProfileNoticeOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setProfileNoticeOpen(false);
                  setActiveTab('company_profile');
                }}
                className="text-xs"
              >
                Go to Company Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Requisition Modal */}
      {isCreateJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-left">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#14131F]/8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14131F] leading-tight">
                    Post New Opportunity
                  </h3>
                  <p className="text-xs text-[#14131F]/60 mt-0.5">
                    Define recruitment criteria and publish to verified campus candidates
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!formSubmitting) setIsCreateJobModalOpen(false);
                }}
                disabled={formSubmitting}
                className="p-1.5 rounded-lg text-[#14131F]/40 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Creation Error</p>
                  <p className="mt-0.5">{formError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateJob} className="space-y-4">
              {/* Opportunity Type (Segmented control) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Opportunity Type
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/10">
                  {(['Job', 'Internship', 'Apprenticeship'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormType(type)}
                      className={`py-2 text-xs rounded-lg font-medium transition-colors cursor-pointer text-center ${
                        formType === type
                          ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                          : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-black/5'
                      }`}
                    >
                      {type === 'Job' ? 'Full-Time Job' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Hiring Company
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Backend Engineer (Node/Go)"
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>
              </div>

              {/* Conditional Compensation: CTC or Stipend + Duration */}
              {formType === 'Job' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Annual Compensation (CTC)
                  </label>
                  <input
                    type="text"
                    value={formCtc}
                    onChange={(e) => setFormCtc(e.target.value)}
                    placeholder="e.g. ₹18.0 - ₹24.0 LPA"
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#14131F]">
                      Monthly Stipend
                    </label>
                    <input
                      type="text"
                      value={formStipend}
                      onChange={(e) => setFormStipend(e.target.value)}
                      placeholder="e.g. ₹40,000 / month"
                      className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#14131F]">
                      Program Duration
                    </label>
                    <input
                      type="text"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      placeholder="e.g. 6 Months (Jan - Jun)"
                      className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Open Positions & Cutoff Percentage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Open Positions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formOpenPositions}
                    onChange={(e) => setFormOpenPositions(Number(e.target.value))}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                  <p className="text-[10px] text-[#14131F]/50">Target student intake</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Readiness Cutoff Score (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formCutoffPct}
                    onChange={(e) => setFormCutoffPct(Number(e.target.value))}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                  <p className="text-[10px] text-[#14131F]/50">
                    Minimum placementOS AI & DSA benchmark to apply
                  </p>
                </div>
              </div>

              {/* Location & Required Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Workplace Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, KA (Hybrid) or Remote"
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Required Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formRequiredSkills}
                    onChange={(e) => setFormRequiredSkills(e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Role Overview & Requirements
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe key deliverables, technical stack requirements, or interview rounds..."
                  className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors resize-none"
                />
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#14131F]/8">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={formSubmitting}
                  onClick={() => setIsCreateJobModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={formSubmitting}
                  icon={
                    formSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs font-semibold"
                >
                  {formSubmitting ? 'Publishing...' : 'Publish Requisition'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Candidate Profile Detail & Interview Invitation Modal */}
      {selectedCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs animate-in fade-in">
          <div className={`bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 ${candidateModalTab === 'portfolio' ? 'max-w-4xl' : 'max-w-3xl'} w-full shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 text-left`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#14131F]/8 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-display font-bold text-lg shrink-0">
                  {profileData?.candidate?.name
                    ? profileData.candidate.name.charAt(0).toUpperCase()
                    : <Users className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg text-[#14131F] leading-tight">
                      {profileData?.candidate?.name || 'Candidate Assessment Profile'}
                    </h3>
                    {profileData?.candidate?.readinessScore != null && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          getReadinessScoreStyle(profileData.candidate.readinessScore).badgeBg
                        } ${getReadinessScoreStyle(profileData.candidate.readinessScore).badgeText}`}
                      >
                        {profileData.candidate.readinessScore}% Readiness
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#14131F]/65 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{profileData?.candidate?.targetRole || 'Engineering Candidate'}</span>
                    {profileData?.candidate?.college && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-[#4338CA]" />
                          {profileData.candidate.college}
                        </span>
                      </>
                    )}
                    {profileData?.candidate?.email && (
                      <>
                        <span>•</span>
                        <span className="text-[#14131F]/50">{profileData.candidate.email}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCandidateId(null);
                  setProfileData(null);
                  setInviteSuccessMessage(null);
                  setInviteError(null);
                }}
                className="p-1.5 rounded-lg text-[#14131F]/40 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Loading / Error / Content */}
            {profileLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                <p className="text-xs font-medium text-[#14131F]/60">
                  Retrieving candidate assessment ledger, resume metrics, and GitHub audit...
                </p>
              </div>
            ) : profileError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{profileError}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openCandidateProfile(selectedCandidateId)}
                  className="text-xs"
                >
                  Retry Loading Profile
                </Button>
              </div>
            ) : profileData ? (
              <div className="space-y-6">
                {/* Candidate Modal Tab Navigation (FIX #5) */}
                <div className="flex items-center gap-2 border-b border-[#14131F]/10 pb-3 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setCandidateModalTab('overview')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      candidateModalTab === 'overview'
                        ? 'bg-[#14131F] text-white'
                        : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Requisition & Evaluation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateModalTab('portfolio')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      candidateModalTab === 'portfolio'
                        ? 'bg-[#14131F] text-white'
                        : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Digital Student Portfolio</span>
                    {profileData.digitalPortfolio?.completeness && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        candidateModalTab === 'portfolio' ? 'bg-white/20 text-white' : 'bg-[#4338CA]/10 text-[#4338CA]'
                      }`}>
                        {profileData.digitalPortfolio.completeness.score}%
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateModalTab('github')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      candidateModalTab === 'github'
                        ? 'bg-[#14131F] text-white'
                        : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
                    }`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Portfolio Audit</span>
                    {profileData.portfolio?.qualityScore != null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        candidateModalTab === 'github' ? 'bg-white/20 text-white' : 'bg-[#14131F]/10 text-[#14131F]'
                      }`}>
                        {profileData.portfolio.qualityScore}/100
                      </span>
                    )}
                  </button>
                </div>

                {/* TAB 1: DIGITAL STUDENT PORTFOLIO (FIX #5) */}
                {candidateModalTab === 'portfolio' && (
                  <div className="space-y-6">
                    {profileData.digitalPortfolio ? (
                      <DigitalStudentPortfolioView
                        portfolio={profileData.digitalPortfolio}
                        isLoading={false}
                        isOwner={false}
                      />
                    ) : (
                      <div className="p-8 bg-[#FAFAF8] border border-[#14131F]/10 rounded-2xl text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-[#14131F]/40 mx-auto" />
                        <h4 className="text-sm font-bold text-[#14131F]">No Portfolio Records Yet</h4>
                        <p className="text-xs text-[#14131F]/60 max-w-md mx-auto">
                          This student has not yet entered projects, internships, or achievements.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: REQUISITION & EVALUATION (DEFAULT) */}
                {candidateModalTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Portfolio Quick Access Banner */}
                    <div className="bg-[#4338CA]/5 border border-[#4338CA]/15 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
                          <Briefcase className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[#14131F]">
                            Unified Digital Student Portfolio
                          </h5>
                          <p className="text-[11px] text-[#14131F]/65">
                            Verified projects, internships, skill assessments, and awards ({profileData.digitalPortfolio?.completeness?.score || 0}% complete).
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setCandidateModalTab('portfolio')}
                        icon={<ArrowRight className="w-3 h-3" />}
                      >
                        View Full Portfolio
                      </Button>
                    </div>

                    {/* Official Interview Invitation Requisition Box */}
                    <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-2xl p-5 sm:p-6 space-y-4">
                  {invitedCandidateMap[selectedCandidateId] ? (
                    <div className="bg-[#A3E635]/15 border border-[#A3E635]/50 rounded-xl p-4 sm:p-5 text-left space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#A3E635] text-[#14131F] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 font-bold" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-[#14131F]">
                            Interview Invitation Active & Dispatched
                          </h4>
                          <p className="text-xs text-[#14131F]/70">
                            Requisition logged on {invitedCandidateMap[selectedCandidateId].invitedAt} for the role of <strong className="text-[#14131F]">{invitedCandidateMap[selectedCandidateId].jobTitle}</strong> at {companyName}.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#14131F]/10 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="text-[#14131F]/70 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#4338CA]" />
                          Verified entry registered in candidate's Application Tracking board
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-[#A3E635]/40 px-2.5 py-0.5 rounded-full">
                          Status: Interview Invited
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-display font-bold text-sm text-[#14131F] flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#4338CA]" />
                            Issue Campus Interview Invitation
                          </h4>
                          <p className="text-xs text-[#14131F]/65 mt-0.5">
                            Formally invite {profileData.candidate.name} for an interview round at {companyName}. This generates a live application record on the student's dashboard.
                          </p>
                        </div>
                      </div>

                      {inviteSuccessMessage && (
                        <div className="p-4 bg-[#A3E635]/20 border border-[#A3E635]/60 rounded-xl text-xs text-[#14131F] space-y-1">
                          <div className="flex items-center gap-2 font-bold text-emerald-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Interview Invitation Successfully Dispatched!
                          </div>
                          <p className="text-xs text-[#14131F]/80 leading-relaxed">
                            {inviteSuccessMessage}
                          </p>
                        </div>
                      )}

                      {inviteError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{inviteError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="block text-xs font-semibold text-[#14131F]">
                            Requisition / Role Title
                          </label>
                          {activeJobsList.length > 0 ? (
                            <select
                              value={isInviteCustom ? '__custom__' : inviteJobTitle}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setIsInviteCustom(true);
                                } else {
                                  setIsInviteCustom(false);
                                  setInviteJobTitle(e.target.value);
                                }
                              }}
                              className="w-full bg-white border border-[#14131F]/15 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA]"
                            >
                              {activeJobsList.map((j) => (
                                <option key={j.id} value={j.title}>
                                  {j.title} ({j.type || 'Job'})
                                </option>
                              ))}
                              <option value="__custom__">+ Enter Custom Role Title...</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={inviteJobTitle}
                              onChange={(e) => setInviteJobTitle(e.target.value)}
                              placeholder="e.g. Software Development Engineer"
                              className="w-full bg-white border border-[#14131F]/15 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA]"
                            />
                          )}

                          {isInviteCustom && (
                            <input
                              type="text"
                              value={inviteCustomTitle}
                              onChange={(e) => setInviteCustomTitle(e.target.value)}
                              placeholder="Type custom role title..."
                              className="w-full mt-2 bg-white border border-[#14131F]/15 rounded-xl px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA]"
                            />
                          )}
                        </div>

                        <div>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={inviteSubmitting}
                            onClick={() => handleSendInvite(selectedCandidateId)}
                            icon={
                              inviteSubmitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )
                            }
                            className="w-full text-xs font-semibold justify-center py-2"
                          >
                            {inviteSubmitting ? 'Transmitting...' : 'Send Invitation'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PlacementOS Requisition Skill-Fit Breakdown */}
                {profileData.jobMatch && (
                  <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-display font-bold text-sm text-[#14131F]">
                              Requisition Skill-Match Analysis
                            </h4>
                            <span
                              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                                getSkillMatchStyle(profileData.jobMatch.matchPercentage).badgeBg
                              } ${getSkillMatchStyle(profileData.jobMatch.matchPercentage).badgeText}`}
                            >
                              {profileData.jobMatch.matchCategory}
                            </span>
                          </div>
                          <p className="text-xs text-[#14131F]/65 mt-0.5">
                            Target Opportunity: <strong className="text-[#14131F]">{profileData.jobMatch.jobTitle}</strong> ({profileData.jobMatch.company})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 bg-white border border-[#14131F]/10 px-3.5 py-2 rounded-xl">
                        <span className="text-xs font-semibold text-[#14131F]/60">Match Fit:</span>
                        <span className="font-display font-bold text-xl text-[#4338CA]">
                          {profileData.jobMatch.matchPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-[#14131F]/8 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#4338CA] to-[#6366F1] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, profileData.jobMatch.matchPercentage))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#14131F]/50">
                        <span>Low Fit (0-49%)</span>
                        <span>Moderate Fit (50-64%)</span>
                        <span>Good Fit (65-79%)</span>
                        <span>High Fit (80-100%)</span>
                      </div>
                    </div>

                    {/* Skills Breakdown Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
                      {/* Verified Strengths */}
                      <div className="bg-white border border-emerald-100 rounded-xl p-3 space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Strengths ({profileData.jobMatch.strengths?.length || 0})</span>
                        </div>
                        {profileData.jobMatch.strengths && profileData.jobMatch.strengths.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profileData.jobMatch.strengths.map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#14131F]/50">No strengths verified yet</p>
                        )}
                      </div>

                      {/* Improving / Developing */}
                      <div className="bg-white border border-amber-100 rounded-xl p-3 space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Improving ({profileData.jobMatch.needsImprovement?.length || 0})</span>
                        </div>
                        {profileData.jobMatch.needsImprovement && profileData.jobMatch.needsImprovement.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profileData.jobMatch.needsImprovement.map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#14131F]/50">No in-progress skills</p>
                        )}
                      </div>

                      {/* Gaps / Missing */}
                      <div className="bg-white border border-rose-100 rounded-xl p-3 space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Critical Gaps ({profileData.jobMatch.gaps?.length || 0})</span>
                        </div>
                        {profileData.jobMatch.gaps && profileData.jobMatch.gaps.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profileData.jobMatch.gaps.map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#14131F]/50">No critical skill gaps</p>
                        )}
                      </div>

                      {/* Not Assessed */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                          <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                          <span>Not Assessed ({profileData.jobMatch.notAssessed?.length || 0})</span>
                        </div>
                        {profileData.jobMatch.notAssessed && profileData.jobMatch.notAssessed.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profileData.jobMatch.notAssessed.map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#14131F]/50">All required skills evaluated</p>
                        )}
                      </div>
                    </div>

                    {/* Detailed Requirements Calibration List */}
                    {profileData.jobMatch.detailedBreakdown && profileData.jobMatch.detailedBreakdown.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#14131F]/8">
                        <p className="text-[11px] font-semibold text-[#14131F]/70 uppercase tracking-wider">
                          Requisition Skill-by-Skill Breakdown
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {profileData.jobMatch.detailedBreakdown.map((item: any, bIdx: number) => {
                            const isStrength = item.status === 'Strength';
                            const isImprovement = item.status === 'Needs Improvement';
                            const isGap = item.status === 'Gap';
                            return (
                              <div
                                key={bIdx}
                                className="bg-white border border-[#14131F]/8 rounded-lg p-2.5 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-[#14131F]">{item.skill}</span>
                                    {item.weight === 'required' ? (
                                      <span className="text-[9px] font-bold text-[#4338CA] bg-[#4338CA]/10 px-1.5 py-0.2 rounded">
                                        Required
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-medium text-[#14131F]/50 bg-[#14131F]/5 px-1.5 py-0.2 rounded">
                                        Optional
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#14131F]/50 mt-0.5">
                                    Target: {item.requiredScore ?? 70}% • Student: {item.studentScore != null ? `${item.studentScore}%` : 'Not Assessed'}
                                  </p>
                                </div>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    isStrength
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : isImprovement
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : isGap
                                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Score Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-medium text-[#14131F]/60">Readiness Score</p>
                    <p className="text-xl font-bold font-display text-[#14131F] mt-0.5">
                      {profileData.candidate.readinessScore ?? 0}%
                    </p>
                  </div>
                  <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-medium text-[#14131F]/60">DSA Problems</p>
                    <p className="text-xl font-bold font-display text-[#14131F] mt-0.5">
                      {profileData.candidate.dsaSolved ?? 0} Solved
                    </p>
                  </div>
                  <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-medium text-[#14131F]/60">Mock Interview</p>
                    <p className="text-xl font-bold font-display text-[#14131F] mt-0.5">
                      {profileData.avgMockInterviewScore != null
                        ? `${profileData.avgMockInterviewScore}%`
                        : 'Unattempted'}
                    </p>
                  </div>
                  <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-medium text-[#14131F]/60">Badges Earned</p>
                    <p className="text-xl font-bold font-display text-[#14131F] mt-0.5">
                      {profileData.badgeCount ?? 0}
                    </p>
                  </div>
                </div>

                {/* Resume Breakdown */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-[#14131F] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#4338CA]" />
                      Resume & ATS Assessment Report
                    </h4>
                    <div className="flex items-center gap-2.5">
                      {profileData.resume?.fileUrl && (
                        <a
                          href={profileData.resume.fileUrl}
                          onClick={(e) => {
                            if (profileData.resume?.fileUrl?.startsWith('/')) {
                              e.preventDefault();
                              viewAuthenticatedFile(profileData.resume.fileUrl);
                            }
                          }}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#4338CA] text-white hover:bg-[#3730A3] transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Resume</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                        </a>
                      )}
                      {profileData.resume?.createdAt && (
                        <span className="text-[11px] text-[#14131F]/50">
                          Audited on {new Date(profileData.resume.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {!profileData.resume ? (
                    <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-4 text-xs text-[#14131F]/60 flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-[#14131F]/40 shrink-0" />
                      <span>Resume document has not yet been submitted or parsed by this candidate.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-medium text-[#14131F]/60">ATS Match Score</p>
                          <p className="text-lg font-bold font-display text-[#14131F] mt-0.5">
                            {profileData.resume.atsScore != null ? `${profileData.resume.atsScore}%` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-medium text-[#14131F]/60">Formatting Score</p>
                          <p className="text-lg font-bold font-display text-[#14131F] mt-0.5">
                            {profileData.resume.formattingScore != null
                              ? `${profileData.resume.formattingScore}%`
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 text-center">
                          <p className="text-[11px] font-medium text-[#14131F]/60">Quantified Impact</p>
                          <p className="text-lg font-bold font-display text-[#14131F] mt-0.5">
                            {profileData.resume.quantifiedImpactScore != null
                              ? `${profileData.resume.quantifiedImpactScore}%`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Skills Found */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14131F]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified Skills Detected ({profileData.resume.skillsFound?.length || 0})</span>
                          </div>
                          {profileData.resume.skillsFound && profileData.resume.skillsFound.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {profileData.resume.skillsFound.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-[#A3E635]/20 border border-[#A3E635]/50 text-[#14131F] font-medium"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#14131F]/50">No verified skills detected in resume parser.</p>
                          )}
                        </div>

                        {/* Missing Skills */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14131F]">
                            <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" />
                            <span>Role Gaps & Missing Skills ({profileData.resume.missingSkills?.length || 0})</span>
                          </div>
                          {profileData.resume.missingSkills && profileData.resume.missingSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {profileData.resume.missingSkills.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#E11D48] font-medium"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#14131F]/50">No critical skill gaps identified.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                    {/* Certifications & Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#14131F]/8">
                      <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <Award className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#14131F]">
                            {profileData.certificationsCount || 0} Verified Credentials
                          </p>
                          <p className="text-[11px] text-[#14131F]/60">
                            Industry & university recognized certifications
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#A3E635]/20 text-[#14131F] flex items-center justify-center">
                          <ShieldCheck className="w-4.5 h-4.5 text-[#4338CA]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#14131F]">
                            {profileData.badgeCount || 0} Platform Badges Earned
                          </p>
                          <p className="text-[11px] text-[#14131F]/60">
                            Mock interview & coding milestones
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: GITHUB CODE QUALITY */}
                {candidateModalTab === 'github' && (
                  <div className="space-y-4">
                    {/* Portfolio Breakdown */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-display font-bold text-sm text-[#14131F] flex items-center gap-2">
                            <Github className="w-4 h-4 text-[#4338CA]" />
                            GitHub Portfolio Audit
                          </h4>
                          <p className="text-[11px] text-[#14131F]/60 mt-0.5">
                            Automated code repository & architecture audit. Independent metric — not merged into Job Skill Match.
                          </p>
                        </div>
                    {profileData.portfolio?.githubUrl && (
                      <a
                        href={profileData.portfolio.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:underline"
                      >
                        <span>View GitHub Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {!profileData.portfolio ? (
                    <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-4 text-xs text-[#14131F]/60 flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-[#14131F]/40 shrink-0" />
                      <span>GitHub repository link and portfolio audit have not been connected yet.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
                          <Code className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#14131F]">
                            Code Quality Score:{' '}
                            <span className="text-[#4338CA]">
                              {profileData.portfolio.qualityScore != null
                                ? `${profileData.portfolio.qualityScore}%`
                                : 'Audited'}
                            </span>
                          </p>
                          <p className="text-[11px] text-[#14131F]/60">
                            {profileData.portfolio.githubUsername
                              ? `@${profileData.portfolio.githubUsername} • `
                              : ''}
                            {profileData.portfolio.auditedProjects?.length || 0} repository projects audited
                          </p>
                        </div>
                      </div>

                      {profileData.portfolio.auditedProjects &&
                      profileData.portfolio.auditedProjects.length > 0 ? (
                        <div className="space-y-2">
                          {profileData.portfolio.auditedProjects.map((proj, pIdx) => (
                            <div
                              key={pIdx}
                              className="bg-white border border-[#14131F]/8 rounded-xl p-3.5 space-y-1.5 text-left"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-[#14131F] font-display">
                                    {proj.name}
                                  </span>
                                  {proj.language && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4338CA]/10 text-[#4338CA] font-medium">
                                      {proj.language}
                                    </span>
                                  )}
                                </div>
                                {proj.url && (
                                  <a
                                    href={proj.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#14131F]/40 hover:text-[#4338CA] transition-colors"
                                    title="View Repo"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                              {proj.description && (
                                <p className="text-xs text-[#14131F]/70 leading-relaxed">
                                  {proj.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-[#14131F]/50 pt-1">
                                {proj.commits && <span>{proj.commits} commits</span>}
                                {proj.stars != null && <span>⭐ {proj.stars} stars</span>}
                                {proj.status && (
                                  <span className="capitalize text-emerald-700 font-medium">
                                    {proj.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#14131F]/50">No specific audited repositories listed.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
          </div>
        </div>
      )}

      {/* Publish Campus Learning Program Modal */}
      {isCreateProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#14131F]/8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14131F] leading-tight">
                    Publish Learning Program
                  </h3>
                  <p className="text-xs text-[#14131F]/60 mt-0.5">
                    Launch an industry-backed training track or workshop for university students
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!progSubmitting) setIsCreateProgramModalOpen(false);
                }}
                disabled={progSubmitting}
                className="p-1.5 rounded-lg text-[#14131F]/40 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {progFormError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Publication Error</p>
                  <p className="mt-0.5">{progFormError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateProgram} className="space-y-4">
              {/* Program Title */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Program Title <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud Native & Kubernetes Immersion"
                  value={progTitle}
                  onChange={(e) => setProgTitle(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                />
              </div>

              {/* Program Type (Segmented control) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Program Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/10">
                  {(['Certification', 'Workshop', 'Training Program', 'Mentorship'] as const).map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setProgType(t)}
                        className={`py-2 text-[11px] rounded-lg font-medium transition-colors cursor-pointer text-center ${
                          progType === t
                            ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                            : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-black/5'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Delivery Mode & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Delivery Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/10">
                    {(['Online', 'Offline', 'Hybrid'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setProgMode(m)}
                        className={`py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer text-center ${
                          progMode === m
                            ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                            : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-black/5'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Program Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6 Weeks, 3 Days, 2 Months"
                    value={progDuration}
                    onChange={(e) => setProgDuration(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                  />
                </div>
              </div>

              {/* Capacity & Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1 sm:col-span-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Cohort Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={progCapacity}
                    onChange={(e) => setProgCapacity(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Skills Covered (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Docker, Kubernetes, CI/CD, Go"
                    value={progSkills}
                    onChange={(e) => setProgSkills(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Curriculum Overview & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline syllabus milestones, prerequisite foundational knowledge, hands-on lab requirements, and graduation capstone expectations..."
                  value={progDescription}
                  onChange={(e) => setProgDescription(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA] resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#14131F]/8">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={progSubmitting}
                  onClick={() => setIsCreateProgramModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={progSubmitting}
                  icon={
                    progSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs font-semibold"
                >
                  {progSubmitting ? 'Publishing...' : 'Publish Program'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Academic Collaboration Opportunity Modal */}
      {isCreateAcademicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-left">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#14131F]/8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14131F] leading-tight">
                    Publish Academic Opportunity
                  </h3>
                  <p className="text-xs text-[#14131F]/60 mt-0.5">
                    Connect with university faculty for internships, FDPs, consultancy, and joint research
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!acadSubmitting) setIsCreateAcademicModalOpen(false);
                }}
                disabled={acadSubmitting}
                className="p-1.5 rounded-lg text-[#14131F]/40 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {acadFormError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Publication Error</p>
                  <p className="mt-0.5">{acadFormError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateAcademicOpportunity} className="space-y-4">
              {/* Opportunity Title */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Opportunity Title <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visiting Faculty Fellowship in Cloud Native Architectures"
                  value={acadTitle}
                  onChange={(e) => setAcadTitle(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                />
              </div>

              {/* Opportunity Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Opportunity Category <span className="text-[#FB7185]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/10">
                  {(
                    [
                      'Faculty Internship',
                      'Industrial Training',
                      'FDP',
                      'Consultancy',
                      'Research Collaboration',
                    ] as const
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAcadType(t)}
                      className={`py-2 text-[11px] rounded-lg font-medium transition-colors cursor-pointer text-center ${
                        acadType === t
                          ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                          : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-black/5'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Mode & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Engagement Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/10">
                    {(['Online', 'Offline', 'Hybrid'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAcadMode(m)}
                        className={`py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer text-center ${
                          acadMode === m
                            ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                            : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-black/5'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Duration / Timeline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4 Weeks, 6 Months, 1 Academic Year"
                    value={acadDuration}
                    onChange={(e) => setAcadDuration(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                  />
                </div>
              </div>

              {/* Stipend / Honorarium & Application Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Stipend / Honorarium (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 / month, ₹25,000 Honorarium"
                    value={acadStipend}
                    onChange={(e) => setAcadStipend(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14131F]">
                    Application Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={acadDeadline}
                    onChange={(e) => setAcadDeadline(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                  />
                </div>
              </div>

              {/* Required Expertise */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Required Academic & Technical Expertise (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems, Kubernetes, Go, Cloud Architecture"
                  value={acadExpertise}
                  onChange={(e) => setAcadExpertise(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                />
              </div>

              {/* Scope & Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#14131F]">
                  Description & Scope of Collaboration
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the collaboration objectives, expected faculty contributions, deliverables, and eligibility criteria..."
                  value={acadDescription}
                  onChange={(e) => setAcadDescription(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF8] border border-[#14131F]/15 rounded-xl px-3.5 py-2.5 text-[#14131F] outline-none focus:border-[#4338CA] resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#14131F]/8">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={acadSubmitting}
                  onClick={() => setIsCreateAcademicModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={acadSubmitting}
                  icon={
                    acadSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs font-semibold"
                >
                  {acadSubmitting ? 'Publishing...' : 'Publish Opportunity'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Program Confirmation Modal */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FB7185]/15 text-[#E11D48] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#14131F]">
                  Delete Learning Program?
                </h3>
                <p className="text-xs text-[#14131F]/60 mt-0.5">
                  Confirm permanent removal of this campus track
                </p>
              </div>
            </div>

            <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3.5 space-y-1">
              <p className="font-semibold text-xs text-[#14131F]">
                {programToDelete.title}
              </p>
              <p className="text-[11px] text-[#14131F]/60">
                Type: {programToDelete.type} • Mode: {programToDelete.mode} • Duration:{' '}
                {programToDelete.duration || 'N/A'}
              </p>
            </div>

            <p className="text-xs text-[#14131F]/70 leading-relaxed">
              Are you sure you want to delete this program? This action will remove the program from campus students and unpublish the curriculum. This cannot be undone.
            </p>

            {programDeleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{programDeleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#14131F]/8">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isDeletingProgram}
                onClick={() => {
                  setProgramToDelete(null);
                  setProgramDeleteError(null);
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isDeletingProgram}
                onClick={handleDeleteProgram}
                icon={
                  isDeletingProgram ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )
                }
                className="text-xs font-semibold !bg-[#E11D48] hover:!bg-[#BE123C] text-white border-transparent"
              >
                {isDeletingProgram ? 'Deleting...' : 'Delete Program'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Program Applicants Review Modal */}
      {selectedProgramForApplicants && (
        <div
          id="program-applicants-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs font-sans animate-in fade-in"
          onClick={() => {
            setSelectedProgramForApplicants(null);
            setProgramApplicants([]);
            setApplicantActionError(null);
            setApplicantActionSuccess(null);
          }}
        >
          <div
            id="program-applicants-dialog"
            className="bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#14131F]/8 flex items-start justify-between gap-4 bg-[#FAFAF8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-lg text-[#14131F]">
                    {selectedProgramForApplicants.title}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                    {selectedProgramForApplicants.type}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAFAF8] text-[#14131F]/70 border border-[#14131F]/10">
                    {selectedProgramForApplicants.mode || 'Online'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#14131F]/65 flex-wrap">
                  <span className="font-semibold text-[#14131F] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#14131F]/50" />
                    {selectedProgramForApplicants.company}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#14131F]/50" />
                    {selectedProgramForApplicants.duration || 'Flexible'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-[#14131F]">
                    <Users className="w-3.5 h-3.5 text-[#14131F]/50" />
                    <span>
                      Enrolled: {selectedProgramForApplicants.enrolledCount || 0}
                      {selectedProgramForApplicants.capacity
                        ? ` / ${selectedProgramForApplicants.capacity} max`
                        : ''}
                    </span>
                  </span>
                  {selectedProgramForApplicants.capacity &&
                    (selectedProgramForApplicants.enrolledCount || 0) >=
                      selectedProgramForApplicants.capacity && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Cohort Full
                      </span>
                    )}
                </div>
              </div>

              <button
                type="button"
                id="close-program-applicants-btn"
                onClick={() => {
                  setSelectedProgramForApplicants(null);
                  setProgramApplicants([]);
                  setApplicantActionError(null);
                  setApplicantActionSuccess(null);
                }}
                className="p-1.5 text-[#14131F]/50 hover:text-[#14131F] hover:bg-[#14131F]/5 rounded-lg transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications & Feedback */}
            {applicantActionError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{applicantActionError}</span>
              </div>
            )}
            {applicantActionSuccess && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{applicantActionSuccess}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[65vh]">
              {loadingProgramApplicants ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-7 h-7 border-2 border-[#14131F]/15 border-t-[#4338CA] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#14131F]/60">Loading applicants for this program...</p>
                </div>
              ) : programApplicantsError ? (
                <div className="p-8 text-center bg-red-50/50 rounded-xl border border-red-200 space-y-3">
                  <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                  <p className="text-xs text-red-700 font-medium">{programApplicantsError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openProgramApplicantsModal(selectedProgramForApplicants)}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : programApplicants.length === 0 ? (
                <div className="p-12 text-center bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#14131F]/5 flex items-center justify-center mx-auto text-[#14131F]/40">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-semibold text-sm text-[#14131F]">
                    No Student Applications Yet
                  </h4>
                  <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                    Students exploring the Workshops & Programs board can apply to this cohort. Applications will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#14131F]/60 pb-1">
                    <span>
                      Showing <strong className="text-[#14131F]">{programApplicants.length}</strong> applicant
                      {programApplicants.length === 1 ? '' : 's'}
                    </span>
                    <span className="text-[11px]">
                      Selected:{' '}
                      <strong className="text-emerald-700">
                        {programApplicants.filter((a) => a.status === 'SELECTED').length}
                      </strong>
                    </span>
                  </div>

                  {programApplicants.map((app) => {
                    const isCapacityFull =
                      Boolean(
                        selectedProgramForApplicants.capacity &&
                          (selectedProgramForApplicants.enrolledCount || 0) >=
                            selectedProgramForApplicants.capacity
                      );
                    const isUpdating = updatingApplicantId === app.id;

                    return (
                      <div
                        key={app.id}
                        className="p-4 bg-white rounded-xl border border-[#14131F]/10 hover:border-[#14131F]/20 transition-all space-y-3 shadow-2xs"
                      >
                        {/* Student Profile Row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-display font-bold text-sm text-[#14131F]">
                                {app.student.name}
                              </h4>
                              {app.student.email && (
                                <span className="text-xs text-[#4338CA] bg-[#4338CA]/5 px-2 py-0.5 rounded border border-[#4338CA]/15">
                                  {app.student.email}
                                </span>
                              )}
                              {app.student.targetRole && (
                                <span className="text-[11px] font-semibold text-[#14131F]/75 bg-[#14131F]/5 px-2 py-0.5 rounded">
                                  {app.student.targetRole}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#14131F]/60 flex-wrap">
                              {app.student.college && (
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-[#14131F]/40" />
                                  {app.student.college}
                                </span>
                              )}
                              {app.student.degree && <span>• {app.student.degree}</span>}
                              {app.student.cgpa != null && (
                                <span>• CGPA: <strong>{app.student.cgpa}</strong></span>
                              )}
                              {app.student.graduationYear && (
                                <span>• Batch {app.student.graduationYear}</span>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0 flex items-center gap-2">
                            {app.status === 'APPLIED' && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Applied
                              </span>
                            )}
                            {app.status === 'UNDER_REVIEW' && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Under Review
                              </span>
                            )}
                            {app.status === 'SELECTED' && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Selected / Enrolled
                              </span>
                            )}
                            {app.status === 'REJECTED' && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                Not Selected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Statement of interest / motivation */}
                        {app.message && (
                          <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#14131F]/6 text-xs text-[#14131F]/80">
                            <span className="font-semibold text-[#14131F] block mb-0.5">
                              Statement of Interest / Motivation:
                            </span>
                            <p className="leading-relaxed whitespace-pre-wrap">{app.message}</p>
                          </div>
                        )}

                        {/* Skills pills */}
                        {app.student.skills && app.student.skills.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-[#14131F]/50 font-medium">Skills:</span>
                            {app.student.skills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]/70 border border-[#14131F]/10"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="pt-2 border-t border-[#14131F]/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <span className="text-[#14131F]/50 text-[11px]">
                            Applied on {new Date(app.createdAt).toLocaleDateString()}
                            {app.reviewedAt && ` • Reviewed on ${new Date(app.reviewedAt).toLocaleDateString()}`}
                          </span>

                          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                            {app.status === 'APPLIED' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleUpdateApplicantStatus(app.id, 'UNDER_REVIEW')}
                                className="text-xs py-1 px-2.5"
                              >
                                {isUpdating ? 'Updating...' : 'Mark Under Review'}
                              </Button>
                            )}

                            {(app.status === 'APPLIED' || app.status === 'UNDER_REVIEW') && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateApplicantStatus(app.id, 'REJECTED')}
                                  className="text-xs py-1 px-2.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50"
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={isUpdating || isCapacityFull}
                                  onClick={() => handleUpdateApplicantStatus(app.id, 'SELECTED')}
                                  icon={
                                    isUpdating ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )
                                  }
                                  className="text-xs py-1 px-3 !bg-emerald-600 hover:!bg-emerald-700 text-white"
                                  title={isCapacityFull ? 'Maximum cohort capacity reached' : 'Select for cohort'}
                                >
                                  {isCapacityFull ? 'Capacity Full' : 'Select & Enroll'}
                                </Button>
                              </>
                            )}

                            {app.status === 'SELECTED' && (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Enrolled in Cohort
                              </span>
                            )}

                            {app.status === 'REJECTED' && (
                              <span className="text-[11px] font-medium text-[#14131F]/50">
                                Application closed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#14131F]/8 bg-[#FAFAF8] flex items-center justify-between">
              <span className="text-xs text-[#14131F]/60">
                Industry Partner Program Review • Authorized Mentor Access
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedProgramForApplicants(null);
                  setProgramApplicants([]);
                  setApplicantActionError(null);
                  setApplicantActionSuccess(null);
                }}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
