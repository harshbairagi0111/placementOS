import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  ShieldCheck,
  TrendingUp,
  FileText,
  Search,
  X,
  Menu,
  LogOut,
  RefreshCw,
  Landmark,
  GraduationCap,
  Award,
  CheckCircle2,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  FileCheck,
  Target,
  BarChart2,
  Percent,
  Sliders,
  HelpCircle,
  School,
  ArrowUpDown,
  ExternalLink,
  Github,
  Code,
  Filter,
  ArrowDownUp,
  Eye,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Linkedin,
  Lightbulb,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardShell } from './DashboardShell';
import { Button } from '../ui/Button';
import { Badge, VerifiedSeal } from '../ui/Badge';
import { SectionHeading } from '../ui/SectionHeading';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { PortfolioVerificationQueue } from '../verification/PortfolioVerificationQueue';

export type InstitutionNavTab =
  | 'overview'
  | 'students'
  | 'placements'
  | 'companies'
  | 'moderation'
  | 'portfolio_verification'
  | 'analytics'
  | 'reports';

export interface InstitutionDashboardProps {
  onSwitchRole?: () => void;
  onLogout: () => void;
}

// Data models matching GET /api/tpo/analytics real response
export interface StudentRosterItem {
  id: string;
  name: string;
  email: string;
  college: string;
  degree: string;
  targetRole: string;
  readinessScore: number | null;
  atsScore: number | null;
  portfolioScore: number | null;
  aptitudeScore: number | null;
  mockScore: number | null;
  mockCount: number;
  dsaSolved: number;
  status: 'Placement Ready' | 'Developing' | 'Needs Support';
}

export interface ReadinessCategory {
  count: number;
  percentage: number;
  label: string;
  color: 'emerald' | 'amber' | 'rose';
}

export interface WeakAreaCategory {
  key: string;
  label: string;
  score: number | null;
  module: string;
}

export interface AnalyticsSummary {
  totalStudents: number;
  resumesEvaluated: number;
  mockInterviewsCompleted: number;
  aptitudeTestsAttempted: number;
  portfoliosAudited: number;
  averageScores: {
    resumeAts: number;
    mockInterview: number;
    aptitudeTest: number;
    portfolioQuality: number;
    codingSolved: number;
    codingAccuracy: number;
  };
}

export interface TpoAnalyticsResponse {
  success: boolean;
  college: string;
  summary: AnalyticsSummary;
  readinessDistribution: {
    placementReady: ReadinessCategory;
    developing: ReadinessCategory;
    needsSupport: ReadinessCategory;
  };
  weakAreasDiagnostic: {
    mostCommonWeakArea: string | null;
    lowestScore: number | null;
    module: string | null;
    categories: WeakAreaCategory[];
  };
  students: StudentRosterItem[];
}

// Data models matching GET /api/tpo/students/:studentId/profile real response
export interface StudentDetailResume {
  atsScore: number | null;
  fileName: string;
  skillsFound: string[];
  missingSkills: string[];
  formattingScore: number | null;
  quantifiedImpactScore: number | null;
  keywordMatchPct: number | null;
  suggestions: string[];
  feedback: string;
  targetRole: string;
  createdAt?: string;
}

export interface StudentDetailPortfolioProject {
  name?: string;
  description?: string;
  techStack?: string[];
  stars?: number;
  score?: number;
  feedback?: string;
}

export interface StudentDetailPortfolio {
  qualityScore: number | null;
  githubUrl: string;
  githubUsername: string;
  feedback: string;
  strengths: string[];
  recommendations: string[];
  auditedProjects: StudentDetailPortfolioProject[];
  createdAt?: string;
}

export interface StudentProfileDetailResponse {
  success: boolean;
  student: {
    id: string;
    name: string;
    email: string;
    college: string;
    degree: string;
    targetRole: string;
  };
  resume: StudentDetailResume | null;
  portfolio: StudentDetailPortfolio | null;
  certifications: any[];
  groupedCertifications: {
    Global: any[];
    National: any[];
    'Local/College': any[];
    Other: any[];
  };
  badgeCount: number;
  badges: any[];
}

export interface PendingExperienceQuestion {
  text?: string;
  type?: 'theory' | 'coding';
  question?: string;
}

export interface PendingInterviewExperience {
  _id: string;
  id?: string;
  studentId: any;
  company: string;
  role: string;
  interviewDate: string | Date;
  roundsDescription: string;
  questionsAsked: PendingExperienceQuestion[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  outcome: 'Selected' | 'Rejected' | 'Awaiting Result';
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  reviewedBy?: any;
  createdAt: string;
  updatedAt?: string;
  studentName: string;
  studentEmail: string;
  studentCollege: string;
  studentDegree: string;
  studentTargetRole: string;
}

// Data models matching GET /api/tpo/placements real response
export interface PlacementCompanyStats {
  company: string;
  applicantCount: number;
  offerCount: number;
}

export interface RecentPlacementItem {
  id: string;
  company: string;
  role: string;
  type: string;
  status: string;
  studentName: string;
  studentEmail: string;
  studentCollege: string;
  studentDegree: string;
  studentTargetRole?: string;
  date: string;
  createdAt?: string;
}

export interface PlacementsDataResponse {
  success: boolean;
  college: string;
  placementRate: number;
  totalApplications: number;
  totalOffers: number;
  totalStudentsPlaced: number;
  totalStudents: number;
  byCompany: PlacementCompanyStats[];
  byType: {
    job: number;
    internship: number;
    Job?: number;
    Internship?: number;
  };
  recentPlacements: RecentPlacementItem[];
}

export interface RecruiterContactInfo {
  id: string;
  name: string;
  email: string;
  company: string;
  designation?: string;
  department?: string;
  phone?: string;
  linkedinUrl?: string;
}

export interface CompanyEngagementItem {
  company: string;
  applicantCount: number;
  totalApplications: number;
  offerCount: number;
  conversionRate: number;
  roles: string[];
  statusBreakdown: Record<string, number>;
  latestApplicationDate?: string;
  recruiter: RecruiterContactInfo | null;
}

export interface CompaniesDataResponse {
  success: boolean;
  college: string;
  totalCompanies: number;
  totalApplicants: number;
  totalOffers: number;
  totalStudents: number;
  companies: CompanyEngagementItem[];
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({
  onSwitchRole,
  onLogout,
}) => {
  const { user, token } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<InstitutionNavTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

  // Companies & Recruiters state (GET /api/tpo/companies)
  const [companiesData, setCompaniesData] = useState<CompaniesDataResponse | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState<string>('');
  const [companySortBy, setCompanySortBy] = useState<'applicants' | 'offers' | 'conversion' | 'name'>('applicants');
  const [companyRecruiterFilter, setCompanyRecruiterFilter] = useState<'all' | 'has_recruiter' | 'no_recruiter'>('all');

  // Placements & Internships state (GET /api/tpo/placements)
  const [placementsData, setPlacementsData] = useState<PlacementsDataResponse | null>(null);
  const [loadingPlacements, setLoadingPlacements] = useState<boolean>(false);
  const [placementsError, setPlacementsError] = useState<string | null>(null);

  // Analytics state from GET /api/tpo/analytics
  const [analytics, setAnalytics] = useState<TpoAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Student roster filters (on Overview tab)
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [readinessFilter, setReadinessFilter] = useState<'all' | 'Placement Ready' | 'Developing' | 'Needs Support'>('all');
  const [sortBy, setSortBy] = useState<'readiness' | 'name' | 'ats'>('readiness');

  // Dedicated Students Tab filters and sorting (reusing analytics.students)
  const [studentsSearch, setStudentsSearch] = useState<string>('');
  const [studentsStatusFilter, setStudentsStatusFilter] = useState<'all' | 'Placement Ready' | 'Developing' | 'Needs Support'>('all');
  const [studentsSortBy, setStudentsSortBy] = useState<'readiness-asc' | 'readiness-desc' | 'name' | 'ats' | 'dsa'>('readiness-asc');

  // Student Profile Detail state (loaded on demand via GET /api/tpo/students/:studentId/profile)
  const [selectedStudent, setSelectedStudent] = useState<StudentRosterItem | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileDetailResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [detailActiveSection, setDetailActiveSection] = useState<'overview' | 'resume' | 'portfolio' | 'certifications'>('overview');

  // Interview Experience Moderation state (GET /api/tpo/experiences/pending)
  const [pendingExperiences, setPendingExperiences] = useState<PendingInterviewExperience[] | null>(null);
  const [loadingModeration, setLoadingModeration] = useState<boolean>(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [expandedExpIds, setExpandedExpIds] = useState<Record<string, boolean>>({});
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [moderationFeedback, setModerationFeedback] = useState<{
    type: 'approved' | 'rejected' | 'error';
    message: string;
    expCompany?: string;
    studentName?: string;
  } | null>(null);

  // Reject Modal state (POST /api/tpo/experiences/:experienceId/review with decision: 'rejected')
  const [rejectModalTarget, setRejectModalTarget] = useState<PendingInterviewExperience | null>(null);
  const [rejectNoteInput, setRejectNoteInput] = useState<string>('');
  const [rejectNoteError, setRejectNoteError] = useState<string | null>(null);
  const [submittingReject, setSubmittingReject] = useState<boolean>(false);

  // Reports & Data Export state
  const [downloadingReport, setDownloadingReport] = useState<'students' | 'placements' | 'companies' | 'all' | null>(null);
  const [reportExportNotice, setReportExportNotice] = useState<string | null>(null);

  // Helper to resolve experience ID safely
  const getExpId = (exp: PendingInterviewExperience): string => {
    return String(exp._id || exp.id || '');
  };

  // Helper to format dates cleanly
  const formatExperienceDate = (val: string | Date | undefined): string => {
    if (!val) return 'Recently';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(val);
    }
  };

  // Fetch pending interview experiences from GET /api/tpo/experiences/pending
  // Oldest-first order is preserved directly from the API response (FIFO queue)
  const fetchPendingExperiences = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoadingModeration(true);
    }
    setModerationError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/tpo/experiences/pending', { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to load pending moderation queue`);
      }

