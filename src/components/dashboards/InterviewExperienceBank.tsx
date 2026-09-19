import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Send,
  Trash2,
  Eye,
  Briefcase,
  Layers,
  RefreshCw,
  BookOpen,
  X,
  FileText,
  UserCheck,
  Check,
  Terminal,
  MessageSquare,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge, VerifiedSeal, SectionHeading, RecordCard } from '../ui';

export interface ExperienceQuestion {
  text: string;
  type: 'theory' | 'coding';
}

export interface ExperienceItem {
  _id: string;
  studentId: any;
  company: string;
  role: string;
  interviewDate: string;
  roundsDescription: string;
  questionsAsked: Array<ExperienceQuestion | string>;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  outcome: 'Selected' | 'Rejected' | 'Awaiting Result';
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  authorName?: string;
  authorCollege?: string;
  authorRole?: string;
}

export const normalizeQuestionItem = (q: any): ExperienceQuestion => {
  if (typeof q === 'string') {
    return { text: q, type: 'theory' };
  }
  if (q && typeof q === 'object') {
    return {
      text: q.text || '',
      type: q.type === 'coding' ? 'coding' : 'theory',
    };
  }
  return { text: '', type: 'theory' };
};

export interface ParsedRound {
  title: string;
  description: string;
}

/**
 * Parses freeform round description into distinct structured rounds
 * for structured scanning instead of an unformatted wall of text.
 */
export const parseRounds = (text: string): ParsedRound[] => {
  if (!text || !text.trim()) return [];

  // Match patterns like "Round 1:", "Round 1 -", "1. Round:", etc.
  const roundRegex = /(?:^|\n+)(Round\s*\d+[^:\n-]*[:\-–—]?|[0-9]+\.\s+Round[^:\n-]*[:\-–—]?)/i;
  const parts = text.split(roundRegex).filter(Boolean);

  if (parts.length >= 2) {
    const rounds: ParsedRound[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i]?.trim().replace(/[:\-–—]$/, '') || `Round ${Math.floor(i / 2) + 1}`;
      const description = parts[i + 1]?.trim() || '';
      if (title || description) {
        rounds.push({ title, description });
      }
    }
    if (rounds.length > 0) return rounds;
  }

  // Fallback: split by double line breaks if multiple paragraphs
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    return paragraphs.map((p, idx) => ({
      title: `Round ${idx + 1}`,
      description: p,
    }));
  }

  return [{ title: 'Overview & Rounds', description: text.trim() }];
};

const POPULAR_COMPANIES = [
  'All Companies',
  'Google',
  'Microsoft',
  'Amazon',
  'Razorpay',
  'Swiggy',
  'Flipkart',
  'Zomato',
  'Atlassian',
  'Adobe',
  'Oracle',
  'TCS',
  'Infosys',
];

