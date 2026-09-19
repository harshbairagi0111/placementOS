import mongoose, { Schema, Document } from 'mongoose';

export type InternshipVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IInternship extends Document {
  userId: mongoose.Types.ObjectId | string;
  organization: string;
  role: string;
  duration?: string;
  description?: string;
  skills: string[];
  location?: string;
  status: 'Completed' | 'Ongoing' | 'Offer';
  certificateUrl?: string;
  verificationStatus: InternshipVerificationStatus;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  fileId?: string;
  fileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipSchema = new Schema<IInternship>(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Ongoing', 'Offer'],
      default: 'Completed',
    },
    certificateUrl: {
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

export const Internship: mongoose.Model<IInternship> =
  (mongoose.models.Internship as mongoose.Model<IInternship>) ||
  mongoose.model<IInternship>('Internship', InternshipSchema);
