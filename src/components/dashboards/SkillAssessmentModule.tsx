import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Brain,
  Layers,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen,
  Clock,
  Award,
  AlertCircle,
  ChevronRight,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BarChart2,
  TrendingUp,
  FileQuestion,
  RefreshCw,
  X,
  ShieldCheck,
  CheckSquare,
  Briefcase,
  Code2,
  Zap,
  Bookmark,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Button,
  Badge,
  VerifiedSeal,
  SectionHeading,
  ListRow,
  LedgerContainer,
  RecordCard,
} from '../ui';
import {
  CANONICAL_SKILLS,
  toCanonicalSkill,
  calculateProficiencyLevel,
  PROFICIENCY_THRESHOLDS,
  ProficiencyLevel,
  SkillCategory,
} from '../../lib/skillCatalog';

export type AssessmentTab = 'assess' | 'profile' | 'industry_gaps' | 'history';

interface AssessmentQuestion {
  id: string;
  _id: string;
  category: 'technical' | 'soft';
  skill: string;
  skillId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questionText: string;
  scenarioText?: string | null;
  codeSnippet?: string | null;
  options: string[];
}

interface SkillScoreItem {
  skill: string;
  skillId: string;
  category: 'technical' | 'soft';
  score: number;
  proficiencyLevel: ProficiencyLevel;
  attemptedQuestions: number;
  correctAnswers: number;
}

interface AssessmentSubmissionResult {
  assessmentId: string;
  assessmentType: 'technical' | 'soft' | 'combined';
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  skillScores: SkillScoreItem[];
  strengths: Array<{ skill: string; score: number; level: ProficiencyLevel; category: SkillCategory }>;
  skillGaps: Array<{
    skill: string;
    currentScore: number | null;
    level: ProficiencyLevel | 'Unassessed';
    category: SkillCategory;
    isMarketRequired: boolean;
    reason: string;
  }>;
  answersReview: Array<{
    questionId: string;
    skill: string;
    category: 'technical' | 'soft';
    questionText: string;
    options: string[];
    selectedOptionIndex: number;
    correctAnswerIndex?: number;
    isCorrect: boolean;
    scoreEarned: number;
    explanation: string;
  }>;
  completedAt: string;
}

interface StudentProfileData {
  technicalSkills: Array<{
    skill: string;
    skillId: string;
    category: 'technical';
    score: number;
    proficiencyLevel: ProficiencyLevel;
    lastAssessedAt: string;
  }>;
  softSkills: Array<{
    skill: string;
    skillId: string;
    category: 'soft';
    score: number;
    proficiencyLevel: ProficiencyLevel;
    lastAssessedAt: string;
  }>;
  overallTechnicalScore: number | null;
  overallSoftScore: number | null;
  strengths: string[];
  skillGaps: string[];
  lastUpdated: string | null;
}

interface IndustryGapsData {
  totalActiveJobsAnalyzed: number;
  matchPercentage: number;
  userTargetRole: string;
  verifiedStrengths: Array<{
    skill: string;
    score: number;
    level: ProficiencyLevel;
    category: SkillCategory;
    marketDemandCount: number;
  }>;
  identifiedGaps: Array<{
    skill: string;
    currentScore: number | null;
    level: ProficiencyLevel | 'Unassessed';
    category: SkillCategory;
    marketDemandCount: number;
    gapSeverity: string;
  }>;
}

