import mongoose, { Schema, Document } from 'mongoose';

export type AptitudeCategory = 'Quantitative' | 'Logical' | 'Verbal';
export type AptitudeDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface IAptitudeQuestion extends Document {
  category: AptitudeCategory;
  subtopic: string;
  difficulty: AptitudeDifficulty;
  questionTemplate: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  isVariable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AptitudeQuestionSchema: Schema = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['Quantitative', 'Logical', 'Verbal'],
      index: true,
    },
    subtopic: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
      index: true,
    },
    questionTemplate: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length === 4,
        message: 'Aptitude questions must have exactly 4 options',
      },
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    isVariable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const AptitudeQuestion: mongoose.Model<IAptitudeQuestion> =
  (mongoose.models.AptitudeQuestion as mongoose.Model<IAptitudeQuestion>) ||
  mongoose.model<IAptitudeQuestion>('AptitudeQuestion', AptitudeQuestionSchema);
