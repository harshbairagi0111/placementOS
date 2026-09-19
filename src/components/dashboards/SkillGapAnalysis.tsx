import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Target,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Briefcase,
  RefreshCw,
  Compass,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Award,
  Brain,
  Code2,
  Clock,
  Check,
  AlertTriangle,
  Filter,
  BookOpen,
} from 'lucide-react';
import { Button, Badge } from '../ui';

export type SkillImportance = 'required' | 'recommended' | 'optional';
export type SkillGapStatus = 'STRONG' | 'NEEDS_IMPROVEMENT' | 'GAP' | 'NOT_ASSESSED';
export type PriorityLevel = 'High Priority' | 'Medium Priority' | 'Low Priority';

export interface SkillGapItem {
  skill: string;
  skillId: string;
  category: 'technical' | 'soft';
  importance: SkillImportance;
  requiredMinimumLevel: number;
  studentScore: number | null;
  studentProficiency: string;
  status: SkillGapStatus;
  gapDelta: number;
  weight: number;
  priority?: PriorityLevel;
  recommendation: string;
}

export interface GapAnalysisResponse {
  success: boolean;
  student: {
    id: string;
    name: string;
    targetRole?: string | null;
    skills?: string[];
  };
  hasCompletedAssessment: boolean;
  message?: string;
  roleInfo: {
    id: string;
    title: string;
    type: 'industry_role' | 'job_posting';
    company?: string;
    industry: string;
    description: string;
    jobId?: string;
  } | null;
  analysis: {
    matchPercentage: number | null;
    totalRequirements: number;
    assessedRequirementsCount: number;
    matchedSkills: SkillGapItem[];
    strengths?: SkillGapItem[];
    improvementSkills: SkillGapItem[];
    needsImprovement?: SkillGapItem[];
    missingSkills: SkillGapItem[];
    gaps?: SkillGapItem[];
    notAssessedSkills: SkillGapItem[];
    notAssessed?: SkillGapItem[];
    priorityImprovements: SkillGapItem[];
    prioritySkills?: SkillGapItem[];
  } | null;
  availableRoles: Array<{
    id: string;
    title: string;
    industry: string;
    description: string;
    requirementsCount: number;
  }>;
  activeJobs: Array<{
    id: string;
    title: string;
    company: string;
    type: string;
    location?: string;
    requiredSkillsCount: number;
  }>;
}

export interface StudentProfileData {
  technicalSkills: Array<{
    skill: string;
    skillId: string;
    category: 'technical' | 'soft';
    score: number;
    proficiencyLevel: string;
    lastAssessedAt: string;
    assessmentCount?: number;
  }>;
  softSkills: Array<{
    skill: string;
    skillId: string;
    category: 'technical' | 'soft';
    score: number;
    proficiencyLevel: string;
    lastAssessedAt: string;
    assessmentCount?: number;
  }>;
  overallTechnicalScore: number | null;
  overallSoftScore: number | null;
  strengths: string[];
  skillGaps: string[];
  lastUpdated?: string | null;
}

export interface SkillGapAnalysisProps {
  onNavigateToRoadmap?: () => void;
  onNavigateToProfile?: () => void;
  onTakeAssessment?: (skill?: string) => void;
}

