import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Mail,
  BookOpen,
  Building2,
  Send,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  GraduationCap,
  Calendar,
  Check,
  X,
  Plus,
  Tag,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  college?: string;
  degree?: string;
  targetRole?: string;
  skills?: string[];
  bio?: string;
  cgpa?: number;
  githubUrl?: string;
  linkedinUrl?: string;
}

interface IncomingRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message: string;
  mentorshipArea?: string;
  responseNote?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt?: string;
  student: StudentInfo;
}

interface ActiveMenteeItem {
  relationshipId: string;
  status: string;
  acceptedDate: string;
  mentorshipArea?: string;
  initialMessage?: string;
  student: StudentInfo;
}

interface AcademicianMentorshipViewProps {
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

export const AcademicianMentorshipView: React.FC<AcademicianMentorshipViewProps> = ({
  user,
  token,
  updateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'mentees' | 'settings'>('requests');

  // Requests state
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');

  // Active Mentees state
  const [mentees, setMentees] = useState<ActiveMenteeItem[]>([]);
  const [loadingMentees, setLoadingMentees] = useState<boolean>(false);
  const [menteesError, setMenteesError] = useState<string | null>(null);

  // Response Modal State (for Accept or Reject)
  const [respondingRequest, setRespondingRequest] = useState<IncomingRequest | null>(null);
  const [responseAction, setResponseAction] = useState<'accept' | 'reject'>('accept');
  const [responseNote, setResponseNote] = useState<string>('');
  const [submittingResponse, setSubmittingResponse] = useState<boolean>(false);
  const [responseModalError, setResponseModalError] = useState<string | null>(null);

  // Settings State (reusing from existing mentor profile logic)
  const [isMentorAvailable, setIsMentorAvailable] = useState<boolean>(Boolean(user?.isMentorAvailable));
  const [mentorAreas, setMentorAreas] = useState<string[]>(
    Array.isArray(user?.mentorAreas) ? [...user.mentorAreas] : []
  );
  const [mentorshipTypes, setMentorshipTypes] = useState<string[]>(
    Array.isArray(user?.mentorshipTypes) ? [...user.mentorshipTypes] : []
  );
  const [newAreaInput, setNewAreaInput] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Fetch incoming requests
  const fetchRequests = async () => {
    if (!token) return;
    setLoadingRequests(true);
    setRequestsError(null);
    try {
      const res = await fetch('/api/mentorship/requests/incoming', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch mentorship requests');

      setRequests(data.requests || []);
    } catch (err: any) {
      console.error('Error fetching incoming requests:', err);
      setRequestsError(err.message || 'Unable to load mentorship requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch active mentees
  const fetchMentees = async () => {
    if (!token) return;
    setLoadingMentees(true);
    setMenteesError(null);
    try {
      const res = await fetch('/api/mentorship/my-mentees', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch mentees');

      setMentees(data.mentees || []);
    } catch (err: any) {
      console.error('Error fetching mentees:', err);
      setMenteesError(err.message || 'Unable to load active mentees');
    } finally {
      setLoadingMentees(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMentees();
  }, [token]);

  // Handle Accept / Reject submission
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !respondingRequest) return;

    setSubmittingResponse(true);
    setResponseModalError(null);

    try {
      const endpoint =
        responseAction === 'accept'
          ? `/api/mentorship/requests/${respondingRequest.id}/accept`
          : `/api/mentorship/requests/${respondingRequest.id}/reject`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          responseNote: responseNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${responseAction} request`);
      }

      // Refresh requests and mentees
      await Promise.all([fetchRequests(), fetchMentees()]);

      setRespondingRequest(null);
      setResponseNote('');
    } catch (err: any) {
      console.error(`Error during ${responseAction}:`, err);
      setResponseModalError(err.message || `Failed to ${responseAction} request`);
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    if (!token) return;
    setSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      const res = await fetch('/api/academician/mentor-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isMentorAvailable,
          mentorAreas,
          mentorshipTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update mentorship settings');
      }

      updateUser(data.user);
      setSettingsSuccess('Mentorship preferences updated successfully.');
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setSettingsError(err.message || 'Failed to update mentorship settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddArea = (area: string) => {
    const trimmed = area.trim();
    if (trimmed && !mentorAreas.includes(trimmed)) {
      setMentorAreas((prev) => [...prev, trimmed]);
    }
    setNewAreaInput('');
  };

  const handleRemoveArea = (area: string) => {
    setMentorAreas((prev) => prev.filter((a) => a !== area));
  };

  const toggleMentorshipType = (typeId: string) => {
    setMentorshipTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (requestStatusFilter === 'ALL') return true;
    return r.status === requestStatusFilter;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#14131F]/8 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] text-xs font-semibold border border-[#4338CA]/20 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                Faculty Mentorship Center
              </span>
              <span className="text-xs text-[#14131F]/40">•</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isMentorAvailable
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#14131F]/5 text-[#14131F]/60'
                }`}
              >
                {isMentorAvailable ? 'Accepting Requests' : 'Requests Paused'}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] tracking-tight">
              Mentorship Requests & Mentees
            </h1>
            <p className="text-sm text-[#14131F]/70 mt-1 max-w-2xl leading-relaxed">
              Manage incoming student mentorship applications, guide active mentees on live projects and research,
              and configure your mentorship capacity.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchRequests();
                fetchMentees();
              }}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingRequests || loadingMentees ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#14131F]/8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-[#14131F]/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mentorship Requests</span>
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-0.2 rounded-full bg-amber-400 text-[#14131F] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mentees')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'mentees'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-[#14131F]/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Mentees</span>
            <span
              className={`text-xs px-2 py-0.2 rounded-full ${
                activeTab === 'mentees' ? 'bg-white/20 text-white' : 'bg-[#14131F]/10 text-[#14131F]/80'
              }`}
            >
              {mentees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-[#14131F]/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Availability & Preferences</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: INCOMING REQUESTS ================= */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Status Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#14131F]/8 p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[#14131F]/60 mr-1">Filter Status:</span>
              {(['PENDING', 'ACCEPTED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setRequestStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    requestStatusFilter === st
                      ? 'bg-[#4338CA] text-white'
                      : 'bg-[#14131F]/5 text-[#14131F]/70 hover:bg-[#14131F]/10'
                  }`}
                >
                  {st === 'ALL' ? 'All Requests' : st}
                  {st === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#14131F]/60">
              Showing {filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'}
            </div>
          </div>

          {requestsError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{requestsError}</span>
              <Button variant="ghost" size="sm" onClick={fetchRequests} className="ml-auto text-xs">
                Retry
              </Button>
            </div>
          )}

          {loadingRequests ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8">
              <RefreshCw className="w-8 h-8 text-[#4338CA] animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#14131F]">Loading Mentorship Requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8">
              <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-[#14131F]">
                No {requestStatusFilter !== 'ALL' ? requestStatusFilter.toLowerCase() : ''} requests found
              </h3>
              <p className="text-sm text-[#14131F]/60 mt-1 max-w-md mx-auto">
                {requestStatusFilter === 'PENDING'
                  ? 'You have reviewed all incoming student mentorship requests! New applications from students will appear here.'
                  : 'No mentorship requests match the selected status filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#14131F]/8 p-5 shadow-xs hover:border-[#4338CA]/25 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Student info & details */}
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] text-white flex items-center justify-center font-display font-bold text-lg shadow-xs shrink-0">
                          {req.student?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-bold text-lg text-[#14131F]">
                              {req.student?.name || 'Student Candidate'}
                            </h3>
                            {req.status === 'PENDING' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Pending Action
                              </span>
                            )}
                            {req.status === 'ACCEPTED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Accepted
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                Rejected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#14131F]/60 mt-0.5">
                            {req.student?.degree || 'Undergraduate'} • {req.student?.college || 'Engineering Student'}
                          </p>
                        </div>
                      </div>

                      {/* Mentorship Area & Target Role */}
                      <div className="flex items-center gap-3 text-xs text-[#14131F]/70 flex-wrap">
                        {req.mentorshipArea && (
                          <span className="px-2.5 py-1 rounded-md bg-[#4338CA]/8 text-[#4338CA] font-semibold border border-[#4338CA]/15">
                            Area: {req.mentorshipArea}
                          </span>
                        )}
                        {req.student?.targetRole && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-[#14131F]/40" />
                            Target: {req.student.targetRole}
                          </span>
                        )}
                        {req.student?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-[#14131F]/40" />
                            {req.student.email}
                          </span>
                        )}
                      </div>

                      {/* Student Message */}
                      <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 text-xs text-[#14131F]/80 leading-relaxed">
                        <span className="font-semibold block text-[#14131F] mb-1">
                          Student's Request Message:
                        </span>
                        "{req.message}"
                      </div>

                      {/* Response note if processed */}
                      {req.responseNote && (
                        <div
                          className={`p-3 rounded-xl text-xs ${
                            req.status === 'ACCEPTED'
                              ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-900'
                              : 'bg-rose-50/70 border border-rose-200 text-rose-900'
                          }`}
                        >
                          <span className="font-semibold block mb-0.5">Your Response Note:</span>
                          "{req.responseNote}"
                        </div>
                      )}

                      {/* Student Skills Badges */}
                      {req.student?.skills && req.student.skills.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#14131F]/50">Skills:</span>
                          {req.student.skills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]/70 text-[11px]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Date & Actions */}
                    <div className="flex flex-col items-end justify-between shrink-0 gap-3 border-t lg:border-t-0 pt-3 lg:pt-0">
                      <span className="text-xs text-[#14131F]/50 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>

                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setRespondingRequest(req);
                              setResponseAction('reject');
                              setResponseNote('');
                              setResponseModalError(null);
                            }}
                            className="text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                            icon={<X className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setRespondingRequest(req);
                              setResponseAction('accept');
                              setResponseNote('');
                              setResponseModalError(null);
                            }}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                            icon={<Check className="w-3.5 h-3.5" />}
                          >
                            Accept Request
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: MY MENTEES ================= */}
      {activeTab === 'mentees' && (
        <div className="space-y-6">
          {menteesError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{menteesError}</span>
              <Button variant="ghost" size="sm" onClick={fetchMentees} className="ml-auto text-xs">
                Retry
              </Button>
            </div>
          )}

          {loadingMentees ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8">
              <RefreshCw className="w-8 h-8 text-[#4338CA] animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#14131F]">Loading Active Mentees...</p>
            </div>
          ) : mentees.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-[#14131F]">No active mentees yet</h3>
              <p className="text-sm text-[#14131F]/60 mt-1 max-w-md mx-auto">
                When you accept incoming student mentorship applications, the students will be cataloged here as your active mentees.
              </p>
              {pendingCount > 0 && (
                <div className="mt-4">
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('requests')}>
                    Review {pendingCount} Pending Request{pendingCount === 1 ? '' : 's'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {mentees.map((item) => (
                <div
                  key={item.relationshipId}
                  className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-display font-bold text-lg shrink-0">
                          {item.student?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base text-[#14131F]">
                            {item.student?.name}
                          </h3>
                          <p className="text-xs text-[#14131F]/60">
                            {item.student?.degree || 'Undergraduate Student'}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Mentee
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#14131F]/70 mb-3.5">
                      {item.student?.college && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                          <span className="truncate">{item.student.college}</span>
                        </div>
                      )}
                      {item.student?.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                          <a href={`mailto:${item.student.email}`} className="text-[#4338CA] hover:underline">
                            {item.student.email}
                          </a>
                        </div>
                      )}
                      {item.mentorshipArea && (
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                          <span>
                            Mentorship Area: <strong className="text-[#14131F]">{item.mentorshipArea}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {item.initialMessage && (
                      <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 text-xs text-[#14131F]/80 mb-3">
                        <span className="font-semibold block text-[#14131F] mb-0.5">Initial Project / Goal:</span>
                        "{item.initialMessage}"
                      </div>
                    )}

                    {item.student?.skills && item.student.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.student.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]/70 text-[11px]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#14131F]/8 flex items-center justify-between text-[11px] text-[#14131F]/50">
                    <span>
                      Mentorship active since {item.acceptedDate ? new Date(item.acceptedDate).toLocaleDateString() : 'recent'}
                    </span>
                    {item.student?.email && (
                      <a
                        href={`mailto:${item.student.email}?subject=Mentorship Guidance Update`}
                        className="text-[#4338CA] font-semibold hover:underline flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        Send Email
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: AVAILABILITY & SETTINGS ================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-[#14131F]/8 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="font-display font-bold text-xl text-[#14131F]">
              Mentorship Preferences & Availability
            </h2>
            <p className="text-sm text-[#14131F]/60 mt-1">
              Configure whether students can discover your profile and send you new mentorship requests.
            </p>
          </div>

          {settingsSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          {settingsError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{settingsError}</span>
            </div>
          )}

          {/* Toggle Availability */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#14131F]/8 bg-[#FAFAF8]">
            <div>
              <h3 className="text-sm font-semibold text-[#14131F]">
                Accept New Student Mentorship Requests
              </h3>
              <p className="text-xs text-[#14131F]/60 mt-0.5">
                When turned on, your profile appears in the student "Find a Mentor" directory.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMentorAvailable}
                onChange={(e) => setIsMentorAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4338CA]" />
            </label>
          </div>

          {/* Engagement Types */}
          <div>
            <label className="block text-sm font-semibold text-[#14131F] mb-1">
              Preferred Engagement Formats
            </label>
            <p className="text-xs text-[#14131F]/60 mb-3">
              Select the formats through which you are open to mentoring student engineers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MENTORSHIP_ENGAGEMENT_TYPES.map((type) => {
                const isSelected = mentorshipTypes.includes(type.id);
                return (
                  <div
                    key={type.id}
                    onClick={() => toggleMentorshipType(type.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-[#4338CA] bg-[#4338CA]/5 shadow-xs'
                        : 'border-[#14131F]/8 hover:border-[#14131F]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs text-[#14131F]">{type.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#4338CA]" />}
                    </div>
                    <p className="text-[11px] text-[#14131F]/60 leading-relaxed">{type.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mentor Areas */}
          <div>
            <label className="block text-sm font-semibold text-[#14131F] mb-1">
              Mentorship Expertise Areas & Topics
            </label>
            <p className="text-xs text-[#14131F]/60 mb-3">
              Specify technical domains where you can provide high-impact guidance.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {mentorAreas.map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-1 rounded-lg bg-[#4338CA]/10 text-[#4338CA] text-xs font-semibold border border-[#4338CA]/20 flex items-center gap-1.5"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(area)}
                    className="hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Input to add area */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add custom topic (e.g. Distributed Consensus, Cloud Native)"
                value={newAreaInput}
                onChange={(e) => setNewAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddArea(newAreaInput);
                  }
                }}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#14131F]/15 focus:outline-hidden focus:border-[#4338CA]"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddArea(newAreaInput)}
                disabled={!newAreaInput.trim()}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add
              </Button>
            </div>

            {/* Popular presets */}
            <div className="mt-3">
              <span className="text-[11px] text-[#14131F]/50 font-medium mr-2">Suggestions:</span>
              <div className="inline-flex flex-wrap gap-1 mt-1">
                {POPULAR_EXPERTISE_AREAS.filter((p) => !mentorAreas.includes(p)).slice(0, 6).map((pop) => (
                  <button
                    key={pop}
                    type="button"
                    onClick={() => handleAddArea(pop)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]/70 hover:bg-[#14131F]/10 transition-colors cursor-pointer"
                  >
                    + {pop}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#14131F]/8 flex items-center justify-end gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              icon={savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            >
              {savingSettings ? 'Saving...' : 'Save Mentorship Profile'}
            </Button>
          </div>
        </div>
      )}

      {/* ================= ACCEPT / REJECT RESPONSE MODAL ================= */}
      {respondingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setRespondingRequest(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F]/60 hover:text-[#14131F] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  responseAction === 'accept' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {responseAction === 'accept' ? 'Accept Mentorship Request' : 'Decline Mentorship Request'}
              </span>
              <h2 className="font-display font-bold text-xl text-[#14131F] mt-0.5">
                {responseAction === 'accept' ? 'Accept' : 'Decline'} {respondingRequest.student?.name}
              </h2>
              <p className="text-xs text-[#14131F]/60 mt-1">
                {respondingRequest.student?.degree} • {respondingRequest.student?.college}
              </p>
            </div>

            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 text-xs text-[#14131F]/80">
                <strong className="block text-[#14131F] mb-0.5">Student's Request:</strong>
                "{respondingRequest.message}"
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14131F] mb-1.5">
                  {responseAction === 'accept' ? 'Welcome Note / Next Steps (Optional)' : 'Feedback / Reason (Optional)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    responseAction === 'accept'
                      ? 'e.g. Welcome! Please email me your current draft or join our weekly lab meeting on Tuesdays...'
                      : 'e.g. Currently supervising maximum capstone squads this semester, but encourage you to connect again next term...'
                  }
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#14131F]/15 focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 transition-all resize-none"
                />
              </div>

              {responseModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{responseModalError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#14131F]/8 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRespondingRequest(null)}
                  disabled={submittingResponse}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingResponse}
                  className={responseAction === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
                  icon={
                    submittingResponse ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : responseAction === 'accept' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {submittingResponse
                    ? 'Processing...'
                    : responseAction === 'accept'
                    ? 'Confirm Acceptance'
                    : 'Confirm Decline'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
