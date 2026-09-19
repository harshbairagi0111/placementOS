import React from 'react';
import {
  Briefcase,
  BookOpen,
  Landmark,
  GraduationCap,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Building2,
  School,
} from 'lucide-react';
import { AuthUser, UserRole } from '../../context/AuthContext';

interface RoleDashboardPlaceholderProps {
  role: 'industry' | 'academician' | 'institution';
  user: AuthUser | null;
  onLogout: () => void;
  degradedModeBanner?: React.ReactNode;
}

const ROLE_META = {
  industry: {
    title: 'Industry & Recruiter Portal',
    roleLabel: 'Industry',
    badge: 'Recruiter Workspace',
    icon: Briefcase,
    accentColor: '#4338CA', // Indigo
    chipBg: 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20',
    tagline: 'Job management, candidate search & automated interview scheduling.',
    apiStatus: 'Routes mounted at /api/recruiters and /api/jobs',
  },
  academician: {
    title: 'Academician & Faculty Portal',
    roleLabel: 'Academician',
    badge: 'Faculty Workspace',
    icon: BookOpen,
    accentColor: '#059669', // Emerald/Green
    chipBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tagline: 'Curriculum alignment, student skill verification & batch performance oversight.',
    apiStatus: 'Routes mounted at /api/academician/me/overview',
  },
  institution: {
    title: 'Institution & TPO Portal',
    roleLabel: 'Institution',
    badge: 'Campus Placement Office',
    icon: Landmark,
    accentColor: '#D97706', // Amber
    chipBg: 'bg-amber-50 text-amber-800 border-amber-200',
    tagline: 'Drive orchestration, university eligibility cohorts & enterprise placement reporting.',
    apiStatus: 'Routes mounted at /api/tpo/stats and /api/tpo/students',
  },
};

export const RoleDashboardPlaceholder: React.FC<RoleDashboardPlaceholderProps> = ({
  role,
  user,
  onLogout,
  degradedModeBanner,
}) => {
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const orgName =
    role === 'industry'
      ? user?.company || 'Industry Partner'
      : user?.collegeName || user?.college || 'Academic Institution';

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#14131F] flex flex-col font-sans">
      {degradedModeBanner}

      {/* Portal Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#14131F]/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4338CA] flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight font-display text-[#14131F]">
                placementOS
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.chipBg}`}>
                {meta.badge}
              </span>
            </div>
            <p className="text-xs text-[#14131F]/60 hidden sm:block">
              Verified campus placement & career network
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-[#14131F]">{user?.name || user?.fullName || 'User'}</p>
            <p className="text-[11px] text-[#14131F]/60">{orgName}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#14131F]/15 hover:bg-[#FAFAF8] text-xs font-medium text-[#14131F]/80 hover:text-[#14131F] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Centered Placeholder Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          {/* Role Icon Circle */}
          <div className="w-16 h-16 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center mx-auto mb-5">
            <Icon className="w-8 h-8" />
          </div>

          {/* Role Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-3 bg-[#FAFAF8] border-[#14131F]/10 text-[#14131F]/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
            <span className="capitalize">{meta.roleLabel} Portal</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#14131F] tracking-tight mb-2">
            {meta.roleLabel} Dashboard
          </h2>

          {/* Explicit user instruction subhead */}
          <p className="text-sm font-medium text-[#4338CA] mb-3">
            Dashboard coming in the next step
          </p>

          <p className="text-xs sm:text-sm text-[#14131F]/65 mb-6 leading-relaxed max-w-md mx-auto">
            {meta.tagline}
          </p>

          {/* Authenticated Context Strip */}
          <div className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl p-3.5 text-left text-xs mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#14131F]/60">Authenticated Email:</span>
              <span className="font-semibold text-[#14131F]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#14131F]/60">Role Assigned:</span>
              <span className="font-semibold capitalize text-[#4338CA]">{role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#14131F]/60">Affiliation:</span>
              <span className="font-medium text-[#14131F]">{orgName}</span>
            </div>
            {user?.designation && (
              <div className="flex items-center justify-between">
                <span className="text-[#14131F]/60">Designation:</span>
                <span className="font-medium text-[#14131F]">{user.designation}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#14131F]/10 flex items-center gap-1.5 text-[11px] text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{meta.apiStatus}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            Sign out to switch role
          </button>
        </div>
      </main>
    </div>
  );
};
