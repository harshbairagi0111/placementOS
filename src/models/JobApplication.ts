import mongoose, { Schema, Model } from 'mongoose';

/**
 * Canonical JobApplication status vocabulary for PlacementOS.
 * Single Source of Truth for recruitment stages and document access authorization.
 */
export type JobApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview'
  | 'Offer'
  | 'Rejected';

export const JOB_APPLICATION_STATUSES: readonly JobApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Screening',
  'Shortlisted',
  'Interview',
  'Offer',
  'Rejected',
] as const;

export const ELIGIBLE_DOCUMENT_ACCESS_STATUSES: readonly JobApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Screening',
  'Shortlisted',
  'Interview',
  'Offer',
] as const;

export const INELIGIBLE_DOCUMENT_ACCESS_STATUSES: readonly JobApplicationStatus[] = [
  'Rejected',
] as const;

/**
 * Normalizes an arbitrary status string to its canonical JobApplicationStatus value.
 * Uses exact match first, followed by case-insensitive matching for legacy database records.
 * Returns null if the status is not in the canonical vocabulary (Deny-by-Default).
 */
export function normalizeJobApplicationStatus(rawStatus?: string | null): JobApplicationStatus | null {
  if (!rawStatus || typeof rawStatus !== 'string') {
    return null;
  }
  const trimmed = rawStatus.trim();
  if (!trimmed) {
    return null;
  }

  // 1. Exact match against canonical vocabulary
  for (const status of JOB_APPLICATION_STATUSES) {
    if (status === trimmed) {
      return status;
    }
  }

  // 2. Case-insensitive normalization for legacy database records
  const lower = trimmed.toLowerCase();
  for (const status of JOB_APPLICATION_STATUSES) {
    if (status.toLowerCase() === lower) {
      return status;
    }
  }

  // 3. Unrecognized or invented status: DENY BY DEFAULT
  return null;
}

export interface IMentorFeedback {
  rating?: number;
  comments?: string;
  submittedAt?: Date;
}

export interface IJobApplication {
  userId: mongoose.Types.ObjectId | string;
  jobPostingId?: mongoose.Types.ObjectId | string;
  company: string;
  role: string;
  type?: 'Job' | 'Internship' | 'Apprenticeship';
  status: JobApplicationStatus | string;
  appliedAt?: string | Date;
  completionStatus?: 'Not Started' | 'In Progress' | 'Completed' | 'Discontinued';
  mentorFeedback?: IMentorFeedback;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobPostingId: { type: Schema.Types.Mixed },
    company: { type: String, required: true },
    role: { type: String, required: true },
    type: { type: String, enum: ['Job', 'Internship', 'Apprenticeship'] },
    status: { type: String, default: 'Under Review' },
    appliedAt: { type: Schema.Types.Mixed, default: () => new Date().toISOString().split('T')[0] },
    completionStatus: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Discontinued'],
      default: 'Not Started',
    },
    mentorFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String, default: '' },
      submittedAt: { type: Date },
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const JobApplication: Model<IJobApplication> =
  (mongoose.models.JobApplication as Model<IJobApplication>) ||
  mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
