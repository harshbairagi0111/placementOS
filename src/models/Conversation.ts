import mongoose, { Document, Model, Schema } from 'mongoose';

export type AssistantType = 'ai_mentor' | 'mock_interview' | 'career_guidance';

export interface IConversation extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  assistantType: AssistantType;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = new Schema<IConversation>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'studentId is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: [200, 'title cannot exceed 200 characters'],
      default: 'New Conversation',
    },
    assistantType: {
      type: String,
      enum: {
        values: ['ai_mentor', 'mock_interview', 'career_guidance'],
        message: 'Invalid assistantType: {VALUE}',
      },
      default: 'ai_mentor',
      required: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
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

// High-performance compound indexes for student history and assistant filtering
ConversationSchema.index({ studentId: 1, updatedAt: -1 });
ConversationSchema.index({ studentId: 1, assistantType: 1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
