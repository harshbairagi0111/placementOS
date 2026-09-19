import mongoose, { Schema, Model } from 'mongoose';

export type MentorshipRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface IMentorshipRequest {
  _id?: any;
  studentId: mongoose.Types.ObjectId | string;
  mentorId: mongoose.Types.ObjectId | string;
  status: MentorshipRequestStatus;
  message: string;
  mentorshipArea?: string;
  responseNote?: string;
  respondedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const MentorshipRequestSchema = new Schema<IMentorshipRequest>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    mentorshipArea: {
      type: String,
      trim: true,
      default: '',
    },
    responseNote: {
      type: String,
      trim: true,
      default: '',
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

MentorshipRequestSchema.index({ studentId: 1, mentorId: 1, status: 1 });

export const MentorshipRequest: Model<IMentorshipRequest> =
  (mongoose.models.MentorshipRequest as Model<IMentorshipRequest>) ||
  mongoose.model<IMentorshipRequest>('MentorshipRequest', MentorshipRequestSchema);
