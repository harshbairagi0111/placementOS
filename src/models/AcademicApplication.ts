import mongoose, { Schema, Model } from 'mongoose';

export type AcademicApplicationStatus = 'Applied' | 'Under Review' | 'Selected' | 'Rejected';

export interface IAcademicApplication {
  opportunityId: mongoose.Types.ObjectId | string;
  academicianId: mongoose.Types.ObjectId | string;
  status: AcademicApplicationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const AcademicApplicationSchema = new Schema<IAcademicApplication>(
  {
    opportunityId: {
      type: Schema.Types.Mixed,
      ref: 'AcademicOpportunity',
      required: true,
    },
    academicianId: {
      type: Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Selected', 'Rejected'],
      default: 'Applied',
    },
  },
  { timestamps: true }
);

// Optional index for fast duplicate checks
AcademicApplicationSchema.index({ opportunityId: 1, academicianId: 1 }, { unique: false });

export const AcademicApplication: Model<IAcademicApplication> =
  (mongoose.models.AcademicApplication as Model<IAcademicApplication>) ||
  mongoose.model<IAcademicApplication>('AcademicApplication', AcademicApplicationSchema);
