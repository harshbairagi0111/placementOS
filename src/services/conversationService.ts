import mongoose from 'mongoose';
import { Conversation, IConversation, AssistantType } from '../models/Conversation';
import { Message, IMessage, MessageRole } from '../models/Message';

export interface CreateConversationInput {
  title?: string;
  assistantType?: AssistantType;
}

export interface ListConversationsOptions {
  limit?: number;
  skip?: number;
  assistantType?: string;
}

export interface AddMessageInput {
  role: MessageRole;
  content: string;
  tokenCount?: number;
  model?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface GetMessagesOptions {
  limit?: number;
  skip?: number;
  before?: Date | string;
  after?: Date | string;
}

const ALLOWED_ROLES: MessageRole[] = ['user', 'assistant', 'system'];
const ALLOWED_ASSISTANT_TYPES: AssistantType[] = ['ai_mentor', 'mock_interview', 'career_guidance'];
export const DEFAULT_MESSAGES_LIMIT = 50;
export const MAX_MESSAGES_LIMIT = 100;
export const MAX_MESSAGE_CONTENT_LENGTH = 10000;

/**
 * Creates a new conversation session owned by the authenticated student.
 */
export async function createConversation(
  studentId: string,
  input: CreateConversationInput = {}
): Promise<IConversation> {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new Error('Invalid studentId');
  }

  const assistantType: AssistantType =
    input.assistantType && ALLOWED_ASSISTANT_TYPES.includes(input.assistantType)
      ? input.assistantType
      : 'ai_mentor';

  const title = input.title?.trim()
    ? input.title.trim().slice(0, 200)
    : 'New Conversation';

  const conversation = await Conversation.create({
    studentId: new mongoose.Types.ObjectId(studentId),
    title,
    assistantType,
    lastMessageAt: new Date(),
  });

  return conversation;
}

/**
 * Lists all conversations belonging to the authenticated student.
 * Never returns conversations belonging to other students.
 */
export async function listStudentConversations(
  studentId: string,
  options: ListConversationsOptions = {}
): Promise<IConversation[]> {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new Error('Invalid studentId');
  }

  const query: Record<string, any> = {
    studentId: new mongoose.Types.ObjectId(studentId),
  };

  if (options.assistantType && ALLOWED_ASSISTANT_TYPES.includes(options.assistantType as AssistantType)) {
    query.assistantType = options.assistantType;
  }

  const limit = Math.min(Math.max(1, options.limit ?? 20), 50);
  const skip = Math.max(0, options.skip ?? 0);

  return Conversation.find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
}

/**
 * Retrieves a single conversation by ID, enforcing student ownership.
 */
export async function getConversation(
  studentId: string,
  conversationId: string
): Promise<IConversation | null> {
  if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(conversationId)) {
    return null;
  }

  return Conversation.findOne({
    _id: new mongoose.Types.ObjectId(conversationId),
    studentId: new mongoose.Types.ObjectId(studentId),
  }).exec();
}

/**
 * Appends a validated message to a student's conversation.
 * Verifies student ownership before creating the message.
 */
export async function addMessage(
  studentId: string,
  conversationId: string,
  input: AddMessageInput
): Promise<IMessage> {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new Error('Invalid studentId');
  }
  if (!mongoose.isValidObjectId(conversationId)) {
    throw new Error('Invalid conversationId');
  }

  // 1. Verify conversation exists AND belongs to the student
  const conversation = await Conversation.findOne({
    _id: new mongoose.Types.ObjectId(conversationId),
    studentId: new mongoose.Types.ObjectId(studentId),
  }).exec();

  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  // 2. Validate message content
  if (typeof input.content !== 'string' || !input.content.trim()) {
    throw new Error('Message content must be a non-empty string');
  }
  const trimmedContent = input.content.trim();
  if (trimmedContent.length > MAX_MESSAGE_CONTENT_LENGTH) {
    throw new Error(`Message content cannot exceed ${MAX_MESSAGE_CONTENT_LENGTH} characters`);
  }

  // 3. Validate role
  if (!ALLOWED_ROLES.includes(input.role)) {
    throw new Error(`Invalid message role "${input.role}". Allowed: ${ALLOWED_ROLES.join(', ')}`);
  }

  // 4. Sanitize optional metadata to prevent sensitive leakages
  let safeMetadata: Record<string, any> | undefined = undefined;
  if (input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)) {
    const { apiKey, secret, password, ...rest } = input.metadata;
    safeMetadata = rest;
  }

  const now = new Date();

  // 5. Create message document with explicit ownership fields
  const message = await Message.create({
    conversationId: conversation._id,
    studentId: new mongoose.Types.ObjectId(studentId),
    role: input.role,
    content: trimmedContent,
    tokenCount: typeof input.tokenCount === 'number' && input.tokenCount >= 0 ? input.tokenCount : undefined,
    model: input.model ? String(input.model).trim().slice(0, 100) : undefined,
    source: input.source ? String(input.source).trim().slice(0, 100) : undefined,
    metadata: safeMetadata,
    createdAt: now,
  });

  // 6. Update conversation's lastMessageAt and updatedAt
  conversation.lastMessageAt = now;
  await conversation.save();

  return message;
}