export const SkillAssessmentModule: React.FC = () => {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<AssessmentTab>('assess');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<'technical' | 'soft' | 'combined'>('combined');
  const [selectedSkillsFilter, setSelectedSkillsFilter] = useState<string[]>([]);
  const [questionCountLimit, setQuestionCountLimit] = useState<number>(15);

  // Live Test State
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [isTestLoading, setIsTestLoading] = useState<boolean>(false);
  const [testQuestions, setTestQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Results State
  const [lastResult, setLastResult] = useState<AssessmentSubmissionResult | null>(null);
  const [expandedReviewQuestionId, setExpandedReviewQuestionId] = useState<string | null>(null);

  // Profile and Gaps State
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [gapsData, setGapsData] = useState<IndustryGapsData | null>(null);
  const [isLoadingGaps, setIsLoadingGaps] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Timer Effect during Active Test
  useEffect(() => {
    let timer: any = null;
    if (isTestActive) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTestActive]);

  // Fetch student profile on mount and when token changes
  useEffect(() => {
    fetchProfile();
    fetchIndustryGaps();
  }, [token]);

  const fetchProfile = async () => {
    if (!token) return;
    setIsLoadingProfile(true);
    try {
      const res = await fetch('/api/skills/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch skill profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchIndustryGaps = async () => {
    if (!token) return;
    setIsLoadingGaps(true);
    try {
      const res = await fetch('/api/skills/gaps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGapsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch industry gaps:', err);
    } finally {
      setIsLoadingGaps(false);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/skills/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch assessment history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Start Assessment Handler
  const handleStartAssessment = async () => {
    setIsTestLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAssessmentType === 'technical' || selectedAssessmentType === 'soft') {
        params.append('category', selectedAssessmentType);
      }
      if (selectedSkillsFilter.length > 0) {
        params.append('skills', selectedSkillsFilter.join(','));
      }
      if (questionCountLimit > 0) {
        params.append('count', questionCountLimit.toString());
      }

      const res = await fetch(`/api/skills/questions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        alert('No questions found for the selected skills criteria. Please select a broader category.');
        setIsTestLoading(false);
        return;
      }

      setTestQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setElapsedSeconds(0);
      setLastResult(null);
      setIsTestActive(true);
    } catch (err: any) {
      console.error('Error starting assessment:', err);
      alert('Could not start assessment. Please try again.');
    } finally {
      setIsTestLoading(false);
    }
  };

  // Answer selection
  const handleSelectOption = (optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  // Flag/Bookmark question toggle
  const handleToggleFlag = (index: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Submit assessment handler
  const handleSubmitAssessment = async () => {
    setShowSubmitConfirmModal(false);
    setIsSubmitting(true);

    try {
      const formattedAnswers = testQuestions.map((q, idx) => ({
        questionId: q.id || q._id,
        selectedOptionIndex: typeof userAnswers[idx] === 'number' ? userAnswers[idx] : 0,
      }));

      const res = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assessmentType: selectedAssessmentType,
          answers: formattedAnswers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to evaluate test');
      }

      const data: AssessmentSubmissionResult = await res.json();
      setLastResult(data);
      setIsTestActive(false);

      // Refresh profile and gaps in background
      fetchProfile();
      fetchIndustryGaps();
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      alert(`Submission failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;
  const currentQuestion = testQuestions[currentQuestionIndex];

  // Filter options for skills
  const availableSkills = useMemo(() => {
    if (selectedAssessmentType === 'technical') {
      return CANONICAL_SKILLS.filter((s) => s.category === 'technical');
    }
    if (selectedAssessmentType === 'soft') {
      return CANONICAL_SKILLS.filter((s) => s.category === 'soft');
    }
    return CANONICAL_SKILLS;
  }, [selectedAssessmentType]);

  const toggleSkillSelection = (skillName: string) => {
    setSelectedSkillsFilter((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    );
  };

  // Level Badge Renderer
  const renderLevelBadge = (level: ProficiencyLevel | 'Unassessed') => {
    switch (level) {
      case 'Expert':
        return <Badge variant="positive">Expert (85%+)</Badge>;
      case 'Advanced':
        return <Badge variant="verified">Advanced (70-84%)</Badge>;
      case 'Intermediate':
        return <Badge variant="warning">Intermediate (50-69%)</Badge>;
      case 'Beginner':
        return <Badge variant="neutral">Beginner (&lt;50%)</Badge>;
      default:
        return <Badge variant="muted">Unassessed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#4338CA]/10 text-[#4338CA] rounded-xl">
                <Target className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#14131F] tracking-tight">
                Industry-Aligned Skill Assessment & Profile
              </h2>
            </div>
            <p className="text-sm text-[#14131F]/70 max-w-3xl leading-relaxed">
              Complete objective technical questions and real-world behavioral scenarios shared by industry recruiters.
              PlacementOS automatically evaluates your proficiency, identifies strengths and skill gaps, and benchmarks your readiness against active campus recruitment drives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                fetchProfile();
                fetchIndustryGaps();
              }}
              disabled={isLoadingProfile || isLoadingGaps}
            >
              Sync Profile
            </Button>
            {!isTestActive && (
              <Button
                variant="primary"
                size="sm"
                icon={<Zap className="w-4 h-4" />}
                onClick={() => {
                  setActiveTab('assess');
                  setLastResult(null);
                }}
              >
                New Assessment
              </Button>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60 font-medium">
              <span>Technical Skills</span>
              <Code2 className="w-4 h-4 text-[#4338CA]" />
            </div>
            <div className="text-xl font-bold font-display text-[#14131F]">
              {profileData?.overallTechnicalScore !== null && profileData?.overallTechnicalScore !== undefined
                ? `${profileData.overallTechnicalScore}%`
                : 'Pending'}
            </div>
            <p className="text-xs text-[#14131F]/60">
              {profileData?.technicalSkills?.length || 0} skills verified
            </p>
          </div>

          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60 font-medium">
              <span>Soft Skills & Behavioral</span>
              <Brain className="w-4 h-4 text-[#A3E635]" />
            </div>
            <div className="text-xl font-bold font-display text-[#14131F]">
              {profileData?.overallSoftScore !== null && profileData?.overallSoftScore !== undefined
                ? `${profileData.overallSoftScore}%`
                : 'Pending'}
            </div>
            <p className="text-xs text-[#14131F]/60">
              {profileData?.softSkills?.length || 0} behavioral areas
            </p>
          </div>

          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60 font-medium">
              <span>Identified Strengths</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-display text-[#14131F]">
              {profileData?.strengths?.length || 0}
            </div>
            <p className="text-xs text-emerald-700 font-medium">
              Scores &ge; 70% (Industry Ready)
            </p>
          </div>

          <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-[#14131F]/60 font-medium">
              <span>Campus Drives Match</span>
              <Briefcase className="w-4 h-4 text-[#FB7185]" />
            </div>
            <div className="text-xl font-bold font-display text-[#14131F]">
              {gapsData?.matchPercentage !== undefined ? `${gapsData.matchPercentage}%` : 'Evaluating'}
            </div>
            <p className="text-xs text-[#14131F]/60">
              Across {gapsData?.totalActiveJobsAnalyzed || 0} active postings
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {!isTestActive && (
          <div className="flex items-center gap-2 border-b border-[#14131F]/8 pt-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('assess')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'assess'
                  ? 'border-[#4338CA] text-[#4338CA]'
                  : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              <Zap className="w-4 h-4" />
              Take Assessment
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-[#4338CA] text-[#4338CA]'
                  : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Skill Profile & Matrix
            </button>
            <button
              onClick={() => {
                setActiveTab('industry_gaps');
                fetchIndustryGaps();
              }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'industry_gaps'
                  ? 'border-[#4338CA] text-[#4338CA]'
                  : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              <Target className="w-4 h-4" />
              Industry Alignment & Gaps
              {gapsData?.identifiedGaps && gapsData.identifiedGaps.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-[#FB7185]/20 text-[#14131F] rounded-full font-bold">
                  {gapsData.identifiedGaps.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-[#4338CA] text-[#4338CA]'
                  : 'border-transparent text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              <Clock className="w-4 h-4" />
              Assessment History
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: ACTIVE ASSESSMENT TEST RUNNER */}
      {isTestActive && currentQuestion && (
        <div className="bg-white border border-[#14131F]/8 rounded-2xl shadow-xs overflow-hidden">
          {/* Active Test Header Bar */}
          <div className="p-4 sm:p-6 bg-[#FAFAF8] border-b border-[#14131F]/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-1 bg-[#4338CA]/10 text-[#4338CA] font-semibold text-xs rounded-full">
                  Question {currentQuestionIndex + 1} of {testQuestions.length}
                </span>
                <span className="px-2.5 py-1 bg-[#14131F]/5 text-[#14131F]/80 text-xs rounded-full font-medium">
                  {currentQuestion.category === 'technical' ? 'Technical Objective' : 'Behavioral Scenario'}
                </span>
                <span className="px-2.5 py-1 bg-[#A3E635]/20 text-[#14131F] text-xs rounded-full font-bold">
                  {currentQuestion.skill}
                </span>
                <span className="text-xs text-[#14131F]/50">
                  Difficulty: {currentQuestion.difficulty}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#14131F]/10 rounded-lg text-sm font-mono text-[#14131F]">
                <Clock className="w-4 h-4 text-[#4338CA]" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>

              <Button
                variant={flaggedQuestions.has(currentQuestionIndex) ? 'warning' : 'secondary'}
                size="sm"
                icon={<Bookmark className="w-4 h-4" />}
                onClick={() => handleToggleFlag(currentQuestionIndex)}
              >
                {flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowSubmitConfirmModal(true)}
              >
                Submit Test ({answeredCount}/{testQuestions.length})
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#14131F]/5 h-1.5">
            <div
              className="bg-[#4338CA] h-1.5 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            {/* Main Question Panel */}
            <div className="lg:col-span-3 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-[#14131F]/8">
              {/* Soft Skill Workplace Scenario Card */}
              {currentQuestion.scenarioText && (
                <div className="p-5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Industry Workplace Scenario
                  </div>
                  <p className="text-sm sm:text-base text-amber-950 leading-relaxed italic">
                    "{currentQuestion.scenarioText}"
                  </p>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-display font-bold text-[#14131F] leading-snug">
                  {currentQuestion.questionText}
                </h3>

                {/* Optional Code Snippet Block */}
                {currentQuestion.codeSnippet && (
                  <pre className="p-4 bg-[#14131F] text-[#FAFAF8] rounded-xl text-xs sm:text-sm font-mono overflow-x-auto border border-white/10">
                    <code>{currentQuestion.codeSnippet}</code>
                  </pre>
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected
                          ? 'border-[#4338CA] bg-[#4338CA]/5 shadow-xs'
                          : 'border-[#14131F]/10 bg-white hover:border-[#14131F]/30 hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border mt-0.5 shrink-0 ${
                          isSelected
                            ? 'border-[#4338CA] bg-[#4338CA] text-white'
                            : 'border-[#14131F]/30 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase text-[#14131F]/50">
                          Option {String.fromCharCode(65 + optIdx)}
                        </span>
                        <p className={`text-sm sm:text-base ${isSelected ? 'text-[#14131F] font-medium' : 'text-[#14131F]/80'}`}>
                          {opt}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-[#14131F]/8">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </Button>

                {currentQuestionIndex < testQuestions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => setShowSubmitConfirmModal(true)}
                  >
                    Review & Submit
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar Question Palette */}
            <div className="p-6 bg-[#FAFAF8] space-y-6">
              <div className="space-y-1">
                <h4 className="text-sm font-bold font-display text-[#14131F]">Question Matrix</h4>
                <p className="text-xs text-[#14131F]/60">Jump directly to any question</p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {testQuestions.map((_, qIdx) => {
                  const isCurrent = currentQuestionIndex === qIdx;
                  const isAnswered = typeof userAnswers[qIdx] === 'number';
                  const isFlagged = flaggedQuestions.has(qIdx);

                  return (
                    <button
                      key={qIdx}
                      onClick={() => setCurrentQuestionIndex(qIdx)}
                      className={`h-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all border ${
                        isCurrent
                          ? 'ring-2 ring-[#4338CA] border-[#4338CA]'
                          : ''
                      } ${
                        isAnswered
                          ? 'bg-[#4338CA] text-white border-[#4338CA]'
                          : isFlagged
                          ? 'bg-[#FB7185]/20 text-[#14131F] border-[#FB7185]'
                          : 'bg-white text-[#14131F]/80 border-[#14131F]/15 hover:border-[#14131F]/30'
                      }`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 pt-4 border-t border-[#14131F]/10 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-[#4338CA]" />
                  <span className="text-[#14131F]/70">Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-white border border-[#14131F]/20" />
                  <span className="text-[#14131F]/70">Unanswered ({testQuestions.length - answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-[#FB7185]/20 border border-[#FB7185]" />
                  <span className="text-[#14131F]/70">Flagged ({flaggedQuestions.size})</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to exit this assessment? Your progress will be lost.')) {
                      setIsTestActive(false);
                      setTestQuestions([]);
                    }
                  }}
                >
                  Exit Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-[#14131F]/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-[#14131F]/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#4338CA]/10 text-[#4338CA] rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-[#14131F]">Submit Skill Assessment</h3>
                <p className="text-xs text-[#14131F]/60">Evaluate responses & generate verified skill profile</p>
              </div>
            </div>

            <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#14131F]/70">Total Questions:</span>
                <span className="font-bold text-[#14131F]">{testQuestions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#14131F]/70">Answered:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#14131F]/70">Unanswered:</span>
                <span className="font-bold text-rose-600">{testQuestions.length - answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#14131F]/70">Time Elapsed:</span>
                <span className="font-mono text-[#14131F]">{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            {testQuestions.length - answeredCount > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Notice: You have {testQuestions.length - answeredCount} unanswered questions. Unanswered questions will receive 0 points.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setShowSubmitConfirmModal(false)}
              >
                Continue Test
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                onClick={handleSubmitAssessment}
                icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm & Generate Profile'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: POST-ASSESSMENT RESULTS SCREEN */}
      {lastResult && !isTestActive && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#14131F]/8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-[#14131F]">
                    Assessment Evaluation Complete
                  </h3>
                </div>
                <p className="text-sm text-[#14131F]/60">
                  Your responses have been benchmarked against industry standards. Your skill profile and verified skills have been updated.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setLastResult(null);
                    setActiveTab('profile');
                  }}
                >
                  View Updated Profile
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setLastResult(null);
                    setActiveTab('industry_gaps');
                  }}
                >
                  View Campus Drive Gaps
                </Button>
              </div>
            </div>

            {/* Score Overview Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center text-2xl font-bold font-display shrink-0">
                  {lastResult.overallScore}%
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14131F]">Overall Assessment Score</h4>
                  <p className="text-xs text-[#14131F]/60">
                    {lastResult.totalCorrect} of {lastResult.totalQuestions} questions cleared
                  </p>
                  <div className="mt-1">
                    {renderLevelBadge(calculateProficiencyLevel(lastResult.overallScore))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold font-display shrink-0">
                  {lastResult.strengths.length}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14131F]">Verified Strengths</h4>
                  <p className="text-xs text-[#14131F]/60">Skills with score &ge; 70%</p>
                  <span className="text-xs text-emerald-700 font-semibold mt-1 inline-block">
                    Ready for Campus Drives
                  </span>
                </div>
              </div>

              <div className="p-6 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#FB7185]/20 text-[#14131F] flex items-center justify-center text-2xl font-bold font-display shrink-0">
                  {lastResult.skillGaps.length}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14131F]">Identified Skill Gaps</h4>
                  <p className="text-xs text-[#14131F]/60">Skills requiring further practice</p>
                  <span className="text-xs text-[#14131F]/70 font-semibold mt-1 inline-block">
                    Prioritized by recruiter demand
                  </span>
                </div>
              </div>
            </div>

            {/* Per-Skill Score Breakdown */}
            <div className="space-y-3 pt-4">
              <h4 className="text-base font-bold font-display text-[#14131F]">Evaluated Skills Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lastResult.skillScores.map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-[#14131F]">{item.skill}</span>
                        <span className="text-xs text-[#14131F]/50 ml-2 capitalize">({item.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#14131F]">{item.score}%</span>
                        {renderLevelBadge(item.proficiencyLevel)}
                      </div>
                    </div>
                    <div className="w-full bg-[#14131F]/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.score >= 85
                            ? 'bg-[#A3E635]'
                            : item.score >= 70
                            ? 'bg-[#4338CA]'
                            : item.score >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#14131F]/50">
                      {item.correctAnswers} of {item.attemptedQuestions} questions answered effectively
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Review Accordion */}
            <div className="space-y-4 pt-4 border-t border-[#14131F]/8">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold font-display text-[#14131F]">
                  Question-by-Question Rubric & Explanations ({lastResult.answersReview.length})
                </h4>
                <p className="text-xs text-[#14131F]/60">Inspect correct options and conceptual rationale</p>
              </div>

              <div className="space-y-2">
                {lastResult.answersReview.map((rev, rIdx) => {
                  const isExpanded = expandedReviewQuestionId === rev.questionId;
                  return (
                    <div
                      key={rIdx}
                      className="border border-[#14131F]/8 rounded-xl overflow-hidden bg-white"
                    >
                      <div
                        onClick={() => setExpandedReviewQuestionId(isExpanded ? null : rev.questionId)}
                        className="p-4 bg-[#FAFAF8] hover:bg-[#14131F]/5 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {rev.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#14131F]">Q{rIdx + 1}: {rev.skill}</span>
                              <span className="text-xs text-[#14131F]/50">({rev.category})</span>
                              <span className="text-xs font-bold text-emerald-700">+{rev.scoreEarned} pts</span>
                            </div>
                            <p className="text-xs text-[#14131F]/80 line-clamp-1 mt-0.5">
                              {rev.questionText}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#14131F]/50">
                            {isExpanded ? 'Hide' : 'Details'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 space-y-4 border-t border-[#14131F]/8 text-sm">
                          <div className="space-y-1">
                            <span className="text-xs font-bold uppercase text-[#14131F]/50">Full Question</span>
                            <p className="text-[#14131F] font-medium">{rev.questionText}</p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-xs font-bold uppercase text-[#14131F]/50">Options</span>
                            {rev.options.map((opt, oIdx) => {
                              const isSelected = rev.selectedOptionIndex === oIdx;
                              const isCorrect = rev.correctAnswerIndex === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-lg border text-xs sm:text-sm flex items-start gap-2 ${
                                    isCorrect
                                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium'
                                      : isSelected
                                      ? 'border-rose-300 bg-rose-50 text-rose-950'
                                      : 'border-[#14131F]/8 bg-[#FAFAF8] text-[#14131F]/70'
                                  }`}
                                >
                                  <span className="font-bold">[{String.fromCharCode(65 + oIdx)}]</span>
                                  <span>{opt}</span>
                                  {isCorrect && (
                                    <span className="ml-auto text-xs font-bold text-emerald-700">Correct Answer</span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="ml-auto text-xs font-bold text-rose-700">Your Selection</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-4 bg-[#4338CA]/5 border border-[#4338CA]/15 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4338CA]">
                              <Sparkles className="w-4 h-4" />
                              Conceptual Rationale & Industry Rubric
                            </div>
                            <p className="text-xs sm:text-sm text-[#14131F]/80 leading-relaxed">
                              {rev.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: LAUNCHER / ASSESSMENT CONFIGURATION TAB */}
      {activeTab === 'assess' && !isTestActive && !lastResult && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-display font-bold text-[#14131F]">
                Step 1: Select Assessment Track
              </h3>
              <p className="text-xs sm:text-sm text-[#14131F]/60">
                Choose whether to evaluate technical competencies, behavioral workplace scenarios, or a comprehensive diagnostic.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Technical */}
              <div
                onClick={() => {
                  setSelectedAssessmentType('technical');
                  setSelectedSkillsFilter([]);
                }}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-4 ${
                  selectedAssessmentType === 'technical'
                    ? 'border-[#4338CA] bg-[#4338CA]/5 shadow-sm'
                    : 'border-[#14131F]/10 bg-white hover:border-[#14131F]/30 hover:bg-[#FAFAF8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-3 bg-[#4338CA]/10 text-[#4338CA] rounded-xl">
                    <Code2 className="w-6 h-6" />
                  </span>
                  {selectedAssessmentType === 'technical' && (
                    <span className="p-1 bg-[#4338CA] text-white rounded-full">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold font-display text-[#14131F]">
                    Technical Skills Assessment
                  </h4>
                  <p className="text-xs text-[#14131F]/70 leading-relaxed">
                    Objective evaluation across Programming, Data Structures, Algorithms, SQL, System Design, and Modern Web Stacks.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2 text-xs text-[#14131F]/60">
                  <Clock className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>20-25 minutes • 15 questions</span>
                </div>
              </div>

              {/* Card 2: Soft Skills */}
              <div
                onClick={() => {
                  setSelectedAssessmentType('soft');
                  setSelectedSkillsFilter([]);
                }}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-4 ${
                  selectedAssessmentType === 'soft'
                    ? 'border-[#A3E635] bg-[#A3E635]/10 shadow-sm'
                    : 'border-[#14131F]/10 bg-white hover:border-[#14131F]/30 hover:bg-[#FAFAF8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-3 bg-[#A3E635]/20 text-[#14131F] rounded-xl">
                    <Brain className="w-6 h-6" />
                  </span>
                  {selectedAssessmentType === 'soft' && (
                    <span className="p-1 bg-[#14131F] text-white rounded-full">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold font-display text-[#14131F]">
                    Soft Skills & Scenarios
                  </h4>
                  <p className="text-xs text-[#14131F]/70 leading-relaxed">
                    Scenario-based workplace dilemmas evaluating Communication, Teamwork, Leadership, Time Management, and Collaboration.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2 text-xs text-[#14131F]/60">
                  <Clock className="w-3.5 h-3.5 text-[#14131F]" />
                  <span>10-15 minutes • 8 questions</span>
                </div>
              </div>

              {/* Card 3: Combined */}
              <div
                onClick={() => {
                  setSelectedAssessmentType('combined');
                  setSelectedSkillsFilter([]);
                }}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-4 ${
                  selectedAssessmentType === 'combined'
                    ? 'border-[#FB7185] bg-[#FB7185]/10 shadow-sm'
                    : 'border-[#14131F]/10 bg-white hover:border-[#14131F]/30 hover:bg-[#FAFAF8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-3 bg-[#FB7185]/20 text-[#14131F] rounded-xl">
                    <Target className="w-6 h-6" />
                  </span>
                  {selectedAssessmentType === 'combined' && (
                    <span className="p-1 bg-[#FB7185] text-white rounded-full">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold font-display text-[#14131F]">
                    Industry Readiness Diagnostic
                  </h4>
                  <p className="text-xs text-[#14131F]/70 leading-relaxed">
                    Holistic combined assessment benchmarking full technical mastery and collaborative behavioral excellence together.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2 text-xs text-[#14131F]/60">
                  <Clock className="w-3.5 h-3.5 text-[#FB7185]" />
                  <span>30 minutes • Complete Diagnostic</span>
                </div>
              </div>
            </div>

            {/* Step 2: Skill Focus Filter */}
            <div className="space-y-3 pt-4 border-t border-[#14131F]/8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold font-display text-[#14131F]">
                    Step 2: Focus on Specific Skills (Optional)
                  </h4>
                  <p className="text-xs text-[#14131F]/60">
                    Leave empty to test across all skills, or tap skills to build a customized evaluation.
                  </p>
                </div>

                {selectedSkillsFilter.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedSkillsFilter([])}
                  >
                    Reset Filter ({selectedSkillsFilter.length} active)
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 max-h-48 overflow-y-auto p-1">
                {availableSkills.map((sk) => {
                  const isSelected = selectedSkillsFilter.includes(sk.name);
                  return (
                    <button
                      key={sk.id}
                      onClick={() => toggleSkillSelection(sk.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#4338CA] text-white border-[#4338CA]'
                          : 'bg-white text-[#14131F]/80 border-[#14131F]/15 hover:border-[#14131F]/30 hover:bg-[#FAFAF8]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{sk.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Question Count & Start Action */}
            <div className="pt-4 border-t border-[#14131F]/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#14131F]/70">Question Limit:</span>
                {[10, 15, 20, 30].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCountLimit(count)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                      questionCountLimit === count
                        ? 'bg-[#14131F] text-white border-[#14131F]'
                        : 'bg-white text-[#14131F]/70 border-[#14131F]/15 hover:bg-[#FAFAF8]'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="md"
                disabled={isTestLoading}
                onClick={handleStartAssessment}
                icon={isTestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              >
                {isTestLoading ? 'Generating Test Environment...' : 'Begin Assessment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: SKILL PROFILE & MATRIX TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#14131F]/8">
              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold text-[#14131F]">
                  Verified Skill Profile
                </h3>
                <p className="text-xs sm:text-sm text-[#14131F]/60">
                  Comprehensive mastery scores calculated from industry-aligned objective and behavioral assessments.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchProfile}
                disabled={isLoadingProfile}
              >
                Refresh Profile
              </Button>
            </div>

            {/* Strengths & Gaps Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths Container */}
              <div className="p-6 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Award className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold font-display text-emerald-950">
                      Core Strengths ({profileData?.strengths?.length || 0})
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Skills scored at Advanced (&ge;70%) or Expert (&ge;85%) levels
                    </p>
                  </div>
                </div>

                {profileData?.strengths && profileData.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profileData.strengths.map((st, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-950 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        {st}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white/80 rounded-xl text-xs text-emerald-900 space-y-2">
                    <p>No verified strengths recorded yet.</p>
                    <p className="text-emerald-700">Take an assessment to identify your top competencies!</p>
                  </div>
                )}
              </div>

              {/* Skill Gaps Container */}
              <div className="p-6 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold font-display text-amber-950">
                      Identified Skill Gaps ({profileData?.skillGaps?.length || 0})
                    </h4>
                    <p className="text-xs text-amber-800">
                      Skills requiring additional study or practice to meet industry recruiter cutoffs
                    </p>
                  </div>
                </div>

                {profileData?.skillGaps && profileData.skillGaps.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profileData.skillGaps.map((gp, gIdx) => (
                      <span
                        key={gIdx}
                        className="px-3 py-1.5 bg-white border border-amber-300 text-amber-950 rounded-lg text-xs font-medium shadow-2xs flex items-center gap-1.5"
                      >
                        <Target className="w-3.5 h-3.5 text-amber-700" />
                        {gp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white/80 rounded-xl text-xs text-amber-900">
                    <p>No critical skill gaps identified.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Skills Section */}
            <div className="space-y-4 pt-4 border-t border-[#14131F]/8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#4338CA]" />
                  <h4 className="text-base font-bold font-display text-[#14131F]">
                    Technical Competencies ({profileData?.technicalSkills?.length || 0})
                  </h4>
                </div>
                <span className="text-xs text-[#14131F]/60">
                  Average Score: {profileData?.overallTechnicalScore ?? 0}%
                </span>
              </div>

              {profileData?.technicalSkills && profileData.technicalSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profileData.technicalSkills.map((sk, idx) => (
                    <div key={idx} className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#14131F]">{sk.skill}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#14131F]">{sk.score}%</span>
                          {renderLevelBadge(sk.proficiencyLevel)}
                        </div>
                      </div>
                      <div className="w-full bg-[#14131F]/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            sk.score >= 85
                              ? 'bg-[#A3E635]'
                              : sk.score >= 70
                              ? 'bg-[#4338CA]'
                              : sk.score >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${sk.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#14131F]/50">
                        <span>Last evaluated: {new Date(sk.lastAssessedAt).toLocaleDateString()}</span>
                        <span>Threshold: 70%+</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-xl text-center space-y-3">
                  <FileQuestion className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                  <p className="text-sm text-[#14131F]/70">No technical skills evaluated yet.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedAssessmentType('technical');
                      setActiveTab('assess');
                    }}
                  >
                    Take Technical Assessment
                  </Button>
                </div>
              )}
            </div>

            {/* Soft Skills Section */}
            <div className="space-y-4 pt-4 border-t border-[#14131F]/8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#A3E635]" />
                  <h4 className="text-base font-bold font-display text-[#14131F]">
                    Soft Skills & Behavioral Competencies ({profileData?.softSkills?.length || 0})
                  </h4>
                </div>
                <span className="text-xs text-[#14131F]/60">
                  Average Score: {profileData?.overallSoftScore ?? 0}%
                </span>
              </div>

              {profileData?.softSkills && profileData.softSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profileData.softSkills.map((sk, idx) => (
                    <div key={idx} className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#14131F]">{sk.skill}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#14131F]">{sk.score}%</span>
                          {renderLevelBadge(sk.proficiencyLevel)}
                        </div>
                      </div>
                      <div className="w-full bg-[#14131F]/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            sk.score >= 85
                              ? 'bg-[#A3E635]'
                              : sk.score >= 70
                              ? 'bg-[#4338CA]'
                              : sk.score >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${sk.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#14131F]/50">
                        <span>Last evaluated: {new Date(sk.lastAssessedAt).toLocaleDateString()}</span>
                        <span>Scenario Rubric Benchmark</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-xl text-center space-y-3">
                  <Brain className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                  <p className="text-sm text-[#14131F]/70">No soft skill scenarios evaluated yet.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedAssessmentType('soft');
                      setActiveTab('assess');
                    }}
                  >
                    Take Soft Skills Assessment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: INDUSTRY ALIGNMENT & GAPS TAB */}
      {activeTab === 'industry_gaps' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#14131F]/8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-[#FB7185]/20 text-[#14131F] rounded-xl">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-display font-bold text-[#14131F]">
                    Live Campus Hiring Alignment & Gaps
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#14131F]/60">
                  Benchmarked directly against required skills extracted from active campus job postings (e.g. Razorpay, Tech recruiters).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-[#14131F]/50 block">Target Role</span>
                  <span className="text-sm font-bold text-[#14131F]">
                    {gapsData?.userTargetRole || 'Software Development Engineer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Rate Card */}
            <div className="p-6 bg-[#FAFAF8] border border-[#14131F]/8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-[#14131F]/50 tracking-wider">
                  Campus Placement Readiness Match
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-display font-bold text-[#14131F]">
                    {gapsData?.matchPercentage ?? 0}%
                  </span>
                  <span className="text-xs text-[#14131F]/60 max-w-xs">
                    of skills demanded by current active campus recruitment drives have been verified at Advanced/Expert level.
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedAssessmentType('combined');
                  setActiveTab('assess');
                }}
              >
                Bridge Skill Gaps
              </Button>
            </div>

            {/* Identified Industry Gaps List */}
            <div className="space-y-3">
              <h4 className="text-base font-bold font-display text-[#14131F]">
                Priority Skill Gaps Demanded by Recruiters ({gapsData?.identifiedGaps?.length || 0})
              </h4>
              <p className="text-xs text-[#14131F]/60">
                These skills appear in active company requirements but are either unassessed or below the 70% threshold.
              </p>

              {gapsData?.identifiedGaps && gapsData.identifiedGaps.length > 0 ? (
                <div className="space-y-2.5">
                  {gapsData.identifiedGaps.map((gap, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-4 rounded-xl border border-[#14131F]/8 bg-white hover:border-[#14131F]/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#14131F]">{gap.skill}</span>
                          <span className="text-xs text-[#14131F]/50">({gap.category})</span>
                          <span className="px-2 py-0.5 text-xs font-bold bg-[#FB7185]/20 text-[#14131F] rounded-md">
                            Required by {gap.marketDemandCount} Active Job{gap.marketDemandCount > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-[#14131F]/60">
                          Current Status:{' '}
                          <span className="font-semibold text-[#14131F]">
                            {gap.currentScore !== null ? `${gap.currentScore}% (${gap.level})` : 'Unassessed'}
                          </span>
                          {' • '}Severity: {gap.gapSeverity}
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedSkillsFilter([gap.skill]);
                          setSelectedAssessmentType(gap.category === 'technical' ? 'technical' : 'soft');
                          setActiveTab('assess');
                        }}
                      >
                        Assess {gap.skill}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-[#FAFAF8] rounded-xl text-center text-xs text-[#14131F]/70">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  All active campus recruiter skills are currently matched!
                </div>
              )}
            </div>

            {/* Verified Market Strengths */}
            <div className="space-y-3 pt-4 border-t border-[#14131F]/8">
              <h4 className="text-base font-bold font-display text-[#14131F]">
                Verified Skills Matching Recruiter Needs ({gapsData?.verifiedStrengths?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gapsData?.verifiedStrengths?.map((item, idx) => (
                  <div key={idx} className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-950">{item.skill}</span>
                      <span className="font-bold text-sm text-emerald-800">{item.score}%</span>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium">
                      Matches {item.marketDemandCount} active job requirement{item.marketDemandCount > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: ASSESSMENT HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#14131F]/8">
              <div className="space-y-0.5">
                <h3 className="text-xl font-display font-bold text-[#14131F]">Assessment History</h3>
                <p className="text-xs text-[#14131F]/60">Past submissions, performance metrics, and attempts</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchHistory}
                disabled={isLoadingHistory}
              >
                Refresh
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#4338CA] mx-auto mb-2" />
                <p className="text-xs text-[#14131F]/60">Loading history records...</p>
              </div>
            ) : historyList.length > 0 ? (
              <div className="space-y-3">
                {historyList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#14131F] capitalize">
                          {item.assessmentType} Assessment
                        </span>
                        <span className="text-xs text-[#14131F]/50">
                          • {new Date(item.completedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#14131F]/70">
                        {item.totalCorrect} of {item.totalQuestions} questions correct • Skills tested: {item.skillsEvaluated?.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-bold font-display text-[#14131F]">
                          {item.overallScore}%
                        </span>
                        <span className="text-xs text-[#14131F]/50 block">Score</span>
                      </div>
                      {renderLevelBadge(calculateProficiencyLevel(item.overallScore))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Clock className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                <p className="text-sm text-[#14131F]/70">No past assessment sessions found.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('assess')}
                >
                  Take Your First Assessment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
