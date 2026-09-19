import mongoose, { Schema, Document } from 'mongoose';

export type SkillCategory = 'technical' | 'soft';
export type SkillDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ISkillQuestion extends Document {
  category: SkillCategory;
  skill: string; // Canonical skill name, e.g. "Data Structures & Algorithms"
  skillId: string; // Canonical skill id, e.g. "dsa"
  difficulty: SkillDifficulty;
  questionText: string;
  scenarioText?: string; // Scenario for soft skills
  codeSnippet?: string; // Optional code block for technical questions
  options: string[];
  correctAnswerIndex?: number; // 0-3 for objective technical questions
  optionWeights?: number[]; // Option point percentages (0-100) for soft skills
  explanation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SkillQuestionSchema = new Schema(
  {
    category: {
      type: String,
      enum: ['technical', 'soft'],
      required: true,
      index: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    skillId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
      default: 'Intermediate',
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    scenarioText: {
      type: String,
      default: '',
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (opts: string[]) => Array.isArray(opts) && opts.length >= 2,
        message: 'Questions must have at least 2 options',
      },
    },
    correctAnswerIndex: {
      type: Number,
      default: null,
    },
    optionWeights: {
      type: [Number],
      default: [],
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SkillQuestion: mongoose.Model<ISkillQuestion> =
  (mongoose.models.SkillQuestion as mongoose.Model<ISkillQuestion>) ||
  mongoose.model<ISkillQuestion>('SkillQuestion', SkillQuestionSchema);
