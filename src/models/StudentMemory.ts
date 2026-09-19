import mongoose, { Document, Model, Schema } from 'mongoose';

export type MemoryCategory =
  | 'goal'
  | 'target_role'
  | 'target_company'
  | 'skill'
  | 'preference'
  | 'learning_goal'
  | 'career_goal'
  | 'other';

export type MemorySource =
  | 'conversation'
  | 'profile'
  | 'assessment'
  | 'user_confirmed'
  | 'system';

export const ALLOWED_MEMORY_CATEGORIES: MemoryCategory[] = [
  'goal',
  'target_role',
  'target_company',
  'skill',
  'preference',
  'learning_goal',
  'career_goal',
  'other',
];

export const ALLOWED_MEMORY_SOURCES: MemorySource[] = [
  'conversation',
  'profile',
  'assessment',
  'user_confirmed',
  'system',
];

export interface IStudentMemory extends Document {
  studentId: mongoose.Types.ObjectId;
  key: string;
  value: string;
  category: MemoryCategory;
  confidence: number;
  source: MemorySource;
  lastConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const StudentMemorySchema = new Schema<IStudentMemory>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'studentId is required'],
      index: true,
    },
    key: {
      type: String,
      required: [true, 'key is required'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'key cannot exceed 100 characters'],
    },
    value: {
      type: String,
      required: [true, 'value is required'],
      trim: true,
      maxlength: [1000, 'value cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ALLOWED_MEMORY_CATEGORIES,
        message: 'Invalid category: {VALUE}',
      },
      required: [true, 'category is required'],
    },
    confidence: {
      type: Number,
      required: [true, 'confidence is required'],
      min: [0, 'confidence must be at least 0'],
      max: [1, 'confidence cannot exceed 1'],
    },
    source: {
      type: String,
      enum: {
        values: ALLOWED_MEMORY_SOURCES,
        message: 'Invalid source: {VALUE}',
      },
      default: 'user_confirmed',
      required: true,
    },
    lastConfirmedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Unique compound index preventing duplicate keys per student
StudentMemorySchema.index({ studentId: 1, key: 1 }, { unique: true });
// Category query optimization index
StudentMemorySchema.index({ studentId: 1, category: 1 });

export const StudentMemory: Model<IStudentMemory> =
  mongoose.models.StudentMemory ||
  mongoose.model<IStudentMemory>('StudentMemory', StudentMemorySchema);
