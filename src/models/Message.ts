import mongoose, { Document, Model, Schema } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  model?: string;
  source?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'conversationId is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'studentId is required'],
      index: true,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'assistant', 'system'],
        message: 'Invalid message role: {VALUE}',
      },
      required: [true, 'role is required'],
    },
    content: {
      type: String,
      required: [true, 'content is required'],
      trim: true,
      maxlength: [10000, 'content cannot exceed 10000 characters'],
    },
    tokenCount: {
      type: Number,
      min: 0,
    },
    model: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
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

// Indexes for chronological retrieval and student ownership validation
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ studentId: 1, conversationId: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