      // Preserve oldest-first order directly from the API
      setPendingExperiences(Array.isArray(data.experiences) ? data.experiences : []);
    } catch (err: any) {
      console.error('[InstitutionDashboard] Error fetching pending experiences:', err);
      setModerationError(err.message || 'Unable to retrieve pending interview experiences');
    } finally {
      setLoadingModeration(false);
      setIsRefreshing(false);
    }
  };

  // Toggle expanded details for an experience card
  const toggleExpandExperience = (id: string) => {
    setExpandedExpIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Approve action: calls POST /api/tpo/experiences/:experienceId/review with decision: 'approved'
  // Removes from local queue ONLY after server confirmation
  const handleApproveExperience = async (exp: PendingInterviewExperience) => {
    const expId = getExpId(exp);
    setActionInProgressId(expId);
    setModerationFeedback(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/tpo/experiences/${expId}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          decision: 'approved',
          reviewNote: 'Approved by Training & Placement Cell',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to approve submission`);
      }

      // Remove from pending queue on success only after server confirmation
      setPendingExperiences((prev) =>
        prev ? prev.filter((item) => getExpId(item) !== expId) : []
      );

      setModerationFeedback({
        type: 'approved',
        message: `Interview experience for ${exp.company} (${exp.role}) by ${exp.studentName} has been approved and published to the campus interview library.`,
        expCompany: exp.company,
        studentName: exp.studentName,
      });
    } catch (err: any) {
      console.error('[Moderation Approve Error]:', err);
      setModerationFeedback({
        type: 'error',
        message: err.message || 'Server error approving submission',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Open rejection modal to collect required reviewNote
  const handleOpenRejectModal = (exp: PendingInterviewExperience) => {
    setRejectModalTarget(exp);
    setRejectNoteInput('');
    setRejectNoteError(null);
  };

  // Close rejection modal
  const handleCloseRejectModal = () => {
    setRejectModalTarget(null);
    setRejectNoteInput('');
    setRejectNoteError(null);
  };

  // Confirm rejection: must collect reviewNote first (client-side validation + backend error handling)
  // Removes from queue on success only after server confirmation
  const handleConfirmReject = async () => {
    if (!rejectModalTarget) return;

    const note = rejectNoteInput.trim();
    if (!note) {
      setRejectNoteError(
        'A review note is required when rejecting a submission so the student understands the feedback.'
      );
      return;
    }

    const expId = getExpId(rejectModalTarget);
    setSubmittingReject(true);
    setRejectNoteError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/tpo/experiences/${expId}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          decision: 'rejected',
          reviewNote: note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Displays exact server error message (e.g. HTTP 400 for missing reviewNote or other reasons)
        throw new Error(data.error || `HTTP ${res.status}: Failed to reject submission`);
      }

      // Remove from pending queue on success only after server confirmation
      setPendingExperiences((prev) =>
        prev ? prev.filter((item) => getExpId(item) !== expId) : []
      );

      setModerationFeedback({
        type: 'rejected',
        message: `Submission for ${rejectModalTarget.company} by ${rejectModalTarget.studentName} was rejected with feedback communicated to the candidate.`,
        expCompany: rejectModalTarget.company,
        studentName: rejectModalTarget.studentName,
      });

      handleCloseRejectModal();
    } catch (err: any) {
      console.error('[Moderation Reject Error]:', err);
      setRejectNoteError(err.message || 'Server error rejecting submission');
    } finally {
      setSubmittingReject(false);
    }
  };

  // Institution / TPO Name resolution
  const institutionName =
    analytics?.college ||
    user?.collegeName ||
    user?.college ||
    'Campus Placement Office';
  const officerName = user?.name || user?.fullName || 'Placement Officer';

  // RFC 4180 compliant CSV cell formatting:
  // Fields containing comma, double-quote, newline, or carriage return are enclosed in quotes,
  // and any internal double-quote characters are escaped by doubling them ("").
  const formatCsvCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const getSanitizedCollegeSlug = (name: string): string => {
    return (
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'institution'
    );
  };

  const getReportDateString = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const triggerCsvDownload = (csvContent: string, filename: string) => {
    const bom = '\uFEFF'; // UTF-8 byte order mark for Microsoft Excel / Numbers compatibility
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadStudentsReport = () => {
    if (!analytics?.students || analytics.students.length === 0) return;
    setDownloadingReport('students');

    try {
      const headers = [
        'Student Name',
        'Email Address',
        'Degree / Program',
        'Target Role',
        'Readiness Score (%)',
        'Readiness Status',
        'ATS Resume Score (%)',
        'Portfolio Quality Score (%)',
        'Aptitude Assessment Score (%)',
        'Mock Technical Interview Score (%)',
        'Mock Interviews Completed',
        'DSA Problems Solved',
      ];

      const rows = analytics.students.map((s) => [
        s.name,
        s.email,
        s.degree,
        s.targetRole,
        s.readinessScore !== null ? s.readinessScore : 'N/A',
        s.status,
        s.atsScore !== null ? s.atsScore : 'N/A',
        s.portfolioScore !== null ? s.portfolioScore : 'N/A',
        s.aptitudeScore !== null ? s.aptitudeScore : 'N/A',
        s.mockScore !== null ? s.mockScore : 'N/A',
        s.mockCount,
        s.dsaSolved,
      ]);

      const headerLine = headers.map(formatCsvCell).join(',');
      const rowLines = rows.map((r) => r.map(formatCsvCell).join(','));
      const csv = [headerLine, ...rowLines].join('\r\n');

      const filename = `student-readiness-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`;
      triggerCsvDownload(csv, filename);

      setReportExportNotice(
        `Student Readiness Report (${analytics.students.length} students) successfully downloaded.`
      );
      setTimeout(() => setReportExportNotice(null), 4500);
    } catch (err: any) {
      console.error('[Export Students CSV Error]:', err);
    } finally {
      setTimeout(() => setDownloadingReport(null), 750);
    }
  };

  const handleDownloadPlacementsReport = () => {
    if (!placementsData) return;
    setDownloadingReport('placements');

    try {
      const lines: string[] = [];

      // Metadata Header Block
      lines.push(`Institution Name,${formatCsvCell(institutionName)}`);
      lines.push(`Generated Date,${formatCsvCell(getReportDateString())}`);
      lines.push(`Placement Rate,${formatCsvCell(`${placementsData.placementRate || 0}%`)}`);
      lines.push(`Total Students Placed,${formatCsvCell(placementsData.totalStudentsPlaced || 0)}`);
      lines.push(`Total Eligible Students,${formatCsvCell(placementsData.totalStudents || 0)}`);
      lines.push(`Total Confirmed Offers,${formatCsvCell(placementsData.totalOffers || 0)}`);
      lines.push(
        `Full-Time Job Offers,${formatCsvCell(
          (placementsData.byType?.job || 0) + (placementsData.byType?.Job || 0)
        )}`
      );
      lines.push(
        `Internship Offers,${formatCsvCell(
          (placementsData.byType?.internship || 0) + (placementsData.byType?.Internship || 0)
        )}`
      );
      lines.push(''); // Blank row separator

      // Section 1: Company Placement Summary
      lines.push('--- RECRUITING COMPANY PLACEMENT BREAKDOWN ---');
      const companyHeaders = [
        'Company Name',
        'Campus Applicants',
        'Confirmed Offers',
        'Hiring Conversion Rate (%)',
      ];
      lines.push(companyHeaders.map(formatCsvCell).join(','));

      (placementsData.byCompany || []).forEach((c) => {
        const convRate =
          c.applicantCount > 0 ? Math.round((c.offerCount / c.applicantCount) * 100) : 0;
        lines.push(
          [c.company, c.applicantCount, c.offerCount, `${convRate}%`].map(formatCsvCell).join(',')
        );
      });

      lines.push(''); // Blank row separator

      // Section 2: Recent Verified Placements
      lines.push('--- VERIFIED STUDENT OFFER CONFIRMATIONS ---');
      const placementHeaders = [
        'Student Name',
        'Student Email',
        'Degree / Branch',
        'Recruiting Company',
        'Role / Designation',
        'Offer Type',
        'Verification Date',
      ];
      lines.push(placementHeaders.map(formatCsvCell).join(','));

      (placementsData.recentPlacements || []).forEach((p) => {
        lines.push(
          [
            p.studentName,
            p.studentEmail,
            p.studentDegree,
            p.company,
            p.role,
            p.type || 'Job',
            formatExperienceDate(p.date),
          ]
            .map(formatCsvCell)
            .join(',')
        );
      });

      const csv = lines.join('\r\n');
      const filename = `placement-summary-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`;
      triggerCsvDownload(csv, filename);

      setReportExportNotice(
        `Placement Summary Report (${(placementsData.byCompany || []).length} companies, ${(placementsData.recentPlacements || []).length} offers) successfully downloaded.`
      );
      setTimeout(() => setReportExportNotice(null), 4500);
    } catch (err: any) {
      console.error('[Export Placements CSV Error]:', err);
    } finally {
      setTimeout(() => setDownloadingReport(null), 750);
    }
  };

  const handleDownloadCompaniesReport = () => {
    if (!companiesData || !companiesData.companies) return;
    setDownloadingReport('companies');

    try {
      const headers = [
        'Company Name',
        'Unique Campus Applicants',
        'Total Applications Received',
        'Confirmed Offers',
        'Offer Conversion Rate (%)',
        'Roles Engaged',
        'Application Status Breakdown',
        'Corporate Recruiter Name',
        'Recruiter Email Address',
        'Recruiter Designation',
        'Recruiter LinkedIn Profile',
      ];

      const rows = companiesData.companies.map((c) => {
        const rolesList = (c.roles || []).join('; ');
        const statusSummary = Object.entries(c.statusBreakdown || {})
          .map(([status, count]) => `${status}: ${count}`)
          .join('; ');

        return [
          c.company,
          c.applicantCount,
          c.totalApplications,
          c.offerCount,
          `${c.conversionRate}%`,
          rolesList,
          statusSummary,
          c.recruiter?.name || 'Unassigned',
          c.recruiter?.email || 'N/A',
          c.recruiter?.designation || 'N/A',
          c.recruiter?.linkedinUrl || 'N/A',
        ];
      });

      const headerLine = headers.map(formatCsvCell).join(',');
      const rowLines = rows.map((r) => r.map(formatCsvCell).join(','));
      const csv = [headerLine, ...rowLines].join('\r\n');

      const filename = `company-engagement-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`;
      triggerCsvDownload(csv, filename);

      setReportExportNotice(
        `Company Engagement Report (${companiesData.companies.length} corporate partners) successfully downloaded.`
      );
      setTimeout(() => setReportExportNotice(null), 4500);
    } catch (err: any) {
      console.error('[Export Companies CSV Error]:', err);
    } finally {
      setTimeout(() => setDownloadingReport(null), 750);
    }
  };

  const handleDownloadAllReports = () => {
    setDownloadingReport('all');
    let count = 0;
    if (analytics?.students && analytics.students.length > 0) {
      handleDownloadStudentsReport();
      count++;
    }
    if (
      placementsData &&
      ((placementsData.byCompany && placementsData.byCompany.length > 0) ||
        (placementsData.recentPlacements && placementsData.recentPlacements.length > 0))
    ) {
      setTimeout(() => {
        handleDownloadPlacementsReport();
      }, 400);
      count++;
    }
    if (companiesData && companiesData.companies && companiesData.companies.length > 0) {
      setTimeout(() => {
        handleDownloadCompaniesReport();
      }, 800);
      count++;
    }
    setTimeout(() => {
      setDownloadingReport(null);
      setReportExportNotice(`Triggered download for ${count} available institutional CSV reports.`);
      setTimeout(() => setReportExportNotice(null), 4500);
    }, 1200);
  };

  const hasLoadedAnalyticsRef = useRef(false);
  // Fetch real analytics from GET /api/tpo/analytics
  const fetchAnalytics = async (isManualRefresh = false, isSilent = false) => {
    const silent = isSilent || (hasLoadedAnalyticsRef.current && !isManualRefresh);
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (!silent) {
      setLoading(true);
    }
    if (!silent) {
      setError(null);
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/tpo/analytics', { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to load institutional analytics`);
      }

      setAnalytics(data);
    } catch (err: any) {
      console.error('[InstitutionDashboard] Error fetching analytics:', err);
      if (!silent) {
        setError(err.message || 'Unable to retrieve college placement analytics');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setIsRefreshing(false);
      hasLoadedAnalyticsRef.current = true;
    }
  };

  // Fetch real placements and internships outcome data from GET /api/tpo/placements
  const fetchPlacements = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoadingPlacements(true);
    }
    setPlacementsError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/tpo/placements', { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to load placement records`);
      }

      setPlacementsData(data);
    } catch (err: any) {
      console.error('[InstitutionDashboard] Error fetching placements:', err);
      setPlacementsError(err.message || 'Unable to retrieve college placement records');
    } finally {
      setLoadingPlacements(false);
      setIsRefreshing(false);
    }
  };

  // Fetch companies engagement records from GET /api/tpo/companies
  const fetchCompanies = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoadingCompanies(true);
    }
    setCompaniesError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/tpo/companies', { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to load company records`);
      }

      setCompaniesData(data);
    } catch (err: any) {
      console.error('[InstitutionDashboard] Error fetching companies:', err);
      setCompaniesError(err.message || 'Unable to retrieve corporate engagement records');
    } finally {
      setLoadingCompanies(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchPendingExperiences();
    fetchPlacements();
    fetchCompanies();
  }, [token]);

  // Polling safety ref: skip polling tick if user has modal open, is editing, or is mid-submit
  const isInstitutionBusyRef = useRef(false);
  isInstitutionBusyRef.current = Boolean(
    selectedStudent ||
    rejectModalTarget ||
    submittingReject ||
    actionInProgressId ||
    downloadingReport
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
        if (isInstitutionBusyRef.current) return;

        // Re-run existing primary data fetch silently in background
        fetchAnalytics(false);
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

  useEffect(() => {
    if (activeTab === 'moderation' && pendingExperiences === null && !loadingModeration) {
      fetchPendingExperiences();
    }
    if (activeTab === 'placements' && placementsData === null && !loadingPlacements) {
      fetchPlacements();
    }
    if (activeTab === 'companies' && companiesData === null && !loadingCompanies) {
      fetchCompanies();
    }
    if (activeTab === 'reports') {
      if (analytics === null && !loading) fetchAnalytics();
      if (placementsData === null && !loadingPlacements) fetchPlacements();
      if (companiesData === null && !loadingCompanies) fetchCompanies();
    }
  }, [activeTab]);

  // Sidebar navigation configuration
  const navItems: Array<{
    id: InstitutionNavTab;
    label: string;
    icon: React.ElementType;
    badge: string | null;
    description: string;
  }> = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Campus placement overview, real-time readiness analytics, and student cohort performance.',
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      badge: analytics?.summary.totalStudents ? `${analytics.summary.totalStudents}` : null,
      description: 'Comprehensive student registry, verifiable skill profiles, resume audits, and direct candidate dossiers.',
    },
    {
      id: 'placements',
      label: 'Placements & Internships',
      icon: Briefcase,
      badge:
        placementsData && placementsData.totalOffers > 0
          ? `${placementsData.totalOffers}`
          : null,
      description: 'Campus drive coordination, company eligibility criteria, offer tracking, and recruitment schedules.',
    },
    {
      id: 'companies',
      label: 'Companies & Recruiters',
      icon: Building2,
      badge:
        companiesData && companiesData.totalCompanies > 0
          ? `${companiesData.totalCompanies}`
          : null,
      description: 'Corporate engagement directory, industry partners, recruiter requests, and campus visit bookings.',
    },
    {
      id: 'moderation',
      label: 'Interview Experience Moderation',
      icon: ShieldCheck,
      badge:
        pendingExperiences && pendingExperiences.length > 0
          ? `${pendingExperiences.length}`
          : null,
      description: 'Review and approve student-submitted company interview experiences and technical question archives.',
    },
    {
      id: 'portfolio_verification',
      label: 'Portfolio Verification',
      icon: CheckCircle2,
      badge: 'Queue',
      description: 'Review evidence and authorize student certifications, capstone projects, internships, and honors.',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      badge: null,
      description: 'In-depth historical placement statistics, department-wise comparisons, and recruiter hiring conversion metrics.',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: null,
      description: 'Generate accreditation exports (NIRF, NAAC, NBA), compliance rosters, and board-ready placement summaries.',
    },
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  const filteredNav = sidebarSearch.trim()
    ? navItems.filter((n) => n.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : navItems;

  // Filtered & sorted student list for the Overview roster
  const filteredStudents = useMemo(() => {
    if (!analytics?.students) return [];

    let list = [...analytics.students];

    // Search filter
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.targetRole.toLowerCase().includes(q) ||
          s.degree.toLowerCase().includes(q)
      );
    }

    // Readiness status filter
    if (readinessFilter !== 'all') {
      list = list.filter((s) => s.status === readinessFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'readiness') {
        const scoreA = a.readinessScore ?? -1;
        const scoreB = b.readinessScore ?? -1;
        return scoreB - scoreA;
      }
      if (sortBy === 'ats') {
        const atsA = a.atsScore ?? -1;
        const atsB = b.atsScore ?? -1;
        return atsB - atsA;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [analytics?.students, studentSearch, readinessFilter, sortBy]);

  // Load individual student profile on demand via GET /api/tpo/students/:studentId/profile
  const handleOpenStudentDetail = async (student: StudentRosterItem) => {
    setSelectedStudent(student);
    setDetailActiveSection('overview');
    setLoadingProfile(true);
    setProfileError(null);
    setStudentProfile(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/tpo/students/${student.id}/profile`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to load candidate dossier`);
      }

      setStudentProfile(data);
    } catch (err: any) {
      console.error('[InstitutionDashboard] Error loading student profile:', err);
      setProfileError(err.message || 'Unable to retrieve candidate dossier details');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCloseStudentDetail = () => {
    setSelectedStudent(null);
    setStudentProfile(null);
    setProfileError(null);
  };

  // Close detail drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStudent) {
        handleCloseStudentDetail();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudent]);

  // Cohort summary statistics for quick filtering
  const cohortCounts = useMemo(() => {
    const total = analytics?.students.length || 0;
    let needsSupport = 0;
    let developing = 0;
    let placementReady = 0;

    if (analytics?.students) {
      for (const s of analytics.students) {
        if (s.status === 'Needs Support') needsSupport++;
        else if (s.status === 'Developing') developing++;
        else if (s.status === 'Placement Ready') placementReady++;
      }
    }

    return { total, needsSupport, developing, placementReady };
  }, [analytics?.students]);

  // Filtered & sorted companies list for the Companies & Recruiters tab
  const filteredCompanies = useMemo(() => {
    if (!companiesData?.companies) return [];

    return companiesData.companies
      .filter((comp) => {
        // Search filter
        if (companySearch.trim()) {
          const q = companySearch.toLowerCase().trim();
          const matchesCompany = comp.company.toLowerCase().includes(q);
          const matchesRole = comp.roles?.some((r) => r.toLowerCase().includes(q));
          const matchesRecruiter =
            comp.recruiter &&
            (comp.recruiter.name.toLowerCase().includes(q) ||
              comp.recruiter.email.toLowerCase().includes(q) ||
              (comp.recruiter.designation &&
                comp.recruiter.designation.toLowerCase().includes(q)));
          if (!matchesCompany && !matchesRole && !matchesRecruiter) return false;
        }

        // Recruiter filter
        if (companyRecruiterFilter === 'has_recruiter' && !comp.recruiter) return false;
        if (companyRecruiterFilter === 'no_recruiter' && comp.recruiter) return false;

        return true;
      })
      .sort((a, b) => {
        if (companySortBy === 'applicants') {
          if (b.applicantCount !== a.applicantCount) return b.applicantCount - a.applicantCount;
          return b.offerCount - a.offerCount;
        }
        if (companySortBy === 'offers') {
          if (b.offerCount !== a.offerCount) return b.offerCount - a.offerCount;
          return b.applicantCount - a.applicantCount;
        }
        if (companySortBy === 'conversion') {
          if (b.conversionRate !== a.conversionRate) return b.conversionRate - a.conversionRate;
          return b.offerCount - a.offerCount;
        }
        if (companySortBy === 'name') {
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [companiesData, companySearch, companyRecruiterFilter, companySortBy]);

  // Count of companies that have a verified recruiter linked
  const linkedRecruitersCount = useMemo(() => {
    if (!companiesData?.companies) return 0;
    return companiesData.companies.filter((c) => c.recruiter !== null).length;
  }, [companiesData]);

  // Skill Gap Intelligence: Categories ranked weakest-first (lowest score first)
  const sortedSkillCategories = useMemo(() => {
    const rawCategories = analytics?.weakAreasDiagnostic?.categories || [];
    // Filter out categories where score is null if there are at least some with scores
    const withScores = rawCategories.filter((c) => c.score !== null);
    const list = withScores.length > 0 ? withScores : rawCategories;

    return [...list].sort((a, b) => {
      const scoreA = a.score ?? 999;
      const scoreB = b.score ?? 999;
      return scoreA - scoreB;
    });
  }, [analytics?.weakAreasDiagnostic?.categories]);

  // Readiness Funnel: 3-tier synthesis for horizontal visualization
  const readinessFunnel = useMemo(() => {
    if (!analytics?.readinessDistribution) return null;
    const { placementReady, developing, needsSupport } = analytics.readinessDistribution;
    const total =
      (placementReady?.count || 0) + (developing?.count || 0) + (needsSupport?.count || 0);
    const readyPct =
      total > 0 ? Math.round(((placementReady?.count || 0) / total) * 100) : placementReady?.percentage || 0;
    const devPct =
      total > 0 ? Math.round(((developing?.count || 0) / total) * 100) : developing?.percentage || 0;
    const supportPct =
      total > 0 ? Math.max(0, 100 - readyPct - devPct) : needsSupport?.percentage || 0;

    return {
      placementReady: { ...placementReady, calcPct: readyPct },
      developing: { ...developing, calcPct: devPct },
      needsSupport: { ...needsSupport, calcPct: supportPct },
      total,
    };
  }, [analytics?.readinessDistribution]);

  // Placement Trend Snapshot: job vs internship split and top hiring companies
  const placementTrendSummary = useMemo(() => {
    if (!placementsData) return null;
    const totalOffers = placementsData.totalOffers || 0;
    const jobCount = (placementsData.byType?.job || 0) + (placementsData.byType?.Job || 0);
    const internshipCount =
      (placementsData.byType?.internship || 0) + (placementsData.byType?.Internship || 0);
    const totalType = jobCount + internshipCount;
    const jobPct = totalType > 0 ? Math.round((jobCount / totalType) * 100) : 0;
    const internshipPct = totalType > 0 ? Math.round((internshipCount / totalType) * 100) : 0;

    const topHiring = [...(placementsData.byCompany || [])]
      .sort((a, b) => b.offerCount - a.offerCount)
      .slice(0, 4);

    return {
      placementRate: placementsData.placementRate || 0,
      totalOffers,
      totalPlaced: placementsData.totalStudentsPlaced || 0,
      totalEligible: placementsData.totalStudents || 0,
      jobCount,
      internshipCount,
      jobPct,
      internshipPct,
      topHiring,
    };
  }, [placementsData]);

  // Contextual Data-Driven Next Steps ("So What" Synthesis)
  const actionableRecommendations = useMemo(() => {
    if (!analytics) return [];

    const recs: Array<{
      id: string;
      title: string;
      description: string;
      badge: string;
      badgeVariant: 'warning' | 'positive' | 'neutral' | 'verified';
      actionText: string;
      onAction: () => void;
    }> = [];

    const weakArea = analytics.weakAreasDiagnostic?.mostCommonWeakArea;
    const lowestScore = analytics.weakAreasDiagnostic?.lowestScore;
    const weakModule = analytics.weakAreasDiagnostic?.module;

    if (weakArea && lowestScore !== null) {
      recs.push({
        id: 'skill-deficit',
        title: `Targeted Intervention: ${weakArea}`,
        description: `Institutional diagnostics show an average cohort score of ${lowestScore}% in ${weakArea} (${weakModule} module). Consider organizing an industry-led workshop or targeted lab session on ${weakArea} to directly address the primary skill bottleneck before upcoming campus drives.`,
        badge: 'Critical Skill Gap',
        badgeVariant: 'warning',
        actionText: 'Filter Developing Cohort',
        onAction: () => {
          setActiveTab('students');
          setStudentsStatusFilter('Developing');
        },
      });
    }

    const { placementReady, developing, needsSupport } = analytics.readinessDistribution;
    if (needsSupport && needsSupport.percentage > 25) {
      recs.push({
        id: 'support-cohort',
        title: 'Diagnostic Support for At-Risk Students',
        description: `${needsSupport.count} students (${needsSupport.percentage}%) currently fall into the Needs Support category (readiness < 40%). Recommend mandating foundational mock assessments and dedicated mentor guidance before corporate eligibility screening.`,
        badge: 'Remediation Priority',
        badgeVariant: 'warning',
        actionText: 'View Support Students',
        onAction: () => {
          setActiveTab('students');
          setStudentsStatusFilter('Needs Support');
        },
      });
    } else if (placementReady && placementReady.percentage >= 50) {
      recs.push({
        id: 'ready-cohort',
        title: 'Accelerate Corporate Campus Drives',
        description: `${placementReady.count} students (${placementReady.percentage}%) meet the Placement Ready standard (≥ 70%). The cohort demonstrates strong interview Poise and technical depth—prime timing to engage premium corporate recruitment partners.`,
        badge: 'Drive Readiness',
        badgeVariant: 'positive',
        actionText: 'Open Corporate Directory',
        onAction: () => {
          setActiveTab('companies');
        },
      });
    } else if (developing && developing.percentage > 0) {
      recs.push({
        id: 'developing-bridge',
        title: 'Cohort Transition Opportunity',
        description: `${developing.count} students (${developing.percentage}%) are situated in the Developing bracket (40%–69%). Targeted mock interview iterations and resume refinement can transition this critical mass into placement qualification.`,
        badge: 'Readiness Boost',
        badgeVariant: 'verified',
        actionText: 'Review Developing Students',
        onAction: () => {
          setActiveTab('students');
          setStudentsStatusFilter('Developing');
        },
      });
    }

    if (companiesData && companiesData.totalCompanies > 0) {
      const topRolesSet = new Set<string>();
      companiesData.companies.forEach((c) => c.roles?.forEach((r) => topRolesSet.add(r)));
      const topRoles = Array.from(topRolesSet).slice(0, 3);

      recs.push({
        id: 'corporate-demand',
        title: 'Corporate Hiring Alignment',
        description: `${companiesData.totalCompanies} corporate partners are actively engaging ${institutionName} candidates${
          topRoles.length > 0 ? `, with demand concentrated in ${topRoles.join(', ')}` : ''
        }. Align mock interview question banks and aptitude tests with these specific employer profiles.`,
        badge: 'Market Alignment',
        badgeVariant: 'verified',
        actionText: 'View Engaged Employers',
        onAction: () => {
          setActiveTab('companies');
        },
      });
    }

    return recs;
  }, [analytics, companiesData, institutionName]);

  // Filtered & sorted student list for the dedicated Students tab (reusing analytics.students)
  const studentsRosterList = useMemo(() => {
    if (!analytics?.students) return [];

    let list = [...analytics.students];

    // Search filter
    if (studentsSearch.trim()) {
      const q = studentsSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.targetRole.toLowerCase().includes(q) ||
          s.degree.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (studentsStatusFilter !== 'all') {
      list = list.filter((s) => s.status === studentsStatusFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (studentsSortBy === 'readiness-asc') {
        const scoreA = a.readinessScore ?? 999;
        const scoreB = b.readinessScore ?? 999;
        return scoreA - scoreB;
      }
      if (studentsSortBy === 'readiness-desc') {
        const scoreA = a.readinessScore ?? -1;
        const scoreB = b.readinessScore ?? -1;
        return scoreB - scoreA;
      }
      if (studentsSortBy === 'ats') {
        const atsA = a.atsScore ?? -1;
        const atsB = b.atsScore ?? -1;
        return atsB - atsA;
      }
      if (studentsSortBy === 'dsa') {
        return (b.dsaSolved || 0) - (a.dsaSolved || 0);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [analytics?.students, studentsSearch, studentsStatusFilter, studentsSortBy]);

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
    <nav className="space-y-1 px-3 py-2 flex-1" aria-label="Institution Navigation">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-all text-left group cursor-pointer ${
                isActive
                  ? 'bg-[#4338CA] text-white shadow-xs font-semibold'
                  : 'text-[#14131F]/80 hover:text-[#14131F] hover:bg-[#14131F]/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-[#14131F]/60 group-hover:text-[#4338CA]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20'
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
    <div className="p-3 mx-3 mb-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-1.5 text-left">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#14131F]/50">
        <Landmark className="w-3.5 h-3.5 text-[#4338CA]" />
        <span>Institution Node</span>
      </div>
      <p className="text-xs font-semibold text-[#14131F] truncate" title={institutionName}>
        {institutionName}
      </p>
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-[11px] text-[#14131F]/60">Campus Portal Active</span>
      </div>
    </div>
  );

  const renderProfileFooter = () => (
    <div className="p-3 border-t border-[#14131F]/8 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 flex items-center justify-center font-display font-bold text-xs shrink-0">
          {officerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-semibold text-[#14131F] truncate">{officerName}</p>
          <p className="text-[10px] text-[#14131F]/50 truncate">TPO / Placement Cell</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="p-1.5 rounded-lg border border-[#14131F]/10 hover:bg-[#FB7185]/10 hover:text-[#E11D48] text-[#14131F]/60 transition-colors cursor-pointer"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      <DashboardShell
        portalSubtitle="Institution Portal"
        portalIcon={Landmark}
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
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>Campus TPO Office</span>
          </div>
        }
        headerActions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetchAnalytics(true);
                if (activeTab === 'moderation') {
                  fetchPendingExperiences(true);
                }
              }}
              disabled={isRefreshing || loading || loadingModeration}
              icon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing || loading || loadingModeration ? 'animate-spin' : ''}`}
                />
              }
              className="text-xs text-[#14131F]/70 border border-[#14131F]/10 hover:border-[#14131F]/20"
              title="Refresh placement analytics and moderation queue"
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
        {activeTab === 'overview' ? (
            /* OVERVIEW TAB CONTENT */
            <div className="space-y-8 animate-in fade-in duration-150 text-left">
              {/* Institution Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title={institutionName}
                  subtitle={`Training & Placement Cell • Supervised by ${officerName}`}
                  badge={<VerifiedSeal iconType="shield" label="Verified Institution" />}
                />
              </div>

              {/* Error Notice if API Call Fails */}
              {error && (
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#E11D48] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <h4 className="font-bold text-sm text-[#E11D48]">Analytics Retrieval Notice</h4>
                      <p className="mt-0.5 text-xs text-[#14131F]/80 leading-relaxed">{error}</p>
                      {error.includes('College / University Name') && (
                        <p className="mt-1 text-[11px] text-[#14131F]/70">
                          Tip: The institutional dashboard aggregates data based on your college affiliation. Please ensure your account profile has an affiliated college name configured.
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchAnalytics(false)}
                    className="text-xs shrink-0 self-end sm:self-auto"
                  >
                    Retry Diagnostics
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {loading && !analytics ? (
                <div className="p-16 text-center space-y-3 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                  <h3 className="text-base font-bold font-display text-[#14131F]">
                    Synthesizing Campus Placement Metrics...
                  </h3>
                  <p className="text-xs text-[#14131F]/60 max-w-md mx-auto">
                    Aggregating student readiness indices, ATS evaluations, AI mock interview performances, and aptitude test scores for {institutionName}.
                  </p>
                </div>
              ) : analytics ? (
                <>
                  {/* Real KPI Cards from GET /api/tpo/analytics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* KPI 1: Registered Students */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F]/60">
                          Total Enrolled Students
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F]">
                            {analytics.summary.totalStudents}
                          </span>
                          <span className="text-xs font-medium text-[#14131F]/50">students</span>
                        </div>
                        <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                          Active campus candidate profiles mapped to your institutional registry.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px]">
                        <span className="text-[#14131F]/50">Batch Roster</span>
                        <span className="font-semibold text-[#4338CA]">Live Verified</span>
                      </div>
                    </div>

                    {/* KPI 2: Resume ATS Average */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F]/60">
                          Average Resume ATS
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-emerald-800 flex items-center justify-center">
                          <FileCheck className="w-4 h-4 text-emerald-700" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F]">
                            {analytics.summary.averageScores.resumeAts}
                          </span>
                          <span className="text-xs font-medium text-[#14131F]/50">/ 100</span>
                        </div>
                        <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                          Across {analytics.summary.resumesEvaluated} evaluated candidate resumes in the system.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px]">
                        <span className="text-[#14131F]/50">Audited Resumes</span>
                        <span className="font-semibold text-emerald-700">
                          {analytics.summary.resumesEvaluated} parsed
                        </span>
                      </div>
                    </div>

                    {/* KPI 3: Mock Interview Average */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F]/60">
                          Avg Mock Interview
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center border border-purple-200">
                          <Target className="w-4 h-4 text-purple-700" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F]">
                            {analytics.summary.averageScores.mockInterview}
                          </span>
                          <span className="text-xs font-medium text-[#14131F]/50">/ 100</span>
                        </div>
                        <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                          Across {analytics.summary.mockInterviewsCompleted} completed AI & technical viva interviews.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px]">
                        <span className="text-[#14131F]/50">Completed Sessions</span>
                        <span className="font-semibold text-purple-700">
                          {analytics.summary.mockInterviewsCompleted} sessions
                        </span>
                      </div>
                    </div>

                    {/* KPI 4: Aptitude & Portfolio Audits */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F]/60">
                          Aptitude & Portfolios
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                          <BarChart2 className="w-4 h-4 text-amber-700" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-bold text-3xl sm:text-4xl text-[#14131F]">
                            {analytics.summary.averageScores.aptitudeTest}
                          </span>
                          <span className="text-xs font-medium text-[#14131F]/50">avg aptitude</span>
                        </div>
                        <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                          Avg portfolio quality: {analytics.summary.averageScores.portfolioQuality}/100 across{' '}
                          {analytics.summary.portfoliosAudited} repositories.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#14131F]/6 flex items-center justify-between text-[11px]">
                        <span className="text-[#14131F]/50">Aptitude Tests</span>
                        <span className="font-semibold text-amber-700">
                          {analytics.summary.aptitudeTestsAttempted} attempted
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Readiness Distribution & Weak Areas Diagnostic Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Readiness Distribution Card (2 Columns on Large) */}
                    <div className="lg:col-span-2 bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#14131F]/6">
                        <div>
                          <h3 className="text-base font-bold font-display text-[#14131F]">
                            Cohort Placement Readiness Distribution
                          </h3>
                          <p className="text-xs text-[#14131F]/60 mt-0.5">
                            Categorized dynamically via weighted composite scores (Interviews 40%, ATS 25%, Portfolio 20%, Coding & Aptitude 15%).
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#14131F]/5 text-[#14131F]/70 self-start sm:self-auto">
                          {analytics.summary.totalStudents} total candidates
                        </span>
                      </div>

                      {/* Visual Segmented Progress Bar */}
                      <div className="space-y-2">
                        <div className="h-3.5 w-full bg-[#14131F]/5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                          {analytics.readinessDistribution.placementReady.percentage > 0 && (
                            <div
                              style={{
                                width: `${analytics.readinessDistribution.placementReady.percentage}%`,
                              }}
                              className="bg-emerald-500 rounded-full transition-all duration-500"
                              title={`Placement Ready: ${analytics.readinessDistribution.placementReady.percentage}%`}
                            />
                          )}
                          {analytics.readinessDistribution.developing.percentage > 0 && (
                            <div
                              style={{
                                width: `${analytics.readinessDistribution.developing.percentage}%`,
                              }}
                              className="bg-amber-400 rounded-full transition-all duration-500"
                              title={`Developing: ${analytics.readinessDistribution.developing.percentage}%`}
                            />
                          )}
                          {analytics.readinessDistribution.needsSupport.percentage > 0 && (
                            <div
                              style={{
                                width: `${analytics.readinessDistribution.needsSupport.percentage}%`,
                              }}
                              className="bg-rose-400 rounded-full transition-all duration-500"
                              title={`Needs Support: ${analytics.readinessDistribution.needsSupport.percentage}%`}
                            />
                          )}
                        </div>

                        {/* Ratio breakdown labels */}
                        <div className="flex items-center justify-between text-[11px] text-[#14131F]/60 px-1">
                          <span>0%</span>
                          <span>Campus Readiness Index</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Metric Category Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                        {/* 1. Placement Ready */}
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                              Placement Ready
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-display text-emerald-950">
                              {analytics.readinessDistribution.placementReady.count}
                            </span>
                            <span className="text-xs font-semibold text-emerald-700">
                              ({analytics.readinessDistribution.placementReady.percentage}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800/80 leading-snug">
                            Readiness score ≥ 70%. Eligible for tier-1 campus drives.
                          </p>
                        </div>

                        {/* 2. Developing */}
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                              Developing
                            </span>
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-display text-amber-950">
                              {analytics.readinessDistribution.developing.count}
                            </span>
                            <span className="text-xs font-semibold text-amber-700">
                              ({analytics.readinessDistribution.developing.percentage}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800/80 leading-snug">
                            Readiness score 40%–69%. Close to placement benchmark.
                          </p>
                        </div>

                        {/* 3. Needs Support */}
                        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
                              Needs Support
                            </span>
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-display text-rose-950">
                              {analytics.readinessDistribution.needsSupport.count}
                            </span>
                            <span className="text-xs font-semibold text-rose-700">
                              ({analytics.readinessDistribution.needsSupport.percentage}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-800/80 leading-snug">
                            Score &lt; 40% or incomplete assessment baseline.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Diagnostic / Common Weak Area Card */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-[#14131F]/6">
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-[#4338CA]" />
                            <h3 className="text-base font-bold font-display text-[#14131F]">
                              Batch Diagnostic
                            </h3>
                          </div>
                          <span className="text-[10px] font-semibold text-[#4338CA] px-2 py-0.5 rounded-full bg-[#4338CA]/10">
                            AI Analyzed
                          </span>
                        </div>

                        {analytics.weakAreasDiagnostic.mostCommonWeakArea ? (
                          <div className="p-3.5 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/25 space-y-1.5">
                            <span className="text-[10px] font-bold text-[#E11D48] uppercase tracking-wider block">
                              Most Common Weak Area
                            </span>
                            <h4 className="text-sm font-bold text-[#14131F] leading-snug">
                              {analytics.weakAreasDiagnostic.mostCommonWeakArea}
                            </h4>
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-xs font-bold text-[#E11D48]">
                                Avg Score: {analytics.weakAreasDiagnostic.lowestScore ?? 0}/100
                              </span>
                              <span className="text-[#14131F]/30">•</span>
                              <span className="text-xs text-[#14131F]/60">
                                Module: {analytics.weakAreasDiagnostic.module}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 text-xs text-[#14131F]/60 text-center">
                            No critical batch bottlenecks detected across evaluated modules.
                          </div>
                        )}

                        {/* Category score list */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-semibold text-[#14131F]/60 block">
                            Key Dimension Benchmarks
                          </span>
                          <div className="space-y-2">
                            {analytics.weakAreasDiagnostic.categories
                              .filter((c) => c.score !== null)
                              .slice(0, 4)
                              .map((cat) => (
                                <div key={cat.key} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-[#14131F]/80 truncate pr-2" title={cat.label}>
                                      {cat.label}
                                    </span>
                                    <span className="font-semibold text-[#14131F] shrink-0">
                                      {cat.score}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#14131F]/5 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${Math.min(100, Math.max(0, cat.score || 0))}%` }}
                                      className={`h-full rounded-full ${
                                        (cat.score || 0) >= 70
                                          ? 'bg-emerald-500'
                                          : (cat.score || 0) >= 40
                                          ? 'bg-amber-400'
                                          : 'bg-rose-400'
                                      }`}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#14131F]/50 pt-2 border-t border-[#14131F]/6">
                        Recommendation: Schedule targeted interview drills on low-scoring competencies.
                      </p>
                    </div>
                  </div>

                  {/* Student Cohort Performance & Readiness Table */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
                    {/* Table Header & Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#14131F]/6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold font-display text-[#14131F]">
                            Student Candidate Roster & Placement Indices
                          </h3>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA]">
                            {filteredStudents.length} Students
                          </span>
                        </div>
                        <p className="text-xs text-[#14131F]/60 mt-0.5">
                          Real student candidates enrolled at {institutionName} with live readiness indices.
                        </p>
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-[#14131F]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Filter by name, role..."
                            className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] transition-colors w-44 sm:w-52"
                          />
                        </div>

                        {/* Status Filter */}
                        <select
                          value={readinessFilter}
                          onChange={(e) => setReadinessFilter(e.target.value as any)}
                          className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-2.5 py-1.5 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                        >
                          <option value="all">All Statuses</option>
                          <option value="Placement Ready">Placement Ready</option>
                          <option value="Developing">Developing</option>
                          <option value="Needs Support">Needs Support</option>
                        </select>

                        {/* Sort Selector */}
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-2.5 py-1.5 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                        >
                          <option value="readiness">Sort by Readiness</option>
                          <option value="ats">Sort by Resume ATS</option>
                          <option value="name">Sort by Name</option>
                        </select>
                      </div>
                    </div>

                    {/* Table View */}
                    {filteredStudents.length === 0 ? (
                      <div className="p-12 text-center space-y-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6">
                        <div className="w-10 h-10 rounded-xl bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center mx-auto">
                          <Search className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-[#14131F]">No students match your filter</h4>
                        <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                          Try resetting your search query or choosing &quot;All Statuses&quot; to see all registered candidates.
                        </p>
                        {(studentSearch || readinessFilter !== 'all') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStudentSearch('');
                              setReadinessFilter('all');
                            }}
                            className="text-xs text-[#4338CA] border border-[#4338CA]/20"
                          >
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#14131F]/8 text-[#14131F]/50 font-semibold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-3">Candidate</th>
                              <th className="py-3 px-3">Target Role</th>
                              <th className="py-3 px-3 text-center">Readiness Index</th>
                              <th className="py-3 px-3 text-center">Resume ATS</th>
                              <th className="py-3 px-3 text-center">Mock Score</th>
                              <th className="py-3 px-3 text-center">Portfolio</th>
                              <th className="py-3 px-3 text-center">Aptitude</th>
                              <th className="py-3 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#14131F]/6">
                            {filteredStudents.map((student) => (
                              <tr
                                key={student.id}
                                className="hover:bg-[#FAFAF8] transition-colors group"
                              >
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] font-display font-bold text-xs flex items-center justify-center shrink-0">
                                      {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-[#14131F] truncate group-hover:text-[#4338CA] transition-colors">
                                        {student.name}
                                      </p>
                                      <p className="text-[11px] text-[#14131F]/50 truncate">
                                        {student.degree} • {student.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3 font-medium text-[#14131F]/80">
                                  {student.targetRole}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  {student.readinessScore !== null ? (
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                                        student.readinessScore >= 70
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          : student.readinessScore >= 40
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-rose-50 text-rose-800 border-rose-200'
                                      }`}
                                    >
                                      {student.readinessScore}%
                                    </span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic text-[11px]">—</span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center font-medium text-[#14131F]">
                                  {student.atsScore !== null ? (
                                    <span>{student.atsScore}/100</span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center font-medium text-[#14131F]">
                                  {student.mockScore !== null ? (
                                    <span>
                                      {student.mockScore}/100{' '}
                                      <span className="text-[10px] text-[#14131F]/40">
                                        ({student.mockCount})
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center font-medium text-[#14131F]">
                                  {student.portfolioScore !== null ? (
                                    <span>{student.portfolioScore}/100</span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center font-medium text-[#14131F]">
                                  {student.aptitudeScore !== null ? (
                                    <span>{student.aptitudeScore}/100</span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-right">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                      student.status === 'Placement Ready'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : student.status === 'Developing'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}
                                  >
                                    {student.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : activeTab === 'students' ? (
            /* STUDENTS TAB CONTENT (Reusing analytics.students) */
            <div className="space-y-8 animate-in fade-in duration-150 text-left">
              {/* Students Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionHeading
                  title="Student Candidate Registry & Readiness"
                  subtitle={`Enrolled students at ${institutionName} • Real-time placement readiness & competency audits`}
                  badge={<VerifiedSeal iconType="shield" label="Live Cohort Audit" />}
                />
              </div>

              {/* Error Notice if Analytics API Call Failed */}
              {error && (
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#E11D48] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <h4 className="font-bold text-sm text-[#E11D48]">Analytics Retrieval Notice</h4>
                      <p className="mt-0.5 text-xs text-[#14131F]/80 leading-relaxed">{error}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchAnalytics(false)}
                    className="text-xs shrink-0 self-end sm:self-auto"
                  >
                    Retry Diagnostics
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {loading && !analytics ? (
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-12 text-center space-y-4 shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                  <p className="font-display font-semibold text-sm text-[#14131F]">
                    Compiling institutional candidate registry...
                  </p>
                  <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                    Aggregating student readiness benchmarks, resume ATS audits, aptitude logs, and mock interview performances.
                  </p>
                </div>
              ) : analytics ? (
                <>
                  {/* Cohort Summary Metrics (At-a-Glance Triage) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Registered */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#14131F]/60 font-medium">Total Registered</span>
                        <div className="w-7 h-7 rounded-lg bg-[#14131F]/5 text-[#14131F] flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                        {cohortCounts.total}
                      </div>
                      <p className="text-xs text-[#14131F]/50">
                        Total candidates in institutional pool
                      </p>
                    </div>

                    {/* Needs Immediate Support (Coral - prominent for spotting struggling students) */}
                    <div className="bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-2xl p-5 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#E11D48] font-bold">Needs Support (&lt; 40%)</span>
                        <div className="w-7 h-7 rounded-lg bg-[#FB7185]/20 text-[#E11D48] flex items-center justify-center">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-display text-[#E11D48]">
                        {cohortCounts.needsSupport}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-[#E11D48]/80 font-medium">
                          Requires TPO intervention
                        </p>
                        {cohortCounts.needsSupport > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setStudentsStatusFilter('Needs Support');
                              setStudentsSortBy('readiness-asc');
                            }}
                            className="text-[11px] font-semibold text-[#E11D48] underline hover:text-[#BE123C] cursor-pointer"
                          >
                            Filter list &rarr;
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Developing (Indigo) */}
                    <div className="bg-[#4338CA]/5 border border-[#4338CA]/15 rounded-2xl p-5 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#4338CA] font-semibold">Developing (40–69%)</span>
                        <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-display text-[#4338CA]">
                        {cohortCounts.developing}
                      </div>
                      <p className="text-xs text-[#4338CA]/70">
                        Moderate baseline, close to drive-ready
                      </p>
                    </div>

                    {/* Placement Ready (Lime) */}
                    <div className="bg-[#A3E635]/15 border border-[#A3E635]/35 rounded-2xl p-5 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#3F6212] font-semibold">Placement Ready (≥ 70%)</span>
                        <div className="w-7 h-7 rounded-lg bg-[#A3E635]/30 text-[#3F6212] flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                        {cohortCounts.placementReady}
                      </div>
                      <p className="text-xs text-[#3F6212]/80">
                        Ready for tier-1 recruiter drives
                      </p>
                    </div>
                  </div>

                  {/* Needs Support Advisory Banner */}
                  {cohortCounts.needsSupport > 0 && (
                    <div className="bg-[#FB7185]/10 border border-[#FB7185]/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FB7185]/20 text-[#E11D48] flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4 text-[#E11D48]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#14131F]">
                            {cohortCounts.needsSupport} Candidate{cohortCounts.needsSupport > 1 ? 's' : ''} Require Placement Intervention
                          </h4>
                          <p className="text-[#14131F]/70 mt-0.5 leading-relaxed">
                            Readiness scores below 40% detected. Early interventions such as resume restructuring, technical interview simulations, and foundational DSA drills substantially increase placement outcomes.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setStudentsStatusFilter('Needs Support');
                          setStudentsSortBy('readiness-asc');
                        }}
                        className="text-xs bg-white text-[#E11D48] border-[#FB7185]/35 hover:bg-[#FB7185]/10 shrink-0 self-end sm:self-auto"
                      >
                        Filter Needs Support Students
                      </Button>
                    </div>
                  )}

                  {/* Student Registry Card with Filter & Search Controls */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl overflow-hidden shadow-xs">
                    {/* Filter and Search Bar */}
                    <div className="p-4 sm:p-5 border-b border-[#14131F]/8 space-y-4">
                      {/* Top Row: Search and Sort */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={studentsSearch}
                            onChange={(e) => setStudentsSearch(e.target.value)}
                            placeholder="Search by student name, email, target role, or degree..."
                            className="w-full bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl pl-9 pr-8 py-2 text-xs text-[#14131F] placeholder-[#14131F]/40 outline-none focus:border-[#4338CA] transition-colors"
                          />
                          {studentsSearch && (
                            <button
                              type="button"
                              onClick={() => setStudentsSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] cursor-pointer"
                              title="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[#14131F]/50 flex items-center gap-1">
                            <ArrowDownUp className="w-3.5 h-3.5" />
                            Sort:
                          </span>
                          <select
                            value={studentsSortBy}
                            onChange={(e) => setStudentsSortBy(e.target.value as any)}
                            className="bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl px-3 py-2 text-xs font-medium text-[#14131F] outline-none focus:border-[#4338CA] transition-colors cursor-pointer"
                          >
                            <option value="readiness-asc">Readiness: Lowest First (Focus on At-Risk)</option>
                            <option value="readiness-desc">Readiness: Highest First</option>
                            <option value="ats">Resume ATS: High to Low</option>
                            <option value="dsa">DSA Problems: Most Solved</option>
                            <option value="name">Candidate Name: A to Z</option>
                          </select>
                        </div>
                      </div>

                      {/* Bottom Row: Status Filter Chips & Result Counter */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#14131F]/5">
                        {/* Status Filter Chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setStudentsStatusFilter('all')}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                              studentsStatusFilter === 'all'
                                ? 'bg-[#14131F] text-white shadow-xs'
                                : 'bg-[#14131F]/5 text-[#14131F]/70 hover:bg-[#14131F]/10'
                            }`}
                          >
                            All Candidates ({cohortCounts.total})
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentsStatusFilter('Needs Support')}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              studentsStatusFilter === 'Needs Support'
                                ? 'bg-[#FB7185]/20 text-[#E11D48] border border-[#FB7185]/40 font-bold shadow-xs'
                                : 'bg-[#FB7185]/10 text-[#E11D48] hover:bg-[#FB7185]/15'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                            <span>Needs Support ({cohortCounts.needsSupport})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentsStatusFilter('Developing')}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              studentsStatusFilter === 'Developing'
                                ? 'bg-[#4338CA]/15 text-[#4338CA] border border-[#4338CA]/30 font-semibold shadow-xs'
                                : 'bg-[#4338CA]/5 text-[#4338CA] hover:bg-[#4338CA]/10'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                            <span>Developing ({cohortCounts.developing})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentsStatusFilter('Placement Ready')}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              studentsStatusFilter === 'Placement Ready'
                                ? 'bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/50 font-semibold shadow-xs'
                                : 'bg-[#A3E635]/15 text-[#3F6212] hover:bg-[#A3E635]/20'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#65A30D]" />
                            <span>Placement Ready ({cohortCounts.placementReady})</span>
                          </button>
                        </div>

                        {/* Showing count and reset button */}
                        <div className="flex items-center gap-2 text-xs text-[#14131F]/50">
                          <span>
                            Showing {studentsRosterList.length} of {cohortCounts.total} candidates
                          </span>
                          {(studentsSearch || studentsStatusFilter !== 'all') && (
                            <button
                              type="button"
                              onClick={() => {
                                setStudentsSearch('');
                                setStudentsStatusFilter('all');
                              }}
                              className="text-xs text-[#4338CA] hover:underline cursor-pointer font-medium"
                            >
                              Reset filters
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Table View */}
                    {studentsRosterList.length === 0 ? (
                      <div className="p-12 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center mx-auto">
                          <Search className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-sm text-[#14131F]">No matching students found</h4>
                        <p className="text-xs text-[#14131F]/50 max-w-sm mx-auto">
                          No student records match your query "{studentsSearch}" or the selected status filter.
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setStudentsSearch('');
                            setStudentsStatusFilter('all');
                          }}
                          className="text-xs"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#14131F]/8 bg-[#FAFAF8] text-[#14131F]/60 font-semibold">
                              <th className="py-3.5 px-4">Candidate</th>
                              <th className="py-3.5 px-3">Target Role</th>
                              <th className="py-3.5 px-3 text-center">Readiness Score</th>
                              <th className="py-3.5 px-3 text-center" title="Resume ATS score">ATS Score</th>
                              <th className="py-3.5 px-3 text-center" title="Mock interview score and count">Mock Interview</th>
                              <th className="py-3.5 px-3 text-center" title="Aptitude assessment score">Aptitude</th>
                              <th className="py-3.5 px-3 text-center" title="GitHub portfolio score">Portfolio</th>
                              <th className="py-3.5 px-3 text-center" title="DSA problems solved">DSA Solved</th>
                              <th className="py-3.5 px-3 text-center">Status</th>
                              <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#14131F]/5">
                            {studentsRosterList.map((student) => (
                              <tr
                                key={student.id}
                                onClick={() => handleOpenStudentDetail(student)}
                                className="hover:bg-[#FAFAF8] transition-colors cursor-pointer group"
                              >
                                {/* Candidate Name & Degree */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] font-display font-bold text-xs flex items-center justify-center shrink-0">
                                      {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-[#14131F] truncate group-hover:text-[#4338CA] transition-colors">
                                        {student.name}
                                      </p>
                                      <p className="text-[11px] text-[#14131F]/50 truncate">
                                        {student.degree} • {student.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Target Role */}
                                <td className="py-3.5 px-3 font-medium text-[#14131F]/80">
                                  {student.targetRole}
                                </td>

                                {/* Readiness Score (Prominent, colored by status) */}
                                <td className="py-3.5 px-3 text-center">
                                  {student.readinessScore !== null ? (
                                    <span
                                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                                        student.status === 'Placement Ready'
                                          ? 'bg-[#A3E635]/25 text-[#14131F] border-[#A3E635]/50'
                                          : student.status === 'Developing'
                                          ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                          : 'bg-[#FB7185]/20 text-[#E11D48] border-[#FB7185]/40'
                                      }`}
                                    >
                                      {student.readinessScore}%
                                    </span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic text-[11px]">—</span>
                                  )}
                                </td>

                                {/* ATS Score */}
                                <td className="py-3.5 px-3 text-center font-medium text-[#14131F]">
                                  {student.atsScore !== null ? (
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[11px]">
                                      {student.atsScore}%
                                    </span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                {/* Mock Interview Score */}
                                <td className="py-3.5 px-3 text-center font-medium text-[#14131F]">
                                  {student.mockScore !== null ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[11px]">
                                      <span>{student.mockScore}%</span>
                                      <span className="text-[10px] text-[#14131F]/40">
                                        ({student.mockCount})
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                {/* Aptitude Score */}
                                <td className="py-3.5 px-3 text-center font-medium text-[#14131F]">
                                  {student.aptitudeScore !== null ? (
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[11px]">
                                      {student.aptitudeScore}%
                                    </span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                {/* Portfolio Score */}
                                <td className="py-3.5 px-3 text-center font-medium text-[#14131F]">
                                  {student.portfolioScore !== null ? (
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[11px]">
                                      {student.portfolioScore}%
                                    </span>
                                  ) : (
                                    <span className="text-[#14131F]/30 italic">—</span>
                                  )}
                                </td>

                                {/* DSA Solved */}
                                <td className="py-3.5 px-3 text-center font-medium text-[#14131F]">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[11px]">
                                    {student.dsaSolved} solved
                                  </span>
                                </td>

                                {/* Status Badge (Lime / Indigo / Coral) */}
                                <td className="py-3.5 px-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                      student.status === 'Placement Ready'
                                        ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                                        : student.status === 'Developing'
                                        ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                        : 'bg-[#FB7185]/15 text-[#E11D48] border-[#FB7185]/35'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        student.status === 'Placement Ready'
                                          ? 'bg-[#65A30D]'
                                          : student.status === 'Developing'
                                          ? 'bg-[#4338CA]'
                                          : 'bg-[#E11D48]'
                                      }`}
                                    />
                                    {student.status}
                                  </span>
                                </td>

                                {/* Action Button */}
                                <td className="py-3.5 px-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenStudentDetail(student);
                                    }}
                                    icon={<Eye className="w-3.5 h-3.5" />}
                                    className="text-xs text-[#4338CA] hover:bg-[#4338CA]/10"
                                  >
                                    Inspect Dossier
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : activeTab === 'placements' ? (
            /* PLACEMENTS & INTERNSHIPS OUTCOMES TAB */
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 text-left">
              {/* Top Header & Context Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#14131F]/8">
                <div>
                  <SectionHeading
                    title="Placements & Internships Outcomes"
                    subtitle="Real-time verified recruitment metrics, company hiring conversions, and student offer records for this institution."
                    badge={<VerifiedSeal iconType="shield" label="Campus Placement Registry" />}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {placementsData !== null && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        placementsData.totalOffers > 0
                          ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                          : 'bg-[#14131F]/5 text-[#14131F]/70 border-[#14131F]/10'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-[#4338CA]" />
                      <span>
                        {placementsData.totalOffers}{' '}
                        {placementsData.totalOffers === 1 ? 'Confirmed Offer' : 'Confirmed Offers'}
                      </span>
                    </span>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchPlacements(true)}
                    disabled={loadingPlacements || isRefreshing}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          loadingPlacements || isRefreshing ? 'animate-spin' : ''
                        }`}
                      />
                    }
                    className="text-xs"
                  >
                    Refresh Placements
                  </Button>
                </div>
              </div>

              {/* Specific Profile Missing College Error Banner */}
              {placementsError &&
              (placementsError.toLowerCase().includes('college') ||
                placementsError.toLowerCase().includes('profile')) ? (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <School className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#14131F]">
                        College / University Name Required
                      </h4>
                      <p className="mt-1 text-xs text-[#14131F]/80 leading-relaxed max-w-xl">
                        {placementsError}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchPlacements(false)}
                    className="text-xs shrink-0 self-start sm:self-center"
                  >
                    Retry Placements
                  </Button>
                </div>
              ) : placementsError ? (
                /* General Error Banner */
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#14131F] rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-[#E11D48]">
                        Failed to Load Placement Records
                      </h4>
                      <p className="mt-0.5 text-xs text-[#14131F]/80 leading-relaxed">
                        {placementsError}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchPlacements(false)}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              ) : null}

              {/* Loading State */}
              {loadingPlacements && !placementsData ? (
                <div className="p-16 text-center space-y-3 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                  <p className="text-sm font-medium text-[#14131F]/80">
                    Loading placement & internship outcome metrics...
                  </p>
                  <p className="text-xs text-[#14131F]/50">
                    Synchronizing verified recruitment records for {institutionName}
                  </p>
                </div>
              ) : placementsData &&
                placementsData.totalApplications === 0 &&
                placementsData.totalOffers === 0 ? (
                /* Purely Factual Empty State (No Fabricated Numbers) */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-xs animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto shadow-xs">
                    <Briefcase className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 text-xs font-semibold">
                      <span>No Student Applications or Offers Recorded Yet</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-display text-[#14131F]">
                      No Placement or Internship Data Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed max-w-md mx-auto">
                      Placement outcomes, verified offers, and company hiring metrics for {institutionName} will populate automatically as your students apply for jobs or internships and receive confirmed offers.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#14131F]/8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchPlacements(true)}
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                      className="text-xs w-full sm:w-auto"
                    >
                      Check for New Activity
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('students')}
                      icon={<Users className="w-3.5 h-3.5" />}
                      className="text-xs w-full sm:w-auto text-[#4338CA] hover:bg-[#4338CA]/10"
                    >
                      View Student Roster
                    </Button>
                  </div>
                </div>
              ) : placementsData ? (
                /* Active Placement Outcomes Dashboard */
                <div className="space-y-6 sm:space-y-8">
                  {/* Headline Stat Card: Placement Rate */}
                  <div
                    className={`bg-white rounded-2xl p-6 sm:p-8 border shadow-xs transition-all ${
                      placementsData.placementRate >= 60
                        ? 'border-[#A3E635]/60 ring-1 ring-[#A3E635]/30'
                        : 'border-[#14131F]/8'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#14131F]/50">
                            Institutional Placement Conversion
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              placementsData.placementRate >= 60
                                ? 'bg-[#A3E635]/25 text-[#14131F] border-[#A3E635]/40'
                                : placementsData.placementRate > 0
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-[#14131F]/5 text-[#14131F]/70 border-[#14131F]/10'
                            }`}
                          >
                            {placementsData.placementRate >= 60 && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            )}
                            <span>
                              {placementsData.placementRate >= 60
                                ? 'Healthy Cohort Conversion'
                                : placementsData.placementRate > 0
                                ? 'Active Recruitment Cycle'
                                : 'Recruitment Cycle Starting'}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl sm:text-6xl font-bold font-display text-[#14131F] tracking-tight">
                            {placementsData.placementRate}%
                          </span>
                          <span className="text-sm font-medium text-[#14131F]/70">
                            Placement Rate
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed max-w-xl">
                          Percentage of unique students in {institutionName} who have received at least one confirmed job or internship offer.
                        </p>
                      </div>

                      {/* Right Sub-metrics Card inside Headline */}
                      <div className="lg:w-80 bg-[#FAFAF8] rounded-xl p-4 sm:p-5 border border-[#14131F]/6 space-y-3 shrink-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#14131F]">Students Placed</span>
                          <span className="font-bold text-[#4338CA]">
                            {placementsData.totalStudentsPlaced} / {placementsData.totalStudents}
                          </span>
                        </div>

                        {/* Visual Progress Track */}
                        <div className="w-full h-2.5 bg-[#14131F]/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#A3E635] rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(placementsData.placementRate, 2))}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#14131F]/60 pt-1">
                          <span>Verified Unique Placements</span>
                          <span>
                            {placementsData.totalStudents > 0
                              ? `${placementsData.totalStudents - placementsData.totalStudentsPlaced} In Process`
                              : 'Cohort Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supporting KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* KPI 1: Total Offers */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Total Offers Extended
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#A3E635]/20 text-[#14131F] flex items-center justify-center">
                          <Award className="w-4 h-4 text-emerald-800" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                          {placementsData.totalOffers}
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 mt-0.5">
                          Across all hiring partners
                        </p>
                      </div>
                    </div>

                    {/* KPI 2: Total Students Placed */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Unique Students Placed
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-[#4338CA]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                          {placementsData.totalStudentsPlaced}
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 mt-0.5">
                          Out of {placementsData.totalStudents} enrolled students
                        </p>
                      </div>
                    </div>

                    {/* KPI 3: Total Applications */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Total Applications
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#14131F]/5 text-[#14131F]/70 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-[#14131F]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                          {placementsData.totalApplications}
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 mt-0.5">
                          Tracked recruitment submissions
                        </p>
                      </div>
                    </div>

                    {/* KPI 4: Job vs Internship Split */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Opportunity Type Split
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-[#4338CA]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold font-display text-[#14131F]">
                            {placementsData.byType.job || 0}
                          </span>
                          <span className="text-xs text-[#14131F]/50">Jobs</span>
                          <span className="text-xs text-[#14131F]/30">•</span>
                          <span className="text-xl font-bold font-display text-[#14131F]">
                            {placementsData.byType.internship || 0}
                          </span>
                          <span className="text-xs text-[#14131F]/50">Internships</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#4338CA]/10 text-[#4338CA]">
                            {placementsData.totalApplications > 0
                              ? `${Math.round(
                                  ((placementsData.byType.job || 0) /
                                    Math.max(1, placementsData.totalApplications)) *
                                    100
                                )}% Full-Time`
                              : '0% Full-Time'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {placementsData.totalApplications > 0
                              ? `${Math.round(
                                  ((placementsData.byType.internship || 0) /
                                    Math.max(1, placementsData.totalApplications)) *
                                    100
                                )}% Internship`
                              : '0% Internship'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Layout: Company Hiring Breakdown & Recent Placements Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    {/* Left Column (7 cols): Company Hiring Breakdown */}
                    <div className="lg:col-span-7 bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-[#14131F]/6">
                        <div>
                          <h3 className="font-bold font-display text-base text-[#14131F]">
                            Top Recruiting Partners
                          </h3>
                          <p className="text-xs text-[#14131F]/60">
                            Ranked by confirmed offers extended to students of {institutionName}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#14131F]/5 text-[#14131F]/70">
                          {placementsData.byCompany.length}{' '}
                          {placementsData.byCompany.length === 1 ? 'Company' : 'Companies'}
                        </span>
                      </div>

                      {placementsData.byCompany.length > 0 ? (
                        <div className="space-y-2.5">
                          {placementsData.byCompany.map((comp, idx) => {
                            const conversionPct =
                              comp.applicantCount > 0
                                ? Math.round((comp.offerCount / comp.applicantCount) * 100)
                                : 0;

                            return (
                              <div
                                key={comp.company || idx}
                                className="p-3.5 sm:p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-white"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                      idx === 0
                                        ? 'bg-[#A3E635]/30 text-[#14131F] border border-[#A3E635]/40'
                                        : idx === 1
                                        ? 'bg-[#4338CA]/10 text-[#4338CA]'
                                        : 'bg-[#14131F]/5 text-[#14131F]/60'
                                    }`}
                                  >
                                    #{idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-[#14131F] truncate">
                                      {comp.company}
                                    </h4>
                                    <p className="text-xs text-[#14131F]/60">
                                      {comp.applicantCount}{' '}
                                      {comp.applicantCount === 1 ? 'applicant' : 'applicants'} from campus
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                                  <div className="text-right">
                                    <div className="text-xs font-semibold text-[#14131F]">
                                      {conversionPct}% Conversion
                                    </div>
                                    <div className="w-16 h-1.5 bg-[#14131F]/8 rounded-full overflow-hidden mt-1">
                                      <div
                                        className="h-full bg-[#4338CA] rounded-full"
                                        style={{
                                          width: `${Math.min(100, Math.max(conversionPct, 4))}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                                      comp.offerCount > 0
                                        ? 'bg-[#A3E635]/25 text-[#14131F] border-[#A3E635]/40'
                                        : 'bg-[#14131F]/5 text-[#14131F]/50 border-[#14131F]/10'
                                    }`}
                                  >
                                    {comp.offerCount > 0 && (
                                      <Check className="w-3 h-3 text-emerald-800" />
                                    )}
                                    <span>
                                      {comp.offerCount} {comp.offerCount === 1 ? 'Offer' : 'Offers'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-[#14131F]/50 italic bg-[#FAFAF8] rounded-xl border border-[#14131F]/6">
                          No company-level application records found.
                        </div>
                      )}
                    </div>

                    {/* Right Column (5 cols): Recent Placements Feed */}
                    <div className="lg:col-span-5 bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-[#14131F]/6">
                        <div>
                          <h3 className="font-bold font-display text-base text-[#14131F]">
                            Recent Offer Confirmations
                          </h3>
                          <p className="text-xs text-[#14131F]/60">
                            Verified student selections in chronological order
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#4338CA]/10 text-[#4338CA]">
                          {placementsData.recentPlacements.length} Recent
                        </span>
                      </div>

                      {placementsData.recentPlacements.length > 0 ? (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                          {placementsData.recentPlacements.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-2.5 transition-colors hover:bg-white"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-[#14131F] truncate">
                                    {item.studentName}
                                  </h4>
                                  <p className="text-[11px] text-[#14131F]/60 truncate">
                                    {item.studentDegree} • {item.studentEmail}
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40 shrink-0">
                                  <Check className="w-3 h-3 text-emerald-800" />
                                  <span>Offer</span>
                                </span>
                              </div>

                              <div className="pt-2 border-t border-[#14131F]/6 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Building2 className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                                  <span className="font-semibold text-[#14131F] truncate">
                                    {item.company}
                                  </span>
                                  <span className="text-[#14131F]/30">•</span>
                                  <span className="text-[#14131F]/70 truncate">{item.role}</span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-[#14131F]/50">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                      item.type?.toLowerCase() === 'internship'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                    }`}
                                  >
                                    {item.type || 'Job'}
                                  </span>
                                  <span>{formatExperienceDate(item.date)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-[#14131F]/50 italic bg-[#FAFAF8] rounded-xl border border-[#14131F]/6">
                          No confirmed student offers recorded in this cycle yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : activeTab === 'companies' ? (
            /* COMPANIES & RECRUITERS TAB */
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 text-left">
              {/* Top Header & Context Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#14131F]/8">
                <div>
                  <SectionHeading
                    title="Companies & Corporate Recruiters"
                    subtitle="Enterprise hiring partners, campus recruitment volume, verified student applicants, and direct recruiter contacts."
                    badge={<VerifiedSeal iconType="shield" label="Corporate Engagement Registry" />}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {companiesData !== null && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        companiesData.totalCompanies > 0
                          ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                          : 'bg-[#14131F]/5 text-[#14131F]/70 border-[#14131F]/10'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#4338CA]" />
                      <span>
                        {companiesData.totalCompanies}{' '}
                        {companiesData.totalCompanies === 1 ? 'Engaged Partner' : 'Engaged Partners'}
                      </span>
                    </span>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchCompanies(true)}
                    disabled={loadingCompanies || isRefreshing}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          loadingCompanies || isRefreshing ? 'animate-spin' : ''
                        }`}
                      />
                    }
                    className="text-xs"
                  >
                    Refresh Directory
                  </Button>
                </div>
              </div>

              {/* Specific Profile Missing College Error Banner */}
              {companiesError &&
              (companiesError.toLowerCase().includes('college') ||
                companiesError.toLowerCase().includes('profile')) ? (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <School className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#14131F]">
                        College / University Name Required
                      </h4>
                      <p className="mt-1 text-xs text-[#14131F]/80 leading-relaxed max-w-xl">
                        {companiesError}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchCompanies(false)}
                    className="text-xs shrink-0 self-start sm:self-center"
                  >
                    Retry Loading
                  </Button>
                </div>
              ) : companiesError ? (
                /* General Error Banner */
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#14131F] rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-[#E11D48]">
                        Failed to Load Corporate Directory
                      </h4>
                      <p className="mt-0.5 text-xs text-[#14131F]/80 leading-relaxed">
                        {companiesError}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchCompanies(false)}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              ) : null}

              {/* Loading State */}
              {loadingCompanies && !companiesData ? (
                <div className="p-16 text-center space-y-3 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                  <p className="text-sm font-medium text-[#14131F]/80">
                    Loading corporate engagement directory...
                  </p>
                  <p className="text-xs text-[#14131F]/50">
                    Synchronizing recruiting partners and talent leads for {institutionName}
                  </p>
                </div>
              ) : companiesData && companiesData.totalCompanies === 0 ? (
                /* Purely Factual Empty State (No Fabricated Numbers) */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-xs animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto shadow-xs">
                    <Building2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 text-xs font-semibold">
                      <span>No Corporate Engagements Recorded Yet</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-display text-[#14131F]">
                      No Companies or Recruiters Active Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed max-w-md mx-auto">
                      Hiring partners, company conversion metrics, and direct recruiter contacts for {institutionName} will populate automatically as students submit applications or connect with employers.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#14131F]/8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchCompanies(true)}
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                      className="text-xs w-full sm:w-auto"
                    >
                      Check for New Activity
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('students')}
                      icon={<Users className="w-3.5 h-3.5" />}
                      className="text-xs w-full sm:w-auto text-[#4338CA] hover:bg-[#4338CA]/10"
                    >
                      View Student Cohort
                    </Button>
                  </div>
                </div>
              ) : companiesData ? (
                /* Active Companies & Recruiters View */
                <div className="space-y-6 sm:space-y-8">
                  {/* Top KPI Metric Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* KPI 1: Total Companies */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Engaged Companies
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                          {companiesData.totalCompanies}
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 mt-0.5">
                          Partners with student applications
                        </p>
                      </div>
                    </div>

                    {/* KPI 2: Total Applicants */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Unique Applicants
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#14131F]/5 text-[#14131F]/70 flex items-center justify-center">
                          <Users className="w-4 h-4 text-[#14131F]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                          {companiesData.totalApplicants}
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 mt-0.5">
                          Across all campus recruitment drives
                        </p>
                      </div>
                    </div>

                    {/* KPI 3: Total Offers */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Offers Extended
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#A3E635]/20 text-[#14131F] flex items-center justify-center">
                          <Award className="w-4 h-4 text-emerald-800" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                          {companiesData.totalOffers}
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 mt-0.5">
                          Confirmed student selections
                        </p>
                      </div>
                    </div>

                    {/* KPI 4: Recruiter Links */}
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#14131F]/60">
                          Recruiter Contacts
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-[#4338CA]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold font-display text-[#14131F]">
                          {linkedRecruitersCount}{' '}
                          <span className="text-sm font-normal text-[#14131F]/50">
                            / {companiesData.totalCompanies}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 mt-0.5">
                          Direct corporate talent leads
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Search, Filter & Sort Toolbar */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          placeholder="Search by company name, applied role, or recruiter..."
                          className="w-full pl-10 pr-9 py-2.5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl text-xs sm:text-sm text-[#14131F] placeholder:text-[#14131F]/40 focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all"
                        />
                        {companySearch && (
                          <button
                            type="button"
                            onClick={() => setCompanySearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#14131F]/40 hover:text-[#14131F] transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Recruiter Profile Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCompanyRecruiterFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            companyRecruiterFilter === 'all'
                              ? 'bg-white text-[#14131F] shadow-xs'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          All ({companiesData.companies.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompanyRecruiterFilter('has_recruiter')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            companyRecruiterFilter === 'has_recruiter'
                              ? 'bg-white text-[#4338CA] shadow-xs'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          Linked Recruiters ({linkedRecruitersCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompanyRecruiterFilter('no_recruiter')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            companyRecruiterFilter === 'no_recruiter'
                              ? 'bg-white text-[#14131F] shadow-xs'
                              : 'text-[#14131F]/60 hover:text-[#14131F]'
                          }`}
                        >
                          Unlinked ({companiesData.companies.length - linkedRecruitersCount})
                        </button>
                      </div>

                      {/* Sort Dropdown / Selector */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium text-[#14131F]/50 hidden sm:inline">
                          Sort:
                        </span>
                        <select
                          value={companySortBy}
                          onChange={(e) =>
                            setCompanySortBy(
                              e.target.value as 'applicants' | 'offers' | 'conversion' | 'name'
                            )
                          }
                          className="px-3 py-2 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl text-xs font-semibold text-[#14131F] focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] cursor-pointer"
                        >
                          <option value="applicants">Most Applicants</option>
                          <option value="offers">Most Offers</option>
                          <option value="conversion">Highest Conversion</option>
                          <option value="name">Company Name (A-Z)</option>
                        </select>
                      </div>
                    </div>

                    {/* Result count & active search tags */}
                    <div className="flex items-center justify-between text-xs text-[#14131F]/60 pt-1 border-t border-[#14131F]/6">
                      <span>
                        Showing {filteredCompanies.length} of {companiesData.companies.length} companies
                      </span>
                      {(companySearch || companyRecruiterFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompanySearch('');
                            setCompanyRecruiterFilter('all');
                          }}
                          className="text-[#4338CA] hover:underline font-semibold cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Companies List */}
                  {filteredCompanies.length > 0 ? (
                    <div className="space-y-4">
                      {filteredCompanies.map((comp, idx) => {
                        const hasOffers = comp.offerCount > 0;
                        const statusEntries = Object.entries(comp.statusBreakdown || {});

                        return (
                          <div
                            key={comp.company || idx}
                            className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-[#14131F]/15 transition-all shadow-xs"
                          >
                            {/* Company Card Header */}
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold text-lg font-display shrink-0 border border-[#4338CA]/15">
                                  {comp.company.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold font-display text-lg text-[#14131F] truncate">
                                      {comp.company}
                                    </h3>
                                    {idx === 0 && companySortBy === 'applicants' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40">
                                        #1 Most Applied
                                      </span>
                                    )}
                                  </div>

                                  {/* Roles chips */}
                                  {comp.roles && comp.roles.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                      <span className="text-[11px] text-[#14131F]/50">Roles:</span>
                                      {comp.roles.slice(0, 3).map((r, rIdx) => (
                                        <span
                                          key={rIdx}
                                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#14131F]/5 text-[#14131F]/75 border border-[#14131F]/8"
                                        >
                                          {r}
                                        </span>
                                      ))}
                                      {comp.roles.length > 3 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium text-[#14131F]/50">
                                          +{comp.roles.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-[#14131F]/50">Direct recruitment drive</p>
                                  )}
                                </div>
                              </div>

                              {/* Right Metrics Strip */}
                              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 self-start">
                                {/* Applicants Badge */}
                                <div className="px-3 py-1.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 flex items-center gap-2 text-xs">
                                  <Users className="w-3.5 h-3.5 text-[#4338CA]" />
                                  <span className="font-semibold text-[#14131F]">
                                    {comp.applicantCount}
                                  </span>
                                  <span className="text-[#14131F]/50">
                                    {comp.applicantCount === 1 ? 'applicant' : 'applicants'}
                                  </span>
                                </div>

                                {/* Offers Badge */}
                                <div
                                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                                    hasOffers
                                      ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                                      : 'bg-[#FAFAF8] text-[#14131F]/60 border-[#14131F]/8'
                                  }`}
                                >
                                  <Award
                                    className={`w-3.5 h-3.5 ${
                                      hasOffers ? 'text-emerald-800' : 'text-[#14131F]/40'
                                    }`}
                                  />
                                  <span>
                                    {comp.offerCount} {comp.offerCount === 1 ? 'Offer' : 'Offers'}
                                  </span>
                                </div>

                                {/* Conversion Rate Badge */}
                                <div className="px-3 py-1.5 rounded-xl bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 flex items-center gap-1.5 text-xs font-bold">
                                  <span>{comp.conversionRate}% Conversion</span>
                                </div>
                              </div>
                            </div>

                            {/* Application Status Breakdown Chips */}
                            {statusEntries.length > 0 && (
                              <div className="pt-2 border-t border-[#14131F]/6 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-[11px] font-semibold text-[#14131F]/50">
                                  Status Breakdown:
                                </span>
                                {statusEntries.map(([statusName, count]) => {
                                  const sLower = statusName.toLowerCase();
                                  const isOffer =
                                    sLower.includes('offer') || sLower.includes('accepted');
                                  const isRejected = sLower.includes('reject');
                                  const isInterview =
                                    sLower.includes('interview') || sLower.includes('shortlist');

                                  return (
                                    <span
                                      key={statusName}
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                                        isOffer
                                          ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/35'
                                          : isInterview
                                          ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                          : isRejected
                                          ? 'bg-[#FB7185]/15 text-[#E11D48] border-[#FB7185]/25'
                                          : 'bg-[#14131F]/5 text-[#14131F]/70 border-[#14131F]/10'
                                      }`}
                                    >
                                      <span className="font-bold">{count}</span>
                                      <span>{statusName}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Recruiter Contact Box */}
                            {comp.recruiter ? (
                              /* Linked Recruiter Info Card */
                              <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#14131F]/6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold text-sm shrink-0 border border-[#4338CA]/15">
                                    <UserCheck className="w-5 h-5 text-[#4338CA]" />
                                  </div>
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-bold text-sm text-[#14131F] truncate">
                                        {comp.recruiter.name}
                                      </h4>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                                        Corporate Recruiter
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#14131F]/70 truncate">
                                      {comp.recruiter.designation || 'Talent Acquisition & Campus Lead'}
                                      {comp.recruiter.department ? ` • ${comp.recruiter.department}` : ''}
                                    </p>
                                    <p className="text-[11px] text-[#14131F]/50 truncate">
                                      {comp.recruiter.email}
                                      {comp.recruiter.phone ? ` • ${comp.recruiter.phone}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                                  {comp.recruiter.email && (
                                    <a
                                      href={`mailto:${comp.recruiter.email}?subject=Campus%20Recruitment%20Inquiry%20-%20${encodeURIComponent(
                                        institutionName
                                      )}`}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#4338CA] text-white hover:bg-[#3730A3] transition-colors shadow-xs"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>Reach Out</span>
                                    </a>
                                  )}

                                  {comp.recruiter.linkedinUrl && (
                                    <a
                                      href={comp.recruiter.linkedinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#14131F]/10 text-[#14131F] hover:bg-[#14131F]/5 transition-colors"
                                      title="Open recruiter LinkedIn profile in new tab"
                                    >
                                      <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                                      <span>LinkedIn</span>
                                      <ExternalLink className="w-3 h-3 text-[#14131F]/40" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Clearly Unlinked Recruiter Notice */
                              <div className="bg-[#FAFAF8] rounded-xl p-3.5 sm:p-4 border border-dashed border-[#14131F]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-[#14131F]/5 text-[#14131F]/40 flex items-center justify-center shrink-0">
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-[#14131F]/80">
                                      No recruiter account linked yet
                                    </p>
                                    <p className="text-[11px] text-[#14131F]/50 truncate">
                                      Applications for {comp.company} were logged through student off-campus drives or direct job listings.
                                    </p>
                                  </div>
                                </div>

                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold bg-[#14131F]/5 text-[#14131F]/60 border border-[#14131F]/10 shrink-0 self-start sm:self-center">
                                  Unlinked Profile
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Search empty state */
                    <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 text-center space-y-3 shadow-xs">
                      <Search className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                      <h4 className="font-bold text-sm text-[#14131F]">
                        No matching companies found
                      </h4>
                      <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto">
                        No company records matched "{companySearch}" with the active filter.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCompanySearch('');
                          setCompanyRecruiterFilter('all');
                        }}
                        className="text-xs"
                      >
                        Reset Search Filters
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : activeTab === 'moderation' ? (
            /* INTERVIEW EXPERIENCE MODERATION TAB */
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 text-left">
              {/* Top Header & Context Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#14131F]/8">
                <div>
                  <SectionHeading
                    title="Interview Experience Moderation Queue"
                    subtitle="Review, audit, and approve student submissions for company recruitment rounds and technical questions before public release."
                    badge={<VerifiedSeal iconType="shield" label="Institutional Moderation Queue" />}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {pendingExperiences !== null && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        pendingExperiences.length > 0
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                      }`}
                    >
                      {pendingExperiences.length > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>
                            {pendingExperiences.length}{' '}
                            {pendingExperiences.length === 1 ? 'Submission' : 'Submissions'} Awaiting Review
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Moderation Queue Clear</span>
                        </>
                      )}
                    </span>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchPendingExperiences(true)}
                    disabled={loadingModeration || isRefreshing}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          loadingModeration || isRefreshing ? 'animate-spin' : ''
                        }`}
                      />
                    }
                    className="text-xs"
                  >
                    Refresh Queue
                  </Button>
                </div>
              </div>

              {/* Feedback Notifications (Approval in Lime, Rejection in Coral, Error in Red) */}
              {moderationFeedback && (
                <div
                  className={`rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-xs shadow-xs animate-in fade-in ${
                    moderationFeedback.type === 'approved'
                      ? 'bg-[#A3E635]/15 border border-[#A3E635]/40 text-[#14131F]'
                      : moderationFeedback.type === 'rejected'
                      ? 'bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#14131F]'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        moderationFeedback.type === 'approved'
                          ? 'bg-[#A3E635]/30 text-[#14131F]'
                          : moderationFeedback.type === 'rejected'
                          ? 'bg-[#FB7185]/30 text-[#E11D48]'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {moderationFeedback.type === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#E11D48]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#14131F]">
                        {moderationFeedback.type === 'approved'
                          ? 'Submission Approved & Published'
                          : moderationFeedback.type === 'rejected'
                          ? 'Submission Rejected with Feedback'
                          : 'Moderation Error'}
                      </h4>
                      <p className="mt-0.5 text-xs text-[#14131F]/80 leading-relaxed">
                        {moderationFeedback.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModerationFeedback(null)}
                    className="p-1 rounded-lg hover:bg-[#14131F]/5 text-[#14131F]/60 transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Moderation Error Banner */}
              {moderationError && (
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#14131F] rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-[#E11D48]">
                        Failed to Load Moderation Submissions
                      </h4>
                      <p className="mt-0.5 text-xs text-[#14131F]/80 leading-relaxed">
                        {moderationError}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchPendingExperiences(false)}
                    className="text-xs shrink-0"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {loadingModeration && !pendingExperiences ? (
                <div className="p-16 text-center space-y-3 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                  <p className="text-sm font-medium text-[#14131F]/80">
                    Loading pending interview submissions...
                  </p>
                  <p className="text-xs text-[#14131F]/50">
                    Synchronizing moderation queue for {institutionName}
                  </p>
                </div>
              ) : pendingExperiences && pendingExperiences.length === 0 ? (
                /* Genuinely Positive Empty State */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-xs animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-[#A3E635]/25 border border-[#A3E635]/40 text-[#14131F] flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                      <span>Queue Status: 100% Cleared</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-display text-[#14131F]">
                      No Pending Submissions
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed max-w-md mx-auto">
                      All interview experiences submitted by students from {institutionName} have been processed and verified. Approved experiences are live in the campus interview archive.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#14131F]/8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchPendingExperiences(true)}
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                      className="text-xs w-full sm:w-auto"
                    >
                      Check for New Submissions
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('students')}
                      icon={<Users className="w-3.5 h-3.5" />}
                      className="text-xs w-full sm:w-auto text-[#4338CA] hover:bg-[#4338CA]/10"
                    >
                      View Student Registry
                    </Button>
                  </div>
                </div>
              ) : pendingExperiences && pendingExperiences.length > 0 ? (
                /* Submissions Queue (Preserved Oldest-First FIFO Order) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#14131F]/60 px-1">
                    <span>
                      Displaying {pendingExperiences.length}{' '}
                      {pendingExperiences.length === 1 ? 'submission' : 'submissions'} in chronological order (oldest first)
                    </span>
                    <span className="font-medium text-[#4338CA]">
                      Priority: Oldest Pending Submissions First
                    </span>
                  </div>

                  <div className="space-y-4">
                    {pendingExperiences.map((exp, index) => {
                      const expId = getExpId(exp);
                      const isExpanded = !!expandedExpIds[expId];
                      const isProcessing = actionInProgressId === expId;
                      const questionsList = exp.questionsAsked || [];

                      return (
                        <div
                          key={expId || index}
                          className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs transition-shadow hover:shadow-sm"
                        >
                          {/* Queue Position & Badges Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#14131F]/6">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4338CA]/10 text-[#4338CA] text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>#{index + 1} in queue</span>
                              </span>
                              <span className="text-xs text-[#14131F]/50">
                                Submitted {formatExperienceDate(exp.createdAt)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status Badge */}
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Awaiting Review</span>
                              </span>

                              {/* Difficulty Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  exp.difficulty === 'Easy'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : exp.difficulty === 'Hard'
                                    ? 'bg-[#FB7185]/15 text-[#E11D48] border-[#FB7185]/35'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <span>Difficulty: {exp.difficulty || 'Medium'}</span>
                              </span>

                              {/* Outcome Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  exp.outcome === 'Selected'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : exp.outcome === 'Rejected'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-[#14131F]/5 text-[#14131F]/70 border-[#14131F]/10'
                                }`}
                              >
                                {exp.outcome === 'Selected' && (
                                  <Check className="w-3 h-3 text-emerald-700" />
                                )}
                                <span>Outcome: {exp.outcome || 'Awaiting Result'}</span>
                              </span>
                            </div>
                          </div>

                          {/* Student & Candidate Profile Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] font-display font-bold text-base flex items-center justify-center shrink-0">
                                {exp.studentName ? exp.studentName.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold font-display text-base text-[#14131F] truncate">
                                    {exp.studentName || 'Student Contributor'}
                                  </h4>
                                </div>
                                <p className="text-xs text-[#14131F]/60 truncate">
                                  {exp.studentDegree || 'Degree Program'} • Target Role:{' '}
                                  <span className="font-medium text-[#14131F]/80">
                                    {exp.studentTargetRole || 'Technical Role'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="text-xs text-[#14131F]/60 sm:text-right">
                              <p className="truncate">{exp.studentEmail || 'student@campus.edu'}</p>
                              <p className="truncate font-medium text-[#14131F]/70">
                                {exp.studentCollege || institutionName}
                              </p>
                            </div>
                          </div>

                          {/* Company, Role & Content Preview Container */}
                          <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#14131F]/6 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#14131F]/6">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white border border-[#14131F]/8 flex items-center justify-center text-[#4338CA] shrink-0">
                                  <Building2 className="w-4 h-4 text-[#4338CA]" />
                                </div>
                                <div>
                                  <span className="font-bold text-sm text-[#14131F]">
                                    {exp.company}
                                  </span>
                                  <span className="mx-1.5 text-[#14131F]/30">•</span>
                                  <span className="text-xs text-[#14131F]/80 font-medium">
                                    {exp.role}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-[#14131F]/60">
                                <Calendar className="w-3.5 h-3.5 text-[#14131F]/40" />
                                <span>Interview Date: {formatExperienceDate(exp.interviewDate)}</span>
                              </div>
                            </div>

                            {/* Interview Rounds Description */}
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-[#14131F]">
                                Rounds Breakdown & Experience
                              </h5>
                              <p
                                className={`text-xs text-[#14131F]/80 leading-relaxed ${
                                  isExpanded ? 'whitespace-pre-line' : 'line-clamp-3'
                                }`}
                              >
                                {exp.roundsDescription || 'No rounds description provided.'}
                              </p>
                            </div>

                            {/* Questions Section */}
                            {isExpanded ? (
                              <div className="space-y-2 pt-2 border-t border-[#14131F]/6">
                                <div className="text-xs font-semibold text-[#14131F] flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-[#4338CA]" />
                                  <span>Questions Asked ({questionsList.length})</span>
                                </div>

                                {questionsList.length > 0 ? (
                                  <div className="space-y-2">
                                    {questionsList.map((q, qIdx) => {
                                      const qText =
                                        typeof q === 'string'
                                          ? q
                                          : q.text || (q as any).question || '';
                                      const qType =
                                        typeof q === 'object' && q.type === 'coding'
                                          ? 'coding'
                                          : 'theory';

                                      return (
                                        <div
                                          key={qIdx}
                                          className="p-3 bg-white rounded-xl border border-[#14131F]/8 text-xs flex items-start gap-2.5"
                                        >
                                          <span className="font-semibold text-[#4338CA] shrink-0 mt-0.5">
                                            Q{qIdx + 1}.
                                          </span>
                                          <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-[#14131F] font-medium leading-relaxed">
                                              {qText}
                                            </p>
                                            <div>
                                              <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                                  qType === 'coding'
                                                    ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                                    : 'bg-[#14131F]/5 text-[#14131F]/70 border-[#14131F]/10'
                                                }`}
                                              >
                                                {qType === 'coding' ? (
                                                  <>
                                                    <Code className="w-3 h-3" />
                                                    <span>Coding Problem</span>
                                                  </>
                                                ) : (
                                                  <span>Conceptual / HR</span>
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-white rounded-xl border border-[#14131F]/8 text-xs text-[#14131F]/60 italic">
                                    No itemized questions included in this submission.
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-[#14131F]/60 pt-1">
                                <MessageSquare className="w-3.5 h-3.5 text-[#4338CA]" />
                                <span>
                                  {questionsList.length}{' '}
                                  {questionsList.length === 1 ? 'question' : 'questions'} itemized
                                </span>
                              </div>
                            )}

                            {/* Expand / Collapse Details Button */}
                            <div className="pt-1 flex items-center justify-start">
                              <button
                                type="button"
                                onClick={() => toggleExpandExperience(expId)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:text-[#312E81] transition-colors cursor-pointer py-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    <span>Collapse Details</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    <span>
                                      Expand Full Submission & Technical Questions ({questionsList.length})
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Action Controls Footer */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#14131F]/8">
                            <span className="text-[11px] text-[#14131F]/50">
                              Approved experiences will be visible immediately in the campus student interview repository.
                            </span>

                            <div className="flex items-center justify-end gap-2.5 shrink-0">
                              {/* Reject Action: Opens modal to collect mandatory reviewNote */}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenRejectModal(exp)}
                                disabled={isProcessing}
                                icon={<X className="w-3.5 h-3.5 text-[#E11D48]" />}
                                className="text-xs text-[#E11D48] hover:bg-[#FB7185]/10 border-[#FB7185]/35 hover:border-[#FB7185]/50"
                              >
                                Reject Submission...
                              </Button>

                              {/* Approve Action: Calls POST /review with decision: 'approved' */}
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApproveExperience(exp)}
                                disabled={isProcessing}
                                icon={
                                  isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )
                                }
                                className="text-xs bg-[#15803D] hover:bg-[#166534] border-transparent text-white shadow-xs"
                              >
                                {isProcessing ? 'Approving...' : 'Approve Submission'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : activeTab === 'portfolio_verification' ? (
            /* EVIDENCE-BASED PORTFOLIO VERIFICATION TAB */
            <div className="space-y-6 animate-in fade-in duration-150 text-left">
              <PortfolioVerificationQueue />
            </div>
          ) : activeTab === 'analytics' ? (
            /* INSTITUTIONAL BATCH ANALYTICS & SKILL GAP INTELLIGENCE TAB */
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 text-left">
              {/* Top Header & Context Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#14131F]/8">
                <div>
                  <SectionHeading
                    title="Institutional Batch Analytics & Skill Gap Intelligence"
                    subtitle="Synthesized cohort diagnostics, cross-referenced competency deficits, readiness funnel distribution, and corporate recruiting trends."
                    badge={<VerifiedSeal iconType="shield" label="Data-Driven Decision Support" />}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {analytics !== null && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                      <GraduationCap className="w-3.5 h-3.5 text-[#4338CA]" />
                      <span>{analytics.summary.totalStudents} Registered Students</span>
                    </span>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchAnalytics(true)}
                    disabled={loading || isRefreshing}
                    icon={
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          loading || isRefreshing ? 'animate-spin' : ''
                        }`}
                      />
                    }
                    className="text-xs"
                  >
                    Refresh Analytics
                  </Button>
                </div>
              </div>

              {/* Loading State Skeleton */}
              {loading && !analytics ? (
                <div className="space-y-6 animate-pulse">
                  {/* Top Funnel Skeleton */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
                    <div className="h-6 w-56 bg-[#14131F]/10 rounded-lg" />
                    <div className="h-4 w-96 bg-[#14131F]/5 rounded-md" />
                    <div className="h-6 bg-[#14131F]/5 rounded-xl mt-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="h-24 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6" />
                      <div className="h-24 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6" />
                      <div className="h-24 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6" />
                    </div>
                  </div>

                  {/* Skill Gap & Trends Skeletons */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                      <div className="h-5 w-48 bg-[#14131F]/10 rounded-md" />
                      <div className="space-y-3 pt-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="h-4 w-32 bg-[#14131F]/8 rounded-sm" />
                            <div className="h-3 bg-[#14131F]/5 rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="lg:col-span-5 bg-white border border-[#14131F]/8 rounded-2xl p-6 space-y-4 shadow-xs">
                      <div className="h-5 w-44 bg-[#14131F]/10 rounded-md" />
                      <div className="h-32 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6" />
                      <div className="h-32 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6" />
                    </div>
                  </div>
                </div>
              ) : error && !analytics ? (
                /* Error State with Retry */
                <div className="bg-[#FB7185]/15 border border-[#FB7185]/35 text-[#14131F] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FB7185]/20 text-[#E11D48] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-[#E11D48]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#E11D48]">
                        Failed to Load Cohort Analytics
                      </h4>
                      <p className="mt-1 text-xs text-[#14131F]/80 leading-relaxed max-w-xl">
                        {error}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchAnalytics(false)}
                    className="text-xs shrink-0 self-start sm:self-center"
                  >
                    Retry Connection
                  </Button>
                </div>
              ) : analytics && analytics.summary.totalStudents === 0 ? (
                /* Empty State (No Students Registered) */
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-10 text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold font-display text-[#14131F]">
                      No Registered Students in Cohort
                    </h3>
                    <p className="text-xs text-[#14131F]/65 max-w-md mx-auto">
                      Cohort analytics, institutional skill diagnostics, and readiness funnels will calibrate automatically once students register and begin taking AI mock interviews and aptitude tests.
                    </p>
                  </div>
                </div>
              ) : analytics ? (
                <div className="space-y-6 sm:space-y-8">
                  {/* 1. READINESS FUNNEL (TOP EXECUTIVE SYNTHESIS) */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#14131F]/6">
                      <div>
                        <h3 className="font-bold font-display text-base sm:text-lg text-[#14131F] flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#4338CA]" />
                          Cohort Readiness Funnel
                        </h3>
                        <p className="text-xs text-[#14131F]/60 mt-0.5">
                          Cross-cohort distribution across Placement Ready, Developing, and Needs Support tiers
                        </p>
                      </div>

                      {readinessFunnel && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#14131F]/70">
                          <span>{readinessFunnel.total} Students Evaluated</span>
                        </div>
                      )}
                    </div>

                    {/* Horizontal 3-Segment Stacked Funnel Bar */}
                    {readinessFunnel && (
                      <div className="space-y-3">
                        <div className="w-full h-5 sm:h-6 rounded-xl bg-[#14131F]/5 p-0.5 flex gap-1 overflow-hidden border border-[#14131F]/8">
                          {/* Segment 1: Placement Ready (Lime) */}
                          {readinessFunnel.placementReady.calcPct > 0 && (
                            <div
                              style={{ width: `${Math.max(readinessFunnel.placementReady.calcPct, 4)}%` }}
                              className="h-full rounded-lg bg-[#A3E635] transition-all duration-300 flex items-center justify-center group relative cursor-default"
                              title={`Placement Ready: ${analytics.readinessDistribution.placementReady.count} students (${readinessFunnel.placementReady.calcPct}%)`}
                            >
                              {readinessFunnel.placementReady.calcPct >= 12 && (
                                <span className="text-[11px] font-bold text-[#14131F] px-1 truncate">
                                  {readinessFunnel.placementReady.calcPct}% Ready
                                </span>
                              )}
                            </div>
                          )}

                          {/* Segment 2: Developing (Indigo) */}
                          {readinessFunnel.developing.calcPct > 0 && (
                            <div
                              style={{ width: `${Math.max(readinessFunnel.developing.calcPct, 4)}%` }}
                              className="h-full rounded-lg bg-[#4338CA] transition-all duration-300 flex items-center justify-center group relative cursor-default"
                              title={`Developing: ${analytics.readinessDistribution.developing.count} students (${readinessFunnel.developing.calcPct}%)`}
                            >
                              {readinessFunnel.developing.calcPct >= 12 && (
                                <span className="text-[11px] font-bold text-white px-1 truncate">
                                  {readinessFunnel.developing.calcPct}% Dev
                                </span>
                              )}
                            </div>
                          )}

                          {/* Segment 3: Needs Support (Coral) */}
                          {readinessFunnel.needsSupport.calcPct > 0 && (
                            <div
                              style={{ width: `${Math.max(readinessFunnel.needsSupport.calcPct, 4)}%` }}
                              className="h-full rounded-lg bg-[#FB7185] transition-all duration-300 flex items-center justify-center group relative cursor-default"
                              title={`Needs Support: ${analytics.readinessDistribution.needsSupport.count} students (${readinessFunnel.needsSupport.calcPct}%)`}
                            >
                              {readinessFunnel.needsSupport.calcPct >= 12 && (
                                <span className="text-[11px] font-bold text-white px-1 truncate">
                                  {readinessFunnel.needsSupport.calcPct}% Support
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Three-Pillar Breakdown Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* Tier 1: Placement Ready (Lime) */}
                          <div
                            onClick={() => {
                              setActiveTab('students');
                              setStudentsStatusFilter('Placement Ready');
                            }}
                            className="p-3.5 sm:p-4 bg-[#A3E635]/5 rounded-xl border border-[#A3E635]/40 space-y-1.5 cursor-pointer hover:bg-[#A3E635]/10 transition-colors group"
                            title="Click to view Placement Ready students"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#65A30D]" />
                                <span className="text-xs font-bold text-[#14131F]">Placement Ready</span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40">
                                Score ≥ 70%
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2 pt-0.5">
                              <span className="text-2xl font-bold font-display text-[#14131F]">
                                {analytics.readinessDistribution.placementReady.count}
                              </span>
                              <span className="text-xs text-[#14131F]/60 font-medium">
                                ({readinessFunnel.placementReady.calcPct}% of cohort)
                              </span>
                            </div>
                            <p className="text-[11px] text-[#14131F]/60 leading-tight">
                              Verified interview poise, ATS qualified, and aptitude benchmarked.
                            </p>
                          </div>

                          {/* Tier 2: Developing (Indigo) */}
                          <div
                            onClick={() => {
                              setActiveTab('students');
                              setStudentsStatusFilter('Developing');
                            }}
                            className="p-3.5 sm:p-4 bg-[#4338CA]/5 rounded-xl border border-[#4338CA]/20 space-y-1.5 cursor-pointer hover:bg-[#4338CA]/10 transition-colors group"
                            title="Click to view Developing students"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#4338CA]" />
                                <span className="text-xs font-bold text-[#14131F]">Developing Tier</span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                                Score 40%–69%
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2 pt-0.5">
                              <span className="text-2xl font-bold font-display text-[#14131F]">
                                {analytics.readinessDistribution.developing.count}
                              </span>
                              <span className="text-xs text-[#14131F]/60 font-medium">
                                ({readinessFunnel.developing.calcPct}% of cohort)
                              </span>
                            </div>
                            <p className="text-[11px] text-[#14131F]/60 leading-tight">
                              Solid fundamentals; requires mock iterations and DSA problem depth.
                            </p>
                          </div>

                          {/* Tier 3: Needs Support (Coral) */}
                          <div
                            onClick={() => {
                              setActiveTab('students');
                              setStudentsStatusFilter('Needs Support');
                            }}
                            className="p-3.5 sm:p-4 bg-[#FB7185]/5 rounded-xl border border-[#FB7185]/30 space-y-1.5 cursor-pointer hover:bg-[#FB7185]/10 transition-colors group"
                            title="Click to view students needing support"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#FB7185]" />
                                <span className="text-xs font-bold text-[#14131F]">Needs Support</span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FB7185]/15 text-[#E11D48] border border-[#FB7185]/30">
                                Score &lt; 40% / No Data
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2 pt-0.5">
                              <span className="text-2xl font-bold font-display text-[#14131F]">
                                {analytics.readinessDistribution.needsSupport.count}
                              </span>
                              <span className="text-xs text-[#14131F]/60 font-medium">
                                ({readinessFunnel.needsSupport.calcPct}% of cohort)
                              </span>
                            </div>
                            <p className="text-[11px] text-[#14131F]/60 leading-tight">
                              Diagnostic gap; requires faculty intervention and targeted workshops.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. MAIN 2-COLUMN SECTION: SKILL GAP INTELLIGENCE & PLACEMENT SNAPSHOT */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (7 cols): Skill Gap Intelligence Bar Chart (Ranked Weakest-First) */}
                    <div className="lg:col-span-7 bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#14131F]/6">
                        <div>
                          <h3 className="font-bold font-display text-base text-[#14131F] flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#4338CA]" />
                            Skill Gap Intelligence &amp; Competencies
                          </h3>
                          <p className="text-xs text-[#14131F]/60 mt-0.5">
                            Institution-wide averages across mock interview and aptitude categories, ranked weakest-first
                          </p>
                        </div>

                        {analytics.weakAreasDiagnostic?.mostCommonWeakArea && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FB7185]/15 text-[#E11D48] border border-[#FB7185]/30 self-start sm:self-center">
                            <AlertCircle className="w-3.5 h-3.5 text-[#E11D48]" />
                            <span>Primary Deficit: {analytics.weakAreasDiagnostic.mostCommonWeakArea}</span>
                          </span>
                        )}
                      </div>

                      {/* Bar Chart Container */}
                      <div className="space-y-4">
                        {sortedSkillCategories.length > 0 ? (
                          sortedSkillCategories.map((cat) => {
                            const isNull = cat.score === null;
                            const score = cat.score ?? 0;
                            const isCoral = !isNull && score < 50;
                            const isIndigo = !isNull && score >= 50 && score < 70;
                            const isLime = !isNull && score >= 70;

                            const barWidth = isNull ? 0 : Math.max(8, Math.min(100, score));

                            return (
                              <div
                                key={cat.key}
                                className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 space-y-2 hover:bg-white transition-colors"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                        cat.module?.toLowerCase() === 'interview'
                                          ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                          : 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                                      }`}
                                    >
                                      {cat.module}
                                    </span>
                                    <span className="font-bold text-sm text-[#14131F] truncate">
                                      {cat.label}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {!isNull ? (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                          isCoral
                                            ? 'bg-[#FB7185]/15 text-[#E11D48] border-[#FB7185]/30'
                                            : isIndigo
                                            ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                            : 'bg-[#A3E635]/25 text-[#14131F] border-[#A3E635]/40'
                                        }`}
                                      >
                                        <span>{score}% Avg</span>
                                        <span className="text-[10px] font-normal opacity-75">
                                          ({isCoral ? `${100 - score}% Deficit` : isIndigo ? 'Developing' : 'Benchmark Met'})
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-xs text-[#14131F]/40 italic">
                                        Diagnostic Pending
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Custom Hand-Built CSS Bar */}
                                <div className="relative w-full h-3 rounded-full bg-[#14131F]/8 overflow-hidden">
                                  <div
                                    style={{ width: `${barWidth}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isCoral
                                        ? 'bg-[#FB7185]'
                                        : isIndigo
                                        ? 'bg-[#4338CA]'
                                        : isLime
                                        ? 'bg-[#65A30D]'
                                        : 'bg-transparent'
                                    }`}
                                  />
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-[#14131F]/50">
                                  <span>
                                    {isCoral
                                      ? 'Critical cohort skill bottleneck requiring structured remediation.'
                                      : isIndigo
                                      ? 'Acceptable baseline; polish needed for Tier-1 corporate cutoffs.'
                                      : isLime
                                      ? 'Cohort competitive advantage exceeding industry baseline.'
                                      : 'Assessment data will calibrate as students attempt sessions.'}
                                  </span>
                                  <span className="font-mono text-[10px] text-[#14131F]/40">
                                    {!isNull ? `${score}/100` : '—'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-6 text-center text-xs text-[#14131F]/50 italic bg-[#FAFAF8] rounded-xl">
                            No skill category diagnostics recorded yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column (5 cols): Placement Trend Snapshot */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Placement Split Card */}
                      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#14131F]/6">
                          <div>
                            <h3 className="font-bold font-display text-base text-[#14131F] flex items-center gap-2">
                              <Award className="w-4 h-4 text-[#4338CA]" />
                              Placement &amp; Internship Trend
                            </h3>
                            <p className="text-xs text-[#14131F]/60 mt-0.5">
                              Outcome synthesis cross-referenced with corporate drives
                            </p>
                          </div>
                          {placementTrendSummary && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40">
                              {placementTrendSummary.placementRate}% Rate
                            </span>
                          )}
                        </div>

                        {placementTrendSummary ? (
                          <div className="space-y-4">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6">
                                <span className="text-[11px] text-[#14131F]/60">Total Placed</span>
                                <div className="text-xl font-bold font-display text-[#14131F] mt-0.5">
                                  {placementTrendSummary.totalPlaced}{' '}
                                  <span className="text-xs font-normal text-[#14131F]/50">
                                    / {placementTrendSummary.totalEligible}
                                  </span>
                                </div>
                              </div>

                              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6">
                                <span className="text-[11px] text-[#14131F]/60">Confirmed Offers</span>
                                <div className="text-xl font-bold font-display text-[#14131F] mt-0.5">
                                  {placementTrendSummary.totalOffers}
                                </div>
                              </div>
                            </div>

                            {/* Job vs Internship Visual Split */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between text-xs font-semibold text-[#14131F]">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#4338CA]" />
                                  Full-Time Jobs ({placementTrendSummary.jobCount})
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
                                  Internships ({placementTrendSummary.internshipCount})
                                </span>
                              </div>

                              <div className="w-full h-3 rounded-full bg-[#14131F]/8 overflow-hidden flex gap-0.5">
                                <div
                                  style={{ width: `${Math.max(placementTrendSummary.jobPct, 4)}%` }}
                                  className="h-full bg-[#4338CA] transition-all duration-300"
                                  title={`Full-Time Jobs: ${placementTrendSummary.jobPct}%`}
                                />
                                <div
                                  style={{ width: `${Math.max(placementTrendSummary.internshipPct, 4)}%` }}
                                  className="h-full bg-[#A3E635] transition-all duration-300"
                                  title={`Internships: ${placementTrendSummary.internshipPct}%`}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-[#14131F]/50">
                                <span>{placementTrendSummary.jobPct}% Full-Time</span>
                                <span>{placementTrendSummary.internshipPct}% Internship</span>
                              </div>
                            </div>

                            {/* Top Hiring Corporate Partners */}
                            <div className="space-y-2.5 pt-2 border-t border-[#14131F]/6">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#14131F]">Top Hiring Corporate Partners</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('placements')}
                                  className="text-[11px] text-[#4338CA] font-medium hover:underline cursor-pointer"
                                >
                                  View All
                                </button>
                              </div>

                              {placementTrendSummary.topHiring.length > 0 ? (
                                <div className="space-y-2">
                                  {placementTrendSummary.topHiring.map((corp) => (
                                    <div
                                      key={corp.company}
                                      className="p-2.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 flex items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="min-w-0">
                                        <div className="font-bold text-[#14131F] truncate">
                                          {corp.company}
                                        </div>
                                        <div className="text-[11px] text-[#14131F]/50">
                                          {corp.applicantCount} applicants
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <div className="font-bold text-[#14131F]">
                                          {corp.offerCount} offers
                                        </div>
                                        <div className="text-[10px] text-emerald-700 font-semibold">
                                          {corp.applicantCount > 0 ? Math.round((corp.offerCount / corp.applicantCount) * 100) : 0}% conv.
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-4 text-center text-xs text-[#14131F]/50 italic bg-[#FAFAF8] rounded-xl">
                                  No corporate placement records logged yet.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : loadingPlacements ? (
                          <div className="py-8 text-center text-xs text-[#14131F]/50 animate-pulse">
                            Loading placement outcomes...
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-[#14131F]/50 italic bg-[#FAFAF8] rounded-xl">
                            Placement metrics will appear as recruitment rounds conclude.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. DATA-DRIVEN DECISION SUPPORT & ACTIONABLE RECOMMENDATIONS ("SO WHAT") */}
                  <div className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#14131F]/6">
                      <div>
                        <h3 className="font-bold font-display text-base sm:text-lg text-[#14131F] flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-[#4338CA]" />
                          Data-Driven Institutional Decision Support
                        </h3>
                        <p className="text-xs text-[#14131F]/60 mt-0.5">
                          Contextual interventions and curriculum actions synthesized from real cohort diagnostic outcomes
                        </p>
                      </div>

                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 self-start sm:self-center">
                        {actionableRecommendations.length} Actionable Recommendations
                      </span>
                    </div>

                    {/* Recommendations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                      {actionableRecommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-4 sm:p-5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 flex flex-col justify-between gap-3 hover:bg-white hover:border-[#14131F]/15 transition-all shadow-2xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant={rec.badgeVariant} size="sm">
                                {rec.badge}
                              </Badge>
                              <Sparkles className="w-3.5 h-3.5 text-[#4338CA]/60" />
                            </div>

                            <h4 className="font-bold font-display text-sm text-[#14131F]">
                              {rec.title}
                            </h4>

                            <p className="text-xs text-[#14131F]/70 leading-relaxed">
                              {rec.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#14131F]/6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={rec.onAction}
                              icon={<ArrowRight className="w-3.5 h-3.5" />}
                              className="text-xs text-[#4338CA] hover:bg-[#4338CA]/10 w-full justify-between px-2"
                            >
                              <span>{rec.actionText}</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : activeTab === 'reports' ? (
            /* REPORTS & ACCREDITATION DATA EXPORT TAB */
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 text-left">
              {/* Export Toast / Notice Banner */}
              {reportExportNotice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-sm text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-medium">{reportExportNotice}</span>
                  </div>
                  <button
                    onClick={() => setReportExportNotice(null)}
                    className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg transition-colors cursor-pointer"
                    aria-label="Dismiss export notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Module Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <SectionHeading
                  title="Institutional Reports & Accreditation Exports"
                  subtitle="Generate verified CSV spreadsheets for NAAC, NIRF, NBA accreditation audits, board governance, and offline academic records."
                  badge={<VerifiedSeal iconType="shield" label="Accreditation & Audit Ready" />}
                />

                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      fetchAnalytics(true);
                      fetchPlacements(true);
                      fetchCompanies(true);
                    }}
                    disabled={isRefreshing || loading || loadingPlacements || loadingCompanies}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
                    className="text-xs"
                  >
                    Sync Registry
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadAllReports}
                    disabled={
                      downloadingReport !== null ||
                      (!analytics?.students?.length &&
                        !placementsData?.byCompany?.length &&
                        !companiesData?.companies?.length)
                    }
                    icon={
                      downloadingReport === 'all' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs shadow-xs"
                  >
                    {downloadingReport === 'all' ? 'Exporting All...' : 'Export All (3 Reports)'}
                  </Button>
                </div>
              </div>

              {/* RFC 4180 / Spreadsheet Compatibility Banner */}
              <div className="p-4 bg-white border border-[#14131F]/8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#14131F]">Standard RFC 4180 CSV Export Format</div>
                    <div className="text-[#14131F]/65 text-[11px] sm:text-xs">
                      Encoded with UTF-8 Byte Order Mark (BOM) for native formatting in Microsoft Excel, Apple Numbers, and Google Sheets with zero text mangling.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#14131F]/8 text-[11px] font-medium text-[#14131F]/70">
                    Quote-Escaped Values
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#14131F]/8 text-[11px] font-medium text-[#14131F]/70">
                    Accreditation Compliant
                  </span>
                </div>
              </div>

              {/* Three Core Export Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* 1. STUDENT READINESS REPORT */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-5 transition-all hover:border-[#14131F]/15">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                        NAAC / Mentorship
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold font-display text-[#14131F]">
                        Student Readiness Report
                      </h3>
                      <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                        Complete student diagnostic roster detailing verified readiness tiers, ATS resume scores, mock interview ratings, and DSA performance indicators.
                      </p>
                    </div>

                    {/* Live Data Preview */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#14131F]">Data Source Preview</span>
                        {loading ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#4338CA]">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                          </span>
                        ) : error ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#FB7185]">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {analytics?.students ? `${analytics.students.length} students` : '0 students'}
                          </span>
                        )}
                      </div>

                      {analytics?.students && analytics.students.length > 0 ? (
                        <div className="space-y-1.5 text-[11px] text-[#14131F]/70">
                          <div className="flex items-center justify-between">
                            <span>Placement Ready:</span>
                            <span className="font-semibold text-[#14131F]">
                              {analytics.readinessDistribution?.placementReady?.count || 0} students
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Developing:</span>
                            <span className="font-semibold text-[#14131F]">
                              {analytics.readinessDistribution?.developing?.count || 0} students
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Needs Support:</span>
                            <span className="font-semibold text-[#14131F]">
                              {analytics.readinessDistribution?.needsSupport?.count || 0} students
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#14131F]/50 italic">
                          {loading ? 'Fetching student records from database...' : 'No student records available for export.'}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#14131F]/6">
                        <div className="text-[10px] font-medium text-[#14131F]/50 mb-1.5">
                          INCLUDED ATTRIBUTES:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Name', 'Email', 'Degree', 'Target Role', 'Readiness %', 'ATS Score', 'Aptitude', 'Mock Score', 'DSA Solved', 'Status'].map((col) => (
                            <span
                              key={col}
                              className="px-1.5 py-0.5 bg-white border border-[#14131F]/8 rounded text-[10px] text-[#14131F]/70"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button & Filename Preview */}
                  <div className="space-y-2 pt-2">
                    <Button
                      variant={!analytics?.students?.length || loading ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={handleDownloadStudentsReport}
                      disabled={
                        loading ||
                        downloadingReport !== null ||
                        !analytics?.students ||
                        analytics.students.length === 0
                      }
                      icon={
                        downloadingReport === 'students' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )
                      }
                      className="w-full text-xs justify-center py-2.5"
                    >
                      {loading
                        ? 'Loading Records...'
                        : downloadingReport === 'students'
                        ? 'Preparing CSV...'
                        : !analytics?.students || analytics.students.length === 0
                        ? 'No Student Records to Export'
                        : 'Download CSV'}
                    </Button>

                    <div className="text-center text-[10px] text-[#14131F]/50 truncate px-1" title={`student-readiness-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`}>
                      {analytics?.students && analytics.students.length > 0
                        ? `File: student-readiness-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`
                        : loading
                        ? 'Connecting to institutional database...'
                        : 'Requires at least 1 registered student in cohort'}
                    </div>
                  </div>
                </div>

                {/* 2. PLACEMENT SUMMARY REPORT */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-5 transition-all hover:border-[#14131F]/15">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#A3E635]/20 text-[#14131F] flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-emerald-800" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        NIRF / Placement Audit
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold font-display text-[#14131F]">
                        Placement Summary Report
                      </h3>
                      <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                        Campus placement record including recruiter conversion rates, offer distributions (full-time vs internship), and verified student offer confirmations.
                      </p>
                    </div>

                    {/* Live Data Preview */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#14131F]">Data Source Preview</span>
                        {loadingPlacements ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#4338CA]">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                          </span>
                        ) : placementsError ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#FB7185]">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {placementsData?.byCompany ? `${placementsData.byCompany.length} companies` : '0 companies'}
                          </span>
                        )}
                      </div>

                      {placementsData && ((placementsData.byCompany?.length || 0) > 0 || (placementsData.recentPlacements?.length || 0) > 0) ? (
                        <div className="space-y-1.5 text-[11px] text-[#14131F]/70">
                          <div className="flex items-center justify-between">
                            <span>Placement Rate:</span>
                            <span className="font-semibold text-[#14131F]">
                              {placementsData.placementRate || 0}% ({placementsData.totalStudentsPlaced || 0}/{placementsData.totalStudents || 0} placed)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Confirmed Offers:</span>
                            <span className="font-semibold text-[#14131F]">
                              {placementsData.totalOffers || 0} total offers
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Offer Type Split:</span>
                            <span className="font-semibold text-[#14131F]">
                              {(placementsData.byType?.job || 0) + (placementsData.byType?.Job || 0)} FT • {(placementsData.byType?.internship || 0) + (placementsData.byType?.Internship || 0)} Intern
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#14131F]/50 italic">
                          {loadingPlacements ? 'Aggregating placement records...' : 'No placement records logged yet in this academic cycle.'}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#14131F]/6">
                        <div className="text-[10px] font-medium text-[#14131F]/50 mb-1.5">
                          INCLUDED ATTRIBUTES:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Company', 'Applicants', 'Offers', 'Conversion %', 'Student Offer Dossier', 'Offer Type', 'Verification Date'].map((col) => (
                            <span
                              key={col}
                              className="px-1.5 py-0.5 bg-white border border-[#14131F]/8 rounded text-[10px] text-[#14131F]/70"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button & Filename Preview */}
                  <div className="space-y-2 pt-2">
                    <Button
                      variant={!placementsData || loadingPlacements ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={handleDownloadPlacementsReport}
                      disabled={
                        loadingPlacements ||
                        downloadingReport !== null ||
                        !placementsData ||
                        ((placementsData.byCompany?.length || 0) === 0 &&
                          (placementsData.recentPlacements?.length || 0) === 0)
                      }
                      icon={
                        downloadingReport === 'placements' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )
                      }
                      className="w-full text-xs justify-center py-2.5"
                    >
                      {loadingPlacements
                        ? 'Loading Outcomes...'
                        : downloadingReport === 'placements'
                        ? 'Preparing CSV...'
                        : !placementsData ||
                          ((placementsData.byCompany?.length || 0) === 0 &&
                            (placementsData.recentPlacements?.length || 0) === 0)
                        ? 'No Placement Data to Export'
                        : 'Download CSV'}
                    </Button>

                    <div className="text-center text-[10px] text-[#14131F]/50 truncate px-1" title={`placement-summary-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`}>
                      {placementsData && ((placementsData.byCompany?.length || 0) > 0 || (placementsData.recentPlacements?.length || 0) > 0)
                        ? `File: placement-summary-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`
                        : loadingPlacements
                        ? 'Calculating institutional placement rates...'
                        : 'Requires logged placement drives or job offers'}
                    </div>
                  </div>
                </div>

                {/* 3. COMPANY ENGAGEMENT REPORT */}
                <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-5 transition-all hover:border-[#14131F]/15">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                        Corporate Relations
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold font-display text-[#14131F]">
                        Company Engagement Report
                      </h3>
                      <p className="text-xs text-[#14131F]/65 mt-1 leading-relaxed">
                        Comprehensive corporate partner directory covering student application volumes, hiring conversion benchmarks, and linked recruiter contacts.
                      </p>
                    </div>

                    {/* Live Data Preview */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#14131F]">Data Source Preview</span>
                        {loadingCompanies ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#4338CA]">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                          </span>
                        ) : companiesError ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#FB7185]">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {companiesData?.companies ? `${companiesData.companies.length} companies` : '0 companies'}
                          </span>
                        )}
                      </div>

                      {companiesData?.companies && companiesData.companies.length > 0 ? (
                        <div className="space-y-1.5 text-[11px] text-[#14131F]/70">
                          <div className="flex items-center justify-between">
                            <span>Campus Applicants:</span>
                            <span className="font-semibold text-[#14131F]">
                              {companiesData.totalApplicants || 0} applicants
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Recruiter Contacts:</span>
                            <span className="font-semibold text-[#14131F]">
                              {companiesData.companies.filter((c) => !!c.recruiter).length} verified contacts
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Total Applications:</span>
                            <span className="font-semibold text-[#14131F]">
                              {companiesData.companies.reduce((sum, c) => sum + (c.totalApplications || 0), 0)} submissions
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#14131F]/50 italic">
                          {loadingCompanies ? 'Fetching corporate directory...' : 'No corporate engagements logged yet.'}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#14131F]/6">
                        <div className="text-[10px] font-medium text-[#14131F]/50 mb-1.5">
                          INCLUDED ATTRIBUTES:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Company', 'Unique Applicants', 'Total Applications', 'Offers', 'Conversion %', 'Roles Engaged', 'Recruiter Contact'].map((col) => (
                            <span
                              key={col}
                              className="px-1.5 py-0.5 bg-white border border-[#14131F]/8 rounded text-[10px] text-[#14131F]/70"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button & Filename Preview */}
                  <div className="space-y-2 pt-2">
                    <Button
                      variant={!companiesData?.companies?.length || loadingCompanies ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={handleDownloadCompaniesReport}
                      disabled={
                        loadingCompanies ||
                        downloadingReport !== null ||
                        !companiesData?.companies ||
                        companiesData.companies.length === 0
                      }
                      icon={
                        downloadingReport === 'companies' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )
                      }
                      className="w-full text-xs justify-center py-2.5"
                    >
                      {loadingCompanies
                        ? 'Loading Partners...'
                        : downloadingReport === 'companies'
                        ? 'Preparing CSV...'
                        : !companiesData?.companies || companiesData.companies.length === 0
                        ? 'No Company Data to Export'
                        : 'Download CSV'}
                    </Button>

                    <div className="text-center text-[10px] text-[#14131F]/50 truncate px-1" title={`company-engagement-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`}>
                      {companiesData?.companies && companiesData.companies.length > 0
                        ? `File: company-engagement-report-${getSanitizedCollegeSlug(institutionName)}-${getReportDateString()}.csv`
                        : loadingCompanies
                        ? 'Querying employer database...'
                        : 'Requires student applications to corporate drives'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Export & Escaping Verification Details */}
              <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#14131F]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Data Protection, Formatting Integrity & Compliance Audit</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#14131F]/75">
                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-1">
                    <div className="font-semibold text-[#14131F]">Deterministic Field Escaping</div>
                    <p className="text-[11px] leading-relaxed">
                      Names or company titles with commas (e.g., <code>"B.Tech, CSE"</code> or <code>"Acme, Inc."</code>) are wrapped in double quotes to prevent spreadsheet column shifts.
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-1">
                    <div className="font-semibold text-[#14131F]">Accreditation Mapping</div>
                    <p className="text-[11px] leading-relaxed">
                      Generated columns match NIRF Parameter 3 (Graduation Outcomes) and NAAC Criteria 5 (Student Support and Progression) reporting formats.
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-1">
                    <div className="font-semibold text-[#14131F]">Offline Data Portability</div>
                    <p className="text-[11px] leading-relaxed">
                      Files are rendered client-side directly from verified database records with zero reliance on external rendering dependencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#14131F]/8 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 my-6 shadow-xs animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto shadow-xs">
                {React.createElement(currentNav.icon, { className: 'w-7 h-7' })}
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  <span>Coming in the next step</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-[#14131F]">
                  {currentNav.label}
                </h3>
                <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed">
                  {currentNav.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#14131F]/8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  icon={<LayoutDashboard className="w-3.5 h-3.5" />}
                  className="text-xs w-full sm:w-auto"
                >
                  Return to Dashboard Overview
                </Button>
              </div>
            </div>
          )}
      </DashboardShell>

        {/* STUDENT DETAIL PANEL (Slide-Over Drawer on Demand via GET /api/tpo/students/:studentId/profile) */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#14131F]/40 backdrop-blur-xs transition-opacity"
              onClick={handleCloseStudentDetail}
              title="Click to dismiss dossier"
            />

            {/* Slide-over Drawer */}
            <div className="relative w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Drawer Top Bar */}
              <div className="p-4 sm:p-6 border-b border-[#14131F]/8 bg-[#FAFAF8] flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] font-display font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold font-display text-[#14131F] truncate">
                        {selectedStudent.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          selectedStudent.status === 'Placement Ready'
                            ? 'bg-[#A3E635]/20 text-[#14131F] border-[#A3E635]/40'
                            : selectedStudent.status === 'Developing'
                            ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                            : 'bg-[#FB7185]/15 text-[#E11D48] border-[#FB7185]/35'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            selectedStudent.status === 'Placement Ready'
                              ? 'bg-[#65A30D]'
                              : selectedStudent.status === 'Developing'
                              ? 'bg-[#4338CA]'
                              : 'bg-[#E11D48]'
                          }`}
                        />
                        {selectedStudent.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#14131F]/60 truncate mt-0.5">
                      {selectedStudent.degree} • {selectedStudent.targetRole} • {selectedStudent.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseStudentDetail}
                  className="p-2 rounded-xl text-[#14131F]/40 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors cursor-pointer shrink-0"
                  title="Close dossier (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Real-time KPI Matrix Strip */}
              <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#14131F]/8 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {/* Readiness */}
                <div className="p-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/5 text-center">
                  <p className="text-[10px] text-[#14131F]/50 font-medium">Readiness</p>
                  <p
                    className={`text-sm font-bold font-display mt-0.5 ${
                      selectedStudent.status === 'Placement Ready'
                        ? 'text-[#3F6212]'
                        : selectedStudent.status === 'Developing'
                        ? 'text-[#4338CA]'
                        : 'text-[#E11D48]'
                    }`}
                  >
                    {selectedStudent.readinessScore !== null ? `${selectedStudent.readinessScore}%` : '—'}
                  </p>
                </div>

                {/* Resume ATS */}
                <div className="p-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/5 text-center">
                  <p className="text-[10px] text-[#14131F]/50 font-medium">Resume ATS</p>
                  <p className="text-sm font-bold font-display text-[#14131F] mt-0.5">
                    {selectedStudent.atsScore !== null ? `${selectedStudent.atsScore}%` : '—'}
                  </p>
                </div>

                {/* Mock Interview */}
                <div className="p-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/5 text-center">
                  <p className="text-[10px] text-[#14131F]/50 font-medium">Mock Score</p>
                  <p className="text-sm font-bold font-display text-[#14131F] mt-0.5">
                    {selectedStudent.mockScore !== null ? `${selectedStudent.mockScore}%` : '—'}
                  </p>
                </div>

                {/* Aptitude */}
                <div className="p-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/5 text-center">
                  <p className="text-[10px] text-[#14131F]/50 font-medium">Aptitude</p>
                  <p className="text-sm font-bold font-display text-[#14131F] mt-0.5">
                    {selectedStudent.aptitudeScore !== null ? `${selectedStudent.aptitudeScore}%` : '—'}
                  </p>
                </div>

                {/* Portfolio */}
                <div className="p-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/5 text-center">
                  <p className="text-[10px] text-[#14131F]/50 font-medium">Portfolio</p>
                  <p className="text-sm font-bold font-display text-[#14131F] mt-0.5">
                    {selectedStudent.portfolioScore !== null ? `${selectedStudent.portfolioScore}%` : '—'}
                  </p>
                </div>

                {/* DSA Solved */}
                <div className="p-2 rounded-xl bg-[#FAFAF8] border border-[#14131F]/5 text-center">
                  <p className="text-[10px] text-[#14131F]/50 font-medium">DSA Problems</p>
                  <p className="text-sm font-bold font-display text-[#14131F] mt-0.5">
                    {selectedStudent.dsaSolved}
                  </p>
                </div>
              </div>

              {/* Section Sub-Navigation Tabs */}
              <div className="px-4 sm:px-6 pt-2 border-b border-[#14131F]/8 flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDetailActiveSection('overview')}
                  className={`text-xs font-semibold py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    detailActiveSection === 'overview'
                      ? 'border-[#4338CA] text-[#4338CA]'
                      : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
                  }`}
                >
                  Diagnostic Summary
                </button>

                <button
                  type="button"
                  onClick={() => setDetailActiveSection('resume')}
                  className={`text-xs font-semibold py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    detailActiveSection === 'resume'
                      ? 'border-[#4338CA] text-[#4338CA]'
                      : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume & ATS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailActiveSection('portfolio')}
                  className={`text-xs font-semibold py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    detailActiveSection === 'portfolio'
                      ? 'border-[#4338CA] text-[#4338CA]'
                      : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
                  }`}
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Portfolio & Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailActiveSection('certifications')}
                  className={`text-xs font-semibold py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    detailActiveSection === 'certifications'
                      ? 'border-[#4338CA] text-[#4338CA]'
                      : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Certifications & Badges</span>
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Loading State */}
                {loadingProfile ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
                    <p className="font-semibold text-sm text-[#14131F]">
                      Retrieving candidate dossier for {selectedStudent.name}...
                    </p>
                    <p className="text-xs text-[#14131F]/50">
                      Querying resume audit, portfolio repository metrics, and verified certifications.
                    </p>
                  </div>
                ) : profileError ? (
                  /* Error State with Retry */
                  <div className="p-5 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/25 text-[#E11D48] space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#E11D48]" />
                      <h4 className="font-bold text-sm">Failed to load student profile</h4>
                    </div>
                    <p className="text-[#14131F]/80">{profileError}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenStudentDetail(selectedStudent)}
                      className="text-xs bg-white text-[#E11D48] border-[#FB7185]/35"
                    >
                      Retry Retrieval
                    </Button>
                  </div>
                ) : studentProfile ? (
                  <>
                    {/* SECTION: OVERVIEW & DIAGNOSTICS */}
                    {detailActiveSection === 'overview' && (
                      <div className="space-y-5 animate-in fade-in duration-150">
                        {/* TPO Action Recommendation */}
                        <div
                          className={`p-4 rounded-2xl border ${
                            selectedStudent.status === 'Placement Ready'
                              ? 'bg-[#A3E635]/15 border-[#A3E635]/35'
                              : selectedStudent.status === 'Developing'
                              ? 'bg-[#4338CA]/5 border-[#4338CA]/20'
                              : 'bg-[#FB7185]/10 border-[#FB7185]/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                selectedStudent.status === 'Placement Ready'
                                  ? 'bg-[#A3E635]/30 text-[#3F6212]'
                                  : selectedStudent.status === 'Developing'
                                  ? 'bg-[#4338CA]/10 text-[#4338CA]'
                                  : 'bg-[#FB7185]/20 text-[#E11D48]'
                              }`}
                            >
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-[#14131F]">
                                TPO Placement Action Recommendation
                              </h4>
                              <p className="text-xs text-[#14131F]/80 leading-relaxed">
                                {selectedStudent.status === 'Placement Ready'
                                  ? 'Candidate exhibits strong competency indicators across all core benchmarks. Recommend prioritizing for tier-1 product engineering and campus flagship drive shortlists.'
                                  : selectedStudent.status === 'Developing'
                                  ? 'Candidate is progressing toward placement benchmark. Review missing skills identified in the resume audit and encourage additional mock interview practice to reach Placement Ready status.'
                                  : 'Candidate has an overall readiness score below 40%. Immediate intervention recommended: schedule 1:1 resume optimization, assign core DSA problem sets, and conduct foundational mock interview drills.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Candidate Metadata Grid */}
                        <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl p-4 space-y-3">
                          <h4 className="font-semibold text-xs text-[#14131F] flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                            Academic & Contact Affiliation
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-[#14131F]/50 block">Institution / College:</span>
                              <span className="font-semibold text-[#14131F] mt-0.5 block">
                                {studentProfile.student.college || selectedStudent.college || institutionName}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#14131F]/50 block">Degree & Major:</span>
                              <span className="font-semibold text-[#14131F] mt-0.5 block">
                                {studentProfile.student.degree || selectedStudent.degree}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#14131F]/50 block">Target Role:</span>
                              <span className="font-semibold text-[#14131F] mt-0.5 block">
                                {studentProfile.student.targetRole || selectedStudent.targetRole}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#14131F]/50 block">Email Address:</span>
                              <span className="font-semibold text-[#14131F] mt-0.5 block">
                                {studentProfile.student.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assessment Module Status Summary */}
                        <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 space-y-3">
                          <h4 className="font-semibold text-xs text-[#14131F] flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-[#4338CA]" />
                            Assessment Module Verification Status
                          </h4>
                          <div className="space-y-2 text-xs">
                            {/* Resume */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF8]">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#4338CA]" />
                                <span className="font-medium text-[#14131F]">Resume ATS Audit</span>
                              </div>
                              {studentProfile.resume ? (
                                <span className="font-bold text-[#14131F]">
                                  {studentProfile.resume.atsScore}% ATS Score
                                </span>
                              ) : (
                                <span className="text-[#E11D48] font-medium">Not evaluated</span>
                              )}
                            </div>

                            {/* Portfolio */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF8]">
                              <div className="flex items-center gap-2">
                                <Github className="w-4 h-4 text-[#4338CA]" />
                                <span className="font-medium text-[#14131F]">GitHub Portfolio Audit</span>
                              </div>
                              {studentProfile.portfolio ? (
                                <span className="font-bold text-[#14131F]">
                                  {studentProfile.portfolio.qualityScore}% Quality Score
                                </span>
                              ) : (
                                <span className="text-[#E11D48] font-medium">Not submitted</span>
                              )}
                            </div>

                            {/* Mock Interview */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF8]">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#4338CA]" />
                                <span className="font-medium text-[#14131F]">AI Mock Interviews</span>
                              </div>
                              {selectedStudent.mockScore !== null ? (
                                <span className="font-bold text-[#14131F]">
                                  {selectedStudent.mockScore}% average ({selectedStudent.mockCount} completed)
                                </span>
                              ) : (
                                <span className="text-[#E11D48] font-medium">No sessions logged</span>
                              )}
                            </div>

                            {/* DSA Practice */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF8]">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-[#4338CA]" />
                                <span className="font-medium text-[#14131F]">DSA Code Challenges</span>
                              </div>
                              <span className="font-bold text-[#14131F]">
                                {selectedStudent.dsaSolved} problems solved
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION: RESUME & ATS AUDIT */}
                    {detailActiveSection === 'resume' && (
                      <div className="space-y-5 animate-in fade-in duration-150">
                        {studentProfile.resume ? (
                          <>
                            {/* Score Overview Card */}
                            <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl p-5 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-bold text-sm text-[#14131F]">
                                    {studentProfile.resume.fileName || 'Resume Document'}
                                  </h4>
                                  <p className="text-xs text-[#14131F]/60 mt-0.5">
                                    Target Role: <span className="font-semibold text-[#14131F]">{studentProfile.resume.targetRole || selectedStudent.targetRole}</span>
                                    {studentProfile.resume.createdAt && (
                                      <span> • Audited {new Date(studentProfile.resume.createdAt).toLocaleDateString()}</span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-xl text-sm font-bold border ${
                                      (studentProfile.resume.atsScore || 0) >= 70
                                        ? 'bg-[#A3E635]/25 text-[#14131F] border-[#A3E635]/50'
                                        : (studentProfile.resume.atsScore || 0) >= 40
                                        ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                        : 'bg-[#FB7185]/20 text-[#E11D48] border-[#FB7185]/40'
                                    }`}
                                  >
                                    {studentProfile.resume.atsScore}% ATS
                                  </span>
                                </div>
                              </div>

                              {/* Breakdown metrics */}
                              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#14131F]/8 text-center text-xs">
                                <div className="p-2 rounded-xl bg-white border border-[#14131F]/5">
                                  <span className="text-[#14131F]/50 block text-[10px]">Formatting</span>
                                  <span className="font-bold text-sm text-[#14131F] mt-0.5 block">
                                    {studentProfile.resume.formattingScore !== null ? `${studentProfile.resume.formattingScore}%` : '—'}
                                  </span>
                                </div>
                                <div className="p-2 rounded-xl bg-white border border-[#14131F]/5">
                                  <span className="text-[#14131F]/50 block text-[10px]">Quantified Impact</span>
                                  <span className="font-bold text-sm text-[#14131F] mt-0.5 block">
                                    {studentProfile.resume.quantifiedImpactScore !== null ? `${studentProfile.resume.quantifiedImpactScore}%` : '—'}
                                  </span>
                                </div>
                                <div className="p-2 rounded-xl bg-white border border-[#14131F]/5">
                                  <span className="text-[#14131F]/50 block text-[10px]">Keyword Match</span>
                                  <span className="font-bold text-sm text-[#14131F] mt-0.5 block">
                                    {studentProfile.resume.keywordMatchPct !== null ? `${studentProfile.resume.keywordMatchPct}%` : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Strong Areas: Verified Skills Found (Lime) */}
                            <div className="space-y-2">
                              <h4 className="font-bold text-xs text-[#14131F] flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#65A30D]" />
                                <span>Verified Skills Detected in Resume (Strong Areas)</span>
                              </h4>
                              {studentProfile.resume.skillsFound && studentProfile.resume.skillsFound.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {studentProfile.resume.skillsFound.map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#A3E635]/20 text-[#14131F] border border-[#A3E635]/40"
                                    >
                                      <Check className="w-3 h-3 text-[#65A30D]" />
                                      <span>{skill}</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-[#14131F]/50 italic">
                                  No verified skills detected from target role vocabulary.
                                </p>
                              )}
                            </div>

                            {/* Weak Areas: Missing Skills (Coral) */}
                            <div className="space-y-2">
                              <h4 className="font-bold text-xs text-[#E11D48] flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-[#E11D48]" />
                                <span>Missing Skills for Target Role (Skill Gaps)</span>
                              </h4>
                              {studentProfile.resume.missingSkills && studentProfile.resume.missingSkills.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {studentProfile.resume.missingSkills.map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FB7185]/15 text-[#E11D48] border border-[#FB7185]/35"
                                    >
                                      <AlertCircle className="w-3 h-3 text-[#E11D48]" />
                                      <span>{skill}</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-emerald-600 font-medium">
                                  No missing core skills detected for this target role!
                                </p>
                              )}
                            </div>

                            {/* Actionable Suggestions */}
                            {studentProfile.resume.suggestions && studentProfile.resume.suggestions.length > 0 && (
                              <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl p-4 space-y-2">
                                <h4 className="font-semibold text-xs text-[#14131F] flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-[#4338CA]" />
                                  ATS Optimization Suggestions
                                </h4>
                                <ul className="space-y-1.5 text-xs text-[#14131F]/80 list-disc list-inside">
                                  {studentProfile.resume.suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="leading-relaxed">
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Overall Feedback */}
                            {studentProfile.resume.feedback && (
                              <div className="bg-[#4338CA]/5 border border-[#4338CA]/15 rounded-2xl p-4 space-y-1.5 text-xs">
                                <h4 className="font-semibold text-xs text-[#4338CA]">
                                  ATS Auditor Feedback
                                </h4>
                                <p className="text-[#14131F]/80 leading-relaxed">
                                  {studentProfile.resume.feedback}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl p-8 text-center space-y-2">
                            <FileText className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                            <h4 className="font-semibold text-sm text-[#14131F]">No resume uploaded or evaluated</h4>
                            <p className="text-xs text-[#14131F]/50 max-w-sm mx-auto">
                              This candidate has not uploaded a resume for automated ATS benchmarking. Advise the student to upload their resume through the Student Dashboard.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION: PORTFOLIO & GITHUB AUDIT */}
                    {detailActiveSection === 'portfolio' && (
                      <div className="space-y-5 animate-in fade-in duration-150">
                        {studentProfile.portfolio ? (
                          <>
                            {/* Score & GitHub Header */}
                            <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl p-5 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Github className="w-5 h-5 text-[#14131F]" />
                                    <h4 className="font-bold text-sm text-[#14131F]">
                                      {studentProfile.portfolio.githubUsername ? `@${studentProfile.portfolio.githubUsername}` : 'GitHub Profile'}
                                    </h4>
                                  </div>
                                  {studentProfile.portfolio.githubUrl && (
                                    <a
                                      href={studentProfile.portfolio.githubUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-[#4338CA] hover:underline mt-1 font-medium"
                                    >
                                      <span>View GitHub Profile</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-xl text-sm font-bold border ${
                                      (studentProfile.portfolio.qualityScore || 0) >= 70
                                        ? 'bg-[#A3E635]/25 text-[#14131F] border-[#A3E635]/50'
                                        : (studentProfile.portfolio.qualityScore || 0) >= 40
                                        ? 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20'
                                        : 'bg-[#FB7185]/20 text-[#E11D48] border-[#FB7185]/40'
                                    }`}
                                  >
                                    {studentProfile.portfolio.qualityScore}% Quality
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Strengths (Lime) */}
                            {studentProfile.portfolio.strengths && studentProfile.portfolio.strengths.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-bold text-xs text-[#14131F] flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-[#65A30D]" />
                                  <span>Repository Strengths (Strong Areas)</span>
                                </h4>
                                <div className="space-y-1.5">
                                  {studentProfile.portfolio.strengths.map((str, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/35 text-xs text-[#14131F] flex items-start gap-2"
                                    >
                                      <Check className="w-3.5 h-3.5 text-[#65A30D] shrink-0 mt-0.5" />
                                      <span>{str}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recommendations (Coral) */}
                            {studentProfile.portfolio.recommendations && studentProfile.portfolio.recommendations.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-bold text-xs text-[#E11D48] flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-[#E11D48]" />
                                  <span>Improvement Recommendations (Weak Areas)</span>
                                </h4>
                                <div className="space-y-1.5">
                                  {studentProfile.portfolio.recommendations.map((rec, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs text-[#E11D48] flex items-start gap-2"
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 text-[#E11D48] shrink-0 mt-0.5" />
                                      <span className="text-[#14131F]/90">{rec}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Audited Projects */}
                            {studentProfile.portfolio.auditedProjects && studentProfile.portfolio.auditedProjects.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-xs text-[#14131F] flex items-center gap-1.5">
                                  <Code className="w-4 h-4 text-[#4338CA]" />
                                  Audited Repositories & Projects
                                </h4>
                                <div className="space-y-2.5">
                                  {studentProfile.portfolio.auditedProjects.map((project, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3.5 rounded-xl border border-[#14131F]/8 bg-[#FAFAF8] space-y-2 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <h5 className="font-bold text-sm text-[#14131F]">
                                          {project.name || `Project #${idx + 1}`}
                                        </h5>
                                        {project.score !== undefined && (
                                          <span className="px-2 py-0.5 rounded-md font-bold bg-[#4338CA]/10 text-[#4338CA] text-xs">
                                            {project.score}/100
                                          </span>
                                        )}
                                      </div>

                                      {project.description && (
                                        <p className="text-[#14131F]/70 text-xs leading-relaxed">
                                          {project.description}
                                        </p>
                                      )}

                                      {project.techStack && project.techStack.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {project.techStack.map((tech, tIdx) => (
                                            <span
                                              key={tIdx}
                                              className="px-2 py-0.5 rounded-md bg-white border border-[#14131F]/10 text-[11px] font-medium text-[#14131F]/70"
                                            >
                                              {tech}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {project.feedback && (
                                        <p className="text-[11px] text-[#14131F]/60 italic pt-1 border-t border-[#14131F]/5">
                                          Evaluation: {project.feedback}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl p-8 text-center space-y-2">
                            <Github className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                            <h4 className="font-semibold text-sm text-[#14131F]">No GitHub portfolio submitted</h4>
                            <p className="text-xs text-[#14131F]/50 max-w-sm mx-auto">
                              This candidate has not connected their GitHub profile or submitted project repositories for code quality auditing.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION: CERTIFICATIONS & BADGES */}
                    {detailActiveSection === 'certifications' && (
                      <div className="space-y-5 animate-in fade-in duration-150">
                        {/* Badges Section */}
                        <div className="bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-[#14131F] flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-[#4338CA]" />
                              <span>Earned Badges & Milestone Seals</span>
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] text-xs font-bold">
                              {studentProfile.badgeCount || (studentProfile.badges ? studentProfile.badges.length : 0)} Badges
                            </span>
                          </div>

                          {studentProfile.badges && studentProfile.badges.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {studentProfile.badges.map((badge, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-white border border-[#14131F]/8 flex items-center gap-2.5"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-[#A3E635]/20 text-[#3F6212] flex items-center justify-center shrink-0">
                                    <Award className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-xs text-[#14131F] truncate">
                                      {typeof badge === 'string' ? badge : badge.title || badge.name || 'Verified Badge'}
                                    </p>
                                    {badge.category && (
                                      <p className="text-[10px] text-[#14131F]/50 capitalize">{badge.category}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#14131F]/50 italic">
                              No skill badges currently unlocked.
                            </p>
                          )}
                        </div>

                        {/* Grouped Certifications */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-xs text-[#14131F]">
                            Accredited Certifications by Tier
                          </h4>

                          {/* Global Certifications */}
                          <div className="p-3.5 rounded-xl border border-[#14131F]/8 bg-white space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-[#14131F] flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#4338CA]" />
                                Global Tier (AWS, GCP, Azure, Oracle, etc.)
                              </span>
                              <span className="text-[11px] text-[#14131F]/50 font-medium">
                                {studentProfile.groupedCertifications?.Global?.length || 0} verified
                              </span>
                            </div>
                            {studentProfile.groupedCertifications?.Global && studentProfile.groupedCertifications.Global.length > 0 ? (
                              <div className="space-y-1.5 pt-1">
                                {studentProfile.groupedCertifications.Global.map((cert, cIdx) => (
                                  <div key={cIdx} className="p-2 rounded-lg bg-[#FAFAF8] text-xs font-medium text-[#14131F]">
                                    {cert.name || cert.title || 'Global Certification'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-[#14131F]/40 italic">None on file</p>
                            )}
                          </div>

                          {/* National Certifications */}
                          <div className="p-3.5 rounded-xl border border-[#14131F]/8 bg-white space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-[#14131F] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                National Tier (NPTEL, AICTE, SWAYAM, etc.)
                              </span>
                              <span className="text-[11px] text-[#14131F]/50 font-medium">
                                {studentProfile.groupedCertifications?.National?.length || 0} verified
                              </span>
                            </div>
                            {studentProfile.groupedCertifications?.National && studentProfile.groupedCertifications.National.length > 0 ? (
                              <div className="space-y-1.5 pt-1">
                                {studentProfile.groupedCertifications.National.map((cert, cIdx) => (
                                  <div key={cIdx} className="p-2 rounded-lg bg-[#FAFAF8] text-xs font-medium text-[#14131F]">
                                    {cert.name || cert.title || 'National Certification'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-[#14131F]/40 italic">None on file</p>
                            )}
                          </div>

                          {/* Local/College Certifications */}
                          <div className="p-3.5 rounded-xl border border-[#14131F]/8 bg-white space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-[#14131F] flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-[#14131F]/60" />
                                Institutional & College Tier
                              </span>
                              <span className="text-[11px] text-[#14131F]/50 font-medium">
                                {studentProfile.groupedCertifications?.['Local/College']?.length || 0} verified
                              </span>
                            </div>
                            {studentProfile.groupedCertifications?.['Local/College'] && studentProfile.groupedCertifications['Local/College'].length > 0 ? (
                              <div className="space-y-1.5 pt-1">
                                {studentProfile.groupedCertifications['Local/College'].map((cert, cIdx) => (
                                  <div key={cIdx} className="p-2 rounded-lg bg-[#FAFAF8] text-xs font-medium text-[#14131F]">
                                    {cert.name || cert.title || 'College Certification'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-[#14131F]/40 italic">None on file</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Drawer Bottom Bar */}
              <div className="p-4 sm:p-5 border-t border-[#14131F]/8 bg-[#FAFAF8] flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] text-[#14131F]/40">
                  placementOS TPO Dossier • {selectedStudent.degree}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseStudentDetail}
                  className="text-xs"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* REJECT INTERVIEW EXPERIENCE MODERATION MODAL */}
        {rejectModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#14131F]/50 backdrop-blur-xs transition-opacity"
              onClick={() => {
                if (!submittingReject) handleCloseRejectModal();
              }}
              title="Click outside to cancel"
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Top Bar */}
              <div className="p-5 sm:p-6 border-b border-[#14131F]/8 bg-[#FAFAF8] flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FB7185]/20 text-[#E11D48] flex items-center justify-center shrink-0">
                    <X className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold font-display text-[#14131F] truncate">
                      Reject Interview Submission
                    </h3>
                    <p className="text-xs text-[#14131F]/60 truncate">
                      Provide required feedback for student revision
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseRejectModal}
                  disabled={submittingReject}
                  className="p-1.5 rounded-lg hover:bg-[#14131F]/5 text-[#14131F]/50 hover:text-[#14131F] transition-colors"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Submission Target Summary */}
                <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#14131F]">
                      Candidate: {rejectModalTarget.studentName}
                    </span>
                    <span className="text-[#14131F]/50 truncate">
                      {rejectModalTarget.studentDegree || rejectModalTarget.studentCollege}
                    </span>
                  </div>
                  <div className="text-[#14131F]/70">
                    Experience:{' '}
                    <span className="font-medium text-[#14131F]">
                      {rejectModalTarget.role} at {rejectModalTarget.company}
                    </span>
                  </div>
                </div>

                {/* Feedback Input Field */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#14131F] flex items-center gap-1">
                      <span>Feedback & Rejection Reason</span>
                      <span className="text-[#E11D48] font-bold">*</span>
                    </label>
                    <span className="text-[11px] text-[#14131F]/50">
                      Required by placement system
                    </span>
                  </div>

                  <p className="text-[11px] text-[#14131F]/60 leading-relaxed">
                    Explain clearly why this submission cannot be approved or what the candidate needs to revise. This note is transmitted directly to the student.
                  </p>

                  <textarea
                    rows={4}
                    value={rejectNoteInput}
                    onChange={(e) => {
                      setRejectNoteInput(e.target.value);
                      if (rejectNoteError) setRejectNoteError(null);
                    }}
                    placeholder="e.g., Please provide more specific details on the coding problem statement and complexity requirements asked in Round 2..."
                    className={`w-full text-xs p-3 rounded-xl border transition-all resize-none focus:outline-none ${
                      rejectNoteError
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-400/20'
                        : 'border-[#14131F]/15 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10'
                    }`}
                  />

                  {/* Quick-insert template suggestions */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-semibold text-[#14131F]/40 tracking-wider">
                      Quick templates:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Needs specific coding round questions',
                        'Please clarify round durations and format',
                        'Contains unverified compensation figures',
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => {
                            setRejectNoteInput(tpl);
                            if (rejectNoteError) setRejectNoteError(null);
                          }}
                          className="px-2 py-1 bg-[#14131F]/5 hover:bg-[#14131F]/10 rounded-md text-[11px] text-[#14131F]/70 hover:text-[#14131F] transition-colors"
                        >
                          + {tpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Explicit Error Alert (for missing note or server 400) */}
                  {rejectNoteError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Unable to reject submission</p>
                        <p className="text-[11px] text-rose-700 mt-0.5">{rejectNoteError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Bottom Bar */}
              <div className="p-4 sm:p-5 border-t border-[#14131F]/8 bg-[#FAFAF8] flex items-center justify-end gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseRejectModal}
                  disabled={submittingReject}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  variant="brick"
                  size="sm"
                  onClick={handleConfirmReject}
                  disabled={submittingReject}
                  icon={
                    submittingReject ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs text-white bg-[#E11D48] hover:bg-[#BE123C] border-transparent"
                >
                  {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
