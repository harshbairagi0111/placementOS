import mongoose, { Schema, Model } from 'mongoose';

export interface ICodingProgress {
  userId: mongoose.Types.ObjectId | string;
  problemsSolved: number;
  totalProblems?: number;
  accuracyRate: number;
  languagesUsed?: number;
  fastestRuntimeMs?: number | null;
  lastSolvedAt?: Date | null;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CodingProgressSchema = new Schema<ICodingProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemsSolved: { type: Number, default: 0 },
    totalProblems: { type: Number, default: 200 },
    accuracyRate: { type: Number, default: 0 },
    languagesUsed: { type: Number, default: 0 },
    fastestRuntimeMs: { type: Number, default: null },
    lastSolvedAt: { type: Date, default: null },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CodingProgress: Model<ICodingProgress> =
  (mongoose.models.CodingProgress as Model<ICodingProgress>) ||
  mongoose.model<ICodingProgress>('CodingProgress', CodingProgressSchema);
