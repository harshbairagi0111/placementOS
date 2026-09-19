import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Building2,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Calendar,
  BookOpen,
  Code2,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Check,
  Target,
  ArrowRight,
  Eye,
  Loader2,
  AlertCircle,
  FolderGit2,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkle
} from 'lucide-react';
import { Button, Badge, SectionHeading, RecordCard, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui';

interface RecommendedProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: string;
}

const getRecommendedProjects = (role: string, company: string): RecommendedProject[] => {
  const isBackend = role.toLowerCase().includes('backend') ||
    company.toLowerCase().includes('razorpay') ||
    company.toLowerCase().includes('swiggy') ||
    company.toLowerCase().includes('uber');

  if (isBackend) {
    return [
      {
        id: 'proj_1',
        title: 'Distributed Idempotent Payment Processor',
        description: 'Microservice supporting idempotent charges with Redis distributed locks, transactional outbox pattern, and exponential backoff.',
        tags: ['Distributed Systems', 'Redis', 'PostgreSQL', 'Kafka'],
        difficulty: 'Advanced',
      },
      {
        id: 'proj_2',
        title: 'Real-Time Geospatial Driver Dispatch Engine',
        description: 'High-throughput spatial indexing system matching delivery riders using H3 hexagonal coordinates and dynamic Dijkstra routing.',
        tags: ['Geospatial', 'WebSockets', 'Algorithms', 'Node.js'],
        difficulty: 'Intermediate',
      },
    ];
  }

  return [
    {
      id: 'proj_1',
      title: 'Microservices Event-Driven Order Processing Engine',
      description: 'Distributed architecture implementing the saga pattern, asynchronous queue workers, and automated fault recovery.',
      tags: ['System Design', 'Microservices', 'Docker', 'Redis'],
      difficulty: 'Advanced',
    },
    {
      id: 'proj_2',
      title: 'Real-Time Collaborative Code Canvas & Editor',
      description: 'Multi-user operational transformation engine with conflict-free replicated data types (CRDTs) and WebSocket sync.',
      tags: ['Full-Stack', 'WebSockets', 'TypeScript', 'React'],
      difficulty: 'Intermediate',
    },
  ];
};

interface RecommendedCertification {
  id: string;
  name: string;
  provider: string;
  relevance: string;
  status: 'recommended' | 'in_progress' | 'completed';
}

const getRecommendedCertifications = (role: string): RecommendedCertification[] => {
  if (role.toLowerCase().includes('backend')) {
    return [
      {
        id: 'cert_1',
        name: 'placementOS Distributed Systems & Database Benchmark',
        provider: 'placementOS Technical Registry',
        relevance: 'Verifies database locking, ACID compliance, and concurrency design',
        status: 'in_progress',
      },
      {
        id: 'cert_2',
        name: 'AWS Certified Solutions Architect / Cloud Developer',
        provider: 'Amazon Web Services',
        relevance: 'Validates container orchestration, VPC networking, and cloud storage',
        status: 'recommended',
      },
    ];
  }

  return [
    {
      id: 'cert_1',
      name: 'placementOS Campus Algorithmic Benchmark (Level 3)',
      provider: 'placementOS Technical Registry',
      relevance: 'Validates DSA speed, memory efficiency, and test coverage',
      status: 'in_progress',
    },
    {
      id: 'cert_2',
      name: 'Full-Stack Architecture & API Design Standard',
      provider: 'placementOS Engineering Guild',
      relevance: 'Verifies clean code, modular architecture, and automated testing',
      status: 'recommended',
    },
  ];
};

const getSkillGaps = (plans: WeekPlan[]): string[] => {
  const gaps: string[] = [];
  for (const week of plans) {
    for (const topic of week.topics) {
      if (!topic.completed && gaps.length < 4) {
        gaps.push(topic.title);
      }
    }
  }
  return gaps.length > 0
    ? gaps
    : ['Dynamic Programming Optimization', 'Distributed Caching & Locks', 'Low-Level Design Patterns', 'STAR Behavioral Scenarios'];
};

interface AiCareerRoadmapGeneratorProps {
  initialCompany?: string;
  initialRole?: string;
}

// Company presets
const COMPANY_PRESETS = [
  { id: 'google', name: 'Google', icon: '🌐', focus: 'System Design, High-Scale Graphs & Advanced DSA' },
  { id: 'amazon', name: 'Amazon', icon: '📦', focus: 'Leadership Principles, LP STAR & Scalable Microservices' },
  { id: 'microsoft', name: 'Microsoft', icon: '💻', focus: 'Core DSA, Low-Level Object Oriented Design & C++' },
  { id: 'razorpay', name: 'Razorpay', icon: '💳', focus: 'Payment Idempotency, Database Locks & API Security' },
  { id: 'flipkart', name: 'Flipkart', icon: '🛒', focus: 'E-commerce Concurrency, Flash Sale Scale & Distributed Caching' },
  { id: 'swiggy', name: 'Swiggy', icon: '🛵', focus: 'Geospatial Indexing, Real-Time Dispatch & Node.js' },
  { id: 'uber', name: 'Uber', icon: '🚗', focus: 'High Throughput Distributed Systems & QuadTrees' },
  { id: 'goldman', name: 'Goldman Sachs', icon: '🏦', focus: 'Financial Algorithms, Dynamic Programming & Math' },
  { id: 'tcs', name: 'TCS Digital / Prime', icon: '🏢', focus: 'Core OOP, DBMS SQL Queries & Aptitude Coding' },
  { id: 'infosys', name: 'Infosys Power Programmer', icon: '🌐', focus: 'Competitive Coding & Framework Fundamentals' },
  { id: 'custom', name: 'Custom Company...', icon: '🎯', focus: 'Tailored Corporate Roadmap' }
];

// Position / Domain presets
const POSITION_PRESETS = [
  'Software Development Engineer I (SDE 1)',
  'Software Development Engineer II (SDE 2)',
  'Backend Engineer (Distributed Systems)',
  'Full-Stack Developer (React & Node.js)',
  'Frontend Specialist (UI / UX Architecture)',
  'Data & AI Platform Engineer',
  'DevOps & Cloud Infrastructure Engineer',
  'Custom Position Domain...'
];

export interface TopicItem {
  id: string;
  title: string;
  completed: boolean;
  resourceType?: string;
}

export interface WeekPlan {
  weekNum: number;
  phase: string;
  title: string;
  description: string;
  topics: TopicItem[];
  targetQuestions: number;
  solvedQuestions: number;
  easyTarget: number;
  mediumTarget: number;
  hardTarget: number;
}

