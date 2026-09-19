import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  FileText,
  Github,
  Award,
  Layers,
  Briefcase,
  Trophy,
  User,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
  X,
  MessageSquare,
  School,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { viewAuthenticatedFile } from '../../utils/fileViewer';

export interface VerificationRequestItem {
  id: string;
  type: 'certification' | 'project' | 'internship' | 'achievement';
  title: string;
  description?: string;
  student: {
    id: string;
    name: string;
    email: string;
    college: string;
    department?: string;
    degree?: string;
  };
  metadata: {
    issuer?: string;
    category?: string;
    dateIssued?: string;
    role?: string;
    duration?: string;
    technologies?: string[];
    organization?: string;
    rank?: string;
    date?: string;
    location?: string;
    outcomes?: string;
    status?: string;
    source?: string;
  };
  evidence: {
    fileId?: string;
    fileUrl?: string;
    fileName?: string;
    credentialUrl?: string;
    githubUrl?: string;
    liveUrl?: string;
    certificateUrl?: string;
  };
  hasEvidence?: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  submittedAt: string;
}

export interface VerificationStats {
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  totalCount: number;
  byType?: Record<string, { pending: number; verified: number; rejected: number }>;
}

export function PortfolioVerificationQueue() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING');
  const [typeFilter, setTypeFilter] = useState<'all' | 'certification' | 'project' | 'internship' | 'achievement'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal
  const [rejectModalItem, setRejectModalItem] = useState<VerificationRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<string | null>(null);

  // Fetch queue data
  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/verification/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            pendingCount: statsData.pendingCount || 0,
            verifiedCount: statsData.verifiedCount || 0,
            rejectedCount: statsData.rejectedCount || 0,
            totalCount: statsData.totalCount || 0,
            byType: statsData.byType,
          });
        }
      }

      // 2. Fetch Requests
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
      });
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const reqRes = await fetch(`/api/verification/requests?${params.toString()}`, { headers });
      const reqData = await reqRes.json();

      if (!reqRes.ok) {
        throw new Error(reqData.error || 'Failed to fetch verification queue');
      }

      setRequests(reqData.requests || []);
    } catch (err: any) {
      console.error('[PortfolioVerificationQueue Error]:', err);
      setError(err.message || 'Error loading verification requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  // Handle Verify Action
  const handleVerify = async (item: VerificationRequestItem) => {
    try {
      setIsSubmittingAction(item.id);
      setError(null);
      setActionSuccess(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/verification/${item.type}/${item.id}/verify`, {
        method: 'PATCH',
        headers,
      });

      const data = await res.json();
      if (res.status === 409) {
        throw new Error(data.error || 'Conflict: Record was already reviewed by another administrator.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify portfolio item');
      }

      setActionSuccess(`Successfully verified ${item.type} evidence for ${item.student.name}`);
      // Refresh list
      await fetchData(true);
    } catch (err: any) {
      setError(err.message || 'Error verifying item');
    } finally {
      setIsSubmittingAction(null);
    }
  };

  // Open Reject Modal
  const openRejectModal = (item: VerificationRequestItem) => {
    setRejectModalItem(item);
    setRejectReason('');
  };

  // Submit Rejection
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejecting this evidence.');
      return;
    }

    try {
      setIsSubmittingAction(rejectModalItem.id);
      setError(null);
      setActionSuccess(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/verification/${rejectModalItem.type}/${rejectModalItem.id}/reject`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ note: rejectReason.trim() }),
      });

      const data = await res.json();
      if (res.status === 409) {
        throw new Error(data.error || 'Conflict: Record was already reviewed.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject item');
      }

      setActionSuccess(`Evidence rejected with reviewer feedback for ${rejectModalItem.student.name}`);
      setRejectModalItem(null);
      setRejectReason('');
      await fetchData(true);
    } catch (err: any) {
      setError(err.message || 'Error rejecting item');
    } finally {
      setIsSubmittingAction(null);
    }
  };

  // Filter items in memory if search query typed
  const displayedRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter((r) => {
      const sName = (r.student.name || '').toLowerCase();
      const sEmail = (r.student.email || '').toLowerCase();
      const title = (r.title || '').toLowerCase();
      const org = (r.metadata.organization || r.metadata.issuer || '').toLowerCase();
      return sName.includes(q) || sEmail.includes(q) || title.includes(q) || org.includes(q);
    });
  }, [requests, searchQuery]);

  const collegeName = user?.collegeName || user?.college || 'Affiliated Institution';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                <School className="w-3.5 h-3.5" />
                <span>Institutional Scope: {collegeName}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#047857]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Authorized Verifier
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-[#14131F] mt-2">
              Student Portfolio Evidence Verification Queue
            </h2>
            <p className="text-xs text-[#14131F]/60 mt-1 max-w-2xl leading-relaxed">
              Verify submitted certifications, engineering capstone projects, internships, and honors.
              Uploaded evidence does not grant verification: each credential requires explicit faculty or institutional validation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFAF8] border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F] rounded-xl text-xs font-semibold transition-all self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#4338CA]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Queue'}</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60">
              <span className="font-medium">Pending Review</span>
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-bold font-display text-[#14131F]">
              {stats?.pendingCount ?? 0}
            </div>
            <p className="text-[10px] text-[#14131F]/50">Awaiting your approval</p>
          </div>

          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60">
              <span className="font-medium">Verified Credentials</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div className="text-2xl font-bold font-display text-[#047857]">
              {stats?.verifiedCount ?? 0}
            </div>
            <p className="text-[10px] text-[#14131F]/50">Authenticity approved</p>
          </div>

          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60">
              <span className="font-medium">Rejected Evidence</span>
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            </div>
            <div className="text-2xl font-bold font-display text-[#DC2626]">
              {stats?.rejectedCount ?? 0}
            </div>
            <p className="text-[10px] text-[#14131F]/50">Returned with feedback</p>
          </div>

          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60">
              <span className="font-medium">Total Submissions</span>
              <Layers className="w-3.5 h-3.5 text-[#4338CA]" />
            </div>
            <div className="text-2xl font-bold font-display text-[#14131F]">
              {stats?.totalCount ?? 0}
            </div>
            <p className="text-[10px] text-[#14131F]/50">All collegiate records</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center justify-between gap-3 text-xs text-[#047857]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#047857]" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-[#047857] hover:text-[#065F46] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-center justify-between gap-3 text-xs text-[#DC2626]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[#DC2626] hover:text-[#991B1B] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl">
            {(
              [
                { id: 'PENDING', label: 'Pending Verification' },
                { id: 'VERIFIED', label: 'Verified' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'ALL', label: 'All Submissions' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#4338CA] shadow-xs border border-[#14131F]/6'
                    : 'text-[#14131F]/60 hover:text-[#14131F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl text-xs font-semibold text-[#14131F] focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] cursor-pointer"
            >
              <option value="all">All Evidence Types</option>
              <option value="certification">Certifications</option>
              <option value="project">Capstone Projects</option>
              <option value="internship">Internships</option>
              <option value="achievement">Honors & Achievements</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#14131F]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, title, issuer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl text-xs text-[#14131F] placeholder:text-[#14131F]/40 focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] w-full sm:w-60"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#14131F]/50 pt-2 border-t border-[#14131F]/6">
          <span>
            Showing {displayedRequests.length} {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} evidence items
          </span>
          {(searchQuery || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
              }}
              className="text-[#4338CA] hover:underline font-semibold cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="p-12 bg-white border border-[#14131F]/8 rounded-2xl text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#14131F]">Loading institutional verification queue...</p>
          <p className="text-xs text-[#14131F]/50">Filtering records scoped to {collegeName}</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="p-12 bg-white border border-dashed border-[#14131F]/15 rounded-2xl text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-[#14131F]/30 mx-auto" />
          <h4 className="text-base font-bold text-[#14131F]">No Evidence Items Found</h4>
          <p className="text-xs text-[#14131F]/60 max-w-md mx-auto">
            {statusFilter === 'PENDING'
              ? 'Great work! There are no pending verification requests awaiting your review.'
              : `No items found matching the selected status (${statusFilter}) or search query.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedRequests.map((item) => {
            const isPending = item.verificationStatus === 'PENDING';
            const isVerified = item.verificationStatus === 'VERIFIED';
            const isRejected = item.verificationStatus === 'REJECTED';
            const isProcessing = isSubmittingAction === item.id;
            const hasEvidence =
              item.hasEvidence !== undefined
                ? item.hasEvidence
                : item.type === 'certification'
                ? Boolean(item.evidence?.fileId || item.evidence?.fileUrl || item.evidence?.credentialUrl)
                : item.type === 'project'
                ? Boolean(item.evidence?.fileId || item.evidence?.githubUrl || item.evidence?.liveUrl)
                : item.type === 'internship'
                ? Boolean(item.evidence?.fileId || item.evidence?.certificateUrl)
                : item.type === 'achievement'
                ? Boolean(item.evidence?.fileId || item.evidence?.credentialUrl)
                : false;

            return (
              <div
                key={item.id}
                className="bg-white border border-[#14131F]/8 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs hover:border-[#14131F]/15 transition-all"
              >
                {/* Header: Student Info & Type Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#14131F]/6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] font-display font-bold text-sm flex items-center justify-center shrink-0 border border-[#4338CA]/15">
                      {item.student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#14131F]">{item.student.name}</h4>
                        <span className="text-xs text-[#14131F]/50">• {item.student.email}</span>
                      </div>
                      <p className="text-xs text-[#14131F]/60">
                        {item.student.degree || 'Degree Program'} • {item.student.department || 'Engineering'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Item Type Pill */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAFAF8] border border-[#14131F]/10 text-[#14131F]/80">
                      {item.type === 'certification' && <Award className="w-3.5 h-3.5 text-[#4338CA]" />}
                      {item.type === 'project' && <Layers className="w-3.5 h-3.5 text-[#047857]" />}
                      {item.type === 'internship' && <Briefcase className="w-3.5 h-3.5 text-[#B45309]" />}
                      {item.type === 'achievement' && <Trophy className="w-3.5 h-3.5 text-[#D97706]" />}
                      <span className="capitalize">{item.type}</span>
                    </span>

                    {/* Status Pill */}
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#047857]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F59E0B]/15 text-[#B45309]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Review</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#DC2626]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Title, Description, Metadata */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-bold text-base text-[#14131F]">{item.title}</h3>
                    {item.metadata.issuer && (
                      <span className="text-xs font-medium text-[#4338CA]">
                        Issuer: {item.metadata.issuer}
                      </span>
                    )}
                    {item.metadata.organization && (
                      <span className="text-xs font-medium text-[#4338CA]">
                        Org: {item.metadata.organization}
                      </span>
                    )}
                    {item.metadata.role && (
                      <span className="text-xs text-[#14131F]/60">Role: {item.metadata.role}</span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-[#14131F]/80 leading-relaxed font-sans line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {/* Badges / Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.metadata.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]/70">
                        {item.metadata.category}
                      </span>
                    )}
                    {item.metadata.dateIssued && (
                      <span className="text-[10px] text-[#14131F]/60">
                        Issued: {item.metadata.dateIssued}
                      </span>
                    )}
                    {item.metadata.duration && (
                      <span className="text-[10px] text-[#14131F]/60">
                        Duration: {item.metadata.duration}
                      </span>
                    )}
                    {item.metadata.technologies && item.metadata.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.metadata.technologies.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white border border-[#14131F]/10 text-[#14131F]/75"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Links Bar */}
                <div className="p-3 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-[#14131F]/60 text-[11px] uppercase tracking-wider">
                      Submitted Evidence:
                    </span>

                    {/* Uploaded File (GridFS) */}
                    {(item.evidence.fileUrl || item.evidence.fileId) && (() => {
                      const targetUrl = item.evidence.fileUrl || `/api/files/${item.evidence.fileId}`;
                      return (
                        <a
                          href={targetUrl}
                          onClick={(e) => {
                            if (targetUrl.startsWith('/')) {
                              e.preventDefault();
                              viewAuthenticatedFile(targetUrl, token || undefined);
                            }
                          }}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#14131F]/10 text-[#4338CA] hover:bg-[#4338CA]/5 font-semibold text-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Uploaded Proof</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    })()}

                    {/* Credential URL */}
                    {item.evidence.credentialUrl && (
                      <a
                        href={
                          item.evidence.credentialUrl.startsWith('http')
                            ? item.evidence.credentialUrl
                            : `https://${item.evidence.credentialUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#4338CA] hover:underline font-semibold"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Verify Credential Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* GitHub URL */}
                    {item.evidence.githubUrl && (
                      <a
                        href={
                          item.evidence.githubUrl.startsWith('http')
                            ? item.evidence.githubUrl
                            : `https://${item.evidence.githubUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#14131F]/80 hover:text-[#14131F] font-semibold"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Inspect Repository</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Live Demo URL */}
                    {item.evidence.liveUrl && (
                      <a
                        href={
                          item.evidence.liveUrl.startsWith('http')
                            ? item.evidence.liveUrl
                            : `https://${item.evidence.liveUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#047857] hover:underline font-semibold"
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Certificate URL */}
                    {item.evidence.certificateUrl && (
                      <a
                        href={
                          item.evidence.certificateUrl.startsWith('http')
                            ? item.evidence.certificateUrl
                            : `https://${item.evidence.certificateUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#4338CA] hover:underline font-semibold"
                      >
                        <span>Certificate URL</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {!hasEvidence ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#EF4444]/10 text-[#DC2626]">
                        <AlertCircle className="w-3 h-3" />
                        Evidence required
                      </span>
                    ) : null}
                  </div>

                  <span className="text-[11px] text-[#14131F]/50">
                    Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Audit Information if reviewed */}
                {item.verifiedBy && (
                  <div className="text-xs text-[#14131F]/60 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>
                      Reviewed by <span className="font-semibold text-[#14131F]">{item.verifiedBy}</span>
                      {item.verifiedAt && ` on ${new Date(item.verifiedAt).toLocaleDateString()}`}
                    </span>
                  </div>
                )}

                {/* Rejection Note if rejected */}
                {isRejected && item.verificationNote && (
                  <div className="p-3 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl space-y-1 text-xs text-[#DC2626]">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Reason for Rejection:
                    </span>
                    <p className="font-sans leading-relaxed">{item.verificationNote}</p>
                  </div>
                )}

                {/* Reviewer Action Buttons */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#14131F]/6">
                    <button
                      type="button"
                      onClick={() => openRejectModal(item)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-white border border-[#EF4444]/30 hover:bg-[#EF4444]/5 text-[#DC2626] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Evidence</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerify(item)}
                      disabled={isProcessing || !hasEvidence}
                      title={
                        !hasEvidence
                          ? 'Portfolio item cannot be verified because no supporting evidence is attached.'
                          : 'Approve & Verify'
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs ${
                        !hasEvidence
                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                          : 'bg-[#10B981] hover:bg-[#059669] text-white cursor-pointer'
                      } disabled:opacity-50`}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve & Verify</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#14131F]/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EF4444]/10 text-[#DC2626] flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#14131F]">Reject Submitted Evidence</h3>
                  <p className="text-xs text-[#14131F]/60">Student: {rejectModalItem.student.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="text-[#14131F]/40 hover:text-[#14131F] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#14131F]/70 leading-relaxed">
              Please state why this evidence cannot be validated (e.g. illegible certificate, unverified issuing body, missing repository code).
              This note will be shown to the student so they can rectify and resubmit.
            </p>

            <form onSubmit={handleSubmitReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#14131F] mb-1.5">
                  Reviewer Feedback / Rejection Reason <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g., Certificate does not contain a verifiable credential URL or completion ID. Please re-upload official grade card or completion PDF."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 bg-[#FAFAF8] border border-[#14131F]/12 rounded-xl text-xs text-[#14131F] placeholder:text-[#14131F]/40 focus:outline-hidden focus:ring-2 focus:ring-[#EF4444]/20 focus:border-[#DC2626]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#14131F]/6">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 bg-[#FAFAF8] border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction === rejectModalItem.id || !rejectReason.trim()}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAction === rejectModalItem.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
