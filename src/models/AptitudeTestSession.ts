import mongoose, { Schema, Document } from 'mongoose';

export interface IAptitudeSessionQuestion {
  questionId: mongoose.Types.ObjectId | string;
  category?: 'Quantitative' | 'Logical' | 'Verbal';
  subtopic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  selectedAnswerIndex: number | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  explanation?: string;
}

export interface IAptitudeTestSession extends Document {
  userId: mongoose.Types.ObjectId | string;
  mode: 'practice' | 'mock';
  category: 'Quantitative' | 'Logical' | 'Verbal' | null;
  startedAt: Date;
  completedAt?: Date | null;
  timeLimitSeconds: number;
  questions: IAptitudeSessionQuestion[];
  categoryScores: {
    Quantitative: number;
    Logical: number;
    Verbal: number;
  };
  overallScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const AptitudeSessionQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.Mixed,
      required: false,
    },
    category: {
      type: String,
      enum: ['Quantitative', 'Logical', 'Verbal'],
      required: false,
    },
    subtopic: {
      type: String,
      required: false,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: false,
    },
    questionText: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    selectedAnswerIndex: {
      type: Number,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const AptitudeTestSessionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['practice', 'mock'],
      required: true,
      default: 'practice',
    },
    category: {
      type: String,
      enum: ['Quantitative', 'Logical', 'Verbal', null],
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    timeLimitSeconds: {
      type: Number,
      default: 1800, // default 30 minutes
    },
    questions: [AptitudeSessionQuestionSchema],
    categoryScores: {
      Quantitative: { type: Number, default: 0 },
      Logical: { type: Number, default: 0 },
      Verbal: { type: Number, default: 0 },
    },
    overallScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const AptitudeTestSession: mongoose.Model<IAptitudeTestSession> =
  (mongoose.models.AptitudeTestSession as mongoose.Model<IAptitudeTestSession>) ||
  mongoose.model<IAptitudeTestSession>('AptitudeTestSession', AptitudeTestSessionSchema);
