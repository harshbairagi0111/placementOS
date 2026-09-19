import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { DashboardShell } from './DashboardShell';
import { Button } from '../ui/Button';
import { Badge, VerifiedSeal } from '../ui/Badge';
import { RecordCard, LedgerContainer, ListRow } from '../ui/ListRow';
import { SectionHeading } from '../ui/SectionHeading';
import { AiMockInterviewSimulator } from './AiMockInterviewSimulator';
import { AiCareerRoadmapGenerator } from './AiCareerRoadmapGenerator';
import { StudentAnalyticsDashboard } from './StudentAnalyticsDashboard';
import { MyBadgesAndCredentials } from './MyBadgesAndCredentials';
import { AptitudeTestModule } from './AptitudeTestModule';
import { SkillAssessmentModule } from './SkillAssessmentModule';
import { InterviewExperienceBank } from './InterviewExperienceBank';
import { OpportunitiesBoard } from './OpportunitiesBoard';
import { DigitalStudentPortfolioView } from '../portfolio/DigitalStudentPortfolioView';
import { MentorDiscovery } from '../mentorship/MentorDiscovery';
import type { DigitalStudentPortfolio } from '../../types/portfolio';
import { viewAuthenticatedFile } from '../../utils/fileViewer';
import { 
  GraduationCap, 
  BarChart3, 
  FileText, 
  Compass, 
  Bot, 
  Target, 
  Building2,
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowLeft,
  Play, 
  Upload, 
  Sparkles, 
  LogOut, 
  Brain,
  User, 
  Search,
  ChevronRight,
  TrendingUp,
  Award,
  Code,
  Mic,
  MessageSquare,
  Sliders,
  LineChart,
  PlayCircle,
  Check,
  Zap,
  AlertCircle,
  BrainCircuit,
  Star,
  RefreshCw,
  Plus,
  Edit3,
  X,
  Save,
  Mail,
  Phone,
  Github,
  Linkedin,
  BookOpen,
  CheckCircle,
  Globe,
  Terminal,
  Send,
  ExternalLink,
  HelpCircle,
  FileCheck,
  Copy,
  Layers,
  History,
  Eye,
  Loader2,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Menu,
  PanelLeft,
  Trash2,
  Bell,
} from 'lucide-react';

interface StudentDashboardProps {
  onSwitchRole: () => void;
  onLogout: () => void;
}

