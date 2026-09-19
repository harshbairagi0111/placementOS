import React, { useState, useEffect, useRef } from 'react';
import { 
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
  Flame, 
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
  Target,
  FileQuestion,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Button,
  Badge,
  VerifiedSeal,
  SectionHeading,
  ListRow,
  LedgerContainer,
  RecordCard
} from '../ui';

export type AptitudeCategoryFilter = 'All' | 'Quantitative' | 'Logical' | 'Verbal';

export interface MockTestHistoryItem {
  sessionId: string;
  completedAt: string;
  overallScore: number;
  categoryScores: {
    Quantitative: number;
    Logical: number;
    Verbal: number;
  };
  totalQuestions: number;
  timeTakenSeconds: number;
}

interface AptitudeQuestionItem {
  _id?: string;
  category: 'Quantitative' | 'Logical' | 'Verbal';
  subtopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionTemplate: string;
  questionText: string;
  options: string[];
  isVariable?: boolean;
}

interface CheckedAnswerResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation: string;
}

interface MockQuestionResult {
  questionId: string;
  category: 'Quantitative' | 'Logical' | 'Verbal';
  subtopic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  options: string[];
  selectedAnswerIndex: number | null;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation: string;
  timeSpentSeconds?: number;
}

interface MockTestReport {
  sessionId: string;
  overallScore: number;
  totalCorrect: number;
  totalQuestions: number;
  categoryScores: {
    Quantitative: number;
    Logical: number;
    Verbal: number;
  };
  timeTakenSeconds: number;
  completedAt: string;
  perQuestionResults: MockQuestionResult[];
}

// ================= SHARED MOCK REPORT COMPONENT =================
interface MockReportViewProps {
  report: MockTestReport;
  onRetake: () => void;
  onBack: () => void;
  backLabel?: string;
  formatTime: (seconds: number) => string;
  getReadinessTier: (score: number) => { label: string; color: string; desc: string; badgeVariant?: 'positive' | 'warning' | 'neutral' | 'muted' | 'verified' };
}

