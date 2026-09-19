import mongoose, { Schema, Model } from 'mongoose';

export type AcademicOpportunityType =
  | 'Faculty Internship'
  | 'Industrial Training'
  | 'FDP'
  | 'Consultancy'
  | 'Research Collaboration';

export interface IAcademicOpportunity {
  postedBy?: mongoose.Types.ObjectId | string;
  company: string;
  title: string;
  type: AcademicOpportunityType;
  description?: string;
  duration?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  requiredExpertise?: string[];
  stipendOrHonorarium?: string;
  deadline?: Date;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AcademicOpportunitySchema = new Schema<IAcademicOpportunity>(
  {
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    company: { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'Faculty Internship',
        'Industrial Training',
        'FDP',
        'Consultancy',
        'Research Collaboration',
      ],
      required: true,
    },
    description: { type: String, default: '' },
    duration: { type: String, default: '4 Weeks' },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Online',
    },
    requiredExpertise: [{ type: String }],
    stipendOrHonorarium: { type: String },
    deadline: { type: Date },
    status: { type: String, default: 'Active' },
  },
  { timestamps: true }
);

export const AcademicOpportunity: Model<IAcademicOpportunity> =
  (mongoose.models.AcademicOpportunity as Model<IAcademicOpportunity>) ||
  mongoose.model<IAcademicOpportunity>('AcademicOpportunity', AcademicOpportunitySchema);
