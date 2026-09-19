import mongoose, { Schema, Model } from 'mongoose';

export interface ILearningProgram {
  recruiterId: mongoose.Types.ObjectId | string;
  company: string;
  title: string;
  type:
    | 'Certification'
    | 'Workshop'
    | 'Training Program'
    | 'Mentorship'
    | 'Guest Lecture'
    | 'Innovation Challenge';
  description?: string;
  skillsCovered?: string[];
  duration?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  capacity?: number;
  enrolledCount?: number;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LearningProgramSchema = new Schema<ILearningProgram>(
  {
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'Certification',
        'Workshop',
        'Training Program',
        'Mentorship',
        'Guest Lecture',
        'Innovation Challenge',
      ],
      required: true,
    },
    description: { type: String, default: '' },
    skillsCovered: [{ type: String }],
    duration: { type: String, default: '4 Weeks' },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Online',
    },
    capacity: { type: Number },
    enrolledCount: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
  },
  { timestamps: true }
);

export const LearningProgram: Model<ILearningProgram> =
  (mongoose.models.LearningProgram as Model<ILearningProgram>) ||
  mongoose.model<ILearningProgram>('LearningProgram', LearningProgramSchema);
