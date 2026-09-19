import mongoose, { Schema, Document } from 'mongoose';

export type ProjectVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  technologies: string[];
  role?: string;
  duration?: string;
  githubUrl?: string;
  liveUrl?: string;
  outcomes?: string;
  source: 'manual' | 'github_audit';
  verificationStatus: ProjectVerificationStatus;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  fileId?: string;
  fileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
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
    description: {
      type: String,
      default: '',
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      default: 'Developer',
      trim: true,
    },
    duration: {
      type: String,
      default: '',
      trim: true,
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    liveUrl: {
      type: String,
      default: '',
      trim: true,
    },
    outcomes: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      enum: ['manual', 'github_audit'],
      default: 'manual',
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

export const Project: mongoose.Model<IProject> =
  (mongoose.models.Project as mongoose.Model<IProject>) ||
  mongoose.model<IProject>('Project', ProjectSchema);
