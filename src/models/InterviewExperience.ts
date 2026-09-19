import mongoose, { Schema, Model } from 'mongoose';

export type ExperienceDifficulty = 'Easy' | 'Medium' | 'Hard';
export type ExperienceOutcome = 'Selected' | 'Rejected' | 'Awaiting Result';
export type ExperienceStatus = 'pending' | 'approved' | 'rejected';
export type QuestionType = 'theory' | 'coding';

export interface IInterviewQuestion {
  text: string;
  type: QuestionType;
}

export interface IInterviewExperience {
  studentId: mongoose.Types.ObjectId | string;
  company: string;
  role: string;
  interviewDate: string | Date;
  roundsDescription: string;
  questionsAsked: IInterviewQuestion[];
  difficulty: ExperienceDifficulty;
  outcome: ExperienceOutcome;
  status: ExperienceStatus;
  reviewedBy?: mongoose.Types.ObjectId | string | null;
  reviewNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Migration-safe helper to normalize questionsAsked array.
 * If an item is a plain string, wraps it as { text: item, type: 'theory' }.
 */
export function normalizeInterviewQuestions(raw: any): IInterviewQuestion[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return trimmed.length > 0 ? { text: trimmed, type: 'theory' as QuestionType } : null;
      }
      if (item && typeof item === 'object') {
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        if (!text) return null;
        const type: QuestionType = item.type === 'coding' ? 'coding' : 'theory';
        return { text, type };
      }
      return null;
    })
    .filter((item): item is IInterviewQuestion => item !== null);
}

const QuestionSchema = new Schema<IInterviewQuestion>(
  {
    text: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['theory', 'coding'],
      default: 'theory',
      required: true,
    },
  },
  { _id: false }
);

const InterviewExperienceSchema = new Schema<IInterviewExperience>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true, index: true },
    role: { type: String, required: true, trim: true },
    interviewDate: { type: Schema.Types.Mixed, required: true },
    roundsDescription: { type: String, required: true },
    questionsAsked: {
      type: [QuestionSchema],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
      default: 'Medium',
    },
    outcome: {
      type: String,
      enum: ['Selected', 'Rejected', 'Awaiting Result'],
      required: true,
      default: 'Awaiting Result',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export const InterviewExperience: Model<IInterviewExperience> =
  (mongoose.models.InterviewExperience as Model<IInterviewExperience>) ||
  mongoose.model<IInterviewExperience>('InterviewExperience', InterviewExperienceSchema);

