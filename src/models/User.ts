import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  email: string;
  password?: string;
  name: string;
  role: 'student' | 'industry' | 'academician' | 'institution';
  college?: string;
  collegeName?: string;
  degree?: string;
  targetRole?: string;
  targetCtc?: string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  bio?: string;
  cgpa?: number;
  graduationYear?: number;
  readinessScore?: number;
  dsaSolved?: number;
  systemDesignScore?: number;
  mockInterviewsCompleted?: number;
  company?: string;
  department?: string;
  designation?: string;
  isMentorAvailable?: boolean;
  mentorAreas?: string[];
  mentorshipTypes?: string[];
  researchAreas?: string[];
  industryExperience?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['student', 'industry', 'academician', 'institution'], required: true },
    college: { type: String },
    collegeName: { type: String },
    degree: { type: String },
    targetRole: { type: String },
    targetCtc: { type: String },
    phone: { type: String },
    githubUrl: { type: String },
    linkedinUrl: { type: String },
    skills: { type: [String], default: [] },
    bio: { type: String },
    cgpa: { type: Number },
    graduationYear: { type: Number },
    readinessScore: { type: Number },
    dsaSolved: { type: Number },
    systemDesignScore: { type: Number },
    mockInterviewsCompleted: { type: Number },
    company: { type: String },
    department: { type: String },
    designation: { type: String },
    isMentorAvailable: { type: Boolean, default: false },
    mentorAreas: { type: [String], default: [] },
    mentorshipTypes: {
      type: [String],
      enum: ['Live Projects', 'Internships', 'Innovation Challenges', 'Research Projects', 'Industry Programs'],
      default: [],
    },
    researchAreas: { type: [String], default: [] },
    industryExperience: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
