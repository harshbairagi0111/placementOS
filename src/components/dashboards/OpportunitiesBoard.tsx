import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  SectionHeading,
  Badge,
  ListRow,
  RecordCard,
  LedgerContainer,
  Button,
} from '../ui';
import {
  Briefcase,
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  X,
  RefreshCw,
  Check,
  Clock,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Eye,
  Award,
} from 'lucide-react';
import { BadgeVariant } from '../ui/Badge';
import {
  MatchCategory,
  MATCH_CATEGORY_LABELS,
  SkillGapItem,
} from '../../lib/skillGapService';

export interface JobOpportunity {
  id: string;
  _id?: string;
  company: string;
  title: string;
  type: 'Job' | 'Internship' | 'Apprenticeship';
  ctc?: string;
  stipend?: string;
  duration?: string;
  location?: string;
  description?: string;
  cutoffPct?: number;
  openPositions?: number;
  requiredSkills?: any[];
  alreadyApplied?: boolean;
  applicationStatus?: string;
  applicantsCount?: number;
  status?: string;
  createdAt?: string;

  // Recommendation properties from centralized calculation
  matchPercentage?: number | null;
  hasRequirements?: boolean;
  matchCategory?: MatchCategory;
  matchCategoryLabel?: string;
  strengths?: string[];
  needsImprovement?: string[];
  gaps?: string[];
  notAssessed?: string[];
  prioritySkills?: string[];
  detailedBreakdown?: SkillGapItem[];
  explanation?: string;
  targetRoleMatch?: boolean;
}

export type ProgramCategory =
  | 'All'
  | 'Certification'
  | 'Workshop'
  | 'Training Program'
  | 'Mentorship'
  | 'Guest Lecture'
  | 'Innovation Challenge';

export interface StudentLearningProgram {
  _id?: string;
  id?: string;
  recruiterId?: string;
  company: string;
  title: string;
  type:
    | 'Certification'
    | 'Workshop'
    | 'Training Program'
    | 'Mentorship'
    | 'Guest Lecture'
    | 'Innovation Challenge';
  description?: string;
  skillsCovered?: string[];
  duration?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  capacity?: number;
  enrolledCount?: number;
  status?: string;
  alreadyApplied?: boolean;
  applicationStatus?: 'APPLIED' | 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED' | null;
  applicationId?: string | null;
  createdAt?: string | Date;
}

export interface StudentLearningProgramApplicationItem {
  id: string;
  status: 'APPLIED' | 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED';
  message?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  reviewedAt?: string | Date;
  program: StudentLearningProgram;
}

type OpportunityFilter = 'All' | 'Job' | 'Internship' | 'Apprenticeship';