// Generate company & domain specific roadmaps
const generateRoadmapData = (companyId: string, customCompName: string, position: string): WeekPlan[] => {
  const companyName = companyId === 'custom' ? (customCompName || 'Target Company') : (COMPANY_PRESETS.find(c => c.id === companyId)?.name || 'Target Company');

  if (position.includes('Backend') || companyId === 'razorpay' || companyId === 'swiggy') {
    return [
      {
        weekNum: 1,
        phase: 'Phase 1: Foundation & High-Performance Data Structures',
        title: 'Arrays, Strings & Hash Tables Mastery for ' + companyName,
        description: 'Focus on two-pointer patterns, sliding window, prefix sums, and fast O(1) hash map lookups required in ' + companyName + ' screening rounds.',
        topics: [
          { id: 'w1_t1', title: 'Sliding Window & Two Pointer Techniques (Fixed/Dynamic)', completed: false },
          { id: 'w1_t2', title: 'Prefix Sums, Difference Arrays & Subarray Optimization', completed: false },
          { id: 'w1_t3', title: 'Hash Map Internal Collision Resolution & Load Factor', completed: false },
          { id: 'w1_t4', title: 'String Manipulation & KMP Pattern Matching Algorithm', completed: false }
        ],
        targetQuestions: 18,
        solvedQuestions: 0,
        easyTarget: 5,
        mediumTarget: 10,
        hardTarget: 3
      },
      {
        weekNum: 2,
        phase: 'Phase 1: Foundation & High-Performance Data Structures',
        title: 'Trees, Heaps & Priority Queues',
        description: 'Master Binary Search Trees, Segment Trees, and Heap Priority Queues for real-time order scheduling.',
        topics: [
          { id: 'w2_t1', title: 'Binary Tree Traversal (DFS/BFS) & Ancestor Queries', completed: false },
          { id: 'w2_t2', title: 'BST Operations & Balancing (AVL / Red-Black Concepts)', completed: false },
          { id: 'w2_t3', title: 'Min/Max Heap Construction & Top-K Frequent Elements', completed: false },
          { id: 'w2_t4', title: 'Running Median in Data Streams using Dual Heaps', completed: false }
        ],
        targetQuestions: 20,
        solvedQuestions: 0,
        easyTarget: 4,
        mediumTarget: 12,
        hardTarget: 4
      },
      {
        weekNum: 3,
        phase: 'Phase 2: Advanced Algorithms & Problem Solving',
        title: 'Graph Traversal, Shortest Paths & Topological Sorting',
        description: 'In-depth graph modeling for routing networks, dependency trees, and cycle detection.',
        topics: [
          { id: 'w3_t1', title: 'BFS / DFS on Grids and Adjacency Lists', completed: false },
          { id: 'w3_t2', title: 'Dijkstra & Bellman-Ford Shortest Path Algorithms', completed: false },
          { id: 'w3_t3', title: 'Topological Sorting & Kahn\'s Algorithm for Task Dependencies', completed: false },
          { id: 'w3_t4', title: 'Disjoint Set Union (DSU) & Kruskal\'s Minimum Spanning Tree', completed: false }
        ],
        targetQuestions: 22,
        solvedQuestions: 0,
        easyTarget: 4,
        mediumTarget: 14,
        hardTarget: 4
      },
      {
        weekNum: 4,
        phase: 'Phase 2: Advanced Algorithms & Problem Solving',
        title: 'Dynamic Programming & Memoization Patterns',
        description: 'Crucial for ' + companyName + ' technical rounds: 1D/2D DP, Knapsack, and String Edit Distances.',
        topics: [
          { id: 'w4_t1', title: '1D DP: Climbing Stairs, House Robber, Coin Change', completed: false },
          { id: 'w4_t2', title: '2D DP: Grid Unique Paths, Minimum Path Sum', completed: false },
          { id: 'w4_t3', title: 'Subsequence & String DP: LCS, LIS, Edit Distance', completed: false },
          { id: 'w4_t4', title: 'Partition DP & Matrix Chain Multiplication Concepts', completed: false }
        ],
        targetQuestions: 25,
        solvedQuestions: 0,
        easyTarget: 3,
        mediumTarget: 16,
        hardTarget: 6
      },
      {
        weekNum: 5,
        phase: 'Phase 3: System Design & Low-Level Architecture',
        title: 'Low-Level Design (LLD) & Object Oriented Architecture',
        description: 'Design extensible software components using SOLID principles and GoF Design Patterns.',
        topics: [
          { id: 'w5_t1', title: 'SOLID Principles & Clean Architecture Fundamentals', completed: false },
          { id: 'w5_t2', title: 'Factory, Singleton, Strategy & Observer Design Patterns', completed: false },
          { id: 'w5_t3', title: 'LLD Case Study: Design a Rate Limiter & Token Bucket', completed: false },
          { id: 'w5_t4', title: 'LLD Case Study: Design a Payment Gateway / Parking Lot', completed: false }
        ],
        targetQuestions: 10,
        solvedQuestions: 0,
        easyTarget: 2,
        mediumTarget: 6,
        hardTarget: 2
      },
      {
        weekNum: 6,
        phase: 'Phase 3: System Design & Low-Level Architecture',
        title: 'High-Level Design (HLD) & Scalable Backend Microservices',
        description: 'Architecting distributed systems for high availability, fault tolerance, and low latency at ' + companyName + '.',
        topics: [
          { id: 'w6_t1', title: 'Database Sharding, Replication & CAP Theorem', completed: false },
          { id: 'w6_t2', title: 'Distributed Caching (Redis) & Cache Invalidation Strategies', completed: false },
          { id: 'w6_t3', title: 'Asynchronous Event Queues (Kafka / RabbitMQ) & Idempotency', completed: false },
          { id: 'w6_t4', title: 'HLD Case Study: Design ' + companyName + ' Core Backend System', completed: false }
        ],
        targetQuestions: 8,
        solvedQuestions: 0,
        easyTarget: 1,
        mediumTarget: 5,
        hardTarget: 2
      },
      {
        weekNum: 7,
        phase: 'Phase 4: Company Drills & Mock Interviews',
        title: 'High-Frequency ' + companyName + ' Question Bank & Time Drills',
        description: 'Rigorous timed practice of past ' + companyName + ' interview questions.',
        topics: [
          { id: 'w7_t1', title: 'Solve Top 20 Most Frequently Asked ' + companyName + ' DSA Problems', completed: false },
          { id: 'w7_t2', title: 'Timed Live Coding Drills (45 mins per problem)', completed: false },
          { id: 'w7_t3', title: 'Corner Case Testing & Space/Time Optimization Verbalization', completed: false }
        ],
        targetQuestions: 20,
        solvedQuestions: 0,
        easyTarget: 4,
        mediumTarget: 12,
        hardTarget: 4
      },
      {
        weekNum: 8,
        phase: 'Phase 4: Company Drills & Mock Interviews',
        title: 'Behavioral, STAR Method & Final Round Readiness',
        description: 'Polishing behavioral responses, technical leadership, and bar-raiser question prep.',
        topics: [
          { id: 'w8_t1', title: 'Prepare 5 Detailed STAR Method Scenarios (Impact, Conflict, Failure)', completed: false },
          { id: 'w8_t2', title: 'Complete 2 AI Voice Mock Interview Drills with Camera Vision', completed: false },
          { id: 'w8_t3', title: 'Final Resume & Project Deep-Dive Verification', completed: false }
        ],
        targetQuestions: 5,
        solvedQuestions: 0,
        easyTarget: 2,
        mediumTarget: 3,
        hardTarget: 0
      }
    ];
  } else {
    // Default / General SDE & Full-Stack Sprint
    return [
      {
        weekNum: 1,
        phase: 'Phase 1: Foundations & Algorithm Mastery',
        title: 'Data Structures, Memory & Basic Problem Solving',
        description: 'Solidifying core DSA concepts for ' + companyName + ' screening assessments.',
        topics: [
          { id: 'w1_gen1', title: 'Time & Space Complexity Big-O Analysis', completed: false },
          { id: 'w1_gen2', title: 'Arrays, Two-Pointers & Sliding Window Technique', completed: false },
          { id: 'w1_gen3', title: 'Linked Lists & Fast/Slow Pointer Pattern', completed: false },
          { id: 'w1_gen4', title: 'Stacks, Queues & Monotonic Stack Applications', completed: false }
        ],
        targetQuestions: 16,
        solvedQuestions: 0,
        easyTarget: 6,
        mediumTarget: 8,
        hardTarget: 2
      },
      {
        weekNum: 2,
        phase: 'Phase 1: Foundations & Algorithm Mastery',
        title: 'Trees, Recursion & Backtracking',
        description: 'Binary Tree traversals, recursion tree visualization, and state space exploration.',
        topics: [
          { id: 'w2_gen1', title: 'Binary Tree In-order, Pre-order, Post-order & Level Order', completed: false },
          { id: 'w2_gen2', title: 'Binary Search Tree Validation & Range Queries', completed: false },
          { id: 'w2_gen3', title: 'Backtracking: Subsets, Permutations & Combination Sum', completed: false },
          { id: 'w2_gen4', title: 'N-Queens & Sudoku Solver Algorithmic Pruning', completed: false }
        ],
        targetQuestions: 18,
        solvedQuestions: 0,
        easyTarget: 4,
        mediumTarget: 11,
        hardTarget: 3
      },
      {
        weekNum: 3,
        phase: 'Phase 2: Intermediate Data Structures & Web Tech',
        title: 'Graphs & Full-Stack API Concepts',
        description: 'Graph connectivity algorithms and modern API integration paradigms.',
        topics: [
          { id: 'w3_gen1', title: 'Graph BFS/DFS & Connected Components', completed: false },
          { id: 'w3_gen2', title: 'Cycle Detection in Directed and Undirected Graphs', completed: false },
          { id: 'w3_gen3', title: 'RESTful API Design Standards & HTTP Status Codes', completed: false },
          { id: 'w3_gen4', title: 'Authentication (JWT, OAuth 2.0) & Middleware Security', completed: false }
        ],
        targetQuestions: 20,
        solvedQuestions: 0,
        easyTarget: 5,
        mediumTarget: 12,
        hardTarget: 3
      },
      {
        weekNum: 4,
        phase: 'Phase 2: Intermediate Data Structures & Web Tech',
        title: 'Dynamic Programming & Database Query Optimization',
        description: 'Mastering memoization tables and high-efficiency relational database indexes.',
        topics: [
          { id: 'w4_gen1', title: '1D & 2D Dynamic Programming Core Patterns', completed: false },
          { id: 'w4_gen2', title: 'Knapsack 0/1 & Unbounded Knapsack Variants', completed: false },
          { id: 'w4_gen3', title: 'SQL Joins, Group By, Window Functions & CTEs', completed: false },
          { id: 'w4_gen4', title: 'PostgreSQL/MySQL Index Types (B-Tree, Hash, GIN)', completed: false }
        ],
        targetQuestions: 22,
        solvedQuestions: 0,
        easyTarget: 4,
        mediumTarget: 14,
        hardTarget: 4
      },
      {
        weekNum: 5,
        phase: 'Phase 3: System Design & Project Polish',
        title: 'Frontend/Backend System Architecture for ' + companyName,
        description: 'Building robust, maintainable full-stack software components.',
        topics: [
          { id: 'w5_gen1', title: 'Client-Side State Management & Re-render Optimization', completed: false },
          { id: 'w5_gen2', title: 'Microservices Architecture vs Monolith Trade-offs', completed: false },
          { id: 'w5_gen3', title: 'Asynchronous Job Workers & Distributed Messaging', completed: false }
        ],
        targetQuestions: 12,
        solvedQuestions: 0,
        easyTarget: 3,
        mediumTarget: 7,
        hardTarget: 2
      },
      {
        weekNum: 6,
        phase: 'Phase 3: System Design & Project Polish',
        title: 'Mock Interview Sprint & Behavioral Drills',
        description: 'Final prep for ' + companyName + ' technical and culture fit rounds.',
        topics: [
          { id: 'w6_gen1', title: 'Solve Top 15 ' + companyName + ' Curated Coding Problems', completed: false },
          { id: 'w6_gen2', title: 'STAR Method Behavioral Story Preparation', completed: false },
          { id: 'w6_gen3', title: 'Complete Full AI Mock Test Simulation with Feedback', completed: false }
        ],
        targetQuestions: 15,
        solvedQuestions: 0,
        easyTarget: 3,
        mediumTarget: 9,
        hardTarget: 3
      }
    ];
  }
};

