import mongoose, { Schema, Model } from 'mongoose';

export interface IResume {
  userId: mongoose.Types.ObjectId | string;
  fileName?: string;
  fileId?: string;
  fileUrl?: string;
  mimeType?: string;
  fileSize?: number;
  atsScore?: number;
  feedback?: string;
  skillsFound?: string[];
  missingSkills?: string[];
  formattingScore?: number;
  quantifiedImpactScore?: number;
  keywordMatchPct?: number;
  suggestions?: string[];
  targetRole?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, default: 'Resume.pdf' },
    fileId: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    mimeType: { type: String, default: 'application/pdf' },
    fileSize: { type: Number, default: 0 },
    atsScore: { type: Number },
    feedback: { type: String, default: '' },
    skillsFound: [{ type: String }],
    missingSkills: [{ type: String }],
    formattingScore: { type: Number },
    quantifiedImpactScore: { type: Number },
    keywordMatchPct: { type: Number },
    suggestions: [{ type: String }],
    targetRole: { type: String, default: 'Software Development Engineer' },
  },
  { timestamps: true }
);

export const Resume: Model<IResume> =
  (mongoose.models.Resume as Model<IResume>) ||
  mongoose.model<IResume>('Resume', ResumeSchema);
