import mongoose, { Schema, Document } from 'mongoose';

export type AchievementVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId | string;
  title: string;
  organization?: string;
  date?: string;
  description?: string;
  rank?: string;
  credentialUrl?: string;
  verificationStatus: AchievementVerificationStatus;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  fileId?: string;
  fileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    rank: {
      type: String,
      default: '',
      trim: true,
    },
    credentialUrl: {
      type: String,
      default: '',
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verificationNote: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: Schema.Types.Mixed,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    fileId: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Achievement: mongoose.Model<IAchievement> =
  (mongoose.models.Achievement as mongoose.Model<IAchievement>) ||
  mongoose.model<IAchievement>('Achievement', AchievementSchema);
