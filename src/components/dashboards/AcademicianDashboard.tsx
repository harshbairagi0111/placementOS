import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Briefcase,
  Layers,
  GraduationCap,
  Handshake,
  FlaskConical,
  UserCheck,
  User,
  Search,
  X,
  Menu,
  LogOut,
  RefreshCw,
  BookOpen,
  Building2,
  Award,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  School,
  Sparkles,
  Calendar,
  Clock,
  Coins,
  Check,
  Filter,
  Plus,
  Info,
  Edit3,
  Linkedin,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardShell } from './DashboardShell';
import { Button } from '../ui/Button';
import { Badge, VerifiedSeal } from '../ui/Badge';
import { SectionHeading } from '../ui/SectionHeading';
import { PortfolioVerificationQueue } from '../verification/PortfolioVerificationQueue';
import { AcademicianMentorshipView } from '../mentorship/AcademicianMentorshipView';

export type AcademicianNavTab =
  | 'overview'
  | 'portfolio_verification'
  | 'faculty_internships'
  | 'industrial_training'
  | 'fdps'
  | 'consultancy'
  | 'research_collaboration'
  | 'research'
  | 'mentorship'
  | 'profile';

export interface AcademicianDashboardProps {
  onSwitchRole?: () => void;
  onLogout: () => void;
}

export interface OpportunityItem {
  _id: string;
  id?: string;
  company: string;
  title: string;
  type: 'Faculty Internship' | 'Industrial Training' | 'FDP' | 'Consultancy' | 'Research Collaboration';
  description?: string;
  duration?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  requiredExpertise?: string[];
  stipendOrHonorarium?: string;
  deadline?: string;
  status?: string;
  createdAt?: string;
}

export interface ApplicationItem {
  _id: string;
  id?: string;
  opportunityId: string;
  status: 'Applied' | 'Under Review' | 'Selected' | 'Rejected';
  createdAt?: string;
  opportunity?: {
    id?: string;
    title?: string;
    company?: string;
    type?: string;
    duration?: string;
    mode?: string;
    stipendOrHonorarium?: string;
    deadline?: string;
  } | null;
}

interface AcademicianProfile {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  college?: string;
  collegeName?: string;
  department?: string;
  designation?: string;
  phone?: string;
  createdAt?: string;
}

interface AcademicianStats {
  studentsTracked: number;
  coursesSupervised: number;
  skillAssessmentsReviewed: number;
}