/**
 * Retrieves paginated messages for a conversation in chronological order.
 * Strictly verifies student ownership of the conversation.
 */
export async function getMessages(
  studentId: string,
  conversationId: string,
  options: GetMessagesOptions = {}
): Promise<IMessage[]> {
  if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(conversationId)) {
    throw new Error('Invalid studentId or conversationId');
  }

  // 1. Verify conversation ownership
  const conversation = await Conversation.findOne({
    _id: new mongoose.Types.ObjectId(conversationId),
    studentId: new mongoose.Types.ObjectId(studentId),
  }).exec();

  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  // 2. Validate and clamp limit
  let limit = options.limit !== undefined ? options.limit : DEFAULT_MESSAGES_LIMIT;
  if (limit <= 0) {
    return [];
  }
  limit = Math.min(limit, MAX_MESSAGES_LIMIT);

  const skip = Math.max(0, options.skip ?? 0);

  const query: Record<string, any> = {
    conversationId: conversation._id,
    studentId: new mongoose.Types.ObjectId(studentId),
  };

  if (options.before) {
    const beforeDate = new Date(options.before);
    if (!isNaN(beforeDate.getTime())) {
      query.createdAt = { ...query.createdAt, $lt: beforeDate };
    }
  }

  if (options.after) {
    const afterDate = new Date(options.after);
    if (!isNaN(afterDate.getTime())) {
      query.createdAt = { ...query.createdAt, $gt: afterDate };
    }
  }

  // Deterministic chronological ordering
  return Message.find(query)
    .sort({ createdAt: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .exec();
}

/**
 * Deletes a conversation and all its associated messages.
 * Does NOT delete StudentMemory.
 */
export async function deleteConversation(
  studentId: string,
  conversationId: string
): Promise<boolean> {
  if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(conversationId)) {
    return false;
  }

  // Verify ownership before cascade deletion
  const conversation = await Conversation.findOne({
    _id: new mongoose.Types.ObjectId(conversationId),
    studentId: new mongoose.Types.ObjectId(studentId),
  }).exec();

  if (!conversation) {
    return false;
  }

  // Delete messages belonging to this conversation
  await Message.deleteMany({
    conversationId: conversation._id,
  }).exec();

  // Delete the conversation itself
  await Conversation.deleteOne({
    _id: conversation._id,
  }).exec();

  return true;
}

/**
 * Retrieves the most recent messages for a conversation in chronological order.
 * Strictly verifies student ownership. Bounded to a maximum limit (default 20, max 50).
 */
export async function getRecentMessages(
  studentId: string,
  conversationId: string,
  limit: number = 20
): Promise<IMessage[]> {
  if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(conversationId)) {
    throw new Error('Invalid studentId or conversationId');
  }

  const conversation = await Conversation.findOne({
    _id: new mongoose.Types.ObjectId(conversationId),
    studentId: new mongoose.Types.ObjectId(studentId),
  }).exec();

  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  const boundedLimit = Math.min(Math.max(1, limit), 50);

  const messages = await Message.find({
    conversationId: conversation._id,
    studentId: new mongoose.Types.ObjectId(studentId),
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(boundedLimit)
    .exec();

  return messages.reverse();
}