export const AiCareerRoadmapGenerator: React.FC<AiCareerRoadmapGeneratorProps> = ({
  initialCompany = 'google',
  initialRole = 'Software Development Engineer I (SDE 1)'
}) => {
  const authContext = useAuth();
  const token = authContext?.token;
  const user = authContext?.user;

  // Target Configuration States
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompany);
  const [customCompany, setCustomCompany] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(initialRole);
  const [customPosition, setCustomPosition] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [customFocus, setCustomFocus] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Roadmap Data
  const [roadmapPlans, setRoadmapPlans] = useState<WeekPlan[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Expanded Week Accordion view
  const [expandedWeekNums, setExpandedWeekNums] = useState<number[]>([1, 2]);

  // Is Generating Animation
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Company / Role Display
  const companyObj = COMPANY_PRESETS.find(c => c.id === selectedCompanyId) || COMPANY_PRESETS[0];
  const companyDisplayName = selectedCompanyId === 'custom' ? (customCompany || 'Custom Target Company') : companyObj.name;
  const positionDisplayName = selectedPosition === 'Custom Position Domain...' ? (customPosition || 'Software Engineer') : selectedPosition;

  // Fetch latest roadmap from backend on mount
  useEffect(() => {
    const fetchLatestRoadmap = async () => {
      try {
        setIsLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/roadmap/latest', { headers });
        const data = await res.json();

        if (data && data.roadmap) {
          const rm = data.roadmap;
          if (Array.isArray(rm.phases) && rm.phases.length > 0) {
            setRoadmapPlans(rm.phases);
          } else {
            setRoadmapPlans([]);
          }
          if (rm._id) {
            setActiveRoadmapId(rm._id);
          }
          if (rm.company) {
            const foundPreset = COMPANY_PRESETS.find(c => c.name.toLowerCase() === rm.company.toLowerCase());
            if (foundPreset) {
              setSelectedCompanyId(foundPreset.id);
            } else {
              setSelectedCompanyId('custom');
              setCustomCompany(rm.company);
            }
          }
          if (rm.targetRole) {
            if (POSITION_PRESETS.includes(rm.targetRole)) {
              setSelectedPosition(rm.targetRole);
            } else {
              setSelectedPosition('Custom Position Domain...');
              setCustomPosition(rm.targetRole);
            }
          }
          setIsPreviewMode(false);
        } else {
          setRoadmapPlans([]);
          setActiveRoadmapId(null);
          setIsPreviewMode(false);
        }
      } catch (err) {
        console.warn('Error fetching latest roadmap:', err);
        setRoadmapPlans([]);
        setActiveRoadmapId(null);
        setIsPreviewMode(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestRoadmap();
  }, [token]);

  // Preview Sample Roadmap before saving
  const handlePreviewRoadmap = () => {
    const previewData = generateRoadmapData(selectedCompanyId, customCompany, selectedPosition);
    setRoadmapPlans(previewData);
    setIsPreviewMode(true);
    setExpandedWeekNums([1, 2]);
  };

  // Persist progress changes to backend
  const persistProgress = async (updatedPlans: WeekPlan[]) => {
    if (!activeRoadmapId || isPreviewMode) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/roadmap/${activeRoadmapId}/progress`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ phases: updatedPlans }),
      });
    } catch (err) {
      console.warn('Failed to persist roadmap progress:', err);
    }
  };

  // Generate New Personalised Roadmap
  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    setIsPreviewMode(false);
    setGenerationError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const focusString = selectedCompanyId === 'custom'
        ? (customCompany ? `Tailored roadmap for ${customCompany}` : 'Tailored Corporate Roadmap')
        : (customFocus || companyObj?.focus || '');

      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetRole: positionDisplayName,
          company: companyDisplayName,
          degree: user?.degree || 'B.Tech CS',
          currentSkills: currentSkills || '',
          focus: focusString,
        }),
      });

      const data = await res.json();
      if (data && data.roadmap) {
        const rm = data.roadmap;
        if (Array.isArray(rm.phases) && rm.phases.length > 0) {
          setRoadmapPlans(rm.phases);
        }
        if (rm._id) {
          setActiveRoadmapId(rm._id);
        }
        setExpandedWeekNums([1, 2]);
      } else {
        const newPlans = generateRoadmapData(selectedCompanyId, customCompany, selectedPosition);
        setRoadmapPlans(newPlans);
        setExpandedWeekNums([1, 2]);
      }
    } catch (err) {
      console.error('Failed to generate roadmap via API:', err);
      const newPlans = generateRoadmapData(selectedCompanyId, customCompany, selectedPosition);
      setRoadmapPlans(newPlans);
      setExpandedWeekNums([1, 2]);
      setGenerationError('AI synthesis was unable to reach the live generation endpoint. A verified curriculum for your target role has been loaded.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Topic Completion
  const toggleTopicCompletion = (weekNum: number, topicId: string) => {
    setRoadmapPlans(prevPlans => {
      const updated = prevPlans.map(week => {
        if (week.weekNum === weekNum) {
          const updatedTopics = week.topics.map(t =>
            t.id === topicId ? { ...t, completed: !t.completed } : t
          );
          return { ...week, topics: updatedTopics };
        }
        return week;
      });
      persistProgress(updated);
      return updated;
    });
  };

  // Update Solved Questions Count for a Week
  const handleUpdateQuestionsSolved = (weekNum: number, delta: number) => {
    setRoadmapPlans(prevPlans => {
      const updated = prevPlans.map(week => {
        if (week.weekNum === weekNum) {
          const newCount = Math.max(0, Math.min(week.targetQuestions * 2, week.solvedQuestions + delta));
          return { ...week, solvedQuestions: newCount };
        }
        return week;
      });
      persistProgress(updated);
      return updated;
    });
  };

  // Set Exact Solved Questions Count
  const handleSetQuestionsSolved = (weekNum: number, value: number) => {
    setRoadmapPlans(prevPlans => {
      const updated = prevPlans.map(week => {
        if (week.weekNum === weekNum) {
          return { ...week, solvedQuestions: Math.max(0, value) };
        }
        return week;
      });
      persistProgress(updated);
      return updated;
    });
  };

  // Toggle Week Accordion Collapse
  const toggleWeekAccordion = (weekNum: number) => {
    setExpandedWeekNums(prev =>
      prev.includes(weekNum) ? prev.filter(w => w !== weekNum) : [...prev, weekNum]
    );
  };

  // Overall Roadmap Analytics Calculations
  const totalTopicsCount = roadmapPlans.reduce((acc, week) => acc + week.topics.length, 0);
  const completedTopicsCount = roadmapPlans.reduce(
    (acc, week) => acc + week.topics.filter(t => t.completed).length,
    0
  );

  const totalTargetQuestions = roadmapPlans.reduce((acc, week) => acc + week.targetQuestions, 0);
  const totalSolvedQuestions = roadmapPlans.reduce((acc, week) => acc + week.solvedQuestions, 0);

  // Overall Completion Weight (50% Topics Learned + 50% Questions Solved)
  const topicProgressPct = totalTopicsCount > 0 ? (completedTopicsCount / totalTopicsCount) * 100 : 0;
  const questionsProgressPct = totalTargetQuestions > 0 ? Math.min(100, (totalSolvedQuestions / totalTargetQuestions) * 100) : 0;
  const overallRoadmapProgressPct = Math.round((topicProgressPct * 0.5) + (questionsProgressPct * 0.5));

  // Count Completed Weeks
  const completedWeeksCount = roadmapPlans.filter(week => {
    const allTopicsDone = week.topics.every(t => t.completed);
    const questionsDone = week.solvedQuestions >= week.targetQuestions;
    return allTopicsDone && questionsDone;
  }).length;

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Header & Guided Setup Form */}
      <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <SectionHeading
                title="AI career roadmap"
                subtitle="Week-by-week preparation curriculum and skill bridge tailored to your target company."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="positive" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-[#14131F]" />}>
              Adaptive curriculum engine
            </Badge>
          </div>
        </div>

        {/* GUIDED SETUP FORM: GROUPED INPUTS */}
        <div className="space-y-5 pt-1 font-sans">
          {/* GROUP 1: TARGET COMPANY & ROLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#14131F] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#4338CA]" />
                <span>1. Target company & position domain</span>
              </span>
              <span className="text-[11px] text-[#14131F]/50">Choose a hiring preset or customize</span>
            </div>

            {/* Company Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {COMPANY_PRESETS.map((c) => {
                const isSelected = selectedCompanyId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCompanyId(c.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-white border-[#4338CA] shadow-xs ring-2 ring-[#4338CA]/20'
                        : 'bg-[#FAFAF8] border-[#14131F]/8 hover:border-[#14131F]/20 text-[#14131F]/70 hover:text-[#14131F]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{c.icon}</span>
                      {isSelected && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA]">
                          Selected
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#14131F] font-display">{c.name}</h4>
                      <p className="text-[11px] text-[#14131F]/60 line-clamp-1 mt-0.5 font-sans">{c.focus}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Company Name Input if selected */}
            {selectedCompanyId === 'custom' && (
              <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5 text-xs font-sans">
                <label className="font-semibold text-[#14131F]">Specify Custom Company Name:</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI, Palantir, Databricks, Stripe..."
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 placeholder:text-[#14131F]/40 transition-all"
                />
              </div>
            )}

            {/* Position Domain Selector */}
            <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2.5 font-sans">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <label className="font-semibold text-[#14131F] flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#4338CA]" />
                  <span>Target Position Domain:</span>
                </label>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full sm:w-80 bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2 text-[#14131F] text-xs outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 transition-all"
                  >
                    {POSITION_PRESETS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPosition === 'Custom Position Domain...' && (
                <input
                  type="text"
                  placeholder="e.g., AI Systems Engineer, Site Reliability Specialist..."
                  value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                  className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 placeholder:text-[#14131F]/40 transition-all"
                />
              )}
            </div>
          </div>

          {/* GROUP 2: CURRENT SKILLS & SPECIALIZATION FOCUS */}
          <div className="space-y-3 pt-1 border-t border-[#14131F]/8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#14131F] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4338CA]" />
                <span>2. Current baseline skills & specialization focus</span>
              </span>
              <span className="text-[11px] text-[#14131F]/50">Tailors difficulty & gap analysis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
              {/* Current Skills Input */}
              <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                <label className="font-semibold text-[#14131F] block">Your Current Core Skills:</label>
                <input
                  type="text"
                  placeholder="e.g. Java, Python, C++, Data Structures, SQL, React..."
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 placeholder:text-[#14131F]/40 transition-all"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[#14131F]/50">Quick add:</span>
                  {['Java', 'Python', 'C++', 'SQL', 'DSA'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!currentSkills.includes(tag)) {
                          setCurrentSkills(prev => prev ? `${prev}, ${tag}` : tag);
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#14131F]/10 text-[#14131F]/70 hover:text-[#14131F] hover:border-[#14131F]/25 cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialization / Focus Area Input */}
              <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                <label className="font-semibold text-[#14131F] block">Preparation Focus / Specific Interests:</label>
                <input
                  type="text"
                  placeholder={companyObj?.focus || 'e.g. Distributed Caching, High Concurrency, Graph Algorithms...'}
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 placeholder:text-[#14131F]/40 transition-all"
                />
                <p className="text-[11px] text-[#14131F]/50 pt-0.5">
                  Preset focus: <span className="text-[#14131F]/70 font-medium">{companyObj.focus}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#14131F]/8 font-sans">
            <div className="text-xs text-[#14131F]/60">
              Active Sprint Goal: <strong className="text-[#14131F] font-semibold">{companyDisplayName}</strong> • <strong className="text-[#14131F] font-semibold">{positionDisplayName}</strong>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreviewRoadmap}
                disabled={isGenerating}
                icon={<Eye className="w-4 h-4 text-[#14131F]/60" />}
                className="w-full sm:w-auto"
              >
                Preview sample curriculum
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateRoadmap}
                disabled={isGenerating}
                icon={<Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />}
                className="w-full sm:w-auto"
              >
                {isGenerating ? 'Synthesizing curriculum...' : 'Generate personalised AI roadmap'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE (Coral accent for genuine alert) */}
      {generationError && (
        <div className="p-4 bg-white rounded-xl border border-[#FB7185]/30 text-[#14131F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
            <span>{generationError}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
            >
              Retry generation
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGenerationError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* GENERATING / LOADING STATE */}
      {isGenerating ? (
        <div className="p-8 sm:p-12 bg-white rounded-2xl border border-[#14131F]/8 text-center space-y-4 font-sans shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-display font-bold text-[#14131F]">
              Synthesizing tailored curriculum...
            </h3>
            <p className="text-xs text-[#14131F]/60 font-sans">
              Benchmarking {companyDisplayName}&apos;s technical interview bar for {positionDisplayName} against your baseline skills.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Badge variant="neutral" size="sm">Evaluating DSA patterns</Badge>
            <Badge variant="neutral" size="sm">Structuring weekly projects</Badge>
            <Badge variant="neutral" size="sm">Mapping interview questions</Badge>
          </div>
        </div>
      ) : isLoading ? (
        <div className="p-8 sm:p-12 bg-white rounded-2xl border border-[#14131F]/8 text-center space-y-3 font-sans shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4338CA]" />
          <p className="text-xs font-medium text-[#14131F]/60">Checking for existing career roadmap...</p>
        </div>
      ) : roadmapPlans.length === 0 ? (
        /* EMPTY STATE: Inviting card with a single clear call-to-action */
        <div className="p-8 sm:p-12 bg-white rounded-2xl border border-[#14131F]/8 text-center space-y-4 font-sans shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-lg mx-auto">
            <h3 className="text-base font-display font-bold text-[#14131F]">No career roadmap generated yet</h3>
            <p className="text-xs text-[#14131F]/60 font-sans">
              Select your target company and role in the panel above to generate your customized interview preparation sequence.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreviewRoadmap}
              icon={<Eye className="w-4 h-4 text-[#14131F]/60" />}
            >
              Preview sample curriculum
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Generate personalised AI roadmap
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* SAMPLE PREVIEW BANNER */}
          {isPreviewMode && (
            <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#4338CA]/20 text-[#14131F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-[#4338CA] shrink-0" />
                <span>
                  <strong>Sample preview:</strong> Curriculum outline for {companyDisplayName} ({positionDisplayName}). Click Generate to personalize and save your progress.
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateRoadmap}
                disabled={isGenerating}
                className="shrink-0"
              >
                Save & generate roadmap
              </Button>
            </div>
          )}

          {/* OVERALL ROADMAP PROGRESS DASHBOARD ENGINE */}
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-[#14131F]/8 space-y-6 font-sans shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
              <div>
                <span className="text-xs text-[#14131F]/50 font-sans">Progress overview</span>
                <h3 className="text-lg font-display font-bold text-[#14131F] flex items-center gap-2 mt-0.5">
                  <span>{companyDisplayName} Prep Dashboard</span>
                  <span className="text-xs font-normal text-[#14131F]/60">({positionDisplayName})</span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-3xl font-display font-bold text-[#14131F]">{overallRoadmapProgressPct}%</span>
                  <span className="text-xs text-[#14131F]/50 block font-sans">Overall completed</span>
                </div>
              </div>
            </div>

            {/* Dynamic Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              {/* Overall Completion Meter */}
              <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#14131F] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#4338CA]" /> Overall Sprint
                  </span>
                  <span className="font-semibold text-[#14131F]">{overallRoadmapProgressPct}%</span>
                </div>
                <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#4338CA] h-full rounded-full transition-all duration-500" style={{ width: `${overallRoadmapProgressPct}%` }} />
                </div>
                <p className="text-xs text-[#14131F]/60">{completedWeeksCount} of {roadmapPlans.length} Weeks Completed</p>
              </div>

              {/* Topics Learned Progress */}
              <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#14131F] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" /> Topics Learned
                  </span>
                  <span className="font-semibold text-[#14131F]">{completedTopicsCount} / {totalTopicsCount}</span>
                </div>
                <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#A3E635] h-full rounded-full transition-all duration-500" style={{ width: `${topicProgressPct}%` }} />
                </div>
                <p className="text-xs text-[#14131F]/60">{Math.round(topicProgressPct)}% concepts mastered</p>
              </div>

              {/* Questions Solved Progress */}
              <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#14131F] flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#4338CA]" /> Questions Solved
                  </span>
                  <span className="font-semibold text-[#14131F]">{totalSolvedQuestions} / {totalTargetQuestions}</span>
                </div>
                <div className="w-full bg-[#14131F]/8 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#4338CA] h-full rounded-full transition-all duration-500" style={{ width: `${questionsProgressPct}%` }} />
                </div>
                <p className="text-xs text-[#14131F]/60">{Math.round(questionsProgressPct)}% target reached</p>
              </div>
            </div>
          </div>

          {/* ROADMAP OUTPUT: CONNECTED VISUAL SEQUENCE / TIMELINE */}
          {/* A connected path the student can follow top to bottom */}
          <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-display font-bold text-[#14131F] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#4338CA]" />
                  <span>Placement Preparation Path</span>
                </h3>
                <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                  Connected roadmap from your baseline skills to {companyDisplayName} placement readiness.
                </p>
              </div>

              <Badge variant="positive" size="sm">
                Target: {companyDisplayName}
              </Badge>
            </div>

            {/* TIMELINE CONTAINER WITH CONNECTING SPINE */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-[#4338CA]/25 space-y-8 ml-3 sm:ml-4">
              {/* STAGE 1: CURRENT SKILLS BASELINE */}
              <div className="relative">
                {/* Node indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#A3E635] text-[#14131F] flex items-center justify-center font-bold text-[11px] shadow-xs ring-4 ring-[#FAFAF8]">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#14131F]/8 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#14131F]/50 block">Stage 1 • Baseline</span>
                      <h4 className="text-sm font-display font-bold text-[#14131F]">Current Skill Baseline</h4>
                      <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                        Verified competencies and technical fundamentals registered on your student profile.
                      </p>
                    </div>

                    <Badge variant="positive" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-[#14131F]" />}>
                      Acquired skills
                    </Badge>
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(currentSkills ? currentSkills.split(',').map(s => s.trim()).filter(Boolean) : [
                      'Data Structures Fundamentals',
                      'Object-Oriented Programming (OOP)',
                      'Relational Database & SQL',
                      'Core Java / Python',
                      'Git Version Control'
                    ]).map((skill, sIdx) => (
                      <Badge key={sIdx} variant="positive" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* STAGE 2: IDENTIFIED SKILL GAPS (Warm coral accent for genuine blockers) */}
              <div className="relative">
                {/* Node indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#FB7185] text-white flex items-center justify-center font-bold text-[11px] shadow-xs ring-4 ring-[#FAFAF8]">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>

                <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#FB7185]/25 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FB7185] block">Stage 2 • Diagnostic</span>
                      <h4 className="text-sm font-display font-bold text-[#14131F]">
                        Identified Skill Gaps for {companyDisplayName}
                      </h4>
                      <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                        High-priority technical requirements demanded by {companyDisplayName} interviews that require focused preparation.
                      </p>
                    </div>

                    <Badge variant="warning" size="sm">
                      {getSkillGaps(roadmapPlans).length} gaps to bridge
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {getSkillGaps(roadmapPlans).map((gap, gIdx) => (
                      <Badge key={gIdx} variant="warning" size="sm">
                        {gap}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#14131F]/50 font-sans">
                    These topics are mapped into the weekly milestones below to reach the benchmark cutoff.
                  </p>
                </div>
              </div>

              {/* STAGE 3: SKILLS TO LEARN (Week-by-Week Curriculum Timeline) */}
              <div className="relative">
                {/* Node indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#4338CA] text-white flex items-center justify-center font-bold text-[11px] shadow-xs ring-4 ring-[#FAFAF8]">
                  <Calendar className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-4">
                  <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#14131F]/8 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-4">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4338CA] block">Stage 3 • Curriculum</span>
                        <h4 className="text-sm font-display font-bold text-[#14131F]">Skills to Learn & Practice Milestones</h4>
                        <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                          Follow the structured weekly milestones to bridge identified gaps and build target problem speed.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedWeekNums(roadmapPlans.map(w => w.weekNum))}
                          className="text-[#14131F]/60 hover:text-[#14131F] cursor-pointer font-sans"
                        >
                          Expand all
                        </button>
                        <span className="text-[#14131F]/20">•</span>
                        <button
                          type="button"
                          onClick={() => setExpandedWeekNums([])}
                          className="text-[#14131F]/60 hover:text-[#14131F] cursor-pointer font-sans"
                        >
                          Collapse all
                        </button>
                      </div>
                    </div>

                    {/* WEEKLY CURRICULUM ITEMS */}
                    <div className="space-y-3 pt-4">
                      {roadmapPlans.map((week) => {
                        const isExpanded = expandedWeekNums.includes(week.weekNum);
                        const weekTopicsDone = week.topics.filter(t => t.completed).length;
                        const weekTopicsTotal = week.topics.length;
                        const isWeekTopicsComplete = weekTopicsDone === weekTopicsTotal;
                        const isWeekQuestionsComplete = week.solvedQuestions >= week.targetQuestions;
                        const isWeekFullyCompleted = isWeekTopicsComplete && isWeekQuestionsComplete;

                        const weekTopicsPct = weekTopicsTotal > 0 ? (weekTopicsDone / weekTopicsTotal) * 100 : 0;
                        const weekQuestionsPct = week.targetQuestions > 0 ? Math.min(100, (week.solvedQuestions / week.targetQuestions) * 100) : 0;
                        const weekOverallPct = Math.round((weekTopicsPct * 0.5) + (weekQuestionsPct * 0.5));

                        return (
                          <div
                            key={week.weekNum}
                            className={`rounded-2xl border transition-all ${
                              isWeekFullyCompleted
                                ? 'bg-white border-[#A3E635]/40 shadow-xs'
                                : 'bg-white border-[#14131F]/8 hover:border-[#14131F]/20 shadow-xs'
                            }`}
                          >
                            {/* Week Header Row */}
                            <div
                              onClick={() => toggleWeekAccordion(week.weekNum)}
                              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                            >
                              <div className="flex items-start md:items-center gap-3.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isWeekFullyCompleted
                                    ? 'bg-[#A3E635] text-[#14131F]'
                                    : 'bg-[#FAFAF8] border border-[#14131F]/15 text-[#14131F]'
                                }`}>
                                  {isWeekFullyCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : `W${week.weekNum}`}
                                </div>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#14131F]/5 text-[#14131F] font-medium">
                                      {week.phase}
                                    </span>
                                    {isWeekFullyCompleted && (
                                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40">
                                        <CheckCircle2 className="w-3 h-3 text-[#14131F]" /> Week completed
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-display font-bold text-[#14131F] mt-1">{week.title}</h4>
                                  <p className="text-xs text-[#14131F]/60 line-clamp-1 mt-0.5 font-sans">{week.description}</p>
                                </div>
                              </div>

                              {/* Right Header Status: Solved + Topics Progress */}
                              <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-[#14131F]/8 pt-3 md:pt-0">
                                <div className="text-right text-xs">
                                  <div className="text-[#14131F]/70 font-medium">
                                    Topics: <span className="text-[#14131F] font-semibold">{weekTopicsDone}/{weekTopicsTotal}</span> • Qs: <span className="text-[#14131F] font-semibold">{week.solvedQuestions}/{week.targetQuestions}</span>
                                  </div>
                                  <div className="w-28 bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden mt-1.5 ml-auto">
                                    <div
                                      className={`h-full rounded-full transition-all ${isWeekFullyCompleted ? 'bg-[#A3E635]' : 'bg-[#4338CA]'}`}
                                      style={{ width: `${weekOverallPct}%` }}
                                    />
                                  </div>
                                </div>

                                <span className="p-1 text-[#14131F]/40 hover:text-[#14131F] transition-colors">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </span>
                              </div>
                            </div>

                            {/* Expanded Week Curriculum Content */}
                            {isExpanded && (
                              <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#14131F]/8 space-y-4 text-xs font-sans">
                                {/* SECTION A: TOPICS TO BE LEARNED */}
                                <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                                  <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-2">
                                    <span className="font-semibold text-[#14131F] text-xs flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />
                                      <span>1. Topics & Core Concepts ({weekTopicsDone}/{weekTopicsTotal})</span>
                                    </span>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const allDone = week.topics.every(t => t.completed);
                                        setRoadmapPlans(prev => prev.map(w => w.weekNum === week.weekNum ? {
                                          ...w,
                                          topics: w.topics.map(t => ({ ...t, completed: !allDone }))
                                        } : w));
                                      }}
                                      className="text-xs text-[#4338CA] hover:underline cursor-pointer font-medium"
                                    >
                                      {week.topics.every(t => t.completed) ? 'Uncheck all' : 'Mark all learned'}
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {week.topics.map((topic) => (
                                      <div
                                        key={topic.id}
                                        onClick={() => toggleTopicCompletion(week.weekNum, topic.id)}
                                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                                          topic.completed
                                            ? 'bg-white border-[#A3E635]/40 text-[#14131F]'
                                            : 'bg-white border-[#14131F]/8 text-[#14131F] hover:border-[#14131F]/20'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <span className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                                            topic.completed ? 'bg-[#A3E635] border-[#A3E635] text-[#14131F]' : 'border-[#14131F]/20 bg-white'
                                          }`}>
                                            {topic.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                          </span>
                                          <span className={topic.completed ? 'line-through text-[#14131F]/40' : 'font-medium text-[#14131F]'}>
                                            {topic.title}
                                          </span>
                                        </div>

                                        <Badge variant={topic.completed ? 'positive' : 'muted'} size="sm">
                                          {topic.completed ? 'Learned' : 'To Learn'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* SECTION B: QUESTIONS TARGET */}
                                <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-2">
                                    <span className="font-semibold text-[#14131F] text-xs flex items-center gap-1.5">
                                      <Code2 className="w-3.5 h-3.5 text-[#4338CA]" />
                                      <span>2. Practice target: questions to solve</span>
                                    </span>

                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Badge variant="positive" size="sm">Easy: {week.easyTarget}</Badge>
                                      <Badge variant="neutral" size="sm">Med: {week.mediumTarget}</Badge>
                                      <Badge variant="warning" size="sm">Hard: {week.hardTarget}</Badge>
                                    </div>
                                  </div>

                                  {/* Interactive Solved Counter Control */}
                                  <div className="p-4 bg-white rounded-xl border border-[#14131F]/8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="space-y-0.5 text-center sm:text-left font-sans">
                                      <span className="text-xs text-[#14131F]/60 font-medium">Questions solved:</span>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-display font-bold text-[#14131F]">{week.solvedQuestions}</span>
                                        <span className="text-xs text-[#14131F]/50">/ {week.targetQuestions} Target questions</span>
                                        {isWeekQuestionsComplete && (
                                          <Badge variant="positive" size="sm">
                                            Target reached
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Interactive Increment / Decrement Buttons */}
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuestionsSolved(week.weekNum, -1)}
                                        className="w-8 h-8 rounded-lg bg-[#FAFAF8] border border-[#14131F]/15 hover:bg-[#14131F]/5 text-[#14131F] font-bold flex items-center justify-center cursor-pointer transition-colors"
                                        title="Decrease"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>

                                      <input
                                        type="number"
                                        value={week.solvedQuestions}
                                        onChange={(e) => handleSetQuestionsSolved(week.weekNum, parseInt(e.target.value) || 0)}
                                        className="w-16 bg-[#FAFAF8] border border-[#14131F]/15 rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-[#14131F] outline-none focus:border-[#4338CA]"
                                      />

                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuestionsSolved(week.weekNum, 1)}
                                        className="w-8 h-8 rounded-lg bg-[#FAFAF8] border border-[#14131F]/15 hover:bg-[#14131F]/5 text-[#14131F] font-bold flex items-center justify-center cursor-pointer transition-colors"
                                        title="Increase"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>

                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleUpdateQuestionsSolved(week.weekNum, week.targetQuestions - week.solvedQuestions)}
                                        className="ml-2"
                                      >
                                        Mark all solved
                                      </Button>
                                    </div>
                                  </div>
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

              {/* STAGE 4: RECOMMENDED PORTFOLIO PROJECTS */}
              <div className="relative">
                {/* Node indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#4338CA] text-white flex items-center justify-center font-bold text-[11px] shadow-xs ring-4 ring-[#FAFAF8]">
                  <FolderGit2 className="w-3.5 h-3.5" />
                </div>

                <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#14131F]/8 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4338CA] block">Stage 4 • Proof-of-Work</span>
                      <h4 className="text-sm font-display font-bold text-[#14131F]">Recommended Portfolio Projects</h4>
                      <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                        Production-grade projects designed to demonstrate relevant architecture to {companyDisplayName} technical interviewers.
                      </p>
                    </div>

                    <Badge variant="positive" size="sm">
                      Resume differentiator
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {getRecommendedProjects(positionDisplayName, companyDisplayName).map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#14131F] font-display">{proj.title}</span>
                            <Badge variant={proj.difficulty === 'Advanced' ? 'warning' : 'neutral'} size="sm">
                              {proj.difficulty}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#14131F]/60 font-sans leading-relaxed">
                            {proj.description}
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-[#14131F]/8">
                          <div className="flex flex-wrap gap-1.5">
                            {proj.tags.map((t, tIdx) => (
                              <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#14131F]/8 text-[#14131F]/70">
                                {t}
                              </span>
                            ))}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<FolderGit2 className="w-3.5 h-3.5 text-[#14131F]/60" />}
                            className="w-full"
                          >
                            Add to project portfolio
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* STAGE 5: CERTIFICATIONS & SCREENING READINESS */}
              <div className="relative">
                {/* Node indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#4338CA] text-white flex items-center justify-center font-bold text-[11px] shadow-xs ring-4 ring-[#FAFAF8]">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>

                <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#14131F]/8 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4338CA] block">Stage 5 • Verification</span>
                      <h4 className="text-sm font-display font-bold text-[#14131F]">Screening Benchmarks & Credentials</h4>
                      <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                        Assessments and industry certifications recognized by recruiters for interview shortlist clearance.
                      </p>
                    </div>

                    <Badge variant="neutral" size="sm">
                      Recruiter clearance
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {getRecommendedCertifications(positionDisplayName).map((cert) => (
                      <div
                        key={cert.id}
                        className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#14131F]">{cert.name}</span>
                            <Badge variant={cert.status === 'in_progress' ? 'positive' : 'neutral'} size="sm">
                              {cert.status === 'in_progress' ? 'In progress' : 'Recommended'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#14131F]/60">
                            {cert.provider} • {cert.relevance}
                          </p>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                        >
                          Verify benchmark
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* STAGE 6: TARGET CAREER DESTINATION */}
              <div className="relative">
                {/* Node indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#4338CA] text-white flex items-center justify-center font-bold text-[11px] shadow-xs ring-4 ring-[#FAFAF8]">
                  <Target className="w-3.5 h-3.5" />
                </div>

                <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#14131F]/8 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14131F]/8 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4338CA] block">Stage 6 • Placement Goal</span>
                      <h4 className="text-sm font-display font-bold text-[#14131F]">
                        Target Career Destination: {positionDisplayName} at {companyDisplayName}
                      </h4>
                      <p className="text-xs text-[#14131F]/60 font-sans mt-0.5">
                        Official readiness requirements for campus drives and direct recruiter interview scheduling.
                      </p>
                    </div>

                    <Badge variant="positive" size="sm" icon={<ShieldCheck className="w-3 h-3 text-[#14131F]" />}>
                      {overallRoadmapProgressPct}% drive ready
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-sans">
                    <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex items-center justify-between">
                      <span className="text-[#14131F]/70">Curriculum Sprint Completion</span>
                      <span className="font-semibold text-[#14131F]">{overallRoadmapProgressPct}%</span>
                    </div>
                    <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex items-center justify-between">
                      <span className="text-[#14131F]/70">Technical Concepts Mastered</span>
                      <span className="font-semibold text-[#14131F]">{completedTopicsCount} / {totalTopicsCount}</span>
                    </div>
                    <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex items-center justify-between">
                      <span className="text-[#14131F]/70">Practice Target Questions Solved</span>
                      <span className="font-semibold text-[#14131F]">{totalSolvedQuestions} / {totalTargetQuestions}</span>
                    </div>
                    <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 flex items-center justify-between">
                      <span className="text-[#14131F]/70">Campus Placement Verification</span>
                      <span className="font-semibold text-[#14131F]">Verified Profile</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-[#14131F]/60">
                      Reach 100% curriculum completion to unlock verified placement recommendation.
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Sparkles className="w-4 h-4" />}
                    >
                      Start mock interview simulation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
