import mongoose, { Schema, Model } from 'mongoose';

export interface ISkillRequirementItem {
  skill: string;
  importance?: 'required' | 'recommended' | 'optional';
  minimumLevel?: number;
  weight?: number;
}

export type JobSkillRequirement = string | ISkillRequirementItem;

export interface IJobPosting {
  recruiterId?: mongoose.Types.ObjectId | string;
  company: string;
  logo?: string;
  title: string;
  type: 'Job' | 'Internship' | 'Apprenticeship';
  ctc: string;
  stipend?: string;
  duration?: string;
  location?: string;
  description?: string;
  cutoffPct?: number;
  openPositions?: number;
  status: 'Active' | 'Closed' | 'Draft';
  applicantsCount?: number;
  requiredSkills?: JobSkillRequirement[];
  createdAt?: Date;
  updatedAt?: Date;
}

const JobPostingSchema = new Schema<IJobPosting>(
  {
    recruiterId: { type: Schema.Types.Mixed },
    company: { type: String, required: true },
    logo: { type: String, default: '🏢' },
    title: { type: String, required: true },
    type: { type: String, enum: ['Job', 'Internship', 'Apprenticeship'], default: 'Job', required: true },
    ctc: { type: String, required: true },
    stipend: { type: String },
    duration: { type: String },
    location: { type: String, default: 'Remote / Hybrid' },
    description: { type: String, default: '' },
    cutoffPct: { type: Number, default: 75 },
    openPositions: { type: Number, default: 1 },
    status: { type: String, enum: ['Active', 'Closed', 'Draft'], default: 'Active' },
    applicantsCount: { type: Number, default: 0 },
    requiredSkills: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

export const JobPosting: Model<IJobPosting> =
  (mongoose.models.JobPosting as Model<IJobPosting>) || mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
