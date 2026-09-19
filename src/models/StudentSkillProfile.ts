import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileSkillEntry {
  skill: string;
  skillId: string;
  category: 'technical' | 'soft';
  score: number; // 0 - 100
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  assessmentType?: string;
  lastAssessedAt: Date;
  assessmentCount: number;
}

export interface IStudentSkillProfile extends Document {
  userId: mongoose.Types.ObjectId | string;
  studentId?: string;
  technicalSkills: IProfileSkillEntry[];
  softSkills: IProfileSkillEntry[];
  overallTechnicalScore: number;
  overallSoftScore: number;
  strengths: string[]; // Canonical skill names
  skillGaps: string[]; // Canonical skill names
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSkillEntrySchema = new Schema(
  {
    skill: { type: String, required: true },
    skillId: { type: String, required: true },
    category: { type: String, enum: ['technical', 'soft'], required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true,
    },
    assessmentType: { type: String, default: 'technical' },
    lastAssessedAt: { type: Date, default: Date.now },
    assessmentCount: { type: Number, default: 1 },
  },
  { _id: false }
);

const StudentSkillProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      unique: true,
      index: true,
    },
    technicalSkills: [ProfileSkillEntrySchema],
    softSkills: [ProfileSkillEntrySchema],
    overallTechnicalScore: { type: Number, default: 0 },
    overallSoftScore: { type: Number, default: 0 },
    strengths: { type: [String], default: [] },
    skillGaps: { type: [String], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const StudentSkillProfile: mongoose.Model<IStudentSkillProfile> =
  (mongoose.models.StudentSkillProfile as mongoose.Model<IStudentSkillProfile>) ||
  mongoose.model<IStudentSkillProfile>('StudentSkillProfile', StudentSkillProfileSchema);
