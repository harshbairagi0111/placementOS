import mongoose, { Schema, Model } from 'mongoose';

export interface IInterviewQuestionLog {
  question?: string;
  questionText?: string;
  category?: string;
  answer?: string;
  userAnswer?: string;
  postureScore?: number;
  eyeContactScore?: number;
  confidenceScore?: number;
  commScore?: number;
  techScore?: number;
  aiFeedback?: string;
  feedback?: string;
  score?: number;
}

export interface IMockInterviewSession {
  userId?: mongoose.Types.ObjectId | string;
  company: string;
  category: string;
  role?: string;
  targetRole?: string;
  date: string;
  score: number;
  overallScore?: number;
  postureScore?: number;
  eyeContactScore?: number;
  confidenceScore?: number;
  commScore?: number;
  techScore?: number;
  verdict: string;
  feedback?: string;
  type?: string;
  proctoringScore?: number;
  flaggedForReview?: boolean;
  reviewNote?: string;
  violations?: Array<{ id?: string; type: string; timestamp: string; durationMs?: number; details?: string }>;
  deviceEvents?: Array<{
    id?: string;
    type: string;
    timestamp: string;
    api?: string;
    vendorId?: string;
    productId?: string;
    deviceClass?: string;
    detectionStatus?: string;
    details?: string;
    isInformational?: boolean;
  }>;
  status?: string;
  terminationReason?: string;
  remark?: string;
  questionLogs: IInterviewQuestionLog[];
  createdAt?: Date;
  updatedAt?: Date;
}

const InterviewQuestionLogSchema = new Schema<IInterviewQuestionLog>(
  {
    question: { type: String, default: '' },
    questionText: { type: String, default: '' },
    category: { type: String, default: 'General Tech' },
    answer: { type: String, default: '' },
    userAnswer: { type: String, default: '' },
    postureScore: { type: Number, default: 85 },
    eyeContactScore: { type: Number, default: 85 },
    confidenceScore: { type: Number, default: 85 },
    commScore: { type: Number, default: 85 },
    techScore: { type: Number, default: 85 },
    aiFeedback: { type: String, default: '' },
    feedback: { type: String, default: '' },
    score: { type: Number, default: 85 },
  },
  { _id: true }
);

const MockInterviewSessionSchema = new Schema<IMockInterviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    company: { type: String, required: true },
    category: { type: String, required: true },
    role: { type: String, default: 'Software Engineer' },
    targetRole: { type: String, default: 'Software Engineer' },
    date: { type: String, required: true },
    score: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    postureScore: { type: Number, default: 85 },
    eyeContactScore: { type: Number, default: 85 },
    confidenceScore: { type: Number, default: 85 },
    commScore: { type: Number, default: 85 },
    techScore: { type: Number, default: 85 },
    verdict: { type: String, default: 'Hire' },
    feedback: { type: String, default: '' },
    type: { type: String, default: 'AI Mock Interview' },
    proctoringScore: { type: Number, default: 100 },
    flaggedForReview: { type: Boolean, default: false },
    reviewNote: { type: String, default: '' },
    violations: { type: Schema.Types.Mixed, default: [] },
    deviceEvents: { type: Schema.Types.Mixed, default: [] },
    status: { type: String, default: 'active' },
    terminationReason: { type: String, default: '' },
    remark: { type: String, default: '' },
    questionLogs: [InterviewQuestionLogSchema],
  },
  { timestamps: true }
);

export const MockInterviewSession: Model<IMockInterviewSession> =
  (mongoose.models.MockInterviewSession as Model<IMockInterviewSession>) ||
  mongoose.model<IMockInterviewSession>('MockInterviewSession', MockInterviewSessionSchema);
