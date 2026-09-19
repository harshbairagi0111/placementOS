import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillScoreItem {
  skill: string;
  skillId: string;
  category: 'technical' | 'soft';
  score: number; // 0 - 100
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  attemptedQuestions: number;
  correctAnswers: number;
}

export interface ISkillAnswerRecord {
  questionId: mongoose.Types.ObjectId | string;
  skill: string;
  category: 'technical' | 'soft';
  selectedOptionIndex: number;
  isCorrect?: boolean;
  scoreEarned: number; // 0 - 100
}

export interface ISkillAssessmentResult extends Document {
  userId: mongoose.Types.ObjectId | string;
  assessmentType: 'technical' | 'soft' | 'combined';
  skillsEvaluated: string[];
  skillScores: ISkillScoreItem[];
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  answers: ISkillAnswerRecord[];
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillScoreItemSchema = new Schema(
  {
    skill: { type: String, required: true },
    skillId: { type: String, required: true },
    category: { type: String, enum: ['technical', 'soft'], required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true,
    },
    attemptedQuestions: { type: Number, required: true, default: 0 },
    correctAnswers: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const SkillAnswerRecordSchema = new Schema(
  {
    questionId: { type: Schema.Types.Mixed, required: true },
    skill: { type: String, required: true },
    category: { type: String, enum: ['technical', 'soft'], required: true },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, default: false },
    scoreEarned: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const SkillAssessmentResultSchema = new Schema(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    assessmentType: {
      type: String,
      enum: ['technical', 'soft', 'combined'],
      required: true,
      index: true,
    },
    skillsEvaluated: {
      type: [String],
      default: [],
    },
    skillScores: [SkillScoreItemSchema],
    overallScore: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCorrect: {
      type: Number,
      required: true,
      default: 0,
    },
    answers: [SkillAnswerRecordSchema],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const SkillAssessmentResult: mongoose.Model<ISkillAssessmentResult> =
  (mongoose.models.SkillAssessmentResult as mongoose.Model<ISkillAssessmentResult>) ||
  mongoose.model<ISkillAssessmentResult>('SkillAssessmentResult', SkillAssessmentResultSchema);