export const InterviewExperienceBank: React.FC = () => {
  const { token } = useAuth();

  // Sub-view: 'browse' | 'submit' | 'mine'
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'submit' | 'mine'>('browse');

  // Approved experiences state
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // My submissions state
  const [myExperiences, setMyExperiences] = useState<ExperienceItem[]>([]);
  const [loadingMine, setLoadingMine] = useState<boolean>(false);

  // Filters & Search for Browse Feed
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('All Companies');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');

  // Modal / Detailed View
  const [selectedExperience, setSelectedExperience] = useState<ExperienceItem | null>(null);

  // Submission Form State
  const [formCompany, setFormCompany] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [formOutcome, setFormOutcome] = useState<'Selected' | 'Rejected' | 'Awaiting Result'>('Selected');
  const [formRoundsDescription, setFormRoundsDescription] = useState<string>('');
  const [formQuestions, setFormQuestions] = useState<Array<{ text: string; type: 'theory' | 'coding' }>>([
    { text: '', type: 'theory' },
  ]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Fetch approved experiences
  const fetchApprovedExperiences = async (companyName?: string) => {
    try {
      setLoadingExperiences(true);
      setFetchError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/experiences';
      const params = new URLSearchParams();
      if (companyName && companyName !== 'All Companies') {
        params.append('company', companyName);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setExperiences(data.experiences || []);
      } else {
        setFetchError(data.error || 'Failed to load approved interview experiences');
      }
    } catch (err: any) {
      console.error('Error fetching approved experiences:', err);
      setFetchError('Unable to connect to the experience bank server.');
    } finally {
      setLoadingExperiences(false);
    }
  };

  // Fetch my submissions
  const fetchMySubmissions = async () => {
    try {
      setLoadingMine(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/experiences/mine', { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyExperiences(data.experiences || []);
      }
    } catch (err: any) {
      console.error('Error fetching my experiences:', err);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    fetchApprovedExperiences(selectedCompanyFilter);
    fetchMySubmissions();
  }, [token]);

  // Trigger search / filter on approved experiences
  const handleFilterChange = (company: string) => {
    setSelectedCompanyFilter(company);
    fetchApprovedExperiences(company);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCompanyFilter('All Companies');
    setDifficultyFilter('ALL');
    setOutcomeFilter('ALL');
    fetchApprovedExperiences('All Companies');
  };

  // Growable questions handlers
  const handleAddQuestion = () => {
    setFormQuestions([...formQuestions, { text: '', type: 'theory' }]);
  };

  const handleQuestionTextChange = (index: number, val: string) => {
    const updated = [...formQuestions];
    updated[index] = { ...updated[index], text: val };
    setFormQuestions(updated);
  };

  const handleQuestionTypeChange = (index: number, type: 'theory' | 'coding') => {
    const updated = [...formQuestions];
    updated[index] = { ...updated[index], type };
    setFormQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    if (formQuestions.length === 1) {
      setFormQuestions([{ text: '', type: 'theory' }]);
      return;
    }
    setFormQuestions(formQuestions.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmitExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formCompany.trim()) {
      setSubmitError('Please specify the company name.');
      return;
    }
    if (!formRole.trim()) {
      setSubmitError('Please specify the role or position title.');
      return;
    }
    if (!formRoundsDescription.trim()) {
      setSubmitError('Please detail the rounds structure and process.');
      return;
    }

    try {
      setSubmitting(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const cleanedQuestions = formQuestions
        .filter((q) => q.text.trim().length > 0)
        .map((q) => ({
          text: q.text.trim(),
          type: q.type === 'coding' ? 'coding' : 'theory',
        }));

      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          company: formCompany.trim(),
          role: formRole.trim(),
          interviewDate: formDate,
          difficulty: formDifficulty,
          outcome: formOutcome,
          roundsDescription: formRoundsDescription.trim(),
          questionsAsked: cleanedQuestions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(true);
        // Reset form
        setFormCompany('');
        setFormRole('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormDifficulty('Medium');
        setFormOutcome('Selected');
        setFormRoundsDescription('');
        setFormQuestions([{ text: '', type: 'theory' }]);

        // Refresh my submissions
        await fetchMySubmissions();

        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveSubTab('mine');
        }, 1500);
      } else {
        setSubmitError(data.error || 'Failed to submit experience. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting experience:', err);
      setSubmitError('Network error while submitting. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter approved experiences client-side for extra criteria (difficulty, outcome, search query)
  const filteredExperiences = experiences.filter((exp) => {
    if (difficultyFilter !== 'ALL' && exp.difficulty !== difficultyFilter) {
      return false;
    }
    if (outcomeFilter !== 'ALL' && exp.outcome !== outcomeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCompany = exp.company.toLowerCase().includes(q);
      const matchRole = exp.role.toLowerCase().includes(q);
      const matchQuestions = exp.questionsAsked?.some((question) => {
        const norm = normalizeQuestionItem(question);
        return norm.text.toLowerCase().includes(q);
      });
      const matchRounds = exp.roundsDescription?.toLowerCase().includes(q);
      if (!matchCompany && !matchRole && !matchQuestions && !matchRounds) {
        return false;
      }
    }
    return true;
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCompanyFilter !== 'All Companies' ||
    difficultyFilter !== 'ALL' ||
    outcomeFilter !== 'ALL';

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split('T')[0];
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr.split('T')[0];
    }
  };

  // Render semantic outcome badge with strict placementOS color tokens
  const renderOutcomeBadge = (outcome: string) => {
    if (outcome === 'Selected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/50 select-none">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
          <span>Selected</span>
        </span>
      );
    }
    if (outcome === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30 select-none">
          <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" />
          <span>Not Selected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#14131F]/5 text-[#14131F]/70 border border-[#14131F]/10 select-none">
        <Clock className="w-3.5 h-3.5 text-[#14131F]/50" />
        <span>{outcome || 'In Progress'}</span>
      </span>
    );
  };

  // Render difficulty badge
  const renderDifficultyBadge = (difficulty: string) => {
    if (difficulty === 'Easy') {
      return (
        <Badge variant="positive" size="sm">
          Easy
        </Badge>
      );
    }
    if (difficulty === 'Hard') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#14131F]/10 text-[#14131F] border border-[#14131F]/20 select-none">
          Hard
        </span>
      );
    }
    return (
      <Badge variant="verified" size="sm">
        Medium
      </Badge>
    );
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Top Section Header & View Segmented Switcher */}
      <div className="p-6 md:p-7 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <SectionHeading
            level="h1"
            title="Interview Experience Bank"
            subtitle="Verified interview rounds, coding questions, and candidate insights from peer placements."
            badge={
              <Badge variant="verified" size="sm" icon={<BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />}>
                Peer Knowledge Base
              </Badge>
            }
          />
        </div>

        {/* View Switcher Tabs (PlacementOS Segmented Pill Control) */}
        <div className="flex items-center gap-1 p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 shrink-0 self-start lg:self-center">
          <button
            onClick={() => setActiveSubTab('browse')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              activeSubTab === 'browse'
                ? 'bg-white text-[#14131F] shadow-xs border border-[#14131F]/10'
                : 'text-[#14131F]/60 hover:text-[#14131F]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Browse All</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubTab === 'browse'
                  ? 'bg-[#4338CA]/10 text-[#4338CA]'
                  : 'bg-[#14131F]/5 text-[#14131F]/60'
              }`}
            >
              {experiences.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('submit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              activeSubTab === 'submit'
                ? 'bg-white text-[#14131F] shadow-xs border border-[#14131F]/10'
                : 'text-[#14131F]/60 hover:text-[#14131F]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Share Experience</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('mine');
              fetchMySubmissions();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              activeSubTab === 'mine'
                ? 'bg-white text-[#14131F] shadow-xs border border-[#14131F]/10'
                : 'text-[#14131F]/60 hover:text-[#14131F]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>My Submissions</span>
            {myExperiences.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeSubTab === 'mine'
                    ? 'bg-[#4338CA]/10 text-[#4338CA]'
                    : 'bg-[#14131F]/5 text-[#14131F]/60'
                }`}
              >
                {myExperiences.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: BROWSE APPROVED EXPERIENCES */}
      {activeSubTab === 'browse' && (
        <div className="space-y-6">
          {/* Filter Shelf: Search & Dropdown Controls */}
          <div className="p-5 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by company, role (e.g. SDE-1, Full Stack), or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[#14131F]/12 rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#14131F] placeholder:text-[#14131F]/40 outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 transition-all font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Difficulty & Outcome Selectors + Refresh */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <select
                  value={difficultyFilter}
                  aria-label="Filter by difficulty"
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="bg-[#FAFAF8] border border-[#14131F]/12 rounded-xl text-xs text-[#14131F] font-medium px-3 py-2.5 outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 cursor-pointer font-sans"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <select
                  value={outcomeFilter}
                  aria-label="Filter by outcome"
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="bg-[#FAFAF8] border border-[#14131F]/12 rounded-xl text-xs text-[#14131F] font-medium px-3 py-2.5 outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 cursor-pointer font-sans"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="Selected">Selected Only</option>
                  <option value="Rejected">Not Selected</option>
                  <option value="Awaiting Result">In Progress</option>
                </select>

                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleResetFilters}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    title="Reset all filters"
                  >
                    Reset
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fetchApprovedExperiences(selectedCompanyFilter)}
                  disabled={loadingExperiences}
                  title="Refresh experience feed"
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingExperiences ? 'animate-spin' : ''}`} />}
                />
              </div>
            </div>

            {/* Popular Companies Filter Row */}
            <div className="pt-3 border-t border-[#14131F]/8 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar font-sans">
              <span className="text-[#14131F]/60 font-medium text-xs shrink-0 mr-1 flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-[#4338CA]" />
                <span>Companies:</span>
              </span>
              {POPULAR_COMPANIES.map((company) => {
                const isSelected = selectedCompanyFilter === company;
                return (
                  <button
                    key={company}
                    onClick={() => handleFilterChange(company)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer border select-none ${
                      isSelected
                        ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
                        : 'bg-[#FAFAF8] text-[#14131F]/70 hover:text-[#14131F] border-[#14131F]/10 hover:border-[#14131F]/25'
                    }`}
                  >
                    {company}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Notice with Retry */}
          {fetchError && (
            <div className="p-4 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
              <div className="flex items-center gap-2.5 text-[#FB7185]">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#FB7185]" />
                <span className="font-medium">{fetchError}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fetchApprovedExperiences(selectedCompanyFilter)}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingExperiences && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="p-6 bg-white border border-[#14131F]/8 rounded-2xl space-y-4 animate-pulse shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#14131F]/10 rounded-xl" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-[#14131F]/10 rounded" />
                        <div className="h-3 w-40 bg-[#14131F]/8 rounded" />
                      </div>
                    </div>
                    <div className="h-5 w-16 bg-[#14131F]/10 rounded-full" />
                  </div>
                  <div className="h-16 w-full bg-[#14131F]/5 rounded-xl" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-3 w-20 bg-[#14131F]/10 rounded" />
                    <div className="h-3 w-24 bg-[#14131F]/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Experiences Grid */}
          {!loadingExperiences && filteredExperiences.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExperiences.map((exp) => {
                const rounds = parseRounds(exp.roundsDescription);
                const questionCount = exp.questionsAsked?.length || 0;

                return (
                  <div
                    key={exp._id}
                    onClick={() => setSelectedExperience(exp)}
                    className="p-5 sm:p-6 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs hover:border-[#4338CA]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 font-display font-bold text-sm text-[#14131F] flex items-center justify-center shrink-0 mt-0.5">
                          {exp.company ? exp.company.slice(0, 2).toUpperCase() : 'CO'}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h3 className="font-display font-bold text-base text-[#14131F] leading-tight truncate">
                            {exp.company}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#14131F]/70 font-sans">
                            <Briefcase className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                            <span className="truncate font-medium">{exp.role}</span>
                          </div>
                          {exp.authorName && (
                            <div className="flex items-center gap-1 text-[11px] text-[#14131F]/50 font-sans">
                              <GraduationCap className="w-3 h-3 text-[#4338CA]/70 shrink-0" />
                              <span className="truncate">
                                {exp.authorName} • {exp.authorCollege || 'Verified Student'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Outcome and Difficulty Badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {renderOutcomeBadge(exp.outcome)}
                        {renderDifficultyBadge(exp.difficulty)}
                      </div>
                    </div>

                    {/* Middle Section: Structured Rounds Overview */}
                    <div className="space-y-3 font-sans">
                      <div className="bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#14131F] flex items-center gap-1.5 font-sans">
                            <Layers className="w-3.5 h-3.5 text-[#4338CA]" />
                            <span>Interview Process Breakdown</span>
                          </span>
                          {rounds.length > 1 && (
                            <span className="text-[10px] font-medium text-[#14131F]/60 bg-white px-2 py-0.5 rounded-md border border-[#14131F]/8">
                              {rounds.length} Rounds
                            </span>
                          )}
                        </div>

                        {/* Round Pills or Concise Text */}
                        {rounds.length > 1 ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {rounds.map((r, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-semibold text-[#14131F] bg-white border border-[#14131F]/10 px-2 py-0.5 rounded-md truncate max-w-[140px]"
                                >
                                  {r.title}
                                </span>
                              ))}
                            </div>
                            <p className="text-[#14131F]/70 line-clamp-2 leading-relaxed text-[11px] font-sans">
                              {rounds[0]?.description || exp.roundsDescription}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[#14131F]/70 line-clamp-3 leading-relaxed text-xs font-sans">
                            {exp.roundsDescription}
                          </p>
                        )}
                      </div>

                      {/* Questions Asked Preview */}
                      {questionCount > 0 && (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[#14131F]">
                            <span className="flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-[#4338CA]" />
                              <span>Key Questions</span>
                            </span>
                            <span className="text-[10px] text-[#14131F]/60 font-normal">
                              {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {exp.questionsAsked.slice(0, 2).map((rawQ, idx) => {
                              const q = normalizeQuestionItem(rawQ);
                              const isCoding = q.type === 'coding';
                              return (
                                <div
                                  key={idx}
                                  className="text-xs text-[#14131F]/85 bg-[#FAFAF8] rounded-lg border border-[#14131F]/8 px-3 py-1.5 flex items-center justify-between gap-2 font-sans"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isCoding ? (
                                      <Terminal className="w-3 h-3 text-[#4338CA] shrink-0" />
                                    ) : (
                                      <MessageSquare className="w-3 h-3 text-[#14131F]/50 shrink-0" />
                                    )}
                                    <span className="truncate font-sans font-medium text-[11px]">
                                      {q.text}
                                    </span>
                                  </div>
                                  <span
                                    className={`shrink-0 text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                      isCoding
                                        ? 'bg-[#4338CA]/10 text-[#4338CA]'
                                        : 'bg-[#14131F]/5 text-[#14131F]/60'
                                    }`}
                                  >
                                    {isCoding ? 'Coding' : 'Theory'}
                                  </span>
                                </div>
                              );
                            })}

                            {questionCount > 2 && (
                              <span className="text-[11px] text-[#4338CA] font-medium pl-1 block">
                                +{questionCount - 2} more questions in detail breakdown
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Metadata and Action */}
                    <div className="pt-3 border-t border-[#14131F]/8 flex items-center justify-between text-xs text-[#14131F]/60 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#14131F]/40" />
                        <span>{formatDate(exp.interviewDate)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[#4338CA] font-medium group-hover:underline">
                        <span>Read Experience</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State for Approved Feed */}
          {!loadingExperiences && filteredExperiences.length === 0 && (
            <div className="p-10 bg-white rounded-2xl border border-[#14131F]/8 shadow-xs text-center space-y-4 font-sans">
              <div className="w-12 h-12 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-display font-bold text-base text-[#14131F]">
                  {hasActiveFilters
                    ? 'No matching interview experiences found'
                    : 'Interview Experience Bank is empty'}
                </h3>
                <p className="text-xs text-[#14131F]/60 font-sans leading-relaxed">
                  {hasActiveFilters
                    ? 'Try resetting your company, difficulty, or outcome filters to view all available student records.'
                    : 'Be the first student to share your interview rounds, technical questions, and candidate advice.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                {hasActiveFilters ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={handleResetFilters}
                  >
                    Reset All Filters
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setActiveSubTab('submit')}
                  >
                    Share Your Interview Experience
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SUBMISSION FORM */}
      {activeSubTab === 'submit' && (
        <div className="p-6 md:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6 text-left font-sans">
          <div className="border-b border-[#14131F]/8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <SectionHeading
                level="h2"
                title="Share Your Interview Experience"
                subtitle="Document technical rounds, interview flow, and question sets to help fellow batchmates."
              />
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setActiveSubTab('browse')}
            >
              Cancel
            </Button>
          </div>

          {/* Verification Notice */}
          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl flex items-start gap-3 text-xs text-[#14131F]">
            <Sparkles className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
            <div className="leading-relaxed font-sans text-[#14131F]/80">
              <span className="font-semibold text-[#14131F]">Verification & Quality Review: </span>
              All submissions are initially placed in a <strong>pending review</strong> state to ensure clarity, question accuracy, and compliance before publishing to the batch feed.
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl text-[#FB7185] text-xs flex items-center gap-2.5 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FB7185]" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3.5 bg-[#A3E635]/20 border border-[#A3E635]/40 rounded-xl text-[#14131F] text-xs flex items-center gap-2.5 font-sans">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#14131F]" />
              <span className="font-medium">
                Interview experience submitted for verification. Redirecting to My Submissions...
              </span>
            </div>
          )}

          <form onSubmit={handleSubmitExperience} className="space-y-6 font-sans">
            {/* Section 1: Company, Role, Date */}
            <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-4">
              <div className="text-xs font-semibold text-[#14131F] flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>Company & Role Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14131F] mb-1.5 font-sans">
                    Company Name <span className="text-[#FB7185]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Razorpay, TCS"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2.5 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 placeholder:text-[#14131F]/40 font-sans transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14131F] mb-1.5 font-sans">
                    Role / Position Title <span className="text-[#FB7185]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SDE-1, Cloud Engineer, Product Intern"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2.5 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 placeholder:text-[#14131F]/40 font-sans transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14131F] mb-1.5 font-sans">
                    Interview Date <span className="text-[#FB7185]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2.5 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 font-sans transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Difficulty & Outcome Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Difficulty Selection */}
              <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                <label className="block text-xs font-semibold text-[#14131F] font-sans">
                  Overall Difficulty <span className="text-[#FB7185]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setFormDifficulty(diff)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer font-sans select-none ${
                        formDifficulty === diff
                          ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
                          : 'bg-white text-[#14131F]/70 border-[#14131F]/12 hover:border-[#14131F]/30 hover:text-[#14131F]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome Selection */}
              <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                <label className="block text-xs font-semibold text-[#14131F] font-sans">
                  Interview Outcome <span className="text-[#FB7185]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Selected', 'Rejected', 'Awaiting Result'] as const).map((out) => {
                    const isSelected = formOutcome === out;
                    return (
                      <button
                        key={out}
                        type="button"
                        onClick={() => setFormOutcome(out)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-medium border transition-all cursor-pointer font-sans select-none truncate ${
                          isSelected
                            ? out === 'Selected'
                              ? 'bg-[#A3E635] text-[#14131F] border-[#A3E635] font-bold shadow-xs'
                              : out === 'Rejected'
                              ? 'bg-[#FB7185] text-white border-[#FB7185] font-bold shadow-xs'
                              : 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
                            : 'bg-white text-[#14131F]/70 border-[#14131F]/12 hover:border-[#14131F]/30 hover:text-[#14131F]'
                        }`}
                      >
                        {out === 'Rejected' ? 'Not Selected' : out}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Rounds Description */}
            <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
              <label className="block text-xs font-semibold text-[#14131F] font-sans">
                Rounds Description & Experience Narrative <span className="text-[#FB7185]">*</span>
              </label>
              <p className="text-xs text-[#14131F]/60 font-sans">
                Detail each round clearly (e.g. Round 1: Online Assessment, Round 2: Technical/DSA, Round 3: Managerial/HR).
              </p>
              <textarea
                rows={5}
                required
                placeholder="Round 1 (OA): 30 MCQs on Aptitude + 2 DSA coding questions (Array manipulation & DP)...&#10;Round 2 (Tech Round 1): Deep-dive into resume projects, React Virtual DOM, and LRU Cache live coding...&#10;Round 3 (Managerial & HR): Behavioral questions, team conflict resolution, and CTC expectations."
                value={formRoundsDescription}
                onChange={(e) => setFormRoundsDescription(e.target.value)}
                className="w-full bg-white border border-[#14131F]/15 rounded-xl p-3.5 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 placeholder:text-[#14131F]/40 font-sans resize-y leading-relaxed transition-all"
              />
            </div>

            {/* Section 4: Questions Asked - Growable List */}
            <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#14131F] font-sans">
                    Specific Questions Asked
                  </label>
                  <p className="text-xs text-[#14131F]/60 font-sans">
                    List notable coding problems, system design, or theoretical questions.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddQuestion}
                >
                  Add Question
                </Button>
              </div>

              <div className="space-y-2.5 pt-1">
                {formQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-[#14131F]/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 font-sans"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 text-center text-xs font-display font-bold text-[#14131F]/50 shrink-0">
                        Q{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={
                          q.type === 'coding'
                            ? 'e.g. "Implement LRU Cache in O(1)", "Trapping Rain Water"'
                            : 'e.g. "Explain indexing in PostgreSQL", "Tell me about a time you resolved conflict"'
                        }
                        value={q.text}
                        onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                        className="flex-1 bg-[#FAFAF8] border border-[#14131F]/12 rounded-lg px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 placeholder:text-[#14131F]/40 font-sans transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end pl-8 sm:pl-0">
                      <select
                        value={q.type}
                        aria-label={`Question ${idx + 1} category`}
                        onChange={(e) =>
                          handleQuestionTypeChange(idx, e.target.value as 'theory' | 'coding')
                        }
                        className="bg-[#FAFAF8] border border-[#14131F]/12 rounded-lg text-xs text-[#14131F] px-2.5 py-2 outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 cursor-pointer font-medium font-sans"
                      >
                        <option value="theory">Theory / Behavioral</option>
                        <option value="coding">Coding / DSA</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        disabled={formQuestions.length === 1 && !q.text}
                        className="p-2 text-[#14131F]/40 hover:text-[#FB7185] rounded-lg border border-[#14131F]/10 hover:border-[#FB7185]/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Action Controls */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setActiveSubTab('browse')}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={submitting}
                icon={submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              >
                {submitting ? 'Submitting for Review...' : 'Submit Experience'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: MY SUBMISSIONS */}
      {activeSubTab === 'mine' && (
        <div className="space-y-6">
          <div className="p-6 md:p-7 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <SectionHeading
                level="h2"
                title="My Submitted Experiences"
                subtitle="Track moderation verification. Approved submissions are published to the student community feed."
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={fetchMySubmissions}
                disabled={loadingMine}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingMine ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveSubTab('submit')}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Submission
              </Button>
            </div>
          </div>

          {loadingMine && (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="p-6 bg-white border border-[#14131F]/8 rounded-2xl animate-pulse space-y-3 shadow-xs"
                >
                  <div className="h-5 w-40 bg-[#14131F]/10 rounded" />
                  <div className="h-4 w-64 bg-[#14131F]/5 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loadingMine && myExperiences.length > 0 && (
            <div className="space-y-3">
              {myExperiences.map((exp) => (
                <div
                  key={exp._id}
                  className="p-5 sm:p-6 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-3 text-left font-sans"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-display font-bold text-base text-[#14131F]">
                        {exp.company}
                      </span>
                      <span className="text-[#14131F]/30">•</span>
                      <span className="text-xs font-medium text-[#14131F]/80">{exp.role}</span>

                      {/* Moderation Status Badge */}
                      {exp.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/50 select-none">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
                          <span>Approved & Published</span>
                        </span>
                      ) : exp.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30 select-none">
                          <XCircle className="w-3.5 h-3.5 text-[#FB7185]" />
                          <span>Needs Revision</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#14131F]/5 text-[#14131F]/70 border border-[#14131F]/10 select-none">
                          <Clock className="w-3.5 h-3.5 text-[#14131F]/50" />
                          <span>Under Review</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {renderOutcomeBadge(exp.outcome)}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedExperience(exp)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Full Details
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-[#14131F]/60 font-sans flex items-center gap-2 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-[#14131F]/40" />
                    <span>Interview Date: {formatDate(exp.interviewDate)}</span>
                    <span>•</span>
                    <span>Difficulty: {exp.difficulty}</span>
                    {exp.questionsAsked && (
                      <>
                        <span>•</span>
                        <span>{exp.questionsAsked.length} Questions Documented</span>
                      </>
                    )}
                  </div>

                  {/* If Rejected: Show review feedback */}
                  {exp.status === 'rejected' && (
                    <div className="p-3.5 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl text-xs text-[#FB7185] space-y-1 font-sans">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" />
                        <span>Reviewer Feedback:</span>
                      </div>
                      <p className="leading-relaxed pl-5 text-[#FB7185]">
                        {exp.reviewNote ||
                          'Please provide additional details regarding the technical rounds and resubmit for publishing.'}
                      </p>
                    </div>
                  )}

                  {/* If Pending */}
                  {exp.status === 'pending' && (
                    <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs text-[#14131F]/65 flex items-center gap-2 font-sans">
                      <Clock className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                      <span>
                        Your submission is queued for verification. It will appear on the public feed once approved.
                      </span>
                    </div>
                  )}

                  {/* If Approved */}
                  {exp.status === 'approved' && (
                    <div className="p-3 bg-[#A3E635]/15 border border-[#A3E635]/30 rounded-xl text-xs text-[#14131F] flex items-center gap-2 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F] shrink-0" />
                      <span>Live in the community feed. Batchmates can learn from your interview insights.</span>
                    </div>
                  )}

                  {/* Narrative Preview */}
                  <div className="bg-[#FAFAF8] p-3 rounded-xl border border-[#14131F]/8 text-xs text-[#14131F]/70 line-clamp-2 font-sans">
                    <span className="font-semibold text-[#14131F]">Rounds Summary: </span>
                    {exp.roundsDescription}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingMine && myExperiences.length === 0 && (
            <div className="p-10 bg-white rounded-2xl border border-[#14131F]/8 shadow-xs text-center space-y-4 font-sans">
              <div className="w-12 h-12 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-display font-bold text-base text-[#14131F]">No Submissions Yet</h3>
                <p className="text-xs text-[#14131F]/60 font-sans leading-relaxed">
                  You have not submitted any interview experiences yet. Share questions and round formats from your placement drives.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setActiveSubTab('submit')}
                >
                  Submit Your First Experience
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR ANY EXPERIENCE */}
      {selectedExperience && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/60 backdrop-blur-xs font-sans"
          onClick={() => setSelectedExperience(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedExperience(null)}
              className="absolute top-5 right-5 p-1.5 text-[#14131F]/40 hover:text-[#14131F] hover:bg-[#14131F]/5 rounded-lg cursor-pointer transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-3 font-sans pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                {renderOutcomeBadge(selectedExperience.outcome)}
                {renderDifficultyBadge(selectedExperience.difficulty)}

                {selectedExperience.status === 'approved' && (
                  <Badge
                    variant="verified"
                    size="sm"
                    icon={<CheckCircle2 className="w-3 h-3 text-[#4338CA]" />}
                  >
                    Verified Experience
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#14131F]">
                  {selectedExperience.company} — {selectedExperience.role}
                </h2>
                <div className="text-xs text-[#14131F]/60 font-medium flex items-center gap-2 flex-wrap font-sans">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#14131F]/40" />
                    <span>Interviewed on {formatDate(selectedExperience.interviewDate)}</span>
                  </div>
                  {selectedExperience.authorName && (
                    <>
                      <span>•</span>
                      <span className="text-[#14131F]/80">
                        Shared by {selectedExperience.authorName} ({selectedExperience.authorCollege || 'Verified Student'})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Note in Modal if applicable */}
            {selectedExperience.status === 'rejected' && selectedExperience.reviewNote && (
              <div className="p-3.5 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl text-xs text-[#FB7185] space-y-1 font-sans">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" />
                  <span>Review Note:</span>
                </div>
                <p className="leading-relaxed pl-5 text-[#FB7185]">{selectedExperience.reviewNote}</p>
              </div>
            )}

            {/* Structured Rounds Breakdown */}
            <div className="space-y-3 font-sans">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#14131F] font-sans">
                <Layers className="w-4 h-4 text-[#4338CA]" />
                <span>Rounds & Process Breakdown</span>
              </div>

              {(() => {
                const parsed = parseRounds(selectedExperience.roundsDescription);
                if (parsed.length > 1) {
                  return (
                    <div className="space-y-3">
                      {parsed.map((r, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#4338CA] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-display font-bold text-xs text-[#14131F]">
                              {r.title}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#14131F]/80 whitespace-pre-wrap leading-relaxed pl-7">
                            {r.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs sm:text-sm text-[#14131F]/85 whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedExperience.roundsDescription}
                  </div>
                );
              })()}
            </div>

            {/* Questions Asked */}
            {selectedExperience.questionsAsked && selectedExperience.questionsAsked.length > 0 && (
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs font-semibold text-[#14131F] font-sans">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#4338CA]" />
                    <span>Questions Asked</span>
                  </div>
                  <span className="text-[11px] text-[#14131F]/60 font-normal">
                    {selectedExperience.questionsAsked.length} {selectedExperience.questionsAsked.length === 1 ? 'Question' : 'Questions'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedExperience.questionsAsked.map((rawQ, idx) => {
                    const q = normalizeQuestionItem(rawQ);
                    const isCoding = q.type === 'coding';
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs sm:text-sm text-[#14131F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans"
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span className="text-[#4338CA] font-bold font-display shrink-0 mt-0.5">
                            Q{idx + 1}.
                          </span>
                          <span className="leading-relaxed font-sans text-[#14131F] font-medium">
                            {q.text}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            isCoding
                              ? 'bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20'
                              : 'bg-[#14131F]/5 text-[#14131F]/70 border border-[#14131F]/10'
                          }`}
                        >
                          {isCoding ? 'Coding / DSA' : 'Theory / Behavioral'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#14131F]/8 flex items-center justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={() => setSelectedExperience(null)}
              >
                Close Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
