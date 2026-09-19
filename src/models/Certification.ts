import mongoose, { Schema, Document } from 'mongoose';

export type CertificationCategory = 'Global' | 'National' | 'Local/College' | 'Other';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ICertification extends Document {
  userId: mongoose.Types.ObjectId | string;
  title: string;
  issuer: string;
  category: CertificationCategory;
  dateIssued?: string;
  credentialUrl?: string;
  fileUrl?: string;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  source: 'upload' | 'manual';
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  addedAt: Date;
}

const CertificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    category: {
      type: String,
      enum: ['Global', 'National', 'Local/College', 'Other'],
      default: 'Other',
    },
    dateIssued: { type: String, default: '' },
    credentialUrl: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileId: { type: String, default: '' },
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    source: { type: String, enum: ['upload', 'manual'], default: 'manual' },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verificationNote: { type: String, default: '' },
    verifiedBy: { type: Schema.Types.Mixed, default: null },
    verifiedAt: { type: Date, default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Certification: mongoose.Model<ICertification> =
  (mongoose.models.Certification as mongoose.Model<ICertification>) ||
  mongoose.model<ICertification>('Certification', CertificationSchema);
