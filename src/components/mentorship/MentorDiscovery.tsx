import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Building2,
  BookOpen,
  Briefcase,
  Send,
  Calendar,
  X,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge, VerifiedSeal } from '../ui/Badge';
import { SectionHeading } from '../ui/SectionHeading';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface MentorProfile {
  id: string;
  name: string;
  college?: string;
  collegeName?: string;
  department?: string;
  designation?: string;
  skills?: string[];
  bio?: string;
  industryExperience?: string;
  researchAreas?: string[];
  isMentorAvailable: boolean;
  mentorAreas?: string[];
  mentorshipTypes?: string[];
  activeMenteesCount?: number;
}

export interface MentorshipRequestItem {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message: string;
  mentorshipArea?: string;
  responseNote?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt?: string;
  mentor: {
    id: string;
    name: string;
    college: string;
    department: string;
    designation: string;
    skills: string[];
    mentorAreas: string[];
    mentorshipTypes: string[];
    isMentorAvailable: boolean;
  };
}

interface MentorDiscoveryProps {
  token: string | null;
  onNavigateTab?: (tab: string) => void;
}

export const MentorDiscovery: React.FC<MentorDiscoveryProps> = ({ token, onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'my_requests'>('directory');
  
  // Directory state
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loadingMentors, setLoadingMentors] = useState<boolean>(true);
  const [mentorError, setMentorError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Requests state
  const [myRequests, setMyRequests] = useState<MentorshipRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Selected mentor for detail modal
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);

  // Request modal state
  const [requestTargetMentor, setRequestTargetMentor] = useState<MentorProfile | null>(null);
  const [requestArea, setRequestArea] = useState<string>('');
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);
  const [requestSubmitError, setRequestSubmitError] = useState<string | null>(null);
  const [requestSubmitSuccess, setRequestSubmitSuccess] = useState<string | null>(null);

  // Fetch mentors directory
  const fetchMentors = async () => {
    setLoadingMentors(true);
    setMentorError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/mentors?availability=true', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch mentors');

      setMentors(data.mentors || []);
    } catch (err: any) {
      console.error('Error fetching mentors:', err);
      setMentorError(err.message || 'Unable to load mentors directory');
    } finally {
      setLoadingMentors(false);
    }
  };

  // Fetch student's own requests
  const fetchMyRequests = async () => {
    if (!token) return;
    setLoadingRequests(true);
    setRequestsError(null);
    try {
      const res = await fetch('/api/mentorship/requests/my', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch your mentorship requests');

      setMyRequests(data.requests || []);
    } catch (err: any) {
      console.error('Error fetching student requests:', err);
      setRequestsError(err.message || 'Unable to load mentorship requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchMentors();
    if (token) {
      fetchMyRequests();
    }
  }, [token]);

  // Derived unique departments and expertise areas from actual data
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    mentors.forEach((m) => {
      if (m.department && m.department.trim()) {
        depts.add(m.department.trim());
      }
    });
    return Array.from(depts);
  }, [mentors]);

  const availableExpertise = useMemo(() => {
    const exp = new Set<string>();
    mentors.forEach((m) => {
      (m.mentorAreas || []).forEach((a) => a && exp.add(a.trim()));
      (m.skills || []).forEach((s) => s && exp.add(s.trim()));
    });
    return Array.from(exp);
  }, [mentors]);

  // Filtered mentors
  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(q);
        const matchesDept = m.department?.toLowerCase().includes(q);
        const matchesDesig = m.designation?.toLowerCase().includes(q);
        const matchesCollege = (m.collegeName || m.college || '').toLowerCase().includes(q);
        const matchesAreas = (m.mentorAreas || []).some((a) => a.toLowerCase().includes(q));
        const matchesSkills = (m.skills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesDept && !matchesDesig && !matchesCollege && !matchesAreas && !matchesSkills) {
          return false;
        }
      }

      // Department filter
      if (departmentFilter !== 'all' && m.department !== departmentFilter) {
        return false;
      }

      // Expertise filter
      if (expertiseFilter !== 'all') {
        const hasArea = (m.mentorAreas || []).includes(expertiseFilter);
        const hasSkill = (m.skills || []).includes(expertiseFilter);
        if (!hasArea && !hasSkill) return false;
      }

      // Mentorship Type filter
      if (typeFilter !== 'all') {
        const hasType = (m.mentorshipTypes || []).includes(typeFilter);
        if (!hasType) return false;
      }

      return true;
    });
  }, [mentors, searchQuery, departmentFilter, expertiseFilter, typeFilter]);

  // Map mentorId to active request status for quick lookup
  const mentorRequestStatusMap = useMemo(() => {
    const map = new Map<string, MentorshipRequestItem>();
    myRequests.forEach((r) => {
      const mId = r.mentor?.id;
      if (mId) {
        map.set(mId, r);
      }
    });
    return map;
  }, [myRequests]);

  // Handle open request modal
  const handleOpenRequestModal = (mentor: MentorProfile) => {
    setRequestTargetMentor(mentor);
    setRequestArea((mentor.mentorAreas && mentor.mentorAreas[0]) || '');
    setRequestMessage('');
    setRequestSubmitError(null);
    setRequestSubmitSuccess(null);
  };

  // Submit mentorship request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setRequestSubmitError('Please sign in as a student to submit a mentorship request');
      return;
    }
    if (!requestTargetMentor) return;

    if (!requestMessage.trim()) {
      setRequestSubmitError('Please enter a short message describing what you need guidance on');
      return;
    }

    setSubmittingRequest(true);
    setRequestSubmitError(null);

    try {
      const res = await fetch('/api/mentorship/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId: requestTargetMentor.id,
          message: requestMessage.trim(),
          mentorshipArea: requestArea.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit mentorship request');
      }

      setRequestSubmitSuccess('Mentorship request sent successfully! Track updates in "My Mentors & Requests".');
      await fetchMyRequests();
      setTimeout(() => {
        setRequestTargetMentor(null);
        setRequestSubmitSuccess(null);
        setActiveSubTab('my_requests');
      }, 1200);
    } catch (err: any) {
      console.error('Submit request error:', err);
      setRequestSubmitError(err.message || 'Failed to send mentorship request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Accepted mentors
  const activeMentors = myRequests.filter((r) => r.status === 'ACCEPTED');

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#14131F]/8 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] text-xs font-semibold border border-[#4338CA]/20 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Human Faculty Mentorship
              </span>
              <span className="text-xs text-[#14131F]/40">•</span>
              <span className="text-xs text-[#14131F]/60 font-medium">Distinct from 24/7 AI Career Mentor</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#14131F] tracking-tight">
              Find a Faculty Mentor
            </h1>
            <p className="text-sm sm:text-[15px] text-[#14131F]/70 mt-1 max-w-2xl leading-relaxed">
              Connect directly with verified academic professors, departmental chairs, and research supervisors
              for capstone guidance, technical internships, and career direction.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchMentors();
                fetchMyRequests();
              }}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingMentors || loadingRequests ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#14131F]/8">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'directory'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-[#14131F]/5'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Discover Mentors</span>
            <span
              className={`text-xs px-2 py-0.2 rounded-full ${
                activeSubTab === 'directory' ? 'bg-white/20 text-white' : 'bg-[#14131F]/10 text-[#14131F]/80'
              }`}
            >
              {mentors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('my_requests')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'my_requests'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-[#14131F]/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>My Mentors & Requests</span>
            {myRequests.length > 0 && (
              <span
                className={`text-xs px-2 py-0.2 rounded-full ${
                  activeSubTab === 'my_requests' ? 'bg-white/20 text-white' : 'bg-[#4338CA]/10 text-[#4338CA]'
                }`}
              >
                {myRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: DISCOVER MENTORS ================= */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-[#14131F]/8 p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#14131F]/40" />
                <input
                  type="text"
                  placeholder="Search by name, expertise, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2 text-sm rounded-xl border border-[#14131F]/15 focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#14131F]/15 bg-white text-[#14131F] focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 transition-all"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expertise Area Filter */}
              <div>
                <select
                  value={expertiseFilter}
                  onChange={(e) => setExpertiseFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#14131F]/15 bg-white text-[#14131F] focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 transition-all"
                >
                  <option value="all">All Specializations</option>
                  {availableExpertise.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mentorship Engagement Type */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#14131F]/15 bg-white text-[#14131F] focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 transition-all"
                >
                  <option value="all">All Mentorship Formats</option>
                  <option value="Live Projects">Live Projects</option>
                  <option value="Internships">Internships</option>
                  <option value="Innovation Challenges">Innovation Challenges</option>
                  <option value="Research Projects">Research Projects</option>
                  <option value="Industry Programs">Industry Programs</option>
                </select>
              </div>
            </div>

            {/* Active Filters summary if any applied */}
            {(searchQuery || departmentFilter !== 'all' || expertiseFilter !== 'all' || typeFilter !== 'all') && (
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#14131F]/6 text-xs text-[#14131F]/70">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#14131F]">Active Filters:</span>
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/10">
                      Keyword: "{searchQuery}"
                    </span>
                  )}
                  {departmentFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/10">
                      Dept: {departmentFilter}
                    </span>
                  )}
                  {expertiseFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/10">
                      Area: {expertiseFilter}
                    </span>
                  )}
                  {typeFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/10">
                      Format: {typeFilter}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDepartmentFilter('all');
                    setExpertiseFilter('all');
                    setTypeFilter('all');
                  }}
                  className="text-xs text-[#4338CA] hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {mentorError && (
            <div className="p-4 rounded-xl bg-[#E11D48]/10 border border-[#E11D48]/20 text-[#E11D48] flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-sm font-medium">{mentorError}</div>
              <Button variant="ghost" size="sm" onClick={fetchMentors} className="ml-auto text-xs">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loadingMentors ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8">
              <RefreshCw className="w-8 h-8 text-[#4338CA] animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#14131F]">Loading Faculty Mentors...</p>
              <p className="text-xs text-[#14131F]/50 mt-1">Retrieving eligible academic advisors</p>
            </div>
          ) : filteredMentors.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center bg-white rounded-2xl border border-[#14131F]/8">
              <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-[#14131F]">No mentors match your search</h3>
              <p className="text-sm text-[#14131F]/60 mt-1 max-w-md mx-auto">
                Try clearing your search terms or relaxing department and expertise filters to discover more faculty advisors.
              </p>
              <div className="mt-5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setDepartmentFilter('all');
                    setExpertiseFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          ) : (
            /* Mentors Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMentors.map((mentor) => {
                const existingRequest = mentorRequestStatusMap.get(mentor.id);
                return (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-2xl border border-[#14131F]/8 hover:border-[#4338CA]/30 transition-all p-5 shadow-xs flex flex-col justify-between group hover:shadow-md"
                  >
                    <div>
                      {/* Top Row: Avatar & Status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] text-white flex items-center justify-center font-display font-bold text-lg shadow-xs shrink-0">
                            {mentor.name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-[17px] text-[#14131F] group-hover:text-[#4338CA] transition-colors leading-tight">
                              {mentor.name}
                            </h3>
                            <p className="text-xs text-[#14131F]/60 mt-0.5">
                              {mentor.designation || 'Faculty Member'}
                            </p>
                          </div>
                        </div>

                        {/* Availability Pill */}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Available
                        </span>
                      </div>

                      {/* Department & College */}
                      <div className="space-y-1 text-xs text-[#14131F]/70 mb-3.5">
                        {mentor.department && (
                          <div className="flex items-center gap-1.5 truncate">
                            <BookOpen className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                            <span className="truncate">{mentor.department}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                          <span className="truncate">{mentor.collegeName || mentor.college || 'Engineering College'}</span>
                        </div>
                      </div>

                      {/* Bio summary excerpt */}
                      {mentor.bio && (
                        <p className="text-xs text-[#14131F]/70 line-clamp-2 mb-3.5 leading-relaxed">
                          {mentor.bio}
                        </p>
                      )}

                      {/* Expertise Areas */}
                      {mentor.mentorAreas && mentor.mentorAreas.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold text-[#14131F]/50 uppercase tracking-wider mb-1.5">
                            Mentorship Focus
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.mentorAreas.slice(0, 3).map((area, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-[#4338CA]/8 text-[#4338CA] text-[11px] font-medium border border-[#4338CA]/15"
                              >
                                {area}
                              </span>
                            ))}
                            {mentor.mentorAreas.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-[#14131F]/50 font-medium self-center">
                                +{mentor.mentorAreas.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Engagement Formats */}
                      {mentor.mentorshipTypes && mentor.mentorshipTypes.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {mentor.mentorshipTypes.slice(0, 2).map((type, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]/70 text-[10px] font-medium"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3.5 border-t border-[#14131F]/8 flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMentor(mentor)}
                        className="text-xs text-[#14131F]/70 hover:text-[#14131F]"
                      >
                        View Profile
                      </Button>

                      {existingRequest ? (
                        existingRequest.status === 'PENDING' ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        ) : existingRequest.status === 'ACCEPTED' ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Mentor
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenRequestModal(mentor)}
                            className="text-xs"
                          >
                            Re-apply
                          </Button>
                        )
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenRequestModal(mentor)}
                          className="text-xs"
                          icon={<Send className="w-3 h-3" />}
                        >
                          Request Mentorship
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: MY MENTORS & REQUESTS ================= */}
      {activeSubTab === 'my_requests' && (
        <div className="space-y-6">
          {/* Active Mentors Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-display font-bold text-xl text-[#14131F]">My Active Mentors</h2>
            </div>

            {activeMentors.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-[#14131F]/8 text-center">
                <p className="text-sm text-[#14131F]/60">
                  You do not have any active accepted faculty mentorships yet.
                </p>
                <div className="mt-3">
                  <Button variant="secondary" size="sm" onClick={() => setActiveSubTab('directory')}>
                    Browse Mentors Directory
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMentors.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 bg-white rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-base text-[#14131F]">{req.mentor?.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-[#14131F]/60">
                            {req.mentor?.designation} • {req.mentor?.department}
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                          {req.mentor?.name?.charAt(0) || 'M'}
                        </div>
                      </div>

                      <div className="text-xs text-[#14131F]/70 space-y-1 my-2.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#14131F]/40" />
                          <span>{req.mentor?.college}</span>
                        </div>
                        {req.mentorshipArea && (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#14131F]/40" />
                            <span>Focus: <strong className="text-[#14131F]">{req.mentorshipArea}</strong></span>
                          </div>
                        )}
                      </div>

                      {req.responseNote && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 mt-2">
                          <span className="font-semibold block mb-0.5">Mentor's Note:</span>
                          "{req.responseNote}"
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#14131F]/8 text-[11px] text-[#14131F]/50 flex items-center justify-between">
                      <span>Accepted on {req.respondedAt ? new Date(req.respondedAt).toLocaleDateString() : 'Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mentorship Requests History Section */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[#4338CA]" />
              <h2 className="font-display font-bold text-xl text-[#14131F]">Mentorship Request History</h2>
            </div>

            {loadingRequests ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#14131F]/8">
                <RefreshCw className="w-6 h-6 text-[#4338CA] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#14131F]/60">Loading your requests...</p>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#14131F]/8">
                <p className="text-sm text-[#14131F]/60">No mentorship requests yet.</p>
                <div className="mt-3">
                  <Button variant="primary" size="sm" onClick={() => setActiveSubTab('directory')}>
                    Explore Mentors & Apply
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#14131F]/8 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#14131F]/8 bg-[#FAFAF8] text-xs font-semibold text-[#14131F]/60">
                        <th className="p-3.5 pl-5">Mentor</th>
                        <th className="p-3.5">Department</th>
                        <th className="p-3.5">Focus Area</th>
                        <th className="p-3.5">Date Sent</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 pr-5">Mentor Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14131F]/6">
                      {myRequests.map((req) => {
                        const statusBadge =
                          req.status === 'ACCEPTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ACCEPTED
                            </span>
                          ) : req.status === 'REJECTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              REJECTED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              PENDING
                            </span>
                          );

                        return (
                          <tr key={req.id} className="hover:bg-[#14131F]/2 transition-colors">
                            <td className="p-3.5 pl-5">
                              <div className="font-semibold text-[#14131F]">{req.mentor?.name}</div>
                              <div className="text-xs text-[#14131F]/50">{req.mentor?.designation}</div>
                            </td>
                            <td className="p-3.5 text-xs text-[#14131F]/70">{req.mentor?.department || '—'}</td>
                            <td className="p-3.5 text-xs font-medium text-[#14131F]">
                              {req.mentorshipArea || 'General Mentorship'}
                            </td>
                            <td className="p-3.5 text-xs text-[#14131F]/60">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3.5">{statusBadge}</td>
                            <td className="p-3.5 pr-5 text-xs text-[#14131F]/70 max-w-xs truncate">
                              {req.responseNote ? (
                                <span className="text-[#14131F] font-medium" title={req.responseNote}>
                                  "{req.responseNote}"
                                </span>
                              ) : req.status === 'PENDING' ? (
                                <span className="text-[#14131F]/40 italic">Awaiting faculty review</span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MENTOR DETAIL MODAL ================= */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedMentor(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F]/60 hover:text-[#14131F] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4338CA] to-[#6366F1] text-white flex items-center justify-center font-display font-bold text-2xl shadow-xs shrink-0">
                {selectedMentor.name?.charAt(0) || 'M'}
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl text-[#14131F]">{selectedMentor.name}</h2>
                <p className="text-sm text-[#14131F]/70 font-medium">
                  {selectedMentor.designation || 'Faculty Member'} • {selectedMentor.department}
                </p>
                <p className="text-xs text-[#14131F]/50 mt-0.5">
                  {selectedMentor.collegeName || selectedMentor.college}
                </p>
              </div>
            </div>

            {selectedMentor.bio && (
              <div className="mb-5 p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/6 text-sm text-[#14131F]/80 leading-relaxed">
                <span className="font-semibold block text-[#14131F] mb-1">Professional Profile</span>
                {selectedMentor.bio}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Mentorship Focus Areas */}
              <div className="p-4 rounded-xl border border-[#14131F]/8 bg-white">
                <h4 className="text-xs font-bold text-[#14131F]/50 uppercase tracking-wider mb-2">
                  Mentorship Specializations
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedMentor.mentorAreas || []).length > 0 ? (
                    selectedMentor.mentorAreas?.map((area, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#4338CA]/10 text-[#4338CA] text-xs font-semibold border border-[#4338CA]/20"
                      >
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#14131F]/50">General Engineering Mentorship</span>
                  )}
                </div>
              </div>

              {/* Engagement Formats */}
              <div className="p-4 rounded-xl border border-[#14131F]/8 bg-white">
                <h4 className="text-xs font-bold text-[#14131F]/50 uppercase tracking-wider mb-2">
                  Preferred Formats
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedMentor.mentorshipTypes || []).length > 0 ? (
                    selectedMentor.mentorshipTypes?.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#14131F]/6 text-[#14131F] text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#14131F]/50">Open to all formats</span>
                  )}
                </div>
              </div>
            </div>

            {/* Experience & Skills */}
            {selectedMentor.industryExperience && (
              <div className="mb-4 text-xs text-[#14131F]/70">
                <strong className="text-[#14131F]">Experience:</strong> {selectedMentor.industryExperience}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-[#14131F]/8 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedMentor(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedMentor(null);
                  handleOpenRequestModal(selectedMentor);
                }}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Request Mentorship
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REQUEST MENTORSHIP FORM MODAL ================= */}
      {requestTargetMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl max-w-xl w-full p-6 relative">
            <button
              onClick={() => setRequestTargetMentor(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F]/60 hover:text-[#14131F] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold text-[#4338CA] uppercase tracking-wider">
                Mentorship Application
              </span>
              <h2 className="font-display font-bold text-xl text-[#14131F] mt-0.5">
                Request Mentorship with {requestTargetMentor.name}
              </h2>
              <p className="text-xs text-[#14131F]/60 mt-1">
                {requestTargetMentor.designation} • {requestTargetMentor.department} • {requestTargetMentor.collegeName || requestTargetMentor.college}
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Mentorship Area */}
              <div>
                <label className="block text-xs font-semibold text-[#14131F] mb-1.5">
                  Mentorship Focus Area
                </label>
                {(requestTargetMentor.mentorAreas || []).length > 0 ? (
                  <select
                    value={requestArea}
                    onChange={(e) => setRequestArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#14131F]/15 bg-white text-[#14131F] focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15"
                  >
                    {requestTargetMentor.mentorAreas?.map((area, idx) => (
                      <option key={idx} value={area}>
                        {area}
                      </option>
                    ))}
                    <option value="Other">Other / General Mentorship</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Distributed Systems, Capstone Guidance, Career Path"
                    value={requestArea}
                    onChange={(e) => setRequestArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#14131F]/15 bg-white text-[#14131F] focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15"
                  />
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-[#14131F] mb-1.5">
                  Your Message & Goals <span className="text-[#E11D48]">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Introduce yourself, explain why you are seeking mentorship from this faculty member, your career/project goals, and what specific guidance you need..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#14131F]/15 focus:outline-hidden focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 transition-all resize-none"
                  required
                />
                <p className="text-[11px] text-[#14131F]/50 mt-1">
                  Keep it clear and professional. This will be reviewed directly by the faculty member.
                </p>
              </div>

              {/* Error / Success states */}
              {requestSubmitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{requestSubmitError}</span>
                </div>
              )}

              {requestSubmitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{requestSubmitSuccess}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-[#14131F]/8 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRequestTargetMentor(null)}
                  disabled={submittingRequest}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingRequest || !requestMessage.trim()}
                  icon={submittingRequest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                >
                  {submittingRequest ? 'Sending Request...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
