import mongoose, { Schema, Model } from 'mongoose';

export type LearningProgramApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SELECTED'
  | 'REJECTED';

export const LEARNING_PROGRAM_APPLICATION_STATUSES: readonly LearningProgramApplicationStatus[] = [
  'APPLIED',
  'UNDER_REVIEW',
  'SELECTED',
  'REJECTED',
] as const;

export interface ILearningProgramApplication {
  studentId: mongoose.Types.ObjectId | string;
  programId: mongoose.Types.ObjectId | string;
  status: LearningProgramApplicationStatus;
  message?: string;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const LearningProgramApplicationSchema = new Schema<ILearningProgramApplication>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningProgram',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['APPLIED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED'],
      default: 'APPLIED',
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index to speed up lookup by program and student,
// and enforce duplicate prevention for active applications (APPLIED, UNDER_REVIEW, SELECTED)
LearningProgramApplicationSchema.index(
  { studentId: 1, programId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['APPLIED', 'UNDER_REVIEW', 'SELECTED'] },
    },
  }
);

export const LearningProgramApplication: Model<ILearningProgramApplication> =
  (mongoose.models.LearningProgramApplication as Model<ILearningProgramApplication>) ||
  mongoose.model<ILearningProgramApplication>(
    'LearningProgramApplication',
    LearningProgramApplicationSchema
  );
