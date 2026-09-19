import mongoose from 'mongoose';
import {
  StudentMemory,
  IStudentMemory,
  MemoryCategory,
  MemorySource,
  ALLOWED_MEMORY_CATEGORIES,
  ALLOWED_MEMORY_SOURCES,
} from '../models/StudentMemory';

/**
 * Normalizes memory keys to deterministic snake_case format.
 * Examples:
 *   "Target Role" -> "target_role"
 *   "target-role" -> "target_role"
 *   "TargetRole"  -> "target_role"
 *   "  learning_goal  " -> "learning_goal"
 */
export function normalizeMemoryKey(key: string): string {
  if (!key || typeof key !== 'string') {
    throw new Error('Memory key must be a non-empty string');
  }

  const normalized = key
    .trim()
    // Handle camelCase / PascalCase boundary: "targetRole" -> "target_Role"
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    // Replace whitespace, hyphens, and dots with underscores
    .replace(/[\s\-.]+/g, '_')
    // Remove characters that are not alphanumeric or underscore
    .replace(/[^a-z0-9_]/g, '')
    // Collapse consecutive underscores
    .replace(/_+/g, '_')
    // Trim leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  if (!normalized) {
    throw new Error('Memory key contains no valid alphanumeric characters');
  }

  if (normalized.length > 100) {
    throw new Error('Memory key cannot exceed 100 characters');
  }

  return normalized;
}

/**
 * Validates whether a category is supported.
 */
export function validateMemoryCategory(category: string): category is MemoryCategory {
  return ALLOWED_MEMORY_CATEGORIES.includes(category as MemoryCategory);
}

/**
 * Validates whether a confidence score is within [0, 1].
 */
export function validateMemoryConfidence(confidence: unknown): confidence is number {
  return (
    typeof confidence === 'number' &&
    !Number.isNaN(confidence) &&
    Number.isFinite(confidence) &&
    confidence >= 0 &&
    confidence <= 1
  );
}

export interface UpsertMemoryInput {
  key: string;
  value: string;
  category: MemoryCategory;
  confidence: number;
  source?: MemorySource;
  lastConfirmedAt?: Date;
}

export interface GetMemoriesOptions {
  category?: string;
  limit?: number;
}

/**
 * Retrieves all durable memory records for a student.
 * Always student-isolated.
 */
export async function getStudentMemories(
  studentId: string,
  options: GetMemoriesOptions = {}
): Promise<IStudentMemory[]> {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new Error('Invalid studentId');
  }

  const query: Record<string, any> = {
    studentId: new mongoose.Types.ObjectId(studentId),
  };

  if (options.category && validateMemoryCategory(options.category)) {
    query.category = options.category;
  }

  const limit = Math.min(Math.max(1, options.limit ?? 100), 200);

  return StudentMemory.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .exec();
}

/**
 * Retrieves a single durable memory record by key.
 */
export async function getStudentMemory(
  studentId: string,
  key: string
): Promise<IStudentMemory | null> {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new Error('Invalid studentId');
  }

  const normalizedKey = normalizeMemoryKey(key);

  return StudentMemory.findOne({
    studentId: new mongoose.Types.ObjectId(studentId),
    key: normalizedKey,
  }).exec();
}

/**
 * Upserts a durable memory record for a student with deterministic key normalization,
 * strict validation, and mass assignment protection.
 */
export async function upsertStudentMemory(
  studentId: string,
  input: UpsertMemoryInput
): Promise<IStudentMemory> {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new Error('Invalid studentId');
  }

  const normalizedKey = normalizeMemoryKey(input.key);

  if (typeof input.value !== 'string' || !input.value.trim()) {
    throw new Error('Memory value must be a non-empty string');
  }
  const trimmedValue = input.value.trim();
  if (trimmedValue.length > 1000) {
    throw new Error('Memory value cannot exceed 1000 characters');
  }

  if (!validateMemoryCategory(input.category)) {
    throw new Error(
      `Invalid memory category "${input.category}". Allowed: ${ALLOWED_MEMORY_CATEGORIES.join(', ')}`
    );
  }

  if (!validateMemoryConfidence(input.confidence)) {
    throw new Error('Confidence must be a numeric value between 0 and 1');
  }

  const source: MemorySource = input.source ?? 'user_confirmed';
  if (!ALLOWED_MEMORY_SOURCES.includes(source)) {
    throw new Error(
      `Invalid memory source "${source}". Allowed: ${ALLOWED_MEMORY_SOURCES.join(', ')}`
    );
  }

  const lastConfirmedAt =
    input.lastConfirmedAt ?? (source === 'user_confirmed' ? new Date() : undefined);

  // Use findOneAndUpdate with upsert to prevent duplicate records
  const memory = await StudentMemory.findOneAndUpdate(
    {
      studentId: new mongoose.Types.ObjectId(studentId),
      key: normalizedKey,
    },
    {
      $set: {
        value: trimmedValue,
        category: input.category,
        confidence: input.confidence,
        source,
        ...(lastConfirmedAt ? { lastConfirmedAt } : {}),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
    }
  ).exec();

  return memory;
}

/**
 * Deletes a student memory record by key.
 * Only deletes if owned by studentId.
 */
export async function deleteStudentMemory(
  studentId: string,
  key: string
): Promise<boolean> {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new Error('Invalid studentId');
  }

  const normalizedKey = normalizeMemoryKey(key);

  const result = await StudentMemory.findOneAndDelete({
    studentId: new mongoose.Types.ObjectId(studentId),
    key: normalizedKey,
  }).exec();

  return !!result;
}