export const SkillGapAnalysis: React.FC<SkillGapAnalysisProps> = ({
  onNavigateToRoadmap,
  onNavigateToProfile,
  onTakeAssessment,
}) => {
  const authContext = useAuth();
  const token = authContext?.token;
  const user = authContext?.user;

  // Analysis Data state
  const [data, setData] = useState<GapAnalysisResponse | null>(null);
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected benchmark target (role or jobId)
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('');
  const [viewSection, setViewSection] = useState<'gap_analysis' | 'profile_matrix'>('gap_analysis');

  // Filter mode for requirements list
  const [filterMode, setFilterMode] = useState<
    'all' | 'strong' | 'needs_improvement' | 'gaps' | 'not_assessed'
  >('all');

  // Expand toggles
  const [showAllPriority, setShowAllPriority] = useState<boolean>(false);

  // Fetch deterministic gap analysis from backend
  const fetchGapAnalysis = async (targetId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/skills/gap-analysis';
      if (targetId) {
        url += `?role=${encodeURIComponent(targetId)}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load skill gap analysis (${res.status})`);
      }
      const result: GapAnalysisResponse = await res.json();
      setData(result);
      if (result.roleInfo?.id) {
        if (!selectedBenchmarkId) {
          setSelectedBenchmarkId(result.roleInfo.id);
        }
      } else if (!targetId) {
        setSelectedBenchmarkId('');
      }

      // Also fetch complete verified student skill profile
      try {
        const profRes = await fetch('/api/skills/profile', { headers });
        if (profRes.ok) {
          const profJson = await profRes.json();
          if (profJson.profile) {
            setProfileData(profJson.profile);
          }
        }
      } catch (profErr) {
        console.warn('Profile fetch secondary note:', profErr);
      }
    } catch (err: any) {
      console.error('Error fetching skill gap analysis:', err);
      setError(err.message || 'Unable to fetch skill gap analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGapAnalysis(selectedBenchmarkId || undefined);
  }, [token, selectedBenchmarkId]);

  // Handle role or job selection change
  const handleBenchmarkChange = (newId: string) => {
    setSelectedBenchmarkId(newId);
  };

  // Safe navigation triggers
  const handleOpenRoadmap = () => {
    if (onNavigateToRoadmap) {
      onNavigateToRoadmap();
    } else {
      window.dispatchEvent(new CustomEvent('switch-student-tab', { detail: 'roadmap' }));
    }
  };

  const handleOpenProfile = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      window.dispatchEvent(new CustomEvent('switch-student-tab', { detail: 'profile' }));
    }
  };

  const handleTakeAssessmentForSkill = (skillName?: string) => {
    if (onTakeAssessment) {
      onTakeAssessment(skillName);
    } else {
      window.dispatchEvent(new CustomEvent('switch-student-tab', { detail: 'skill_assessment' }));
    }
  };

  // Helper renderer for proficiency badge
  const renderProficiencyBadge = (level: string) => {
    switch (level) {
      case 'Expert':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#A3E635]/20 text-[#14131F] border border-[#A3E635]/40">
            Expert (85%+)
          </span>
        );
      case 'Advanced':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/25">
            Advanced (70%+)
          </span>
        );
      case 'Intermediate':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Intermediate (50%+)
          </span>
        );
      case 'Beginner':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Beginner (&lt;50%)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#14131F]/5 text-[#14131F]/60 border border-[#14131F]/10">
            Unassessed
          </span>
        );
    }
  };

  // Helper renderer for status pill
  const renderStatusPill = (status: SkillGapStatus) => {
    switch (status) {
      case 'STRONG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/50">
            <CheckCircle2 className="w-3 h-3 text-[#14131F]" />
            STRONG
          </span>
        );
      case 'NEEDS_IMPROVEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            NEEDS IMPROVEMENT
          </span>
        );
      case 'GAP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FB7185]/20 text-rose-900 border border-[#FB7185]/40">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            GAP
          </span>
        );
      case 'NOT_ASSESSED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#14131F]/8 text-[#14131F]/70 border border-[#14131F]/15">
            <Clock className="w-3 h-3 text-[#14131F]/50" />
            NOT ASSESSED
          </span>
        );
    }
  };

  // Helper renderer for priority pill
  const renderPriorityBadge = (priority?: PriorityLevel) => {
    if (priority === 'High Priority') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-wide">
          High Priority
        </span>
      );
    }
    if (priority === 'Medium Priority') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide">
          Medium Priority
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
        Low Priority
      </span>
    );
  };

  // Helper renderer for student overall skill profile matrix
  const renderProfileMatrix = () => (
    <div className="space-y-6">
      <div className="p-6 bg-[#FAFAF8] rounded-2xl border border-[#14131F]/8 space-y-6 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-4">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-base text-[#14131F]">
              Aggregated Student Skill Profile
            </h4>
            <p className="text-xs text-[#14131F]/60">
              Consolidated mastery from objective technical tests and situational judgment assessments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-[#14131F]/50 block">Overall Technical</span>
              <span className="font-bold text-sm text-[#14131F]">
                {profileData?.overallTechnicalScore !== null && profileData?.overallTechnicalScore !== undefined
                  ? `${profileData.overallTechnicalScore}%`
                  : 'Unassessed'}
              </span>
            </div>
            <div className="w-px h-6 bg-[#14131F]/10" />
            <div className="text-right">
              <span className="text-[11px] text-[#14131F]/50 block">Overall Soft Skills</span>
              <span className="font-bold text-sm text-[#14131F]">
                {profileData?.overallSoftScore !== null && profileData?.overallSoftScore !== undefined
                  ? `${profileData.overallSoftScore}%`
                  : 'Unassessed'}
              </span>
            </div>
          </div>
        </div>

        {/* Strengths & Gaps Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Verified Strengths */}
          <div className="p-4.5 bg-white rounded-xl border border-[#A3E635]/40 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-xs text-[#14131F]">
                Verified Core Strengths ({profileData?.strengths?.length || 0})
              </span>
            </div>
            {profileData?.strengths && profileData.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profileData.strengths.map((st, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-emerald-700" />
                    {st}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#14131F]/60">
                No verified strengths recorded yet. Complete an assessment to identify top competencies.
              </p>
            )}
          </div>

          {/* Identified Gaps */}
          <div className="p-4.5 bg-white rounded-xl border border-rose-200 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-xs text-[#14131F]">
                Identified Diagnostic Gaps ({profileData?.skillGaps?.length || 0})
              </span>
            </div>
            {profileData?.skillGaps && profileData.skillGaps.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profileData.skillGaps.map((gp, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Target className="w-3 h-3 text-rose-600" />
                    {gp}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#14131F]/60">
                No critical diagnostic skill gaps detected.
              </p>
            )}
          </div>
        </div>

        {/* Technical Skills List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#4338CA]" />
            <h5 className="font-bold text-xs text-[#14131F] uppercase tracking-wider">
              Technical Skills ({profileData?.technicalSkills?.length || 0})
            </h5>
          </div>

          {profileData?.technicalSkills && profileData.technicalSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {profileData.technicalSkills.map((sk, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-[#14131F]/8 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-[#14131F] block truncate">
                      {sk.skill}
                    </span>
                    <span className="text-[10px] text-[#14131F]/50">
                      Last assessed: {new Date(sk.lastAssessedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-xs text-[#14131F]">{sk.score}%</span>
                    {renderProficiencyBadge(sk.proficiencyLevel)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#14131F]/60 bg-white p-4 rounded-xl border border-[#14131F]/8 text-center">
              No technical skills evaluated yet.
            </p>
          )}
        </div>

        {/* Soft Skills List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#A3E635]" />
            <h5 className="font-bold text-xs text-[#14131F] uppercase tracking-wider">
              Soft Skills & Behavioral Competencies ({profileData?.softSkills?.length || 0})
            </h5>
          </div>

          {profileData?.softSkills && profileData.softSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {profileData.softSkills.map((sk, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-[#14131F]/8 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-[#14131F] block truncate">
                      {sk.skill}
                    </span>
                    <span className="text-[10px] text-[#14131F]/50">
                      Last assessed: {new Date(sk.lastAssessedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-xs text-[#14131F]">{sk.score}%</span>
                    {renderProficiencyBadge(sk.proficiencyLevel)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#14131F]/60 bg-white p-4 rounded-xl border border-[#14131F]/8 text-center">
              No soft skills evaluated yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // 1. Loading State
  if (loading && !data) {
    return (
      <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6 text-left font-sans">
        <div className="flex items-center gap-3 border-b border-[#14131F]/8 pb-5">
          <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-[#14131F]">
              Industry-Aligned Skill Gap Analysis
            </h3>
            <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
              SIH 26044 • Benchmarking verified skills against industry role standards
            </p>
          </div>
        </div>

        <div className="py-14 flex flex-col items-center justify-center text-center space-y-3.5">
          <div className="w-6 h-6 border-2 border-[#14131F]/15 border-t-[#4338CA] rounded-full animate-spin" />
          <div className="space-y-1">
            <p className="font-display font-semibold text-sm text-[#14131F]">
              Evaluating Industry & Job Role Competencies...
            </p>
            <p className="text-xs text-[#14131F]/50 font-sans max-w-sm">
              Cross-referencing your verified skill profile with canonical employer requirements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error && !data) {
    return (
      <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-5 text-left font-sans">
        <div className="flex items-center gap-3 border-b border-[#14131F]/8 pb-5">
          <div className="w-9 h-9 rounded-xl bg-[#FB7185]/10 text-[#FB7185] flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-[#14131F]">
              Industry Skill Gap Analysis
            </h3>
            <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
              Role qualification benchmark
            </p>
          </div>
        </div>

        <div className="p-4.5 bg-[#FB7185]/10 border border-[#FB7185]/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4.5 h-4.5 text-[#FB7185] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-xs text-[#14131F]">Unable to load skill gap evaluation</span>
              <p className="text-xs text-[#14131F]/70">{error}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchGapAnalysis(selectedBenchmarkId)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  // Gather requirements for display based on active filter
  const analysis = data?.analysis;
  const strengthsList = analysis?.strengths || analysis?.matchedSkills || [];
  const needsImprovementList = analysis?.needsImprovement || analysis?.improvementSkills || [];
  const gapsList = analysis?.gaps || analysis?.missingSkills || [];
  const notAssessedList = analysis?.notAssessed || analysis?.notAssessedSkills || [];
  const priorityList = analysis?.prioritySkills || analysis?.priorityImprovements || [];

  const allRequirements: SkillGapItem[] = [
    ...strengthsList,
    ...needsImprovementList,
    ...gapsList,
    ...notAssessedList,
  ];

  const filteredRequirements = allRequirements.filter((item) => {
    if (filterMode === 'strong') return item.status === 'STRONG';
    if (filterMode === 'needs_improvement') return item.status === 'NEEDS_IMPROVEMENT';
    if (filterMode === 'gaps') return item.status === 'GAP';
    if (filterMode === 'not_assessed') return item.status === 'NOT_ASSESSED';
    return true;
  });

  const displayedPriority = showAllPriority ? priorityList : priorityList.slice(0, 5);

  const roleInfo = data?.roleInfo;
  const availableRoles = data?.availableRoles || [];
  const activeJobs = data?.activeJobs || [];

  return (
    <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6 text-left font-sans">
      {/* 1. Header Bar with Role Selector & Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#14131F] leading-snug">
                Industry-Aligned Skill Gap Analysis
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4338CA]/10 text-[#4338CA] uppercase tracking-wider">
                SIH 26044
              </span>
            </div>
            <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
              Deterministic skill profile benchmarking against industry recruiter standards
            </p>
          </div>
        </div>

        {/* View Switcher: Gap Analysis vs Profile Matrix */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs font-sans">
            <button
              type="button"
              onClick={() => setViewSection('gap_analysis')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewSection === 'gap_analysis'
                  ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                  : 'text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              Role Gap Analysis
            </button>
            <button
              type="button"
              onClick={() => setViewSection('profile_matrix')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewSection === 'profile_matrix'
                  ? 'bg-white text-[#14131F] shadow-xs font-semibold'
                  : 'text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#4338CA]" />
              Student Skill Profile
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchGapAnalysis(selectedBenchmarkId)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh Evaluation"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Interactive Role & Job Benchmark Selector */}
      <div className="p-4.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#4338CA]" />
            <span className="font-bold text-[#14131F] text-xs sm:text-sm">
              Current Benchmark Target: {roleInfo?.title || 'No Role Selected'}
            </span>
            {roleInfo && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#14131F]/5 text-[#14131F]/70">
                {roleInfo.type === 'job_posting' ? `Active Drive (${roleInfo.company})` : 'Industry Standard Role'}
              </span>
            )}
          </div>
          <p className="text-[#14131F]/65 text-xs max-w-xl">
            {roleInfo?.description || 'Select an industry benchmark or campus drive to compare your verified skills.'}
          </p>
        </div>

        {/* Dropdown to switch target role or active campus job */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="benchmark-select" className="text-xs font-semibold text-[#14131F]/70">
            Benchmark Against:
          </label>
          <select
            id="benchmark-select"
            value={selectedBenchmarkId || roleInfo?.id || ''}
            onChange={(e) => handleBenchmarkChange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#14131F]/15 rounded-lg text-xs font-semibold text-[#14131F] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/30 cursor-pointer"
          >
            <option value="">— Select a target role —</option>
            <optgroup label="Industry Benchmark Roles (SIH Standard)">
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.requirementsCount} skills)
                </option>
              ))}
            </optgroup>
            {activeJobs.length > 0 && (
              <optgroup label="Active Campus Job Drives">
                {activeJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} — {j.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* 3. Diagnostic State Notice if Student has Zero Completed Assessments */}
      {!data?.hasCompletedAssessment && (
        <div className="p-4.5 bg-amber-50/60 border border-amber-200/80 text-amber-950 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-950">
                Complete a skill assessment to generate your skill profile.
              </span>
              <p className="text-amber-800 leading-relaxed">
                You have not completed an objective skill assessment yet. Take a diagnostic to benchmark your technical and behavioral skills against recruiter cutoffs.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleTakeAssessmentForSkill()}
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Start Skill Assessment
          </Button>
        </div>
      )}

      {/* VIEW SECTION 1: ROLE GAP ANALYSIS */}
      {viewSection === 'gap_analysis' && (
        !roleInfo ? (
          <div className="space-y-6">
            <div className="p-8 bg-[#FAFAF8] rounded-2xl border border-dashed border-[#14131F]/20 text-center space-y-4 font-sans">
              <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-display font-bold text-base text-[#14131F]">
                  Select a target role to view your industry skill gap.
                </h4>
                <p className="text-xs text-[#14131F]/60">
                  Select an industry standard role or an active campus recruitment drive above to compare your verified competencies against industry hiring cutoffs.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {availableRoles.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleBenchmarkChange(r.id)}
                    className="px-3 py-1.5 bg-white border border-[#14131F]/15 hover:border-[#4338CA] text-[#14131F] rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Aggregated Student Skill Profile shown when no role is selected */}
            {renderProfileMatrix()}
          </div>
        ) : analysis?.totalRequirements === 0 || analysis?.matchPercentage === null ? (
          <div className="space-y-6">
            <div className="p-8 bg-[#FAFAF8] rounded-2xl border border-[#14131F]/8 text-center space-y-3 font-sans">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-[#14131F]">
                No skill requirements configured for this opportunity.
              </h4>
              <p className="text-xs text-[#14131F]/60 max-w-md mx-auto">
                {data?.message || 'This role or job posting does not currently specify mandatory or recommended skills to benchmark against.'}
              </p>
            </div>
            {renderProfileMatrix()}
          </div>
        ) : (
        <div className="space-y-6">
          {/* Headline Metric: Deterministic Weighted Match Percentage */}
          <div className="p-6 sm:p-7 bg-[#FAFAF8] rounded-2xl border border-[#14131F]/8 flex flex-col md:flex-row md:items-center justify-between gap-6 font-sans">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs text-[#14131F]/60 font-sans block">
                Overall Role Qualification Match
              </span>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-display font-bold text-[#14131F] tracking-tight">
                  {analysis?.matchPercentage ?? 0}%
                </span>
                <span className="text-xs text-[#14131F]/40 font-sans">/ 100</span>

                {(analysis?.matchPercentage ?? 0) >= 75 ? (
                  <Badge variant="positive" size="sm" icon={<TrendingUp className="w-3.5 h-3.5 text-[#14131F]" />}>
                    High Qualification Fit
                  </Badge>
                ) : (analysis?.matchPercentage ?? 0) >= 50 ? (
                  <Badge variant="verified" size="sm">
                    Moderate Alignment
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm" icon={<AlertCircle className="w-3.5 h-3.5 text-rose-600" />}>
                    Priority Skill Gaps
                  </Badge>
                )}
              </div>

              <p className="text-xs text-[#14131F]/65 font-sans leading-relaxed">
                Evaluated against <strong className="text-[#14131F] font-semibold">{analysis?.totalRequirements || 0}</strong> canonical competencies required for{' '}
                <strong className="text-[#14131F] font-semibold">{roleInfo?.title}</strong>. Required skills are weighted at 2.0x vs recommended at 1.0x.
              </p>
            </div>

            {/* Visual Breakdown Bar */}
            <div className="w-full md:w-80 space-y-2.5">
              <div className="flex justify-between text-xs text-[#14131F]/70 font-sans">
                <span>Role Competency Coverage</span>
                <span className="font-semibold text-[#14131F]">{analysis?.matchPercentage ?? 0}%</span>
              </div>

              <div className="w-full bg-[#14131F]/8 h-3 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#A3E635] transition-all duration-500"
                  style={{ width: `${analysis?.matchPercentage ?? 0}%` }}
                  title={`${strengthsList.length} Strengths`}
                />
                <div
                  className="h-full bg-amber-400/70 transition-all duration-500"
                  style={{ width: `${Math.min(100 - (analysis?.matchPercentage ?? 0), needsImprovementList.length * 15)}%` }}
                  title={`${needsImprovementList.length} Needs Improvement`}
                />
                <div
                  className="h-full bg-rose-400/40 transition-all duration-500"
                  style={{ width: `100%` }}
                  title={`${gapsList.length + notAssessedList.length} Gaps & Unassessed`}
                />
              </div>

              <div className="grid grid-cols-3 text-[11px] font-sans pt-1 gap-1 text-center">
                <span className="text-[#14131F] font-medium flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
                  {strengthsList.length} Strengths
                </span>
                <span className="text-[#14131F] font-medium flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {needsImprovementList.length} In Progress
                </span>
                <span className="text-[#14131F] font-medium flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  {gapsList.length + notAssessedList.length} Gaps
                </span>
              </div>
            </div>
          </div>

          {/* Section 7E: Priority Improvement Matrix (Ranked by Importance & Impact) */}
          <div className="p-5 sm:p-6 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#4338CA]" />
                <h4 className="font-display font-bold text-sm text-[#14131F]">
                  Ranked Priority Improvement Matrix
                </h4>
              </div>
              <span className="text-xs text-[#14131F]/60">
                Sorted by hiring requirement impact & gap severity
              </span>
            </div>

            {priorityList.length === 0 ? (
              <div className="p-5 bg-white rounded-xl border border-[#14131F]/8 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-[#A3E635] mx-auto" />
                <p className="font-bold text-xs text-[#14131F]">
                  Full Role Requirements Covered
                </p>
                <p className="text-xs text-[#14131F]/60">
                  You satisfy all required and recommended competencies for {roleInfo?.title}!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedPriority.map((item, pIdx) => (
                  <div
                    key={item.skillId || pIdx}
                    className="p-3.5 bg-white rounded-xl border border-[#14131F]/8 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left transition-all hover:border-[#14131F]/25"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-xs text-[#14131F]">
                          {pIdx + 1}. {item.skill}
                        </span>
                        <span className="text-[10px] text-[#14131F]/50 uppercase font-semibold">
                          ({item.category})
                        </span>
                        {renderPriorityBadge(item.priority)}
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#14131F]/5 text-[#14131F]/70">
                          {item.importance === 'required' ? 'Required (Weight 2.0)' : 'Recommended (Weight 1.0)'}
                        </span>
                      </div>
                      <p className="text-xs text-[#14131F]/65 leading-relaxed">
                        {item.recommendation}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <span className="text-[#14131F]/50 block">Target Standard</span>
                        <span className="font-bold text-[#14131F]">
                          {item.studentScore !== null ? `${item.studentScore}%` : 'Unassessed'} / {item.requiredMinimumLevel}%
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTakeAssessmentForSkill(item.skill)}
                        icon={<ArrowUpRight className="w-3 h-3" />}
                      >
                        Assess
                      </Button>
                    </div>
                  </div>
                ))}

                {priorityList.length > 5 && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllPriority(!showAllPriority)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline cursor-pointer"
                    >
                      {showAllPriority ? (
                        <>
                          <span>Show top 5 priority improvements</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Show all {priorityList.length} improvements</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 7C & 7D: Detailed Role Requirements Matrix with Filter Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4338CA]" />
                <h4 className="font-display font-bold text-sm text-[#14131F]">
                  Competency Requirements Evaluation ({filteredRequirements.length} / {allRequirements.length})
                </h4>
              </div>

              {/* Filter Tabs */}
              <div className="inline-flex p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs font-sans">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === 'all' ? 'bg-white text-[#14131F] font-semibold shadow-xs' : 'text-[#14131F]/60'
                  }`}
                >
                  All ({allRequirements.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('strong')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === 'strong' ? 'bg-white text-[#14131F] font-semibold shadow-xs' : 'text-[#14131F]/60'
                  }`}
                >
                  Strengths ({strengthsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('needs_improvement')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === 'needs_improvement' ? 'bg-white text-[#14131F] font-semibold shadow-xs' : 'text-[#14131F]/60'
                  }`}
                >
                  Needs Improvement ({needsImprovementList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('gaps')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === 'gaps' ? 'bg-white text-[#14131F] font-semibold shadow-xs' : 'text-[#14131F]/60'
                  }`}
                >
                  Skill Gaps ({gapsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('not_assessed')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === 'not_assessed' ? 'bg-white text-[#14131F] font-semibold shadow-xs' : 'text-[#14131F]/60'
                  }`}
                >
                  Not Assessed ({notAssessedList.length})
                </button>
              </div>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredRequirements.map((item) => (
                <div
                  key={item.skillId}
                  className={`p-4 rounded-xl border bg-white space-y-3 transition-all ${
                    item.status === 'STRONG'
                      ? 'border-[#A3E635]/40 hover:border-[#A3E635]/70'
                      : item.status === 'NEEDS_IMPROVEMENT'
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm text-[#14131F]">
                          {item.skill}
                        </span>
                        <span className="text-[10px] text-[#14131F]/50 uppercase font-semibold">
                          ({item.category})
                        </span>
                      </div>
                      <span className="text-[11px] text-[#14131F]/60 font-sans">
                        {item.importance === 'required' ? 'Required Competency' : 'Recommended Competency'}
                      </span>
                    </div>

                    {renderStatusPill(item.status)}
                  </div>

                  {/* Progress Bar Comparing Student Score with Required Minimum */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#14131F]/70">
                      <span>
                        Student: <strong className="text-[#14131F]">{item.studentScore !== null ? `${item.studentScore}%` : 'Unassessed'}</strong>
                      </span>
                      <span>
                        Target: <strong className="text-[#14131F]">{item.requiredMinimumLevel}%+</strong>
                      </span>
                    </div>

                    <div className="w-full bg-[#14131F]/8 rounded-full h-2 relative">
                      {/* Target threshold marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[#14131F]/40 z-10"
                        style={{ left: `${item.requiredMinimumLevel}%` }}
                        title={`Target: ${item.requiredMinimumLevel}%`}
                      />
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.status === 'STRONG'
                            ? 'bg-[#A3E635]'
                            : item.status === 'NEEDS_IMPROVEMENT'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, item.studentScore || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendation & Action Button */}
                  <div className="pt-1 flex items-center justify-between gap-2 text-xs border-t border-[#14131F]/5">
                    <p className="text-[#14131F]/60 text-[11px] leading-relaxed truncate">
                      {item.recommendation}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTakeAssessmentForSkill(item.skill)}
                      className="shrink-0 text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                    >
                      {item.status === 'STRONG' ? 'Re-test' : 'Assess'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )
      )}

      {/* VIEW SECTION 2: STUDENT SKILL PROFILE MATRIX */}
      {viewSection === 'profile_matrix' && renderProfileMatrix()}

      {/* 4. Action Banner to Bridge Top Gaps */}
      <div className="p-5 sm:p-6 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex flex-col md:flex-row md:items-center justify-between gap-5 font-sans text-left">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#4338CA]" />
            <span className="font-display font-bold text-xs sm:text-sm text-[#14131F]">
              Action Plan to Close Your Priority Gaps
            </span>
          </div>
          <p className="text-xs text-[#14131F]/70 max-w-xl leading-relaxed">
            Target high-priority skill gaps through adaptive question modules and curriculum-aligned practice to boost your role qualification before upcoming campus placement drives.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenRoadmap}
            icon={<Compass className="w-3.5 h-3.5" />}
          >
            Open Career Roadmap
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleTakeAssessmentForSkill()}
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Take Skill Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};