const MockReportView: React.FC<MockReportViewProps> = ({
  report,
  onRetake,
  onBack,
  backLabel = 'Back',
  formatTime,
  getReadinessTier,
}) => {
  const [reportFilter, setReportFilter] = useState<'All' | 'Correct' | 'Incorrect' | 'Unanswered'>('All');
  const [expandedReviewIds, setExpandedReviewIds] = useState<Record<string, boolean>>({});

  const isPassed = report.overallScore >= 70;

  return (
    <div className="space-y-6 animate-in fade-in text-left font-sans">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <SectionHeading
              level="h2"
              title="Mock assessment diagnostic report"
              subtitle={`Completed on ${new Date(report.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Duration: ${formatTime(report.timeTakenSeconds)}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
          >
            {backLabel}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onRetake}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Retake mock test
          </Button>
        </div>
      </div>

      {/* Top Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Score Card */}
        <RecordCard
          className="md:col-span-2 flex flex-col justify-between"
          title={<span className="font-display font-bold text-base text-[#14131F]">Overall assessment score</span>}
          subtitle={<span className="text-xs text-[#14131F]/60">Consolidated accuracy across all test sections</span>}
        >
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-display font-bold text-[#14131F] tracking-tight">{report.overallScore}%</span>
              <span className="text-sm font-medium text-[#14131F]/60">({report.totalCorrect} of {report.totalQuestions} questions correct)</span>
            </div>

            <div>
              {(() => {
                const tier = getReadinessTier(report.overallScore);
                return (
                  <div className={`p-4 rounded-xl border text-xs font-sans ${tier.color}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant={tier.badgeVariant || 'neutral'} size="sm">
                        {tier.label}
                      </Badge>
                    </div>
                    <p className="font-normal mt-1.5 text-[#14131F]/70 leading-relaxed">{tier.desc}</p>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#14131F]/8 flex items-center justify-between text-xs text-[#14131F]/60 font-sans">
            <span>Total questions: <strong className="text-[#14131F] font-semibold">{report.totalQuestions}</strong></span>
            <span>Accuracy: <strong className="text-[#14131F] font-semibold">{report.overallScore}%</strong></span>
            <span>Pace: <strong className="text-[#14131F] font-semibold">{Math.round(report.timeTakenSeconds / Math.max(1, report.totalQuestions))}s / question</strong></span>
          </div>
        </RecordCard>

        {/* Category Performance Breakdown */}
        <RecordCard
          className="md:col-span-2 flex flex-col justify-between space-y-4"
          title={<span className="font-display font-bold text-base text-[#14131F]">Sectional diagnostics</span>}
          subtitle={<span className="text-xs text-[#14131F]/60">Accuracy breakdown per aptitude domain (Benchmark clearance target: ≥70%)</span>}
        >
          <div className="space-y-4">
            {/* Quantitative Bar */}
            {(() => {
              const qScore = report.categoryScores?.Quantitative ?? 0;
              const isStrong = qScore >= 70;
              const isWeak = qScore < 50;
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#14131F]">Quantitative aptitude</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14131F]">{qScore}%</span>
                      <Badge variant={isStrong ? 'positive' : isWeak ? 'warning' : 'verified'} size="sm">
                        {isStrong ? 'Strong' : isWeak ? 'Needs focus' : 'Proficient'}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isStrong ? 'bg-[#A3E635]' : isWeak ? 'bg-[#FB7185]' : 'bg-[#4338CA]'
                      }`}
                      style={{ width: `${qScore}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Logical Reasoning Bar */}
            {(() => {
              const lScore = report.categoryScores?.Logical ?? 0;
              const isStrong = lScore >= 70;
              const isWeak = lScore < 50;
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#14131F]">Logical reasoning</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14131F]">{lScore}%</span>
                      <Badge variant={isStrong ? 'positive' : isWeak ? 'warning' : 'verified'} size="sm">
                        {isStrong ? 'Strong' : isWeak ? 'Needs focus' : 'Proficient'}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isStrong ? 'bg-[#A3E635]' : isWeak ? 'bg-[#FB7185]' : 'bg-[#4338CA]'
                      }`}
                      style={{ width: `${lScore}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Verbal Ability Bar */}
            {(() => {
              const vScore = report.categoryScores?.Verbal ?? 0;
              const isStrong = vScore >= 70;
              const isWeak = vScore < 50;
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#14131F]">Verbal ability</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#14131F]">{vScore}%</span>
                      <Badge variant={isStrong ? 'positive' : isWeak ? 'warning' : 'verified'} size="sm">
                        {isStrong ? 'Strong' : isWeak ? 'Needs focus' : 'Proficient'}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isStrong ? 'bg-[#A3E635]' : isWeak ? 'bg-[#FB7185]' : 'bg-[#4338CA]'
                      }`}
                      style={{ width: `${vScore}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </RecordCard>
      </div>

      {/* Clear Next Action Recommendation */}
      <div className="p-6 bg-white border border-[#14131F]/8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm sm:text-base text-[#14131F]">
              Next recommended step
            </span>
            <Badge variant={isPassed ? 'positive' : 'warning'} size="sm">
              {isPassed ? 'Benchmark cleared' : 'Practice recommended'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#14131F]/65 font-sans leading-relaxed max-w-2xl">
            {isPassed
              ? 'Your score clears standard campus recruitment aptitude cutoffs (≥70%). Review your derived explanations below, or practice hard questions to secure a Tier-1 shortlist.'
              : 'Focus on reviewing the derivation steps and formula shortcuts for your incorrect answers below, then take a practice drill before retaking the mock assessment.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
          >
            {backLabel}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onRetake}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Retake mock test
          </Button>
        </div>
      </div>

      {/* Per-Question Detailed Review */}
      <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#14131F]/8">
          <div>
            <h3 className="font-display font-bold text-lg text-[#14131F]">Per-question review & derivations</h3>
            <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">Review your choices against verified answer keys and mathematical derivations</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/8 shrink-0">
            {(['All', 'Correct', 'Incorrect', 'Unanswered'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setReportFilter(filter)}
                className={`px-3 py-1 text-xs font-sans rounded-lg font-medium transition-colors cursor-pointer ${
                  reportFilter === filter
                    ? 'bg-white text-[#14131F] shadow-xs'
                    : 'text-[#14131F]/60 hover:text-[#14131F]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Questions Accordion List */}
        <div className="space-y-3">
          {report.perQuestionResults
            .filter((q) => {
              if (reportFilter === 'Correct') return q.isCorrect;
              if (reportFilter === 'Incorrect') return !q.isCorrect && q.selectedAnswerIndex !== null;
              if (reportFilter === 'Unanswered') return q.selectedAnswerIndex === null;
              return true;
            })
            .map((q, idx) => {
              const isExpanded = expandedReviewIds[q.questionId] ?? true;

              return (
                <div
                  key={q.questionId || idx}
                  className={`p-5 rounded-xl border transition-colors ${
                    q.isCorrect
                      ? 'bg-white border-[#A3E635]/40'
                      : q.selectedAnswerIndex === null
                      ? 'bg-[#FAFAF8] border-[#14131F]/8'
                      : 'bg-white border-[#FB7185]/40'
                  }`}
                >
                  {/* Header */}
                  <div
                    onClick={() =>
                      setExpandedReviewIds((prev) => ({
                        ...prev,
                        [q.questionId]: !isExpanded,
                      }))
                    }
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F]">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#4338CA]/10 text-[#4338CA] font-medium">
                        {q.category}
                      </span>
                      <span className="text-xs text-[#14131F]/60 font-sans">{q.subtopic}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {q.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" /> Correct
                        </span>
                      ) : q.selectedAnswerIndex === null ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#14131F]/5 text-[#14131F]/60">
                          Unanswered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#FB7185]/15 text-[#14131F] border border-[#FB7185]/35">
                          <XCircle className="w-3.5 h-3.5 text-[#FB7185]" /> Incorrect
                        </span>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#14131F]/40" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#14131F]/40" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-[#14131F]/8">
                      <p className="font-display font-medium text-sm sm:text-base text-[#14131F] whitespace-pre-wrap leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Options comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((optText, optIdx) => {
                          const isCorrectAnswer = optIdx === q.correctAnswerIndex;
                          const isStudentSelected = optIdx === q.selectedAnswerIndex;

                          let optClass = 'bg-[#FAFAF8] border-[#14131F]/8 text-[#14131F]';
                          if (isCorrectAnswer) {
                            optClass = 'bg-[#A3E635]/15 border-[#A3E635]/50 text-[#14131F] font-medium';
                          } else if (isStudentSelected && !q.isCorrect) {
                            optClass = 'bg-[#FB7185]/15 border-[#FB7185]/50 text-[#14131F] font-medium';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${optClass}`}
                            >
                              <span className="font-semibold shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                              <span className="leading-snug">{optText}</span>
                              {isCorrectAnswer && (
                                <span className="ml-auto shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#A3E635]/30 text-[#14131F] font-semibold">
                                  Correct
                                </span>
                              )}
                              {isStudentSelected && !isCorrectAnswer && (
                                <span className="ml-auto shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#FB7185]/25 text-[#14131F] font-medium">
                                  Your choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Box */}
                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14131F]">
                          <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />
                          <span>Derivation & explanation</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#14131F]/70 whitespace-pre-wrap leading-relaxed font-sans">
                          {q.explanation}
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
  );
};

export const AptitudeTestModule: React.FC = () => {
  const authContext = useAuth();
  const token = authContext?.token;

  const [activeSubMode, setActiveSubMode] = useState<'selection' | 'practice' | 'mock_test' | 'mock_report' | 'history'>('selection');
  const [reportSourceMode, setReportSourceMode] = useState<'selection' | 'history'>('selection');
  const [selectedCategory, setSelectedCategory] = useState<AptitudeCategoryFilter>('All');

  // ================= HISTORY STATE =================
  const [historyList, setHistoryList] = useState<MockTestHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingReportSessionId, setLoadingReportSessionId] = useState<string | null>(null);

  // ================= PRACTICE MODE STATE =================
  const [practiceQuestions, setPracticeQuestions] = useState<AptitudeQuestionItem[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSelectedOption, setPracticeSelectedOption] = useState<number | null>(null);
  const [isSubmittingPractice, setIsSubmittingPractice] = useState(false);
  const [practiceCheckedResult, setPracticeCheckedResult] = useState<CheckedAnswerResult | null>(null);
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);
  const [practiceLoadError, setPracticeLoadError] = useState<string | null>(null);
  const [practiceAttemptedCount, setPracticeAttemptedCount] = useState(0);
  const [practiceCorrectCount, setPracticeCorrectCount] = useState(0);

  // ================= MOCK TEST STATE =================
  const [mockSessionId, setMockSessionId] = useState<string | null>(null);
  const [mockQuestions, setMockQuestions] = useState<AptitudeQuestionItem[]>([]);
  const [mockCurrentIndex, setMockCurrentIndex] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800); // 30 minutes
  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const [isSubmittingMock, setIsSubmittingMock] = useState(false);
  const [mockLoadError, setMockLoadError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mockReport, setMockReport] = useState<MockTestReport | null>(null);

  // Question timer tracker
  const questionStartTimeRef = useRef<number>(Date.now());
  const questionTimeSpentRef = useRef<Record<string, number>>({});
  const timerIntervalRef = useRef<any>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // ================= FETCH HISTORY =================
  const fetchMockHistory = async () => {
    try {
      setIsLoadingHistory(true);
      setHistoryError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/aptitude/mock/history', { headers });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.history)) {
        setHistoryList(data.history);
      } else {
        setHistoryError(data.error || 'Failed to fetch mock test history.');
      }
    } catch (err: any) {
      console.error('Error fetching mock history:', err);
      setHistoryError(err.message || 'Network error fetching mock test history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchMockHistory();
  }, [token]);

  const viewSessionReport = async (sessionId: string) => {
    try {
      setLoadingReportSessionId(sessionId);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/aptitude/mock/${sessionId}/report`, { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setMockReport(data);
        setReportSourceMode('history');
        setActiveSubMode('mock_report');
      } else {
        alert(data.error || 'Could not load test report.');
      }
    } catch (err: any) {
      console.error('Error loading test report:', err);
      alert('Failed to load past test report.');
    } finally {
      setLoadingReportSessionId(null);
    }
  };

  const scoreTrend = (() => {
    if (!historyList || historyList.length < 2) return null;
    const latest = historyList[0].overallScore;
    const previous = historyList[1].overallScore;
    const diff = latest - previous;
    return {
      diff,
      latest,
      previous,
      isPositive: diff > 0,
      isNegative: diff < 0,
      isNeutral: diff === 0,
      text: diff > 0 ? `+${diff}% since last attempt` : diff < 0 ? `${diff}% since last attempt` : `0% (Same as last attempt)`,
    };
  })();

  // ================= TIMER EFFECT =================
  useEffect(() => {
    if (activeSubMode === 'mock_test' && timeLeftSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            if (!isSubmittingRef.current) {
              handleAutoSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeSubMode]);

  useEffect(() => {
    if (activeSubMode === 'mock_test' && mockQuestions[mockCurrentIndex]) {
      const prevQ = mockQuestions[mockCurrentIndex];
      const prevQId = prevQ._id || `mock_q_${mockCurrentIndex + 1}`;
      const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      questionTimeSpentRef.current[prevQId] = (questionTimeSpentRef.current[prevQId] || 0) + elapsed;
      questionStartTimeRef.current = Date.now();
    }
  }, [mockCurrentIndex, activeSubMode]);

  // ================= PRACTICE HANDLERS =================
  const startPractice = async (category: AptitudeCategoryFilter) => {
    try {
      setIsLoadingPractice(true);
      setPracticeLoadError(null);
      setSelectedCategory(category);
      setPracticeIndex(0);
      setPracticeSelectedOption(null);
      setPracticeCheckedResult(null);
      setPracticeAttemptedCount(0);
      setPracticeCorrectCount(0);

      const params = new URLSearchParams();
      if (category !== 'All') {
        params.append('category', category);
      }
      params.append('count', '10');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/aptitude/questions?${params.toString()}`, { headers });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setPracticeQuestions(data.questions);
        setActiveSubMode('practice');
      } else {
        setPracticeLoadError(data.error || 'No questions available for this category right now.');
      }
    } catch (err: any) {
      console.error('Error starting practice session:', err);
      setPracticeLoadError(err.message || 'Failed to load practice questions');
    } finally {
      setIsLoadingPractice(false);
    }
  };

  const handlePracticeOptionSelect = (index: number) => {
    if (practiceCheckedResult) return;
    setPracticeSelectedOption(index);
  };

  const handlePracticeSubmitAnswer = async () => {
    const currentQ = practiceQuestions[practiceIndex];
    if (practiceSelectedOption === null || !currentQ || isSubmittingPractice) return;

    try {
      setIsSubmittingPractice(true);
      const questionId = currentQ._id || currentQ.questionTemplate;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/aptitude/practice/check', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionId,
          selectedAnswerIndex: practiceSelectedOption,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPracticeCheckedResult({
          isCorrect: data.isCorrect,
          correctAnswerIndex: data.correctAnswerIndex,
          explanation: data.explanation,
        });
        setPracticeAttemptedCount((prev) => prev + 1);
        if (data.isCorrect) {
          setPracticeCorrectCount((prev) => prev + 1);
        }
      } else {
        alert(data.error || 'Could not verify answer.');
      }
    } catch (err: any) {
      console.error('Error verifying answer:', err);
      alert('Error verifying answer server-side.');
    } finally {
      setIsSubmittingPractice(false);
    }
  };

  const handlePracticeNextQuestion = () => {
    if (practiceIndex + 1 < practiceQuestions.length) {
      setPracticeIndex((prev) => prev + 1);
      setPracticeSelectedOption(null);
      setPracticeCheckedResult(null);
    } else {
      setPracticeSelectedOption(null);
      setPracticeCheckedResult(null);
    }
  };

  // ================= MOCK TEST HANDLERS =================
  const startMockTest = async () => {
    try {
      setIsLoadingMock(true);
      setMockLoadError(null);
      setMockAnswers({});
      setMockCurrentIndex(0);
      setTimeLeftSeconds(1800); // 30 mins
      questionTimeSpentRef.current = {};
      questionStartTimeRef.current = Date.now();
      isSubmittingRef.current = false;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/aptitude/mock/start', {
        method: 'POST',
        headers,
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setMockSessionId(data.sessionId);
        setMockQuestions(data.questions);
        setTimeLeftSeconds(data.timeLimitSeconds || 1800);
        setActiveSubMode('mock_test');
      } else {
        setMockLoadError(data.error || 'Could not start mock assessment. Please try again.');
      }
    } catch (err: any) {
      console.error('Error starting mock test:', err);
      setMockLoadError(err.message || 'Failed to start mock test');
    } finally {
      setIsLoadingMock(false);
    }
  };

  const handleMockOptionSelect = (optionIndex: number) => {
    const currentQ = mockQuestions[mockCurrentIndex];
    if (!currentQ) return;
    const qId = currentQ._id || `mock_q_${mockCurrentIndex + 1}`;

    setMockAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }));
  };

  const handleMockClearSelection = () => {
    const currentQ = mockQuestions[mockCurrentIndex];
    if (!currentQ) return;
    const qId = currentQ._id || `mock_q_${mockCurrentIndex + 1}`;

    setMockAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleAutoSubmit = () => {
    submitMockTest();
  };

  const submitMockTest = async () => {
    if (!mockSessionId || isSubmittingRef.current) return;

    try {
      isSubmittingRef.current = true;
      setIsSubmittingMock(true);
      setShowSubmitModal(false);

      const answersPayload = mockQuestions.map((q, idx) => {
        const qId = q._id || `mock_q_${idx + 1}`;
        const selected = mockAnswers[qId];
        return {
          questionId: qId,
          selectedAnswerIndex: typeof selected === 'number' ? selected : null,
          timeSpentSeconds: questionTimeSpentRef.current[qId] || 0,
        };
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/aptitude/mock/${mockSessionId}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers: answersPayload }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMockReport(data);
        setReportSourceMode('selection');
        setActiveSubMode('mock_report');
        fetchMockHistory();
      } else {
        alert(data.error || 'Failed to submit mock assessment. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting mock test:', err);
      alert('Error submitting mock test.');
    } finally {
      setIsSubmittingMock(false);
      isSubmittingRef.current = false;
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDurationFriendly = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getReadinessTier = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Placement ready — Tier 1',
        badgeVariant: 'positive' as const,
        color: 'bg-[#A3E635]/15 border-[#A3E635]/40 text-[#14131F]',
        desc: 'Exceptional analytical and problem-solving accuracy. Highly benchmarked for tier 1 campus screening rounds.',
      };
    } else if (score >= 60) {
      return {
        label: 'Proficient — Practice recommended',
        badgeVariant: 'neutral' as const,
        color: 'bg-[#4338CA]/10 border-[#4338CA]/25 text-[#14131F]',
        desc: 'Solid foundational aptitude. Targeted practice on lower-scoring sections will ensure a confident pass.',
      };
    } else {
      return {
        label: 'Needs focused revision',
        badgeVariant: 'warning' as const,
        color: 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#14131F]',
        desc: 'Review core formulas in quantitative and logical reasoning drills before retaking the full mock exam.',
      };
    }
  };

  const currentMockQuestion = mockQuestions[mockCurrentIndex];
  const currentMockQuestionId = currentMockQuestion ? currentMockQuestion._id || `mock_q_${mockCurrentIndex + 1}` : '';
  const currentMockSelectedAnswer = currentMockQuestionId ? mockAnswers[currentMockQuestionId] : undefined;
  const answeredMockCount = Object.keys(mockAnswers).length;
  const unansweredMockCount = mockQuestions.length - answeredMockCount;

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Top Banner Header (Shown on selection, history or practice mode) */}
      {activeSubMode !== 'mock_test' && activeSubMode !== 'mock_report' && (
        <div className="p-6 md:p-8 bg-white border border-[#14131F]/8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <SectionHeading
                  title="Aptitude test mastery"
                  subtitle="Quantitative aptitude, logical reasoning, and verbal ability drills built for campus recruitment rounds."
                />
              </div>
            </div>
          </div>

          {/* Navigation Mode Pill Switcher */}
          <div className="flex items-center gap-1.5 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/8 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubMode('selection')}
              className={`px-3.5 py-1.5 text-xs font-sans rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubMode === 'selection'
                  ? 'bg-white text-[#14131F] shadow-xs'
                  : 'text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Practice & mocks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubMode('history');
                fetchMockHistory();
              }}
              className={`px-3.5 py-1.5 text-xs font-sans rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubMode === 'history'
                  ? 'bg-white text-[#14131F] shadow-xs'
                  : 'text-[#14131F]/60 hover:text-[#14131F]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Test history</span>
              {historyList.length > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#4338CA]/10 text-[#4338CA] font-semibold">
                  {historyList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= TEST INTRO / SELECTION MODE ================= */}
      {activeSubMode === 'selection' && (
        <div className="space-y-6">
          {/* Test Intro & Instructions Summary Card */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#14131F]/8">
              <div>
                <h3 className="font-display font-bold text-lg text-[#14131F]">
                  Campus recruitment aptitude format
                </h3>
                <p className="text-xs sm:text-sm text-[#14131F]/65 font-sans mt-0.5">
                  Standardized pre-interview screening benchmarks mapped to industry technical hiring drives.
                </p>
              </div>
              <Badge variant="verified" size="sm" className="self-start sm:self-auto">
                Placement benchmark ready
              </Badge>
            </div>

            {/* What to Expect Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#14131F]/60 font-sans">
                  <FileQuestion className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Total questions</span>
                </div>
                <p className="font-display font-bold text-lg text-[#14131F]">30 Questions</p>
                <p className="text-[11px] text-[#14131F]/55 font-sans leading-tight">
                  12 Quant • 9 Logical • 9 Verbal
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#14131F]/60 font-sans">
                  <Clock className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Time limit</span>
                </div>
                <p className="font-display font-bold text-lg text-[#14131F]">30 Minutes</p>
                <p className="text-[11px] text-[#14131F]/55 font-sans leading-tight">
                  1 min / question average pace
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#14131F]/60 font-sans">
                  <Target className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Clearance target</span>
                </div>
                <p className="font-display font-bold text-lg text-[#14131F]">≥ 70% Score</p>
                <p className="text-[11px] text-[#14131F]/55 font-sans leading-tight">
                  Recruitment screening cutoff
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#14131F]/60 font-sans">
                  <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Instant derivations</span>
                </div>
                <p className="font-display font-bold text-lg text-[#14131F]">Step-by-step</p>
                <p className="text-[11px] text-[#14131F]/55 font-sans leading-tight">
                  Full mathematical solutions
                </p>
              </div>
            </div>

            {/* Quick Guiding Note */}
            <div className="p-4 bg-[#4338CA]/5 rounded-xl border border-[#4338CA]/15 flex items-start gap-3 text-xs text-[#14131F]/75 leading-relaxed font-sans">
              <Sparkles className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
              <span>
                <strong>How to prepare:</strong> Start with untimed <em>Practice drills</em> to review formulas and step-by-step mathematical working. When confident, launch the full 30-minute <em>Aptitude mock test</em> to simulate an official recruiter exam and obtain your comprehensive diagnostic report.
              </span>
            </div>
          </div>

          {/* Category filter sub-bar in selection mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 text-xs text-[#14131F] font-medium">
              <Target className="w-3.5 h-3.5 text-[#4338CA]" />
              <span>Focus practice drills by domain:</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAFAF8] p-1 rounded-xl border border-[#14131F]/8 shrink-0">
              {(['All', 'Quantitative', 'Logical', 'Verbal'] as AptitudeCategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-sans rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-[#14131F] shadow-xs'
                      : 'text-[#14131F]/60 hover:text-[#14131F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* DUAL ENTRY CARDS (Selection Mode) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Practice Mode */}
            <RecordCard
              className="flex flex-col justify-between"
              title={
                <div className="flex items-center justify-between gap-2">
                  <span>Aptitude practice drills</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#14131F]" /> Instant feedback
                  </span>
                </div>
              }
              subtitle={<span>Untimed drills with immediate verified answer checks and mathematical working steps.</span>}
            >
              <div className="space-y-4">
                <div className="space-y-2 text-xs text-[#14131F]/70">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                    <span>Dynamic numeric variants generated per session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                    <span>Step-by-step mathematical derivations and formula explanations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                    <span>Target Quantitative, Logical, or Verbal categories individually</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#14131F]/8 flex items-center justify-between gap-3">
                <span className="text-xs text-[#14131F]/60">
                  Selected domain: <strong className="text-[#14131F] font-semibold">{selectedCategory}</strong>
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => startPractice(selectedCategory)}
                  disabled={isLoadingPractice}
                  icon={isLoadingPractice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  {isLoadingPractice ? 'Loading drill...' : 'Start practice'}
                </Button>
              </div>
            </RecordCard>

            {/* Card 2: Full Mock Test */}
            <RecordCard
              className="flex flex-col justify-between"
              title={
                <div className="flex items-center justify-between gap-2">
                  <span>Full aptitude mock test</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#14131F]/5 text-[#14131F]/70 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#14131F]/50" /> Timed exam
                  </span>
                </div>
              }
              subtitle={<span>Strict 30-minute exam simulation matching standard company screening tests.</span>}
            >
              <div className="space-y-4">
                <div className="space-y-2 text-xs text-[#14131F]/70">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                    <span>30-minute exam countdown with automatic submission</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                    <span>Standard distribution: 12 Quant, 9 Logical, 9 Verbal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                    <span>Interactive question palette and sectional diagnostic report</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#14131F]/8 flex items-center justify-between gap-3">
                <span className="text-xs text-[#14131F]/60 font-medium">
                  30 Questions • 30 Mins
                </span>
                <div className="flex items-center gap-2">
                  {historyList.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveSubMode('history');
                        fetchMockHistory();
                      }}
                    >
                      History ({historyList.length})
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startMockTest}
                    disabled={isLoadingMock}
                    icon={isLoadingMock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                  >
                    {isLoadingMock ? 'Preparing exam...' : 'Start mock test'}
                  </Button>
                </div>
              </div>
            </RecordCard>
          </div>
        </div>
      )}

      {/* ================= MOCK TEST HISTORY VIEW ================= */}
      {activeSubMode === 'history' && (
        <div className="space-y-6 animate-in fade-in">
          {/* History Header & Trend Banner */}
          <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <SectionHeading
                    title="Mock assessment history"
                    subtitle="Review past placement screening mock tests, sectional performance, and derivations."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchMockHistory}
                  disabled={isLoadingHistory}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />}
                >
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={startMockTest}
                  disabled={isLoadingMock}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  Take new mock test
                </Button>
              </div>
            </div>

            {/* Performance Trend Card (If 2+ attempts) */}
            {scoreTrend && (
              <div
                className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  scoreTrend.isPositive
                    ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-[#14131F]'
                    : scoreTrend.isNegative
                    ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#14131F]'
                    : 'bg-[#FAFAF8] border-[#14131F]/10 text-[#14131F]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      scoreTrend.isPositive
                        ? 'bg-[#A3E635]/30 text-[#14131F]'
                        : scoreTrend.isNegative
                        ? 'bg-[#FB7185]/25 text-[#14131F]'
                        : 'bg-[#14131F]/5 text-[#14131F]'
                    }`}
                  >
                    {scoreTrend.isPositive ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : scoreTrend.isNegative ? (
                      <AlertCircle className="w-5 h-5 text-[#FB7185]" />
                    ) : (
                      <BarChart2 className="w-5 h-5 text-[#4338CA]" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[#14131F]/60 uppercase tracking-wider">
                        Performance trend
                      </span>
                      <Badge
                        variant={scoreTrend.isPositive ? 'positive' : scoreTrend.isNegative ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {scoreTrend.text}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm font-sans mt-1 text-[#14131F]/70">
                      Latest attempt scored <strong className="text-[#14131F] font-semibold">{scoreTrend.latest}%</strong> compared to <strong className="text-[#14131F] font-semibold">{scoreTrend.previous}%</strong> in your previous session.
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#14131F]/70 bg-white py-1.5 px-3 rounded-lg border border-[#14131F]/10 shrink-0 font-medium">
                  Total completed: <strong className="text-[#14131F] font-semibold">{historyList.length}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Loading History State */}
          {isLoadingHistory && (
            <div className="p-12 bg-white rounded-2xl border border-[#14131F]/8 text-center space-y-3 shadow-xs">
              <Loader2 className="w-6 h-6 animate-spin text-[#4338CA] mx-auto" />
              <p className="text-xs sm:text-sm text-[#14131F]/60 font-sans">Loading mock test history...</p>
            </div>
          )}

          {/* History Error State */}
          {historyError && !isLoadingHistory && (
            <div className="p-4 bg-[#FB7185]/15 border border-[#FB7185]/35 rounded-xl text-[#14131F] text-xs sm:text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FB7185]" />
              <span>{historyError}</span>
            </div>
          )}

          {/* Clean Invitation Empty History State */}
          {!isLoadingHistory && !historyError && historyList.length === 0 && (
            <div className="p-12 sm:p-16 bg-white rounded-2xl border border-[#14131F]/8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-display font-bold text-lg text-[#14131F]">No mock tests taken yet</h3>
                <p className="text-xs sm:text-sm text-[#14131F]/60 font-sans">
                  Take your first timed mock exam to diagnose your sectional strengths and build an empirical score history.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={startMockTest}
                  disabled={isLoadingMock}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Start full mock test
                </Button>
              </div>
            </div>
          )}

          {/* List of Past Attempts */}
          {!isLoadingHistory && historyList.length > 0 && (
            <div className="space-y-4">
              {historyList.map((item, idx) => {
                const tier = getReadinessTier(item.overallScore);
                const isLatest = idx === 0;
                const dateObj = new Date(item.completedAt);
                const dateStr = dateObj.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const timeStr = dateObj.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <RecordCard
                    key={item.sessionId || idx}
                    className="hover:border-[#14131F]/20 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left Info */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-lg font-display font-bold text-[#14131F]">{item.overallScore}%</span>
                          <span className="text-[10px] text-[#14131F]/50 font-sans uppercase">Score</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-base text-[#14131F]">
                              Mock attempt #{historyList.length - idx}
                            </span>
                            {isLatest && (
                              <Badge variant="positive" size="sm">
                                Latest attempt
                              </Badge>
                            )}
                            <Badge variant={tier.badgeVariant || 'neutral'} size="sm">
                              {tier.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#14131F]/60 font-sans">
                            <span>{dateStr} at {timeStr}</span>
                            <span>•</span>
                            <span>Duration: {formatDurationFriendly(item.timeTakenSeconds)}</span>
                            <span>•</span>
                            <span>{item.totalQuestions} Questions</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Sectional Breakdown */}
                      <div className="grid grid-cols-3 gap-4 border-y lg:border-y-0 lg:border-x border-[#14131F]/8 py-3.5 lg:py-0 lg:px-6 shrink-0">
                        <div className="text-center space-y-1">
                          <span className="text-[11px] text-[#14131F]/50 uppercase tracking-wider block font-sans">Quant</span>
                          <p className="text-sm font-display font-bold text-[#14131F]">{item.categoryScores?.Quantitative ?? 0}%</p>
                          <div className="w-16 mx-auto bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#4338CA] h-full rounded-full"
                              style={{ width: `${item.categoryScores?.Quantitative ?? 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <span className="text-[11px] text-[#14131F]/50 uppercase tracking-wider block font-sans">Logical</span>
                          <p className="text-sm font-display font-bold text-[#14131F]">{item.categoryScores?.Logical ?? 0}%</p>
                          <div className="w-16 mx-auto bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#4338CA] h-full rounded-full"
                              style={{ width: `${item.categoryScores?.Logical ?? 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <span className="text-[11px] text-[#14131F]/50 uppercase tracking-wider block font-sans">Verbal</span>
                          <p className="text-sm font-display font-bold text-[#14131F]">{item.categoryScores?.Verbal ?? 0}%</p>
                          <div className="w-16 mx-auto bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#4338CA] h-full rounded-full"
                              style={{ width: `${item.categoryScores?.Verbal ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center justify-end shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => viewSessionReport(item.sessionId)}
                          disabled={loadingReportSessionId === item.sessionId}
                          icon={loadingReportSessionId === item.sessionId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          iconPosition="right"
                        >
                          {loadingReportSessionId === item.sessionId ? 'Loading report...' : 'View report'}
                        </Button>
                      </div>
                    </div>
                  </RecordCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Errors display */}
      {(practiceLoadError || mockLoadError) && (
        <div className="p-4 bg-[#FB7185]/15 border border-[#FB7185]/35 rounded-xl text-[#14131F] text-xs sm:text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#FB7185]" />
          <span>{practiceLoadError || mockLoadError}</span>
        </div>
      )}

      {/* ================= ACTIVE PRACTICE VIEW ================= */}
      {activeSubMode === 'practice' && practiceQuestions.length > 0 && practiceQuestions[practiceIndex] && (
        <div className="bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 xl:p-10 space-y-6 shadow-xs animate-in fade-in">
          {/* Progress Bar & Header Toolbar */}
          <div className="space-y-4 pb-6 border-b border-[#14131F]/8">
            <div className="flex items-center justify-between text-xs font-sans text-[#14131F]/70">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-[#14131F] font-semibold">Question {practiceIndex + 1}</span>
                <span>of {practiceQuestions.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Drill score: <strong className="text-[#14131F] font-semibold">{practiceCorrectCount}</strong> / {practiceAttemptedCount}</span>
                <span className="text-[#14131F]/40">•</span>
                <span className="font-semibold text-[#4338CA]">
                  {Math.round(((practiceIndex + 1) / practiceQuestions.length) * 100)}% completed
                </span>
              </div>
            </div>

            {/* Indigo Progress Bar */}
            <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#4338CA] h-full rounded-full transition-all duration-300"
                style={{ width: `${((practiceIndex + 1) / practiceQuestions.length) * 100}%` }}
              />
            </div>

            {/* Metadata Badges & Exit Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-[#4338CA]/10 text-[#4338CA] font-medium">
                  {practiceQuestions[practiceIndex].category}
                </span>
                <span className="text-xs font-sans text-[#14131F]/60">
                  {practiceQuestions[practiceIndex].subtopic}
                </span>
                <Badge
                  variant={
                    practiceQuestions[practiceIndex].difficulty === 'Easy'
                      ? 'positive'
                      : practiceQuestions[practiceIndex].difficulty === 'Hard'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {practiceQuestions[practiceIndex].difficulty}
                </Badge>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveSubMode('selection')}
              >
                Exit drill
              </Button>
            </div>
          </div>

          {/* Question text */}
          <div className="space-y-5">
            <h3 className="font-display text-lg sm:text-xl text-[#14131F] font-bold whitespace-pre-wrap leading-relaxed">
              {practiceQuestions[practiceIndex].questionText}
            </h3>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {practiceQuestions[practiceIndex].options.map((option, idx) => {
                const isSelected = practiceSelectedOption === idx;
                const isCorrectAnswer = practiceCheckedResult && practiceCheckedResult.correctAnswerIndex === idx;
                const isWrongSelected = practiceCheckedResult && isSelected && !practiceCheckedResult.isCorrect;

                let cardStyle = 'bg-white border-[#14131F]/10 text-[#14131F] hover:border-[#14131F]/25 hover:bg-[#FAFAF8]';

                if (practiceCheckedResult) {
                  if (isCorrectAnswer) {
                    cardStyle = 'bg-[#A3E635]/20 border-2 border-[#A3E635] text-[#14131F] font-semibold';
                  } else if (isWrongSelected) {
                    cardStyle = 'bg-[#FB7185]/15 border-2 border-[#FB7185] text-[#14131F] font-semibold';
                  } else {
                    cardStyle = 'bg-[#FAFAF8] border-[#14131F]/8 text-[#14131F]/40 opacity-60';
                  }
                } else if (isSelected) {
                  cardStyle = 'bg-[#4338CA]/5 border-2 border-[#4338CA] text-[#14131F] font-semibold ring-2 ring-[#4338CA]/15';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={practiceCheckedResult !== null}
                    onClick={() => handlePracticeOptionSelect(idx)}
                    className={`p-4 rounded-xl border text-left text-xs sm:text-sm font-sans transition-all cursor-pointer flex items-start gap-3.5 ${cardStyle}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md border font-semibold text-xs flex items-center justify-center shrink-0 ${
                        isSelected && !practiceCheckedResult
                          ? 'bg-[#4338CA] text-white border-[#4338CA]'
                          : 'bg-white text-[#14131F] border-[#14131F]/15'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-relaxed mt-0.5">{option}</span>
                    {practiceCheckedResult && isCorrectAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-[#14131F] ml-auto shrink-0 mt-0.5" />
                    )}
                    {practiceCheckedResult && isWrongSelected && (
                      <XCircle className="w-4 h-4 text-[#FB7185] ml-auto shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instant feedback explanation box */}
          {practiceCheckedResult && (
            <div
              className={`p-5 sm:p-6 rounded-xl border space-y-2.5 animate-in fade-in ${
                practiceCheckedResult.isCorrect
                  ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-[#14131F]'
                  : 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#14131F]'
              }`}
            >
              <div className="flex items-center gap-2 font-display font-semibold text-sm">
                {practiceCheckedResult.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#14131F]" />
                    <span>Correct answer</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-[#FB7185]" />
                    <span>Incorrect choice</span>
                  </>
                )}
              </div>
              <div className="pt-1">
                <span className="text-xs font-semibold text-[#14131F]/60 uppercase tracking-wider block font-sans mb-1">
                  Derivation & Explanation:
                </span>
                <p className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap text-[#14131F]/85">
                  {practiceCheckedResult.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Practice Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#14131F]/8">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => startPractice(selectedCategory)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Restart drill
            </Button>

            {!practiceCheckedResult ? (
              <Button
                variant="primary"
                onClick={handlePracticeSubmitAnswer}
                disabled={practiceSelectedOption === null || isSubmittingPractice}
                icon={isSubmittingPractice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                iconPosition="right"
              >
                {isSubmittingPractice ? 'Verifying...' : 'Check answer'}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handlePracticeNextQuestion}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                iconPosition="right"
              >
                {practiceIndex + 1 === practiceQuestions.length ? 'Finish drill' : 'Next question'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ================= ACTIVE MOCK TEST EXAM VIEW ================= */}
      {activeSubMode === 'mock_test' && mockQuestions.length > 0 && currentMockQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in text-left">
          {/* Main Question Interface (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-[#14131F]/8 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xs">
            <div>
              {/* Progress Bar & Header Metadata */}
              <div className="space-y-4 pb-5 border-b border-[#14131F]/8">
                <div className="flex items-center justify-between text-xs font-sans text-[#14131F]/70">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-[#14131F] font-semibold">Question {mockCurrentIndex + 1}</span>
                    <span>of {mockQuestions.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{answeredMockCount} of {mockQuestions.length} answered</span>
                    <span className="text-[#14131F]/40">•</span>
                    <span className="font-semibold text-[#4338CA]">
                      {Math.round(((mockCurrentIndex + 1) / mockQuestions.length) * 100)}% progress
                    </span>
                  </div>
                </div>

                {/* Indigo Progress Bar */}
                <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4338CA] h-full rounded-full transition-all duration-300"
                    style={{ width: `${((mockCurrentIndex + 1) / mockQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question Metadata Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-[#4338CA]/10 text-[#4338CA] font-medium">
                      {currentMockQuestion.category}
                    </span>
                    <span className="text-xs font-sans text-[#14131F]/60">
                      {currentMockQuestion.subtopic}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-sans text-[#14131F]/60">
                    <span>Status:</span>
                    {typeof currentMockSelectedAnswer === 'number' ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40">
                        Answered (Opt {String.fromCharCode(65 + currentMockSelectedAnswer)})
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#14131F]/5 text-[#14131F]/60">
                        Unanswered
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="mt-6 space-y-5">
                <h3 className="font-display text-lg sm:text-xl text-[#14131F] font-bold whitespace-pre-wrap leading-relaxed">
                  {currentMockQuestion.questionText}
                </h3>

                {/* Question Options */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {currentMockQuestion.options.map((option, idx) => {
                    const isSelected = currentMockSelectedAnswer === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleMockOptionSelect(idx)}
                        className={`p-4 sm:p-5 rounded-xl border text-left text-xs sm:text-sm font-sans transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-[#4338CA]/5 border-2 border-[#4338CA] text-[#14131F] font-semibold ring-2 ring-[#4338CA]/15'
                            : 'bg-white border-[#14131F]/10 text-[#14131F] hover:border-[#14131F]/25 hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md border text-xs flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#4338CA] text-white border-[#4338CA] font-bold'
                              : 'border-[#14131F]/15 bg-white text-[#14131F] font-semibold'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed mt-0.5">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Nav Buttons */}
            <div className="pt-6 border-t border-[#14131F]/8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMockCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={mockCurrentIndex === 0}
                >
                  Previous
                </Button>
                {typeof currentMockSelectedAnswer === 'number' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMockClearSelection}
                    className="text-[#FB7185] hover:bg-[#FB7185]/10"
                  >
                    Clear choice
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMockCurrentIndex((prev) => Math.min(mockQuestions.length - 1, prev + 1))}
                  disabled={mockCurrentIndex === mockQuestions.length - 1}
                >
                  Next
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowSubmitModal(true)}
                >
                  Submit test
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side Info & Palette (1 col) */}
          <div className="space-y-6">
            {/* Countdown Timer Block (Calm by default, coral warning only when < 5 mins) */}
            <div
              className={`p-6 rounded-2xl border flex items-center justify-between shadow-xs ${
                timeLeftSeconds < 300
                  ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#14131F]'
                  : 'bg-white border-[#14131F]/8 text-[#14131F]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    timeLeftSeconds < 300
                      ? 'bg-[#FB7185]/25 text-[#FB7185]'
                      : 'bg-[#4338CA]/10 text-[#4338CA]'
                  }`}
                >
                  <Clock className={`w-5 h-5 ${timeLeftSeconds < 300 ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <span className="text-[11px] font-sans uppercase tracking-wider text-[#14131F]/50 block">Time remaining</span>
                  <span className="text-2xl font-display font-bold tracking-tight">{formatTime(timeLeftSeconds)}</span>
                </div>
              </div>

              <span className="text-xs font-medium px-2.5 py-1 bg-[#FAFAF8] rounded-lg border border-[#14131F]/10 text-[#14131F]/60">
                30:00 Total
              </span>
            </div>

            {/* Questions Palette Card */}
            <div className="bg-white rounded-2xl border border-[#14131F]/8 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#14131F]/8">
                <span className="text-xs font-display font-bold text-[#14131F] uppercase tracking-wider">Question palette</span>
                <span className="text-xs font-medium text-[#14131F]/60">{answeredMockCount} / {mockQuestions.length} answered</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {mockQuestions.map((q, idx) => {
                  const qId = q._id || `mock_q_${idx + 1}`;
                  const isAnswered = typeof mockAnswers[qId] === 'number';
                  const isCurrent = mockCurrentIndex === idx;

                  let btnStyle = 'bg-[#FAFAF8] border-[#14131F]/10 text-[#14131F]/60 hover:border-[#14131F]/30';
                  if (isCurrent) {
                    btnStyle = 'border-[#4338CA] bg-[#4338CA] text-white font-bold ring-2 ring-[#4338CA]/25';
                  } else if (isAnswered) {
                    btnStyle = 'bg-[#A3E635]/25 border-[#A3E635]/50 text-[#14131F] font-semibold';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setMockCurrentIndex(idx)}
                      className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-[#14131F]/8 flex items-center justify-between text-[11px] font-sans text-[#14131F]/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />
                  <span>Answered ({answeredMockCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14131F]/20" />
                  <span>Unanswered ({unansweredMockCount})</span>
                </div>
              </div>
            </div>

            {/* Quick Submit Block */}
            <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs text-[#14131F] space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5 text-[#14131F]">
                <AlertCircle className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>One-time submission</span>
              </p>
              <p className="text-[#14131F]/65 font-sans leading-relaxed">
                Answers will be locked upon submission and scored immediately across Quantitative, Logical, and Verbal benchmarks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14131F]/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#14131F]/10 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 text-left">
            <div>
              <h3 className="font-display font-bold text-xl text-[#14131F]">Submit aptitude mock test?</h3>
              <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1.5 font-sans">
                You are about to finalize your test session. Once submitted, answers cannot be edited and your diagnostic report will be generated.
              </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-[#14131F]/60 block font-sans">Answered</span>
                <p className="text-2xl font-display font-bold text-[#14131F]">{answeredMockCount} / {mockQuestions.length}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-[#14131F]/60 block font-sans">Unanswered</span>
                <p className={`text-2xl font-display font-bold ${unansweredMockCount > 0 ? 'text-[#FB7185]' : 'text-[#14131F]/60'}`}>
                  {unansweredMockCount}
                </p>
              </div>
            </div>

            {unansweredMockCount > 0 && (
              <p className="text-xs text-[#14131F] bg-[#FB7185]/15 p-3 rounded-xl border border-[#FB7185]/35 font-sans font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#FB7185]" />
                <span>You still have {unansweredMockCount} unanswered question{unansweredMockCount > 1 ? 's' : ''}.</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmittingMock}
              >
                Resume test
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={submitMockTest}
                disabled={isSubmittingMock}
                icon={isSubmittingMock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                iconPosition="right"
              >
                {isSubmittingMock ? 'Grading exam...' : 'Confirm & submit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MOCK TEST REPORT VIEW ================= */}
      {activeSubMode === 'mock_report' && mockReport && (
        <MockReportView
          report={mockReport}
          onRetake={startMockTest}
          onBack={() => setActiveSubMode(reportSourceMode)}
          backLabel={reportSourceMode === 'history' ? 'Back to History' : 'Back to Dashboard'}
          formatTime={formatTime}
          getReadinessTier={getReadinessTier}
        />
      )}
    </div>
  );
};