export const OpportunitiesBoard: React.FC = () => {
  const authContext = useAuth();
  const token = authContext?.token;
  const user = authContext?.user;

  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSkillProfile, setHasSkillProfile] = useState<boolean>(true);
  const [userTargetRole, setUserTargetRole] = useState<string | null>(null);
  const [selectedOpportunityForDetails, setSelectedOpportunityForDetails] = useState<JobOpportunity | null>(null);

  // Filter state
  const [selectedType, setSelectedType] = useState<OpportunityFilter>('All');
  const [viewMode, setViewMode] = useState<'ledger' | 'cards'>('ledger');

  // Application tracking state
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const fetchOpportunities = async (filter: OpportunityFilter) => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url =
        filter === 'All'
          ? '/api/students/me/jobs'
          : `/api/students/me/jobs?type=${encodeURIComponent(filter)}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load opportunities (${res.status})`);
      }

      const data = await res.json();
      const fetchedJobs: JobOpportunity[] = data.jobs || data.recommendations || [];
      setJobs(fetchedJobs);

      if (typeof data.hasSkillProfile === 'boolean') {
        setHasSkillProfile(data.hasSkillProfile);
      }
      if (data.userTargetRole) {
        setUserTargetRole(data.userTargetRole);
      }

      // Initialize applied set
      const appliedSet = new Set<string>();
      fetchedJobs.forEach((j) => {
        if (j.alreadyApplied) {
          appliedSet.add(j.id);
        }
      });
      setAppliedJobIds(appliedSet);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setError(err.message || 'Unable to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities(selectedType);
  }, [selectedType, token]);

  // Top-level board section switcher: 'jobs' | 'programs'
  const [boardSection, setBoardSection] = useState<'jobs' | 'programs'>('jobs');

  // Workshops & Learning Programs state
  const [programs, setPrograms] = useState<StudentLearningProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState<boolean>(false);
  const [programsError, setProgramsError] = useState<string | null>(null);
  const [selectedProgramType, setSelectedProgramType] = useState<ProgramCategory>('All');
  const [programViewMode, setProgramViewMode] = useState<'cards' | 'ledger'>('cards');

  // Learning Program Applications & Tracking state
  const [programSubTab, setProgramSubTab] = useState<'browse' | 'my-applications'>('browse');
  const [studentProgramApplications, setStudentProgramApplications] = useState<StudentLearningProgramApplicationItem[]>([]);
  const [loadingProgramApplications, setLoadingProgramApplications] = useState<boolean>(false);
  const [programApplicationsError, setProgramApplicationsError] = useState<string | null>(null);

  // Application modal state
  const [programToApply, setProgramToApply] = useState<StudentLearningProgram | null>(null);
  const [applyMotivation, setApplyMotivation] = useState<string>('');
  const [submittingProgramApplication, setSubmittingProgramApplication] = useState<boolean>(false);
  const [programApplyError, setProgramApplyError] = useState<string | null>(null);
  const [programApplySuccess, setProgramApplySuccess] = useState<string | null>(null);

  const fetchStudentProgramApplications = async () => {
    setLoadingProgramApplications(true);
    setProgramApplicationsError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/students/learning-program-applications', { headers });
      if (!res.ok) {
        throw new Error(`Failed to load applications (${res.status})`);
      }
      const data = await res.json();
      setStudentProgramApplications(data.applications || []);
    } catch (err: any) {
      console.error('Error fetching student program applications:', err);
      setProgramApplicationsError(err.message || 'Unable to load program applications');
    } finally {
      setLoadingProgramApplications(false);
    }
  };

  const handleSubmitProgramApplication = async () => {
    if (!programToApply) return;
    const progId = programToApply._id || programToApply.id;
    if (!progId) return;

    setSubmittingProgramApplication(true);
    setProgramApplyError(null);
    setProgramApplySuccess(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students/learning-programs/${progId}/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: applyMotivation.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setProgramApplySuccess('Application submitted successfully!');

      // Update local program list
      setPrograms((prev) =>
        prev.map((p) =>
          (p._id || p.id) === progId
            ? {
                ...p,
                alreadyApplied: true,
                applicationStatus: 'APPLIED',
                applicationId: data.application?.id,
              }
            : p
        )
      );

      // Refresh applications
      fetchStudentProgramApplications();

      setTimeout(() => {
        setProgramToApply(null);
        setApplyMotivation('');
        setProgramApplySuccess(null);
      }, 1200);
    } catch (err: any) {
      console.error('Error applying to learning program:', err);
      setProgramApplyError(err.message || 'Failed to submit application');
    } finally {
      setSubmittingProgramApplication(false);
    }
  };

  const fetchPrograms = async (category: ProgramCategory) => {
    setProgramsLoading(true);
    setProgramsError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url =
        category === 'All'
          ? '/api/students/learning-programs'
          : `/api/students/learning-programs?type=${encodeURIComponent(category)}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load learning programs (${res.status})`);
      }

      const data = await res.json();
      setPrograms(data.programs || []);
    } catch (err: any) {
      console.error('Error fetching learning programs:', err);
      setProgramsError(err.message || 'Unable to load learning programs');
    } finally {
      setProgramsLoading(false);
    }
  };

  useEffect(() => {
    if (boardSection === 'programs') {
      fetchPrograms(selectedProgramType);
      fetchStudentProgramApplications();
    }
  }, [boardSection, selectedProgramType, token]);

  const handleApply = async (jobId: string, title: string, company: string) => {
    setApplyingId(jobId);
    setApplicationError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. First attempt the primary student job application route:
      // POST /api/students/me/jobs/:jobId/apply
      let res = await fetch(`/api/students/me/jobs/${encodeURIComponent(jobId)}/apply`, {
        method: 'POST',
        headers,
      });

      // 2. Fall back to generic /api/applications endpoint if 404
      if (res.status === 404) {
        res = await fetch('/api/applications', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jobPostingId: jobId,
            notes: 'Direct student application via placementOS Board',
          }),
        });
      }

      if (res.ok) {
        setAppliedJobIds((prev) => {
          const next = new Set(prev);
          next.add(jobId);
          return next;
        });

        // Also update local list so state persists across tab views
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, alreadyApplied: true } : j))
        );

        setConfirmationNotice(
          `Application registered for ${title} at ${company}. Status: Under Review.`
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Application failed with status ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error applying to job:', err);
      setApplicationError(err.message || 'Failed to submit application');
    } finally {
      setApplyingId(null);
    }
  };

  const getBadgeVariant = (type: string): 'positive' | 'verified' | 'neutral' => {
    if (type === 'Internship') return 'positive';
    if (type === 'Apprenticeship') return 'verified';
    return 'neutral';
  };

  const getMatchBadgeVariant = (matchPct: number | null | undefined): BadgeVariant => {
    if (matchPct === null || matchPct === undefined) return 'muted';
    if (matchPct >= 80) return 'positive';
    if (matchPct >= 65) return 'verified';
    if (matchPct >= 50) return 'neutral';
    return 'warning';
  };

  const renderMatchBadge = (job: JobOpportunity) => {
    if (job.matchPercentage === null || job.matchPercentage === undefined || job.hasRequirements === false) {
      return (
        <Badge variant="muted" size="sm" title="Skill requirements not configured for this opportunity">
          Skill requirements not configured
        </Badge>
      );
    }

    return (
      <Badge
        variant={getMatchBadgeVariant(job.matchPercentage)}
        size="sm"
        icon={<TrendingUp className="w-3 h-3 text-[#14131F]" />}
      >
        {job.matchPercentage}% Match
      </Badge>
    );
  };

  // Evaluate candidate CGPA against job cutoff percentage
  const checkCutoff = (cutoffPct?: number) => {
    if (typeof cutoffPct !== 'number' || cutoffPct <= 0) return null;
    const userCgpa = user?.cgpa;
    if (userCgpa == null) {
      return { meets: true, text: `Min. ${cutoffPct}% CGPA` };
    }
    const studentPct = userCgpa <= 10 ? userCgpa * 10 : userCgpa;
    const meets = studentPct >= cutoffPct;
    return {
      meets,
      text: meets
        ? `Eligible (Min. ${cutoffPct}%)`
        : `Below Cutoff (${studentPct.toFixed(0)}% vs ${cutoffPct}%)`,
    };
  };

  const formatPostedDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return `Posted ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    } catch {
      return null;
    }
  };

  const FILTER_BUTTONS: Array<{ label: string; value: OpportunityFilter }> = [
    { label: 'All Opportunities', value: 'All' },
    { label: 'Full-time Jobs', value: 'Job' },
    { label: 'Internships', value: 'Internship' },
    { label: 'Apprenticeships', value: 'Apprenticeship' },
  ];

  const PROGRAM_FILTERS: Array<{ label: string; value: ProgramCategory }> = [
    { label: 'All Programs', value: 'All' },
    { label: 'Certifications', value: 'Certification' },
    { label: 'Workshops', value: 'Workshop' },
    { label: 'Training Programs', value: 'Training Program' },
    { label: 'Mentorship', value: 'Mentorship' },
    { label: 'Guest Lectures', value: 'Guest Lecture' },
    { label: 'Innovation Challenges', value: 'Innovation Challenge' },
  ];

  const getProgramBadgeVariant = (type: string): BadgeVariant => {
    switch (type) {
      case 'Certification':
        return 'verified';
      case 'Workshop':
        return 'positive';
      case 'Training Program':
        return 'neutral';
      case 'Mentorship':
        return 'success';
      case 'Guest Lecture':
        return 'muted';
      case 'Innovation Challenge':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top-Level Board Section Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
        <div className="inline-flex p-1 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl text-xs font-sans">
          <button
            type="button"
            onClick={() => setBoardSection('jobs')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-2 ${
              boardSection === 'jobs'
                ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                : 'text-[#14131F]/60 hover:text-[#14131F]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Jobs & Internships
          </button>
          <button
            type="button"
            onClick={() => setBoardSection('programs')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-2 ${
              boardSection === 'programs'
                ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                : 'text-[#14131F]/60 hover:text-[#14131F]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Workshops & Programs
          </button>
        </div>
      </div>

      {boardSection === 'jobs' ? (
        <>
          {/* Header */}
          <SectionHeading
            level="h2"
            title="Jobs & Internships Board"
            subtitle="Explore active campus recruiting drives, full-time engineering roles, internships, and apprenticeships. Apply directly with your verified student profile."
            action={
              <Badge variant="verified" size="md">
                Verified Placements
              </Badge>
            }
            divider
          />

      {/* Confirmation Notification Toast (Indigo & Lime System) */}
      {confirmationNotice && (
        <div className="p-4 bg-[#FAFAF8] text-[#14131F] rounded-xl border border-[#A3E635]/50 shadow-xs flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#A3E635]/25 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#14131F]" />
            </div>
            <div className="space-y-0.5">
              <span className="font-semibold text-[#14131F] block">Application Successfully Submitted</span>
              <span className="text-[#14131F]/70">{confirmationNotice}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmationNotice(null)}
            className="text-[#14131F]/50 hover:text-[#14131F] cursor-pointer p-1.5 rounded-lg hover:bg-[#14131F]/5 transition-colors"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {applicationError && (
        <div className="p-4 bg-[#FAFAF8] border border-[#FB7185]/30 text-[#14131F] rounded-xl flex items-center justify-between text-xs font-sans shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#FB7185]/15 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-[#FB7185]" />
            </div>
            <div className="space-y-0.5">
              <span className="font-semibold text-[#14131F] block">Submission Alert</span>
              <span className="text-[#14131F]/70">{applicationError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApplicationError(null)}
            className="text-xs font-semibold text-[#FB7185] hover:underline cursor-pointer px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 17: No Assessment State Banner */}
      {!hasSkillProfile && (
        <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-[#4338CA]/25 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 flex items-center justify-center shrink-0 text-[#4338CA] mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-display font-semibold text-sm text-[#14131F] block">
                Personalized Recommendations Unavailable
              </span>
              <p className="text-[#14131F]/70 leading-relaxed max-w-xl">
                Complete your skill assessment to get personalized job and internship recommendations ranked by your verified competencies.
              </p>
            </div>
          </div>
          <a
            href="/student-dashboard?tab=assessment"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white font-medium rounded-xl transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Take Assessment</span>
          </a>
        </div>
      )}

      {/* Target Role Guidance Banner if student has target role */}
      {userTargetRole && (
        <div className="px-4 py-2.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex items-center justify-between gap-2 text-xs font-sans text-[#14131F]/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
            <span>
              Opportunities ranked for your target profile: <strong className="text-[#14131F]">{userTargetRole}</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#14131F]/50 hidden sm:inline">Centralized Skill-Gap Evaluation</span>
        </div>
      )}

      {/* Toolbar: Segmented Controls for Filtering and Layout Mode */}
      <div className="p-4 bg-white border border-[#14131F]/8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* Type Filter Segmented Control */}
        <div className="inline-flex p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs font-sans flex-wrap">
          {FILTER_BUTTONS.map((btn) => {
            const isActive = selectedType === btn.value;
            return (
              <button
                key={btn.value}
                type="button"
                onClick={() => setSelectedType(btn.value)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                    : 'text-[#14131F]/60 hover:text-[#14131F]'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Segmented Control & Openings Counter */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="text-xs text-[#14131F]/60 font-sans">
            <span className="font-semibold text-[#14131F]">{jobs.length}</span>{' '}
            {jobs.length === 1 ? 'opening' : 'openings'} listed
          </span>

          <div className="inline-flex p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('ledger')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-white text-[#14131F] shadow-xs'
                  : 'text-[#14131F]/50 hover:text-[#14131F]'
              }`}
              title="Ledger view"
              aria-label="Ledger view"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#14131F] shadow-xs'
                  : 'text-[#14131F]/50 hover:text-[#14131F]'
              }`}
              title="Cards view"
              aria-label="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error state on fetch failure */}
      {error && !loading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#FB7185]/30 text-[#14131F] space-y-3 font-sans shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#FB7185]/10 text-[#FB7185] flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-[#14131F]">
              Unable to Load Opportunities
            </h4>
            <p className="text-xs text-[#14131F]/70 max-w-md mx-auto">{error}</p>
          </div>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchOpportunities(selectedType)}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Loading
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8 space-y-3.5 shadow-xs">
          <div className="w-6 h-6 border-2 border-[#14131F]/15 border-t-[#4338CA] rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="font-display font-semibold text-sm text-[#14131F]">
              Loading Active Recruitment Drives...
            </p>
            <p className="text-xs text-[#14131F]/50 font-sans max-w-sm mx-auto">
              Fetching verified campus roles, CTC packages, and eligibility criteria.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8 space-y-3.5 font-sans shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#14131F]/5 flex items-center justify-center mx-auto text-[#14131F]/40">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-[#14131F]">
              {selectedType === 'All'
                ? 'No Active Placement Drives at the Moment'
                : `No Active ${selectedType === 'Job' ? 'Full-Time Jobs' : selectedType === 'Internship' ? 'Internships' : 'Apprenticeships'} Found`}
            </h3>
            <p className="text-xs text-[#14131F]/60 max-w-md mx-auto leading-relaxed">
              {selectedType === 'All'
                ? 'Campus placement drives have not published active job openings yet. Check back soon or refresh to re-evaluate new postings.'
                : `There are currently no active listings filtered under "${selectedType}". Try viewing all opportunities or check back later.`}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            {selectedType !== 'All' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedType('All')}
              >
                View All Categories
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchOpportunities(selectedType)}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* LEDGER VIEW */}
      {!loading && !error && jobs.length > 0 && viewMode === 'ledger' && (
        <LedgerContainer
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#4338CA]" />
                <span className="font-display font-semibold text-xs text-[#14131F]">
                  Active Opportunities Ledger ({jobs.length})
                </span>
              </div>
              <span className="text-xs text-[#14131F]/60 font-sans">
                Direct Campus Verification
              </span>
            </div>
          }
        >
          {jobs.map((job, idx) => {
            const isApplied = Boolean(job.alreadyApplied || appliedJobIds.has(job.id));
            const isApplying = applyingId === job.id;
            const cutoffInfo = checkCutoff(job.cutoffPct);
            const postedDate = formatPostedDate(job.createdAt);

            const compensationText =
              job.type === 'Job'
                ? job.ctc || 'Competitive CTC'
                : job.stipend || job.ctc || 'Stipend provided';

            return (
              <ListRow
                key={job.id}
                isLast={idx === jobs.length - 1}
                title={
                  <span className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-display font-bold text-sm text-[#14131F]">
                      {job.title}
                    </span>
                    <Badge variant={getBadgeVariant(job.type)} size="sm">
                      {job.type}
                    </Badge>
                    {renderMatchBadge(job)}
                    {job.targetRoleMatch && (
                      <Badge variant="verified" size="sm">
                        Target Role Match
                      </Badge>
                    )}
                    {cutoffInfo && (
                      <Badge variant={cutoffInfo.meets ? 'neutral' : 'warning'} size="sm">
                        {cutoffInfo.text}
                      </Badge>
                    )}
                  </span>
                }
                subtitle={
                  <span className="block space-y-1.5 mt-1.5">
                    <span className="flex items-center gap-2 flex-wrap text-[#14131F]/65 text-xs font-sans">
                      <span className="font-semibold text-[#14131F] flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#14131F]/50" />
                        {job.company}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-[#14131F]">
                        {compensationText}
                        {job.type !== 'Job' && job.duration ? ` (${job.duration})` : ''}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#14131F]/50" />
                        {job.location || 'Remote / Hybrid'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#14131F]/50" />
                        {job.openPositions || 1}{' '}
                        {job.openPositions === 1 ? 'seat' : 'seats'}
                      </span>
                      {postedDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#14131F]/50">
                            <Clock className="w-3 h-3 text-[#14131F]/40" />
                            {postedDate}
                          </span>
                        </>
                      )}
                    </span>

                    {/* Section 15: Recommendation Breakdown Highlights */}
                    {(job.strengths?.length || job.needsImprovement?.length || job.gaps?.length) ? (
                      <div className="flex items-center gap-3 flex-wrap pt-0.5 text-xs">
                        {job.strengths && job.strengths.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[#16A34A] font-medium">
                            <Check className="w-3 h-3" />
                            <span>Strong: {job.strengths.slice(0, 3).join(', ')}</span>
                          </span>
                        )}
                        {job.needsImprovement && job.needsImprovement.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[#D97706] font-medium">
                            <span>⚠ Improve: {job.needsImprovement.slice(0, 2).join(', ')}</span>
                          </span>
                        )}
                        {job.gaps && job.gaps.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[#E11D48] font-medium">
                            <span>✗ Gap: {job.gaps.slice(0, 2).join(', ')}</span>
                          </span>
                        )}
                      </div>
                    ) : null}

                    {/* Recommendation Rationale */}
                    {job.explanation && (
                      <p className="text-xs text-[#14131F]/70 italic pt-0.5">
                        Recommended because: {job.explanation}
                      </p>
                    )}
                  </span>
                }
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOpportunityForDetails(job)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Match Details
                    </Button>
                    {isApplied ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A3E635]/20 text-[#14131F] font-semibold text-xs border border-[#A3E635]/40 select-none">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
                        <span>Applied</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isApplying}
                        onClick={() => handleApply(job.id, job.title, job.company)}
                        className="bg-[#4338CA] hover:bg-[#3730A3] text-white"
                        icon={isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
                      >
                        {isApplying ? 'Submitting...' : 'Apply'}
                      </Button>
                    )}
                  </div>
                }
              />
            );
          })}
        </LedgerContainer>
      )}

      {/* CARDS VIEW */}
      {!loading && !error && jobs.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const isApplied = Boolean(job.alreadyApplied || appliedJobIds.has(job.id));
            const isApplying = applyingId === job.id;
            const cutoffInfo = checkCutoff(job.cutoffPct);
            const postedDate = formatPostedDate(job.createdAt);

            const compensationText =
              job.type === 'Job'
                ? job.ctc || 'Competitive CTC'
                : job.stipend || job.ctc || 'Stipend provided';

            return (
              <RecordCard
                key={job.id}
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-base text-[#14131F]">
                      {job.title}
                    </span>
                    <Badge variant={getBadgeVariant(job.type)} size="sm">
                      {job.type}
                    </Badge>
                  </div>
                }
                subtitle={
                  <span className="flex items-center gap-2 flex-wrap text-[#14131F]/60 text-xs font-sans mt-0.5">
                    <span className="font-semibold text-[#14131F] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#14131F]/50" />
                      {job.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#14131F]/50" />
                      {job.location || 'Remote / Hybrid'}
                    </span>
                  </span>
                }
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOpportunityForDetails(job)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Details
                    </Button>
                    {isApplied ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A3E635]/20 text-[#14131F] font-semibold text-xs border border-[#A3E635]/40 select-none">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
                        <span>Applied</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isApplying}
                        onClick={() => handleApply(job.id, job.title, job.company)}
                        className="bg-[#4338CA] hover:bg-[#3730A3] text-white"
                        icon={isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
                      >
                        {isApplying ? 'Submitting...' : 'Apply'}
                      </Button>
                    )}
                  </div>
                }
              >
                <div className="space-y-3 font-sans pt-1 text-xs">
                  {/* Decision-Relevant Highlights Row */}
                  <div className="flex items-center gap-2 flex-wrap pb-1">
                    {renderMatchBadge(job)}
                    {job.targetRoleMatch && (
                      <Badge variant="verified" size="sm">
                        Target Role Match
                      </Badge>
                    )}
                    {cutoffInfo && (
                      <Badge variant={cutoffInfo.meets ? 'neutral' : 'warning'} size="sm">
                        {cutoffInfo.text}
                      </Badge>
                    )}
                    {postedDate && (
                      <span className="text-[11px] text-[#14131F]/50 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3 text-[#14131F]/40" />
                        {postedDate}
                      </span>
                    )}
                  </div>

                  {/* Section 15: Recommendation Explanation */}
                  {job.explanation && (
                    <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 leading-relaxed text-[#14131F]/80">
                      <span className="font-semibold text-[#14131F] block text-[11px] mb-0.5">
                        Recommended because:
                      </span>
                      <p>{job.explanation}</p>
                    </div>
                  )}

                  {/* Section 15: Strengths, Needs Improvement, Gaps Badges */}
                  {(job.strengths?.length || job.needsImprovement?.length || job.gaps?.length) ? (
                    <div className="space-y-1.5 p-2.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6">
                      {job.strengths && job.strengths.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#16A34A] font-semibold text-[11px]">✓ Strong:</span>
                          {job.strengths.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-[#A3E635]/25 text-[#14131F] font-medium text-[11px] border border-[#A3E635]/40"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {job.needsImprovement && job.needsImprovement.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#D97706] font-semibold text-[11px]">⚠ Improve:</span>
                          {job.needsImprovement.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-[#FDE047]/30 text-[#854D0E] font-medium text-[11px] border border-[#FDE047]/50"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {job.gaps && job.gaps.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#E11D48] font-semibold text-[11px]">✗ Gap:</span>
                          {job.gaps.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-[#FB7185]/20 text-[#BE123C] font-medium text-[11px] border border-[#FB7185]/30"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Compensation & Openings Shelf */}
                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[#14131F]/50 text-[11px] font-medium block">
                        {job.type === 'Job' ? 'Package (CTC)' : 'Stipend'}
                      </span>
                      <span className="font-semibold text-sm text-[#14131F]">
                        {compensationText}
                      </span>
                      {job.type !== 'Job' && job.duration && (
                        <span className="text-[#14131F]/60 text-xs ml-1.5">
                          • {job.duration}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[#14131F]/50 text-[11px] font-medium block">
                        Openings
                      </span>
                      <span className="font-semibold text-sm text-[#14131F]">
                        {job.openPositions || 1} {job.openPositions === 1 ? 'seat' : 'seats'}
                      </span>
                    </div>
                  </div>

                  {job.description && (
                    <p className="text-xs text-[#14131F]/65 line-clamp-2 leading-relaxed pt-0.5">
                      {job.description}
                    </p>
                  )}

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px] text-[#14131F]/50">
                    <span>
                      <strong className="font-semibold text-[#14131F]">{job.applicantsCount || 0}</strong>{' '}
                      {job.applicantsCount === 1 ? 'applicant' : 'applicants'}
                    </span>
                    <span className="text-[#4338CA] font-medium">
                      Direct Placement Drive
                    </span>
                  </div>
                </div>
              </RecordCard>
            );
          })}
        </div>
      )}
        </>
      ) : (
        <>
          {/* Workshops & Programs Section */}
          <SectionHeading
            level="h2"
            title="Workshops & Programs Board"
            subtitle="Explore corporate certifications, technical workshops, hands-on industrial training, guest lectures, and innovation challenges published by industry partners."
            action={
              <Badge variant="positive" size="md">
                Industry Skill Programs
              </Badge>
            }
            divider
          />

          {/* Sub-tab switcher: Browse vs My Applications */}
          <div className="flex items-center justify-between border-b border-[#14131F]/10 pb-3 gap-3">
            <div className="inline-flex p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs font-sans">
              <button
                type="button"
                onClick={() => setProgramSubTab('browse')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  programSubTab === 'browse'
                    ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                    : 'text-[#14131F]/60 hover:text-[#14131F]'
                }`}
              >
                Browse Programs
              </button>
              <button
                type="button"
                onClick={() => {
                  setProgramSubTab('my-applications');
                  fetchStudentProgramApplications();
                }}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  programSubTab === 'my-applications'
                    ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                    : 'text-[#14131F]/60 hover:text-[#14131F]'
                }`}
              >
                <span>My Applications</span>
                {studentProgramApplications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#4338CA]/10 text-[#4338CA] font-bold">
                    {studentProgramApplications.length}
                  </span>
                )}
              </button>
            </div>

            {programSubTab === 'my-applications' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchStudentProgramApplications}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Refresh Status
              </Button>
            )}
          </div>

          {programSubTab === 'browse' ? (
            <>
          {/* Programs Toolbar: Segmented Controls for Category and Layout Mode */}
          <div className="p-4 bg-white border border-[#14131F]/8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            {/* Category Filter Segmented Control */}
            <div className="inline-flex p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs font-sans flex-wrap gap-0.5">
              {PROGRAM_FILTERS.map((btn) => {
                const isActive = selectedProgramType === btn.value;
                return (
                  <button
                    key={btn.value}
                    type="button"
                    onClick={() => setSelectedProgramType(btn.value)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                        : 'text-[#14131F]/60 hover:text-[#14131F]'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {/* View Mode Segmented Control & Counter */}
            <div className="flex items-center gap-3 self-end md:self-center">
              <span className="text-xs text-[#14131F]/60 font-sans">
                <span className="font-semibold text-[#14131F]">{programs.length}</span>{' '}
                {programs.length === 1 ? 'program' : 'programs'} listed
              </span>

              <div className="inline-flex p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs">
                <button
                  type="button"
                  onClick={() => setProgramViewMode('cards')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    programViewMode === 'cards'
                      ? 'bg-white text-[#14131F] shadow-xs'
                      : 'text-[#14131F]/50 hover:text-[#14131F]'
                  }`}
                  title="Cards view"
                  aria-label="Cards view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setProgramViewMode('ledger')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    programViewMode === 'ledger'
                      ? 'bg-white text-[#14131F] shadow-xs'
                      : 'text-[#14131F]/50 hover:text-[#14131F]'
                  }`}
                  title="Ledger view"
                  aria-label="Ledger view"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {programsError && !programsLoading && (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#FB7185]/30 text-[#14131F] space-y-3 font-sans shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#FB7185]/10 text-[#FB7185] flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-[#14131F]">
                  Unable to Load Learning Programs
                </h4>
                <p className="text-xs text-[#14131F]/70 max-w-md mx-auto">{programsError}</p>
              </div>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchPrograms(selectedProgramType)}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Loading
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {programsLoading && (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8 space-y-3.5 shadow-xs">
              <div className="w-6 h-6 border-2 border-[#14131F]/15 border-t-[#4338CA] rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-display font-semibold text-sm text-[#14131F]">
                  Loading Industry Learning Programs...
                </p>
                <p className="text-xs text-[#14131F]/50 font-sans max-w-sm mx-auto">
                  Fetching corporate certifications, hackathons, and industrial training cohorts.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!programsLoading && !programsError && programs.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8 space-y-3.5 font-sans shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#14131F]/5 flex items-center justify-center mx-auto text-[#14131F]/40">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-[#14131F]">
                  {selectedProgramType === 'All'
                    ? 'No Published Programs at the Moment'
                    : `No Active ${selectedProgramType} Programs Found`}
                </h3>
                <p className="text-xs text-[#14131F]/60 max-w-md mx-auto leading-relaxed">
                  {selectedProgramType === 'All'
                    ? 'Industry partners have not published active programs yet. Check back soon or refresh to re-evaluate new opportunities.'
                    : `There are currently no active programs listed under "${selectedProgramType}". Try viewing all programs or check back later.`}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                {selectedProgramType !== 'All' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedProgramType('All')}
                  >
                    View All Categories
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchPrograms(selectedProgramType)}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {/* CARDS VIEW */}
          {!programsLoading && !programsError && programs.length > 0 && programViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((prog, idx) => (
                <RecordCard
                  key={prog._id || prog.id || idx}
                  title={
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-base text-[#14131F]">
                        {prog.title}
                      </span>
                      <Badge variant={getProgramBadgeVariant(prog.type)} size="sm">
                        {prog.type}
                      </Badge>
                    </div>
                  }
                  subtitle={
                    <span className="flex items-center gap-2 flex-wrap text-[#14131F]/60 text-xs font-sans mt-0.5">
                      <span className="font-semibold text-[#14131F] flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#14131F]/50" />
                        {prog.company}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#14131F]/50" />
                        {prog.mode || 'Online'}
                      </span>
                      {prog.duration && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#14131F]/50" />
                            {prog.duration}
                          </span>
                        </>
                      )}
                    </span>
                  }
                  action={
                    <Badge variant="muted" size="sm">
                      Open for Browsing
                    </Badge>
                  }
                >
                  <div className="space-y-3 font-sans pt-1 text-xs">
                    {/* Shelf: Mode, Duration & Capacity */}
                    <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[#14131F]/50 text-[11px] font-medium block">
                          Format & Duration
                        </span>
                        <span className="font-semibold text-sm text-[#14131F]">
                          {prog.mode || 'Online'} • {prog.duration || 'Flexible Schedule'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#14131F]/50 text-[11px] font-medium block">
                          Cohort Capacity
                        </span>
                        <span className="font-semibold text-sm text-[#14131F]">
                          {prog.capacity
                            ? `${prog.enrolledCount ?? 0} / ${prog.capacity} seats`
                            : `${prog.enrolledCount ?? 0} enrolled`}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {prog.description && (
                      <p className="text-xs text-[#14131F]/70 line-clamp-2 leading-relaxed">
                        {prog.description}
                      </p>
                    )}

                    {/* Skills Covered */}
                    {prog.skillsCovered && prog.skillsCovered.length > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <span className="text-[#14131F]/60 font-medium block text-xs">
                          Skills & Competencies Covered
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {prog.skillsCovered.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAFAF8] text-[#14131F] border border-[#14131F]/10"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Meta & Application Action */}
                    <div className="pt-3 border-t border-[#14131F]/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-[#14131F]/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-[#14131F]/70">
                          <Users className="w-3.5 h-3.5 text-[#14131F]/40" />
                          <span>
                            {prog.enrolledCount ?? 0}
                            {prog.capacity ? ` / ${prog.capacity} enrolled` : ' enrolled'}
                          </span>
                        </span>
                        {prog.capacity && (prog.enrolledCount ?? 0) >= prog.capacity && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                            title="Applications may still be submitted; selection depends on available seats."
                          >
                            Seats Filled (Open for Applications)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {prog.alreadyApplied ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border">
                            {prog.applicationStatus === 'SELECTED' ? (
                              <span className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Enrolled in Cohort
                              </span>
                            ) : prog.applicationStatus === 'UNDER_REVIEW' ? (
                              <span className="bg-amber-50 text-amber-700 border-amber-200 px-2 py-0.5 rounded-full">
                                Under Review
                              </span>
                            ) : prog.applicationStatus === 'REJECTED' ? (
                              <span className="bg-rose-50 text-rose-700 border-rose-200 px-2 py-0.5 rounded-full">
                                Not Selected
                              </span>
                            ) : (
                              <span className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 rounded-full">
                                Application Submitted
                              </span>
                            )}
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={Boolean(prog.status) && prog.status !== 'Active'}
                            onClick={() => {
                              setProgramToApply(prog);
                              setApplyMotivation('');
                              setProgramApplyError(null);
                              setProgramApplySuccess(null);
                            }}
                            className="text-xs py-1 px-3"
                          >
                            {prog.status && prog.status !== 'Active' ? 'Inactive' : 'Apply Now'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </RecordCard>
              ))}
            </div>
          )}

          {/* LEDGER VIEW */}
          {!programsLoading && !programsError && programs.length > 0 && programViewMode === 'ledger' && (
            <LedgerContainer
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                    <span className="font-display font-semibold text-xs text-[#14131F]">
                      Workshops & Programs Ledger ({programs.length})
                    </span>
                  </div>
                  <span className="text-xs text-[#14131F]/60 font-sans">
                    Corporate Sponsored Learning
                  </span>
                </div>
              }
            >
              {programs.map((prog, idx) => (
                <ListRow
                  key={prog._id || prog.id || idx}
                  isLast={idx === programs.length - 1}
                  title={
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm text-[#14131F]">
                        {prog.title}
                      </span>
                      <Badge variant={getProgramBadgeVariant(prog.type)} size="sm">
                        {prog.type}
                      </Badge>
                    </div>
                  }
                  subtitle={
                    <div className="space-y-1.5 text-xs text-[#14131F]/60 font-sans mt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#14131F] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#14131F]/50" />
                          {prog.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#14131F]/50" />
                          {prog.mode || 'Online'}
                        </span>
                        {prog.duration && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#14131F]/50" />
                              {prog.duration}
                            </span>
                          </>
                        )}
                      </div>
                      {prog.description && (
                        <p className="text-xs text-[#14131F]/70 line-clamp-1">
                          {prog.description}
                        </p>
                      )}
                      {prog.skillsCovered && prog.skillsCovered.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {prog.skillsCovered.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FAFAF8] text-[#14131F] border border-[#14131F]/10"
                            >
                              {skill}
                            </span>
                          ))}
                          {prog.skillsCovered.length > 5 && (
                            <Badge variant="muted" size="sm">
                              +{prog.skillsCovered.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  }
                  metadata={
                    <div className="text-right text-xs">
                      <span className="text-[#14131F]/50 text-[11px] block">Capacity</span>
                      <span className="font-semibold text-sm text-[#14131F]">
                        {prog.capacity
                          ? `${prog.enrolledCount ?? 0} / ${prog.capacity}`
                          : `${prog.enrolledCount ?? 0} enrolled`}
                      </span>
                    </div>
                  }
                  action={
                    prog.alreadyApplied ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full border">
                        {prog.applicationStatus === 'SELECTED' ? (
                          <span className="text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Enrolled
                          </span>
                        ) : prog.applicationStatus === 'UNDER_REVIEW' ? (
                          <span className="text-amber-700 bg-amber-50 border-amber-200 px-2 py-0.5 rounded-full">
                            Under Review
                          </span>
                        ) : prog.applicationStatus === 'REJECTED' ? (
                          <span className="text-rose-700 bg-rose-50 border-rose-200 px-2 py-0.5 rounded-full">
                            Not Selected
                          </span>
                        ) : (
                          <span className="text-blue-700 bg-blue-50 border-blue-200 px-2 py-0.5 rounded-full">
                            Applied
                          </span>
                        )}
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={Boolean(prog.status) && prog.status !== 'Active'}
                        onClick={() => {
                          setProgramToApply(prog);
                          setApplyMotivation('');
                          setProgramApplyError(null);
                          setProgramApplySuccess(null);
                        }}
                        className="text-xs py-1 px-3"
                      >
                        {prog.status && prog.status !== 'Active' ? 'Closed' : 'Apply'}
                      </Button>
                    )
                  }
                />
              ))}
            </LedgerContainer>
          )}
          </>
          ) : (
            /* MY APPLICATIONS & TRACKING SUB-VIEW */
            <div className="space-y-4">
              {loadingProgramApplications ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8 space-y-3.5 shadow-xs">
                  <div className="w-6 h-6 border-2 border-[#14131F]/15 border-t-[#4338CA] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#14131F]/60">Loading your learning program applications...</p>
                </div>
              ) : programApplicationsError ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-red-200 text-[#14131F] space-y-3 font-sans shadow-xs">
                  <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                  <p className="text-xs text-red-700 font-medium">{programApplicationsError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={fetchStudentProgramApplications}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : studentProgramApplications.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8 space-y-3 font-sans shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#14131F]/5 flex items-center justify-center mx-auto text-[#14131F]/40">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-[#14131F]">
                    No Applications Submitted Yet
                  </h3>
                  <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto leading-relaxed">
                    You haven&apos;t applied to any industry learning programs yet. Browse active certifications, workshops, and training tracks to apply.
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setProgramSubTab('browse')}
                      className="text-xs"
                    >
                      Browse Available Programs
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentProgramApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 bg-white rounded-2xl border border-[#14131F]/8 shadow-xs hover:border-[#14131F]/15 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-display font-bold text-base text-[#14131F]">
                              {app.program.title}
                            </h4>
                            <Badge variant={getProgramBadgeVariant(app.program.type)} size="sm">
                              {app.program.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#14131F]/65 flex-wrap">
                            <span className="font-semibold text-[#14131F] flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-[#14131F]/50" />
                              {app.program.company}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#14131F]/50" />
                              {app.program.mode || 'Online'}
                            </span>
                            {app.program.duration && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#14131F]/50" />
                                  {app.program.duration}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status pill */}
                        <div className="shrink-0">
                          {app.status === 'APPLIED' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3" />
                              Application Submitted
                            </span>
                          )}
                          {app.status === 'UNDER_REVIEW' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Under Review by Partner
                            </span>
                          )}
                          {app.status === 'SELECTED' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Selected • Enrolled in Cohort
                            </span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Not Selected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* If Selected, congratulatory banner */}
                      {app.status === 'SELECTED' && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>
                            <strong>Cohort Seat Confirmed:</strong> Congratulations! The industry partner has selected your application for this cohort.
                          </span>
                        </div>
                      )}

                      {/* Student's submitted message */}
                      {app.message && (
                        <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 text-xs text-[#14131F]/80">
                          <span className="font-semibold text-[#14131F] block mb-0.5">
                            Your Statement of Interest:
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{app.message}</p>
                        </div>
                      )}

                      {/* Footer tracking timestamps */}
                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px] text-[#14131F]/50">
                        <span>Applied on {new Date(app.createdAt).toLocaleDateString()}</span>
                        {app.reviewedAt && (
                          <span>Status updated on {new Date(app.reviewedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Section 16: Match Details Modal */}
      {selectedOpportunityForDetails && (
        <div
          id="match-details-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs font-sans"
          onClick={() => setSelectedOpportunityForDetails(null)}
        >
          <div
            id="match-details-dialog"
            className="bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#14131F]/8 flex items-start justify-between gap-4 bg-[#FAFAF8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-lg text-[#14131F]">
                    {selectedOpportunityForDetails.title}
                  </h3>
                  <Badge variant={getBadgeVariant(selectedOpportunityForDetails.type)} size="sm">
                    {selectedOpportunityForDetails.type}
                  </Badge>
                  {renderMatchBadge(selectedOpportunityForDetails)}
                  {selectedOpportunityForDetails.targetRoleMatch && (
                    <Badge variant="verified" size="sm">
                      Target Role Match
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#14131F]/65 flex-wrap">
                  <span className="font-semibold text-[#14131F] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#14131F]/50" />
                    {selectedOpportunityForDetails.company}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#14131F]/50" />
                    {selectedOpportunityForDetails.location || 'Remote / Hybrid'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-[#14131F]">
                    {selectedOpportunityForDetails.type === 'Job'
                      ? selectedOpportunityForDetails.ctc || 'Competitive CTC'
                      : selectedOpportunityForDetails.stipend || selectedOpportunityForDetails.ctc || 'Stipend provided'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="close-match-details-btn"
                onClick={() => setSelectedOpportunityForDetails(null)}
                className="p-1.5 text-[#14131F]/50 hover:text-[#14131F] hover:bg-[#14131F]/5 rounded-lg transition-colors cursor-pointer"
                aria-label="Close match details dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#14131F]">
              {/* Recommendation Narrative */}
              {selectedOpportunityForDetails.explanation && (
                <div className="p-3.5 bg-[#4338CA]/5 border border-[#4338CA]/15 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#4338CA]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommendation Rationale</span>
                  </div>
                  <p className="text-[#14131F]/85 leading-relaxed text-xs">
                    {selectedOpportunityForDetails.explanation}
                  </p>
                </div>
              )}

              {/* Section 16 Detailed Requirements Evaluation Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[#14131F]">
                    Required Competencies Evaluation
                  </h4>
                  <span className="text-[11px] text-[#14131F]/60">
                    {selectedOpportunityForDetails.detailedBreakdown?.length || 0} benchmark skills evaluated
                  </span>
                </div>

                {(!selectedOpportunityForDetails.detailedBreakdown ||
                  selectedOpportunityForDetails.detailedBreakdown.length === 0) ? (
                  <div className="p-6 text-center bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-[#14131F]/60">
                    Skill requirements not configured for this opportunity.
                  </div>
                ) : (
                  <div className="border border-[#14131F]/8 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAFAF8] border-b border-[#14131F]/8 text-[11px] font-semibold text-[#14131F]/70 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Skill</th>
                          <th className="py-2.5 px-3">Importance</th>
                          <th className="py-2.5 px-3 text-center">Your Level</th>
                          <th className="py-2.5 px-3 text-center">Required</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#14131F]/6 text-xs">
                        {selectedOpportunityForDetails.detailedBreakdown.map((item, i) => (
                          <tr key={`${item.skill}-${i}`} className="hover:bg-[#FAFAF8]/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-[#14131F]">
                              <div>{item.skill}</div>
                              <div className="text-[10px] text-[#14131F]/50 font-normal capitalize">
                                {item.category} competency
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                  item.importance === 'required'
                                    ? 'bg-[#14131F]/8 text-[#14131F]'
                                    : item.importance === 'recommended'
                                    ? 'bg-[#4338CA]/10 text-[#4338CA]'
                                    : 'bg-[#14131F]/4 text-[#14131F]/60'
                                }`}
                              >
                                {item.importance}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-medium">
                              {item.studentScore !== null && item.studentScore !== undefined
                                ? item.studentScore
                                : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[#14131F]/70">
                              {item.requiredLevel}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  item.status === 'STRONG'
                                    ? 'bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/50'
                                    : item.status === 'NEEDS_IMPROVEMENT'
                                    ? 'bg-[#FDE047]/30 text-[#854D0E] border border-[#FDE047]/60'
                                    : item.status === 'GAP'
                                    ? 'bg-[#FB7185]/20 text-[#BE123C] border border-[#FB7185]/40'
                                    : 'bg-[#14131F]/6 text-[#14131F]/60 border border-[#14131F]/10'
                                }`}
                              >
                                {item.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Priority Skills Focus Box */}
              {selectedOpportunityForDetails.prioritySkills && selectedOpportunityForDetails.prioritySkills.length > 0 && (
                <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5">
                  <span className="font-semibold text-xs text-[#14131F] block">
                    Priority Skills to Target for this Opportunity:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedOpportunityForDetails.prioritySkills.map((ps) => (
                      <span
                        key={ps}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#14131F]/15 font-medium text-xs text-[#14131F]"
                      >
                        {ps}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#14131F]/8 bg-[#FAFAF8] flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                id="close-details-footer-btn"
                onClick={() => setSelectedOpportunityForDetails(null)}
              >
                Close
              </Button>
              {Boolean(
                selectedOpportunityForDetails.alreadyApplied ||
                  appliedJobIds.has(selectedOpportunityForDetails.id)
              ) ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A3E635]/20 text-[#14131F] font-semibold text-xs border border-[#A3E635]/40 select-none">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
                  <span>
                    Application {selectedOpportunityForDetails.applicationStatus || 'Submitted'}
                  </span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  id="modal-apply-btn"
                  disabled={applyingId === selectedOpportunityForDetails.id}
                  onClick={() => {
                    handleApply(
                      selectedOpportunityForDetails.id,
                      selectedOpportunityForDetails.title,
                      selectedOpportunityForDetails.company
                    );
                  }}
                  className="bg-[#4338CA] hover:bg-[#3730A3] text-white"
                  icon={
                    applyingId === selectedOpportunityForDetails.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : undefined
                  }
                >
                  {applyingId === selectedOpportunityForDetails.id ? 'Submitting...' : 'Apply Now'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Learning Program Application Modal */}
      {programToApply && (
        <div
          id="apply-program-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs font-sans animate-in fade-in"
          onClick={() => {
            if (!submittingProgramApplication) {
              setProgramToApply(null);
              setApplyMotivation('');
              setProgramApplyError(null);
              setProgramApplySuccess(null);
            }
          }}
        >
          <div
            id="apply-program-dialog"
            className="bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl max-w-lg w-full overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#14131F]/8 flex items-start justify-between gap-4 bg-[#FAFAF8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-lg text-[#14131F]">
                    Apply to Program
                  </h3>
                  <Badge variant={getProgramBadgeVariant(programToApply.type)} size="sm">
                    {programToApply.type}
                  </Badge>
                </div>
                <p className="text-xs text-[#14131F]/65">
                  Submit your candidate application directly to the industry sponsor.
                </p>
              </div>

              <button
                type="button"
                id="close-apply-program-modal-btn"
                disabled={submittingProgramApplication}
                onClick={() => {
                  setProgramToApply(null);
                  setApplyMotivation('');
                  setProgramApplyError(null);
                  setProgramApplySuccess(null);
                }}
                className="p-1.5 text-[#14131F]/50 hover:text-[#14131F] hover:bg-[#14131F]/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs font-sans">
              {/* Program Snapshot Card */}
              <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[#14131F]">
                    {programToApply.title}
                  </h4>
                  <span className="text-[11px] font-semibold text-[#4338CA]">
                    {programToApply.company}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#14131F]/60 text-[11px] flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#14131F]/40" />
                    {programToApply.mode || 'Online'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#14131F]/40" />
                    {programToApply.duration || 'Flexible Duration'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#14131F]/40" />
                    <span>
                      Enrolled: {programToApply.enrolledCount ?? 0}
                      {programToApply.capacity ? ` / ${programToApply.capacity}` : ''}
                    </span>
                  </span>
                </div>
              </div>

              {/* Informative notice if cohort reached initial capacity */}
              {Boolean(
                programToApply.capacity &&
                  (programToApply.enrolledCount ?? 0) >= programToApply.capacity
              ) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Applications may still be submitted; selection depends on available seats.
                  </span>
                </div>
              )}

              {/* Feedback messages */}
              {programApplyError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{programApplyError}</span>
                </div>
              )}
              {programApplySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{programApplySuccess}</span>
                </div>
              )}

              {/* Motivation field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="program-apply-message-input"
                  className="block font-semibold text-xs text-[#14131F]"
                >
                  Statement of Interest / Motivation <span className="text-[#14131F]/50 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="program-apply-message-input"
                  rows={4}
                  value={applyMotivation}
                  onChange={(e) => setApplyMotivation(e.target.value)}
                  placeholder="Share why you'd like to participate in this cohort and what specific learning outcomes or career skills you hope to achieve..."
                  className="w-full p-3 bg-white border border-[#14131F]/15 rounded-xl text-xs text-[#14131F] placeholder:text-[#14131F]/40 focus:outline-hidden focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all resize-none"
                  disabled={submittingProgramApplication}
                />
                <p className="text-[11px] text-[#14131F]/50">
                  This message will be reviewed by {programToApply.company}&apos;s cohort mentors and talent team.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#14131F]/8 bg-[#FAFAF8] flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={submittingProgramApplication}
                onClick={() => {
                  setProgramToApply(null);
                  setApplyMotivation('');
                  setProgramApplyError(null);
                  setProgramApplySuccess(null);
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={submittingProgramApplication}
                onClick={handleSubmitProgramApplication}
                icon={
                  submittingProgramApplication ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )
                }
                className="text-xs"
              >
                {submittingProgramApplication ? 'Submitting Application...' : 'Confirm & Apply'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