// Realistic curated fallback opportunities for modules when database collection is newly initialized
export const FALLBACK_OPPORTUNITIES: Record<string, OpportunityItem[]> = {
  FDP: [
    {
      _id: 'demo-fdp-1',
      company: 'Google Cloud Labs & IIT Madras',
      title: 'National FDP on Generative AI & Cloud Infrastructure Architecture',
      type: 'FDP',
      description:
        'Comprehensive pedagogical immersion on generative AI system design, large multimodal models, tensor processing units (TPUs), and cloud curriculum development.',
      duration: '2 Weeks (Intensive)',
      mode: 'Online',
      requiredExpertise: ['AI / Machine Learning', 'Cloud Infrastructure', 'Python', 'Curriculum Design'],
      stipendOrHonorarium: 'AICTE / Industry Certified + Full Grant',
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
    {
      _id: 'demo-fdp-2',
      company: 'AWS Academy & Intel',
      title: 'Deep Learning & Edge Computing Systems for Academia',
      type: 'FDP',
      description:
        'Advanced training cohort for computer science and electronics faculty focusing on edge AI acceleration, PyTorch optimization, and laboratory infrastructure setup.',
      duration: '3 Weeks',
      mode: 'Hybrid',
      requiredExpertise: ['PyTorch', 'Edge Computing', 'Computer Vision', 'Deep Learning'],
      stipendOrHonorarium: 'Sponsored Fellowship + Hardware Dev Kit',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
    {
      _id: 'demo-fdp-3',
      company: 'TCS Academic Interface Program',
      title: 'Modern Software Engineering Pedagogies & DevOps Automation',
      type: 'FDP',
      description:
        'Hands-on immersion into modern continuous integration, automated testing frameworks, and scalable cloud microservice patterns to bridge the industry-classroom gap.',
      duration: '1 Week',
      mode: 'Online',
      requiredExpertise: ['Agile DevOps', 'CI/CD Pipelines', 'Software Architecture'],
      stipendOrHonorarium: 'Honorarium ₹15,000 + Faculty Certificate',
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
  ],
  Consultancy: [
    {
      _id: 'demo-consult-1',
      company: 'Mahindra Electric Mobility',
      title: 'Battery Management System (BMS) Thermal Modeling & Safety Audit',
      type: 'Consultancy',
      description:
        'Seeking academic domain specialist in electrical and thermal engineering to conduct finite element thermal audits and validate predictive cooling algorithms for EV battery packs.',
      duration: '3 Months (Part-Time Advisory)',
      mode: 'Hybrid',
      requiredExpertise: ['Thermal Analysis', 'MATLAB / Simulink', 'Power Electronics', 'Battery Chemistry'],
      stipendOrHonorarium: '₹2,50,000 Advisory Retainer',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
    {
      _id: 'demo-consult-2',
      company: 'Razorpay Payments Engineering',
      title: 'Distributed Ledger & High-Throughput Settlement Engine Architecture Review',
      type: 'Consultancy',
      description:
        'Engagement for systems and cryptographic researchers to review concurrency patterns, fault tolerance, and cryptographic audit proofs for next-generation payment pipelines.',
      duration: '6 Weeks',
      mode: 'Online',
      requiredExpertise: ['Distributed Systems', 'Applied Cryptography', 'High Concurrency', 'Database Internals'],
      stipendOrHonorarium: '₹1,80,000 Consulting Fee',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
    {
      _id: 'demo-consult-3',
      company: 'Siemens Healthineers',
      title: 'Computer Vision Advisory: Medical Imaging Artifact Removal & 3D Reconstruction',
      type: 'Consultancy',
      description:
        'Retainer with academic radiology and computer vision scientists to develop denoising kernels and validation metrics for ultra-low-dose CT scan reconstructions.',
      duration: '4 Months Retainer',
      mode: 'Hybrid',
      requiredExpertise: ['Medical Imaging', 'Convolutional Networks', 'Signal Processing', 'PyTorch'],
      stipendOrHonorarium: '₹3,00,000 Retainer Fee',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
  ],
  'Research Collaboration': [
    {
      _id: 'demo-res-1',
      company: 'Microsoft Research India',
      title: 'Joint R&D: Multilingual Indian Language Acoustic & Speech Processing (ASR)',
      type: 'Research Collaboration',
      description:
        'Joint university research partnership focusing on low-resource Indic speech recognition, dialect preservation, and self-supervised audio representations.',
      duration: '12 Months Collaborative Project',
      mode: 'Hybrid',
      requiredExpertise: ['Speech Processing', 'Transformers', 'NLP', 'Acoustic Modeling'],
      stipendOrHonorarium: '₹15,00,000 Research Grant + Azure Compute',
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
    {
      _id: 'demo-res-2',
      company: 'Intel Labs India',
      title: 'Hardware Acceleration for Sparse Matrix Operations in LLM Inferencing',
      type: 'Research Collaboration',
      description:
        'Investigate hardware-software co-design opportunities for sparse attention mechanisms on next-generation heterogeneous neural network accelerators.',
      duration: '6 Months Project',
      mode: 'Offline',
      requiredExpertise: ['Computer Architecture', 'CUDA', 'FPGA / ASIC Design', 'Kernel Optimization'],
      stipendOrHonorarium: '₹8,00,000 Seed Grant + Silicon Access',
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
    {
      _id: 'demo-res-3',
      company: 'Bosch Center for Artificial Intelligence',
      title: 'Safety-Critical Reinforcement Learning for Autonomous Robotic Perception',
      type: 'Research Collaboration',
      description:
        'Collaborative research initiative with robotics and control faculties to prove formal safety guarantees and Lyapunov constraints in deep RL policies for mobile robots.',
      duration: '9 Months Joint Initiative',
      mode: 'Hybrid',
      requiredExpertise: ['Reinforcement Learning', 'Robotics (ROS)', 'Formal Methods', 'Control Theory'],
      stipendOrHonorarium: '₹10,50,000 Industrial R&D Grant',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Active',
    },
  ],
};

interface AcademicOpportunityModuleProps {
  type: 'FDP' | 'Consultancy' | 'Research Collaboration';
  title: string;
  subtitle: string;
  badgeLabel: string;
  applyButtonLabel: string;
  pilotDescription: string;
  heroIcon: React.ElementType;
  applications: ApplicationItem[];
  applicationsLoading: boolean;
  applicationsError?: string | null;
  opportunities: OpportunityItem[];
  opportunitiesLoading: boolean;
  opportunitiesError: string | null;
  onRefresh: () => void;
  onApply: (opp: OpportunityItem) => Promise<void>;
  applyingOpportunityId: string | null;
  applySuccess: string | null;
  applyError: string | null;
  onClearAlerts: () => void;
  resolveOpportunity: (app: ApplicationItem) => Partial<OpportunityItem> | null;
}

const AcademicOpportunityModule: React.FC<AcademicOpportunityModuleProps> = ({
  type,
  title,
  subtitle,
  badgeLabel,
  applyButtonLabel,
  pilotDescription,
  heroIcon: HeroIcon,
  applications,
  applicationsLoading,
  applicationsError,
  opportunities,
  opportunitiesLoading,
  opportunitiesError,
  onRefresh,
  onApply,
  applyingOpportunityId,
  applySuccess,
  applyError,
  onClearAlerts,
  resolveOpportunity,
}) => {
  const [viewMode, setViewMode] = useState<'explore' | 'my_applications'>('explore');
  const [modeFilter, setModeFilter] = useState<'all' | 'Online' | 'Offline' | 'Hybrid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Opportunities filtered by search and mode
  const filteredOpportunities = opportunities.filter((opp) => {
    if (modeFilter !== 'all' && opp.mode !== modeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchCompany = opp.company.toLowerCase().includes(q);
      const matchSkills = opp.requiredExpertise?.some((s) => s.toLowerCase().includes(q));
      const matchDesc = opp.description?.toLowerCase().includes(q);
      return matchTitle || matchCompany || matchSkills || matchDesc;
    }
    return true;
  });

  // Applications matching this category
  const moduleApplications = applications.filter((app) => {
    const opp = resolveOpportunity(app);
    return opp?.type === type;
  });

  const isApplied = (oppId: string) => {
    return applications.some(
      (app) =>
        app.opportunityId === oppId ||
        app.opportunity?.id === oppId ||
        (app.opportunity as any)?._id === oppId
    );
  };

  const getApplication = (oppId: string) => {
    return applications.find(
      (app) =>
        app.opportunityId === oppId ||
        app.opportunity?.id === oppId ||
        (app.opportunity as any)?._id === oppId
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeading
          title={title}
          subtitle={subtitle}
          badge={
            <Badge variant="verified" size="sm">
              {badgeLabel}
            </Badge>
          }
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-[#14131F]/5 rounded-xl border border-[#14131F]/10">
                <button
                  type="button"
                  onClick={() => setViewMode('explore')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'explore'
                      ? 'bg-white text-[#4338CA] shadow-xs'
                      : 'text-[#14131F]/60 hover:text-[#14131F]'
                  }`}
                >
                  Explore
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('my_applications')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    viewMode === 'my_applications'
                      ? 'bg-white text-[#4338CA] shadow-xs'
                      : 'text-[#14131F]/60 hover:text-[#14131F]'
                  }`}
                >
                  <span>My Applications</span>
                  {moduleApplications.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#4338CA] text-white">
                      {moduleApplications.length}
                    </span>
                  )}
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={opportunitiesLoading || applicationsLoading}
                icon={
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      opportunitiesLoading || applicationsLoading ? 'animate-spin' : ''
                    }`}
                  />
                }
                className="text-xs shrink-0"
              >
                Refresh
              </Button>
            </div>
          }
        />
      </div>

      {/* Alerts */}
      {applySuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Application Transmitted Successfully</p>
              <p className="mt-0.5 text-emerald-800 leading-relaxed">{applySuccess}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearAlerts}
            className="text-emerald-700 hover:text-emerald-900 shrink-0 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {applyError && (
        <div className="p-4 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#E11D48] text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Submission Notice</p>
              <p className="mt-0.5 leading-relaxed">{applyError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearAlerts}
            className="text-[#E11D48] hover:text-red-950 shrink-0 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pilot Transparency Banner */}
      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center shrink-0">
            <HeroIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#14131F]">Corporate Partnership Pilot</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Corporate Hosts
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#14131F]/60 mt-0.5">
              {pilotDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#14131F]/65 shrink-0 self-end sm:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{opportunities.length} programs active</span>
        </div>
      </div>

      {viewMode === 'explore' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#14131F]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search ${type.toLowerCase()} by topic, enterprise host, or required skills...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl text-xs text-[#14131F] placeholder:text-[#14131F]/40 focus:outline-none focus:border-[#4338CA] focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mode Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-semibold text-[#14131F]/50 mr-1 hidden md:inline">Mode:</span>
                {(['all', 'Online', 'Offline', 'Hybrid'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModeFilter(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      modeFilter === m
                        ? 'bg-[#14131F] text-white'
                        : 'bg-[#FAFAF8] text-[#14131F]/70 hover:bg-[#14131F]/5 border border-[#14131F]/8'
                    }`}
                  >
                    {m === 'all' ? 'All Modes' : m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#14131F]/50 pt-1 border-t border-[#14131F]/6">
              <span>
                Showing {filteredOpportunities.length} of {opportunities.length} opportunities
              </span>
              {(searchQuery || modeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setModeFilter('all');
                  }}
                  className="text-[#4338CA] hover:underline font-semibold"
                >
                  Clear active filters
                </button>
              )}
            </div>
          </div>

          {/* Opportunities Cards Grid */}
          {opportunitiesLoading ? (
            <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-3 shadow-xs">
              <Loader2 className="w-6 h-6 text-[#4338CA] animate-spin mx-auto" />
              <p className="text-xs text-[#14131F]/60">Loading {type} opportunities from verified hosts...</p>
            </div>
          ) : opportunitiesError ? (
            <div className="bg-white border border-[#FB7185]/30 rounded-2xl p-8 text-center space-y-3 shadow-xs">
              <AlertCircle className="w-6 h-6 text-[#E11D48] mx-auto" />
              <p className="text-xs text-[#E11D48]">{opportunitiesError}</p>
              <Button variant="secondary" size="sm" onClick={onRefresh} className="text-xs">
                Retry Connection
              </Button>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center mx-auto">
                <HeroIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#14131F]">No opportunities found</h4>
              <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                {searchQuery || modeFilter !== 'all'
                  ? 'No listings match your filter combination. Try adjusting your query.'
                  : `Currently no active ${type} listings available. Check back soon or click refresh.`}
              </p>
              {(searchQuery || modeFilter !== 'all') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setModeFilter('all');
                  }}
                  className="text-xs mt-2"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {filteredOpportunities.map((opp) => {
                const applied = isApplied(opp._id);
                const appData = getApplication(opp._id);
                const isCurrentlyApplying = applyingOpportunityId === opp._id;

                return (
                  <div
                    key={opp._id}
                    className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-[#4338CA]/30 transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Company & Verified Seal */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FAFAF8] border border-[#14131F]/10 flex items-center justify-center text-[#14131F] font-bold text-xs shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-[#4338CA]" />
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-[#14131F] truncate">
                            {opp.company}
                          </span>
                        </div>
                        <VerifiedSeal size="sm" iconType="check" label="Host Verified" />
                      </div>

                      {/* Opportunity Title */}
                      <h4 className="font-display font-bold text-base sm:text-lg text-[#14131F] leading-snug">
                        {opp.title}
                      </h4>

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            opp.type === 'FDP'
                              ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                              : opp.type === 'Consultancy'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {opp.type}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#14131F]/5 text-[#14131F]/70 border border-[#14131F]/8">
                          {opp.mode || 'Online'}
                        </span>

                        {opp.stipendOrHonorarium && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#A3E635]/20 text-emerald-900 border border-[#A3E635]/30 flex items-center gap-1">
                            <Coins className="w-3 h-3 text-emerald-700" />
                            <span>{opp.stipendOrHonorarium}</span>
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {opp.description && (
                        <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed line-clamp-3">
                          {opp.description}
                        </p>
                      )}

                      {/* Key Parameters */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#14131F]/50 block">Duration</span>
                            <span className="text-xs font-semibold text-[#14131F] truncate block">
                              {opp.duration || 'Flexible'}
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#14131F]/50 block">Deadline</span>
                            <span className="text-xs font-semibold text-[#14131F] truncate block">
                              {opp.deadline
                                ? new Date(opp.deadline).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Rolling Applications'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Required Expertise Tags */}
                      {opp.requiredExpertise && opp.requiredExpertise.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-[#14131F]/50">Required Expertise:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {opp.requiredExpertise.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-md bg-[#FAFAF8] text-[#14131F]/75 border border-[#14131F]/10 text-[11px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Action */}
                    <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-[#14131F]/50">
                        {applied ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> Application on Record
                          </span>
                        ) : (
                          <span>Verified Corporate Host</span>
                        )}
                      </div>

                      <div>
                        {applied ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A3E635]/20 text-emerald-900 border border-[#A3E635]/40 text-xs font-bold shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Applied • {appData?.status || 'Under Review'}</span>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onApply(opp)}
                            disabled={isCurrentlyApplying}
                            icon={
                              isCurrentlyApplying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5" />
                              )
                            }
                            className="text-xs font-semibold"
                          >
                            {isCurrentlyApplying ? 'Submitting...' : applyButtonLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* MY APPLICATIONS VIEW */
        <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#14131F]/6">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-[#14131F]">
                Your Submitted {type} Applications
              </h3>
              <p className="text-xs text-[#14131F]/60 mt-0.5">
                Track review progress, status updates, and host feedback for this program category.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('explore')}
              className="text-xs text-[#4338CA] border border-[#4338CA]/20"
            >
              Back to Explorer
            </Button>
          </div>

          {applicationsLoading ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-[#4338CA] animate-spin mx-auto" />
              <p className="text-xs text-[#14131F]/60">Loading your applications...</p>
            </div>
          ) : applicationsError ? (
            <div className="p-6 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#E11D48] text-xs text-center">
              {applicationsError}
            </div>
          ) : moduleApplications.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center mx-auto">
                <HeroIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#14131F]">No applications submitted yet</h4>
              <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                Browse active {type} opportunities in the explorer tab and submit your expression of interest.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewMode('explore')}
                className="text-xs font-semibold mt-2"
              >
                Explore Opportunities
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {moduleApplications.map((app) => {
                const opp = resolveOpportunity(app);
                return (
                  <div
                    key={app._id}
                    className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#4338CA] uppercase tracking-wider">
                          {opp?.company || 'Corporate Host'}
                        </span>
                        <span className="text-[#14131F]/30">•</span>
                        <span className="text-[11px] font-medium text-[#14131F]/60">
                          {opp?.type || type}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-[#14131F]">
                        {opp?.title || 'Academic Opportunity'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#14131F]/60 pt-0.5">
                        {opp?.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#14131F]/40" />
                            <span>{opp.duration}</span>
                          </span>
                        )}
                        {opp?.mode && (
                          <span className="px-1.5 py-0.2 rounded bg-[#14131F]/5 text-[#14131F]/70">
                            {opp.mode}
                          </span>
                        )}
                        <span>
                          Applied:{' '}
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          app.status === 'Selected'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : app.status === 'Under Review'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : app.status === 'Rejected'
                            ? 'bg-[#FB7185]/20 text-[#E11D48] border-[#FB7185]/35'
                            : 'bg-[#A3E635]/20 text-emerald-950 border-[#A3E635]/40'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   MENTORSHIP AVAILABILITY & PROFILE MODULE
   Allows academicians to opt in as mentors, select engagement types,
   and specify expertise areas for discovery in the future Collaboration Hub.
   ========================================================================= */

interface AcademicianMentorshipModuleProps {
  user: any;
  token: string | null;
  updateUser: (userData: any) => void;
}

const MENTORSHIP_ENGAGEMENT_TYPES = [
  {
    id: 'Live Projects',
    label: 'Live Projects',
    description: 'Guide student squads engineering production-ready applications, open-source modules, or client prototypes.',
  },
  {
    id: 'Internships',
    label: 'Internships',
    description: 'Provide academic co-mentorship, technical milestone reviews, and performance evaluations for student interns.',
  },
  {
    id: 'Innovation Challenges',
    label: 'Innovation Challenges',
    description: 'Coach faculty-student teams in hackathons, AICTE Smart India Hackathons, and national tech competitions.',
  },
  {
    id: 'Research Projects',
    label: 'Research Projects',
    description: 'Supervise undergraduate research fellows, capstone experiments, patent filings, and conference paper preprints.',
  },
  {
    id: 'Industry Programs',
    label: 'Industry Programs',
    description: 'Lead or co-facilitate corporate-sponsored training modules, bootcamps, and specialty technology cohorts.',
  },
] as const;

const POPULAR_EXPERTISE_AREAS = [
  'Machine Learning & AI',
  'Distributed Systems',
  'Cloud Architecture',
  'Cybersecurity & Cryptography',
  'VLSI & Embedded Systems',
  'Data Engineering',
  'Full-Stack Web',
  'Computer Vision',
  'Natural Language Processing',
  'DevOps & Kubernetes',
  'Mobile Systems',
  'IoT & Edge Computing',
];

const AcademicianMentorshipModule: React.FC<AcademicianMentorshipModuleProps> = ({
  user,
  token,
  updateUser,
}) => {
  const [isMentorAvailable, setIsMentorAvailable] = useState<boolean>(
    Boolean(user?.isMentorAvailable)
  );
  const [mentorAreas, setMentorAreas] = useState<string[]>(
    Array.isArray(user?.mentorAreas) ? [...user.mentorAreas] : []
  );
  const [mentorshipTypes, setMentorshipTypes] = useState<string[]>(
    Array.isArray(user?.mentorshipTypes) ? [...user.mentorshipTypes] : []
  );
  const [newAreaInput, setNewAreaInput] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Sync with user prop changes
  useEffect(() => {
    if (user) {
      setIsMentorAvailable(Boolean(user.isMentorAvailable));
      if (Array.isArray(user.mentorAreas)) {
        setMentorAreas([...user.mentorAreas]);
      }
      if (Array.isArray(user.mentorshipTypes)) {
        setMentorshipTypes([...user.mentorshipTypes]);
      }
    }
  }, [user?.id, user?.isMentorAvailable, user?.mentorAreas, user?.mentorshipTypes]);

  const handleToggleType = (typeId: string) => {
    setMentorshipTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
    setIsDirty(true);
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleAddArea = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    if (!mentorAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setMentorAreas((prev) => [...prev, trimmed]);
      setIsDirty(true);
      setSaveSuccess(null);
      setSaveError(null);
    }
    setNewAreaInput('');
  };

  const handleRemoveArea = (indexToRemove: number) => {
    setMentorAreas((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setIsDirty(true);
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleQuickAdd = (area: string) => {
    if (!mentorAreas.some((a) => a.toLowerCase() === area.toLowerCase())) {
      setMentorAreas((prev) => [...prev, area]);
      setIsDirty(true);
      setSaveSuccess(null);
      setSaveError(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const payload = {
        isMentorAvailable,
        mentorAreas,
        mentorshipTypes: isMentorAvailable ? mentorshipTypes : [],
      };

      const res = await fetch('/api/academician/mentor-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update mentorship profile');
      }

      // Update AuthContext user so update immediately reflects across app
      updateUser(data.user || payload);

      setSaveSuccess(
        isMentorAvailable
          ? 'Mentorship preferences saved successfully. Your faculty profile is marked as discoverable for upcoming matching cohorts.'
          : 'Mentorship preferences saved. Your status is currently set to inactive.'
      );
      setIsDirty(false);
    } catch (err: any) {
      console.error('Error saving mentorship preferences:', err);
      setSaveError(err.message || 'Failed to save mentorship preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header banner & honest explanation */}
      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-semibold bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
              <span>Faculty Mentorship Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#14131F] tracking-tight">
              Mentorship Availability & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-[#14131F]/70 max-w-2xl leading-relaxed">
              Declare your interest and capacity to mentor student cohorts, review capstone architectures, and guide technical innovation teams. As the Collaboration Hub expands, departmental coordinators and project leads will use these declared specializations to invite you to relevant mentorship initiatives.
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-start sm:items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isMentorAvailable
                  ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                  : 'bg-[#14131F]/5 text-[#14131F]/60 border-[#14131F]/10'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isMentorAvailable ? 'bg-[#65A30D] animate-pulse' : 'bg-[#14131F]/30'
                }`}
              />
              <span>{isMentorAvailable ? 'Available to Mentor' : 'Status: Inactive'}</span>
            </span>
            {isDirty && (
              <span className="text-xs font-medium text-[#4338CA] bg-[#4338CA]/5 px-2 py-0.5 rounded-md">
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* Honest framing callout */}
        <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl p-4 flex items-start gap-3 text-xs text-[#14131F]/75">
          <div className="w-5 h-5 rounded-md bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-[#14131F]">
              Collaboration Hub Integration Roadmap
            </p>
            <p className="leading-relaxed">
              Live automated project matching and student challenge allocations will launch in the upcoming Collaboration Hub phase. Configuring your preferences today registers your faculty profile into the verified mentor registry so institutional administrators can immediately match incoming student cohorts against your declared technical domains.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{saveSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 p-0.5"
            aria-label="Dismiss success message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#14131F] text-xs sm:text-sm rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-[#E11D48]">Unable to update mentorship preferences</p>
            <p className="text-xs text-[#14131F]/70 mt-0.5">{saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-[#14131F]/50 hover:text-[#14131F] p-0.5"
            aria-label="Dismiss error message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Form + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Availability Toggle Card */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold font-display text-[#14131F]">
                  Available to Mentor
                </h2>
                <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                  Toggle this switch on to indicate that you are open to accepting new student mentees, project oversight requests, and challenge coaching assignments.
                </p>
              </div>

              {/* Genuine Toggle Switch */}
              <div className="shrink-0 flex items-center pt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isMentorAvailable}
                  onClick={() => {
                    setIsMentorAvailable(!isMentorAvailable);
                    setIsDirty(true);
                    setSaveSuccess(null);
                    setSaveError(null);
                  }}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] focus-visible:ring-offset-2 ${
                    isMentorAvailable ? 'bg-[#4338CA]' : 'bg-[#14131F]/15'
                  }`}
                >
                  <span className="sr-only">Toggle mentorship availability</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      isMentorAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* State Status description */}
            <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-xs">
              <span className="text-[#14131F]/60">Current Availability State:</span>
              {isMentorAvailable ? (
                <span className="font-semibold text-[#4338CA] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A3E635] border border-[#65A30D]" />
                  Active in Faculty Mentor Registry
                </span>
              ) : (
                <span className="text-[#14131F]/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#14131F]/25" />
                  Not Discoverable for Mentorship
                </span>
              )}
            </div>
          </div>

          {/* Conditional Sub-settings: Only when isMentorAvailable is true */}
          {isMentorAvailable ? (
            <>
              {/* Mentorship Types Multi-select */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold font-display text-[#14131F]">
                      Preferred Engagement Formats
                    </h2>
                    <span className="text-xs text-[#14131F]/50">
                      {mentorshipTypes.length} of {MENTORSHIP_ENGAGEMENT_TYPES.length} selected
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                    Select each engagement format where you are willing to advise students or academic cohorts.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {MENTORSHIP_ENGAGEMENT_TYPES.map((type) => {
                    const isSelected = mentorshipTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleToggleType(type.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#4338CA]/[0.05] border-[#4338CA] shadow-2xs'
                            : 'bg-white border-[#14131F]/10 hover:border-[#4338CA]/30 hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <span className="text-xs sm:text-sm font-semibold text-[#14131F]">
                            {type.label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'bg-[#4338CA] border-[#4338CA] text-white'
                                : 'border-[#14131F]/25 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                        </div>
                        <p className="text-xs text-[#14131F]/60 leading-relaxed">
                          {type.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Areas of Expertise Tag Input */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold font-display text-[#14131F]">
                      Areas of Expertise & Disciplines
                    </h2>
                    <span className="text-xs text-[#14131F]/50">
                      {mentorAreas.length} active tag{mentorAreas.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed">
                    Add technical domains, research topics, or architectural specialties where you can provide rigorous feedback.
                  </p>
                </div>

                {/* Tag Pills List */}
                <div className="min-h-[48px] p-3 rounded-xl border border-[#14131F]/10 bg-[#FAFAF8] flex flex-wrap items-center gap-2">
                  {mentorAreas.length === 0 ? (
                    <span className="text-xs text-[#14131F]/40 italic py-1 px-1">
                      No areas added yet. Enter topics below or click from suggested disciplines.
                    </span>
                  ) : (
                    mentorAreas.map((area, idx) => (
                      <span
                        key={`${area}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-[#14131F] border border-[#14131F]/15 shadow-2xs group"
                      >
                        <span>{area}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(idx)}
                          className="text-[#14131F]/40 hover:text-[#FB7185] transition-colors p-0.5"
                          aria-label={`Remove ${area}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Input bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddArea();
                      }
                    }}
                    placeholder="e.g. Distributed Consensus, VLSI Physical Design, NLP..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddArea}
                    disabled={!newAreaInput.trim()}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-medium"
                  >
                    Add Topic
                  </Button>
                </div>

                {/* Popular suggestions */}
                <div className="pt-2 border-t border-[#14131F]/6 space-y-2">
                  <p className="text-xs text-[#14131F]/50">Suggested specializations:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_EXPERTISE_AREAS.filter(
                      (p) => !mentorAreas.some((a) => a.toLowerCase() === p.toLowerCase())
                    ).map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => handleQuickAdd(area)}
                        className="text-xs px-2.5 py-1 rounded-md border border-[#14131F]/10 bg-white text-[#14131F]/70 hover:text-[#4338CA] hover:border-[#4338CA]/30 transition-colors"
                      >
                        + {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Disabled placeholder guide */
            <div className="bg-[#FAFAF8] border border-dashed border-[#14131F]/12 rounded-2xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#14131F]/5 text-[#14131F]/50 flex items-center justify-center mx-auto">
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#14131F]/70">
                Mentorship options are hidden while availability is switched off.
              </p>
              <p className="text-xs text-[#14131F]/50 max-w-sm mx-auto">
                Turn on the "Available to mentor" switch above whenever you are ready to configure your preferred engagement formats and technical specializations.
              </p>
            </div>
          )}

          {/* Save Button Bar */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="text-xs text-[#14131F]/60 text-center sm:text-left">
              {isDirty ? (
                <span className="text-[#4338CA] font-medium">You have unsaved changes</span>
              ) : (
                <span>All mentorship preferences are synchronized</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {isDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMentorAvailable(Boolean(user?.isMentorAvailable));
                    setMentorAreas(Array.isArray(user?.mentorAreas) ? [...user.mentorAreas] : []);
                    setMentorshipTypes(Array.isArray(user?.mentorshipTypes) ? [...user.mentorshipTypes] : []);
                    setIsDirty(false);
                    setSaveSuccess(null);
                    setSaveError(null);
                  }}
                  disabled={saving}
                  className="text-xs flex-1 sm:flex-none"
                >
                  Reset
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                className="text-xs font-semibold flex-1 sm:flex-none"
              >
                {saving ? 'Saving Preferences...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Directory Preview Card */}
        <div className="space-y-4">
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-[#14131F]">
                  Registry Card Preview
                </h3>
                <span className="text-2xs uppercase tracking-wider text-[#14131F]/40 font-medium">
                  Live Preview
                </span>
              </div>
              <p className="text-xs text-[#14131F]/60">
                How your mentorship profile is displayed to university coordinators.
              </p>
            </div>

            <div className="border border-[#14131F]/10 rounded-xl p-4 bg-[#FAFAF8] space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-xs sm:text-sm text-[#14131F]">
                    {user?.name || 'Prof. Faculty Member'}
                  </h4>
                  <p className="text-xs text-[#14131F]/60">
                    {user?.designation || 'Academician'} • {user?.department || 'Department of Engineering'}
                  </p>
                  <p className="text-2xs text-[#14131F]/50">
                    {user?.collegeName || user?.college || 'Institution of Engineering & Technology'}
                  </p>
                </div>
                <div className="shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                      isMentorAvailable
                        ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                        : 'bg-[#14131F]/5 text-[#14131F]/50 border-[#14131F]/10'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isMentorAvailable ? 'bg-[#65A30D]' : 'bg-[#14131F]/30'
                      }`}
                    />
                    <span>{isMentorAvailable ? 'Available' : 'Inactive'}</span>
                  </span>
                </div>
              </div>

              {/* Formats preview */}
              {isMentorAvailable && mentorshipTypes.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#14131F]/6">
                  <span className="text-2xs uppercase tracking-wider font-semibold text-[#14131F]/50">
                    Engagement Formats
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mentorshipTypes.map((t) => (
                      <span
                        key={t}
                        className="text-2xs px-2 py-0.5 rounded-md bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas preview */}
              {isMentorAvailable && mentorAreas.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#14131F]/6">
                  <span className="text-2xs uppercase tracking-wider font-semibold text-[#14131F]/50">
                    Expertise Disciplines
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mentorAreas.map((a) => (
                      <span
                        key={a}
                        className="text-2xs px-2 py-0.5 rounded-md bg-white text-[#14131F]/80 border border-[#14131F]/12"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!isMentorAvailable && (
                <p className="text-xs text-[#14131F]/40 italic pt-1">
                  Currently not accepting mentees. Profile will not appear in cohort distribution lists.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   ACADEMICIAN PROFILE MODULE
   Comprehensive faculty profile management: view & edit mode, activity summary,
   research disciplines tag manager, industry consulting experience, and coordinates.
   ========================================================================= */

interface AcademicianProfileModuleProps {
  user: any;
  token: string | null;
  updateUser: (userData: any) => void;
  applications: ApplicationItem[];
  onNavigateTab: (tab: AcademicianNavTab) => void;
  resolveOpportunity: (app: ApplicationItem) => Partial<OpportunityItem> | null;
}

const SUGGESTED_RESEARCH_DOMAINS = [
  'Machine Learning & AI',
  'Distributed Systems',
  'Cloud Architecture',
  'VLSI & Nanoelectronics',
  'Cybersecurity & Cryptography',
  'Embedded Systems & IoT',
  'Quantum Computing',
  'Computer Vision',
  'Natural Language Processing',
  'Autonomous Robotics',
  'Data Engineering',
  'High Performance Computing',
];

const AcademicianProfileModule: React.FC<AcademicianProfileModuleProps> = ({
  user,
  token,
  updateUser,
  applications,
  onNavigateTab,
  resolveOpportunity,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Profile form state pre-filled from AuthContext user
  const [collegeName, setCollegeName] = useState<string>(
    user?.collegeName || user?.college || ''
  );
  const [department, setDepartment] = useState<string>(user?.department || '');
  const [designation, setDesignation] = useState<string>(user?.designation || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [linkedinUrl, setLinkedinUrl] = useState<string>(user?.linkedinUrl || '');
  const [researchAreas, setResearchAreas] = useState<string[]>(
    Array.isArray(user?.researchAreas) ? [...user.researchAreas] : []
  );
  const [industryExperience, setIndustryExperience] = useState<string>(
    user?.industryExperience || ''
  );

  const [newAreaInput, setNewAreaInput] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Sync profile form values when user object updates or when toggling edit mode
  useEffect(() => {
    if (user) {
      setCollegeName(user.collegeName || user.college || '');
      setDepartment(user.department || '');
      setDesignation(user.designation || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setLinkedinUrl(user.linkedinUrl || '');
      setResearchAreas(Array.isArray(user.researchAreas) ? [...user.researchAreas] : []);
      setIndustryExperience(user.industryExperience || '');
    }
  }, [user, isEditing]);

  const handleCancelEdit = () => {
    if (user) {
      setCollegeName(user.collegeName || user.college || '');
      setDepartment(user.department || '');
      setDesignation(user.designation || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setLinkedinUrl(user.linkedinUrl || '');
      setResearchAreas(Array.isArray(user.researchAreas) ? [...user.researchAreas] : []);
      setIndustryExperience(user.industryExperience || '');
    }
    setSaveError(null);
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleAddResearchArea = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    if (!researchAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setResearchAreas((prev) => [...prev, trimmed]);
      setIsDirty(true);
      setSaveSuccess(null);
      setSaveError(null);
    }
    setNewAreaInput('');
  };

  const handleRemoveResearchArea = (idxToRemove: number) => {
    setResearchAreas((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setIsDirty(true);
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleQuickAddResearchArea = (area: string) => {
    if (!researchAreas.some((a) => a.toLowerCase() === area.toLowerCase())) {
      setResearchAreas((prev) => [...prev, area]);
      setIsDirty(true);
      setSaveSuccess(null);
      setSaveError(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const payload = {
      collegeName: collegeName.trim(),
      department: department.trim(),
      designation: designation.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      linkedinUrl: linkedinUrl.trim(),
      researchAreas,
      industryExperience: industryExperience.trim(),
    };

    try {
      const res = await fetch('/api/academician/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update academician profile');
      }

      // Update AuthContext user with changed fields so the update reflects immediately across the app
      updateUser(data.user || payload);
      setSaveSuccess('Academician profile updated successfully.');
      setIsEditing(false);
      setIsDirty(false);
    } catch (err: any) {
      console.error('Error saving academician profile:', err);
      setSaveError(err.message || 'Failed to save academician profile');
    } finally {
      setSaving(false);
    }
  };

  // Activity breakdown using already-fetched data
  const totalApplied = applications.length;
  const facultyInternshipCount = applications.filter((a) => {
    const opp = resolveOpportunity(a);
    return opp?.type === 'Faculty Internship' || opp?.type === 'Industrial Training';
  }).length;
  const fdpCount = applications.filter((a) => {
    const opp = resolveOpportunity(a);
    return opp?.type === 'FDP';
  }).length;
  const consultancyCount = applications.filter((a) => {
    const opp = resolveOpportunity(a);
    return opp?.type === 'Consultancy';
  }).length;
  const researchCount = applications.filter((a) => {
    const opp = resolveOpportunity(a);
    return opp?.type === 'Research Collaboration';
  }).length;

  // Profile Completeness metric
  const completenessItems = [
    { label: 'Full Name', complete: Boolean(user?.name) },
    { label: 'Academic Designation', complete: Boolean(user?.designation) },
    { label: 'Department', complete: Boolean(user?.department) },
    { label: 'College / Institution', complete: Boolean(user?.collegeName || user?.college) },
    { label: 'Contact Phone', complete: Boolean(user?.phone) },
    { label: 'LinkedIn Profile', complete: Boolean(user?.linkedinUrl) },
    { label: 'Biography', complete: Boolean(user?.bio) },
    {
      label: 'Research Areas',
      complete: Array.isArray(user?.researchAreas) && user.researchAreas.length > 0,
    },
    { label: 'Industry Experience', complete: Boolean(user?.industryExperience) },
  ];
  const completedCount = completenessItems.filter((i) => i.complete).length;
  const completenessPct = Math.round((completedCount / completenessItems.length) * 100);

  const getInitials = (name?: string) => {
    if (!name) return 'FA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 flex items-center justify-center font-bold text-lg sm:text-xl font-display shrink-0 shadow-2xs">
              {getInitials(user?.name)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#14131F] tracking-tight">
                  {user?.name || 'Academician Profile'}
                </h1>
                <VerifiedSeal label="Verified Faculty" />
              </div>
              <p className="text-xs sm:text-sm text-[#14131F]/70">
                {user?.designation ? user.designation : 'Academician / Faculty Member'}
                {user?.department ? ` • ${user.department}` : ''}
              </p>
              <p className="text-xs text-[#14131F]/50 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {user?.collegeName || user?.college || 'Institution affiliation not yet set'}
                </span>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 pt-1 sm:pt-0">
            {!isEditing ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsEditing(true);
                  setSaveSuccess(null);
                  setSaveError(null);
                }}
                icon={<Edit3 className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  icon={
                    saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{saveSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#14131F] text-xs sm:text-sm rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-[#E11D48]">Unable to update profile</p>
            <p className="text-xs text-[#14131F]/70 mt-0.5">{saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-[#14131F]/50 hover:text-[#14131F] p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Profile Form/View + Activity & Completeness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: View or Edit Mode */}
        <div className="lg:col-span-2 space-y-6">
          {!isEditing ? (
            /* READ-ONLY VIEW MODE */
            <div className="space-y-6">
              {/* Academic & Departmental Affiliation */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold font-display text-[#14131F]">
                    Academic Affiliation
                  </h2>
                  <span className="text-xs text-[#14131F]/50">Faculty Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-1">
                    <span className="text-xs text-[#14131F]/50 font-medium">Designation</span>
                    <p className="text-sm font-semibold text-[#14131F]">
                      {user?.designation ? (
                        user.designation
                      ) : (
                        <span className="text-[#14131F]/40 font-normal italic">
                          Designation not specified
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-1">
                    <span className="text-xs text-[#14131F]/50 font-medium">Department</span>
                    <p className="text-sm font-semibold text-[#14131F]">
                      {user?.department ? (
                        user.department
                      ) : (
                        <span className="text-[#14131F]/40 font-normal italic">
                          Department not specified
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-1">
                    <span className="text-xs text-[#14131F]/50 font-medium">
                      Institution / College
                    </span>
                    <p className="text-sm font-semibold text-[#14131F]">
                      {user?.collegeName || user?.college ? (
                        user.collegeName || user.college
                      ) : (
                        <span className="text-[#14131F]/40 font-normal italic">
                          Institution affiliation not specified
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold font-display text-[#14131F]">
                    Biography & Academic Focus
                  </h2>
                  {!user?.bio && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold text-[#4338CA] hover:underline"
                    >
                      + Add Bio
                    </button>
                  )}
                </div>

                {user?.bio ? (
                  <p className="text-xs sm:text-sm text-[#14131F]/80 leading-relaxed whitespace-pre-line bg-[#FAFAF8] p-4 rounded-xl border border-[#14131F]/6">
                    {user.bio}
                  </p>
                ) : (
                  <div className="p-4 rounded-xl bg-[#FAFAF8] border border-dashed border-[#14131F]/15 flex items-start justify-between gap-4">
                    <div className="space-y-1 text-xs text-[#14131F]/65">
                      <p className="font-semibold text-[#14131F]">No biography added yet</p>
                      <p>
                        A concise summary of your research specialization, teaching pedigree, and
                        lab leadership will appear here.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-2xs shrink-0 font-medium"
                    >
                      Add Bio
                    </Button>
                  </div>
                )}
              </div>

              {/* Research Areas (Tags) */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold font-display text-[#14131F]">
                      Research Disciplines & Domains
                    </h2>
                    <p className="text-xs text-[#14131F]/60">
                      Scientific areas for matching corporate R&D partnerships and publications.
                    </p>
                  </div>
                  {(!user?.researchAreas || user.researchAreas.length === 0) && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold text-[#4338CA] hover:underline"
                    >
                      + Add Areas
                    </button>
                  )}
                </div>

                {Array.isArray(user?.researchAreas) && user.researchAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {user.researchAreas.map((area: string, idx: number) => (
                      <span
                        key={`${area}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#FAFAF8] text-[#14131F] border border-[#14131F]/12 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                        <span>{area}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#FAFAF8] border border-dashed border-[#14131F]/15 flex items-start justify-between gap-4">
                    <div className="space-y-1 text-xs text-[#14131F]/65">
                      <p className="font-semibold text-[#14131F]">No research disciplines tagged</p>
                      <p>
                        Tagging your research specialties helps matching algorithms recommend you
                        for joint grants, patent projects, and faculty residencies.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-2xs shrink-0 font-medium"
                    >
                      Add Areas
                    </Button>
                  </div>
                )}
              </div>

              {/* Industry Experience */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold font-display text-[#14131F]">
                      Industry & Consulting Experience
                    </h2>
                    <p className="text-xs text-[#14131F]/60">
                      Corporate advisory roles, engineering sabbaticals, and applied consulting.
                    </p>
                  </div>
                  {!user?.industryExperience && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold text-[#4338CA] hover:underline"
                    >
                      + Add Details
                    </button>
                  )}
                </div>

                {user?.industryExperience ? (
                  <p className="text-xs sm:text-sm text-[#14131F]/80 leading-relaxed whitespace-pre-line bg-[#FAFAF8] p-4 rounded-xl border border-[#14131F]/6">
                    {user.industryExperience}
                  </p>
                ) : (
                  <div className="p-4 rounded-xl bg-[#FAFAF8] border border-dashed border-[#14131F]/15 flex items-start justify-between gap-4">
                    <div className="space-y-1 text-xs text-[#14131F]/65">
                      <p className="font-semibold text-[#14131F]">
                        No industry experience listed
                      </p>
                      <p>
                        Highlight past industrial consulting assignments, corporate engineering
                        tenures, or startup mentoring.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-2xs shrink-0 font-medium"
                    >
                      Add Details
                    </Button>
                  </div>
                )}
              </div>

              {/* Contact Coordinates */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold font-display text-[#14131F]">
                    Professional Coordinates
                  </h2>
                  <span className="text-xs text-[#14131F]/50">Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#14131F]/10 flex items-center justify-center text-[#4338CA] shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-xs text-[#14131F]/50 font-medium block">
                        Official Email
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-[#14131F] truncate">
                        {user?.email || 'email@institution.edu'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#14131F]/10 flex items-center justify-center text-[#4338CA] shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-xs text-[#14131F]/50 font-medium block">Phone</span>
                      <p className="text-xs sm:text-sm font-semibold text-[#14131F]">
                        {user?.phone ? (
                          user.phone
                        ) : (
                          <span className="text-[#14131F]/40 font-normal italic">
                            Phone not provided
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#14131F]/10 flex items-center justify-center text-[#4338CA] shrink-0">
                        <Linkedin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-xs text-[#14131F]/50 font-medium block">
                          LinkedIn Profile
                        </span>
                        {user?.linkedinUrl ? (
                          <a
                            href={
                              user.linkedinUrl.startsWith('http')
                                ? user.linkedinUrl
                                : `https://${user.linkedinUrl}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-medium text-[#4338CA] hover:underline flex items-center gap-1.5 truncate"
                          >
                            <span>{user.linkedinUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-[#14131F]/40 italic">
                            LinkedIn profile not connected
                          </span>
                        )}
                      </div>
                    </div>
                    {!user?.linkedinUrl && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-[#4338CA] font-medium hover:underline shrink-0"
                      >
                        + Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM MODE */
            <form onSubmit={handleSave} className="space-y-6">
              {/* Institutional & Academic Appointments */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#14131F]/6 pb-3">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold font-display text-[#14131F]">
                      Edit Academic Credentials
                    </h2>
                    <p className="text-xs text-[#14131F]/60">
                      Update your faculty appointments, department, and university institution.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                    Editing Mode
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14131F] flex items-center gap-1">
                      <span>Faculty Name</span>
                      <span className="text-[#14131F]/40 font-normal">(Registered Account)</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl text-[#14131F]/70 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14131F]">
                      Designation / Faculty Rank
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Associate Professor, Professor & Chair, Dean of R&D"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14131F]">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Computer Science & Engineering, Electronics & VLSI"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14131F]">
                      College / Institution Name
                    </label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => {
                        setCollegeName(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Indian Institute of Technology, Madras"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Biography & Summary */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold font-display text-[#14131F] block">
                    Biography & Academic Focus
                  </label>
                  <p className="text-xs text-[#14131F]/60">
                    Summarize your pedagogical philosophies, funded research contributions, and
                    areas of active exploration.
                  </p>
                </div>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Dr. Faculty specializes in high-concurrency distributed algorithms and cloud architecture. Over 12 years teaching computer networks, supervising 18 capstones, and partnering with industrial R&D consortia..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all leading-relaxed"
                />
              </div>

              {/* Research Areas (Interactive Tag Input) */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold font-display text-[#14131F] block">
                      Research Disciplines & Domains
                    </label>
                    <p className="text-xs text-[#14131F]/60">
                      Add specific tags for scientific algorithms, architectures, and research
                      themes.
                    </p>
                  </div>
                  <span className="text-xs text-[#14131F]/50">
                    {researchAreas.length} discipline{researchAreas.length === 1 ? '' : 's'} tagged
                  </span>
                </div>

                {/* Tag Pills List */}
                <div className="min-h-[48px] p-3 rounded-xl border border-[#14131F]/10 bg-[#FAFAF8] flex flex-wrap items-center gap-2">
                  {researchAreas.length === 0 ? (
                    <span className="text-xs text-[#14131F]/40 italic py-1 px-1">
                      No research areas tagged yet. Type a topic below or select from suggestions.
                    </span>
                  ) : (
                    researchAreas.map((area, idx) => (
                      <span
                        key={`${area}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white text-[#14131F] border border-[#14131F]/15 shadow-2xs group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                        <span>{area}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveResearchArea(idx)}
                          className="text-[#14131F]/40 hover:text-[#FB7185] transition-colors p-0.5"
                          aria-label={`Remove ${area}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddResearchArea();
                      }
                    }}
                    placeholder="e.g. Distributed Consensus, VLSI Verification, NLP..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddResearchArea}
                    disabled={!newAreaInput.trim()}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-medium"
                  >
                    Add Topic
                  </Button>
                </div>

                {/* Suggestions */}
                <div className="pt-2 border-t border-[#14131F]/6 space-y-2">
                  <p className="text-xs text-[#14131F]/50">Suggested specializations:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_RESEARCH_DOMAINS.filter(
                      (s) => !researchAreas.some((a) => a.toLowerCase() === s.toLowerCase())
                    ).map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => handleQuickAddResearchArea(domain)}
                        className="text-xs px-2.5 py-1 rounded-md border border-[#14131F]/10 bg-white text-[#14131F]/70 hover:text-[#4338CA] hover:border-[#4338CA]/30 transition-colors"
                      >
                        + {domain}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Industry & Consulting Experience */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold font-display text-[#14131F] block">
                    Industry & Consulting Experience
                  </label>
                  <p className="text-xs text-[#14131F]/60">
                    Detail previous corporate projects, advisory board retainers, and applied
                    solutions.
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={industryExperience}
                  onChange={(e) => {
                    setIndustryExperience(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 5 years in embedded systems consulting, Principal Technical Consultant to automotive tier-1 supplier, corporate trainer for cloud migration at enterprise IT firm..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all leading-relaxed"
                />
              </div>

              {/* Professional Coordinates (Phone, LinkedIn) */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold font-display text-[#14131F]">
                    Professional Coordinates
                  </h2>
                  <p className="text-xs text-[#14131F]/60">
                    Direct communication channels for corporate sponsors and research coordinators.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14131F]">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14131F]">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => {
                        setLinkedinUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. https://linkedin.com/in/faculty-profile"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#14131F]/15 rounded-xl text-[#14131F] placeholder:text-[#14131F]/35 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="text-xs text-[#14131F]/60 text-center sm:text-left">
                  {isDirty ? (
                    <span className="text-[#4338CA] font-medium">You have unsaved changes</span>
                  ) : (
                    <span>Ready to save changes</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="text-xs flex-1 sm:flex-none font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={saving}
                    icon={
                      saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )
                    }
                    className="text-xs font-semibold flex-1 sm:flex-none"
                  >
                    {saving ? 'Saving Changes...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Right 1 Col: Read-Only "Your Activity" & Profile Completeness */}
        <div className="space-y-6">
          {/* Your Activity Summary Card */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-[#14131F]">Your Activity</h3>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA]">
                  Live Metrics
                </span>
              </div>
              <p className="text-xs text-[#14131F]/60">
                Summary of your applications and platform participation.
              </p>
            </div>

            {/* Total Applications Metric */}
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-[#14131F]/50 font-medium">Opportunities Applied</span>
                  <div className="text-2xl font-bold font-display text-[#14131F]">
                    {totalApplied}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#14131F]/6 text-2xs">
                <div className="p-2 rounded-lg bg-white border border-[#14131F]/8">
                  <span className="text-[#14131F]/50 block">Internships & Training</span>
                  <span className="font-bold text-xs text-[#14131F]">
                    {facultyInternshipCount}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#14131F]/8">
                  <span className="text-[#14131F]/50 block">FDPs Enrolled</span>
                  <span className="font-bold text-xs text-[#14131F]">{fdpCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#14131F]/8">
                  <span className="text-[#14131F]/50 block">Consultancy Mandates</span>
                  <span className="font-bold text-xs text-[#14131F]">{consultancyCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-[#14131F]/8">
                  <span className="text-[#14131F]/50 block">Research Grants</span>
                  <span className="font-bold text-xs text-[#14131F]">{researchCount}</span>
                </div>
              </div>
            </div>

            {/* Mentorship Directory Status */}
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs text-[#14131F]/50 font-medium">
                    Mentorship Directory Status
                  </span>
                  <p className="text-xs font-semibold text-[#14131F]">
                    {user?.isMentorAvailable ? 'Active in Mentor Registry' : 'Status: Inactive'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${
                    user?.isMentorAvailable
                      ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                      : 'bg-[#14131F]/5 text-[#14131F]/50 border-[#14131F]/10'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user?.isMentorAvailable ? 'bg-[#65A30D]' : 'bg-[#14131F]/30'
                    }`}
                  />
                  <span>{user?.isMentorAvailable ? 'Available' : 'Inactive'}</span>
                </span>
              </div>

              <p className="text-xs text-[#14131F]/65 leading-relaxed">
                {user?.isMentorAvailable
                  ? `${user?.mentorshipTypes?.length || 0} engagement formats active, ${
                      user?.mentorAreas?.length || 0
                    } expertise disciplines declared.`
                  : 'Configure availability to accept student capstone mentees and hackathon teams.'}
              </p>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateTab('mentorship')}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full text-xs font-medium justify-center"
              >
                Go to Mentorship Tab
              </Button>
            </div>
          </div>

          {/* Profile Completeness Card */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-[#14131F]">
                  Profile Completeness
                </h3>
                <span className="text-xs font-bold text-[#4338CA]">{completenessPct}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[#14131F]/6 overflow-hidden">
                <div
                  className="h-full bg-[#4338CA] transition-all duration-300 rounded-full"
                  style={{ width: `${completenessPct}%` }}
                />
              </div>
              <p className="text-2xs text-[#14131F]/50">
                {completedCount} of {completenessItems.length} profile coordinates completed.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              {completenessItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-xs py-1 border-b border-[#14131F]/4 last:border-0"
                >
                  <span
                    className={`${
                      item.complete ? 'text-[#14131F]/80' : 'text-[#14131F]/45 italic'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.complete ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-2xs text-[#4338CA] hover:underline font-medium"
                    >
                      + Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AcademicianDashboard: React.FC<AcademicianDashboardProps> = ({
  onSwitchRole,
  onLogout,
}) => {
  const { user, token, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<AcademicianNavTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

  // Overview data state
  const [profile, setProfile] = useState<AcademicianProfile | null>(null);
  const [stats, setStats] = useState<AcademicianStats>({
    studentsTracked: 0,
    coursesSupervised: 0,
    skillAssessmentsReviewed: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Faculty Internships & Training state
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState<boolean>(false);
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null);

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState<boolean>(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  const [opportunityTypeFilter, setOpportunityTypeFilter] = useState<
    'Faculty Internship' | 'Industrial Training' | 'FDP' | 'Consultancy' | 'Research Collaboration'
  >('Faculty Internship');
  const [modeFilter, setModeFilter] = useState<'all' | 'Online' | 'Offline' | 'Hybrid'>('all');
  const [opportunitySearch, setOpportunitySearch] = useState<string>('');

  const [viewMode, setViewMode] = useState<'explore' | 'my_applications'>('explore');
  const [applyingOpportunityId, setApplyingOpportunityId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  const hasLoadedOverviewRef = useRef(false);
  // Fetch overview from backend
  const fetchOverview = async (isManualRefresh = false, isSilent = false) => {
    const silent = isSilent || (hasLoadedOverviewRef.current && !isManualRefresh);
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (!silent) {
      setLoading(true);
    }
    if (!silent) {
      setError(null);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/academician/me/overview', { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch academician overview');
      }

      if (data.profile) {
        setProfile(data.profile);
      }
      if (data.stats) {
        setStats({
          studentsTracked: data.stats.studentsTracked ?? 0,
          coursesSupervised: data.stats.coursesSupervised ?? 0,
          skillAssessmentsReviewed: data.stats.skillAssessmentsReviewed ?? 0,
        });
      }
    } catch (err: any) {
      console.error('Error loading academician overview:', err);
      if (!silent) {
        setError(err.message || 'Unable to connect to academician services.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setIsRefreshing(false);
      hasLoadedOverviewRef.current = true;
    }
  };

  // Fetch opportunities by type from backend
  const fetchOpportunities = async (type: string) => {
    setOpportunitiesLoading(true);
    setOpportunitiesError(null);
    try {
      const res = await fetch(`/api/academician/opportunities?type=${encodeURIComponent(type)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch opportunities');
      }
      const rawList = data.opportunities || [];
      if (rawList.length > 0) {
        setOpportunities(rawList);
      } else if (FALLBACK_OPPORTUNITIES[type]) {
        setOpportunities(FALLBACK_OPPORTUNITIES[type]);
      } else {
        setOpportunities([]);
      }
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      if (FALLBACK_OPPORTUNITIES[type]) {
        setOpportunities(FALLBACK_OPPORTUNITIES[type]);
      } else {
        setOpportunitiesError(err.message || 'Failed to load opportunities');
      }
    } finally {
      setOpportunitiesLoading(false);
    }
  };

  // Fetch authenticated academician's applications
  const fetchMyApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/academician/me/applications', { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load your applications');
      }
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setApplicationsError(err.message || 'Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Synchronize category filter with active navigation tab
  useEffect(() => {
    if (activeTab === 'faculty_internships') {
      setOpportunityTypeFilter('Faculty Internship');
    } else if (activeTab === 'industrial_training') {
      setOpportunityTypeFilter('Industrial Training');
    } else if (activeTab === 'fdps') {
      setOpportunityTypeFilter('FDP');
    } else if (activeTab === 'consultancy') {
      setOpportunityTypeFilter('Consultancy');
    } else if (activeTab === 'research_collaboration' || (activeTab as any) === 'research') {
      setOpportunityTypeFilter('Research Collaboration');
    }
  }, [activeTab]);

  // Trigger loading when entering opportunity tabs or changing type filter
  useEffect(() => {
    if (
      activeTab === 'faculty_internships' ||
      activeTab === 'industrial_training' ||
      activeTab === 'fdps' ||
      activeTab === 'consultancy' ||
      activeTab === 'research_collaboration' ||
      (activeTab as any) === 'research'
    ) {
      fetchOpportunities(opportunityTypeFilter);
      fetchMyApplications();
    }
  }, [activeTab, opportunityTypeFilter, token]);

  // Handle application submission
  const handleApply = async (opp: OpportunityItem) => {
    setApplyingOpportunityId(opp._id);
    setApplyError(null);
    setApplySuccess(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/academician/opportunities/${opp._id}/apply`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }
      setApplySuccess(
        `Application successfully transmitted to ${opp.company} for "${opp.title}". Your submission is recorded under your active applications.`
      );
      await fetchMyApplications();
    } catch (err: any) {
      console.error('Error applying to opportunity:', err);
      setApplyError(err.message || 'Unable to submit application.');
    } finally {
      setApplyingOpportunityId(null);
    }
  };

  const isOpportunityApplied = (oppId: string) => {
    return applications.some(
      (app) =>
        app.opportunityId === oppId ||
        app.opportunity?.id === oppId ||
        (app.opportunity as any)?._id === oppId
    );
  };

  const getApplicationForOpp = (oppId: string) => {
    return applications.find(
      (app) =>
        app.opportunityId === oppId ||
        app.opportunity?.id === oppId ||
        (app.opportunity as any)?._id === oppId
    );
  };

  // Resolve opportunity from application or fallback lookup
  const resolveOpportunity = (app: ApplicationItem): Partial<OpportunityItem> | null => {
    if (app.opportunity && app.opportunity.title) {
      return app.opportunity as Partial<OpportunityItem>;
    }
    const oppId = app.opportunityId;
    const fromLoaded = opportunities.find((o) => o._id === oppId || o.id === oppId);
    if (fromLoaded) return fromLoaded;
    for (const cat in FALLBACK_OPPORTUNITIES) {
      const found = FALLBACK_OPPORTUNITIES[cat].find((o) => o._id === oppId || o.id === oppId);
      if (found) return found;
    }
    return (app.opportunity as Partial<OpportunityItem>) || null;
  };

  // Filtered opportunities list
  const filteredOpportunities = opportunities.filter((opp) => {
    // Mode filter
    if (modeFilter !== 'all' && opp.mode !== modeFilter) {
      return false;
    }
    // Search query
    if (opportunitySearch.trim()) {
      const q = opportunitySearch.toLowerCase().trim();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchCompany = opp.company.toLowerCase().includes(q);
      const matchSkills = opp.requiredExpertise?.some((s) => s.toLowerCase().includes(q));
      const matchDesc = opp.description?.toLowerCase().includes(q);
      return matchTitle || matchCompany || matchSkills || matchDesc;
    }
    return true;
  });

  useEffect(() => {
    fetchOverview();
  }, [token]);

  // Polling safety ref: skip polling tick if user is applying or mid-submit
  const isAcademicianBusyRef = useRef(false);
  isAcademicianBusyRef.current = Boolean(applyingOpportunityId);

  // Background polling (every 15s) for cross-role data sync
  useEffect(() => {
    let pollTimer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = setInterval(() => {
        // Pause if browser tab is hidden
        if (typeof document !== 'undefined' && document.hidden) return;
        // Skip tick if action is in-progress
        if (isAcademicianBusyRef.current) return;

        // Re-run existing primary data fetch silently in background
        fetchOverview(false);
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

  // Derived display details (fall back to auth user if API profile is still loading)
  const academicianName = profile?.name || user?.name || user?.fullName || 'Faculty Member';
  const designation = profile?.designation || user?.designation || 'Faculty Member';
  const department = profile?.department || user?.department || 'Department of Engineering';
  const collegeName =
    profile?.collegeName || profile?.college || user?.college || 'Academic Institution';
  const email = profile?.email || user?.email || 'faculty@institution.edu';
  const phone = profile?.phone || user?.phone || '';

  // Sidebar navigation items
  const navItems: {
    id: AcademicianNavTab;
    label: string;
    icon: React.ElementType;
    badge?: string | null;
    stubDescription: string;
  }[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: BarChart3,
      badge: null,
      stubDescription: 'Overview of academician metrics, institutional credentials, and collaboration hub.',
    },
    {
      id: 'portfolio_verification',
      label: 'Portfolio Verification',
      icon: ShieldCheck,
      badge: 'Queue',
      stubDescription:
        'Institutional review and authorization queue for student certifications, capstone projects, internships, and honors.',
    },
    {
      id: 'faculty_internships',
      label: 'Faculty Internships',
      icon: Briefcase,
      badge: (() => {
        const count = applications.filter(
          (a) => !a.opportunity?.type || a.opportunity?.type === 'Faculty Internship'
        ).length;
        return count > 0 ? `${count} Applied` : null;
      })(),
      stubDescription:
        'Industry sabbatical placements, corporate immersion residencies, and hands-on engineering exposure.',
    },
    {
      id: 'industrial_training',
      label: 'Industrial Training',
      icon: Layers,
      badge: (() => {
        const count = applications.filter(
          (a) => a.opportunity?.type === 'Industrial Training'
        ).length;
        return count > 0 ? `${count} Applied` : null;
      })(),
      stubDescription:
        'Live technical workshops, production system architecture walkthroughs, and modern tooling sprints.',
    },
    {
      id: 'fdps',
      label: 'FDPs',
      icon: GraduationCap,
      badge: (() => {
        const count = applications.filter((a) => {
          const opp = resolveOpportunity(a);
          return opp?.type === 'FDP';
        }).length;
        return count > 0 ? `${count} Enrolled` : null;
      })(),
      stubDescription:
        'Accredited Faculty Development Programs in emerging technologies, pedagogical engineering, and cloud systems.',
    },
    {
      id: 'consultancy',
      label: 'Consultancy',
      icon: Handshake,
      badge: (() => {
        const count = applications.filter((a) => {
          const opp = resolveOpportunity(a);
          return opp?.type === 'Consultancy';
        }).length;
        return count > 0 ? `${count} Applied` : null;
      })(),
      stubDescription:
        'Corporate technical consulting projects, research advisory retainers, and industry problem-solving mandates.',
    },
    {
      id: 'research_collaboration',
      label: 'Research Collaboration',
      icon: FlaskConical,
      badge: (() => {
        const count = applications.filter((a) => {
          const opp = resolveOpportunity(a);
          return opp?.type === 'Research Collaboration';
        }).length;
        return count > 0 ? `${count} Applied` : null;
      })(),
      stubDescription:
        'Joint R&D partnerships, co-authored publications, corporate research grants, and university patent incubation.',
    },
    {
      id: 'mentorship',
      label: 'Mentorship',
      icon: UserCheck,
      badge: (user as any)?.isMentorAvailable ? 'Available' : null,
      stubDescription:
        'Student cohort placement tracking, portfolio review endorsements, and direct recruiter recommendations.',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null,
      stubDescription:
        'Faculty credentials, departmental appointments, institutional verification, and contact coordinates.',
    },
  ];

  const currentNav =
    navItems.find(
      (n) => n.id === activeTab || (n.id === 'research_collaboration' && (activeTab as any) === 'research')
    ) || navItems[0];

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
    <nav className="space-y-1 px-3 py-2 flex-1" aria-label="Academician Navigation">
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

  const renderInstitutionCard = () => (
    <div className="p-3.5 m-3 rounded-2xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#14131F]/60 font-display">
          Academic Node
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Faculty
        </span>
      </div>
      <div className="flex items-center gap-2.5 pt-0.5">
        <div className="w-8 h-8 rounded-xl bg-white border border-[#14131F]/10 flex items-center justify-center shrink-0 text-[#4338CA]">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold font-display text-[#14131F] truncate">{collegeName}</p>
          <p className="text-[11px] text-[#14131F]/60 truncate">{department}</p>
        </div>
      </div>
    </div>
  );

  const renderProfileFooter = () => (
    <div className="p-3 border-t border-[#14131F]/8 bg-white flex items-center justify-between gap-2">
      <button
        onClick={() => setActiveTab('profile')}
        className="flex items-center gap-2 text-left p-1.5 rounded-xl hover:bg-[#FAFAF8] transition-colors flex-1 min-w-0 cursor-pointer"
        title="View Faculty Profile"
      >
        <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 flex items-center justify-center shrink-0 font-bold text-xs">
          {academicianName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#14131F] truncate leading-tight">
            {academicianName}
          </p>
          <p className="text-[10px] text-[#14131F]/50 truncate">{email}</p>
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
    <DashboardShell
      portalSubtitle="Academician Portal"
      portalIcon={BookOpen}
      currentModuleName={currentNav.label}
      renderSearch={renderSearchInput}
      renderNavList={renderNavList}
      renderSidebarBottom={() => (
        <>
          {renderInstitutionCard()}
          {renderProfileFooter()}
        </>
      )}
      headerBadges={
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Faculty Academic Node</span>
        </div>
      }
      headerActions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchOverview(true);
              if (
                activeTab === 'faculty_internships' ||
                activeTab === 'industrial_training' ||
                activeTab === 'fdps' ||
                activeTab === 'consultancy' ||
                activeTab === 'research_collaboration' ||
                (activeTab as any) === 'research'
              ) {
                fetchOpportunities(opportunityTypeFilter);
                fetchMyApplications();
              }
            }}
            disabled={isRefreshing || opportunitiesLoading || applicationsLoading}
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing || opportunitiesLoading || applicationsLoading ? 'animate-spin' : ''
                }`}
              />
            }
            className="text-xs text-[#14131F]/70 border border-[#14131F]/10 hover:border-[#14131F]/20"
            title="Refresh academician data"
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
        </>
      }
    >
      {activeTab === 'portfolio_verification' ? (
            <div className="space-y-6 animate-in fade-in duration-150 text-left">
              <PortfolioVerificationQueue />
            </div>
          ) : activeTab === 'overview' ? (
            /* OVERVIEW TAB CONTENT */
            <div className="space-y-8 animate-in fade-in duration-150 text-left">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title={`Welcome, ${academicianName}`}
                  subtitle={`${designation} • ${department} at ${collegeName}`}
                  badge={<VerifiedSeal iconType="shield" label="Verified Faculty" />}
                />
              </div>

              {/* Error Notice if API Call Fails */}
              {error && (
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#E11D48] rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span>{error}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchOverview(false)}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Key Metrics Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Stat 1: Students Mentored & Tracked */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#14131F]/60">
                      Students Tracked
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F]">
                        {stats.studentsTracked}
                      </span>
                      <span className="text-xs font-medium text-[#14131F]/50">students</span>
                    </div>
                    <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                      Undergraduate and postgraduate candidates under active faculty mentorship.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px]">
                    <span className="text-[#14131F]/50">Mentorship Network</span>
                    <span className="font-semibold text-[#4338CA]">Live Sync</span>
                  </div>
                </div>

                {/* Stat 2: Courses & Tracks Supervised */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#14131F]/60">
                      Courses Supervised
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-emerald-800 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F]">
                        {stats.coursesSupervised}
                      </span>
                      <span className="text-xs font-medium text-[#14131F]/50">tracks</span>
                    </div>
                    <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                      Departmental curriculum courses, technical electives, and industry modules.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px]">
                    <span className="text-[#14131F]/50">Curriculum Governance</span>
                    <span className="font-semibold text-emerald-700">Active</span>
                  </div>
                </div>

                {/* Stat 3: Skill Assessments Evaluated */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#14131F]/60">
                      Skill Assessments Reviewed
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#FB7185]/15 text-[#E11D48] flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F]">
                        {stats.skillAssessmentsReviewed}
                      </span>
                      <span className="text-xs font-medium text-[#14131F]/50">evaluations</span>
                    </div>
                    <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                      Verified candidate coding submissions, project reviews, and readiness audits.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px]">
                    <span className="text-[#14131F]/50">Quality Verification</span>
                    <span className="font-semibold text-[#14131F]/70">Pending Drives</span>
                  </div>
                </div>
              </div>

              {/* Informative Synchronisation Note */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4.5 flex items-start gap-3 text-xs text-[#14131F]/70 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#14131F]">
                    Live Academia-Industry Data Pipeline
                  </p>
                  <p className="leading-relaxed text-[#14131F]/65">
                    Metric indicators reflect authorized university department records. As you enroll in
                    faculty corporate internships, review student skill dossiers, or publish FDP
                    cohorts, metrics will automatically synchronize across your dashboard.
                  </p>
                </div>
              </div>

              {/* Collaboration Hub Explanatory & Navigation Section */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#14131F] tracking-tight">
                      Your Academia-Industry Collaboration Hub
                    </h3>
                    <p className="text-xs text-[#14131F]/65 mt-1">
                      Bridge university pedagogical excellence with corporate engineering, applied
                      research, and real-world student employment.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-1 rounded-full border border-[#4338CA]/20 shrink-0">
                    6 Collaboration Pillars
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Pillar 1: Faculty Internships */}
                  <div
                    onClick={() => setActiveTab('faculty_internships')}
                    className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs hover:border-[#4338CA]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                          Faculty Internships
                        </h4>
                        <p className="text-xs text-[#14131F]/65 mt-1.5 leading-relaxed">
                          Immerse in high-growth tech engineering environments, shadow production workflows,
                          and bring modern system practices directly back to your classroom syllabus.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between text-xs font-semibold text-[#4338CA]">
                      <span>Explore Sabbaticals</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Pillar 2: Industrial Training */}
                  <div
                    onClick={() => setActiveTab('industrial_training')}
                    className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs hover:border-[#4338CA]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-[#A3E635]/20 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                          Industrial Training
                        </h4>
                        <p className="text-xs text-[#14131F]/65 mt-1.5 leading-relaxed">
                          Engage in corporate-conducted workshops covering cloud architectures, modern DevOps,
                          microservices, and scalable full-stack engineering tools.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between text-xs font-semibold text-[#4338CA]">
                      <span>View Training Modules</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Pillar 3: FDPs */}
                  <div
                    onClick={() => setActiveTab('fdps')}
                    className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs hover:border-[#4338CA]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                          Faculty Development (FDPs)
                        </h4>
                        <p className="text-xs text-[#14131F]/65 mt-1.5 leading-relaxed">
                          Earn recognized certifications from industry consortia, refresh pedagogical strategies,
                          and integrate certified curricula into departmental lesson plans.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between text-xs font-semibold text-[#4338CA]">
                      <span>Browse Accredited FDPs</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Pillar 4: Consultancy */}
                  <div
                    onClick={() => setActiveTab('consultancy')}
                    className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs hover:border-[#4338CA]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-200">
                        <Handshake className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                          Corporate Consultancy
                        </h4>
                        <p className="text-xs text-[#14131F]/65 mt-1.5 leading-relaxed">
                          Deliver technical advisory, algorithmic audits, and deep domain consulting for
                          enterprise engineering hurdles and startup incubators.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between text-xs font-semibold text-[#4338CA]">
                      <span>Consultancy Requests</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Pillar 5: Research Collaboration */}
                  <div
                    onClick={() => setActiveTab('research_collaboration')}
                    className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs hover:border-[#4338CA]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center group-hover:scale-105 transition-transform border border-purple-200">
                        <FlaskConical className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                          Research & Innovation
                        </h4>
                        <p className="text-xs text-[#14131F]/65 mt-1.5 leading-relaxed">
                          Partner with industry R&D labs for funded research grants, co-authored conference
                          publications, joint IP filings, and student-faculty labs.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between text-xs font-semibold text-[#4338CA]">
                      <span>Joint R&D Pipelines</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Pillar 6: Mentorship & Endorsement */}
                  <div
                    onClick={() => setActiveTab('mentorship')}
                    className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs hover:border-[#4338CA]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-200">
                        <UserCheck className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                          Student Mentorship
                        </h4>
                        <p className="text-xs text-[#14131F]/65 mt-1.5 leading-relaxed">
                          Guide student placement readiness, endorse verified code projects, and provide
                          institutional references directly to verified campus recruiters.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between text-xs font-semibold text-[#4338CA]">
                      <span>Review Candidate Cohorts</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Institutional Faculty Profile Snapshot */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#14131F]/8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center font-display font-bold text-xl shrink-0">
                      {academicianName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-lg sm:text-xl text-[#14131F]">
                          {academicianName}
                        </h3>
                        <VerifiedSeal iconType="shield" label="Verified Faculty" />
                      </div>
                      <p className="text-xs text-[#14131F]/65 mt-0.5">
                        {designation} • {department}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('profile')}
                    icon={<User className="w-3.5 h-3.5" />}
                    className="text-xs shrink-0"
                  >
                    View Faculty Profile
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-1">
                    <span className="text-[11px] font-semibold text-[#14131F]/50">
                      College / University
                    </span>
                    <p className="font-medium text-[#14131F] truncate">{collegeName}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-1">
                    <span className="text-[11px] font-semibold text-[#14131F]/50">
                      Department
                    </span>
                    <p className="font-medium text-[#14131F] truncate">{department}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-1">
                    <span className="text-[11px] font-semibold text-[#14131F]/50">
                      Official Email
                    </span>
                    <p className="font-medium text-[#14131F] truncate">{email}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-1">
                    <span className="text-[11px] font-semibold text-[#14131F]/50">
                      Contact Phone
                    </span>
                    <p className="font-medium text-[#14131F] truncate">
                      {phone || <span className="text-[#14131F]/40 italic">Not specified</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'faculty_internships' || activeTab === 'industrial_training' ? (
            /* FACULTY INTERNSHIPS & INDUSTRIAL TRAINING MODULE */
            <div className="space-y-6 animate-in fade-in duration-150 text-left">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Faculty Internships & Industrial Training"
                  subtitle="Explore corporate engineering sabbaticals, industry residencies, and hands-on technology immersion cohorts."
                  badge={
                    <Badge variant="verified" size="sm">
                      Academia-Industry Exchange
                    </Badge>
                  }
                  action={
                    <div className="flex items-center gap-2">
                      <div className="flex items-center p-1 bg-[#14131F]/5 rounded-xl border border-[#14131F]/10">
                        <button
                          type="button"
                          onClick={() => setViewMode('explore')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            viewMode === 'explore'
                              ? 'bg-white text-[#14131F] shadow-xs'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          Explore Opportunities
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('my_applications')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            viewMode === 'my_applications'
                              ? 'bg-white text-[#14131F] shadow-xs'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          <span>My Applications</span>
                          {applications.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#4338CA] text-white">
                              {applications.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Status Notifications */}
              {applySuccess && (
                <div className="bg-[#A3E635]/20 border border-[#A3E635]/40 text-emerald-950 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-medium leading-relaxed">{applySuccess}</span>
                  </div>
                  <button
                    onClick={() => setApplySuccess(null)}
                    className="text-emerald-800 hover:text-emerald-950 p-1 rounded-lg hover:bg-[#A3E635]/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {applyError && (
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#E11D48] rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span className="font-medium leading-relaxed">{applyError}</span>
                  </div>
                  <button
                    onClick={() => setApplyError(null)}
                    className="text-[#E11D48] hover:text-[#BE123C] p-1 rounded-lg hover:bg-[#FB7185]/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Pilot Transparency Banner */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-[#14131F]">Corporate Partnership Pilot</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified Corporate Hosts
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#14131F]/60 mt-0.5">
                      Curated opportunities from tier-1 partner enterprises (Google Cloud Labs, Microsoft Research India, AWS, Intel, Infosys, TCS). Recruiter self-service posting workflows will connect live in subsequent steps.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#14131F]/65 shrink-0 self-end sm:self-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{opportunities.length} programs active</span>
                </div>
              </div>

              {viewMode === 'explore' ? (
                <>
                  {/* Segmented Type Switcher & Filters Bar */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                    {/* Primary Category Segmented Control */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#14131F]/6">
                      <div className="inline-flex p-1 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setOpportunityTypeFilter('Faculty Internship');
                            setActiveTab('faculty_internships');
                          }}
                          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            opportunityTypeFilter === 'Faculty Internship'
                              ? 'bg-white text-[#4338CA] shadow-xs border border-[#14131F]/6'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Faculty Internships</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpportunityTypeFilter('Industrial Training');
                            setActiveTab('industrial_training');
                          }}
                          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            opportunityTypeFilter === 'Industrial Training'
                              ? 'bg-white text-[#4338CA] shadow-xs border border-[#14131F]/6'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Industrial Training</span>
                        </button>
                      </div>

                      {/* Mode Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-[11px] font-semibold text-[#14131F]/50 mr-1 hidden md:inline">Mode:</span>
                        {(['all', 'Online', 'Offline', 'Hybrid'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setModeFilter(m)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              modeFilter === m
                                ? 'bg-[#14131F] text-white'
                                : 'bg-[#FAFAF8] text-[#14131F]/70 border border-[#14131F]/8 hover:border-[#14131F]/20'
                            }`}
                          >
                            {m === 'all' ? 'All Modes' : m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={`Search ${opportunityTypeFilter} by title, enterprise host, or required tech stack...`}
                        value={opportunitySearch}
                        onChange={(e) => setOpportunitySearch(e.target.value)}
                        className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 text-xs sm:text-sm text-[#14131F] placeholder:text-[#14131F]/40 focus:outline-none focus:ring-1 focus:ring-[#4338CA] focus:bg-white transition-all"
                      />
                      {opportunitySearch && (
                        <button
                          type="button"
                          onClick={() => setOpportunitySearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Opportunities Grid / State */}
                  {opportunitiesLoading ? (
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                      <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                      <p className="text-sm font-medium text-[#14131F]">Loading {opportunityTypeFilter} opportunities...</p>
                      <p className="text-xs text-[#14131F]/50">Checking live corporate listings and academic portals</p>
                    </div>
                  ) : opportunitiesError ? (
                    <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 rounded-2xl p-8 text-center space-y-3 shadow-xs">
                      <AlertCircle className="w-8 h-8 text-[#E11D48] mx-auto" />
                      <p className="text-sm font-bold text-[#E11D48]">{opportunitiesError}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchOpportunities(opportunityTypeFilter)}
                        className="text-xs text-[#E11D48] border border-[#E11D48]/30 hover:bg-[#FB7185]/20"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : filteredOpportunities.length === 0 ? (
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-4 shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[#14131F]">No matching opportunities found</h3>
                        <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                          No {opportunityTypeFilter.toLowerCase()} listings matched your filters. Try clearing your search query or selecting &quot;All Modes&quot;.
                        </p>
                      </div>
                      {(opportunitySearch || modeFilter !== 'all') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOpportunitySearch('');
                            setModeFilter('all');
                          }}
                          className="text-xs text-[#4338CA] border border-[#4338CA]/20"
                        >
                          Reset Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {filteredOpportunities.map((opp) => {
                        const applied = isOpportunityApplied(opp._id);
                        const appData = getApplicationForOpp(opp._id);
                        const isCurrentlyApplying = applyingOpportunityId === opp._id;

                        return (
                          <div
                            key={opp._id}
                            className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between hover:border-[#14131F]/15 transition-all"
                          >
                            <div className="space-y-3.5">
                              {/* Top Bar: Company + Badges */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center font-display font-bold text-base shrink-0">
                                    {opp.company ? opp.company.charAt(0).toUpperCase() : 'C'}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-bold text-[#14131F]/50 uppercase tracking-wider block truncate">
                                      {opp.company}
                                    </span>
                                    <h4 className="text-base sm:text-lg font-bold font-display text-[#14131F] leading-snug line-clamp-2">
                                      {opp.title}
                                    </h4>
                                  </div>
                                </div>
                              </div>

                              {/* Badges Row */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                    opp.type === 'Faculty Internship'
                                      ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {opp.type}
                                </span>

                                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#14131F]/5 text-[#14131F]/70 border border-[#14131F]/8">
                                  {opp.mode || 'Online'}
                                </span>

                                {opp.stipendOrHonorarium && (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#A3E635]/20 text-emerald-900 border border-[#A3E635]/30 flex items-center gap-1">
                                    <Coins className="w-3 h-3 text-emerald-700" />
                                    <span>{opp.stipendOrHonorarium}</span>
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              {opp.description && (
                                <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed line-clamp-3">
                                  {opp.description}
                                </p>
                              )}

                              {/* Key Parameters */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-[#14131F]/50 block">Duration</span>
                                    <span className="text-xs font-semibold text-[#14131F] truncate block">
                                      {opp.duration || 'Flexible'}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-[#14131F]/50 block">Deadline</span>
                                    <span className="text-xs font-semibold text-[#14131F] truncate block">
                                      {opp.deadline
                                        ? new Date(opp.deadline).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                          })
                                        : 'Rolling Applications'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Required Expertise Tags */}
                              {opp.requiredExpertise && opp.requiredExpertise.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[11px] font-semibold text-[#14131F]/50">Required Expertise:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {opp.requiredExpertise.map((skill, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="px-2 py-0.5 rounded-md bg-[#FAFAF8] text-[#14131F]/75 border border-[#14131F]/10 text-[11px] font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Footer Action */}
                            <div className="pt-3 border-t border-[#14131F]/6 flex items-center justify-between gap-3">
                              <div className="text-[11px] text-[#14131F]/50">
                                {applied ? (
                                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" /> Application on Record
                                  </span>
                                ) : (
                                  <span>Academic Sponsor Supported</span>
                                )}
                              </div>

                              <div>
                                {applied ? (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A3E635]/20 text-emerald-900 border border-[#A3E635]/40 text-xs font-bold shadow-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Applied • {appData?.status || 'Under Review'}</span>
                                  </div>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleApply(opp)}
                                    disabled={isCurrentlyApplying}
                                    icon={
                                      isCurrentlyApplying ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      )
                                    }
                                    className="text-xs font-semibold"
                                  >
                                    {isCurrentlyApplying
                                      ? 'Submitting...'
                                      : opp.type === 'Faculty Internship'
                                      ? 'Apply for Residency'
                                      : 'Apply for Training'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* MY APPLICATIONS VIEW */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#14131F]/6">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-display text-[#14131F]">
                        Your Submitted Academic Applications
                      </h3>
                      <p className="text-xs text-[#14131F]/60 mt-0.5">
                        Track application statuses, corporate responses, and active institutional review progress.
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('explore')}
                      className="text-xs text-[#4338CA] border border-[#4338CA]/20"
                    >
                      Back to Explorer
                    </Button>
                  </div>

                  {applicationsLoading ? (
                    <div className="p-8 text-center space-y-2">
                      <Loader2 className="w-6 h-6 text-[#4338CA] animate-spin mx-auto" />
                      <p className="text-xs text-[#14131F]/60">Loading your applications...</p>
                    </div>
                  ) : applicationsError ? (
                    <div className="p-6 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#E11D48] text-xs text-center">
                      {applicationsError}
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="p-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center mx-auto">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-[#14131F]">No applications submitted yet</h4>
                      <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                        Browse active faculty sabbaticals and industrial trainings in the explorer tab and express your interest.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setViewMode('explore')}
                        className="text-xs font-semibold mt-2"
                      >
                        Explore Opportunities
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div
                          key={app._id}
                          className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#4338CA] uppercase tracking-wider">
                                {app.opportunity?.company || 'Corporate Host'}
                              </span>
                              <span className="text-[#14131F]/30">•</span>
                              <span className="text-[11px] font-medium text-[#14131F]/60">
                                {app.opportunity?.type || 'Faculty Program'}
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-[#14131F]">
                              {app.opportunity?.title || 'Academic Opportunity'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#14131F]/60 pt-0.5">
                              {app.opportunity?.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#14131F]/40" />
                                  <span>{app.opportunity.duration}</span>
                                </span>
                              )}
                              {app.opportunity?.mode && (
                                <span className="px-1.5 py-0.2 rounded bg-[#14131F]/5 text-[#14131F]/70">
                                  {app.opportunity.mode}
                                </span>
                              )}
                              <span>
                                Applied:{' '}
                                {app.createdAt
                                  ? new Date(app.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : 'Recently'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                app.status === 'Selected'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : app.status === 'Under Review'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : app.status === 'Rejected'
                                  ? 'bg-[#FB7185]/20 text-[#E11D48] border-[#FB7185]/35'
                                  : 'bg-[#A3E635]/20 text-emerald-950 border-[#A3E635]/40'
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'fdps' ? (
            <AcademicOpportunityModule
              type="FDP"
              title="Faculty Development Programs (FDPs)"
              subtitle="Upskill through industry-led programs, pedagogy acceleration cohorts, and emerging technology immersion."
              badgeLabel="Skill & Pedagogy Cohorts"
              applyButtonLabel="Enroll in FDP Cohort"
              pilotDescription="AICTE-aligned and corporate-sponsored faculty development initiatives covering generative AI, cloud platforms, and modern engineering practices."
              heroIcon={GraduationCap}
              applications={applications}
              applicationsLoading={applicationsLoading}
              applicationsError={applicationsError}
              opportunities={opportunities}
              opportunitiesLoading={opportunitiesLoading}
              opportunitiesError={opportunitiesError}
              onRefresh={() => {
                fetchOpportunities('FDP');
                fetchMyApplications();
              }}
              onApply={handleApply}
              applyingOpportunityId={applyingOpportunityId}
              applySuccess={applySuccess}
              applyError={applyError}
              onClearAlerts={() => {
                setApplySuccess(null);
                setApplyError(null);
              }}
              resolveOpportunity={resolveOpportunity}
            />
          ) : activeTab === 'consultancy' ? (
            <AcademicOpportunityModule
              type="Consultancy"
              title="Industry Consultancy Projects"
              subtitle="Offer your expertise to industry projects, architectural audits, technical advisory retainers, and high-stakes problem solving."
              badgeLabel="Expert Advisory Mandates"
              applyButtonLabel="Submit Consulting Proposal"
              pilotDescription="Direct corporate consultancy retainers and advisory mandates with verified enterprise engineering hosts across India."
              heroIcon={Handshake}
              applications={applications}
              applicationsLoading={applicationsLoading}
              applicationsError={applicationsError}
              opportunities={opportunities}
              opportunitiesLoading={opportunitiesLoading}
              opportunitiesError={opportunitiesError}
              onRefresh={() => {
                fetchOpportunities('Consultancy');
                fetchMyApplications();
              }}
              onApply={handleApply}
              applyingOpportunityId={applyingOpportunityId}
              applySuccess={applySuccess}
              applyError={applyError}
              onClearAlerts={() => {
                setApplySuccess(null);
                setApplyError(null);
              }}
              resolveOpportunity={resolveOpportunity}
            />
          ) : activeTab === 'research_collaboration' || (activeTab as any) === 'research' ? (
            <AcademicOpportunityModule
              type="Research Collaboration"
              title="Joint Research & Applied R&D Collaboration"
              subtitle="Partner with industry on applied research, joint conference publications, corporate research grants, and university patent incubation."
              badgeLabel="Joint Applied R&D"
              applyButtonLabel="Apply for Joint Research"
              pilotDescription="Formal corporate research partnerships featuring co-authorship pipelines, compute credits, and funded lab grants."
              heroIcon={FlaskConical}
              applications={applications}
              applicationsLoading={applicationsLoading}
              applicationsError={applicationsError}
              opportunities={opportunities}
              opportunitiesLoading={opportunitiesLoading}
              opportunitiesError={opportunitiesError}
              onRefresh={() => {
                fetchOpportunities('Research Collaboration');
                fetchMyApplications();
              }}
              onApply={handleApply}
              applyingOpportunityId={applyingOpportunityId}
              applySuccess={applySuccess}
              applyError={applyError}
              onClearAlerts={() => {
                setApplySuccess(null);
                setApplyError(null);
              }}
              resolveOpportunity={resolveOpportunity}
            />
          ) : activeTab === 'mentorship' ? (
            <AcademicianMentorshipView
              user={user}
              token={token}
              updateUser={updateUser}
            />
          ) : activeTab === 'profile' ? (
            <AcademicianProfileModule
              user={user}
              token={token}
              updateUser={updateUser}
              applications={applications}
              onNavigateTab={(tab) => setActiveTab(tab)}
              resolveOpportunity={resolveOpportunity}
            />
          ) : (
            /* STUB TAB CONTENT FOR UNIMPLEMENTED MODULES */
            <div className="bg-white border border-[#14131F]/8 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 my-6 shadow-xs animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] flex items-center justify-center mx-auto">
                {React.createElement(currentNav.icon, { className: 'w-7 h-7' })}
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-semibold bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                  <span>{currentNav.label} Workspace</span>
                </div>
                <h2 className="text-2xl font-bold font-display text-[#14131F] tracking-tight">
                  {currentNav.label}
                </h2>
                <p className="text-sm font-semibold text-[#4338CA]">Coming in the next step</p>
                <p className="text-xs sm:text-sm text-[#14131F]/65 leading-relaxed max-w-md mx-auto">
                  {currentNav.stubDescription}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  icon={<BarChart3 className="w-4 h-4" />}
                  className="text-xs font-medium"
                >
                  Return to Dashboard Overview
                </Button>
              </div>
            </div>
          )}
    </DashboardShell>
  );
};