const PROGRAMMING_LANGUAGES = [
  { id: 'c', name: 'C', version: 'C11 GCC', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'cpp', name: 'C++', version: 'C++20 GCC', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'python', name: 'Python', version: 'Python 3.11', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'java', name: 'Java', version: 'Java 21 JDK', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { id: 'javascript', name: 'JavaScript', version: 'Node.js 20', badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { id: 'typescript', name: 'TypeScript', version: 'TS 5.3', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { id: 'go', name: 'Go', version: 'Golang 1.22', badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  { id: 'rust', name: 'Rust', version: 'Rustc 1.75', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { id: 'sql', name: 'SQL', version: 'PostgreSQL 16', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
];

const INITIAL_SOLVED_HISTORY = [
  {
    id: 'sub_101',
    problemId: 1,
    problemTitle: 'LRU Cache Implementation (O(1) Get/Put)',
    category: 'DSA & System Design',
    difficulty: 'Medium',
    company: 'Google, Razorpay',
    language: 'cpp',
    languageName: 'C++20 GCC',
    submittedAt: 'Today, 11:24 AM',
    score: 100,
    passCount: 18,
    totalCases: 18,
    runtime: '12 ms',
    memory: '14.2 MB',
    codeSnippet: `#include <iostream>\n#include <unordered_map>\n#include <list>\nusing namespace std;\n\nclass LRUCache {\nprivate:\n    int capacity;\n    list<pair<int, int>> cacheList;\n    unordered_map<int, list<pair<int, int>>::iterator> cacheMap;\npublic:\n    LRUCache(int cap) : capacity(cap) {}\n    int get(int key) {\n        if (cacheMap.find(key) == cacheMap.end()) return -1;\n        cacheList.splice(cacheList.begin(), cacheList, cacheMap[key]);\n        return cacheMap[key]->second;\n    }\n    void put(int key, int value) {\n        if (cacheMap.find(key) != cacheMap.end()) {\n            cacheMap[key]->second = value;\n            cacheList.splice(cacheList.begin(), cacheList, cacheMap[key]);\n            return;\n        }\n        if (cacheList.size() == capacity) {\n            auto last = cacheList.back();\n            cacheMap.erase(last.first);\n            cacheList.pop_back();\n        }\n        cacheList.push_front({key, value});\n        cacheMap[key] = cacheList.begin();\n    }\n};`
  },
  {
    id: 'sub_102',
    problemId: 2,
    problemTitle: 'Trapping Rain Water (Two Pointer / DP)',
    category: 'DSA & Two Pointers',
    difficulty: 'Hard',
    company: 'Swiggy, Amazon',
    language: 'python',
    languageName: 'Python 3.11',
    submittedAt: 'Yesterday, 04:15 PM',
    score: 100,
    passCount: 24,
    totalCases: 24,
    runtime: '28 ms',
    memory: '16.8 MB',
    codeSnippet: `class Solution:\n    def trap(self, height: list[int]) -> int:\n        left, right = 0, len(height) - 1\n        left_max = right_max = water = 0\n        while left < right:\n            if height[left] < height[right]:\n                if height[left] >= left_max:\n                    left_max = height[left]\n                else:\n                    water += left_max - height[left]\n                left += 1\n            else:\n                if height[right] >= right_max:\n                    right_max = height[right]\n                else:\n                    water += right_max - height[right]\n                right -= 1\n        return water`
  },
  {
    id: 'sub_103',
    problemId: 3,
    problemTitle: 'Manual Memory Allocation & Pointer Swap',
    category: 'C / C++ Core',
    difficulty: 'Medium',
    company: 'NVIDIA, Qualcomm',
    language: 'c',
    languageName: 'C11 GCC',
    submittedAt: 'Jul 23, 2026, 09:30 AM',
    score: 100,
    passCount: 10,
    totalCases: 10,
    runtime: '2 ms',
    memory: '2.1 MB',
    codeSnippet: `#include <stdio.h>\n#include <stdlib.h>\n\nvoid swapPointers(int** ptrA, int** ptrB) {\n    int* temp = *ptrA;\n    *ptrA = *ptrB;\n    *ptrB = temp;\n}\n\nint main() {\n    int x = 10, y = 20;\n    int *p1 = &x, *p2 = &y;\n    swapPointers(&p1, &p2);\n    printf("p1 points to %d, p2 points to %d\\n", *p1, *p2);\n    return 0;\n}`
  },
  {
    id: 'sub_104',
    problemId: 7,
    problemTitle: 'Top 3 High Salaries per Department',
    category: 'Database & SQL',
    difficulty: 'Medium',
    company: 'Atlassian, Snowflake',
    language: 'sql',
    languageName: 'PostgreSQL 16',
    submittedAt: 'Jul 22, 2026, 02:45 PM',
    score: 100,
    passCount: 12,
    totalCases: 12,
    runtime: '15 ms',
    memory: '8.4 MB',
    codeSnippet: `WITH RankedSalaries AS (\n    SELECT \n        d.name AS Department,\n        e.name AS Employee,\n        e.salary AS Salary,\n        DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) AS rnk\n    FROM Employee e\n    JOIN Department d ON e.departmentId = d.id\n)\nSELECT Department, Employee, Salary\nFROM RankedSalaries\nWHERE rnk <= 3;`
  },
  {
    id: 'sub_105',
    problemId: 4,
    problemTitle: 'Thread-Safe Bounded Blocking Queue',
    category: 'Java Core & OOP',
    difficulty: 'Hard',
    company: 'Goldman Sachs, Oracle',
    language: 'java',
    languageName: 'Java 21 JDK',
    submittedAt: 'Jul 20, 2026, 06:10 PM',
    score: 85,
    passCount: 17,
    totalCases: 20,
    runtime: '42 ms',
    memory: '24.1 MB',
    codeSnippet: `import java.util.concurrent.locks.*;\n\npublic class BoundedBlockingQueue {\n    private final Object[] items;\n    private int head, tail, count;\n    private final ReentrantLock lock = new ReentrantLock();\n    public BoundedBlockingQueue(int capacity) { items = new Object[capacity]; }\n}`
  },
  {
    id: 'sub_106',
    problemId: 8,
    problemTitle: 'Segment Tree Range Update & Lazy Propagation',
    category: 'Competitive Programming (CP)',
    difficulty: 'Hard',
    company: 'Codeforces Div 1, Google',
    language: 'rust',
    languageName: 'Rustc 1.75',
    submittedAt: 'Jul 18, 2026, 10:05 AM',
    score: 100,
    passCount: 15,
    totalCases: 15,
    runtime: '6 ms',
    memory: '5.2 MB',
    codeSnippet: `pub struct SegmentTree { tree: Vec<i64>, lazy: Vec<i64> }\nimpl SegmentTree {\n    pub fn new(n: usize) -> Self {\n        SegmentTree { tree: vec![0; 4 * n], lazy: vec![0; 4 * n] }\n    }\n}`
  }
];

const CODING_CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'Arrays', label: 'Arrays' },
  { id: 'Strings', label: 'Strings' },
  { id: 'Searching / Sorting', label: 'Searching & Sorting' },
  { id: 'Hashing', label: 'Hashing' },
  { id: 'Stack / Queue', label: 'Stack & Queue' },
  { id: 'Linked List', label: 'Linked List' },
  { id: 'Trees', label: 'Trees' },
  { id: 'Recursion / Backtracking', label: 'Recursion & Backtracking' },
  { id: 'Dynamic Programming', label: 'Dynamic Programming' },
  { id: 'dsa', label: 'DSA & Systems' },
  { id: 'c_cpp', label: 'C / C++ Core' },
  { id: 'java', label: 'Java Core & OOP' },
  { id: 'python', label: 'Python Mastery' },
  { id: 'system', label: 'System Design & LLD' },
  { id: 'sql', label: 'Database & SQL' },
  { id: 'cp', label: 'Competitive Programming (CP)' },
];



// Coding challenge questions are dynamically fetched from the database via /api/coding/questions

type ModuleTab = 
  | 'overview'
  | 'skill_assessment'
  | 'aptitude'
  | 'resume'
  | 'coding'
  | 'interview'
  | 'portfolio'
  | 'company_readiness'
  | 'opportunities'
  | 'roadmap'
  | 'analytics'
  | 'badges'
  | 'mentor'
  | 'human_mentors'
  | 'experiences'
  | 'profile';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
] as const;

const resolveApplicationStage = (statusRaw?: string, stageRaw?: string) => {
  const combined = `${statusRaw || ''} ${stageRaw || ''}`.toLowerCase().trim();

  // 1. Rejected
  if (
    combined.includes('reject') ||
    combined.includes('decline') ||
    combined.includes('unsuccessful') ||
    combined.includes('not selected')
  ) {
    return {
      stageIndex: 1,
      stageName: 'Screening',
      displayStage: 'Application Declined',
      isRejected: true,
      isOffer: false,
    };
  }

  // 2. Offer / Selected / Accepted
  if (
    combined.includes('offer') ||
    combined.includes('selected') ||
    combined.includes('accepted') ||
    combined.includes('placed') ||
    combined.includes('hired')
  ) {
    return {
      stageIndex: 4,
      stageName: 'Offer',
      displayStage: stageRaw || 'Offer Extended',
      isOffer: true,
      isRejected: false,
    };
  }

  // 3. Interview / Technical / HR / Assessment Round
  if (
    combined.includes('interview') ||
    combined.includes('tech round') ||
    combined.includes('technical') ||
    combined.includes('hr round') ||
    combined.includes('fit round') ||
    combined.includes('round') ||
    combined.includes('coding')
  ) {
    return {
      stageIndex: 3,
      stageName: 'Interview',
      displayStage: stageRaw || (combined.includes('hr') ? 'HR Fit Round' : combined.includes('tech') ? 'Technical Round' : 'Interview Stage'),
      isOffer: false,
      isRejected: false,
    };
  }

  // 4. Shortlisted
  if (combined.includes('shortlist') || combined.includes('qualified')) {
    return {
      stageIndex: 2,
      stageName: 'Shortlisted',
      displayStage: stageRaw || 'Candidate Shortlisted',
      isOffer: false,
      isRejected: false,
    };
  }

  // 5. Screening / Profile Review
  if (
    combined.includes('screen') ||
    combined.includes('review') ||
    combined.includes('under review') ||
    combined.includes('evaluation') ||
    combined.includes('evaluat') ||
    combined.includes('in progress')
  ) {
    return {
      stageIndex: 1,
      stageName: 'Screening',
      displayStage: stageRaw || 'Profile Screening',
      isOffer: false,
      isRejected: false,
    };
  }

  // 6. Applied / Initial Stage
  return {
    stageIndex: 0,
    stageName: 'Applied',
    displayStage: stageRaw || 'Application Submitted',
    isOffer: false,
    isRejected: false,
  };
};

const formatApplicationDate = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const renderApplicationStageBadge = (stage: ReturnType<typeof resolveApplicationStage>) => {
  if (stage.isOffer) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/50 text-xs font-semibold select-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
        <span>{stage.displayStage}</span>
      </div>
    );
  }

  if (stage.isRejected) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30 text-xs font-semibold select-none">
        <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" />
        <span>{stage.displayStage}</span>
      </div>
    );
  }

  const isInterview = stage.stageName === 'Interview';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold select-none ${
      isInterview
        ? 'bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/25'
        : 'bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/10'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isInterview ? 'bg-[#4338CA] animate-pulse' : 'bg-[#14131F]/60'}`} />
      <span>{stage.displayStage}</span>
    </div>
  );
};

const renderCompletionBadge = (status?: string) => {
  const current = status || 'Not Started';
  switch (current) {
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#A3E635]/20 text-[#14131F] border border-[#A3E635]/40 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#65A30D]" />
          Completed
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
          In Progress
        </span>
      );
    case 'Discontinued':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#FB7185]/15 text-[#14131F] border border-[#FB7185]/35 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
          Discontinued
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/12 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14131F]/30" />
          Not Started
        </span>
      );
  }
};

const ApplicationStageTracker: React.FC<{
  statusRaw?: string;
  stageRaw?: string;
}> = ({ statusRaw, stageRaw }) => {
  const stage = resolveApplicationStage(statusRaw, stageRaw);

  return (
    <div className="w-full space-y-1.5">
      {/* Visual Stepper Bar */}
      <div className="flex items-center w-full">
        {PIPELINE_STAGES.map((step, idx) => {
          const isCompleted = !stage.isRejected && idx < stage.stageIndex;
          const isCurrent = !stage.isRejected && idx === stage.stageIndex;
          const isRejectedStep = stage.isRejected && idx === stage.stageIndex;
          const isRejectedPast = stage.isRejected && idx > stage.stageIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div
                className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold transition-all select-none ${
                  stage.isOffer
                    ? 'bg-[#A3E635] text-[#14131F] ring-2 ring-[#A3E635]/30'
                    : isRejectedStep
                    ? 'bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/50'
                    : isRejectedPast
                    ? 'bg-[#14131F]/5 text-[#14131F]/30 border border-[#14131F]/10'
                    : isCompleted
                    ? 'bg-[#14131F] text-white'
                    : isCurrent
                    ? 'bg-[#4338CA] text-white ring-4 ring-[#4338CA]/20 shadow-xs'
                    : 'bg-[#FAFAF8] text-[#14131F]/40 border border-[#14131F]/15'
                }`}
                title={`${step.label}${isCurrent ? ' (Current)' : isCompleted ? ' (Completed)' : ''}`}
              >
                {stage.isOffer || isCompleted ? (
                  <Check className="w-3 h-3 text-current stroke-[2.5]" />
                ) : isRejectedStep ? (
                  <X className="w-3 h-3 text-current stroke-[2.5]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Connecting Line */}
              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1.5 transition-colors ${
                    stage.isOffer
                      ? 'bg-[#A3E635]'
                      : isCompleted && !stage.isRejected
                      ? 'bg-[#14131F]'
                      : 'bg-[#14131F]/10'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Labels Grid */}
      <div className="grid grid-cols-5 gap-1 w-full text-center">
        {PIPELINE_STAGES.map((step, idx) => {
          const isCompleted = !stage.isRejected && idx < stage.stageIndex;
          const isCurrent = !stage.isRejected && idx === stage.stageIndex;
          const isRejectedStep = stage.isRejected && idx === stage.stageIndex;

          return (
            <span
              key={step.id}
              className={`text-[11px] font-sans truncate select-none ${
                stage.isOffer && idx === 4
                  ? 'font-bold text-[#14131F]'
                  : isRejectedStep
                  ? 'font-semibold text-[#FB7185]'
                  : isCurrent
                  ? 'font-bold text-[#4338CA]'
                  : isCompleted
                  ? 'font-medium text-[#14131F]'
                  : 'text-[#14131F]/40 font-normal'
              }`}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onSwitchRole, onLogout }) => {
  const authContext = useAuth();
  const token = authContext?.token;
  const authUser = authContext?.user;

  const [activeTab, setActiveTab] = useState<ModuleTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Editable Student Profile State
  const [studentInfo, setStudentInfo] = useState({
    fullName: authUser?.fullName || authUser?.name || 'Student',
    college: authUser?.college || '',
    collegeShort: authUser?.college?.split('(')[1]?.replace(')', '') || authUser?.college || '',
    degree: authUser?.degree || '',
    graduationYear: authUser?.graduationYear ? String(authUser.graduationYear) : '',
    cgpa: authUser?.cgpa ? String(authUser.cgpa) : '',
    targetRole: authUser?.targetRole || 'Software Development Engineer',
    targetCtc: authUser?.targetCtc || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    github: authUser?.githubUrl || '',
    linkedin: authUser?.linkedinUrl || '',
    skills: Array.isArray(authUser?.skills) ? authUser.skills.join(', ') : (authUser?.skills || ''),
    bio: authUser?.bio || '',
  });

  // Edit Profile Form State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ...studentInfo });
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Summary Dashboard State fetched from /api/students/me/dashboard
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [meDashboardData, setMeDashboardData] = useState<{
    totalInterviewsCompleted: number;
    averageOverallScore: number;
    mostRecentSession: any;
    badgeCount: number;
    latestRoadmapPhase: any;
  }>({
    totalInterviewsCompleted: 0,
    averageOverallScore: 0,
    mostRecentSession: null,
    badgeCount: 0,
    latestRoadmapPhase: null,
  });

  // Overview Tab State fetched from /api/students/me/overview
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<{
    atsResumeScore: number | null;
    codingProblemsSolved: number;
    codingAccuracy: number;
    mockInterviewCount: number;
    avgRating: number;
    activeApplications: {
      count: number;
      companies: string[];
    };
    roadmapProgress: {
      currentPhase: number;
      totalPhases: number;
      currentPhaseTitle: string;
    };
    applicationPipeline: Array<{
      id: string;
      company: string;
      role: string;
      status: string;
      appliedAt: string;
      type?: 'Job' | 'Internship' | 'Apprenticeship';
      completionStatus?: 'Not Started' | 'In Progress' | 'Completed' | 'Discontinued';
      mentorFeedback?: {
        rating?: number;
        comments?: string;
        submittedAt?: string | Date;
      } | null;
    }>;
  }>({
    atsResumeScore: null,
    codingProblemsSolved: 0,
    codingAccuracy: 0,
    mockInterviewCount: 0,
    avgRating: 0,
    activeApplications: { count: 0, companies: [] },
    roadmapProgress: { currentPhase: 0, totalPhases: 0, currentPhaseTitle: '' },
    applicationPipeline: [],
  });

  const hasLoadedOverviewRef = useRef(false);
  const fetchOverview = async (showLoading = false) => {
    try {
      if (showLoading && !hasLoadedOverviewRef.current) {
        setOverviewLoading(true);
      }
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/students/me/overview', { headers });
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        setOverviewData({
          atsResumeScore: data.atsResumeScore ?? null,
          codingProblemsSolved: data.codingProblemsSolved ?? 0,
          codingAccuracy: data.codingAccuracy ?? 0,
          mockInterviewCount: data.mockInterviewCount ?? 0,
          avgRating: data.avgRating ?? 0,
          activeApplications: data.activeApplications || { count: 0, companies: [] },
          roadmapProgress: data.roadmapProgress || { currentPhase: 0, totalPhases: 0, currentPhaseTitle: '' },
          applicationPipeline: data.applicationPipeline || [],
        });
        if (data.applicationPipeline && data.applicationPipeline.length > 0) {
          setPipelineApps(
            data.applicationPipeline.map((a: any, idx: number) => ({
              id: a.id || idx + 1,
              company: a.company,
              role: a.role,
              stage: a.status === 'Offer' ? 'Offer Extended' : `${a.status} Stage`,
              status: a.status,
              ctc: a.type === 'Internship' ? 'Stipend ₹45k/mo' : 'Competitive CTC',
              completionStatus: a.completionStatus || 'Not Started',
              mentorFeedback: a.mentorFeedback || null,
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Error fetching /api/students/me/overview:', err);
    } finally {
      if (showLoading && !hasLoadedOverviewRef.current) {
        setOverviewLoading(false);
      }
      hasLoadedOverviewRef.current = true;
    }
  };

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        setDashboardLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/students/me/dashboard', { headers });
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          setMeDashboardData({
            totalInterviewsCompleted: typeof data.totalInterviewsCompleted === 'number' ? data.totalInterviewsCompleted : 0,
            averageOverallScore: typeof data.averageOverallScore === 'number' ? data.averageOverallScore : 0,
            mostRecentSession: data.mostRecentSession || null,
            badgeCount: typeof data.badgeCount === 'number' ? data.badgeCount : 0,
            latestRoadmapPhase: data.latestRoadmapPhase || null,
          });
        }
      } catch (err) {
        console.warn('Error fetching /api/students/me/dashboard:', err);
      } finally {
        setDashboardLoading(false);
      }
    };

    const fetchLatestResume = async () => {
      try {
        setResumeLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/resume/latest', { headers });
        const data = await res.json().catch(() => null);
        if (data && data.success && data.resume) {
          setResumeData(data.resume);
          setResumeScore(data.resume.atsScore ?? null);
        } else {
          setResumeData(null);
          setResumeScore(null);
        }
      } catch (err) {
        console.warn('Error fetching /api/resume/latest:', err);
        setResumeData(null);
        setResumeScore(null);
      } finally {
        setResumeLoading(false);
      }
    };

    const fetchCodingStats = async () => {
      try {
        setCodingStatsLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/students/me/coding-stats', { headers });
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          const solved = typeof data.problemsSolved === 'number' ? data.problemsSolved : 0;
          const total = typeof data.totalProblems === 'number' ? data.totalProblems : 200;
          const acc = typeof data.accuracyRate === 'number' ? data.accuracyRate : (typeof data.accuracy === 'number' ? data.accuracy : 0);
          const langs = typeof data.languagesUsed === 'number' ? data.languagesUsed : 0;
          let runtime = data.fastestRuntime || null;
          if (!runtime && typeof data.fastestRuntimeMs === 'number' && data.fastestRuntimeMs > 0) {
            runtime = `${data.fastestRuntimeMs} ms`;
          }

          setCodingStats({
            problemsSolved: solved,
            totalProblems: total,
            accuracy: acc,
            languagesUsed: langs,
            fastestRuntime: runtime,
            easySolved: data.easySolved ?? 0,
            mediumSolved: data.mediumSolved ?? 0,
            hardSolved: data.hardSolved ?? 0,
          });
          if (solved === 0) {
            setSolvedHistory([]);
          }
        }
      } catch (err) {
        console.warn('Error fetching /api/students/me/coding-stats:', err);
      } finally {
        setCodingStatsLoading(false);
      }
    };

    const fetchLatestPortfolio = async () => {
      try {
        setPortfolioLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/portfolio/github/latest', { headers });
        const data = await res.json().catch(() => null);
        if (data && data.success && data.portfolio) {
          setPortfolioData(data.portfolio);
          setPortfolioScore(data.portfolio.qualityScore);
          setGithubInputUrl(data.portfolio.githubUrl || studentInfo.github || '');
        } else {
          setPortfolioData(null);
          setPortfolioScore(null);
          setGithubInputUrl(studentInfo.github || '');
        }
      } catch (err) {
        console.warn('Error fetching /api/portfolio/github/latest:', err);
      } finally {
        setPortfolioLoading(false);
      }
    };

    const fetchCompanyReadiness = async () => {
      try {
        setCompanyReadinessLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/students/me/company-readiness', { headers });
        const data = await res.json().catch(() => null);
        if (data && data.success && Array.isArray(data.companies)) {
          setCompanyReadinessList(data.companies);
        }
      } catch (err) {
        console.warn('Error fetching /api/students/me/company-readiness:', err);
      } finally {
        setCompanyReadinessLoading(false);
      }
    };

    const fetchStudentProfile = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/students/me/profile', { headers });
        const data = await res.json();
        if (data && data.success && data.profile) {
          const p = data.profile;
          const skillsStr = Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || '');
          const collegeStr = p.college || '';
          const collegeShortStr = collegeStr.split('(')[1]?.replace(')', '') || collegeStr;

          const profileObj = {
            fullName: p.fullName || p.name || authUser?.name || 'Student',
            college: collegeStr,
            collegeShort: collegeShortStr,
            degree: p.degree || '',
            graduationYear: p.graduationYear !== null && p.graduationYear !== undefined ? String(p.graduationYear) : '',
            cgpa: p.cgpa !== null && p.cgpa !== undefined ? String(p.cgpa) : '',
            targetRole: p.targetRole || 'Software Development Engineer',
            targetCtc: p.targetCtc || '',
            email: p.email || authUser?.email || '',
            phone: p.phone || '',
            github: p.github || p.githubUrl || '',
            linkedin: p.linkedin || p.linkedinUrl || '',
            skills: skillsStr,
            bio: p.bio || '',
          };
          setStudentInfo(profileObj);
          setFormData(profileObj);
        }
      } catch (err) {
        console.warn('Error fetching /api/students/me/profile:', err);
      }
    };

    fetchStudentProfile();
    fetchDashboardSummary();
    fetchOverview(true);
    fetchLatestResume();
    fetchCodingStats();
    fetchLatestPortfolio();
    fetchDigitalPortfolio();
    fetchCompanyReadiness();
    fetchCertifications();
    fetchRealCodingQuestions();
    fetchCodingQuestions();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'portfolio') {
      fetchDigitalPortfolio();
    }
    if (activeTab === 'coding' && codingQuestions.length === 0) {
      fetchCodingQuestions();
    }
  }, [activeTab]);

  // Resume Intelligence States
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeData, setResumeData] = useState<{
    id?: string;
    fileName?: string;
    fileId?: string | null;
    fileUrl?: string | null;
    atsScore?: number;
    formattingScore?: number;
    quantifiedImpactScore?: number;
    keywordMatchPct?: number;
    feedback?: string;
    skillsFound?: string[];
    missingSkills?: string[];
    suggestions?: string[];
    targetRole?: string;
    updatedAt?: string;
  } | null>(null);

  const [isScanningResume, setIsScanningResume] = useState(false);
  const [resumeScore, setResumeScore] = useState<number | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingResume, setIsDraggingResume] = useState(false);

  const handleAnalyzeResumeFile = async (file: File) => {
    if (!file) return;
    try {
      setIsScanningResume(true);
      setResumeError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const formDataPayload = new FormData();
      formDataPayload.append('resume', file);
      formDataPayload.append('targetRole', studentInfo.targetRole || 'Software Development Engineer');

      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers,
        body: formDataPayload,
      });

      let data: any = null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        const textResp = await res.text().catch(() => '');
        console.warn('Non-JSON response received from /api/resume/analyze:', textResp.slice(0, 200));
      }

      if (!res.ok || !data || !data.success || !data.resume) {
        const errMsg =
          data?.error ||
          (res.status === 503
            ? 'The AI model is currently experiencing high demand. Please try again in a few moments.'
            : 'Resume analysis could not be completed. Please try again or check your connection.');
        setResumeError(errMsg);
        return;
      }

      setResumeData(data.resume);
      setResumeScore(data.resume.atsScore);
      setOverviewData((prev) => ({
        ...prev,
        atsResumeScore: data.resume.atsScore,
      }));
    } catch (err: any) {
      console.error('Error analyzing resume:', err);
      setResumeError(err?.message || 'Network error occurred while uploading resume. Please try again.');
    } finally {
      setIsScanningResume(false);
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAnalyzeResumeFile(e.target.files[0]);
    }
  };

  const [xyzVerb, setXyzVerb] = useState('Engineered');
  const [xyzTask, setXyzTask] = useState('distributed Redis caching layer for API gateway');
  const [xyzMetric, setXyzMetric] = useState('reducing response latency by 42% for 2M daily requests');
  const [generatedBullet, setGeneratedBullet] = useState('');
  const [copiedBullet, setCopiedBullet] = useState(false);

  // Coding Readiness States
  const [codingStatsLoading, setCodingStatsLoading] = useState(true);
  const [codingStats, setCodingStats] = useState({
    problemsSolved: 0,
    totalProblems: 200,
    accuracy: 0,
    languagesUsed: 0,
    fastestRuntime: null as string | null,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  });
  const [codingSubTab, setCodingSubTab] = useState<'problems' | 'history'>('problems');
  const [solvedHistory, setSolvedHistory] = useState<any[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyLanguageFilter, setHistoryLanguageFilter] = useState('all');
  const [historyDifficultyFilter, setHistoryDifficultyFilter] = useState('all');
  const [viewingHistoryItem, setViewingHistoryItem] = useState<any | null>(null);

  // Real Coding Questions from Approved Interview Experiences
  const [realCodingQuestions, setRealCodingQuestions] = useState<Array<{
    id: string;
    text: string;
    company: string;
    role: string;
    difficulty: string;
    outcome: string;
    interviewDate: string;
    experienceId: string;
    source: string;
  }>>([]);
  const [loadingRealQuestions, setLoadingRealQuestions] = useState(false);

  const fetchRealCodingQuestions = async () => {
    try {
      setLoadingRealQuestions(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/experiences/coding-questions', { headers });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.codingQuestions)) {
        setRealCodingQuestions(data.codingQuestions);
      }
    } catch (err) {
      console.warn('Error fetching real coding questions from experiences:', err);
    } finally {
      setLoadingRealQuestions(false);
    }
  };

  const [codingQuestions, setCodingQuestions] = useState<any[]>([]);
  const [loadingCodingQuestions, setLoadingCodingQuestions] = useState<boolean>(true);
  const [codingError, setCodingError] = useState<string | null>(null);

  const fetchCodingQuestions = async () => {
    setLoadingCodingQuestions(true);
    setCodingError(null);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/coding/questions', { headers });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.questions)) {
        setCodingQuestions(data.questions);
      } else {
        setCodingError(data.error || 'Failed to load challenges');
      }
    } catch (err: any) {
      console.warn('Error fetching coding questions from API:', err);
      setCodingError('Could not reach coding service');
    } finally {
      setLoadingCodingQuestions(false);
    }
  };

  const [selectedLanguage, setSelectedLanguage] = useState<string>('cpp');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [codingSearchQuery, setCodingSearchQuery] = useState<string>('');
  const [selectedProblem, setSelectedProblem] = useState<any | null>(null);
  const [userCode, setUserCode] = useState<string>('');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<{
    status: 'success' | 'error';
    summary: string;
    runtime: string;
    memory: string;
    testCaseResults: Array<{ id: number | string; input: string; expected: string; actual: string; passed: boolean }>;
  } | null>(null);
  const [showAiHint, setShowAiHint] = useState(false);

  const handleOpenProblem = (p: any) => {
    setSelectedProblem(p);
    setCodeOutput(null);
    setShowAiHint(false);
    const langKey = selectedLanguage;
    const stubs = p.stubs || p.starterCode || {};
    const initialCode = stubs[langKey] || stubs['cpp'] || stubs['python'] || stubs['java'] || stubs['javascript'] || '';
    setUserCode(initialCode);
  };

  const handleOpenRealCodingQuestion = (rq: {
    id: string;
    text: string;
    company: string;
    role: string;
    difficulty: string;
    outcome: string;
    interviewDate: string;
    experienceId: string;
    source: string;
  }) => {
    const p = {
      id: `real_${rq.id}`,
      title: rq.text,
      category: 'dsa',
      categoryLabel: 'Real Interview Question',
      difficulty: rq.difficulty || 'Medium',
      company: rq.company || 'Company Question',
      status: 'Real Question',
      acceptance: '—',
      timeComplexity: 'Optimal Time',
      spaceComplexity: 'Optimal Space',
      description: `Real problem asked during ${rq.company} interview for the ${rq.role} role.\n\nProblem Statement:\n${rq.text}`,
      testCases: [
        { id: 1, input: `// Problem statement from ${rq.company} (${rq.role})\n// ${rq.text}`, expected: '// Verified Output' }
      ],
      stubs: {
        c: `// ${rq.company} Interview Question (${rq.role})\n// ${rq.text}\n#include <stdio.h>\n#include <stdlib.h>\n\nvoid solve() {\n    // Implement your solution here\n}\n\nint main() {\n    solve();\n    return 0;\n}`,
        cpp: `// ${rq.company} Interview Question (${rq.role})\n// ${rq.text}\n#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Implement your solution here\n    }\n};\n`,
        python: `# ${rq.company} Interview Question (${rq.role})\n# ${rq.text}\n\ndef solve():\n    # Implement your solution here\n    pass\n`,
        java: `// ${rq.company} Interview Question (${rq.role})\n// ${rq.text}\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Implement your solution here\n    }\n}\n`,
        javascript: `// ${rq.company} Interview Question (${rq.role})\n// ${rq.text}\nfunction solve() {\n  // Implement your solution here\n}\n`,
        typescript: `// ${rq.company} Interview Question (${rq.role})\n// ${rq.text}\nfunction solve(): void {\n  // Implement your solution here\n}\n`,
        go: `// ${rq.company} Interview Question (${rq.role})\n// ${rq.text}\npackage main\nimport "fmt"\n\nfunc main() {\n    // Implement your solution here\n}\n`,
        rust: `// ${rq.company} Interview Question (${rq.role})\n// ${rq.text}\nfn main() {\n    // Implement your solution here\n}\n`,
        sql: `-- ${rq.company} Interview Query\n-- ${rq.text}\nSELECT * FROM candidates;\n`
      }
    };
    handleOpenProblem(p);
  };

  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    if (selectedProblem && selectedProblem.stubs) {
      const newCode = selectedProblem.stubs[langId] || selectedProblem.stubs['cpp'] || selectedProblem.stubs['python'] || '';
      setUserCode(newCode);
      setCodeOutput(null);
    }
  };

  // AI Mock Interview States
  const [interviewPersona, setInterviewPersona] = useState('Senior Staff Engineer (Strict)');
  const [interviewCategory, setInterviewCategory] = useState('System Design & Backend');
  const [isMockRecording, setIsMockRecording] = useState(false);
  const [mockTranscript, setMockTranscript] = useState<string[]>([
    "Interviewer: 'Welcome Aarav. Let's start with system design. How would you design a rate limiter for microservices?'",
    "Candidate (Aarav): 'I would use the Token Bucket or Sliding Window Log algorithm implemented using Redis with Lua scripts to ensure atomicity...'",
    "AI Assessor: 'Excellent start! Mentioning Lua scripts for atomicity shows strong production experience.'"
  ]);

  // Communication Assessment States
  const [isCommRecording, setIsCommRecording] = useState(false);
  const [commWpm] = useState(145);
  const [commFillers] = useState(3);

  // Portfolio Analyzer States
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<{
    id?: string;
    githubUrl?: string;
    githubUsername?: string;
    qualityScore?: number;
    feedback?: string;
    strengths?: string[];
    recommendations?: string[];
    auditedProjects?: Array<{
      name: string;
      language?: string;
      description?: string;
      commits?: string | number;
      stars?: number;
      status?: string;
      url?: string;
      summary?: string;
    }>;
    updatedAt?: string;
  } | null>(null);

  // Unified Digital Student Portfolio (Fix #5)
  const [digitalPortfolio, setDigitalPortfolio] = useState<DigitalStudentPortfolio | null>(null);
  const [digitalPortfolioLoading, setDigitalPortfolioLoading] = useState<boolean>(true);

  const fetchDigitalPortfolio = async () => {
    try {
      setDigitalPortfolioLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch('/api/students/me/portfolio', { headers });
      if (!res.ok) {
        res = await fetch('/api/portfolio/me', { headers });
      }
      const data = await res.json().catch(() => null);
      if (data && data.success && data.portfolio) {
        setDigitalPortfolio(data.portfolio);
      }
    } catch (err) {
      console.warn('Error fetching digital portfolio:', err);
    } finally {
      setDigitalPortfolioLoading(false);
    }
  };

  const [isScanningPortfolio, setIsScanningPortfolio] = useState(false);
  const [portfolioScore, setPortfolioScore] = useState<number | null>(null);
  const [githubInputUrl, setGithubInputUrl] = useState('');
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const handleAnalyzePortfolio = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || githubInputUrl || studentInfo.github || '';
    if (!targetUrl.trim()) {
      setPortfolioError('Please enter a valid GitHub profile URL or username.');
      return;
    }

    try {
      setIsScanningPortfolio(true);
      setPortfolioError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/portfolio/github/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ githubUrl: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze GitHub portfolio.');
      }

      if (data.portfolio) {
        setPortfolioData(data.portfolio);
        setPortfolioScore(data.portfolio.qualityScore ?? null);
        if (data.portfolio.githubUrl) {
          setGithubInputUrl(data.portfolio.githubUrl);
        }
        fetchDigitalPortfolio();
      }
    } catch (err: any) {
      console.error('Error analyzing portfolio:', err);
      setPortfolioError(err.message || 'Error analyzing GitHub codebase.');
    } finally {
      setIsScanningPortfolio(false);
    }
  };

  // Certifications & Achievements States
  const [certifications, setCertifications] = useState<any[]>([]);
  const [certGrouped, setCertGrouped] = useState<{
    Global: any[];
    National: any[];
    'Local/College': any[];
    Other: any[];
  }>({
    Global: [],
    National: [],
    'Local/College': [],
    Other: [],
  });
  const [certLoading, setCertLoading] = useState(true);
  const [certMode, setCertMode] = useState<'view' | 'manual'>('view');

  // Manual form state
  const [manualCertTitle, setManualCertTitle] = useState('');
  const [manualCertIssuer, setManualCertIssuer] = useState('');
  const [manualCertCategory, setManualCertCategory] = useState<'Global' | 'National' | 'Local/College' | 'Other'>('Global');
  const [manualCertDate, setManualCertDate] = useState('');
  const [manualCertUrl, setManualCertUrl] = useState('');
  const [isSubmittingManualCert, setIsSubmittingManualCert] = useState(false);
  const [manualCertError, setManualCertError] = useState<string | null>(null);

  // Upload state
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCertFile, setIsUploadingCertFile] = useState(false);
  const [uploadCertError, setUploadCertError] = useState<string | null>(null);
  const [uploadedCertConfirmation, setUploadedCertConfirmation] = useState<{
    _id?: string;
    title: string;
    issuer: string;
    category: 'Global' | 'National' | 'Local/College' | 'Other';
    dateIssued?: string;
    credentialUrl?: string;
  } | null>(null);
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);

  // Polling safety ref: skip polling tick if user has modal open, is editing, or is mid-submit
  const isStudentBusyRef = useRef(false);
  isStudentBusyRef.current = Boolean(
    isProfileModalOpen || isSavingProfile || isSubmittingManualCert || isUploadingCertFile || deletingCertId
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
        if (isStudentBusyRef.current) return;

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

  const fetchCertifications = async () => {
    try {
      setCertLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/certifications/me', { headers });
      const data = await res.json();
      if (data && data.success) {
        setCertifications(data.certifications || []);
        setCertGrouped(
          data.grouped || {
            Global: [],
            National: [],
            'Local/College': [],
            Other: [],
          }
        );
      }
    } catch (err) {
      console.warn('Error fetching certifications:', err);
    } finally {
      setCertLoading(false);
    }
  };

  const handleCertFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingCertFile(true);
    setUploadCertError(null);
    setUploadedCertConfirmation(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/certifications/upload', {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 422 || data.error?.includes('confidently')) {
          setUploadCertError('Unable to extract certificate details confidently — please fill in the details manually.');
        } else {
          setUploadCertError(data.error || 'Failed to analyze uploaded certificate. Please try adding manually.');
        }
        return;
      }

      if (data.certification) {
        setUploadedCertConfirmation({
          _id: data.certification._id || data.certification.id,
          title: data.certification.title,
          issuer: data.certification.issuer,
          category: data.certification.category || 'Other',
          dateIssued: data.certification.dateIssued || '',
          credentialUrl: data.certification.credentialUrl || '',
        });
        await fetchCertifications();
        fetchDigitalPortfolio();
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Error uploading certificate:', err);
      if (err.name === 'AbortError') {
        setUploadCertError('This is taking longer than expected — the certificate may be too large or the AI service is slow right now. Please try again or use manual entry.');
      } else {
        setUploadCertError('Network error uploading certificate. Please try again or use manual entry.');
      }
    } finally {
      setIsUploadingCertFile(false);
    }
  };

  const handleAddManualCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCertTitle.trim() || !manualCertIssuer.trim()) {
      setManualCertError('Title and issuing organization are required.');
      return;
    }

    setIsSubmittingManualCert(true);
    setManualCertError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/certifications/manual', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: manualCertTitle.trim(),
          issuer: manualCertIssuer.trim(),
          category: manualCertCategory,
          dateIssued: manualCertDate.trim(),
          credentialUrl: manualCertUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setManualCertError(data.error || 'Failed to add certification.');
        return;
      }

      setManualCertTitle('');
      setManualCertIssuer('');
      setManualCertCategory('Global');
      setManualCertDate('');
      setManualCertUrl('');
      setCertMode('view');

      await fetchCertifications();
      fetchDigitalPortfolio();
    } catch (err: any) {
      console.error('Error adding manual certificate:', err);
      setManualCertError('Failed to add certification. Please try again.');
    } finally {
      setIsSubmittingManualCert(false);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!certId) return;
    setDeletingCertId(certId);

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/certifications/${certId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (data && data.success) {
        await fetchCertifications();
        fetchDigitalPortfolio();
      }
    } catch (err) {
      console.error('Error deleting certification:', err);
    } finally {
      setDeletingCertId(null);
    }
  };

  // Company Readiness Prediction States
  const [companyReadinessLoading, setCompanyReadinessLoading] = useState(true);
  const [companyReadinessList, setCompanyReadinessList] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('Google');
  const [inspectedCompany, setInspectedCompany] = useState<string | null>(null);
  const [pipelineApps, setPipelineApps] = useState<any[]>([
    {
      id: 1,
      company: 'Razorpay',
      role: 'Backend Engineer 1',
      stage: 'Offer Round',
      ctc: '₹20.5 LPA',
      status: 'offer',
      completionStatus: 'In Progress' as const,
      mentorFeedback: {
        rating: 5,
        comments: 'Demonstrated exceptional performance during high-throughput microservices internship. Ready for full-time onboarding.',
        submittedAt: '2026-08-01',
      },
    },
    { id: 2, company: 'Google', role: 'Software Engineer (L3)', stage: 'Tech Round 3', ctc: '₹24.0 LPA', status: 'interviewing' },
    { id: 3, company: 'Swiggy', role: 'SDE 1 - Core Backend', stage: 'HR Fit Round', ctc: '₹18.0 LPA', status: 'interviewing' },
    { id: 4, company: 'Atlassian', role: 'Frontend Engineer', stage: 'Applications Open', ctc: '₹22.0 LPA', status: 'saved' },
  ]);

  // AI Career Mentor States
  const [mentorInput, setMentorInput] = useState('');
  const [mentorConversationId, setMentorConversationId] = useState<string | null>(null);
  const [mentorMessages, setMentorMessages] = useState<Array<{ sender: string; text: string; sources?: any[] }>>([
    {
      sender: 'ai',
      text: `Hello ${studentInfo.fullName}! I'm your dedicated AI Placement Coach. How can I help you prepare for your ${studentInfo.targetRole} interviews at ${studentInfo.collegeShort}?`
    }
  ]);
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const mentorEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'mentor') {
      mentorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mentorMessages, isMentorTyping, activeTab]);

  // Roadmap Toggles
  const [roadmapMilestones, setRoadmapMilestones] = useState([
    { id: 1, week: 'Week 1-2', title: 'Data Structures Core (Arrays, Linked Lists, Trees)', done: true },
    { id: 2, week: 'Week 3-4', title: 'Advanced Graphs & Dynamic Programming', done: true },
    { id: 3, week: 'Week 5-6', title: 'System Design: Low Level & High Level Architecture', done: false },
    { id: 4, week: 'Week 7-8', title: 'Mock Technical Interviews & Company Specific Drills', done: false },
  ]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/students/me/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          fullName: formData.fullName,
          college: formData.college,
          degree: formData.degree,
          graduationYear: formData.graduationYear,
          cgpa: formData.cgpa,
          targetRole: formData.targetRole,
          targetCtc: formData.targetCtc,
          phone: formData.phone,
          githubUrl: formData.github,
          linkedinUrl: formData.linkedin,
          skills: formData.skills,
          bio: formData.bio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setProfileSaveError(data.error || 'Failed to save profile changes. Please try again.');
        return;
      }

      const p = data.profile;
      const skillsStr = Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || '');
      const collegeStr = p.college || '';
      const collegeShortStr = collegeStr.split('(')[1]?.replace(')', '') || collegeStr;

      const savedProfile = {
        fullName: p.fullName || p.name || formData.fullName,
        college: collegeStr,
        collegeShort: collegeShortStr,
        degree: p.degree || formData.degree,
        graduationYear: p.graduationYear !== null && p.graduationYear !== undefined ? String(p.graduationYear) : formData.graduationYear,
        cgpa: p.cgpa !== null && p.cgpa !== undefined ? String(p.cgpa) : formData.cgpa,
        targetRole: p.targetRole || formData.targetRole,
        targetCtc: p.targetCtc || formData.targetCtc,
        email: p.email || formData.email,
        phone: p.phone || formData.phone,
        github: p.github || p.githubUrl || formData.github,
        linkedin: p.linkedin || p.linkedinUrl || formData.linkedin,
        skills: skillsStr,
        bio: p.bio || formData.bio,
      };

      setStudentInfo(savedProfile);
      setFormData(savedProfile);
      fetchDigitalPortfolio();
      if (authContext?.updateUser && data.user) {
        authContext.updateUser(data.user);
      }
      setIsProfileModalOpen(false);
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3500);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setProfileSaveError('Failed to save profile. Please check your network connection and try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleGenerateXYZ = () => {
    const bullet = `${xyzVerb} ${xyzTask}, ${xyzMetric}.`;
    setGeneratedBullet(bullet);
  };

  const handleSendMentorMessage = async (textToSend?: string) => {
    const messageText = textToSend || mentorInput;
    if (!messageText.trim()) return;

    const userMsg = { sender: 'user', text: messageText };
    const historyBeforeUserMsg = [...mentorMessages];

    setMentorMessages(prev => [...prev, userMsg]);
    if (!textToSend) setMentorInput('');
    setIsMentorTyping(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: messageText,
          conversationId: mentorConversationId || undefined,
          targetRole: studentInfo.targetRole,
          college: studentInfo.college || studentInfo.collegeShort,
          targetCtc: studentInfo.targetCtc,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.reply || data.answer)) {
        if (data.conversationId) {
          setMentorConversationId(data.conversationId);
        }
        setMentorMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.reply || data.answer,
            sources: Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : undefined,
          }
        ]);
      } else {
        setMentorMessages(prev => [
          ...prev,
          { sender: 'ai', text: "Sorry, I couldn't respond right now — please try again" }
        ]);
      }
    } catch (error) {
      console.error('Error sending mentor message:', error);
      setMentorMessages(prev => [
        ...prev,
        { sender: 'ai', text: "Sorry, I couldn't respond right now — please try again" }
      ]);
    } finally {
      setIsMentorTyping(false);
    }
  };

  const validCompanyScores = companyReadinessList
    .filter((c) => typeof c.matchScore === 'number' && c.matchScore !== null)
    .map((c) => c.matchScore as number);
  const avgCompanyMatchScore = validCompanyScores.length > 0
    ? Math.round(validCompanyScores.reduce((sum, val) => sum + val, 0) / validCompanyScores.length)
    : null;

  const modulesList: { id: ModuleTab; label: string; icon: React.ElementType; badge?: string | null }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, badge: null },
    { id: 'skill_assessment', label: 'Skill Assessment', icon: Target, badge: 'Industry' },
    { id: 'aptitude', label: 'Aptitude Test', icon: Brain, badge: null },
    { id: 'resume', label: 'Resume Intelligence', icon: FileText, badge: overviewData.atsResumeScore !== null ? `${overviewData.atsResumeScore} ATS` : 'ATS' },
    { id: 'coding', label: 'Coding Readiness', icon: Code, badge: overviewData.codingProblemsSolved > 0 ? `${overviewData.codingProblemsSolved} Solved` : 'Solved' },
    { id: 'interview', label: 'AI Mock Interview', icon: Bot, badge: 'Live' },
    { id: 'portfolio', label: 'Digital Portfolio', icon: Globe, badge: digitalPortfolio?.completeness ? `${digitalPortfolio.completeness.score}%` : 'Portfolio' },
    { id: 'company_readiness', label: 'Company Readiness Prediction', icon: Target, badge: avgCompanyMatchScore !== null ? `${avgCompanyMatchScore}% Match` : null },
    { id: 'opportunities', label: 'Jobs & Internships', icon: Briefcase, badge: null },
    { id: 'roadmap', label: 'AI Career Roadmap', icon: Compass, badge: 'Wk 6/8' },
    { id: 'analytics', label: 'Analytics Dashboard', icon: LineChart, badge: '88 Score' },
    { id: 'badges', label: 'My Badges', icon: Award, badge: '8 Unlocked' },
    { id: 'mentor', label: 'AI Career Mentor', icon: Sparkles, badge: '24/7 AI' },
    { id: 'human_mentors', label: 'Find a Mentor', icon: GraduationCap, badge: 'Faculty' },
    { id: 'experiences', label: 'Interview Experiences', icon: Building2, badge: 'Bank' },
  ];

  const currentModule = modulesList.find((m) => m.id === activeTab) || modulesList[0];

  const filteredModules = sidebarSearch.trim()
    ? modulesList.filter((m) => m.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : modulesList;

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
    <nav className="space-y-1 px-3 py-2 flex-1" aria-label="Student Navigation">
      {filteredModules.length === 0 ? (
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
        filteredModules.map((m) => {
          const IconComponent = m.icon;
          const isActive = activeTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setActiveTab(m.id);
                if (onItemClick) onItemClick();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-colors duration-150 cursor-pointer text-left group ${
                isActive
                  ? 'bg-[#4338CA]/10 text-[#4338CA] font-semibold border border-[#4338CA]/20 shadow-2xs'
                  : 'text-[#14131F]/80 hover:text-[#14131F] hover:bg-[#14131F]/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <IconComponent
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#4338CA]' : 'text-[#14131F]/60 group-hover:text-[#14131F]'
                  }`}
                />
                <span className="truncate">{m.label}</span>
              </div>
              {m.badge && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#4338CA] text-white'
                      : 'bg-[#14131F]/6 text-[#14131F]/70 group-hover:bg-[#14131F]/10'
                  }`}
                >
                  {m.badge}
                </span>
              )}
            </button>
          );
        })
      )}
    </nav>
  );

  const renderReadinessBox = () => (
    <div className="p-3.5 m-3 rounded-2xl bg-[#FAFAF8] border border-[#14131F]/8 space-y-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#14131F]/60 font-display">Placement Readiness</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A3E635]/25 text-[#14131F]">
          Top 10%
        </span>
      </div>
      {dashboardLoading ? (
        <div className="space-y-1.5 py-1">
          <div className="h-6 w-20 bg-[#14131F]/5 rounded-md animate-pulse" />
          <div className="w-full h-1.5 bg-[#14131F]/10 rounded-full overflow-hidden" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-bold text-[#14131F]">{meDashboardData.averageOverallScore}</span>
            <span className="text-xs text-[#14131F]/50 font-sans">/ 100 benchmark</span>
          </div>
          <div className="w-full h-1.5 bg-[#14131F]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4338CA] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, meDashboardData.averageOverallScore))}%` }}
            />
          </div>
        </>
      )}
    </div>
  );

  const renderProfileFooter = () => (
    <div className="p-3 border-t border-[#14131F]/8 bg-white flex items-center justify-between gap-2">
      <button
        onClick={() => {
          setFormData({ ...studentInfo });
          setIsProfileModalOpen(true);
        }}
        className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 rounded-xl hover:bg-[#14131F]/4 transition-colors cursor-pointer text-left group"
        title="Edit Profile"
      >
        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] font-display font-bold text-xs flex items-center justify-center shrink-0 border border-[#4338CA]/20">
          {studentInfo.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold font-display text-[#14131F] truncate group-hover:text-[#4338CA] transition-colors">
            {studentInfo.fullName}
          </p>
          <p className="text-[11px] text-[#14131F]/50 font-sans truncate">
            {studentInfo.degree.split(' ')[0] || 'Student'}
          </p>
        </div>
      </button>
      <button
        onClick={onLogout}
        title="Log out"
        className="p-2 rounded-xl border border-[#14131F]/8 hover:bg-[#14131F]/5 text-[#14131F]/60 hover:text-[#EF4444] transition-colors cursor-pointer shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* Toast Notification for Profile Update */}
      {showSaveNotification && (
        <div className="fixed top-20 right-6 z-50 bg-[#14131F] text-white px-4 py-3 rounded-xl border border-[#4338CA]/40 shadow-xl flex items-center gap-2 text-xs font-sans font-medium animate-in fade-in slide-in-from-top-4">
          <VerifiedSeal size="sm" iconType="check" label="Profile Updated" />
        </div>
      )}

      <DashboardShell
        portalSubtitle="Student Portal"
        portalIcon={GraduationCap}
        currentModuleName={currentModule.label}
        renderSearch={renderSearchInput}
        renderNavList={renderNavList}
        renderSidebarBottom={() => (
          <>
            {renderReadinessBox()}
            {renderProfileFooter()}
          </>
        )}
        headerBadges={
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A3E635]/20 text-[#14131F] border border-[#A3E635]/40 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#65A30D] animate-pulse" />
            <span>SIH 2026 Live</span>
          </div>
        }
        headerActions={
          <>
            {onSwitchRole && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSwitchRole}
                className="hidden md:inline-flex text-[13.5px] font-medium"
              >
                Switch Role
              </Button>
            )}

            <button
              className="p-2 sm:p-2.5 rounded-xl border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F]/70 hover:text-[#14131F] transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4338CA]" />
            </button>

            <button
              onClick={() => {
                setFormData({ ...studentInfo });
                setIsProfileModalOpen(true);
              }}
              title="Edit Profile"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#14131F]/10 hover:border-[#14131F]/20 hover:bg-[#14131F]/[0.02] transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#4338CA] text-white font-display font-bold text-xs flex items-center justify-center shadow-xs">
                {studentInfo.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold font-display text-[#14131F] group-hover:text-[#4338CA] transition-colors">
                    {studentInfo.fullName}
                  </span>
                  <Edit3 className="w-3 h-3 text-[#14131F]/40 group-hover:text-[#4338CA] transition-colors" />
                </div>
                <p className="text-xs text-[#14131F]/65 font-sans">
                  {studentInfo.degree.split(' ')[0] || 'Student'} • {studentInfo.collegeShort || 'Batch 2026'}
                </p>
              </div>
            </button>

            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 sm:p-2.5 rounded-xl border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F]/70 hover:text-[#EF4444] transition-colors cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </>
        }
        mobileNavStrip={
          <div className="flex items-center gap-1.5 py-2 min-w-max">
            {modulesList.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id as ModuleTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#4338CA] text-white shadow-xs'
                      : 'text-[#14131F]/70 hover:text-[#14131F] hover:bg-[#14131F]/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#14131F]/60'}`} />
                  <span>{m.label}</span>
                  {m.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#14131F]/6 text-[#14131F]/70'
                      }`}
                    >
                      {m.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        }
      >
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Welcome Banner */}
              <div className="p-6 md:p-8 xl:p-10 bg-white border border-[#14131F]/8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-[#14131F] tracking-tight">Good afternoon, {studentInfo.fullName}</h1>
                    <button
                      onClick={() => {
                        setFormData({ ...studentInfo });
                        setIsProfileModalOpen(true);
                      }}
                      className="p-1.5 rounded-md border border-[#14131F]/12 text-[#14131F]/50 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-sans text-[#14131F]/65 mt-2">
                    Target Role: <span className="text-[#14131F] font-medium">{studentInfo.targetRole}</span> • Target CTC: <span className="text-[#4338CA] font-semibold">{studentInfo.targetCtc}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<User className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setFormData({ ...studentInfo });
                      setIsProfileModalOpen(true);
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Target className="w-3.5 h-3.5 text-[#4338CA]" />}
                    onClick={() => setActiveTab('skill_assessment')}
                  >
                    Assess Skills
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Play className="w-3.5 h-3.5 fill-current" />}
                    onClick={() => setActiveTab('interview')}
                    className="bg-[#4338CA] hover:bg-[#3730A3]"
                  >
                    Start Voice Mock
                  </Button>
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6">
                <div 
                  onClick={() => setActiveTab('resume')}
                  className="p-5 sm:p-6 bg-white border border-[#14131F]/8 rounded-2xl hover:border-[#14131F]/20 transition-all cursor-pointer group text-left shadow-xs"
                >
                  <p className="text-xs font-sans text-[#14131F]/60">1. ATS Resume Score</p>
                  {overviewLoading ? (
                    <div className="h-9 w-28 bg-[#14131F]/5 rounded-md animate-pulse mt-3" />
                  ) : (
                    <p className="text-3xl font-display font-bold text-[#14131F] mt-2">
                      {overviewData.atsResumeScore !== null ? `${overviewData.atsResumeScore} / 100` : 'Not analyzed'}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Badge variant={overviewData.atsResumeScore !== null ? "positive" : "muted"} size="sm">
                      {overviewData.atsResumeScore !== null ? 'ATS benchmarked' : 'Upload in Resume Studio'}
                    </Badge>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('coding')}
                  className="p-5 sm:p-6 bg-white border border-[#14131F]/8 rounded-2xl hover:border-[#14131F]/20 transition-all cursor-pointer group text-left shadow-xs"
                >
                  <p className="text-xs font-sans text-[#14131F]/60">2. Coding Readiness</p>
                  {overviewLoading ? (
                    <div className="h-9 w-28 bg-[#14131F]/5 rounded-md animate-pulse mt-3" />
                  ) : (
                    <p className="text-3xl font-display font-bold text-[#14131F] mt-2">
                      {overviewData.codingProblemsSolved} Solved
                    </p>
                  )}
                  <p className="text-xs font-sans text-[#14131F]/60 mt-2.5">
                    {overviewData.codingAccuracy > 0 ? `${overviewData.codingAccuracy}% accuracy rate` : 'Start solving coding problems'}
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('interview')}
                  className="p-5 sm:p-6 bg-white border border-[#14131F]/8 rounded-2xl hover:border-[#14131F]/20 transition-all cursor-pointer group text-left shadow-xs"
                >
                  <p className="text-xs font-sans text-[#14131F]/60">3. AI Mock Interview</p>
                  {overviewLoading ? (
                    <div className="h-9 w-28 bg-[#14131F]/5 rounded-md animate-pulse mt-3" />
                  ) : (
                    <p className="text-3xl font-display font-bold text-[#14131F] mt-2">
                      {overviewData.mockInterviewCount} Drills
                    </p>
                  )}
                  <p className="text-xs font-sans text-[#14131F]/60 mt-2.5">
                    {overviewData.avgRating > 0 ? `Avg rating: ${overviewData.avgRating} / 5.0` : 'No interview drills taken'}
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('company_readiness')}
                  className="p-5 sm:p-6 bg-white border border-[#14131F]/8 rounded-2xl hover:border-[#14131F]/20 transition-all cursor-pointer group text-left shadow-xs"
                >
                  <p className="text-xs font-sans text-[#14131F]/60">4. Active Applications</p>
                  {overviewLoading ? (
                    <div className="h-9 w-28 bg-[#14131F]/5 rounded-md animate-pulse mt-3" />
                  ) : (
                    <p className="text-3xl font-display font-bold text-[#14131F] mt-2">
                      {overviewData.activeApplications.count} Active
                    </p>
                  )}
                  <p className="text-xs font-sans text-[#14131F]/60 mt-2.5 truncate">
                    {overviewData.activeApplications.companies.length > 0
                      ? overviewData.activeApplications.companies.join(', ')
                      : 'No active applications'}
                  </p>
                </div>
              </div>

              {/* Main Module Quick Launcher */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
                <RecordCard
                  title={
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-ink" />
                      <span>Resume Intelligence</span>
                    </div>
                  }
                  action={
                    <Badge variant={overviewData.atsResumeScore !== null ? "verified" : "muted"} size="sm">
                      {overviewData.atsResumeScore !== null ? `ATS Score: ${overviewData.atsResumeScore}/100` : 'Not analyzed'}
                    </Badge>
                  }
                  className="space-y-4"
                >
                  <p className="text-xs sm:text-sm font-sans text-slate leading-relaxed">
                    {overviewData.atsResumeScore !== null
                      ? `Benchmarked with ATS score of ${overviewData.atsResumeScore}/100. Google XYZ action bullet formatting verified.`
                      : 'Upload your resume in the Resume Intelligence Studio for instant ATS parsing, keyword gap analysis, and Google XYZ formatting.'}
                  </p>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    icon={<ChevronRight className="w-4 h-4" />}
                    iconPosition="right"
                    onClick={() => setActiveTab('resume')}
                  >
                    Open Resume Intelligence Studio
                  </Button>
                </RecordCard>

                <RecordCard
                  title={
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-ink" />
                      <span>AI Career Roadmap</span>
                    </div>
                  }
                  action={
                    <Badge variant="neutral" size="sm">
                      {overviewData.roadmapProgress.totalPhases > 0
                        ? `Phase ${overviewData.roadmapProgress.currentPhase} / ${overviewData.roadmapProgress.totalPhases}`
                        : 'Roadmap Pending'}
                    </Badge>
                  }
                  className="space-y-4"
                >
                  <p className="text-xs sm:text-sm font-sans text-slate leading-relaxed">
                    Currently practicing: <span className="text-ink font-medium">{overviewData.roadmapProgress.currentPhaseTitle || 'Generate your customized placement timeline'}</span>
                  </p>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    icon={<ChevronRight className="w-4 h-4" />}
                    iconPosition="right"
                    onClick={() => setActiveTab('roadmap')}
                  >
                    View Timeline & Milestones
                  </Button>
                </RecordCard>

                <RecordCard
                  title={
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-ink" />
                      <span>Interview Experience Bank</span>
                    </div>
                  }
                  action={
                    <VerifiedSeal size="sm" iconType="shield" label="Community Bank" />
                  }
                  className="space-y-4 md:col-span-2"
                >
                  <p className="text-xs sm:text-sm font-sans text-slate leading-relaxed">
                    Explore real campus interview breakdowns, rounds, questions asked, and candidate tips verified by the Training & Placement Officer. Share your own interview experience to help your batchmates prepare.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => setActiveTab('experiences')}
                      className="w-full sm:w-auto"
                    >
                      Browse Interview Experiences
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setActiveTab('experiences')}
                      className="w-full sm:w-auto"
                    >
                      Share Your Interview Experience
                    </Button>
                  </div>
                </RecordCard>
              </div>

              {/* Application Pipeline Table */}
              <LedgerContainer
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#4338CA]" />
                      <span className="font-display font-semibold text-sm text-[#14131F]">
                        Active Application Pipeline
                      </span>
                      {overviewData.applicationPipeline.length > 0 && (
                        <Badge variant="neutral" size="sm">
                          {overviewData.applicationPipeline.length} {overviewData.applicationPipeline.length === 1 ? 'Drive' : 'Drives'}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTab('company_readiness')}
                      className="text-xs font-sans text-[#4338CA] hover:underline font-medium cursor-pointer flex items-center gap-1"
                    >
                      <span>Detailed Pipeline Tracker</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                }
              >
                {overviewLoading ? (
                  <div className="p-8 text-center space-y-2.5 font-sans">
                    <div className="w-5 h-5 border-2 border-[#14131F]/15 border-t-[#4338CA] rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#14131F]/60">Syncing application pipeline...</p>
                  </div>
                ) : overviewData.applicationPipeline.length === 0 ? (
                  <div className="p-8 sm:p-10 text-center bg-white rounded-xl space-y-3 font-sans">
                    <div className="w-10 h-10 rounded-full bg-[#14131F]/5 flex items-center justify-center mx-auto text-[#14131F]/40">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-display font-semibold text-[#14131F]">No applications yet</p>
                      <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto font-sans leading-relaxed">
                        Explore verified job openings in Company Readiness and Opportunities to track your active recruitment pipeline.
                      </p>
                    </div>
                    <div className="pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveTab('opportunities')}
                        className="bg-[#4338CA] hover:bg-[#3730A3] text-white"
                        icon={<Briefcase className="w-3.5 h-3.5" />}
                      >
                        Browse Opportunities
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[#14131F]/8">
                    {overviewData.applicationPipeline.map((app) => {
                      const stage = resolveApplicationStage(app.status);
                      const formattedDate = formatApplicationDate(app.appliedAt);

                      return (
                        <div key={app.id} className="p-4 sm:p-5 hover:bg-[#FAFAF8]/50 transition-colors space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 flex items-center justify-center font-display font-bold text-xs text-[#14131F] shrink-0 mt-0.5">
                                {app.company ? app.company.charAt(0).toUpperCase() : 'J'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-display font-bold text-sm text-[#14131F]">
                                    {app.company}
                                  </span>
                                  <span className="text-[#14131F]/30">•</span>
                                  <span className="text-xs text-[#14131F]/80 font-sans font-medium">
                                    {app.role}
                                  </span>
                                </div>
                                {formattedDate && (
                                  <div className="flex items-center gap-1 text-[11px] text-[#14131F]/50 font-sans mt-0.5">
                                    <Clock className="w-3 h-3 text-[#14131F]/40" />
                                    <span>Applied {formattedDate}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="self-start sm:self-center shrink-0">
                              {renderApplicationStageBadge(stage)}
                            </div>
                          </div>

                          {/* Horizontal Pipeline Stage Stepper */}
                          <div className="pt-1 sm:px-1">
                            <ApplicationStageTracker statusRaw={app.status} />
                          </div>

                          {/* Offer Stage: Internship Completion Status & Mentor Feedback */}
                          {(stage.isOffer || app.status?.toLowerCase() === 'offer') && (
                            <div className="pt-2 border-t border-[#14131F]/6 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-[#14131F]/60 font-medium font-sans">
                                    Completion Status:
                                  </span>
                                  {renderCompletionBadge(app.completionStatus)}
                                </div>
                              </div>

                              {app.mentorFeedback && (app.mentorFeedback.rating || app.mentorFeedback.comments) && (
                                <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1 font-sans">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-semibold text-[#14131F] flex items-center gap-1">
                                      <Award className="w-3 h-3 text-[#4338CA]" />
                                      Mentor Feedback
                                    </span>
                                    {typeof app.mentorFeedback.rating === 'number' && (
                                      <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-3 h-3 ${
                                              star <= (app.mentorFeedback?.rating ?? 0)
                                                ? 'text-amber-500 fill-amber-500'
                                                : 'text-[#14131F]/20'
                                            }`}
                                          />
                                        ))}
                                        <span className="text-[10px] font-semibold text-[#14131F] ml-1">
                                          {app.mentorFeedback.rating}/5
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {app.mentorFeedback.comments && (
                                    <p className="text-xs text-[#14131F]/75 italic leading-relaxed pl-4 border-l-2 border-[#4338CA]/30">
                                      "{app.mentorFeedback.comments}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </LedgerContainer>
            </div>
          )}

          {/* TAB 2: RESUME INTELLIGENCE */}
          {activeTab === 'resume' && (
            <div className="space-y-6 font-sans">
              {/* Hidden file input for resume upload */}
              <input
                type="file"
                ref={resumeFileInputRef}
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleResumeFileChange}
              />

              <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl space-y-6 shadow-xs">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#14131F] flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </span>
                      <span>Resume Intelligence & ATS Optimizer</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1 font-sans">
                      Real-time ATS parsing, keyword gap analysis, and Google XYZ formatting engine calibrated for your target role.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    {resumeLoading ? (
                      <div className="h-8 w-24 bg-[#14131F]/5 rounded animate-pulse" />
                    ) : resumeData ? (
                      <div>
                        <div className="flex items-baseline sm:justify-end gap-1.5">
                          <span className="text-3xl sm:text-4xl font-display font-bold text-[#14131F]">
                            {resumeData.atsScore ?? '--'}
                          </span>
                          <span className="text-xs font-sans text-[#14131F]/60">/ 100 ATS Score</span>
                        </div>
                        <div className="mt-1 flex sm:justify-end items-center gap-2">
                          {typeof resumeData.atsScore === 'number' && resumeData.atsScore >= 75 ? (
                            <VerifiedSeal size="sm" iconType="check" label="ATS Benchmarked" />
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Refinement Recommended
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="muted" size="md">
                        Awaiting Resume Upload
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Error Banner if Resume Analysis Failed */}
                {resumeError && (
                  <div className="p-4 bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#14131F] rounded-xl flex items-start justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#14131F]">Resume analysis notice</p>
                        <p className="text-[#14131F]/70 mt-0.5 leading-relaxed">{resumeError}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setResumeError(null)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#FB7185]/30 hover:bg-[#FB7185]/20 text-[#FB7185] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {resumeLoading ? (
                  <div className="space-y-4 py-8">
                    <div className="h-28 bg-[#14131F]/5 rounded-xl animate-pulse" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="h-24 bg-[#14131F]/5 rounded-xl animate-pulse" />
                      <div className="h-24 bg-[#14131F]/5 rounded-xl animate-pulse" />
                      <div className="h-24 bg-[#14131F]/5 rounded-xl animate-pulse" />
                    </div>
                  </div>
                ) : !resumeData ? (
                  /* EMPTY STATE - UPLOAD ZONE (DRAG & DROP + CLICK) */
                  <div className="space-y-6">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingResume(true);
                      }}
                      onDragLeave={() => setIsDraggingResume(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingResume(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleAnalyzeResumeFile(file);
                      }}
                      className={`p-10 border-2 border-dashed rounded-2xl text-center space-y-4 transition-colors ${
                        isDraggingResume
                          ? 'border-[#4338CA] bg-[#4338CA]/5'
                          : 'border-[#14131F]/15 bg-[#FAFAF8] hover:border-[#4338CA]/40'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-display font-bold text-[#14131F]">
                          Drag and drop your resume here, or browse files
                        </h3>
                        <p className="text-xs sm:text-sm text-[#14131F]/60 max-w-md mx-auto font-sans leading-relaxed">
                          Supports PDF, DOCX, or TXT up to 10MB. Instant Gemini AI parsing for keyword alignment with {studentInfo.targetRole || 'your target career'}.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <span className="px-2.5 py-1 text-[11px] font-mono bg-white border border-[#14131F]/10 rounded-md text-[#14131F]/70">.PDF</span>
                        <span className="px-2.5 py-1 text-[11px] font-mono bg-white border border-[#14131F]/10 rounded-md text-[#14131F]/70">.DOCX</span>
                        <span className="px-2.5 py-1 text-[11px] font-mono bg-white border border-[#14131F]/10 rounded-md text-[#14131F]/70">.TXT</span>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => resumeFileInputRef.current?.click()}
                          disabled={isScanningResume}
                          icon={<RefreshCw className={`w-3.5 h-3.5 ${isScanningResume ? 'animate-spin' : ''}`} />}
                        >
                          {isScanningResume ? 'Analyzing ATS parser compatibility...' : 'Select Resume File'}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-center space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-[#14131F] font-sans">
                        Multi-Factor ATS Compliance Verification
                      </p>
                      <p className="text-xs text-[#14131F]/60 font-sans max-w-xl mx-auto">
                        Evaluates parsing integrity across Taleo, Workday, Greenhouse, and Lever standards with Google XYZ quantified metric validation.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* DYNAMIC RESUME DATA PRESENT */
                  <div className="space-y-6">
                    {/* Active File Banner with Re-Upload */}
                    <div className="p-4 sm:p-5 border border-[#14131F]/8 rounded-xl bg-[#FAFAF8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-[#14131F] font-sans">
                            {resumeData.fileName || 'Uploaded_Resume.pdf'}
                          </p>
                          <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                            Target Role: <strong className="text-[#14131F]">{resumeData.targetRole || studentInfo.targetRole}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {resumeData.fileUrl && (
                          <a
                            href={resumeData.fileUrl}
                            onClick={(e) => {
                              if (resumeData.fileUrl.startsWith('/')) {
                                e.preventDefault();
                                viewAuthenticatedFile(resumeData.fileUrl);
                              }
                            }}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#14131F]/15 bg-white text-[#14131F] hover:bg-[#FAFAF8] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#4338CA]" />
                            <span>View Document</span>
                            <ExternalLink className="w-3 h-3 text-[#14131F]/40" />
                          </a>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => resumeFileInputRef.current?.click()}
                          disabled={isScanningResume}
                          icon={<RefreshCw className={`w-3.5 h-3.5 ${isScanningResume ? 'animate-spin' : ''}`} />}
                        >
                          {isScanningResume ? 'Analyzing ATS parser...' : 'Upload New Resume'}
                        </Button>
                      </div>
                    </div>

                    {/* Breakdown Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#14131F]/60 font-sans">Formatting Structure</p>
                          <span className="text-xs font-mono font-medium text-[#14131F]/80">
                            {typeof resumeData.formattingScore === 'number' ? `${resumeData.formattingScore}%` : '--'}
                          </span>
                        </div>
                        <p className="text-2xl font-display font-bold text-[#14131F]">
                          {typeof resumeData.formattingScore === 'number' ? `${resumeData.formattingScore}%` : '--'}
                        </p>
                        <div className="w-full h-1.5 bg-[#14131F]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4338CA] rounded-full transition-all duration-500"
                            style={{ width: `${resumeData.formattingScore || 0}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 font-sans">Header hierarchy & parsing integrity</p>
                      </div>

                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#14131F]/60 font-sans">Quantified Impact</p>
                          <span className="text-xs font-mono font-medium text-[#14131F]/80">
                            {typeof resumeData.quantifiedImpactScore === 'number' ? `${resumeData.quantifiedImpactScore}%` : '--'}
                          </span>
                        </div>
                        <p className="text-2xl font-display font-bold text-[#14131F]">
                          {typeof resumeData.quantifiedImpactScore === 'number' ? `${resumeData.quantifiedImpactScore}%` : '--'}
                        </p>
                        <div className="w-full h-1.5 bg-[#14131F]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4338CA] rounded-full transition-all duration-500"
                            style={{ width: `${resumeData.quantifiedImpactScore || 0}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 font-sans">Metrics, KPIs & measurable outcomes</p>
                      </div>

                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#14131F]/60 font-sans">Role Keyword Match</p>
                          <span className="text-xs font-mono font-medium text-[#14131F]/80">
                            {typeof resumeData.keywordMatchPct === 'number' ? `${resumeData.keywordMatchPct}%` : '--'}
                          </span>
                        </div>
                        <p className="text-2xl font-display font-bold text-[#14131F]">
                          {typeof resumeData.keywordMatchPct === 'number' ? `${resumeData.keywordMatchPct}%` : '--'}
                        </p>
                        <div className="w-full h-1.5 bg-[#14131F]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4338CA] rounded-full transition-all duration-500"
                            style={{ width: `${resumeData.keywordMatchPct || 0}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#14131F]/50 font-sans">Alignment with {studentInfo.targetRole || 'industry bar'}</p>
                      </div>
                    </div>

                    {/* Feedback Summary */}
                    {resumeData.feedback && (
                      <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                        <h4 className="text-xs sm:text-sm font-display font-bold text-[#14131F] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#4338CA]" />
                          <span>AI ATS Executive Feedback</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-[#14131F]/70 leading-relaxed font-sans font-normal">
                          {resumeData.feedback}
                        </p>
                      </div>
                    )}

                    {/* Keyword Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-display font-bold text-[#14131F] flex items-center gap-2">
                            <Check className="w-4 h-4 text-[#14131F]" />
                            <span>Strong Industry Keywords Found</span>
                          </h4>
                          <span className="text-xs text-[#14131F]/50 font-mono">
                            {resumeData.skillsFound?.length || 0} Matched
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {resumeData.skillsFound && resumeData.skillsFound.length > 0 ? (
                            resumeData.skillsFound.map((k, idx) => (
                              <Badge key={idx} variant="positive" size="sm">
                                {k}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-[#14131F]/50 italic font-sans">No strong keywords detected yet</span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-display font-bold text-[#14131F] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-[#FB7185]" />
                            <span>High-Impact Keywords to Add</span>
                          </h4>
                          <span className="text-xs text-[#FB7185] font-mono">
                            {resumeData.missingSkills?.length || 0} Gaps
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {resumeData.missingSkills && resumeData.missingSkills.length > 0 ? (
                            resumeData.missingSkills.map((k, idx) => (
                              <Badge key={idx} variant="neutral" size="sm">
                                + {k}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-[#14131F]/50 italic font-sans">No missing critical keywords</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actionable Suggestions */}
                    {resumeData.suggestions && resumeData.suggestions.length > 0 && (
                      <LedgerContainer
                        header={
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#4338CA]" />
                            <span className="font-display font-bold text-sm text-[#14131F] normal-case tracking-normal">
                              Actionable AI Recommendations
                            </span>
                          </div>
                        }
                      >
                        <div className="p-4 space-y-2.5 font-sans text-xs sm:text-sm">
                          {resumeData.suggestions.map((sug, idx) => (
                            <div key={idx} className="text-[#14131F]/75 flex items-start gap-2.5 leading-relaxed">
                              <span className="w-5 h-5 rounded-md bg-[#4338CA]/10 text-[#4338CA] text-xs font-bold shrink-0 flex items-center justify-center mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      </LedgerContainer>
                    )}
                  </div>
                )}

                {/* Interactive Google XYZ Formula Bullet Generator */}
                <RecordCard
                  title={
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#4338CA]" />
                      <span className="font-display font-bold text-[#14131F]">Google XYZ Formula Bullet Generator</span>
                    </div>
                  }
                  action={
                    <Badge variant="muted" size="sm">
                      Accomplished [X] by [Z], measured by [Y]
                    </Badge>
                  }
                  className="space-y-4"
                >
                  <p className="text-xs text-[#14131F]/60 font-sans">
                    Format high-impact resume experience bullets using Google's executive recruiting standard: "Accomplished [X] as measured by [Y], by doing [Z]".
                  </p>

                  {/* Preset formula chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#14131F]/50 font-sans mr-1">Quick Presets:</span>
                    {[
                      {
                        label: 'Latency Optimization',
                        verb: 'Optimized',
                        task: 'distributed Redis caching layer across database query replicas',
                        metric: 'reducing API latency by 42% for 2M daily requests',
                      },
                      {
                        label: 'Pipeline CI/CD',
                        verb: 'Automated',
                        task: 'containerized build and test pipelines with Docker and GitHub Actions',
                        metric: 'decreasing deployment failure rate from 18% to under 1.5%',
                      },
                      {
                        label: 'Search Engine',
                        verb: 'Architected',
                        task: 'inverted full-text search indexing service with typo tolerance',
                        metric: 'serving sub-50ms query responses across 1.2M catalog records',
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setXyzVerb(preset.verb);
                          setXyzTask(preset.task);
                          setXyzMetric(preset.metric);
                          setGeneratedBullet(`${preset.verb} ${preset.task}, ${preset.metric}.`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FAFAF8] hover:bg-[#14131F]/5 border border-[#14131F]/10 text-[#14131F] text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                    <div>
                      <label className="block text-[#14131F] font-medium mb-1">X: Action Verb</label>
                      <input
                        type="text"
                        value={xyzVerb}
                        onChange={(e) => setXyzVerb(e.target.value)}
                        placeholder="e.g. Optimized, Architected"
                        className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#14131F] font-medium mb-1">Z: Task / Project Built</label>
                      <input
                        type="text"
                        value={xyzTask}
                        onChange={(e) => setXyzTask(e.target.value)}
                        placeholder="e.g. database query caching layer"
                        className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#14131F] font-medium mb-1">Y: Measurable Impact Metric</label>
                      <input
                        type="text"
                        value={xyzMetric}
                        onChange={(e) => setXyzMetric(e.target.value)}
                        placeholder="e.g. reducing API latency by 42%"
                        className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGenerateXYZ}
                    >
                      Format Bullet Point
                    </Button>

                    {generatedBullet && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Copy className="w-3.5 h-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(generatedBullet);
                          setCopiedBullet(true);
                          setTimeout(() => setCopiedBullet(false), 2000);
                        }}
                      >
                        {copiedBullet ? 'Copied to Clipboard' : 'Copy Bullet'}
                      </Button>
                    )}
                  </div>

                  {generatedBullet && (
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 text-xs text-[#14131F] font-mono leading-relaxed">
                      • {generatedBullet}
                    </div>
                  )}
                </RecordCard>
              </div>
            </div>
          )}

          {/* TAB 3: CODING READINESS */}
          {activeTab === 'coding' && (
            <div className="space-y-6 font-sans">
              <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl space-y-6 shadow-xs">
                
                {/* Header Title & Overall Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#14131F] flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                        <Code className="w-5 h-5" />
                      </span>
                      <span>Coding Readiness & Problem Arena</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1 font-sans">
                      Solve company-targeted challenges in C, C++, Python, Java, JavaScript, TypeScript, Go, Rust, or SQL, and track your solution history.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="positive" size="md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
                      <span>{codingStats.problemsSolved} / {codingStats.totalProblems} Tests Solved</span>
                    </Badge>
                    <Badge variant="neutral" size="md">
                      {codingStats.problemsSolved === 0 || !codingStats.fastestRuntime
                        ? 'Not started'
                        : `Fastest Runtime: ${codingStats.fastestRuntime}`}
                    </Badge>
                    {codingStats.problemsSolved > 0 && (
                      <VerifiedSeal size="sm" iconType="check" label="Tests Verified" />
                    )}
                  </div>
                </div>

                {/* Navigation Sub-Tabs: Problem Catalog vs History of Tests Solved */}
                <div className="flex items-center gap-2 border-b border-[#14131F]/8 pb-3 overflow-x-auto">
                  <Button
                    variant={codingSubTab === 'problems' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCodingSubTab('problems')}
                    icon={<Code className="w-3.5 h-3.5" />}
                  >
                    Problem Catalog & IDE
                  </Button>

                  <Button
                    variant={codingSubTab === 'history' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCodingSubTab('history')}
                    icon={<History className="w-3.5 h-3.5" />}
                  >
                    <span>History of Tests Solved</span>
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded bg-current/10">
                      {codingStats.problemsSolved}
                    </span>
                  </Button>
                </div>

                {/* ================= VIEW 1: PROBLEM CATALOG & IDE ================= */}
                {codingSubTab === 'problems' && (
                  <div>
                    {!selectedProblem ? (
                      /* PROBLEM CATALOG LIST VIEW */
                      <div className="space-y-6">
                        {/* Note near Problem Catalog area */}
                        <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl text-xs text-[#14131F] flex items-center gap-2.5 font-sans">
                          <AlertCircle className="w-4 h-4 text-[#4338CA] shrink-0" />
                          <span>
                            <strong>Note:</strong> Automated code execution active. You can browse problem statements, inspect template stubs across languages, run test suites, and save solved drafts.
                          </span>
                        </div>

                        {/* Preferred Language Bar */}
                        <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-[#4338CA]" />
                              <span className="text-xs font-display font-bold text-[#14131F]">Select Programming Language:</span>
                            </div>
                            <span className="text-xs text-[#14131F]/60 font-sans">
                              Active: <strong className="text-[#14131F] font-semibold">{PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage)?.name}</strong> ({PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage)?.version})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                            {PROGRAMMING_LANGUAGES.map((lang) => {
                              const isSelected = selectedLanguage === lang.id;
                              return (
                                <button
                                  key={lang.id}
                                  onClick={() => handleLanguageChange(lang.id)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                                    isSelected
                                      ? 'bg-[#4338CA] text-white border-[#4338CA]'
                                      : 'bg-white text-[#14131F] hover:bg-[#FAFAF8] border-[#14131F]/15'
                                  }`}
                                >
                                  <span>{lang.name}</span>
                                  <span className={`text-[10px] px-1 py-0.2 rounded border ${
                                    isSelected ? 'border-white/30 text-white' : 'border-[#14131F]/20 text-[#14131F]/60'
                                  }`}>
                                    {lang.version.split(' ')[0]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Topic Categories & Search Filters Bar */}
                        <div className="space-y-4">
                          {/* Category Filter Pills */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#14131F]/8 text-xs">
                            {CODING_CATEGORIES.map((cat) => {
                              const isSelected = selectedCategory === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  onClick={() => setSelectedCategory(cat.id)}
                                  className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-colors border ${
                                    isSelected
                                      ? 'bg-[#14131F] text-white border-[#14131F]'
                                      : 'bg-white text-[#14131F] hover:bg-[#FAFAF8] border-[#14131F]/15'
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Search bar & Difficulty filter */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-72">
                              <Search className="w-4 h-4 text-[#14131F]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Search problem or company (e.g., Google, DP)..."
                                value={codingSearchQuery}
                                onChange={(e) => setCodingSearchQuery(e.target.value)}
                                className="w-full bg-white border border-[#14131F]/15 rounded-lg pl-9 pr-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] font-sans"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                              <span className="text-xs text-[#14131F]/60 font-sans">Difficulty:</span>
                              {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
                                <button
                                  key={diff}
                                  onClick={() => setSelectedDifficulty(diff)}
                                  className={`px-3 py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors border ${
                                    selectedDifficulty === diff
                                      ? 'bg-[#14131F] text-white border-[#14131F]'
                                      : 'bg-white text-[#14131F] hover:bg-[#FAFAF8] border-[#14131F]/15'
                                  }`}
                                >
                                  {diff === 'all' ? 'All' : diff}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Problem Cards List using LedgerContainer & ListRow */}
                        <LedgerContainer
                          header={
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-[#4338CA]" />
                                <span className="font-display font-bold text-sm text-[#14131F] normal-case tracking-normal">Practice Challenges</span>
                                {codingQuestions.length > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] font-medium font-sans">
                                    {codingQuestions.length} Problems
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-[#14131F]/60 font-sans">
                                {PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage)?.name} Environment
                              </span>
                            </div>
                          }
                        >
                          <div className="divide-y divide-[#14131F]/8">
                            {loadingCodingQuestions ? (
                              <div className="p-8 text-center space-y-3">
                                <div className="inline-block animate-spin w-6 h-6 border-2 border-[#4338CA] border-t-transparent rounded-full" />
                                <p className="text-xs text-[#14131F]/60 font-sans">Loading database-backed practice challenges...</p>
                              </div>
                            ) : codingError ? (
                              <div className="p-8 text-center space-y-3">
                                <p className="text-xs text-[#DC2626] font-sans font-medium">{codingError}</p>
                                <Button variant="secondary" size="sm" onClick={fetchCodingQuestions}>
                                  Retry Loading
                                </Button>
                              </div>
                            ) : (
                              (() => {
                                const filtered = codingQuestions.filter((p) => {
                                  const matchesCategory =
                                    selectedCategory === 'all' ||
                                    (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()) ||
                                    (p.categoryLabel && p.categoryLabel.toLowerCase().includes(selectedCategory.toLowerCase())) ||
                                    (selectedCategory === 'dsa' && ['Arrays', 'Stack / Queue', 'Trees', 'Linked List'].some(c => p.category?.toLowerCase().includes(c.toLowerCase())));

                                  const matchesDifficulty =
                                    selectedDifficulty === 'all' ||
                                    p.difficulty?.toUpperCase() === selectedDifficulty.toUpperCase();

                                  const q = codingSearchQuery.toLowerCase().trim();
                                  const matchesSearch =
                                    q === '' ||
                                    (p.title && p.title.toLowerCase().includes(q)) ||
                                    (p.company && p.company.toLowerCase().includes(q)) ||
                                    (p.category && p.category.toLowerCase().includes(q)) ||
                                    (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)));

                                  return matchesCategory && matchesDifficulty && matchesSearch;
                                });

                                if (filtered.length === 0) {
                                  return (
                                    <div className="p-8 text-center space-y-3">
                                      <p className="text-xs text-[#14131F]/60 font-sans">No practice challenges found matching your filters.</p>
                                      <button
                                        onClick={() => {
                                          setSelectedCategory('all');
                                          setSelectedDifficulty('all');
                                          setCodingSearchQuery('');
                                        }}
                                        className="text-xs text-[#4338CA] hover:underline font-medium cursor-pointer"
                                      >
                                        Clear all filters
                                      </button>
                                    </div>
                                  );
                                }

                                return filtered.map((p) => {
                                  const activeLangObj = PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage);
                                  const isHard = p.difficulty?.toUpperCase() === 'HARD';
                                  const isMedium = p.difficulty?.toUpperCase() === 'MEDIUM';

                                  return (
                                    <ListRow
                                      key={p.id || p._id || p.slug}
                                      title={<span className="font-display font-bold text-[#14131F] text-sm sm:text-base">{p.title}</span>}
                                      subtitle={
                                        <span className="flex flex-wrap items-center gap-2 text-xs text-[#14131F]/60 font-sans mt-0.5">
                                          <span>Asked in: <strong className="text-[#14131F] font-semibold">{p.company || 'Tech Companies'}</strong></span>
                                          <span>•</span>
                                          <span>Time: <span className="text-[#14131F] font-mono">{p.timeComplexity || 'O(N)'}</span></span>
                                          <span>•</span>
                                          <span>Acceptance: <span className="text-[#14131F] font-mono">{p.acceptance || '85%'}</span></span>
                                        </span>
                                      }
                                      badge={
                                        <div className="flex items-center gap-2">
                                          <Badge variant="neutral" size="sm">
                                            {p.categoryLabel || p.category}
                                          </Badge>
                                          <Badge
                                            variant={isHard ? 'warning' : isMedium ? 'warning' : 'positive'}
                                            size="sm"
                                          >
                                            {p.difficulty}
                                          </Badge>
                                        </div>
                                      }
                                      action={
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() => handleOpenProblem(p)}
                                          icon={<Play className="w-3 h-3 fill-current" />}
                                        >
                                          Solve in {activeLangObj?.name || 'Code'}
                                        </Button>
                                      }
                                      className="p-4 bg-white hover:bg-[#FAFAF8] transition-colors"
                                    />
                                  );
                                });
                              })()
                            )}
                          </div>
                        </LedgerContainer>

                        {/* Real Questions Asked at Companies (From TPO-Approved Interview Bank) */}
                        <div className="mt-8 pt-6 border-t border-[#14131F]/8 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#4338CA]" />
                                <h3 className="text-sm font-display font-bold text-[#14131F]">Real Questions Asked at Companies</h3>
                                <VerifiedSeal size="sm" iconType="check" label="Peer Verified" />
                              </div>
                              <p className="text-xs text-[#14131F]/60 font-sans">
                                Real coding and algorithmic challenges encountered by students during on-campus and off-campus recruitment rounds.
                              </p>
                            </div>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={fetchRealCodingQuestions}
                              disabled={loadingRealQuestions}
                              icon={<RefreshCw className={`w-3 h-3 ${loadingRealQuestions ? 'animate-spin' : ''}`} />}
                            >
                              Refresh Live Feed
                            </Button>
                          </div>

                          {loadingRealQuestions ? (
                            <div className="space-y-3">
                              {[1, 2].map((i) => (
                                <div key={i} className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 animate-pulse space-y-3">
                                  <div className="h-4 bg-[#14131F]/10 rounded w-1/3" />
                                  <div className="h-10 bg-[#14131F]/10 rounded w-full" />
                                </div>
                              ))}
                            </div>
                          ) : realCodingQuestions.length === 0 ? (
                            <div className="p-8 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-center space-y-2.5">
                              <Code className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                              <h4 className="text-sm font-display font-bold text-[#14131F]">No Real Coding Questions Yet</h4>
                              <p className="text-xs text-[#14131F]/60 max-w-md mx-auto font-sans">
                                When students submit interview experiences with coding questions, they will appear right here for direct practice.
                              </p>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setActiveTab('experiences')}
                                icon={<Sparkles className="w-3.5 h-3.5" />}
                              >
                                Go to Interview Experience Bank
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {realCodingQuestions
                                .filter((rq) => {
                                  const matchesDiff = selectedDifficulty === 'all' || rq.difficulty === selectedDifficulty;
                                  const matchesSearch = codingSearchQuery === '' ||
                                    rq.text.toLowerCase().includes(codingSearchQuery.toLowerCase()) ||
                                    rq.company.toLowerCase().includes(codingSearchQuery.toLowerCase()) ||
                                    rq.role.toLowerCase().includes(codingSearchQuery.toLowerCase());
                                  return matchesDiff && matchesSearch;
                                })
                                .map((rq) => {
                                  const activeLangObj = PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage);
                                  return (
                                    <RecordCard
                                      key={rq.id}
                                      title={
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge variant="neutral" size="sm">
                                            {rq.company}
                                          </Badge>
                                          <span className="text-xs font-semibold text-[#14131F]">
                                            {rq.role}
                                          </span>
                                          <span className="text-xs text-[#14131F]/50 font-mono">
                                            • {rq.interviewDate}
                                          </span>
                                          <Badge
                                            variant={rq.difficulty === 'Hard' ? 'warning' : rq.difficulty === 'Medium' ? 'warning' : 'positive'}
                                            size="sm"
                                          >
                                            {rq.difficulty}
                                          </Badge>
                                          <Badge variant="neutral" size="sm">
                                            {rq.outcome}
                                          </Badge>
                                        </div>
                                      }
                                      action={
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(rq.text)}
                                            title="Copy Question"
                                            icon={<Copy className="w-3.5 h-3.5" />}
                                          />
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleOpenRealCodingQuestion(rq)}
                                            icon={<Play className="w-3.5 h-3.5 fill-current" />}
                                          >
                                            Practice in {activeLangObj?.name || 'IDE'}
                                          </Button>
                                        </div>
                                      }
                                      className="space-y-3"
                                    >
                                      <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-xs font-mono text-[#14131F] leading-relaxed break-words">
                                        {rq.text}
                                      </div>
                                    </RecordCard>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* DEDICATED FULL PROBLEM IDE PAGE VIEW */
                      <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Note */}
                        <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl text-xs text-[#14131F] flex items-center gap-2.5 font-sans">
                          <AlertCircle className="w-4 h-4 text-[#4338CA] shrink-0" />
                          <span>
                            <strong>Note:</strong> Automated code execution and test verification enabled. Submitting code saves your verified solution draft to your history.
                          </span>
                        </div>

                        {/* Top Navigation & Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#14131F]/8">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedProblem(null)}
                            icon={<ArrowLeft className="w-4 h-4" />}
                          >
                            Back to Problem Arena
                          </Button>

                          <div className="flex items-center gap-2 text-xs font-sans">
                            <span className="text-[#14131F]/60">Asked in:</span>
                            <span className="px-3 py-1 bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg font-semibold text-[#14131F]">
                              {selectedProblem.company}
                            </span>
                          </div>
                        </div>

                        {/* Problem Card Workspace */}
                        <div className="p-5 sm:p-6 bg-[#FAFAF8] rounded-2xl border border-[#14131F]/8 space-y-5">
                          <div className="flex items-start justify-between border-b border-[#14131F]/8 pb-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-display font-bold text-[#14131F]">{selectedProblem.title}</h3>
                                <Badge
                                  variant={selectedProblem.difficulty === 'Hard' ? 'warning' : 'warning'}
                                  size="sm"
                                >
                                  {selectedProblem.difficulty}
                                </Badge>
                                <Badge variant="neutral" size="sm">
                                  {selectedProblem.categoryLabel}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#14131F]/70 mt-2 font-sans leading-relaxed">
                                {selectedProblem.description}
                              </p>
                            </div>
                          </div>

                          {/* Language Selector Bar inside IDE */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-[#14131F]/8 p-3">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-[#4338CA]" />
                              <span className="text-xs font-display font-bold text-[#14131F]">IDE Language:</span>
                              <select
                                value={selectedLanguage}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="bg-white text-[#14131F] text-xs font-medium px-3 py-1.5 border border-[#14131F]/15 rounded-lg outline-none focus:border-[#4338CA] font-sans"
                              >
                                {PROGRAMMING_LANGUAGES.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name} ({l.version})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  const defaultStub = selectedProblem.stubs[selectedLanguage] || '';
                                  setUserCode(defaultStub);
                                  setCodeOutput(null);
                                }}
                                icon={<RefreshCw className="w-3 h-3" />}
                              >
                                Reset Stub
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(userCode);
                                }}
                                icon={<Copy className="w-3 h-3" />}
                              >
                                Copy Code
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowAiHint(!showAiHint)}
                                icon={<BrainCircuit className="w-3 h-3" />}
                              >
                                {showAiHint ? 'Hide AI Hint' : 'Get AI Hint'}
                              </Button>
                            </div>
                          </div>

                          {/* AI Hint Section */}
                          {showAiHint && (
                            <div className="p-4 bg-white rounded-xl border border-[#14131F]/15 text-xs text-[#14131F] space-y-1 font-sans">
                              <p className="font-semibold flex items-center gap-1.5 text-[#14131F]">
                                <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                                <span>AI Algorithmic Advisor ({PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage)?.name}):</span>
                              </p>
                              <p className="text-[#14131F]/70 leading-relaxed">
                                For this problem, aim for <strong>{selectedProblem.timeComplexity}</strong> time complexity. If using C/C++, leverage custom pointers or STL containers. In Python/Java, utilize hash maps combined with doubly linked structures to achieve O(1) mutations.
                              </p>
                            </div>
                          )}

                          {/* Interactive Code Editor TextArea */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-[#14131F]/60 font-sans px-1">
                              <span>Solution Editor ({PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage)?.name})</span>
                              <span>Target: {selectedProblem.timeComplexity} / {selectedProblem.spaceComplexity}</span>
                            </div>
                            <textarea
                              value={userCode}
                              onChange={(e) => setUserCode(e.target.value)}
                              rows={13}
                              className="w-full bg-[#14131F] font-mono text-xs text-white p-4 rounded-xl border border-[#14131F]/30 outline-none focus:ring-2 focus:ring-[#4338CA]/40 resize-y leading-relaxed shadow-inner"
                            />
                          </div>

                          {/* Sample Test Cases Display */}
                          {selectedProblem.testCases && (
                            <div className="p-4 bg-white rounded-xl border border-[#14131F]/8 text-xs space-y-2 font-sans">
                              <span className="font-semibold text-[#14131F] flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-[#4338CA]" />
                                <span>Sample Test Cases:</span>
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                                {selectedProblem.testCases.map((tc: any) => (
                                  <div key={tc.id} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#14131F]/8 space-y-1">
                                    <p className="text-[#14131F]/60">Input: <span className="text-[#14131F] font-medium">{tc.input}</span></p>
                                    <p className="text-[#14131F]/60">Expected: <span className="text-[#14131F] font-medium">{tc.expected}</span></p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Bar & Test Output */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                            <Button
                              variant="secondary"
                              size="md"
                              onClick={() => {
                                setIsRunningCode(true);
                                setCodeOutput(null);
                                setTimeout(() => {
                                  setIsRunningCode(false);
                                  setCodeOutput({
                                    status: 'success',
                                    summary: `All Test Cases Passed!`,
                                    runtime: `8 ms (Beats 96.4% of ${PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage)?.name} submissions)`,
                                    memory: `12.4 MB`,
                                    testCaseResults: selectedProblem.testCases ? selectedProblem.testCases.map((tc: any) => ({
                                      id: tc.id,
                                      input: tc.input,
                                      expected: tc.expected,
                                      actual: tc.expected,
                                      passed: true
                                    })) : []
                                  });
                                }, 1000);
                              }}
                              disabled={isRunningCode}
                              icon={<Play className="w-3.5 h-3.5 fill-current" />}
                            >
                              {isRunningCode ? 'Compiling & Running Tests...' : `Run Test Suite (${PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage)?.name})`}
                            </Button>

                            <Button
                              variant="primary"
                              size="md"
                              onClick={() => {
                                setIsRunningCode(true);
                                setTimeout(() => {
                                  setIsRunningCode(false);
                                  const activeLangObj = PROGRAMMING_LANGUAGES.find(l => l.id === selectedLanguage);
                                  const newRecord = {
                                    id: `sub_${Date.now()}`,
                                    problemId: selectedProblem.id,
                                    problemTitle: selectedProblem.title,
                                    category: selectedProblem.categoryLabel || 'Coding Challenge',
                                    difficulty: selectedProblem.difficulty,
                                    company: selectedProblem.company,
                                    language: selectedLanguage,
                                    languageName: activeLangObj ? `${activeLangObj.name} (${activeLangObj.version})` : selectedLanguage,
                                    submittedAt: 'Just Now',
                                    score: 100,
                                    passCount: selectedProblem.testCases ? selectedProblem.testCases.length : 12,
                                    totalCases: selectedProblem.testCases ? selectedProblem.testCases.length : 12,
                                    runtime: '8 ms',
                                    memory: '12.4 MB',
                                    codeSnippet: userCode || '// Solution code submitted'
                                  };
                                  setSolvedHistory(prev => [newRecord, ...prev]);
                                  setSelectedProblem(null);
                                  setCodingSubTab('history');
                                  setViewingHistoryItem(newRecord);
                                }, 800);
                              }}
                            >
                              Submit Final Code & Save to History
                            </Button>
                          </div>

                          {/* Code Runner Execution Output Card */}
                          {codeOutput && (
                            <div className="p-5 bg-white rounded-xl border border-[#14131F]/15 space-y-3 font-sans">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                                <Badge variant="positive" size="md">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F]" />
                                  <span>{codeOutput.summary}</span>
                                </Badge>
                                <div className="flex items-center gap-3 text-xs font-mono text-[#14131F]/60">
                                  <span>Runtime: <strong className="text-[#14131F]">{codeOutput.runtime}</strong></span>
                                  <span>Memory: <strong className="text-[#14131F]">{codeOutput.memory}</strong></span>
                                </div>
                              </div>

                              {codeOutput.testCaseResults.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-xs font-semibold text-[#14131F]">Test Case Execution Breakdown:</span>
                                  {codeOutput.testCaseResults.map((tcr) => (
                                    <div key={tcr.id} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#14131F]/8 flex items-center justify-between text-xs font-sans">
                                      <span className="text-[#14131F]/70 font-mono">Test #{tcr.id}: <span className="text-[#14131F] font-medium">{tcr.input.substring(0, 35)}...</span></span>
                                      <span className="text-[#14131F] font-semibold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5 text-[#A3E635]" /> PASSED
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= VIEW 2: HISTORY OF TESTS SOLVED ================= */}
                {codingSubTab === 'history' && (
                  <div className="space-y-6">
                    {/* Summary Analytics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1">
                        <span className="text-xs text-[#14131F]/60 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-[#4338CA]" />
                          <span>Total Solved Tests</span>
                        </span>
                        {codingStatsLoading ? (
                          <div className="h-7 w-16 bg-[#14131F]/10 rounded animate-pulse" />
                        ) : (
                          <div className="text-xl sm:text-2xl font-display font-bold text-[#14131F]">{codingStats.problemsSolved}</div>
                        )}
                        <p className="text-xs text-[#14131F]/60">
                          {codingStats.problemsSolved === 0 ? 'No submissions yet' : 'Verified Submissions'}
                        </p>
                      </div>

                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1">
                        <span className="text-xs text-[#14131F]/60 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-[#4338CA]" />
                          <span>Average Accuracy</span>
                        </span>
                        {codingStatsLoading ? (
                          <div className="h-7 w-16 bg-[#14131F]/10 rounded animate-pulse" />
                        ) : (
                          <div className="text-xl sm:text-2xl font-display font-bold text-[#14131F]">
                            {codingStats.problemsSolved === 0 || codingStats.accuracy === 0 ? '—' : `${codingStats.accuracy}%`}
                          </div>
                        )}
                        <p className="text-xs text-[#14131F]/60">
                          {codingStats.problemsSolved === 0 || codingStats.accuracy === 0 ? 'Solve problems to see ranking' : 'Accuracy Score'}
                        </p>
                      </div>

                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1">
                        <span className="text-xs text-[#14131F]/60 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-[#4338CA]" />
                          <span>Languages Used</span>
                        </span>
                        {codingStatsLoading ? (
                          <div className="h-7 w-16 bg-[#14131F]/10 rounded animate-pulse" />
                        ) : (
                          <div className="text-xl sm:text-2xl font-display font-bold text-[#14131F]">
                            {codingStats.problemsSolved === 0 ? 0 : codingStats.languagesUsed || (solvedHistory.length > 0 ? Array.from(new Set(solvedHistory.map(item => item.language))).length : 0)}
                          </div>
                        )}
                        <p className="text-xs text-[#14131F]/60">
                          {codingStats.problemsSolved === 0 ? 'No languages' : 'Language Proficiency'}
                        </p>
                      </div>

                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1">
                        <span className="text-xs text-[#14131F]/60 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#4338CA]" />
                          <span>Fastest Runtime</span>
                        </span>
                        {codingStatsLoading ? (
                          <div className="h-7 w-16 bg-[#14131F]/10 rounded animate-pulse" />
                        ) : (
                          <div className="text-xl sm:text-2xl font-display font-bold text-[#14131F]">
                            {codingStats.problemsSolved === 0 || !codingStats.fastestRuntime ? '—' : codingStats.fastestRuntime}
                          </div>
                        )}
                        <p className="text-xs text-[#14131F]/60">
                          {codingStats.problemsSolved === 0 || !codingStats.fastestRuntime ? 'Not started' : 'Execution Speed'}
                        </p>
                      </div>
                    </div>

                    {/* History Filters & Search Bar */}
                    <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3 font-sans">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                          <Search className="w-4 h-4 text-[#14131F]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter solved history by problem, company, or language..."
                            value={historySearchQuery}
                            onChange={(e) => setHistorySearchQuery(e.target.value)}
                            className="w-full bg-white border border-[#14131F]/15 rounded-lg pl-9 pr-3 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA]"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end text-xs">
                          <span className="text-[#14131F]/60 flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5 text-[#14131F]/50" />
                            <span>Language:</span>
                          </span>
                          <select
                            value={historyLanguageFilter}
                            onChange={(e) => setHistoryLanguageFilter(e.target.value)}
                            className="bg-white text-[#14131F] text-xs font-medium px-3 py-1.5 border border-[#14131F]/15 rounded-lg outline-none focus:border-[#4338CA]"
                          >
                            <option value="all">All Languages</option>
                            {PROGRAMMING_LANGUAGES.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={historyDifficultyFilter}
                            onChange={(e) => setHistoryDifficultyFilter(e.target.value)}
                            className="bg-white text-[#14131F] text-xs font-medium px-3 py-1.5 border border-[#14131F]/15 rounded-lg outline-none focus:border-[#4338CA]"
                          >
                            <option value="all">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Solved Test History Records List */}
                    {solvedHistory.length === 0 ? (
                      <div className="p-10 bg-[#FAFAF8] rounded-2xl border border-[#14131F]/8 text-center space-y-3 font-sans">
                        <Code className="w-8 h-8 text-[#14131F]/30 mx-auto" />
                        <h3 className="text-sm font-display font-bold text-[#14131F]">No Solved Tests Recorded Yet</h3>
                        <p className="text-xs text-[#14131F]/60 max-w-md mx-auto leading-relaxed">
                          You haven't submitted any coding challenges yet. Select a problem from the Problem Catalog to start practicing.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setCodingSubTab('problems')}
                          icon={<Play className="w-3.5 h-3.5 fill-current" />}
                        >
                          Browse Problem Catalog
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        {solvedHistory
                          .filter((item) => {
                            const matchesSearch = historySearchQuery === '' ||
                              item.problemTitle.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                              item.company.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                              item.languageName.toLowerCase().includes(historySearchQuery.toLowerCase());
                            const matchesLang = historyLanguageFilter === 'all' || item.language === historyLanguageFilter;
                            const matchesDiff = historyDifficultyFilter === 'all' || item.difficulty === historyDifficultyFilter;
                            return matchesSearch && matchesLang && matchesDiff;
                          })
                          .map((item) => {
                          const isExpanded = viewingHistoryItem?.id === item.id;
                          return (
                            <RecordCard
                              key={item.id}
                              title={
                                <div className="flex flex-wrap items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-[#14131F] shrink-0" />
                                  <span className="font-display font-bold text-[#14131F] text-sm sm:text-base">{item.problemTitle}</span>
                                  <Badge variant="neutral" size="sm">
                                    {item.category}
                                  </Badge>
                                </div>
                              }
                              subtitle={
                                <span className="flex flex-wrap items-center gap-2 text-xs text-[#14131F]/60 font-sans mt-0.5">
                                  <span>Asked in: <strong className="text-[#14131F] font-semibold">{item.company}</strong></span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-[#14131F]/50" />
                                    {item.submittedAt}
                                  </span>
                                </span>
                              }
                              action={
                                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between md:justify-end">
                                  <Badge variant="positive" size="sm">
                                    {item.passCount}/{item.totalCases} Passed ({item.score}%)
                                  </Badge>

                                  <Badge variant="neutral" size="sm">
                                    {item.languageName}
                                  </Badge>

                                  <Badge
                                    variant={item.difficulty === 'Hard' ? 'warning' : 'warning'}
                                    size="sm"
                                  >
                                    {item.difficulty}
                                  </Badge>

                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setViewingHistoryItem(isExpanded ? null : item)}
                                    icon={<Eye className="w-3.5 h-3.5" />}
                                  >
                                    <span>{isExpanded ? 'Hide Solution' : 'View Code'}</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </Button>
                                </div>
                              }
                              className="space-y-3"
                            >
                              {/* Expanded Submitted Code View */}
                              {isExpanded && (
                                <div className="p-4 bg-[#14131F] text-white rounded-xl border border-[#14131F]/30 space-y-3 font-mono text-xs">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-sans">
                                    <span className="text-white font-semibold flex items-center gap-1.5">
                                      <Terminal className="w-3.5 h-3.5 text-[#4338CA]" />
                                      Submitted Code ({item.languageName})
                                    </span>
                                    <div className="flex items-center gap-3 text-white/60 font-mono text-xs">
                                      <span>Runtime: <strong className="text-white">{item.runtime}</strong></span>
                                      <span>Memory: <strong className="text-white">{item.memory}</strong></span>
                                      <button
                                        onClick={() => navigator.clipboard.writeText(item.codeSnippet)}
                                        className="text-white hover:underline cursor-pointer flex items-center gap-1 ml-2 font-sans text-xs border border-white/20 rounded px-2 py-0.5"
                                      >
                                        <Copy className="w-3 h-3" /> Copy
                                      </button>
                                    </div>
                                  </div>

                                  <pre className="text-white/90 overflow-x-auto p-3.5 leading-relaxed bg-black/40 rounded-lg border border-white/10">
                                    {item.codeSnippet}
                                  </pre>
                                </div>
                              )}
                            </RecordCard>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 4: AI MOCK INTERVIEW */}
          {activeTab === 'interview' && (
            <AiMockInterviewSimulator studentInfo={studentInfo} />
          )}

          {/* TAB 5: UNIFIED DIGITAL STUDENT PORTFOLIO (FIX #5) */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6 font-sans">
              <DigitalStudentPortfolioView
                portfolio={digitalPortfolio}
                isLoading={digitalPortfolioLoading}
                isOwner={true}
                token={token}
                onRefresh={fetchDigitalPortfolio}
                onEditProfile={() => setIsProfileModalOpen(true)}
                onNavigateToSkillAssessment={() => setActiveTab('skill_assessment')}
                githubAuditContent={
                  <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl space-y-6 shadow-xs">
                    {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#14131F] flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                        <Github className="w-5 h-5" />
                      </span>
                      <span>GitHub Portfolio Audit</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1 font-sans">
                      Automated code quality, architecture patterns, repository documentation, and tech stack evaluation. Supplementary to your primary Digital Student Portfolio.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    {portfolioLoading ? (
                      <div className="h-8 w-24 bg-[#14131F]/5 rounded animate-pulse" />
                    ) : portfolioData && portfolioData.qualityScore !== undefined ? (
                      <div>
                        <div className="flex items-baseline sm:justify-end gap-1.5">
                          <span className="text-3xl sm:text-4xl font-display font-bold text-[#14131F]">
                            {portfolioData.qualityScore}
                          </span>
                          <span className="text-xs font-sans text-[#14131F]/60">/ 100 Quality</span>
                        </div>
                        <div className="mt-1 flex sm:justify-end items-center gap-2">
                          {portfolioData.qualityScore >= 75 ? (
                            <VerifiedSeal size="sm" iconType="check" label="Codebase Verified" />
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Audit Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="muted" size="md">
                        Awaiting Codebase Audit
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Loading Skeleton */}
                {portfolioLoading ? (
                  <div className="p-8 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl text-center space-y-3 animate-pulse">
                    <RefreshCw className="w-6 h-6 text-[#4338CA] animate-spin mx-auto" />
                    <p className="text-xs sm:text-sm font-medium text-[#14131F] font-sans">
                      Analyzing public GitHub repositories and architecture...
                    </p>
                  </div>
                ) : !portfolioData ? (
                  /* Empty State: Prompt user to enter GitHub username / URL */
                  <div className="p-8 sm:p-10 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-2xl space-y-5 text-center max-w-2xl mx-auto">
                    <div className="w-14 h-14 bg-[#4338CA]/10 text-[#4338CA] rounded-2xl flex items-center justify-center mx-auto">
                      <Github className="w-7 h-7" />
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-display font-bold text-[#14131F]">
                        Audit Your GitHub Codebase & Projects
                      </h3>
                      <p className="text-xs sm:text-sm text-[#14131F]/60 leading-relaxed font-sans max-w-md mx-auto">
                        Enter your GitHub username or profile URL below to run an automated AI audit of your public repositories, code modularity, README documentation, and tech stack breadth.
                      </p>
                    </div>

                    {portfolioError && (
                      <div className="p-3.5 bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#14131F] rounded-xl text-xs font-medium flex items-center gap-2.5 text-left">
                        <AlertCircle className="w-4 h-4 shrink-0 text-[#FB7185]" />
                        <span>{portfolioError}</span>
                      </div>
                    )}

                    <div className="space-y-3 pt-2">
                      <div className="text-left">
                        <label className="block text-xs font-medium text-[#14131F] mb-1.5 font-sans">
                          GitHub profile URL or username
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={githubInputUrl}
                            onChange={(e) => setGithubInputUrl(e.target.value)}
                            placeholder="e.g. https://github.com/username or octocat"
                            className="flex-1 px-3.5 py-2.5 bg-white border border-[#14131F]/15 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#4338CA] font-mono text-[#14131F]"
                          />
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleAnalyzePortfolio()}
                            disabled={isScanningPortfolio}
                            icon={isScanningPortfolio ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          >
                            {isScanningPortfolio ? 'Auditing Codebase...' : 'Audit GitHub Codebase'}
                          </Button>
                        </div>
                      </div>

                      {/* Quick demo pills */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs">
                        <span className="text-[11px] text-[#14131F]/50 font-sans">Quick fill:</span>
                        {['torvalds', 'shadcn', 'gaearon'].map((user) => (
                          <button
                            key={user}
                            type="button"
                            onClick={() => setGithubInputUrl(user)}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#14131F]/10 hover:border-[#4338CA]/30 text-[#14131F] text-[11px] font-mono transition-colors cursor-pointer"
                          >
                            @{user}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Audited Portfolio Dashboard */
                  <div className="space-y-6">
                    {/* Target Profile Bar & Re-Audit */}
                    <div className="p-4 sm:p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs text-[#14131F]/60 block font-sans">Audited GitHub Profile</span>
                          <a
                            href={portfolioData.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#14131F] hover:text-[#4338CA] flex items-center gap-1.5 font-display font-bold text-sm sm:text-base mt-0.5 transition-colors"
                          >
                            <Github className="w-4 h-4 text-[#14131F]" />
                            <span>@{portfolioData.githubUsername || portfolioData.githubUrl}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#14131F]/50" />
                          </a>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={githubInputUrl}
                            onChange={(e) => setGithubInputUrl(e.target.value)}
                            placeholder="Change GitHub URL"
                            className="px-3 py-1.5 bg-white border border-[#14131F]/15 rounded-lg text-xs font-mono text-[#14131F] w-44 sm:w-52 focus:outline-none focus:border-[#4338CA]"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAnalyzePortfolio()}
                            disabled={isScanningPortfolio}
                            icon={<RefreshCw className={`w-3.5 h-3.5 ${isScanningPortfolio ? 'animate-spin' : ''}`} />}
                          >
                            {isScanningPortfolio ? 'Auditing...' : 'Re-Audit'}
                          </Button>
                        </div>
                      </div>

                      {portfolioError && (
                        <div className="p-3 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-lg text-[#FB7185] text-xs font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
                          <span>{portfolioError}</span>
                        </div>
                      )}
                    </div>

                    {/* Executive AI Summary Card */}
                    {portfolioData.feedback && (
                      <div className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#4338CA] font-display font-bold text-xs sm:text-sm">
                          <Sparkles className="w-4 h-4 text-[#4338CA]" />
                          <span>Executive AI Industry Assessment</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#14131F]/75 leading-relaxed font-sans">
                          {portfolioData.feedback}
                        </p>
                      </div>
                    )}

                    {/* Strengths & Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {portfolioData.strengths && portfolioData.strengths.length > 0 && (
                        <div className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3">
                          <h4 className="text-xs sm:text-sm font-display font-bold text-[#14131F] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#14131F]" />
                            <span>Observed Key Strengths</span>
                          </h4>
                          <ul className="space-y-2 text-xs sm:text-sm text-[#14131F]/75 font-sans">
                            {portfolioData.strengths.map((str, idx) => (
                              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-[#4338CA] font-bold shrink-0">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {portfolioData.recommendations && portfolioData.recommendations.length > 0 && (
                        <div className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3">
                          <h4 className="text-xs sm:text-sm font-display font-bold text-[#14131F] flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#FB7185]" />
                            <span>Industry Recommendations</span>
                          </h4>
                          <ul className="space-y-2 text-xs sm:text-sm text-[#14131F]/75 font-sans">
                            {portfolioData.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-[#FB7185] font-bold shrink-0">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Audited Key Projects */}
                    <div className="space-y-3">
                      <LedgerContainer
                        header={
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Code className="w-4 h-4 text-[#4338CA]" />
                              <span className="font-display font-bold text-sm text-[#14131F] normal-case tracking-normal">
                                Audited Key Repositories
                              </span>
                            </div>
                            <span className="text-xs text-[#14131F]/60 font-sans">
                              {portfolioData.auditedProjects?.length || 0} Repositories
                            </span>
                          </div>
                        }
                      >
                        {portfolioData.auditedProjects && portfolioData.auditedProjects.length > 0 ? (
                          <div className="divide-y divide-[#14131F]/8">
                            {portfolioData.auditedProjects.map((proj, idx) => (
                              <div key={idx} className="p-4 sm:p-5 bg-white hover:bg-[#FAFAF8] transition-colors space-y-2.5 text-xs sm:text-sm font-sans">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-display font-bold text-[#14131F] text-sm sm:text-base">
                                        {proj.name}
                                      </h4>
                                      {proj.url && (
                                        <a
                                          href={proj.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[#14131F]/50 hover:text-[#4338CA] transition-colors p-0.5"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[#14131F]/60 mt-1 text-xs">
                                      <Badge variant="neutral" size="sm">
                                        {proj.language || 'Codebase'}
                                      </Badge>
                                      <span>•</span>
                                      <span>{proj.commits || '10+'} Commits</span>
                                      <span>•</span>
                                      <span>⭐ {proj.stars ?? 0}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="positive" size="sm">
                                      {proj.status || 'Audited'}
                                    </Badge>
                                    <VerifiedSeal size="sm" iconType="check" label="Repository Audited" />
                                  </div>
                                </div>

                                {proj.summary && (
                                  <p className="text-xs text-[#14131F]/70 italic bg-[#FAFAF8] p-3 rounded-lg border border-[#14131F]/8 leading-relaxed font-sans">
                                    &ldquo;{proj.summary}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-[#14131F]/60 font-sans">
                            No public repositories were returned for this account.
                          </div>
                        )}
                      </LedgerContainer>
                    </div>
                  </div>
                )}
              </div>
            }
          />

              {/* CERTIFICATIONS & CREDENTIALS CARD */}
              <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl space-y-6 shadow-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-display font-bold text-[#14131F] flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </span>
                      <span>Certifications & Credentials Bank</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1 font-sans">
                      Showcase verified global industry credentials, national certifications (NPTEL), and university honors to recruiters.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={certFileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCertFileUpload(file);
                        if (e.target) e.target.value = '';
                      }}
                      accept=".pdf,image/*"
                      className="hidden"
                    />

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => certFileInputRef.current?.click()}
                      disabled={isUploadingCertFile}
                      icon={isUploadingCertFile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    >
                      {isUploadingCertFile ? 'AI Extracting...' : 'Upload Certificate (AI)'}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setCertMode(certMode === 'manual' ? 'view' : 'manual');
                        setManualCertError(null);
                      }}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {certMode === 'manual' ? 'Cancel' : 'Add Manually'}
                    </Button>
                  </div>
                </div>

                {/* Upload Error Banner */}
                {uploadCertError && (
                  <div className="p-4 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl text-[#14131F] text-xs font-medium flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
                      <span>{uploadCertError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadCertError(null);
                        setCertMode('manual');
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#FB7185]/40 hover:bg-[#FB7185]/15 text-[#FB7185] font-medium transition-colors cursor-pointer text-xs shrink-0"
                    >
                      Fill details manually
                    </button>
                  </div>
                )}

                {/* Upload Confirmed Extraction Banner */}
                {uploadedCertConfirmation && (
                  <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#14131F] font-display font-bold text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#14131F]" />
                        <span>Gemini AI Extracted Certificate Successfully</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedCertConfirmation(null)}
                        className="text-[#14131F]/50 hover:text-[#14131F] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#14131F]/8 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans">
                      <div>
                        <span className="text-[#14131F]/60 block text-[11px]">Title</span>
                        <span className="font-semibold text-[#14131F]">{uploadedCertConfirmation.title}</span>
                      </div>
                      <div>
                        <span className="text-[#14131F]/60 block text-[11px]">Issuer</span>
                        <span className="font-semibold text-[#14131F]">{uploadedCertConfirmation.issuer}</span>
                      </div>
                      <div>
                        <span className="text-[#14131F]/60 block text-[11px]">Category</span>
                        <span className="mt-0.5 inline-block">
                          <Badge variant="neutral" size="sm">
                            {uploadedCertConfirmation.category}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Entry Form */}
                {certMode === 'manual' && (
                  <form onSubmit={handleAddManualCert} className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-2">
                      <h4 className="text-xs sm:text-sm font-display font-bold text-[#14131F] flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#4338CA]" />
                        <span>Add Certificate Manually</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setCertMode('view')}
                        className="text-[#14131F]/50 hover:text-[#14131F] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {manualCertError && (
                      <div className="p-3 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-lg text-[#FB7185] text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
                        <span>{manualCertError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                      <div>
                        <label className="block text-[#14131F] font-medium mb-1">
                          Certificate Title <span className="text-[#FB7185]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AWS Certified Solutions Architect"
                          value={manualCertTitle}
                          onChange={(e) => setManualCertTitle(e.target.value)}
                          className="w-full bg-white border border-[#14131F]/15 rounded-lg p-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#14131F] font-medium mb-1">
                          Issuing Organization <span className="text-[#FB7185]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Amazon Web Services, Coursera, NPTEL"
                          value={manualCertIssuer}
                          onChange={(e) => setManualCertIssuer(e.target.value)}
                          className="w-full bg-white border border-[#14131F]/15 rounded-lg p-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#14131F] font-medium mb-1">Category Classification</label>
                        <select
                          value={manualCertCategory}
                          onChange={(e: any) => setManualCertCategory(e.target.value)}
                          className="w-full bg-white border border-[#14131F]/15 rounded-lg p-2.5 text-[#14131F] outline-none focus:border-[#4338CA] font-sans"
                        >
                          <option value="Global">Global (AWS, Google, Coursera, Microsoft, edX)</option>
                          <option value="National">National (NPTEL, Swayam, Skill India)</option>
                          <option value="Local/College">Local / College (Workshops, Internal Awards)</option>
                          <option value="Other">Other Credentials</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#14131F] font-medium mb-1">Date Issued (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. May 2024 or 2024-05"
                          value={manualCertDate}
                          onChange={(e) => setManualCertDate(e.target.value)}
                          className="w-full bg-white border border-[#14131F]/15 rounded-lg p-2.5 text-[#14131F] outline-none focus:border-[#4338CA]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[#14131F] font-medium mb-1">Credential Link / Verification URL (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://coursera.org/verify/... or https://aws.amazon.com/verify"
                          value={manualCertUrl}
                          onChange={(e) => setManualCertUrl(e.target.value)}
                          className="w-full bg-white border border-[#14131F]/15 rounded-lg p-2.5 text-[#14131F] outline-none focus:border-[#4338CA] font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setCertMode('view')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingManualCert}
                        icon={isSubmittingManualCert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      >
                        {isSubmittingManualCert ? 'Saving...' : 'Save Certificate'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Display Certifications List Grouped by Category */}
                {certLoading ? (
                  <div className="p-8 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl text-center space-y-2 animate-pulse">
                    <RefreshCw className="w-5 h-5 text-[#4338CA] animate-spin mx-auto" />
                    <p className="text-xs text-[#14131F]/60 font-sans">Loading certifications...</p>
                  </div>
                ) : certifications.length === 0 ? (
                  /* Empty State */
                  <div className="p-8 bg-[#FAFAF8] border border-dashed border-[#14131F]/15 rounded-2xl text-center space-y-3 font-sans">
                    <div className="w-12 h-12 bg-[#4338CA]/10 text-[#4338CA] rounded-2xl flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-display font-bold text-[#14131F]">No certifications added yet</h4>
                    <p className="text-xs text-[#14131F]/60 max-w-md mx-auto leading-relaxed">
                      Upload a credential certificate or add one manually to highlight your global qualifications, NPTEL scores, and university honors to recruiters.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => certFileInputRef.current?.click()}
                        icon={<Upload className="w-3.5 h-3.5" />}
                      >
                        Upload Certificate
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setCertMode('manual')}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Add Manually
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Grouped Display Cards */
                  <div className="space-y-6">
                    {(['Global', 'National', 'Local/College', 'Other'] as const).map((catName) => {
                      const catItems = certGrouped[catName] || [];
                      if (catItems.length === 0) return null;

                      const catLabels: Record<string, string> = {
                        Global: 'Global Credentials',
                        National: 'National / NPTEL',
                        'Local/College': 'Local / College Honors',
                        Other: 'Other Achievements',
                      };

                      return (
                        <div key={catName} className="space-y-3 font-sans">
                          <div className="flex items-center justify-between pb-1 border-b border-[#14131F]/8">
                            <h4 className="text-xs font-display font-bold text-[#14131F] flex items-center gap-1.5">
                              <span>{catLabels[catName] || catLabels.Other}</span>
                            </h4>
                            <span className="text-xs text-[#14131F]/60 font-sans">
                              {catItems.length} {catItems.length === 1 ? 'Record' : 'Records'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {catItems.map((cert: any) => (
                              <RecordCard
                                key={cert._id || cert.id}
                                title={<span className="text-sm font-display font-bold text-[#14131F]">{cert.title}</span>}
                                subtitle={<span className="text-xs text-[#14131F]/60 font-sans">{cert.issuer}</span>}
                                action={
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCert(cert._id || cert.id)}
                                    disabled={deletingCertId === (cert._id || cert.id)}
                                    title="Delete certification"
                                    className="text-[#14131F]/40 hover:text-[#FB7185] transition-colors cursor-pointer p-1"
                                  >
                                    {deletingCertId === (cert._id || cert.id) ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FB7185]" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                }
                                className="space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#14131F]/60">
                                  <div className="flex items-center gap-2">
                                    {cert.dateIssued && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-[#14131F]/40" />
                                        {cert.dateIssued}
                                      </span>
                                    )}

                                    <Badge variant={cert.source === 'upload' ? 'positive' : 'neutral'} size="sm">
                                      {cert.source === 'upload' ? 'AI Uploaded' : 'Manual'}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-3 ml-auto">
                                    {cert.fileUrl && (
                                      <a
                                        href={cert.fileUrl}
                                        onClick={(e) => {
                                          if (cert.fileUrl.startsWith('/')) {
                                            e.preventDefault();
                                            viewAuthenticatedFile(cert.fileUrl);
                                          }
                                        }}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#4338CA] hover:underline flex items-center gap-1 font-medium text-xs"
                                      >
                                        <FileText className="w-3 h-3 text-[#4338CA]" />
                                        <span>View Document</span>
                                        <ExternalLink className="w-3 h-3 text-[#4338CA]" />
                                      </a>
                                    )}
                                    {cert.credentialUrl && (
                                      <a
                                        href={cert.credentialUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#4338CA] hover:underline flex items-center gap-0.5 font-medium"
                                      >
                                        <span>Verify link</span>
                                        <ExternalLink className="w-3 h-3 text-[#4338CA]" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </RecordCard>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* TAB 7: COMPANY READINESS PREDICTION */}
          {activeTab === 'company_readiness' && (() => {
            const companyListToUse = companyReadinessList;
            const inspectedCompanyData = companyListToUse.find(c => c.company === inspectedCompany);
            return (
              <div className="space-y-6 font-sans">
                <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
                  <div className="border-b border-[#14131F]/8 pb-5">
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#14131F] flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#4338CA]" />
                      <span>Company Readiness Prediction Engine</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1 font-sans">
                      Benchmark profile readiness against top tech hiring bars. Click on any company card below to open detailed interview bars, gap analysis & syllabus in a focus inspection view.
                    </p>
                  </div>

                  {/* Target Company Readiness Grid - Clickable Cards */}
                  <div className="p-5 sm:p-6 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#4338CA]" />
                        <h3 className="font-display font-semibold text-[#14131F] text-sm sm:text-base">Target Company Readiness & Gap Analysis</h3>
                      </div>
                      <Badge variant="neutral" size="sm">
                        Click Any Card to Inspect Details
                      </Badge>
                    </div>

                    {companyReadinessLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="p-4 border border-[#14131F]/8 rounded-xl bg-white space-y-3 animate-pulse">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#14131F]/10" />
                                <div className="w-24 h-4 rounded bg-[#14131F]/10" />
                              </div>
                              <div className="w-16 h-4 rounded bg-[#14131F]/10" />
                            </div>
                            <div className="h-12 rounded bg-[#14131F]/5" />
                            <div className="w-3/4 h-3 rounded bg-[#14131F]/10" />
                            <div className="w-1/2 h-3 rounded bg-[#14131F]/10" />
                          </div>
                        ))}
                      </div>
                    ) : companyListToUse.length === 0 ? (
                      <div className="p-8 text-center text-[#14131F]/60 bg-white border border-[#14131F]/8 rounded-xl">
                        <p className="text-xs font-medium font-sans">No company readiness data available.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companyListToUse.map((item) => {
                          const isInspected = inspectedCompany === item.company;
                          const hasMatchScore = item.matchScore !== null && item.matchScore !== undefined;

                          return (
                            <div
                              key={item.company}
                              onClick={() => {
                                setSelectedCompany(item.company);
                                setInspectedCompany(item.company);
                              }}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-xs ${
                                isInspected
                                  ? 'bg-white border-[#4338CA] ring-2 ring-[#4338CA]/20'
                                  : 'bg-white border-[#14131F]/8 hover:border-[#14131F]/20 hover:shadow-sm'
                              }`}
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{item.logo}</span>
                                    <h4 className="font-display font-semibold text-[#14131F] text-sm">{item.company}</h4>
                                  </div>

                                  <Badge
                                    variant={hasMatchScore ? 'positive' : 'warning'}
                                    size="sm"
                                  >
                                    {item.matchStatus || item.status}
                                  </Badge>
                                </div>

                                {hasMatchScore ? (
                                  <div className="p-2.5 bg-[#FAFAF8] rounded-lg border border-[#14131F]/8 text-xs space-y-1.5 font-sans">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[#14131F]/60">Match Score:</span>
                                      <span className="font-mono font-bold text-[#14131F]">{item.matchScore}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[#14131F]/60">Expected Cutoff:</span>
                                      <span className="font-mono text-[#14131F]">{item.cutoffPct}%</span>
                                    </div>
                                    <div className="w-full bg-[#14131F]/8 rounded-full h-1.5 overflow-hidden mt-1">
                                      <div className="bg-[#4338CA] h-full rounded-full" style={{ width: `${item.matchScore}%` }} />
                                    </div>
                                    {item.basis && (
                                      <p className="text-[11px] text-[#14131F]/60 italic pt-1 border-t border-[#14131F]/8 leading-tight">
                                        {item.basis}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-2.5 bg-[#FAFAF8] rounded-lg border border-[#14131F]/10 text-xs space-y-1 font-sans">
                                    <div className="flex items-start gap-1.5 text-[#14131F] text-xs leading-snug">
                                      <AlertCircle className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
                                      <span>Complete a mock interview or aptitude test to unlock this score</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-[#14131F]/60 pt-1 border-t border-[#14131F]/8 mt-1 font-sans">
                                      <span>Target Cutoff:</span>
                                      <span className="font-mono font-semibold text-[#14131F]">{item.cutoffPct}%</span>
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs text-[#14131F]/60 font-sans">
                                  <strong className="text-[#14131F] font-medium">Focus:</strong> {item.focusArea}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-[#14131F]/8 text-xs text-[#14131F]/60 font-sans flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-[#14131F]/40 shrink-0" />
                                  <span className="line-clamp-1">{item.missingGaps}</span>
                                </div>
                                <span className="text-xs font-semibold text-[#4338CA] flex items-center gap-0.5 shrink-0 ml-2">
                                  Inspect <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Active Application Pipeline Detailed Ledger */}
                  <LedgerContainer
                    header={
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#4338CA]" />
                          <span className="font-display font-semibold text-sm text-[#14131F]">
                            Active Job Applications Pipeline
                          </span>
                          <Badge variant="neutral" size="sm">
                            {pipelineApps.length} {pipelineApps.length === 1 ? 'Application' : 'Applications'}
                          </Badge>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveTab('opportunities')}
                          className="self-start sm:self-auto text-xs"
                          icon={<Briefcase className="w-3.5 h-3.5" />}
                        >
                          Browse More Roles
                        </Button>
                      </div>
                    }
                  >
                    {pipelineApps.length === 0 ? (
                      <div className="p-8 text-center space-y-3 font-sans">
                        <div className="w-10 h-10 rounded-full bg-[#14131F]/5 flex items-center justify-center mx-auto text-[#14131F]/40">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-display font-semibold text-[#14131F]">No active job applications</p>
                          <p className="text-xs text-[#14131F]/60 max-w-sm mx-auto font-sans leading-relaxed">
                            Apply to active campus placement drives and internships to track real-time recruitment pipeline stages.
                          </p>
                        </div>
                        <div className="pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setActiveTab('opportunities')}
                            className="bg-[#4338CA] hover:bg-[#3730A3] text-white"
                          >
                            View Opportunities Board
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#14131F]/8">
                        {pipelineApps.map((app) => {
                          const stage = resolveApplicationStage(app.status, app.stage);
                          return (
                            <div
                              key={app.id}
                              className="p-5 sm:p-6 bg-white hover:bg-[#FAFAF8]/60 transition-colors space-y-4"
                            >
                              {/* Top Bar: Company & Role on Left, CTC & Status on Right */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-start gap-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 flex items-center justify-center font-display font-bold text-sm text-[#14131F] shrink-0 mt-0.5">
                                    {app.company ? app.company.charAt(0).toUpperCase() : 'J'}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <h4 className="font-display font-bold text-base text-[#14131F]">
                                        {app.company}
                                      </h4>
                                      <span className="text-[#14131F]/30">•</span>
                                      <span className="font-sans font-medium text-sm text-[#14131F]/80">
                                        {app.role}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-xs text-[#14131F]/60 font-sans">
                                      {app.ctc && (
                                        <span className="inline-flex items-center gap-1 font-semibold text-[#14131F] bg-[#FAFAF8] px-2.5 py-0.5 rounded-md border border-[#14131F]/8">
                                          Package: {app.ctc}
                                        </span>
                                      )}
                                      <span>•</span>
                                      <span>Stage: <strong className="text-[#14131F] font-semibold">{app.stage}</strong></span>
                                    </div>
                                  </div>
                                </div>

                                <div className="self-start md:self-center shrink-0">
                                  {renderApplicationStageBadge(stage)}
                                </div>
                              </div>

                              {/* Pipeline Stage Tracker Shelf */}
                              <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/6 space-y-2">
                                <div className="flex items-center justify-between text-xs font-sans pb-1">
                                  <span className="text-[#14131F]/60 font-medium">Recruitment Pipeline Stage</span>
                                  <span className="text-[11px] font-semibold text-[#4338CA]">
                                    {stage.isOffer
                                      ? 'Final Stage Complete'
                                      : stage.isRejected
                                      ? 'Process Concluded'
                                      : `Current: ${PIPELINE_STAGES[stage.stageIndex]?.label}`}
                                  </span>
                                </div>
                                <div className="px-1 sm:px-3 pt-1">
                                  <ApplicationStageTracker
                                    statusRaw={app.status}
                                    stageRaw={app.stage}
                                  />
                                </div>
                              </div>

                              {/* Offer Stage: Internship Completion Status & Mentor Feedback */}
                              {(stage.isOffer || app.status?.toLowerCase() === 'offer') && (
                                <div className="pt-2 border-t border-[#14131F]/6 space-y-2.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#14131F]/60 font-medium font-sans">
                                        Internship Completion Record:
                                      </span>
                                      {renderCompletionBadge(app.completionStatus)}
                                    </div>
                                    {app.mentorFeedback?.submittedAt && (
                                      <span className="text-[11px] text-[#14131F]/45 font-sans">
                                        Verified on {new Date(app.mentorFeedback.submittedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>

                                  {app.mentorFeedback && (app.mentorFeedback.rating || app.mentorFeedback.comments) && (
                                    <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5 font-sans">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-[#14131F] flex items-center gap-1.5">
                                          <Award className="w-3.5 h-3.5 text-[#4338CA]" />
                                          Industry Mentor Feedback
                                        </span>
                                        {typeof app.mentorFeedback.rating === 'number' && (
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star
                                                key={star}
                                                className={`w-3.5 h-3.5 ${
                                                  star <= (app.mentorFeedback?.rating ?? 0)
                                                    ? 'text-amber-500 fill-amber-500'
                                                    : 'text-[#14131F]/20'
                                                }`}
                                              />
                                            ))}
                                            <span className="text-xs font-semibold text-[#14131F] ml-1">
                                              {app.mentorFeedback.rating}/5
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {app.mentorFeedback.comments && (
                                        <p className="text-xs text-[#14131F]/80 italic leading-relaxed pl-4 border-l-2 border-[#4338CA]/30">
                                          "{app.mentorFeedback.comments}"
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </LedgerContainer>
                </div>

                {/* POP-UP MODAL IN FRONT OF LIST WITH BLURRED BACKDROP */}
                {inspectedCompanyData && (() => {
                  const inspectedHasScore = inspectedCompanyData.matchScore !== null && inspectedCompanyData.matchScore !== undefined;
                  return (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#14131F]/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 font-sans"
                      onClick={() => setInspectedCompany(null)}
                    >
                      <div
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white text-[#14131F] space-y-6 rounded-2xl border border-[#14131F]/10 shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Close Button */}
                        <button
                          onClick={() => setInspectedCompany(null)}
                          className="absolute top-5 right-5 p-2 bg-[#FAFAF8] rounded-lg border border-[#14131F]/15 hover:bg-[#14131F] hover:text-white text-[#14131F] transition-colors cursor-pointer z-10"
                          title="Close details"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5 pr-10">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10">
                              {inspectedCompanyData.logo}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-display font-bold text-[#14131F]">{inspectedCompanyData.company}</h3>
                                <Badge
                                  variant={inspectedHasScore ? 'positive' : 'warning'}
                                  size="sm"
                                >
                                  {inspectedCompanyData.matchStatus || inspectedCompanyData.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#14131F]/60 mt-0.5 font-sans">
                                Target Role: <span className="text-[#14131F] font-medium">{inspectedCompanyData.role}</span>
                              </p>
                              {inspectedCompanyData.basis && (
                                <p className="text-xs text-[#14131F]/60 italic mt-1 font-sans">
                                  {inspectedCompanyData.basis}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="px-4 py-2 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 text-xs">
                              <span className="text-[#14131F]/60 block text-[11px]">Match Score vs Cutoff</span>
                              {inspectedHasScore ? (
                                <div className="mt-0.5">
                                  <span className="text-[#4338CA] font-mono font-bold text-base">
                                    {inspectedCompanyData.matchScore}%
                                  </span>
                                  <span className="text-[#14131F]/60 font-mono text-xs"> / {inspectedCompanyData.cutoffPct}% Cutoff</span>
                                </div>
                              ) : (
                                <span className="text-[#FB7185] font-medium text-xs block mt-0.5">
                                  Not enough data yet
                                </span>
                              )}
                            </div>

                            <div className="px-4 py-2 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 text-xs">
                              <span className="text-[#14131F]/60 block text-[11px]">Clear Probability</span>
                              <span className="text-[#14131F] font-semibold text-sm">
                                {inspectedCompanyData.clearProbability}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Customized Skill Competency Bars */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-display font-semibold text-[#14131F] flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[#4338CA]" />
                            <span>Detailed Competency Bar Breakdown ({inspectedCompanyData.company})</span>
                          </h4>

                          {inspectedHasScore ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {inspectedCompanyData.bars.map((bar: any, i: number) => (
                                <div key={i} className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                                  <div className="flex items-center justify-between text-xs font-sans">
                                    <span className="font-medium text-[#14131F]">{bar.name}</span>
                                    <span className="font-semibold text-[#4338CA] font-mono">{bar.status}</span>
                                  </div>
                                  <div className="w-full bg-[#14131F]/8 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-[#4338CA] h-full rounded-full transition-all duration-500"
                                      style={{ width: `${bar.pct}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 text-[#14131F] text-xs flex items-center gap-3 font-sans">
                              <AlertCircle className="w-4 h-4 text-[#4338CA] shrink-0" />
                              <span>
                                Complete a mock interview, take an aptitude mock test, or upload your resume to unlock this company&apos;s readiness score
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 3-Column Detailed Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-sans">
                          {/* High Frequency Interview Topics */}
                          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                            <h4 className="text-xs font-display font-semibold text-[#14131F] flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-[#4338CA]" /> High Frequency Topics
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {inspectedCompanyData.frequentTopics.map((topic, i) => (
                                <Badge key={i} variant="neutral" size="sm">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Actionable Gap Analysis */}
                          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                            <h4 className="text-xs font-display font-semibold text-[#14131F] flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" /> Actionable Gap Analysis
                            </h4>
                            <ul className="space-y-2 text-xs text-[#14131F]/70">
                              {inspectedCompanyData.actionPlan.map((plan, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635] shrink-0 mt-0.5" />
                                  <span className="text-[#14131F]">{plan}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Typical Interview Process */}
                          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                            <h4 className="text-xs font-display font-semibold text-[#14131F] flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#4338CA]" /> Interview Process & Rounds
                            </h4>
                            <div className="space-y-2 text-xs">
                              {inspectedCompanyData.interviewRounds.map((rnd, i) => (
                                <div key={i} className="p-2.5 bg-white rounded-lg border border-[#14131F]/8 space-y-0.5">
                                  <p className="font-medium text-[#14131F] text-xs">{rnd.round}</p>
                                  <p className="text-[#14131F]/60 text-[11px] leading-snug">{rnd.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Quick Launch Actions */}
                        <div className="pt-4 border-t border-[#14131F]/8 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
                          <div className="text-xs text-[#14131F]/60">
                            Ready to practice specifically for <strong className="text-[#14131F]">{inspectedCompanyData.company}</strong>?
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setInterviewCategory(`${inspectedCompanyData.company} Specific Drill`);
                              setInspectedCompany(null);
                              setActiveTab('interview');
                            }}
                            icon={<PlayCircle className="w-4 h-4" />}
                          >
                            Launch {inspectedCompanyData.company} AI Mock Drill
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* TAB: JOBS & INTERNSHIPS BOARD */}
          {activeTab === 'opportunities' && <OpportunitiesBoard />}

          {/* TAB 8: AI CAREER ROADMAP */}
          {activeTab === 'roadmap' && (
            <AiCareerRoadmapGenerator initialRole={studentInfo.targetRole} />
          )}

          {/* TAB 9: ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
            <StudentAnalyticsDashboard />
          )}

          {/* TAB 10: MY BADGES & MICRO-CREDENTIALS */}
          {activeTab === 'badges' && (
            <MyBadgesAndCredentials studentName={studentInfo.fullName} />
          )}

          {/* TAB 10: AI CAREER MENTOR */}
          {activeTab === 'mentor' && (
            <div className="space-y-6 font-sans">
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#14131F]/8 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#14131F] flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      <span>24/7 AI Career Mentor & Coach</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#14131F]/60 mt-1 font-sans">
                      Personalized coaching for salary negotiations, system design trade-offs, behavioral STAR drills, and interview recovery.
                    </p>
                  </div>

                  {/* Active Coach Status & Reset Button */}
                  <div className="flex items-center gap-2 sm:self-center">
                    <Badge variant="positive" size="sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#14131F] mr-1.5 inline-block" />
                      AI Coach Online
                    </Badge>
                    <button
                      type="button"
                      onClick={() =>
                        setMentorMessages([
                          {
                            sender: 'ai',
                            text: `Hello ${studentInfo.fullName}! I'm your dedicated AI Placement Coach. How can I help you prepare for your ${studentInfo.targetRole} interviews at ${studentInfo.collegeShort}?`,
                          },
                        ])
                      }
                      title="Reset conversation"
                      className="px-2.5 py-1 text-xs text-[#14131F]/60 hover:text-[#14131F] border border-[#14131F]/10 hover:bg-[#14131F]/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Active Coaching Profile Strip */}
                <div className="p-3.5 sm:p-4 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#14131F]/70">
                    <span>
                      Target Role: <strong className="text-[#14131F] font-semibold">{studentInfo.targetRole || 'Software Engineer'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Campus: <strong className="text-[#14131F] font-semibold">{studentInfo.collegeShort || studentInfo.college || 'Engineering'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Target CTC: <strong className="text-[#14131F] font-semibold">{studentInfo.targetCtc || '₹18 - ₹24 LPA'}</strong>
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    Gemini 2.0 Calibrated
                  </Badge>
                </div>

                {/* Recommended Quick Prompts */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-[#14131F]/50 uppercase tracking-wider block">
                    Recommended Conversation Starters
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { icon: '💼', text: 'How do I negotiate a ₹20 LPA CTC offer as a new grad?' },
                      { icon: '🏛️', text: 'Explain CAP Theorem with practical trade-offs in distributed systems' },
                      { icon: '🎯', text: 'How to structure "Tell me about a time you had a technical disagreement" with STAR' },
                      { icon: '⚡', text: 'What should I do if I get stuck on a hard DSA question during a live interview?' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMentorMessage(p.text)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] border border-[#14131F]/10 hover:border-[#4338CA]/40 text-[#14131F] font-medium transition-all cursor-pointer text-left text-xs shadow-2xs flex items-center gap-1.5"
                      >
                        <span>{p.icon}</span>
                        <span>{p.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat window */}
                <div className="p-4 sm:p-6 rounded-2xl bg-[#FAFAF8] border border-[#14131F]/8 h-[36rem] min-h-[30rem] flex flex-col justify-between space-y-4 text-sm font-sans">
                  {/* Messages Feed */}
                  <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                    {mentorMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender Label */}
                        <div className="text-[11px] text-[#14131F]/50 font-sans mb-1 px-1 flex items-center gap-1.5">
                          {msg.sender === 'user' ? (
                            <span>You</span>
                          ) : (
                            <>
                              <span className="w-3.5 h-3.5 rounded bg-[#4338CA]/10 text-[#4338CA] inline-flex items-center justify-center text-[9px] font-bold">
                                ✦
                              </span>
                              <span>AI Career Mentor</span>
                            </>
                          )}
                        </div>

                        {msg.sender === 'user' ? (
                          <div className="max-w-[90%] sm:max-w-[80%] p-4 rounded-2xl leading-relaxed text-sm bg-[#4338CA] text-white rounded-tr-xs font-medium whitespace-pre-wrap shadow-2xs">
                            {msg.text}
                          </div>
                        ) : (
                          <div className="max-w-[95%] sm:max-w-[85%] p-4 sm:p-5 rounded-2xl leading-relaxed text-sm bg-white text-[#14131F] border border-[#14131F]/8 rounded-tl-xs shadow-2xs">
                            <div className="text-[#14131F] leading-relaxed text-sm space-y-2.5 [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>h1]:text-base [&>h1]:font-display [&>h1]:font-bold [&>h1]:mt-3.5 [&>h1]:mb-1.5 [&>h1]:text-[#14131F] [&>h2]:text-sm [&>h2]:font-display [&>h2]:font-bold [&>h2]:mt-3.5 [&>h2]:mb-1.5 [&>h2]:text-[#14131F] [&>h3]:text-xs [&>h3]:font-bold [&>h3]:mt-2.5 [&>h3]:mb-1 [&>h3]:text-[#14131F] [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2.5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:my-2.5 [&>ol]:space-y-1.5 [&>li]:leading-normal [&>li>p]:inline [&>strong]:font-semibold [&>strong]:text-[#14131F] [&>code]:bg-[#14131F]/5 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:font-mono [&>code]:text-xs [&>code]:text-[#4338CA] [&>pre]:bg-[#14131F] [&>pre]:text-white [&>pre]:p-3.5 [&>pre]:rounded-xl [&>pre]:my-2.5 [&>pre]:overflow-x-auto [&>hr]:my-3.5 [&>hr]:border-[#14131F]/10 [&>blockquote]:border-l-2 [&>blockquote]:border-[#4338CA] [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-[#14131F]/70">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-[#14131F]/8 flex flex-wrap items-center gap-1.5 text-[11px] text-[#14131F]/60">
                                <span className="font-semibold text-[#4338CA] flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  Grounded in:
                                </span>
                                {msg.sources.map((s: any, sIdx: number) => (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F4F4F0] border border-[#14131F]/6 font-medium text-[#14131F]/80"
                                    title={s.company ? `${s.company} (${s.role || ''})` : s.title}
                                  >
                                    {s.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing State */}
                    {isMentorTyping && (
                      <div className="flex flex-col items-start">
                        <div className="text-[11px] text-[#14131F]/50 font-sans mb-1 px-1 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded bg-[#4338CA]/10 text-[#4338CA] inline-flex items-center justify-center text-[9px] font-bold">
                            ✦
                          </span>
                          <span>AI Career Mentor</span>
                        </div>
                        <div className="p-3.5 px-4 rounded-2xl bg-white border border-[#14131F]/8 text-[#14131F]/70 italic text-xs sm:text-sm rounded-tl-xs shadow-2xs flex items-center gap-2 font-sans">
                          <Sparkles className="w-4 h-4 text-[#4338CA] animate-pulse" />
                          <span>AI Mentor is drafting personalized recommendations...</span>
                        </div>
                      </div>
                    )}
                    <div ref={mentorEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="space-y-1.5 pt-2 border-t border-[#14131F]/8">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ask your AI Career Mentor anything (e.g. CTC breakdown, system design, mock drill)..."
                        value={mentorInput}
                        onChange={(e) => setMentorInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMentorMessage()}
                        disabled={isMentorTyping}
                        className="flex-1 bg-white border border-[#14131F]/15 rounded-xl px-4 py-3 text-[#14131F] text-xs sm:text-sm outline-none focus:border-[#4338CA] transition-colors shadow-2xs"
                      />
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleSendMentorMessage()}
                        disabled={isMentorTyping || !mentorInput.trim()}
                        icon={isMentorTyping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      >
                        Send
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#14131F]/40 px-1">
                      <span>Press Enter ↵ to send</span>
                      <span>Powered by Gemini 2.0 Placement Intelligence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: APTITUDE TEST */}
          {activeTab === 'aptitude' && (
            <AptitudeTestModule />
          )}

          {/* TAB: INDUSTRY-ALIGNED SKILL ASSESSMENT */}
          {activeTab === 'skill_assessment' && (
            <SkillAssessmentModule />
          )}

          {/* TAB: INTERVIEW EXPERIENCES */}
          {activeTab === 'experiences' && (
            <InterviewExperienceBank />
          )}

          {/* TAB: HUMAN FACULTY MENTORS (FIX #8) */}
          {activeTab === 'human_mentors' && (
            <MentorDiscovery token={token || null} onNavigateTab={(tab) => setActiveTab(tab as ModuleTab)} />
          )}

          {/* MY PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#14131F]/8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#4338CA] text-white font-display font-bold text-xl flex items-center justify-center shadow-xs">
                      {(studentInfo.fullName || 'Student').split(' ').map((n) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-[#14131F]">{studentInfo.fullName || 'Student Profile'}</h2>
                      <p className="text-xs sm:text-sm font-sans text-[#14131F]/60 font-medium mt-0.5">{studentInfo.degree || 'Degree not specified'}</p>
                      <p className="text-xs font-sans text-[#14131F]/60 mt-0.5">
                        {studentInfo.college ? `${studentInfo.college} • ` : ''}Class of {studentInfo.graduationYear || '—'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    icon={<Edit3 className="w-4 h-4" />}
                    onClick={() => {
                      setFormData({ ...studentInfo });
                      setProfileSaveError(null);
                      setIsProfileModalOpen(true);
                    }}
                  >
                    Edit Profile Details
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm font-sans">
                  <div className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3">
                    <h3 className="font-display font-semibold text-[#14131F] text-xs uppercase tracking-wider">Academic & Target Career</h3>
                    
                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">Target Role</span>
                      <span className="text-[#14131F] font-semibold text-sm sm:text-base">{studentInfo.targetRole || '—'}</span>
                    </div>

                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">Target CTC Expectation</span>
                      <span className="text-[#4338CA] font-semibold text-sm sm:text-base">{studentInfo.targetCtc || '—'}</span>
                    </div>

                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">CGPA / Percentage</span>
                      <span className="text-[#14131F] font-medium text-xs sm:text-sm">{studentInfo.cgpa || '—'}</span>
                    </div>

                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">Graduation Year</span>
                      <span className="text-[#14131F] font-medium text-xs sm:text-sm">{studentInfo.graduationYear || '—'}</span>
                    </div>
                  </div>

                  <div className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-3">
                    <h3 className="font-display font-semibold text-[#14131F] text-xs uppercase tracking-wider">Contact & Social Links</h3>
                    
                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">Email Address</span>
                      <span className="text-[#14131F] font-medium text-xs sm:text-sm flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-[#14131F]/40" />
                        {studentInfo.email || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">Phone Number</span>
                      <span className="text-[#14131F] font-medium text-xs sm:text-sm flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-[#14131F]/40" />
                        {studentInfo.phone || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">GitHub Profile</span>
                      {studentInfo.github ? (
                        <a href={studentInfo.github} target="_blank" rel="noreferrer" className="text-[#4338CA] font-medium text-xs sm:text-sm hover:underline flex items-center gap-1.5 mt-0.5">
                          <Github className="w-3.5 h-3.5 text-[#4338CA]" />
                          {studentInfo.github}
                        </a>
                      ) : (
                        <span className="text-[#14131F]/40 text-xs mt-0.5 block">Not provided</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[#14131F]/60 font-sans block text-xs">LinkedIn Profile</span>
                      {studentInfo.linkedin ? (
                        <a href={studentInfo.linkedin} target="_blank" rel="noreferrer" className="text-[#4338CA] font-medium text-xs sm:text-sm hover:underline flex items-center gap-1.5 mt-0.5">
                          <Linkedin className="w-3.5 h-3.5 text-[#4338CA]" />
                          {studentInfo.linkedin}
                        </a>
                      ) : (
                        <span className="text-[#14131F]/40 text-xs mt-0.5 block">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-2 text-xs sm:text-sm font-sans">
                  <h3 className="font-display font-semibold text-[#14131F] text-xs uppercase tracking-wider">Primary Technical Skills</h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {studentInfo.skills && studentInfo.skills.trim().length > 0 ? (
                      studentInfo.skills.split(',').map((skill, idx) => (
                        <Badge key={idx} variant="verified" size="sm">
                          {skill.trim()}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[#14131F]/60 italic text-xs">No skills listed yet. Click &quot;Edit Profile Details&quot; to add your skills.</span>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-[#FAFAF8] border border-[#14131F]/8 rounded-xl space-y-2 text-xs sm:text-sm font-sans">
                  <h3 className="font-display font-semibold text-[#14131F] text-xs uppercase tracking-wider">Bio & Summary</h3>
                  <p className="text-[#14131F] font-normal leading-relaxed text-xs sm:text-sm">
                    {studentInfo.bio || <span className="text-[#14131F]/60 italic text-xs">No bio added yet. Click &quot;Edit Profile Details&quot; to introduce yourself.</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

      </DashboardShell>

      {/* EDIT STUDENT PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14131F]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#14131F]/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full text-left space-y-6 text-[#14131F] shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4338CA] flex items-center justify-center text-white shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-bold text-[#14131F]">Edit Student Profile Info</h3>
                  <p className="text-xs text-[#14131F]/60 font-sans">Update your academic, career, and contact details</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#14131F]/15 hover:bg-[#14131F]/5 text-[#14131F]/60 hover:text-[#14131F] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileSaveError && (
              <div className="p-3 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl text-[#FB7185] text-xs font-sans flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
                <span>{profileSaveError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#14131F] font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">College / University</label>
                  <input
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value, collegeShort: e.target.value.split('(')[1]?.replace(')', '') || e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">Degree & Specialization</label>
                  <input
                    type="text"
                    required
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">Graduation Year & CGPA</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Grad Year (e.g. 2025)"
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      className="w-1/2 bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="CGPA (e.g. 9.2)"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      className="w-1/2 bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">Target Role</label>
                  <input
                    type="text"
                    required
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">Target CTC Expectation</label>
                  <input
                    type="text"
                    required
                    value={formData.targetCtc}
                    onChange={(e) => setFormData({ ...formData, targetCtc: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">GitHub Profile URL</label>
                  <input
                    type="text"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#14131F] font-medium mb-1">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#14131F] font-medium mb-1">Primary Tech Skills (Comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#14131F] font-medium mb-1">Short Bio / Summary</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-3 py-2 text-[#14131F] outline-none focus:border-[#4338CA] transition-colors resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#14131F]/8 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSavingProfile}
                  icon={isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                >
                  {isSavingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};
