import React, { useState } from 'react';
import {
  Globe,
  Award,
  Briefcase,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Github,
  Linkedin,
  Mail,
  Phone,
  Code,
  Layers,
  Sparkles,
  RefreshCw,
  Share2,
  Check,
  Trophy,
  Building2,
  ChevronRight,
  User,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  X,
  XCircle,
  Target,
  FileText,
} from 'lucide-react';
import {
  DigitalStudentPortfolio,
  DigitalPortfolioProjectItem,
  DigitalPortfolioInternshipItem,
  DigitalPortfolioAchievementItem,
} from '../../types/portfolio';
import { viewAuthenticatedFile } from '../../utils/fileViewer';

interface DigitalStudentPortfolioViewProps {
  portfolio: DigitalStudentPortfolio | null;
  isLoading: boolean;
  isOwner?: boolean;
  token?: string | null;
  onRefresh?: () => void;
  onEditProfile?: () => void;
  onNavigateToSkillAssessment?: () => void;
  githubAuditContent?: React.ReactNode;
}

function ItemVerificationBadge({
  status,
  note,
  verifiedBy,
  verifiedAt,
}: {
  status?: string;
  note?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | Date | null;
}) {
  const norm = String(status || '').toUpperCase();
  if (norm === 'VERIFIED') {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#047857]">
          <CheckCircle className="w-3 h-3" />
          <span>Verified</span>
        </span>
        {verifiedBy && (
          <p className="text-[10px] text-[#14131F]/60">
            Validated by: <span className="font-semibold text-[#14131F]/80">{verifiedBy}</span>
            {verifiedAt && ` on ${new Date(verifiedAt).toLocaleDateString()}`}
          </p>
        )}
      </div>
    );
  }
  if (norm === 'REJECTED') {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EF4444]/15 text-[#DC2626]">
          <XCircle className="w-3 h-3" />
          <span>Evidence Rejected</span>
        </span>
        {note && (
          <div className="text-[10px] text-[#DC2626] bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-md p-1.5 leading-snug font-sans">
            <span className="font-semibold">Reviewer note: </span>
            {note}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#B45309]">
        <Clock className="w-3 h-3" />
        <span>Verification Pending</span>
      </span>
      <p className="text-[9px] text-[#14131F]/50">Awaiting faculty / institution review</p>
    </div>
  );
}

export const DigitalStudentPortfolioView: React.FC<DigitalStudentPortfolioViewProps> = ({
  portfolio,
  isLoading,
  isOwner = false,
  token,
  onRefresh,
  onEditProfile,
  onNavigateToSkillAssessment,
  githubAuditContent,
}) => {
  // Navigation tabs inside portfolio
  const [activeTab, setActiveTab] = useState<
    'all' | 'skills' | 'projects' | 'internships' | 'certifications' | 'achievements' | 'codebase'
  >('all');

  // Add Project Modal State
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: '',
    role: '',
    duration: '',
    githubUrl: '',
    liveUrl: '',
    outcomes: '',
  });
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Add Internship Modal State
  const [isAddInternshipOpen, setIsAddInternshipOpen] = useState(false);
  const [internshipForm, setInternshipForm] = useState({
    organization: '',
    role: '',
    duration: '',
    description: '',
    skills: '',
    location: '',
    status: 'Completed' as 'Completed' | 'Ongoing' | 'Offer',
    certificateUrl: '',
  });
  const [internshipSubmitting, setInternshipSubmitting] = useState(false);
  const [internshipError, setInternshipError] = useState<string | null>(null);

  // Add Achievement Modal State
  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false);
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    organization: '',
    date: '',
    description: '',
    rank: '',
    credentialUrl: '',
  });
  const [achievementSubmitting, setAchievementSubmitting] = useState(false);
  const [achievementError, setAchievementError] = useState<string | null>(null);

  // Deletion loading states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Handlers
  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/student/portfolio/${portfolio?.profile?.id || ''}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) {
      setProjectError('Project title is required');
      return;
    }

    try {
      setProjectSubmitting(true);
      setProjectError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/students/me/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(projectForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add project');
      }

      setIsAddProjectOpen(false);
      setProjectForm({
        title: '',
        description: '',
        technologies: '',
        role: '',
        duration: '',
        githubUrl: '',
        liveUrl: '',
        outcomes: '',
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setProjectError(err.message || 'Error saving project');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this project?')) return;
    try {
      setDeletingId(id);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students/me/projects/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete project');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internshipForm.organization.trim() || !internshipForm.role.trim()) {
      setInternshipError('Company/Organization and Role are required');
      return;
    }

    try {
      setInternshipSubmitting(true);
      setInternshipError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/students/me/internships', {
        method: 'POST',
        headers,
        body: JSON.stringify(internshipForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add internship');
      }

      setIsAddInternshipOpen(false);
      setInternshipForm({
        organization: '',
        role: '',
        duration: '',
        description: '',
        skills: '',
        location: '',
        status: 'Completed',
        certificateUrl: '',
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setInternshipError(err.message || 'Error saving internship');
    } finally {
      setInternshipSubmitting(false);
    }
  };

  const handleDeleteInternship = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this internship experience?')) return;
    try {
      setDeletingId(id);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students/me/internships/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete internship');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not delete internship');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementForm.title.trim()) {
      setAchievementError('Achievement title is required');
      return;
    }

    try {
      setAchievementSubmitting(true);
      setAchievementError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/students/me/achievements', {
        method: 'POST',
        headers,
        body: JSON.stringify(achievementForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add achievement');
      }

      setIsAddAchievementOpen(false);
      setAchievementForm({
        title: '',
        organization: '',
        date: '',
        description: '',
        rank: '',
        credentialUrl: '',
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setAchievementError(err.message || 'Error saving achievement');
    } finally {
      setAchievementSubmitting(false);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this achievement?')) return;
    try {
      setDeletingId(id);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students/me/achievements/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete achievement');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not delete achievement');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && !portfolio) {
    return (
      <div className="p-10 bg-white border border-[#14131F]/8 rounded-2xl text-center space-y-4 shadow-xs">
        <RefreshCw className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
        <p className="text-sm font-medium text-[#14131F]">Loading unified digital student portfolio...</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="p-8 bg-white border border-[#14131F]/8 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#FB7185] mx-auto" />
        <h3 className="text-base font-bold text-[#14131F]">Portfolio Not Available</h3>
        <p className="text-xs text-[#14131F]/60 max-w-md mx-auto">
          Unable to aggregate portfolio records at this time. Please check your network connection or complete your profile.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-[#4338CA] text-white rounded-xl text-xs font-semibold hover:bg-[#3730A3] transition-colors"
          >
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  const {
    profile,
    skills,
    education,
    certifications = [],
    projects = [],
    internships = [],
    achievements = [],
    completeness,
  } = portfolio;

  // Category counts
  const totalTechnicalSkills = skills.technical?.length || 0;
  const totalSoftSkills = skills.soft?.length || 0;
  const totalProjects = projects.length;
  const totalCertifications = certifications.length;
  const totalInternships = internships.length;
  const totalAchievements = achievements.length;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. PORTFOLIO IDENTITY & HERO HEADER */}
      <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#14131F]/8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] text-white flex items-center justify-center font-display font-bold text-2xl sm:text-3xl shadow-sm shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-[#14131F]">
                  {profile.name || profile.fullName || 'Student'}
                </h1>
                {profile.targetRole && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                    {profile.targetRole}
                  </span>
                )}
                {profile.readinessScore > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/10 text-[#047857] border border-[#10B981]/20">
                    {profile.readinessScore}% Readiness
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#14131F]/60">
                {education.college && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#14131F]/40" />
                    {education.college}
                  </span>
                )}
                {education.degree && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#14131F]/40" />
                    {education.degree} {education.department ? `(${education.department})` : ''}
                  </span>
                )}
                {education.graduationYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#14131F]/40" />
                    Class of {education.graduationYear}
                  </span>
                )}
                {education.cgpa && (
                  <span className="font-medium text-[#14131F]">CGPA: {education.cgpa}/10</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {isOwner && onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#14131F]/5 text-[#14131F] hover:bg-[#14131F]/10 transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white border border-[#14131F]/15 text-[#14131F] hover:bg-[#FAFAF8] transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981]">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Portfolio</span>
                </>
              )}
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh Portfolio"
                className="p-2 rounded-xl text-[#14131F]/60 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bio & Social / Contact Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#14131F]/50">Professional Bio</h4>
            <p className="text-xs sm:text-sm text-[#14131F]/80 leading-relaxed font-sans">
              {profile.bio ||
                'No bio provided yet. Update your student profile to showcase your career aspirations, key specializations, and unique background to recruiters.'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#14131F]/50">Contact & Profiles</h4>
            <div className="space-y-1.5 text-xs text-[#14131F]/70">
              {profile.email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl.startsWith('http') ? profile.githubUrl : `https://${profile.githubUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[#4338CA] hover:underline truncate"
                >
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{profile.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[#0A66C2] hover:underline truncate"
                >
                  <Linkedin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* PORTFOLIO COMPLETENESS PROGRESS BAR */}
        {completeness && (
          <div className="p-4 sm:p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
                <span className="text-xs sm:text-sm font-semibold text-[#14131F]">
                  Portfolio Completeness: {completeness.score}%
                </span>
              </div>
              <span className="text-xs text-[#14131F]/60">
                {completeness.score === 100
                  ? 'All 6 portfolio dimensions complete'
                  : 'Complete all dimensions to maximize candidate ranking'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#14131F]/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  completeness.score >= 80
                    ? 'bg-[#10B981]'
                    : completeness.score >= 50
                    ? 'bg-[#4338CA]'
                    : 'bg-[#F59E0B]'
                }`}
                style={{ width: `${completeness.score}%` }}
              />
            </div>

            {/* Dimension Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
              <div
                className={`p-2 rounded-lg text-center text-xs font-medium border ${
                  completeness.factors.profileComplete.complete
                    ? 'bg-[#10B981]/10 text-[#047857] border-[#10B981]/30'
                    : 'bg-white text-[#14131F]/60 border-[#14131F]/10'
                }`}
              >
                Profile ({completeness.factors.profileComplete.earned}/{completeness.factors.profileComplete.weight}%)
              </div>
              <div
                className={`p-2 rounded-lg text-center text-xs font-medium border ${
                  completeness.factors.skillsAssessed.complete
                    ? 'bg-[#10B981]/10 text-[#047857] border-[#10B981]/30'
                    : 'bg-white text-[#14131F]/60 border-[#14131F]/10'
                }`}
              >
                Skills ({completeness.factors.skillsAssessed.earned}/{completeness.factors.skillsAssessed.weight}%)
              </div>
              <div
                className={`p-2 rounded-lg text-center text-xs font-medium border ${
                  completeness.factors.projects.complete
                    ? 'bg-[#10B981]/10 text-[#047857] border-[#10B981]/30'
                    : 'bg-white text-[#14131F]/60 border-[#14131F]/10'
                }`}
              >
                Projects ({completeness.factors.projects.earned}/{completeness.factors.projects.weight}%)
              </div>
              <div
                className={`p-2 rounded-lg text-center text-xs font-medium border ${
                  completeness.factors.certifications.complete
                    ? 'bg-[#10B981]/10 text-[#047857] border-[#10B981]/30'
                    : 'bg-white text-[#14131F]/60 border-[#14131F]/10'
                }`}
              >
                Certs ({completeness.factors.certifications.earned}/{completeness.factors.certifications.weight}%)
              </div>
              <div
                className={`p-2 rounded-lg text-center text-xs font-medium border ${
                  completeness.factors.internships.complete
                    ? 'bg-[#10B981]/10 text-[#047857] border-[#10B981]/30'
                    : 'bg-white text-[#14131F]/60 border-[#14131F]/10'
                }`}
              >
                Interns ({completeness.factors.internships.earned}/{completeness.factors.internships.weight}%)
              </div>
              <div
                className={`p-2 rounded-lg text-center text-xs font-medium border ${
                  completeness.factors.achievements.complete
                    ? 'bg-[#10B981]/10 text-[#047857] border-[#10B981]/30'
                    : 'bg-white text-[#14131F]/60 border-[#14131F]/10'
                }`}
              >
                Awards ({completeness.factors.achievements.earned}/{completeness.factors.achievements.weight}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 border-b border-[#14131F]/10 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-[#14131F] text-white'
              : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
          }`}
        >
          Full Portfolio
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'skills'
              ? 'bg-[#14131F] text-white'
              : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Assessed Skills</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#14131F]/10">
            {totalTechnicalSkills + totalSoftSkills}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'projects'
              ? 'bg-[#14131F] text-white'
              : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Projects</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#14131F]/10">{totalProjects}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('internships')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'internships'
              ? 'bg-[#14131F] text-white'
              : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Internships</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#14131F]/10">{totalInternships}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('certifications')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'certifications'
              ? 'bg-[#14131F] text-white'
              : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Certifications</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#14131F]/10">{totalCertifications}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'achievements'
              ? 'bg-[#14131F] text-white'
              : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Achievements</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#14131F]/10">{totalAchievements}</span>
        </button>
        {githubAuditContent && (
          <button
            type="button"
            onClick={() => setActiveTab('codebase')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'codebase'
                ? 'bg-[#14131F] text-white'
                : 'text-[#14131F]/70 hover:bg-[#14131F]/5 hover:text-[#14131F]'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Portfolio Audit</span>
          </button>
        )}
      </div>

      {/* 3. SECTION CONTENT */}

      {/* VIEW: GITHUB PORTFOLIO AUDIT (Fix #5 & Fix #5.1) */}
      {activeTab === 'codebase' && githubAuditContent && (
        <div className="space-y-6">{githubAuditContent}</div>
      )}

      {/* VIEW: ALL or SKILLS */}
      {(activeTab === 'all' || activeTab === 'skills') && (
        <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-[#14131F] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#4338CA]" />
                <span>Assessed Skill Profile</span>
              </h3>
              <p className="text-xs text-[#14131F]/60 mt-0.5">
                Evaluated from Fix #2 skill assessments, coding tests, and structured mock interviews.
              </p>
            </div>
            {isOwner && onNavigateToSkillAssessment && (
              <button
                type="button"
                onClick={onNavigateToSkillAssessment}
                className="px-3 py-1.5 bg-[#4338CA]/10 text-[#4338CA] hover:bg-[#4338CA]/20 transition-colors rounded-xl text-xs font-semibold flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Take Skill Assessment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {totalTechnicalSkills === 0 && totalSoftSkills === 0 ? (
            <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-xl text-center space-y-3">
              <Code className="w-8 h-8 text-[#14131F]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#14131F]">No Assessed Skills on File</h4>
              <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                Take the technical and soft skill assessments to record verified proficiencies in your digital portfolio.
              </p>
              {isOwner && onNavigateToSkillAssessment && (
                <button
                  type="button"
                  onClick={onNavigateToSkillAssessment}
                  className="px-4 py-2 bg-[#4338CA] text-white rounded-xl text-xs font-semibold hover:bg-[#3730A3] transition-colors"
                >
                  Start Assessment
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Technical Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14131F]/70">
                    Technical Skills ({totalTechnicalSkills})
                  </h4>
                  {skills.overallTechnicalScore > 0 && (
                    <span className="text-xs font-medium text-[#4338CA]">
                      Avg: {skills.overallTechnicalScore}%
                    </span>
                  )}
                </div>

                {skills.technical && skills.technical.length > 0 ? (
                  <div className="space-y-2">
                    {skills.technical.map((item, idx) => (
                      <div
                        key={item.skillId || idx}
                        className="p-3 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#14131F]">{item.skill}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.proficiencyLevel === 'Expert'
                                  ? 'bg-[#10B981]/15 text-[#047857]'
                                  : item.proficiencyLevel === 'Advanced'
                                  ? 'bg-[#4338CA]/15 text-[#4338CA]'
                                  : item.proficiencyLevel === 'Intermediate'
                                  ? 'bg-[#F59E0B]/15 text-[#B45309]'
                                  : 'bg-[#14131F]/10 text-[#14131F]/70'
                              }`}
                            >
                              {item.proficiencyLevel}
                            </span>
                            <span className="text-xs font-bold text-[#14131F]">{item.score}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-[#14131F]/8 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.score >= 75
                                ? 'bg-[#10B981]'
                                : item.score >= 50
                                ? 'bg-[#4338CA]'
                                : 'bg-[#F59E0B]'
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#14131F]/50 italic">No technical skills assessed yet.</p>
                )}
              </div>

              {/* Soft Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14131F]/70">
                    Soft & Communication Skills ({totalSoftSkills})
                  </h4>
                  {skills.overallSoftScore > 0 && (
                    <span className="text-xs font-medium text-[#4338CA]">
                      Avg: {skills.overallSoftScore}%
                    </span>
                  )}
                </div>

                {skills.soft && skills.soft.length > 0 ? (
                  <div className="space-y-2">
                    {skills.soft.map((item, idx) => (
                      <div
                        key={item.skillId || idx}
                        className="p-3 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#14131F]">{item.skill}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.proficiencyLevel === 'Expert'
                                  ? 'bg-[#10B981]/15 text-[#047857]'
                                  : item.proficiencyLevel === 'Advanced'
                                  ? 'bg-[#4338CA]/15 text-[#4338CA]'
                                  : item.proficiencyLevel === 'Intermediate'
                                  ? 'bg-[#F59E0B]/15 text-[#B45309]'
                                  : 'bg-[#14131F]/10 text-[#14131F]/70'
                              }`}
                            >
                              {item.proficiencyLevel}
                            </span>
                            <span className="text-xs font-bold text-[#14131F]">{item.score}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-[#14131F]/8 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.score >= 75
                                ? 'bg-[#10B981]'
                                : item.score >= 50
                                ? 'bg-[#4338CA]'
                                : 'bg-[#F59E0B]'
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#14131F]/50 italic">No soft skills assessed yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: ALL or PROJECTS */}
      {(activeTab === 'all' || activeTab === 'projects') && (
        <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-[#14131F] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#4338CA]" />
                <span>Projects & Capstone Engineering ({totalProjects})</span>
              </h3>
              <p className="text-xs text-[#14131F]/60 mt-0.5">
                Technical implementations, open-source repositories, and practical problem-solving.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddProjectOpen(true)}
                className="px-3.5 py-1.5 bg-[#4338CA] text-white hover:bg-[#3730A3] transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-xl text-center space-y-3">
              <Layers className="w-8 h-8 text-[#14131F]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#14131F]">No Projects Added Yet</h4>
              <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                Add projects you have built to showcase architecture patterns, real outcomes, and technology stack fluency to recruiters.
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(true)}
                  className="px-4 py-2 bg-[#4338CA] text-white rounded-xl text-xs font-semibold hover:bg-[#3730A3] transition-colors"
                >
                  Add Your First Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#14131F] flex items-center gap-2">
                          <span>{proj.title}</span>
                          {proj.source === 'github_audit' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14131F]/8 text-[#14131F]/70 font-normal">
                              Audited
                            </span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#14131F]/60 mt-0.5">
                          {proj.role && <span className="font-medium text-[#4338CA]">{proj.role}</span>}
                          {proj.duration && <span>• {proj.duration}</span>}
                        </div>
                      </div>

                      {isOwner && proj.source === 'manual' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          disabled={deletingId === proj.id}
                          className="text-[#14131F]/40 hover:text-[#FB7185] transition-colors p-1"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {proj.description && (
                      <p className="text-xs text-[#14131F]/80 leading-relaxed font-sans line-clamp-3">
                        {proj.description}
                      </p>
                    )}

                    {proj.outcomes && (
                      <div className="p-2.5 bg-white border border-[#14131F]/6 rounded-lg text-xs text-[#14131F]/80">
                        <span className="font-semibold text-[#14131F]">Key Outcomes: </span>
                        {proj.outcomes}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Verification Status */}
                    <div className="pt-2 border-t border-[#14131F]/6">
                      <ItemVerificationBadge
                        status={proj.verificationStatus}
                        note={proj.verificationNote}
                        verifiedBy={proj.verifiedBy}
                        verifiedAt={proj.verifiedAt}
                      />
                    </div>

                    {/* Technologies */}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {proj.technologies.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-[#14131F]/10 text-[#14131F]/80"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-3 text-xs pt-1 border-t border-[#14131F]/6">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl.startsWith('http') ? proj.githubUrl : `https://${proj.githubUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#14131F]/70 hover:text-[#14131F] font-medium"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Code</span>
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl.startsWith('http') ? proj.liveUrl : `https://${proj.liveUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#4338CA] hover:underline font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ALL or INTERNSHIPS */}
      {(activeTab === 'all' || activeTab === 'internships') && (
        <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-[#14131F] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#4338CA]" />
                <span>Internships & Work Experience ({totalInternships})</span>
              </h3>
              <p className="text-xs text-[#14131F]/60 mt-0.5">
                Industry apprenticeships, production engineering roles, and enterprise contributions.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddInternshipOpen(true)}
                className="px-3.5 py-1.5 bg-[#4338CA] text-white hover:bg-[#3730A3] transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Internship</span>
              </button>
            )}
          </div>

          {internships.length === 0 ? (
            <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-xl text-center space-y-3">
              <Briefcase className="w-8 h-8 text-[#14131F]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#14131F]">No Internships Added Yet</h4>
              <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                Add any corporate internships, freelance engagements, or research apprenticeships to establish hands-on workplace readiness.
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsAddInternshipOpen(true)}
                  className="px-4 py-2 bg-[#4338CA] text-white rounded-xl text-xs font-semibold hover:bg-[#3730A3] transition-colors"
                >
                  Add Internship
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {internships.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-bold text-[#14131F]">{item.role}</h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.status === 'Completed'
                              ? 'bg-[#10B981]/15 text-[#047857]'
                              : item.status === 'Ongoing'
                              ? 'bg-[#4338CA]/15 text-[#4338CA]'
                              : 'bg-[#F59E0B]/15 text-[#B45309]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#4338CA] mt-0.5">{item.organization}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#14131F]/60 mt-1">
                        {item.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.duration}
                          </span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.certificateUrl && (
                        <a
                          href={item.certificateUrl.startsWith('http') ? item.certificateUrl : `https://${item.certificateUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#4338CA] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Certificate</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteInternship(item.id)}
                          disabled={deletingId === item.id}
                          className="text-[#14131F]/40 hover:text-[#FB7185] transition-colors p-1"
                          title="Delete Internship"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-[#14131F]/80 leading-relaxed font-sans">{item.description}</p>
                  )}

                  {item.skills && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-[#14131F]/10 text-[#14131F]/80"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Verification Status */}
                  <div className="pt-2 border-t border-[#14131F]/6">
                    <ItemVerificationBadge
                      status={item.verificationStatus}
                      note={item.verificationNote}
                      verifiedBy={item.verifiedBy}
                      verifiedAt={item.verifiedAt}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ALL or CERTIFICATIONS */}
      {(activeTab === 'all' || activeTab === 'certifications') && (
        <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-[#14131F] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#4338CA]" />
                <span>Certifications & Industry Credentials ({totalCertifications})</span>
              </h3>
              <p className="text-xs text-[#14131F]/60 mt-0.5">
                Recognized credentials from global cloud providers, national bodies (NPTEL), and university programs.
              </p>
            </div>
          </div>

          {certifications.length === 0 ? (
            <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-xl text-center space-y-3">
              <Award className="w-8 h-8 text-[#14131F]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#14131F]">No Certifications Added Yet</h4>
              <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                Add your technical certifications to strengthen your candidate credentials for recruiter evaluation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#14131F]">{cert.title}</h4>
                        <p className="text-xs text-[#4338CA] font-medium mt-0.5">{cert.issuer}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#14131F]/8 text-[#14131F]/80">
                        {cert.category || 'Industry'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#14131F]/60">
                      {cert.dateIssued && <span>Issued: {cert.dateIssued}</span>}
                    </div>

                    {/* Verification Status */}
                    <div className="pt-1">
                      <ItemVerificationBadge
                        status={cert.verificationStatus}
                        note={cert.verificationNote}
                        verifiedBy={cert.verifiedBy}
                        verifiedAt={cert.verifiedAt}
                      />
                    </div>
                  </div>

                  {(cert.credentialUrl || cert.fileUrl) && (
                    <div className="pt-2 border-t border-[#14131F]/6 flex flex-wrap items-center gap-3">
                      {cert.fileUrl && (
                        <a
                          href={cert.fileUrl}
                          onClick={(e) => {
                            if (cert.fileUrl.startsWith('/')) {
                              e.preventDefault();
                              viewAuthenticatedFile(cert.fileUrl, token || undefined);
                            }
                          }}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#4338CA] hover:underline flex items-center gap-1 font-medium"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl.startsWith('http') ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#14131F]/70 hover:text-[#14131F] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>View Credential</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ALL or ACHIEVEMENTS */}
      {(activeTab === 'all' || activeTab === 'achievements') && (
        <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-[#14131F] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#4338CA]" />
                <span>Honors, Competitions & Achievements ({totalAchievements})</span>
              </h3>
              <p className="text-xs text-[#14131F]/60 mt-0.5">
                Hackathons (SIH), coding ranks, competitive awards, and academic distinctions.
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddAchievementOpen(true)}
                className="px-3.5 py-1.5 bg-[#4338CA] text-white hover:bg-[#3730A3] transition-colors rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Achievement</span>
              </button>
            )}
          </div>

          {achievements.length === 0 ? (
            <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-xl text-center space-y-3">
              <Trophy className="w-8 h-8 text-[#14131F]/30 mx-auto" />
              <h4 className="text-sm font-bold text-[#14131F]">No Achievements Added Yet</h4>
              <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                Add competitive hackathon wins, top coding contest finishes, and collegiate awards to stand out.
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsAddAchievementOpen(true)}
                  className="px-4 py-2 bg-[#4338CA] text-white rounded-xl text-xs font-semibold hover:bg-[#3730A3] transition-colors"
                >
                  Add Achievement
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#14131F]">{item.title}</h4>
                        {item.organization && (
                          <p className="text-xs text-[#4338CA] font-medium mt-0.5">{item.organization}</p>
                        )}
                      </div>
                      {item.rank && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#B45309] shrink-0">
                          {item.rank}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#14131F]/60">
                      {item.date && <span>{item.date}</span>}
                    </div>

                    {item.description && (
                      <p className="text-xs text-[#14131F]/80 leading-relaxed font-sans">{item.description}</p>
                    )}

                    {/* Verification Status */}
                    <div className="pt-2 border-t border-[#14131F]/6">
                      <ItemVerificationBadge
                        status={item.verificationStatus}
                        note={item.verificationNote}
                        verifiedBy={item.verifiedBy}
                        verifiedAt={item.verifiedAt}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#14131F]/6">
                    {item.credentialUrl ? (
                      <a
                        href={item.credentialUrl.startsWith('http') ? item.credentialUrl : `https://${item.credentialUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#4338CA] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>View Proof / Credential</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-[#14131F]/40">No external link</span>
                    )}

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAchievement(item.id)}
                        disabled={deletingId === item.id}
                        className="text-[#14131F]/40 hover:text-[#FB7185] transition-colors p-1"
                        title="Delete Achievement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MODALS (For Student Owner) */}

      {/* ADD PROJECT MODAL */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 bg-[#14131F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-3">
              <h3 className="text-base font-bold text-[#14131F]">Add Technical Project</h3>
              <button
                type="button"
                onClick={() => setIsAddProjectOpen(false)}
                className="text-[#14131F]/40 hover:text-[#14131F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {projectError && (
              <div className="p-3 bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs text-[#14131F] rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
                <span>{projectError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#14131F] mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed In-Memory Cache"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Your Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Developer"
                    value={projectForm.role}
                    onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Duration / Dates</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2026 - Mar 2026"
                    value={projectForm.duration}
                    onChange={(e) => setProjectForm({ ...projectForm, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Technologies (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Go, Redis, Docker, gRPC"
                  value={projectForm.technologies}
                  onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the project's purpose, architecture, and core modules..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Measurable Outcomes / Impact</label>
                <input
                  type="text"
                  placeholder="e.g. Reduced read latency by 45% under 10k RPS load test"
                  value={projectForm.outcomes}
                  onChange={(e) => setProjectForm({ ...projectForm, outcomes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projectForm.githubUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={projectForm.liveUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#14131F]/8">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#14131F]/15 text-[#14131F] font-semibold hover:bg-[#FAFAF8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={projectSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-semibold hover:bg-[#3730A3] disabled:opacity-50"
                >
                  {projectSubmitting ? 'Adding...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD INTERNSHIP MODAL */}
      {isAddInternshipOpen && (
        <div className="fixed inset-0 z-50 bg-[#14131F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-3">
              <h3 className="text-base font-bold text-[#14131F]">Add Internship Record</h3>
              <button
                type="button"
                onClick={() => setIsAddInternshipOpen(false)}
                className="text-[#14131F]/40 hover:text-[#14131F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {internshipError && (
              <div className="p-3 bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs text-[#14131F] rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
                <span>{internshipError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInternship} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Razorpay, Siemens"
                    value={internshipForm.organization}
                    onChange={(e) => setInternshipForm({ ...internshipForm, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Backend SDE Intern"
                    value={internshipForm.role}
                    onChange={(e) => setInternshipForm({ ...internshipForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. May - Jul 2026"
                    value={internshipForm.duration}
                    onChange={(e) => setInternshipForm({ ...internshipForm, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru / Remote"
                    value={internshipForm.location}
                    onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Status</label>
                  <select
                    value={internshipForm.status}
                    onChange={(e: any) => setInternshipForm({ ...internshipForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA] bg-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Offer">Offer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Technologies & Skills Used</label>
                <input
                  type="text"
                  placeholder="e.g. Python, FastAPI, PostgreSQL, AWS"
                  value={internshipForm.skills}
                  onChange={(e) => setInternshipForm({ ...internshipForm, skills: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Contributions & Responsibilities</label>
                <textarea
                  rows={3}
                  placeholder="Describe your work, team responsibilities, and systems developed..."
                  value={internshipForm.description}
                  onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Certificate / Verification URL</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or verification link"
                  value={internshipForm.certificateUrl}
                  onChange={(e) => setInternshipForm({ ...internshipForm, certificateUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#14131F]/8">
                <button
                  type="button"
                  onClick={() => setIsAddInternshipOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#14131F]/15 text-[#14131F] font-semibold hover:bg-[#FAFAF8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={internshipSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-semibold hover:bg-[#3730A3] disabled:opacity-50"
                >
                  {internshipSubmitting ? 'Adding...' : 'Save Internship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ACHIEVEMENT MODAL */}
      {isAddAchievementOpen && (
        <div className="fixed inset-0 z-50 bg-[#14131F]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-3">
              <h3 className="text-base font-bold text-[#14131F]">Add Achievement / Honor</h3>
              <button
                type="button"
                onClick={() => setIsAddAchievementOpen(false)}
                className="text-[#14131F]/40 hover:text-[#14131F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {achievementError && (
              <div className="p-3 bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs text-[#14131F] rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
                <span>{achievementError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAchievement} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#14131F] mb-1">Achievement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2026 Grand Finalist"
                  value={achievementForm.title}
                  onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Issuing Organization / Event</label>
                  <input
                    type="text"
                    placeholder="e.g. Ministry of Education / ACM"
                    value={achievementForm.organization}
                    onChange={(e) => setAchievementForm({ ...achievementForm, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#14131F] mb-1">Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Feb 2026"
                    value={achievementForm.date}
                    onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Rank / Standing (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Winner, 1st Runner Up, Top 5%"
                  value={achievementForm.rank}
                  onChange={(e) => setAchievementForm({ ...achievementForm, rank: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe the competition scope and your submission..."
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#14131F] mb-1">Credential Proof URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={achievementForm.credentialUrl}
                  onChange={(e) => setAchievementForm({ ...achievementForm, credentialUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-[#14131F]/15 rounded-xl focus:outline-hidden focus:border-[#4338CA]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#14131F]/8">
                <button
                  type="button"
                  onClick={() => setIsAddAchievementOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#14131F]/15 text-[#14131F] font-semibold hover:bg-[#FAFAF8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={achievementSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-semibold hover:bg-[#3730A3] disabled:opacity-50"
                >
                  {achievementSubmitting ? 'Adding...' : 'Save Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
