import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Video,
  VideoOff,
  Bot,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Award,
  TrendingUp,
  BarChart3,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Users,
  Zap,
  HelpCircle,
  MessageSquare,
  FileText,
  ChevronRight,
  Sliders,
  Maximize2,
  Volume2,
  Loader2,
  Clock,
  Compass,
  ArrowRight,
  Usb
} from 'lucide-react';
import {
  Button,
  Badge,
  VerifiedSeal,
  SectionHeading,
  ListRow,
  LedgerContainer,
  RecordCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '../ui';

import {
  EYE_CONTACT_THRESHOLD,
  EYE_CONTACT_VIOLATION_DURATION_MS,
  EYE_CONTACT_VIOLATION_TYPE,
  EYE_CONTACT_VIOLATION_MESSAGE,
  MAX_PROCTORING_VIOLATIONS,
  MULTIPLE_VIOLATIONS_TERMINATION_REASON,
  MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
  isActualProctoringViolation,
  countActualProctoringViolations,
} from '../../utils/eyeContactProctoring';

export interface ProctoringViolation {
  id: string;
  type: 'face_lost' | 'multiple_faces' | 'looking_away' | 'TAB_SWITCH' | 'CONNECTED_DEVICE_DETECTED' | 'CONNECTED_DEVICE_DISCONNECTED' | 'EYE_CONTACT' | string;
  timestamp: string;
  durationMs?: number;
  details?: string;
  eyeContactScore?: number;
  isInformational?: boolean;
  api?: string;
  vendorId?: string;
  productId?: string;
  deviceClass?: string;
}

interface AiMockInterviewSimulatorProps {
  studentInfo: {
    fullName: string;
    college: string;
    degree: string;
    targetRole: string;
  };
}

// Preset Target Companies
const COMPANY_OPTIONS = [
  { id: 'google', name: 'Google', difficulty: 'Hard', logo: '🌐', focus: 'System Design, DSA & Googlyness' },
  { id: 'amazon', name: 'Amazon', difficulty: 'Hard', logo: '📦', focus: 'LP STAR Method & High Scale Backend' },
  { id: 'microsoft', name: 'Microsoft', difficulty: 'Medium-Hard', logo: '💻', focus: 'Core DSA, System Architecture & Design' },
  { id: 'razorpay', name: 'Razorpay', difficulty: 'Hard', logo: '💳', focus: 'Payment Gateway Idempotency & Microservices' },
  { id: 'flipkart', name: 'Flipkart', difficulty: 'Medium-Hard', logo: '🛒', focus: 'E-commerce Concurrency & Low Latency' },
  { id: 'swiggy', name: 'Swiggy', difficulty: 'Medium-Hard', logo: '🛵', focus: 'Geospatial Queries & Real-time Routing' },
  { id: 'uber', name: 'Uber', difficulty: 'Hard', logo: '🚗', focus: 'High Throughput Distributed Systems' },
  { id: 'goldman', name: 'Goldman Sachs', difficulty: 'Hard', logo: '🏦', focus: 'Financial Algorithms & Math Logic' },
  { id: 'atlassian', name: 'Atlassian', difficulty: 'Hard', logo: '🔷', focus: 'Craftsmanship & Code Architecture' },
  { id: 'stripe', name: 'Stripe', difficulty: 'Hard', logo: '⚡', focus: 'API Design & Payment Infrastructure' },
  { id: 'tcs', name: 'TCS Digital / Prime', difficulty: 'Medium', logo: '🏢', focus: 'Fundamental OOP & Aptitude Coding' },
  { id: 'infosys', name: 'Infosys Power Programmer', difficulty: 'Medium', logo: '🌐', focus: 'Data Structures & Problem Solving' },
  { id: 'custom', name: 'Custom Company...', difficulty: 'Adaptive', logo: '🎯', focus: 'Tailored Company Requirements' },
];

// Preset Job Posts
const JOB_POST_OPTIONS = [
  'Software Development Engineer I (SDE 1)',
  'Software Development Engineer II (SDE 2)',
  'Backend Engineer (Distributed Systems)',
  'Full-Stack Developer (React & Node.js)',
  'Frontend Specialist (UI / UX Architecture)',
  'Data & AI Platform Engineer',
  'DevOps & Cloud Infrastructure Engineer',
  'Custom Job Position...',
];

// Interviewer Persona Options
const INTERVIEWER_PERSONAS = [
  {
    id: 'Bar Raiser (Strict & Probing)',
    title: 'Bar Raiser',
    tag: 'Strict & Probing',
    description: 'Drills deep into behavioral trade-offs, STAR depth, and edge cases.',
  },
  {
    id: 'Tech Lead (System & Coding Focus)',
    title: 'Tech Lead',
    tag: 'Architecture & DSA',
    description: 'Evaluates algorithmic efficiency, concurrency, and modular design.',
  },
  {
    id: 'Engineering Manager (Leadership & Culture)',
    title: 'Engineering Manager',
    tag: 'Leadership & Impact',
    description: 'Assesses business context, ownership mindset, and cross-team empathy.',
  },
];

// Company Question Bank (Client-side fallback on network errors)
const QUESTION_DATABASE: Record<string, string[]> = {
  google: [
    "How would you design a real-time collaborative document editor like Google Docs? Address concurrency control (OT vs CRDTs).",
    "Given a stream of integers, how would you calculate the running median in O(log N) time?",
    "Describe a challenging situation where you disagreed with a senior engineer on architecture and how you resolved it."
  ],
  amazon: [
    "Describe a scenario where you faced a production failure. How did you dive deep and apply Customer Obsession?",
    "How would you design Amazon's Flash Sale inventory reservation system to prevent over-selling under 100k TPS?",
    "How do you ensure idempotency in asynchronous payment processing pipelines?"
  ],
  razorpay: [
    "Explain how webhooks are reliably delivered at Razorpay when merchant endpoints experience intermittent downtime.",
    "Walk me through your strategy for database sharding and connection pooling in high-traffic payment gateways.",
    "What is the difference between Optimistic and Pessimistic locking in PostgreSQL?"
  ],
  microsoft: [
    "How would you optimize React component tree re-renders in a telemetry monitoring dashboard with 1000 items/sec?",
    "Design a distributed file system like OneDrive with chunking and deduplication.",
    "Explain garbage collection mechanisms in Java/Go/V8 engine and how to prevent memory leaks."
  ],
  default: [
    "Tell me about yourself, your technical background, and why you are interested in this role.",
    "Explain the internal execution of a microservices architecture during high read-heavy spikes.",
    "Walk me through a project where you optimized backend response latency or database queries."
  ]
};

export interface InterviewQuestionItem {
  text: string;
  source: 'real' | 'ai-generated';
}

export const AiMockInterviewSimulator: React.FC<AiMockInterviewSimulatorProps> = ({ studentInfo }) => {
  const authContext = useAuth();
  const token = authContext?.token;

  // Target Configuration States (pre-filled with studentInfo.targetRole if specified)
  const [selectedCompanyId, setSelectedCompanyId] = useState('google');
  const [customCompany, setCustomCompany] = useState('');
  const [selectedJobPost, setSelectedJobPost] = useState(() => {
    if (studentInfo?.targetRole && JOB_POST_OPTIONS.includes(studentInfo.targetRole)) {
      return studentInfo.targetRole;
    }
    return 'Software Development Engineer I (SDE 1)';
  });
  const [customJobPost, setCustomJobPost] = useState(() => {
    if (studentInfo?.targetRole && !JOB_POST_OPTIONS.includes(studentInfo.targetRole)) {
      return studentInfo.targetRole;
    }
    return '';
  });
  const [interviewerPersona, setInterviewerPersona] = useState('Bar Raiser (Strict & Probing)');

  // Grounded Questions State
  const [activeQuestions, setActiveQuestions] = useState<InterviewQuestionItem[]>(() =>
    (QUESTION_DATABASE.google || QUESTION_DATABASE.default).map((q) => ({ text: q, source: 'ai-generated' }))
  );
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Interview Progress States
  const [sessionState, setSessionState] = useState<'idle' | 'configuring' | 'active' | 'completed' | 'terminated'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [isAnswerRecording, setIsAnswerRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Tab Switch Termination States & Refs
  const [terminationData, setTerminationData] = useState<{
    reason: string;
    remark: string;
    status: string;
    timestamp: string;
  } | null>(null);
  const terminationInProgressRef = useRef(false);
  const sessionStateRef = useRef(sessionState);
  sessionStateRef.current = sessionState;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Webcam & Vision States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamPermission, setWebcamPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);

  // MediaPipe FaceLandmarker Vision States & Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const detectionAnimRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [faceCount, setFaceCount] = useState<number>(1);
  const [isVisionModelLoading, setIsVisionModelLoading] = useState<boolean>(false);

  // Real-time Posture & Behavioral Scores (Dynamic)
  const [livePostureScore, setLivePostureScore] = useState(92);
  const [liveEyeContactScore, setLiveEyeContactScore] = useState(88);
  const [liveConfidenceScore, setLiveConfidenceScore] = useState(90);
  const [liveCommScore, setLiveCommScore] = useState(86);

  // Live Posture Status Descriptors
  const [postureStatusText, setPostureStatusText] = useState('Upright & Centered');
  const [eyeContactStatusText, setEyeContactStatusText] = useState('Direct Lens Focus');
  const [confidenceStatusText, setConfidenceStatusText] = useState('Composed & Steady');

  // Recorded Question Feedback Logs
  const [questionLogs, setQuestionLogs] = useState<Array<{
    question: string;
    source?: 'real' | 'ai-generated';
    answer: string;
    postureScore: number;
    eyeContactScore: number;
    confidenceScore: number;
    commScore: number;
    techScore: number;
    aiFeedback: string;
  }>>([]);

  // Proctoring Violations State & Tracking Refs
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  type DeviceMonitoringStatus = 'unsupported' | 'permission_required' | 'available' | 'device_detected';
  const [deviceMonitoringStatus, setDeviceMonitoringStatus] = useState<DeviceMonitoringStatus>('unsupported');
  const [showDevicePermModal, setShowDevicePermModal] = useState<boolean>(false);
  const lastReportedDevicesRef = useRef<Map<string, number>>(new Map());

  const faceLostStartRef = useRef<number | null>(null);
  const faceLostLoggedRef = useRef<boolean>(false);
  const faceLostViolationIdRef = useRef<string | null>(null);

  const multipleFacesLoggedRef = useRef<boolean>(false);

  const lookingAwayStartRef = useRef<number | null>(null);
  const lookingAwayLoggedRef = useRef<boolean>(false);
  const lookingAwayViolationIdRef = useRef<string | null>(null);

  // Proctoring Rule 3: Eye Contact Below 50% for 3 Continuous Seconds Refs & State
  const eyeContactBelowSinceRef = useRef<number | null>(null);
  const eyeContactViolationLoggedRef = useRef<boolean>(false);
  const eyeContactViolationIdRef = useRef<string | null>(null);
  const [activeEyeContactWarning, setActiveEyeContactWarning] = useState<boolean>(false);
  const reportActualViolationRef = useRef<(violationData: {
    id: string;
    type: string;
    details?: string;
    durationMs?: number;
    eyeContactScore?: number;
  }) => void>(() => {});

  // Real-time posture & eye contact accumulation refs for session-wide average
  const realtimePostureSumRef = useRef<number>(0);
  const realtimePostureCountRef = useRef<number>(0);
  const realtimeEyeContactSumRef = useRef<number>(0);
  const realtimeEyeContactCountRef = useRef<number>(0);

  // Final Report Data
  const [finalReport, setFinalReport] = useState<{
    overallScore: number;
    proctoringScore?: number;
    flaggedForReview?: boolean;
    reviewNote?: string;
    postureScore: number;
    eyeContactScore: number;
    confidenceScore: number;
    commScore: number;
    techScore: number;
    verdict: 'STRONG HIRE' | 'HIRE' | 'BORDERLINE' | 'NEEDS IMPROVEMENT';
    companyFitName: string;
    jobRoleName: string;
    strengths: string[];
    improvements: string[];
    violations?: ProctoringViolation[];
  } | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Web Speech API Voice Dictation Ref & State
  const recognitionRef = useRef<any>(null);
  const [dictationError, setDictationError] = useState<string | null>(null);

  // Stop Speech Recognition safely
  const stopDictation = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // ignore if already stopped
      }
      recognitionRef.current = null;
    }
    setIsAnswerRecording(false);
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      stopDictation();
    };
  }, [stopDictation]);

  // Start / Stop Real Speech Recognition
  const toggleDictation = () => {
    setDictationError(null);

    if (isAnswerRecording) {
      stopDictation();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDictationError("Voice dictation isn't supported in this browser — try Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          }
        }
        if (finalChunk) {
          setUserAnswerInput((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${finalChunk.trim()}` : finalChunk.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsAnswerRecording(false);
        recognitionRef.current = null;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setDictationError('Microphone permission denied. Please allow mic access in your browser.');
        } else if (event.error === 'no-speech') {
          // ignore transient silence
        } else {
          setDictationError(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsAnswerRecording(false);
        recognitionRef.current = null;
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsAnswerRecording(true);
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setDictationError('Failed to access microphone or start voice recognition.');
      setIsAnswerRecording(false);
    }
  };

  // Modal & Notification States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saveToastMsg, setSaveToastMsg] = useState<string | null>(null);

  // Handle Cancel / Stop Interview Session
  const handleCancelInterview = () => {
    stopWebcam();
    stopDictation();
    setDictationError(null);
    setIsEvaluating(false);
    setElapsedTime(0);
    setSessionId(null);
    setUserAnswerInput('');
    setSessionState('idle');
    setShowCancelModal(false);
  };

  // Active Company Object
  const companyObj = COMPANY_OPTIONS.find(c => c.id === selectedCompanyId) || COMPANY_OPTIONS[0];
  const companyDisplayName = selectedCompanyId === 'custom' ? (customCompany.trim() || 'Custom Target Company') : companyObj.name;
  const jobRoleDisplayName = selectedJobPost === 'Custom Job Position...' ? (customJobPost.trim() || 'Custom Tech Position') : selectedJobPost;

  // Active Questions List
  const questionsList = activeQuestions.map((q) => q.text);

  // Fetch grounded questions from backend or fallback to static on network error
  const fetchQuestionsForTarget = async (companyName: string, roleName: string): Promise<InterviewQuestionItem[]> => {
    setIsLoadingQuestions(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/interviews/questions?company=${encodeURIComponent(companyName)}&role=${encodeURIComponent(roleName)}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          const parsed: InterviewQuestionItem[] = data.questions.map((q: any) => {
            if (typeof q === 'string') return { text: q, source: 'ai-generated' };
            return {
              text: q.text || String(q),
              source: q.source === 'real' ? 'real' : 'ai-generated',
            };
          });
          setActiveQuestions(parsed);
          return parsed;
        }
      }
      throw new Error('Failed to fetch from questions API');
    } catch (err) {
      console.warn('Using client-side fallback questions due to network fetch failure:', err);
      const fallbackList = QUESTION_DATABASE[selectedCompanyId] || QUESTION_DATABASE.default;
      const fallbackItems: InterviewQuestionItem[] = fallbackList.map((q) => ({
        text: q,
        source: 'ai-generated',
      }));
      setActiveQuestions(fallbackItems);
      return fallbackItems;
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Prefetch questions whenever candidate changes company or job post in idle state
  useEffect(() => {
    if (sessionState === 'idle') {
      const timer = setTimeout(() => {
        fetchQuestionsForTarget(companyDisplayName, jobRoleDisplayName);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedCompanyId, customCompany, selectedJobPost, customJobPost, sessionState, token]);

  // Camera Management Functions
  const startWebcam = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setStreamRef(stream);
      setWebcamActive(true);
      setWebcamPermission('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Webcam access error:", err);
      setWebcamPermission('denied');
      setCameraError(err.message || 'Unable to access camera hardware. AI vision simulation running.');
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      setStreamRef(null);
    }
    setWebcamActive(false);
  };

  // Connect video srcObject when videoRef attaches or stream changes
  useEffect(() => {
    if (videoRef.current && streamRef) {
      videoRef.current.srcObject = streamRef;
    }
  }, [streamRef, webcamActive]);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }
    };
  }, [streamRef]);

  // MediaPipe FaceLandmarker Initialization and Throttled Detection Loop (~4 fps)
  useEffect(() => {
    let active = true;

    const initAndRun = async () => {
      if (sessionState !== 'active' || !webcamActive) {
        if (detectionAnimRef.current) {
          cancelAnimationFrame(detectionAnimRef.current);
          detectionAnimRef.current = null;
        }
        return;
      }

      if (!faceLandmarkerRef.current) {
        setIsVisionModelLoading(true);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          if (!active) return;

          const landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numFaces: 2,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false
          });
          if (!active) {
            landmarker.close();
            return;
          }
          faceLandmarkerRef.current = landmarker;
        } catch (err) {
          console.warn('FaceLandmarker GPU init failed, trying CPU:', err);
          try {
            const vision = await FilesetResolver.forVisionTasks(
              'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
            if (!active) return;
            const landmarker = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'CPU'
              },
              runningMode: 'VIDEO',
              numFaces: 2
            });
            if (!active) {
              landmarker.close();
              return;
            }
            faceLandmarkerRef.current = landmarker;
          } catch (cpuErr) {
            console.warn('Failed to initialize FaceLandmarker model:', cpuErr);
          }
        } finally {
          if (active) setIsVisionModelLoading(false);
        }
      }

      const detectFrame = () => {
        if (!active || sessionState !== 'active' || !webcamActive) return;

        const now = performance.now();
        if (now - lastDetectionTimeRef.current >= 250) { // Throttled to ~4 fps (every 250ms)
          lastDetectionTimeRef.current = now;

          if (videoRef.current && videoRef.current.readyState >= 2 && faceLandmarkerRef.current) {
            try {
              const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, now);
              if (results && results.faceLandmarks) {
                const count = results.faceLandmarks.length;
                setFaceCount(count);
                setFaceDetected(count > 0);
                const nowMs = Date.now();

                // --- PROCTORING RULE 1: Face Lost (>3s continuous) ---
                if (count === 0) {
                  if (!faceLostStartRef.current) {
                    faceLostStartRef.current = nowMs;
                  } else {
                    const elapsed = nowMs - faceLostStartRef.current;
                    if (elapsed >= 3000) {
                      if (!faceLostLoggedRef.current) {
                        faceLostLoggedRef.current = true;
                        const vId = 'v_fl_' + nowMs;
                        faceLostViolationIdRef.current = vId;
                        reportActualViolationRef.current({
                          id: vId,
                          type: 'face_lost',
                          durationMs: Math.round(elapsed),
                          details: 'Candidate face absent from camera frame > 3s',
                        });
                      } else if (faceLostViolationIdRef.current) {
                        const currId = faceLostViolationIdRef.current;
                        setViolations((prev) =>
                          prev.map((v) => (v.id === currId ? { ...v, durationMs: Math.round(elapsed) } : v))
                        );
                      }
                    }
                  }
                } else {
                  faceLostStartRef.current = null;
                  faceLostLoggedRef.current = false;
                  faceLostViolationIdRef.current = null;
                }

                // --- PROCTORING RULE 2: Multiple Faces ---
                if (count > 1) {
                  if (!multipleFacesLoggedRef.current) {
                    multipleFacesLoggedRef.current = true;
                    reportActualViolationRef.current({
                      id: 'v_mf_' + nowMs,
                      type: 'multiple_faces',
                      details: `Detected ${count} faces in candidate webcam view`,
                    });
                  }
                } else {
                  multipleFacesLoggedRef.current = false;
                }

                if (count > 0) {
                  const landmarks = results.faceLandmarks[0];
                  // Landmark indexes: Nose tip=1, Chin=152, Top head=10, Left ear/cheek=234, Right ear/cheek=454
                  const nose = landmarks[1];
                  const chin = landmarks[152];
                  const topHead = landmarks[10];
                  const leftEar = landmarks[234];
                  const rightEar = landmarks[454];

                  if (nose && leftEar && rightEar && topHead && chin) {
                    const faceCenterX = (leftEar.x + rightEar.x) / 2;
                    const faceWidth = Math.abs(rightEar.x - leftEar.x);
                    const yawOffset = faceWidth > 0 ? Math.abs(nose.x - faceCenterX) / faceWidth : 0;

                    const faceCenterY = (topHead.y + chin.y) / 2;
                    const faceHeight = Math.abs(chin.y - topHead.y);
                    const pitchOffset = faceHeight > 0 ? Math.abs(nose.y - faceCenterY) / faceHeight : 0;

                    const yawPenalty = Math.min(50, yawOffset * 180);
                    const pitchPenalty = Math.min(40, Math.abs(pitchOffset - 0.08) * 150);

                    const computedPosture = Math.max(20, Math.min(100, Math.round(100 - yawPenalty - pitchPenalty)));
                    setLivePostureScore(computedPosture);

                    if (computedPosture >= 85) setPostureStatusText('Upright & Centered');
                    else if (computedPosture >= 65) setPostureStatusText('Slight Head Tilt');
                    else setPostureStatusText('Off-Center / Tilted');

                    // --- PROCTORING RULE 3: Looking Away (Posture < 50 for > 5s continuous) ---
                    if (computedPosture < 50) {
                      if (!lookingAwayStartRef.current) {
                        lookingAwayStartRef.current = nowMs;
                      } else {
                        const elapsed = nowMs - lookingAwayStartRef.current;
                        if (elapsed >= 5000) {
                          if (!lookingAwayLoggedRef.current) {
                            lookingAwayLoggedRef.current = true;
                            const vId = 'v_la_' + nowMs;
                            lookingAwayViolationIdRef.current = vId;
                            reportActualViolationRef.current({
                              id: vId,
                              type: 'looking_away',
                              durationMs: Math.round(elapsed),
                              details: 'Head posture / gaze alignment dropped below 50% for > 5s',
                            });
                          } else if (lookingAwayViolationIdRef.current) {
                            const currId = lookingAwayViolationIdRef.current;
                            setViolations((prev) =>
                              prev.map((v) => (v.id === currId ? { ...v, durationMs: Math.round(elapsed) } : v))
                            );
                          }
                        }
                      }
                    } else {
                      lookingAwayStartRef.current = null;
                      lookingAwayLoggedRef.current = false;
                      lookingAwayViolationIdRef.current = null;
                    }

                    // Iris landmarks: 468 (left iris), 473 (right iris)
                    const irisLeft = landmarks[468] || landmarks[159];
                    const irisRight = landmarks[473] || landmarks[386];

                    let computedEyeContact = 85;
                    if (irisLeft && irisRight && landmarks[133] && landmarks[33] && landmarks[263] && landmarks[362]) {
                      const leftEyeWidth = Math.abs(landmarks[133].x - landmarks[33].x);
                      const rightEyeWidth = Math.abs(landmarks[263].x - landmarks[362].x);
                      const leftEyeCenterX = (landmarks[133].x + landmarks[33].x) / 2;
                      const rightEyeCenterX = (landmarks[263].x + landmarks[362].x) / 2;

                      const leftIrisDev = leftEyeWidth > 0 ? Math.abs(irisLeft.x - leftEyeCenterX) / leftEyeWidth : 0;
                      const rightIrisDev = rightEyeWidth > 0 ? Math.abs(irisRight.x - rightEyeCenterX) / rightEyeWidth : 0;
                      const avgIrisDev = (leftIrisDev + rightIrisDev) / 2;

                      const totalGazeDev = avgIrisDev * 120 + yawOffset * 90;
                      computedEyeContact = Math.max(15, Math.min(100, Math.round(100 - totalGazeDev)));
                    } else {
                      computedEyeContact = Math.max(20, Math.min(100, Math.round(computedPosture * 0.92)));
                    }

                    setLiveEyeContactScore(computedEyeContact);

                    // Accumulate tracking scores for session-wide average
                    realtimePostureSumRef.current += computedPosture;
                    realtimePostureCountRef.current += 1;
                    realtimeEyeContactSumRef.current += computedEyeContact;
                    realtimeEyeContactCountRef.current += 1;

                    if (computedEyeContact >= 82) setEyeContactStatusText('Direct Lens Focus');
                    else if (computedEyeContact >= 60) setEyeContactStatusText('Occasional Glance');
                    else setEyeContactStatusText('Looking Away');

                    // --- PROCTORING RULE 3: Eye Contact Below 50% for 3 Continuous Seconds ---
                    if (computedEyeContact < EYE_CONTACT_THRESHOLD) {
                      if (!eyeContactBelowSinceRef.current) {
                        eyeContactBelowSinceRef.current = nowMs;
                      } else {
                        const elapsed = nowMs - eyeContactBelowSinceRef.current;
                        if (elapsed >= EYE_CONTACT_VIOLATION_DURATION_MS) {
                          if (!eyeContactViolationLoggedRef.current) {
                            eyeContactViolationLoggedRef.current = true;
                            const vId = 'v_ec_' + nowMs;
                            eyeContactViolationIdRef.current = vId;
                            setActiveEyeContactWarning(true);

                            reportActualViolationRef.current({
                              id: vId,
                              type: EYE_CONTACT_VIOLATION_TYPE,
                              eyeContactScore: computedEyeContact,
                              durationMs: Math.round(elapsed),
                              details: EYE_CONTACT_VIOLATION_MESSAGE,
                            });
                          }
                        }
                      }
                    } else {
                      // Score >= 50%: Reset timer and reset continuous episode
                      eyeContactBelowSinceRef.current = null;
                      eyeContactViolationLoggedRef.current = false;
                      eyeContactViolationIdRef.current = null;
                      setActiveEyeContactWarning(false);
                    }
                  }
                } else {
                  lookingAwayStartRef.current = null;
                  lookingAwayLoggedRef.current = false;
                  lookingAwayViolationIdRef.current = null;

                  eyeContactBelowSinceRef.current = null;
                  eyeContactViolationLoggedRef.current = false;
                  eyeContactViolationIdRef.current = null;
                  setActiveEyeContactWarning(false);

                  setLivePostureScore(0);
                  setLiveEyeContactScore(0);
                  setPostureStatusText('No Face Detected');
                  setEyeContactStatusText('Camera Unfocused');
                }
              }
            } catch (err) {
              console.warn('MediaPipe detection frame error:', err);
            }
          }
        }

        if (active && sessionState === 'active' && webcamActive) {
          detectionAnimRef.current = requestAnimationFrame(detectFrame);
        }
      };

      detectFrame();
    };

    initAndRun();

    return () => {
      active = false;
      if (detectionAnimRef.current) {
        cancelAnimationFrame(detectionAnimRef.current);
        detectionAnimRef.current = null;
      }
      eyeContactBelowSinceRef.current = null;
      eyeContactViolationLoggedRef.current = false;
      eyeContactViolationIdRef.current = null;
      setActiveEyeContactWarning(false);
    };
  }, [sessionState, webcamActive]);

  // Clean up MediaPipe FaceLandmarker instance when component unmounts
  useEffect(() => {
    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, []);

  // Capture current webcam frame as JPEG base64 string
  const captureSnapshot = (): string => {
    if (videoRef.current && webcamActive) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (err) {
        console.warn('Snapshot capture error:', err);
      }
    }
    return '';
  };

  // Timer Effect during active session
  useEffect(() => {
    let timer: any;
    if (sessionState === 'active') {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionState]);

  // Proctoring Rule 1: Immediate Tab Switch / Window Inactive Termination
  const terminateSessionDueToTabSwitch = useCallback(async () => {
    if (terminationInProgressRef.current) return;
    if (sessionStateRef.current !== 'active') return;

    terminationInProgressRef.current = true;

    const currentActiveSessionId = sessionIdRef.current;
    const currentActiveToken = tokenRef.current;
    const timestamp = new Date().toISOString();
    const reason = 'TAB_SWITCH';
    const remark = 'Cheating detected: Candidate attempted to switch tabs or leave the interview.';

    // 1. Immediately abort dictation
    stopDictation();

    // 2. Stop camera stream and vision loops
    stopWebcam();

    if (detectionAnimRef.current) {
      cancelAnimationFrame(detectionAnimRef.current);
      detectionAnimRef.current = null;
    }

    // 3. Close cancel modal if open
    setShowCancelModal(false);

    // 4. Update session state immediately so no further answers can be sent
    setTerminationData({
      reason,
      remark,
      status: 'TERMINATED',
      timestamp,
    });
    setSessionState('terminated');

    eyeContactBelowSinceRef.current = null;
    eyeContactViolationLoggedRef.current = false;
    eyeContactViolationIdRef.current = null;
    setActiveEyeContactWarning(false);

    // 5. Append local violation
    setViolations((prev) => [
      ...prev,
      {
        id: `v_tab_${Date.now()}`,
        type: reason,
        timestamp,
        details: remark,
      },
    ]);

    // 6. Send atomic termination request to backend using unload-safe keepalive fetch
    if (currentActiveSessionId) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (currentActiveToken) headers['Authorization'] = `Bearer ${currentActiveToken}`;

        await fetch(`/api/interviews/${currentActiveSessionId}/terminate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            reason,
            remark,
          }),
          keepalive: true,
        });
      } catch (apiErr) {
        console.warn('Backend interview termination error:', apiErr);
      }
    }
  }, [stopDictation, stopWebcam]);

  // Proctoring Rule 4: Automatic Termination After Multiple Proctoring Violations
  const terminateSessionDueToMultipleViolations = useCallback(
    (customReason?: string, customRemark?: string, syncedViolations?: ProctoringViolation[]) => {
      if (terminationInProgressRef.current) return;
      if (sessionStateRef.current !== 'active') return;

      terminationInProgressRef.current = true;

      const currentActiveSessionId = sessionIdRef.current;
      const currentActiveToken = tokenRef.current;
      const timestamp = new Date().toISOString();
      const reason = customReason || MULTIPLE_VIOLATIONS_TERMINATION_REASON;
      const remark = customRemark || MULTIPLE_VIOLATIONS_TERMINATION_REMARK;

      // 1. Immediately abort dictation
      stopDictation();

      // 2. Stop camera stream and vision loops
      stopWebcam();

      if (detectionAnimRef.current) {
        cancelAnimationFrame(detectionAnimRef.current);
        detectionAnimRef.current = null;
      }

      // 3. Close cancel modal if open
      setShowCancelModal(false);

      // 4. Update session state immediately so no further answers can be sent
      setTerminationData({
        reason,
        remark,
        status: 'TERMINATED',
        timestamp,
      });
      setSessionState('terminated');

      eyeContactBelowSinceRef.current = null;
      eyeContactViolationLoggedRef.current = false;
      eyeContactViolationIdRef.current = null;
      setActiveEyeContactWarning(false);

      if (syncedViolations && Array.isArray(syncedViolations) && syncedViolations.length > 0) {
        setViolations(syncedViolations);
      }

      // 5. Ensure backend termination is finalized
      if (currentActiveSessionId) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (currentActiveToken) headers['Authorization'] = `Bearer ${currentActiveToken}`;

          fetch(`/api/interviews/${currentActiveSessionId}/terminate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              reason,
              remark,
            }),
            keepalive: true,
          }).catch((e) => console.warn('Backend termination error:', e));
        } catch (apiErr) {
          console.warn('Backend interview termination error:', apiErr);
        }
      }
    },
    [stopDictation, stopWebcam]
  );

  const reportActualViolation = useCallback(
    (violationData: {
      id: string;
      type: string;
      details?: string;
      durationMs?: number;
      eyeContactScore?: number;
    }) => {
      const nowIso = new Date().toISOString();
      const newV: ProctoringViolation = {
        id: violationData.id,
        type: violationData.type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        durationMs: violationData.durationMs,
        details: violationData.details,
        eyeContactScore: violationData.eyeContactScore,
      };

      setViolations((prev) => {
        const updated = [...prev, newV];
        const actualCount = countActualProctoringViolations(updated);
        if (actualCount >= MAX_PROCTORING_VIOLATIONS) {
          terminateSessionDueToMultipleViolations(
            MULTIPLE_VIOLATIONS_TERMINATION_REASON,
            MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
            updated
          );
        }
        return updated;
      });

      const currentActiveSessionId = sessionIdRef.current;
      const currentActiveToken = tokenRef.current;
      if (currentActiveSessionId && sessionStateRef.current === 'active') {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (currentActiveToken) headers['Authorization'] = `Bearer ${currentActiveToken}`;

        fetch(`/api/interviews/${currentActiveSessionId}/violation`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: violationData.id,
            type: violationData.type,
            eyeContactScore: violationData.eyeContactScore,
            durationMs: violationData.durationMs,
            timestamp: nowIso,
            details: violationData.details,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.terminated || data?.status === 'TERMINATED' || data?.sessionStatus === 'TERMINATED') {
              terminateSessionDueToMultipleViolations(
                data.terminationReason || MULTIPLE_VIOLATIONS_TERMINATION_REASON,
                data.remark || MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
                data.session?.violations
              );
            }
          })
          .catch((err) => {
            console.warn('Failed to persist proctoring violation:', err);
          });
      }
    },
    [terminateSessionDueToMultipleViolations]
  );
  reportActualViolationRef.current = reportActualViolation;

  // Tab / Window Switch / Page Refresh / Unload Proctoring Lifecycle Listener
  useEffect(() => {
    if (sessionState !== 'active') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        terminateSessionDueToTabSwitch();
      }
    };

    const handlePageHide = () => {
      terminateSessionDueToTabSwitch();
    };

    const handleBeforeUnload = () => {
      terminateSessionDueToTabSwitch();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionState, terminateSessionDueToTabSwitch]);

  // Send informational device event to backend (Rule 2)
  const sendDeviceEvent = useCallback(
    async (
      eventType: 'CONNECTED_DEVICE_DETECTED' | 'CONNECTED_DEVICE_DISCONNECTED',
      device?: any
    ) => {
      const currentActiveSessionId = sessionIdRef.current;
      const currentActiveToken = tokenRef.current;
      if (!currentActiveSessionId || !currentActiveToken) return;

      let vendorIdHex = 'Unknown';
      let productIdHex = 'Unknown';
      let deviceClass = 'General USB Device';

      if (device) {
        if (device.vendorId !== undefined && device.vendorId !== null) {
          vendorIdHex = '0x' + Number(device.vendorId).toString(16).padStart(4, '0');
        }
        if (device.productId !== undefined && device.productId !== null) {
          productIdHex = '0x' + Number(device.productId).toString(16).padStart(4, '0');
        }
        if (device.productName) {
          deviceClass = String(device.productName).slice(0, 30);
        } else if (device.deviceClass !== undefined) {
          deviceClass = `Class ${device.deviceClass}`;
        }
      }

      // Client-side debounce key: eventType + vendorId + productId
      const debounceKey = `${eventType}_${vendorIdHex}_${productIdHex}`;
      const now = Date.now();
      const lastSent = lastReportedDevicesRef.current.get(debounceKey) || 0;
      if (now - lastSent < 4000) {
        return; // Debounce duplicate event
      }
      lastReportedDevicesRef.current.set(debounceKey, now);

      // Add to local proctoring violations feed as an informational event (NOT cheating, no penalty)
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const infoEntry: ProctoringViolation = {
        id: `dev_${now}_${Math.random().toString(36).slice(2, 6)}`,
        type: eventType,
        timestamp: nowTime,
        details: `${eventType === 'CONNECTED_DEVICE_DETECTED' ? 'Connected' : 'Disconnected'} device (Vendor: ${vendorIdHex}, Product: ${productIdHex}) [Informational proctoring log]`,
        isInformational: true,
        api: 'webusb',
        vendorId: vendorIdHex,
        productId: productIdHex,
        deviceClass,
      };
      setViolations((prev) => [infoEntry, ...prev]);

      try {
        await fetch(`/api/interviews/${currentActiveSessionId}/device-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentActiveToken}`,
          },
          body: JSON.stringify({
            eventType,
            api: 'webusb',
            vendorId: vendorIdHex,
            productId: productIdHex,
            deviceClass,
          }),
        });
      } catch (err) {
        console.warn('Informational device event logging failed:', err);
      }
    },
    []
  );

  // WebUSB Detection & Monitoring Lifecycle (Rule 2)
  useEffect(() => {
    if (sessionState !== 'active') {
      setDeviceMonitoringStatus('unsupported');
      return;
    }

    let isMounted = true;

    const initDeviceMonitoring = async () => {
      try {
        // Step 1: Check WebUSB availability in navigator
        const navUsb = typeof navigator !== 'undefined' ? (navigator as any).usb : null;
        if (!navUsb) {
          if (isMounted) setDeviceMonitoringStatus('unsupported');
          return;
        }

        // Step 2: Check already paired devices (non-intrusive, no prompt)
        let pairedDevices: any[] = [];
        try {
          pairedDevices = await navUsb.getDevices();
        } catch (getDevErr) {
          // Iframe permissions policy or browser security restriction
          console.info('WebUSB getDevices restricted or unavailable:', getDevErr);
          if (isMounted) setDeviceMonitoringStatus('unsupported');
          return;
        }

        if (!isMounted) return;

        if (pairedDevices && pairedDevices.length > 0) {
          setDeviceMonitoringStatus('device_detected');
          for (const dev of pairedDevices) {
            sendDeviceEvent('CONNECTED_DEVICE_DETECTED', dev);
          }
        } else {
          setDeviceMonitoringStatus('available');
        }

        // Step 3: Listen for browser USB connect / disconnect events where supported
        const handleConnect = (ev: any) => {
          if (!isMounted) return;
          setDeviceMonitoringStatus('device_detected');
          sendDeviceEvent('CONNECTED_DEVICE_DETECTED', ev?.device);
        };

        const handleDisconnect = (ev: any) => {
          if (!isMounted) return;
          setDeviceMonitoringStatus('available');
          sendDeviceEvent('CONNECTED_DEVICE_DISCONNECTED', ev?.device);
        };

        navUsb.addEventListener('connect', handleConnect);
        navUsb.addEventListener('disconnect', handleDisconnect);

        return () => {
          try {
            navUsb.removeEventListener('connect', handleConnect);
            navUsb.removeEventListener('disconnect', handleDisconnect);
          } catch {
            // Ignore cleanup errors
          }
        };
      } catch (err) {
        console.info('Device monitoring graceful fallback:', err);
        if (isMounted) setDeviceMonitoringStatus('unsupported');
      }
    };

    const cleanupPromise = initDeviceMonitoring();

    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [sessionState, sendDeviceEvent]);

  // Request device permission flow (Rule 2)
  const handleRequestDevicePermission = async () => {
    setShowDevicePermModal(false);
    try {
      const navUsb = typeof navigator !== 'undefined' ? (navigator as any).usb : null;
      if (navUsb && typeof navUsb.requestDevice === 'function') {
        const selectedDevice = await navUsb.requestDevice({ filters: [] });
        if (selectedDevice) {
          setDeviceMonitoringStatus('device_detected');
          sendDeviceEvent('CONNECTED_DEVICE_DETECTED', selectedDevice);
        }
      } else {
        setDeviceMonitoringStatus('unsupported');
      }
    } catch (err: any) {
      // Normal behavior when student cancels prompt or denies permission; do NOT crash or terminate interview
      console.info('WebUSB permission prompt cancelled or no device chosen:', err?.message || err);
    }
  };

  // Handle Start Session
  const handleStartInterview = async () => {
    terminationInProgressRef.current = false;
    setTerminationData(null);
    stopDictation();
    setDictationError(null);

    // Refresh and ensure grounded questions for candidate
    try {
      await fetchQuestionsForTarget(companyDisplayName, jobRoleDisplayName);
    } catch (e) {
      console.warn('Proceeding with loaded question set:', e);
    }

    await startWebcam();
    setSessionState('active');
    setElapsedTime(0);
    setCurrentQuestionIdx(0);
    setQuestionLogs([]);
    setFinalReport(null);
    setReportError(null);
    setIsGeneratingReport(false);
    setUserAnswerInput('');
    setViolations([]);

    faceLostStartRef.current = null;
    faceLostLoggedRef.current = false;
    faceLostViolationIdRef.current = null;
    multipleFacesLoggedRef.current = false;
    lookingAwayStartRef.current = null;
    lookingAwayLoggedRef.current = false;
    lookingAwayViolationIdRef.current = null;

    eyeContactBelowSinceRef.current = null;
    eyeContactViolationLoggedRef.current = false;
    eyeContactViolationIdRef.current = null;
    setActiveEyeContactWarning(false);

    realtimePostureSumRef.current = 0;
    realtimePostureCountRef.current = 0;
    realtimeEyeContactSumRef.current = 0;
    realtimeEyeContactCountRef.current = 0;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/interviews/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          company: companyDisplayName,
          jobRole: jobRoleDisplayName,
          category: companyObj.focus,
        }),
      });
      const data = await res.json();
      if (data._id || data.sessionId) {
        setSessionId(data.sessionId || data._id);
      }
    } catch (err) {
      console.warn('Error starting interview session:', err);
    }
  };

  // Submit Question Answer & Move Next or Finish using Gemini API
  const handleNextQuestion = async () => {
    if (isEvaluating) return;
    stopDictation();
    setDictationError(null);

    const currentQObj = activeQuestions[currentQuestionIdx] || {
      text: questionsList[currentQuestionIdx] || 'Technical Question',
      source: 'ai-generated' as const,
    };
    const currentQ = currentQObj.text;
    const userAns = userAnswerInput.trim() || 'No answer provided.';
    const snapshot = captureSnapshot();

    setIsEvaluating(true);

    try {
      const activeSessionId = sessionId || `int_${Date.now()}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/interviews/${activeSessionId}/answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: currentQ,
          answer: userAns,
          snapshotBase64: snapshot,
        }),
      });

      const evalData = await res.json();

      const hasAnswer = userAns && userAns !== 'No answer provided.';
      const postureScore = typeof evalData.postureScore === 'number' ? evalData.postureScore : livePostureScore;
      const eyeContactScore = typeof evalData.eyeContactScore === 'number' ? evalData.eyeContactScore : liveEyeContactScore;
      const confidenceScore = typeof evalData.confidenceScore === 'number' ? evalData.confidenceScore : (hasAnswer ? liveConfidenceScore : Math.min(25, liveConfidenceScore));
      const commScore = typeof evalData.commScore === 'number' ? evalData.commScore : (hasAnswer ? liveCommScore : 10);
      const techScore = typeof evalData.techScore === 'number' ? evalData.techScore : (hasAnswer ? 75 : 0);
      const aiFeedback = evalData.aiFeedback || (hasAnswer ? 'Answer received and evaluated.' : 'No answer was provided for this question.');

      setLivePostureScore(postureScore);
      setLiveEyeContactScore(eyeContactScore);
      setLiveConfidenceScore(confidenceScore);
      setLiveCommScore(commScore);

      const logEntry = {
        question: currentQ,
        source: currentQObj.source,
        answer: userAns,
        postureScore,
        eyeContactScore,
        confidenceScore,
        commScore,
        techScore,
        aiFeedback,
      };

      const newLogs = [...questionLogs, logEntry];
      setQuestionLogs(newLogs);
      setUserAnswerInput('');

      if (currentQuestionIdx + 1 < questionsList.length) {
        setCurrentQuestionIdx((prev) => prev + 1);
      } else {
        await calculateFinalReport(newLogs, activeSessionId);
      }
    } catch (err) {
      console.error('Error submitting question answer:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Calculate AI Mock Test Score on basis of Body Posture, Eye Contact, Confidence, Communication and Technical accuracy
  const calculateFinalReport = async (logs: typeof questionLogs, activeSessionId?: string, currentViolations = violations) => {
    stopDictation();
    stopWebcam();
    setSessionState('completed');
    setIsGeneratingReport(true);
    setReportError(null);

    const targetSessionId = activeSessionId || sessionId || `int_${Date.now()}`;

    const realtimeAvgPosture =
      realtimePostureCountRef.current > 0
        ? Math.round(realtimePostureSumRef.current / realtimePostureCountRef.current)
        : livePostureScore || 85;

    const realtimeAvgEyeContact =
      realtimeEyeContactCountRef.current > 0
        ? Math.round(realtimeEyeContactSumRef.current / realtimeEyeContactCountRef.current)
        : liveEyeContactScore || 85;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/interviews/${targetSessionId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          violations: currentViolations,
          questionLogs: logs,
          realtimePostureScore: realtimeAvgPosture,
          realtimeEyeContactScore: realtimeAvgEyeContact,
        }),
      });

      const reportData = await res.json();
      if (res.ok && reportData && reportData.overallScore !== undefined) {
        setFinalReport({
          ...reportData,
          violations: reportData.violations || currentViolations,
        });
        setReportError(null);
        setIsGeneratingReport(false);
        return;
      } else {
        throw new Error(reportData?.error || 'Failed to generate your score report. Please check your connection and try again.');
      }
    } catch (err: any) {
      console.warn('Error completing interview report via backend:', err);
      setReportError(err?.message || 'Failed to generate your score report. Please check your connection and try again.');
      setFinalReport(null);
      setIsGeneratingReport(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const actualViolationsCount = countActualProctoringViolations(violations);

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Header Container */}
      <div className="p-6 sm:p-8 bg-white border border-[#14131F]/8 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-6">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <SectionHeading
                level="h2"
                title="AI Mock Interview Simulator"
                subtitle="Multimodal evaluation engine analyzing body posture, eye contact, confidence, and technical depth in real time."
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Badge variant="positive" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5 text-[#14131F]" />}>
              Webcam AI vision ready
            </Badge>
          </div>
        </div>

        {/* ================= 1. CONFIGURATION VIEW (IDLE) ================= */}
        {sessionState === 'idle' && (
          <div className="space-y-6 pt-1 font-sans">
            {/* Step 1: Target Company Selection */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#4338CA]" />
                  <span className="font-display font-semibold text-sm text-[#14131F]">
                    1. Target Company
                  </span>
                </div>
                <span className="text-xs text-[#14131F]/50 font-sans">
                  {COMPANY_OPTIONS.length} presets available
                </span>
              </div>

              {/* Company Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {COMPANY_OPTIONS.map((c) => {
                  const isSelected = selectedCompanyId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCompanyId(c.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isSelected
                          ? 'bg-white border-[#4338CA] shadow-xs ring-2 ring-[#4338CA]/20'
                          : 'bg-[#FAFAF8] border-[#14131F]/8 hover:border-[#14131F]/20 text-[#14131F]/70 hover:text-[#14131F]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{c.logo}</span>
                        <Badge
                          variant={
                            c.difficulty === 'Hard'
                              ? 'warning'
                              : c.difficulty === 'Medium-Hard'
                              ? 'neutral'
                              : 'positive'
                          }
                          size="sm"
                        >
                          {c.difficulty}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-xs text-[#14131F]">{c.name}</h4>
                        <p className="font-sans text-[11px] text-[#14131F]/60 line-clamp-1 mt-0.5">{c.focus}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Company Input */}
              {selectedCompanyId === 'custom' && (
                <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 text-left font-sans">
                  <label className="text-xs font-semibold text-[#14131F] block">
                    Enter custom company name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OpenAI, Palantir, Databricks..."
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 placeholder:text-[#14131F]/40 transition-all font-sans"
                  />
                </div>
              )}
            </div>

            {/* Step 2: Target Role & Interviewer Persona */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Role Selection */}
              <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3.5 text-left font-sans">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#14131F] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#4338CA]" />
                    <span>Target Job Position / Role</span>
                  </label>
                  {studentInfo?.targetRole && (
                    <span className="text-[11px] text-[#4338CA] font-medium bg-[#4338CA]/10 px-2 py-0.5 rounded-full border border-[#4338CA]/20">
                      Profile: {studentInfo.targetRole}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {JOB_POST_OPTIONS.map((jp) => {
                    const isSelected = selectedJobPost === jp;
                    return (
                      <button
                        key={jp}
                        type="button"
                        onClick={() => setSelectedJobPost(jp)}
                        className={`p-2.5 rounded-lg border text-left transition-all text-xs font-medium cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#4338CA] text-[#4338CA] shadow-xs ring-1 ring-[#4338CA]/20'
                            : 'bg-white/60 border-[#14131F]/8 text-[#14131F]/70 hover:bg-white hover:text-[#14131F]'
                        }`}
                      >
                        <span className="line-clamp-1">{jp}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedJobPost === 'Custom Job Position...' && (
                  <input
                    type="text"
                    placeholder="e.g. Lead Distributed Systems Engineer, Staff AI Architect..."
                    value={customJobPost}
                    onChange={(e) => setCustomJobPost(e.target.value)}
                    className="w-full bg-white border border-[#14131F]/15 rounded-lg px-3.5 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 placeholder:text-[#14131F]/40 transition-all font-sans"
                  />
                )}
              </div>

              {/* Interviewer Persona Selection */}
              <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3.5 text-left font-sans">
                <label className="text-xs font-semibold text-[#14131F] flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#4338CA]" />
                  <span>Interviewer Evaluation Persona</span>
                </label>

                <div className="space-y-2">
                  {INTERVIEWER_PERSONAS.map((persona) => {
                    const isSelected = interviewerPersona === persona.id;
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => setInterviewerPersona(persona.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-white border-[#4338CA] shadow-xs ring-1 ring-[#4338CA]/20'
                            : 'bg-white/60 border-[#14131F]/8 hover:bg-white text-[#14131F]/70 hover:text-[#14131F]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-xs text-[#14131F]">
                              {persona.title}
                            </span>
                            <Badge variant={isSelected ? 'verified' : 'neutral'} size="sm">
                              {persona.tag}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#14131F]/60 font-sans leading-relaxed">
                            {persona.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Evaluation Scoring Criteria Matrix */}
            <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3.5 text-left font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#14131F] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#4338CA]" />
                  <span>Evaluation Dimensions & Weight Distribution</span>
                </span>
                <span className="text-xs text-[#14131F]/50 font-sans">
                  Total: 100% weighted composite
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-xl border border-[#14131F]/8 space-y-1">
                  <span className="font-display font-bold text-[#14131F] flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-[#4338CA]" /> Body Posture (20%)
                  </span>
                  <p className="text-[11px] text-[#14131F]/60 font-sans leading-relaxed">
                    Head tilt, spine uprightness, and seating frame symmetry.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#14131F]/8 space-y-1">
                  <span className="font-display font-bold text-[#14131F] flex items-center gap-1.5 text-xs">
                    <Eye className="w-3.5 h-3.5 text-[#4338CA]" /> Eye Contact (20%)
                  </span>
                  <p className="text-[11px] text-[#14131F]/60 font-sans leading-relaxed">
                    Camera lens gaze tracking vector, stability, and blink frequency.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#14131F]/8 space-y-1">
                  <span className="font-display font-bold text-[#14131F] flex items-center gap-1.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-[#4338CA]" /> Confidence (20%)
                  </span>
                  <p className="text-[11px] text-[#14131F]/60 font-sans leading-relaxed">
                    Facial poise, lack of fidgeting, and steady answer cadence.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#14131F]/8 space-y-1">
                  <span className="font-display font-bold text-[#14131F] flex items-center gap-1.5 text-xs">
                    <Mic className="w-3.5 h-3.5 text-[#4338CA]" /> Technical Depth (40%)
                  </span>
                  <p className="text-[11px] text-[#14131F]/60 font-sans leading-relaxed">
                    STAR framework adherence, edge case handling, and algorithmic accuracy.
                  </p>
                </div>
              </div>
            </div>

            {/* Launch Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#14131F]/8 text-left font-sans">
              <div className="space-y-1">
                <div className="text-xs text-[#14131F]/65 font-sans">
                  Configured: <strong className="text-[#14131F] font-semibold">{companyDisplayName}</strong> • Role: <strong className="text-[#14131F] font-semibold">{jobRoleDisplayName}</strong>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {isLoadingQuestions ? (
                    <span className="flex items-center gap-1 text-[#14131F]/60 font-sans">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4338CA]" /> Fetching verified questions...
                    </span>
                  ) : activeQuestions.some((q) => q.source === 'real') ? (
                    <Badge variant="positive" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-[#14131F]" />}>
                      {activeQuestions.filter((q) => q.source === 'real').length} verified question{activeQuestions.filter((q) => q.source === 'real').length > 1 ? 's' : ''} from company experiences
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm" icon={<Sparkles className="w-3 h-3 text-[#14131F]/60" />} className="bg-[#14131F]/5 text-[#14131F]">
                      AI questions grounded on {companyDisplayName} hiring bar
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleStartInterview}
                icon={<Camera className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Launch Live Webcam AI Mock Test
              </Button>
            </div>
          </div>
        )}

        {/* ================= 2. ACTIVE INTERVIEW SESSION VIEW ================= */}
        {sessionState === 'active' && (
          <div className="space-y-6 pt-1 font-sans">
            {/* Top Session Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185] animate-ping shrink-0" />
                <span className="font-display font-bold text-sm text-[#14131F]">
                  Live Session: {companyDisplayName}
                </span>
                <Badge variant="neutral" size="sm">
                  {jobRoleDisplayName}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-sans">
                <div className="flex items-center gap-1.5 text-[#14131F]/70">
                  <Clock className="w-3.5 h-3.5 text-[#14131F]/40" />
                  <span>Time: <strong className="text-[#14131F] font-semibold">{formatTimer(elapsedTime)}</strong></span>
                </div>
                <span className="text-[#14131F]/60">
                  Question: <strong className="text-[#14131F] font-semibold">{currentQuestionIdx + 1} of {questionsList.length}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className={`w-3.5 h-3.5 ${actualViolationsCount > 0 ? 'text-[#FB7185]' : 'text-[#14131F]/40'}`} />
                  <span className="text-[#14131F]/70">
                    Proctoring violations:{' '}
                    <strong className={`font-semibold ${actualViolationsCount > 0 ? 'text-[#FB7185]' : 'text-[#14131F]'}`}>
                      {actualViolationsCount}/{MAX_PROCTORING_VIOLATIONS}
                    </strong>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  icon={<XCircle className="w-3.5 h-3.5 text-[#FB7185]" />}
                  className="text-[#FB7185] hover:bg-[#FB7185]/10"
                >
                  Stop Interview
                </Button>
              </div>
            </div>

            {/* Warning State Banner when Violation Occurs */}
            {actualViolationsCount > 0 && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  actualViolationsCount >= 2
                    ? 'bg-[#FB7185]/10 border-[#FB7185]/30 text-[#FB7185]'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${actualViolationsCount >= 2 ? 'text-[#FB7185]' : 'text-amber-600'}`} />
                  <span className="leading-snug">
                    <strong className="font-semibold">Proctoring Notice:</strong> Proctoring violations:{' '}
                    <strong>{actualViolationsCount}/{MAX_PROCTORING_VIOLATIONS}</strong>.
                    {actualViolationsCount >= 2
                      ? ' Warning: One more violation will immediately and automatically terminate this interview!'
                      : ' Notice: Reaching 3 violations will automatically terminate the interview.'}
                  </span>
                </div>
                <Badge variant={actualViolationsCount >= 2 ? 'warning' : 'neutral'} size="sm">
                  {actualViolationsCount}/{MAX_PROCTORING_VIOLATIONS}
                </Badge>
              </div>
            )}

            {/* Split Screen: Live Webcam Feed + AI Interviewer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN: LIVE WEBCAM FEED & COMPUTER VISION OVERLAY */}
              <div className="space-y-4">
                <div className="relative rounded-2xl bg-slate-950 border border-[#14131F]/15 overflow-hidden shadow-xs aspect-video flex items-center justify-center">
                  {/* Real HTML5 Video element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${!webcamActive ? 'hidden' : ''}`}
                  />

                  {/* Fallback display if webcam permission denied or inactive */}
                  {!webcamActive && (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-xl border border-white/20 bg-white/10 flex items-center justify-center mx-auto text-white/60">
                        <Camera className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-display font-bold text-white">AI Vision Simulation Active</h4>
                      <p className="text-xs text-white/60 max-w-xs mx-auto font-sans leading-relaxed">
                        {cameraError || 'Simulating camera posture tracking, eye contact gaze vector, and facial composure.'}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={startWebcam}
                        className="text-white border-white/30 hover:bg-white/10 bg-transparent"
                      >
                        Enable Camera Hardware
                      </Button>
                    </div>
                  )}

                  {/* REAL-TIME COMPUTER VISION POSE & GAZE OVERLAY */}
                  <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                    {/* Face Detection Warning Banner */}
                    {webcamActive && (!faceDetected || faceCount > 1) && (
                      <div className="absolute top-12 left-3 right-3 z-20 p-2.5 rounded-xl bg-[#FB7185] text-white font-sans font-medium text-xs flex items-center justify-center gap-2 border border-white/20 shadow-lg">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                        <span>
                          {!faceDetected
                            ? 'No face detected — please align your face with the camera'
                            : `Multiple faces detected (${faceCount}) — ensure only 1 candidate is in frame`}
                        </span>
                      </div>
                    )}

                    {/* MediaPipe Model Loading Banner */}
                    {isVisionModelLoading && (
                      <div className="absolute top-12 left-3 z-20 px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-sans flex items-center gap-2 border border-white/20 shadow-xs">
                        <Loader2 className="w-3.5 h-3.5 text-[#A3E635] animate-spin" />
                        <span>Initializing MediaPipe AI tracker...</span>
                      </div>
                    )}

                    {/* Eye Contact Below 50% Warning Banner (Rule 3) */}
                    {webcamActive && activeEyeContactWarning && (
                      <div className="absolute top-12 left-3 right-3 z-20 p-2.5 rounded-xl bg-[#FB7185] text-white font-sans font-medium text-xs flex items-center justify-center gap-2 border border-white/20 shadow-lg animate-in fade-in duration-200">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                        <span>
                          <strong>⚠ Eye Contact Violation:</strong> Eye contact remained below 50% for 3 seconds.
                        </span>
                      </div>
                    )}

                    {/* Top Vision Badges */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-black/70 text-xs font-sans text-[#A3E635] border border-[#A3E635]/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                        Vision Tracking: Active
                      </span>

                      <span className="px-2.5 py-1 rounded-md bg-black/70 text-xs font-sans text-white border border-white/20">
                        Gaze: {eyeContactStatusText} ({liveEyeContactScore}%)
                      </span>
                    </div>

                    {/* Center Posture Bounding Box */}
                    <div
                      className={`relative w-44 h-44 mx-auto rounded-2xl border-2 ${
                        !faceDetected
                          ? 'border-[#FB7185]/80 bg-[#FB7185]/10'
                          : faceCount > 1
                          ? 'border-amber-400/80'
                          : 'border-[#A3E635]/60'
                      } flex items-center justify-center transition-colors`}
                    >
                      <div
                        className={`absolute -top-3 px-2 py-0.5 rounded-full ${
                          !faceDetected
                            ? 'bg-[#FB7185] text-white'
                            : faceCount > 1
                            ? 'bg-amber-400 text-slate-900 font-semibold'
                            : 'bg-[#A3E635] text-slate-900 font-semibold'
                        } text-[10px] font-sans`}
                      >
                        {!faceDetected ? 'Face absent' : faceCount > 1 ? `Multiple faces (${faceCount})` : 'Pose centered'}
                      </div>
                      {/* Subtle Crosshairs */}
                      <div
                        className={`w-2.5 h-2.5 rounded-full border-2 ${
                          !faceDetected ? 'border-[#FB7185] animate-ping' : 'border-[#A3E635] animate-ping'
                        }`}
                      />
                      {/* Shoulder alignment level line */}
                      <div className="absolute bottom-4 w-36 h-0.5 bg-[#A3E635]/80 border-t border-dashed border-[#A3E635]/40" />
                    </div>

                    {/* Bottom Video HUD Overlay */}
                    <div className="p-2.5 rounded-xl bg-black/80 border border-white/20 grid grid-cols-2 gap-2 text-xs font-sans">
                      <div>
                        <span className="text-white/60">Body Posture:</span>{' '}
                        <strong className="text-[#A3E635]">{livePostureScore}% ({postureStatusText})</strong>
                      </div>
                      <div>
                        <span className="text-white/60">Eye Contact:</span>{' '}
                        <strong className="text-amber-400">{liveEyeContactScore}% ({eyeContactStatusText})</strong>
                      </div>
                      <div>
                        <span className="text-white/60">Confidence:</span>{' '}
                        <strong className="text-white">{liveConfidenceScore}% ({confidenceStatusText})</strong>
                      </div>
                      <div>
                        <span className="text-white/60">Face Detection:</span>{' '}
                        <strong className={!faceDetected ? 'text-[#FB7185]' : faceCount > 1 ? 'text-amber-400' : 'text-[#A3E635]'}>
                          {!faceDetected ? '0 faces' : `${faceCount} face${faceCount > 1 ? 's' : ''}`}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Metric Cards below camera */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8">
                    <span className="text-[11px] text-[#14131F]/50 block font-sans">Posture</span>
                    <p className="text-lg font-display font-bold text-[#14131F] mt-0.5">{livePostureScore}%</p>
                  </div>
                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8">
                    <span className="text-[11px] text-[#14131F]/50 block font-sans">Eye Contact</span>
                    <p className="text-lg font-display font-bold text-[#14131F] mt-0.5">{liveEyeContactScore}%</p>
                  </div>
                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8">
                    <span className="text-[11px] text-[#14131F]/50 block font-sans">Confidence</span>
                    <p className="text-lg font-display font-bold text-[#14131F] mt-0.5">{liveConfidenceScore}%</p>
                  </div>
                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8">
                    <span className="text-[11px] text-[#14131F]/50 block font-sans">Communication</span>
                    <p className="text-lg font-display font-bold text-[#14131F] mt-0.5">{liveCommScore}%</p>
                  </div>
                </div>

                {/* Proctoring Log Panel */}
                <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#4338CA]" />
                      <h4 className="text-xs font-display font-bold text-[#14131F]">Proctoring Integrity Feed</h4>
                    </div>
                    <Badge variant={actualViolationsCount === 0 ? 'positive' : actualViolationsCount >= 2 ? 'warning' : 'warning'} size="sm">
                      Proctoring violations: {actualViolationsCount}/{MAX_PROCTORING_VIOLATIONS}
                    </Badge>
                  </div>

                  {violations.length === 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-[#14131F]/8 text-xs text-[#14131F]/60 flex items-center gap-2 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#14131F] shrink-0" />
                      <span>Zero integrity violations logged. Attention steady.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {violations.map((v) => (
                        <div
                          key={v.id}
                          className="p-2.5 bg-white rounded-lg border border-[#14131F]/8 flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5">
                              {v.type === 'face_lost' && <AlertTriangle className="w-3.5 h-3.5 text-[#FB7185] shrink-0" />}
                              {v.type === 'multiple_faces' && <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              {v.type === 'looking_away' && <EyeOff className="w-3.5 h-3.5 text-[#14131F]/60 shrink-0" />}
                              {v.type === 'EYE_CONTACT' && <EyeOff className="w-3.5 h-3.5 text-[#FB7185] shrink-0" />}
                              {(v.type === 'CONNECTED_DEVICE_DETECTED' || v.type === 'CONNECTED_DEVICE_DISCONNECTED') && (
                                <Usb className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                              )}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-[#14131F] font-sans">
                                <span>
                                  {v.type === 'face_lost'
                                    ? 'Face Absent (>3s)'
                                    : v.type === 'multiple_faces'
                                    ? 'Multiple Faces'
                                    : v.type === 'looking_away'
                                    ? 'Looking Away (>5s)'
                                    : v.type === 'EYE_CONTACT'
                                    ? 'Eye Contact (<50% >3s)'
                                    : v.type === 'CONNECTED_DEVICE_DETECTED'
                                    ? 'Connected Device'
                                    : v.type === 'CONNECTED_DEVICE_DISCONNECTED'
                                    ? 'Device Disconnected'
                                    : v.type}
                                </span>
                                {v.durationMs !== undefined && (
                                  <span className="text-xs text-[#14131F]/50">
                                    ({(v.durationMs / 1000).toFixed(1)}s)
                                  </span>
                                )}
                                {v.isInformational && (
                                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                                    Informational
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#14131F]/60 mt-0.5 font-sans">{v.details}</p>
                            </div>
                          </div>
                          <span className="text-xs text-[#14131F]/40 shrink-0">{v.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connected Device Monitoring Indicator (Rule 2) */}
                <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Usb
                        className={`w-3.5 h-3.5 shrink-0 ${
                          deviceMonitoringStatus === 'device_detected'
                            ? 'text-amber-500'
                            : deviceMonitoringStatus === 'available'
                            ? 'text-[#A3E635]'
                            : deviceMonitoringStatus === 'permission_required'
                            ? 'text-[#4338CA]'
                            : 'text-[#14131F]/40'
                        }`}
                      />
                      <span className="font-semibold text-xs text-[#14131F]">
                        {deviceMonitoringStatus === 'device_detected' && 'Connected device detected'}
                        {deviceMonitoringStatus === 'available' && 'Device monitoring: Available'}
                        {deviceMonitoringStatus === 'permission_required' && 'Device monitoring: Permission required'}
                        {deviceMonitoringStatus === 'unsupported' && 'Device monitoring: Not supported by this browser'}
                      </span>
                      {deviceMonitoringStatus === 'device_detected' && (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                          Informational
                        </span>
                      )}
                    </div>

                    {deviceMonitoringStatus !== 'unsupported' && (
                      <button
                        type="button"
                        onClick={() => setShowDevicePermModal(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#14131F] bg-white hover:bg-[#14131F]/5 border border-[#14131F]/10 rounded-lg transition-colors shadow-2xs"
                      >
                        <Usb className="w-3 h-3 text-[#14131F]/60" />
                        <span>Check Devices</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#14131F]/50 leading-relaxed">
                    Connected-device monitoring is limited by browser security and supported device APIs. It cannot detect every physical device connected to the computer.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: AI INTERVIEWER INTERACTION & QUESTION */}
              <div className="p-6 bg-[#FAFAF8] rounded-2xl border border-[#14131F]/8 flex flex-col justify-between space-y-5 text-left">
                <div className="space-y-4">
                  {/* Interviewer Persona Card */}
                  <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#14131F]/8 text-left">
                    <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 flex items-center justify-center text-[#4338CA] shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-display font-bold text-[#14131F]">{interviewerPersona}</h4>
                      <p className="text-xs text-[#14131F]/60 font-sans">Interrogating for: {companyDisplayName} • {jobRoleDisplayName}</p>
                    </div>
                  </div>

                  {/* Active Question Box */}
                  <div className="p-5 bg-white rounded-xl border border-[#14131F]/8 space-y-3 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">
                          Question #{currentQuestionIdx + 1}
                        </Badge>
                        {activeQuestions[currentQuestionIdx]?.source === 'real' ? (
                          <Badge variant="positive" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-[#14131F]" />}>
                            Actually asked at {companyDisplayName}
                          </Badge>
                        ) : (
                          <Badge variant="muted" size="sm" icon={<Sparkles className="w-3 h-3 text-[#14131F]/60" />}>
                            AI Grounded
                          </Badge>
                        )}
                      </div>
                      <span className="text-[#14131F]/50 font-sans">Target: 2:00 mins</span>
                    </div>
                    <p className="font-display font-bold text-base sm:text-lg text-[#14131F] leading-snug">
                      "{activeQuestions[currentQuestionIdx]?.text || questionsList[currentQuestionIdx]}"
                    </p>
                  </div>

                  {/* Candidate Answer Input / Real Voice Dictation */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs text-[#14131F]/60 font-sans">
                      <span className="font-medium text-[#14131F]">Speak into microphone or type technical answer:</span>
                      <Button
                        type="button"
                        variant={isAnswerRecording ? 'brick' : 'secondary'}
                        size="sm"
                        onClick={toggleDictation}
                        icon={<Mic className="w-3.5 h-3.5" />}
                        className={isAnswerRecording ? 'animate-pulse' : ''}
                      >
                        {isAnswerRecording ? 'Listening...' : 'Voice Dictate'}
                      </Button>
                    </div>

                    {dictationError && (
                      <div className="p-2.5 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-lg text-[#FB7185] text-xs font-sans font-medium flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FB7185] shrink-0" />
                        <span>{dictationError}</span>
                      </div>
                    )}

                    <textarea
                      value={userAnswerInput}
                      onChange={(e) => {
                        setUserAnswerInput(e.target.value);
                        if (dictationError) setDictationError(null);
                      }}
                      rows={5}
                      placeholder="Type your technical response here or click Voice Dictate to speak. Highlight architectural tradeoffs, data structures, and edge cases..."
                      className="w-full bg-white border border-[#14131F]/15 rounded-xl p-3.5 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 leading-relaxed resize-none font-sans transition-all"
                    />
                  </div>
                </div>

                {/* Evaluating feedback banner during evaluation */}
                {isEvaluating && (
                  <div className="p-3 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-xl text-xs font-sans text-[#4338CA] flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#4338CA]" />
                    <span>Evaluating your response with AI assessor...</span>
                  </div>
                )}

                {/* Session Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                    icon={<XCircle className="w-3.5 h-3.5 text-[#14131F]/60" />}
                  >
                    Cancel Session
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNextQuestion}
                    disabled={isEvaluating}
                    icon={isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                  >
                    {isEvaluating
                      ? 'Evaluating response...'
                      : currentQuestionIdx + 1 === questionsList.length
                      ? 'Submit Final Answer'
                      : 'Submit & Next Question'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. COMPREHENSIVE AI MOCK TEST SCORE REPORT ================= */}
        {sessionState === 'completed' && (
          <div className="space-y-6 pt-1 font-sans">
            {isGeneratingReport ? (
              <div className="p-12 bg-white rounded-2xl border border-[#14131F]/8 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#4338CA]/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4338CA]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-[#14131F]">Evaluating your interview performance...</h3>
                  <p className="text-xs text-[#14131F]/60 max-w-md mx-auto font-sans">
                    Analyzing multimodal session metrics, posture alignment logs, and technical depth with AI.
                  </p>
                </div>
              </div>
            ) : reportError || !finalReport ? (
              <div className="p-8 bg-white rounded-2xl border border-[#FB7185]/30 text-center space-y-5 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#FB7185]/10 text-[#FB7185] flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-[#FB7185]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-lg text-[#FB7185]">Report generation failed</h3>
                  <p className="text-xs sm:text-sm text-[#14131F]/60 max-w-md mx-auto font-sans">
                    {reportError || 'Failed to generate your score report. Please check your connection and try again.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="brick"
                    size="sm"
                    onClick={() => calculateFinalReport(questionLogs, sessionId || undefined, violations)}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Retry Report Generation
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSessionState('idle')}
                  >
                    Return to Setup
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Flagged for Review Warning Banner (only if flagged or proctoring < 40) */}
                {(finalReport.flaggedForReview || (finalReport.proctoringScore !== undefined && finalReport.proctoringScore < 40)) && (
                  <div className="p-5 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-2xl text-[#14131F] flex items-start gap-4 text-left">
                    <div className="p-2 rounded-xl bg-[#FB7185]/20 text-[#FB7185] shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-[#FB7185]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-base text-[#14131F]">This session was flagged for proctoring violations</h4>
                        <Badge variant="warning" size="sm">
                          Manual review required
                        </Badge>
                      </div>
                      <p className="text-xs font-sans text-[#14131F]/70 leading-relaxed">
                        {finalReport.reviewNote ||
                          'This session had significant proctoring violations (Proctoring Score < 40%) and should be manually reviewed before making a final hiring decision.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Top Score Banner */}
                <div className="p-6 sm:p-8 bg-white rounded-2xl border border-[#14131F]/8 space-y-6 text-left shadow-xs">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#14131F]/8 pb-6">
                    <div className="space-y-1.5">
                      <Badge variant="positive" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-[#14131F]" />}>
                        AI Evaluation Completed
                      </Badge>
                      <h3 className="font-display font-bold text-2xl text-[#14131F]">Interview Performance Assessment</h3>
                      <p className="text-xs text-[#14131F]/65 font-sans">
                        Target Company: <strong className="text-[#14131F] font-semibold">{finalReport.companyFitName}</strong> • Role: <strong className="text-[#14131F] font-semibold">{finalReport.jobRoleName}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-center min-w-[130px]">
                        <span className="text-[11px] text-[#14131F]/50 block font-sans">Overall AI Score</span>
                        <div className="text-3xl font-display font-bold text-[#14131F] mt-1">{finalReport.overallScore} / 100</div>
                      </div>

                      {finalReport.proctoringScore !== undefined && (
                        <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-center min-w-[140px]">
                          <span className="text-[11px] text-[#14131F]/50 block font-sans">Proctoring Integrity</span>
                          <div
                            className={`text-3xl font-display font-bold mt-1 ${
                              finalReport.proctoringScore >= 80
                                ? 'text-[#14131F]'
                                : finalReport.proctoringScore >= 60
                                ? 'text-amber-500'
                                : 'text-[#FB7185]'
                            }`}
                          >
                            {finalReport.proctoringScore}%
                          </div>
                          <span className="text-[10px] text-[#14131F]/50 font-sans block mt-0.5">
                            Face alignment & gaze
                          </span>
                        </div>
                      )}

                      <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 text-center min-w-[140px]">
                        <span className="text-[11px] text-[#14131F]/50 block font-sans">Recommendation</span>
                        <div className="mt-1.5">
                          <Badge
                            variant={
                              finalReport.verdict === 'STRONG HIRE' || finalReport.verdict === 'HIRE'
                                ? 'positive'
                                : finalReport.verdict === 'BORDERLINE'
                                ? 'neutral'
                                : 'warning'
                            }
                            size="md"
                            className="text-xs font-display font-bold"
                          >
                            {finalReport.verdict}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5 Core Dimensions Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Body Posture */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F] flex items-center gap-1.5 font-sans">
                          <UserCheck className="w-3.5 h-3.5 text-[#4338CA]" /> Posture
                        </span>
                        <span className="text-xs font-bold text-[#14131F]">{finalReport.postureScore}%</span>
                      </div>
                      <div className="w-full bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${finalReport.postureScore < 60 ? 'bg-[#FB7185]' : 'bg-[#4338CA]'}`}
                          style={{ width: `${finalReport.postureScore}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#14131F]/60 font-sans">Spine alignment & symmetry.</p>
                    </div>

                    {/* Eye Contact */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F] flex items-center gap-1.5 font-sans">
                          <Eye className="w-3.5 h-3.5 text-[#4338CA]" /> Eye Contact
                        </span>
                        <span className="text-xs font-bold text-[#14131F]">{finalReport.eyeContactScore}%</span>
                      </div>
                      <div className="w-full bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${finalReport.eyeContactScore < 60 ? 'bg-[#FB7185]' : 'bg-[#A3E635]'}`}
                          style={{ width: `${finalReport.eyeContactScore}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#14131F]/60 font-sans">Lens focus & gaze stability.</p>
                    </div>

                    {/* Confidence */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F] flex items-center gap-1.5 font-sans">
                          <Zap className="w-3.5 h-3.5 text-[#4338CA]" /> Confidence
                        </span>
                        <span className="text-xs font-bold text-[#14131F]">{finalReport.confidenceScore}%</span>
                      </div>
                      <div className="w-full bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${finalReport.confidenceScore < 60 ? 'bg-[#FB7185]' : 'bg-[#4338CA]'}`}
                          style={{ width: `${finalReport.confidenceScore}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#14131F]/60 font-sans">Facial poise & composure.</p>
                    </div>

                    {/* Communication */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F] flex items-center gap-1.5 font-sans">
                          <Mic className="w-3.5 h-3.5 text-[#4338CA]" /> Clarity
                        </span>
                        <span className="text-xs font-bold text-[#14131F]">{finalReport.commScore}%</span>
                      </div>
                      <div className="w-full bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${finalReport.commScore < 60 ? 'bg-[#FB7185]' : 'bg-[#A3E635]'}`}
                          style={{ width: `${finalReport.commScore}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#14131F]/60 font-sans">STAR structure & cadence.</p>
                    </div>

                    {/* Technical Depth */}
                    <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-2 col-span-2 sm:col-span-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#14131F] flex items-center gap-1.5 font-sans">
                          <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" /> Technical
                        </span>
                        <span className="text-xs font-bold text-[#14131F]">{finalReport.techScore}%</span>
                      </div>
                      <div className="w-full bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${finalReport.techScore < 60 ? 'bg-[#FB7185]' : 'bg-[#4338CA]'}`}
                          style={{ width: `${finalReport.techScore}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#14131F]/60 font-sans">Domain & answer accuracy.</p>
                    </div>
                  </div>

                  {/* Strengths & Actionable Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    {/* Key Strengths - Lime accent */}
                    <div className="p-5 bg-[#A3E635]/15 border border-[#A3E635]/35 rounded-xl space-y-2.5 text-left">
                      <h4 className="font-display font-bold text-sm text-[#14131F] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#14131F]" />
                        <span>Key Candidate Strengths</span>
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside text-[#14131F]/80 leading-relaxed font-sans">
                        {finalReport.strengths && finalReport.strengths.length > 0 ? (
                          finalReport.strengths.map((str, idx) => (
                            <li key={idx}>{str}</li>
                          ))
                        ) : (
                          <li>Demonstrated solid technical understanding throughout the session.</li>
                        )}
                      </ul>
                    </div>

                    {/* Actionable Improvements - Coral accent only for genuine improvement */}
                    <div className="p-5 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl space-y-2.5 text-left">
                      <h4 className="font-display font-bold text-sm text-[#14131F] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#FB7185]" />
                        <span>Actionable AI Recommendations</span>
                      </h4>
                      <ul className="space-y-1.5 list-disc list-inside text-[#14131F]/80 leading-relaxed font-sans">
                        {finalReport.improvements && finalReport.improvements.length > 0 ? (
                          finalReport.improvements.map((imp, idx) => (
                            <li key={idx}>{imp}</li>
                          ))
                        ) : (
                          <li>Continue practicing structured STAR framework responses.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Proctoring Audit Log Summary */}
                  {finalReport.violations !== undefined && (
                    <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-3 text-left">
                      <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-2.5">
                        <h4 className="text-xs font-display font-bold text-[#14131F] flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-[#4338CA]" />
                          <span>Proctoring Audit Summary</span>
                        </h4>
                        <span className="text-xs px-2.5 py-0.5 bg-white text-[#14131F]/60 border border-[#14131F]/8 rounded-full">
                          Total flags: {finalReport.violations.length}
                        </span>
                      </div>

                      {finalReport.violations.length === 0 ? (
                        <div className="p-3 bg-white rounded-lg border border-[#14131F]/8 text-xs text-[#14131F] flex items-center gap-2 font-sans">
                          <CheckCircle2 className="w-4 h-4 text-[#14131F] shrink-0" />
                          <span>No proctoring violations detected throughout this session.</span>
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs">
                          {finalReport.violations.map((v) => {
                            const formattedType =
                              v.type === 'face_lost'
                                ? 'Face not visible'
                                : v.type === 'multiple_faces'
                                ? 'Multiple people detected'
                                : v.type === 'looking_away'
                                ? 'Looking away from screen'
                                : v.type === 'EYE_CONTACT'
                                ? 'Eye Contact Violation (<50% >3s)'
                                : v.type === 'CONNECTED_DEVICE_DETECTED'
                                ? 'Connected device (Informational)'
                                : v.type === 'CONNECTED_DEVICE_DISCONNECTED'
                                ? 'Device disconnected (Informational)'
                                : v.type;

                            return (
                              <div
                                key={v.id}
                                className="p-3 bg-white rounded-lg border border-[#14131F]/8 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="font-semibold text-[#14131F] font-sans">{formattedType}</span>
                                  <span className="text-[#14131F]/60 font-sans">{v.details}</span>
                                  {v.durationMs !== undefined && (
                                    <span className="text-xs text-[#FB7185] bg-[#FB7185]/10 px-1.5 py-0.5 rounded border border-[#FB7185]/20">
                                      {(v.durationMs / 1000).toFixed(1)}s
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-[#14131F]/40 shrink-0">{v.timestamp}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question-by-Question Evaluation Breakdown */}
                  <div className="space-y-3 pt-2 text-left">
                    <h4 className="text-sm font-display font-bold text-[#14131F] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#4338CA]" />
                      <span>Question-by-Question Evaluation Breakdown</span>
                    </h4>

                    <div className="space-y-3">
                      {questionLogs.map((log, idx) => (
                        <RecordCard
                          key={idx}
                          title={`Q${idx + 1}: ${log.question}`}
                          action={
                            <Badge
                              variant={log.techScore >= 70 ? 'positive' : log.techScore >= 40 ? 'neutral' : 'warning'}
                              size="sm"
                            >
                              Score: {log.techScore}/100
                            </Badge>
                          }
                          subtitle={
                            log.source === 'real' ? (
                              <span className="inline-flex items-center gap-1 text-[#14131F] font-semibold text-xs">
                                <CheckCircle2 className="w-3 h-3 text-[#14131F] shrink-0" />
                                <span>Asked at {finalReport?.companyFitName || companyDisplayName}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#14131F]/50 font-medium text-xs">
                                <Sparkles className="w-3 h-3 text-[#14131F]/50 shrink-0" />
                                <span>AI Grounded</span>
                              </span>
                            )
                          }
                        >
                          <div className="space-y-2.5 text-xs font-sans mt-2">
                            <p className="text-[#14131F]/70 italic font-sans leading-relaxed">
                              "{log.answer}"
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#14131F]/60 pt-1.5 border-t border-[#14131F]/8">
                              <span>Posture: <strong className="text-[#14131F]">{log.postureScore}%</strong></span>
                              <span>•</span>
                              <span>Eye contact: <strong className="text-[#14131F]">{log.eyeContactScore}%</strong></span>
                              <span>•</span>
                              <span>Confidence: <strong className="text-[#14131F]">{log.confidenceScore}%</strong></span>
                              <span>•</span>
                              <span>Communication: <strong className="text-[#14131F]">{log.commScore}%</strong></span>
                            </div>
                            <div className="text-xs text-[#14131F] bg-[#FAFAF8] p-3 rounded-lg border border-[#14131F]/8">
                              <strong className="font-semibold text-[#14131F]">AI Assessor Note:</strong>{' '}
                              <span className="text-[#14131F]/80">{log.aiFeedback}</span>
                            </div>
                          </div>
                        </RecordCard>
                      ))}
                    </div>
                  </div>

                  {/* Final Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#14131F]/8">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSessionState('idle')}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Practice Another Target Company
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSaveToastMsg(`Score certificate saved to profile for ${finalReport.companyFitName} — ${finalReport.jobRoleName}.`);
                        setTimeout(() => setSaveToastMsg(null), 4000);
                      }}
                    >
                      Save Score Certificate
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. PROCTORING TERMINATION VIEW ================= */}
        {sessionState === 'terminated' && (
          <div className="space-y-6 pt-1 font-sans">
            <div className="p-8 sm:p-10 bg-white rounded-2xl border border-[#FB7185]/30 text-center space-y-6 shadow-xs max-w-2xl mx-auto">
              {/* Termination Alert Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#FB7185]/10 text-[#FB7185] flex items-center justify-center mx-auto border border-[#FB7185]/20">
                <ShieldAlert className="w-7 h-7 text-[#FB7185]" />
              </div>

              {/* Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FB7185]/10 border border-[#FB7185]/25 text-[#FB7185] text-xs font-semibold uppercase tracking-wider">
                  Proctoring Security Enforcement
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#14131F]">
                  Interview Terminated
                </h2>
                <p className="text-xs sm:text-sm text-[#14131F]/70 max-w-md mx-auto leading-relaxed">
                  {terminationData?.reason === MULTIPLE_VIOLATIONS_TERMINATION_REASON
                    ? 'Interview terminated automatically after multiple proctoring violations.'
                    : 'Your mock interview session has been permanently terminated due to an active proctoring violation.'}
                </p>
              </div>

              {/* Termination Details Ledger */}
              <div className="p-5 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 text-left space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-2.5">
                  <span className="text-xs text-[#14131F]/60 font-medium">Status</span>
                  <Badge variant="warning" size="sm">
                    Terminated
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-2.5">
                  <span className="text-xs text-[#14131F]/60 font-medium">Violation Code</span>
                  <span className="text-xs font-mono font-bold text-[#FB7185] bg-[#FB7185]/10 px-2 py-0.5 rounded">
                    {terminationData?.reason || MULTIPLE_VIOLATIONS_TERMINATION_REASON}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs text-[#14131F]/60 font-medium block">Reason</span>
                  <p className="text-xs text-[#14131F] font-semibold bg-[#FB7185]/5 p-3 rounded-lg border border-[#FB7185]/20 leading-relaxed">
                    {terminationData?.remark || MULTIPLE_VIOLATIONS_TERMINATION_REMARK}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#14131F]/8 text-xs text-[#14131F]/70">
                  <span className="font-medium">Total Violations Incurred</span>
                  <span className="font-semibold text-[#FB7185]">
                    {actualViolationsCount} / {MAX_PROCTORING_VIOLATIONS}
                  </span>
                </div>
                {terminationData?.timestamp && (
                  <div className="flex items-center justify-between text-[11px] text-[#14131F]/50">
                    <span>Recorded At</span>
                    <span>{new Date(terminationData.timestamp).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Recorded Violations Feed */}
              {violations.length > 0 && (
                <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#14131F]">Recorded Integrity Logs ({violations.length})</h4>
                    <span className="text-[11px] text-[#14131F]/50">
                      Actual violations: {actualViolationsCount}/{MAX_PROCTORING_VIOLATIONS}
                    </span>
                  </div>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                    {violations.map((v, i) => (
                      <li
                        key={v.id || i}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                          v.isInformational
                            ? 'bg-white border-[#14131F]/8 text-[#14131F]/60'
                            : 'bg-[#FB7185]/5 border-[#FB7185]/20 text-[#14131F]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-black/5">
                            {v.type}
                          </span>
                          <span className="text-xs">{v.details || 'Integrity event recorded'}</span>
                        </div>
                        {v.timestamp && <span className="text-[11px] text-[#14131F]/40 shrink-0">{v.timestamp}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Policy Advisory Notice */}
              <div className="p-4 bg-[#FAFAF8] border border-[#14131F]/10 rounded-xl text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-[#14131F]/75 leading-relaxed">
                  {terminationData?.reason === MULTIPLE_VIOLATIONS_TERMINATION_REASON
                    ? 'In accordance with PlacementOS proctoring regulations, reaching 3 proctoring violations automatically terminates the interview session. This attempt has been logged in your candidate record and cannot be resumed.'
                    : 'In accordance with PlacementOS proctoring regulations, leaving the active interview tab, switching windows, or navigating away immediately invalidates the interview session. This attempt has been logged in your candidate record and cannot be resumed.'}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-center">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setSessionState('idle');
                    setTerminationData(null);
                  }}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Return to Interview Setup
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL INTERVIEW CONFIRMATION MODAL */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-[#14131F]/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-[#14131F]/10 space-y-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FB7185]/10 text-[#FB7185] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-[#FB7185]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg text-[#14131F]">Cancel Active Mock Interview?</h3>
                <p className="text-xs text-[#14131F]/65 leading-relaxed font-sans">
                  Are you sure you want to stop and exit this live interview session for <strong className="text-[#14131F] font-semibold">{companyDisplayName}</strong>? Your current session progress will be discarded and camera tracking stopped.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCancelModal(false)}
                  className="w-full sm:w-1/2"
                >
                  Resume Interview
                </Button>
                <Button
                  variant="brick"
                  size="sm"
                  onClick={handleCancelInterview}
                  className="w-full sm:w-1/2"
                >
                  Yes, Cancel & Stop
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CONNECTED DEVICE CHECK PERMISSION MODAL (Rule 2) */}
        {showDevicePermModal && (
          <div className="fixed inset-0 bg-[#14131F]/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-[#14131F]/10 space-y-4 text-left font-sans animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#4338CA]/10 flex items-center justify-center text-[#4338CA]">
                    <Usb className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-[#14131F]">
                    Connected Device Check
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDevicePermModal(false)}
                  className="text-[#14131F]/40 hover:text-[#14131F] transition-colors p-1"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-[#14131F]/70 leading-relaxed">
                <p className="font-medium text-[#14131F]">
                  This interview can check for USB devices that your browser explicitly makes available. Your browser may require permission. Unsupported devices cannot be detected.
                </p>
                <p className="text-[#14131F]/50 text-[11px]">
                  Connected-device monitoring is limited by browser security and supported device APIs. It cannot detect every physical device connected to the computer. Any detected device is logged solely as an informational event and does not terminate the interview or count as a violation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#14131F]/8">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDevicePermModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRequestDevicePermission}
                  icon={<Usb className="w-3.5 h-3.5" />}
                >
                  Request Browser Check
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {saveToastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl text-[#14131F] px-5 py-3.5 shadow-xl border border-[#14131F]/10 text-xs font-sans font-medium flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-4 h-4 text-[#14131F] shrink-0" />
            <span>{saveToastMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
