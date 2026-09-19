import mongoose, { Schema, Document, Model } from 'mongoose';

export type RAGKnowledgeStatus = 'active' | 'inactive';

export interface IRAGKnowledge extends Document {
  sourceId: string;
  sourceType: string;
  category: string;
  title: string;
  content: string;
  skills: string[];
  roles: string[];
  tags: string[];
  difficulty?: string;
  status: RAGKnowledgeStatus;
  version: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGKnowledgeInput {
  sourceId: string;
  sourceType: string;
  category: string;
  title: string;
  content: string;
  skills?: string[];
  roles?: string[];
  tags?: string[];
  difficulty?: string;
  status?: RAGKnowledgeStatus;
  version?: string;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedRecord?: {
    sourceId: string;
    sourceType: string;
    category: string;
    title: string;
    content: string;
    skills: string[];
    roles: string[];
    tags: string[];
    difficulty?: string;
    status: RAGKnowledgeStatus;
    version: string;
    metadata: Record<string, any>;
  };
}

/**
 * Validates and trims a raw candidate RAGKnowledge record.
 * Rejects records with missing mandatory fields or invalid structures.
 */
export function validateRAGKnowledgeRecord(record: any): ValidationResult {
  const errors: string[] = [];

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { valid: false, errors: ['Record must be a non-null JSON object'] };
  }

  // 1. sourceId (required, non-empty string)
  const rawSourceId = record.sourceId;
  if (!rawSourceId || typeof rawSourceId !== 'string' || !rawSourceId.trim()) {
    errors.push('sourceId is required and must be a non-empty string');
  }

  // 2. sourceType (required, non-empty string)
  const rawSourceType = record.sourceType;
  if (!rawSourceType || typeof rawSourceType !== 'string' || !rawSourceType.trim()) {
    errors.push('sourceType is required and must be a non-empty string');
  }

  // 3. category (required, non-empty string)
  const rawCategory = record.category;
  if (!rawCategory || typeof rawCategory !== 'string' || !rawCategory.trim()) {
    errors.push('category is required and must be a non-empty string');
  }

  // 4. title (required, non-empty string)
  const rawTitle = record.title;
  if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
    errors.push('title is required and must be a non-empty string');
  }

  // 5. content (required, non-empty string)
  const rawContent = record.content;
  if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
    errors.push('content is required and must be a non-empty string');
  }

  // 6. status (optional, must be 'active' | 'inactive' if specified, default 'active')
  const rawStatus = record.status !== undefined ? String(record.status).trim().toLowerCase() : 'active';
  if (rawStatus !== 'active' && rawStatus !== 'inactive') {
    errors.push("status must be either 'active' or 'inactive'");
  }

  // 7. skills (must be array of strings if provided)
  if (record.skills !== undefined && !Array.isArray(record.skills)) {
    errors.push('skills must be an array of strings if provided');
  } else if (Array.isArray(record.skills) && record.skills.some((s: any) => typeof s !== 'string')) {
    errors.push('all items in skills array must be strings');
  }

  // 8. roles (must be array of strings if provided)
  if (record.roles !== undefined && !Array.isArray(record.roles)) {
    errors.push('roles must be an array of strings if provided');
  } else if (Array.isArray(record.roles) && record.roles.some((r: any) => typeof r !== 'string')) {
    errors.push('all items in roles array must be strings');
  }

  // 9. tags (must be array of strings if provided)
  if (record.tags !== undefined && !Array.isArray(record.tags)) {
    errors.push('tags must be an array of strings if provided');
  } else if (Array.isArray(record.tags) && record.tags.some((t: any) => typeof t !== 'string')) {
    errors.push('all items in tags array must be strings');
  }

  // 10. metadata (must be object if provided)
  if (record.metadata !== undefined && (typeof record.metadata !== 'object' || Array.isArray(record.metadata))) {
    errors.push('metadata must be an object if provided');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitized = {
    sourceId: String(rawSourceId).trim(),
    sourceType: String(rawSourceType).trim(),
    category: String(rawCategory).trim(),
    title: String(rawTitle).trim(),
    content: String(rawContent).trim(),
    skills: Array.isArray(record.skills)
      ? record.skills.map((s: string) => s.trim()).filter(Boolean)
      : [],
    roles: Array.isArray(record.roles)
      ? record.roles.map((r: string) => r.trim()).filter(Boolean)
      : [],
    tags: Array.isArray(record.tags)
      ? record.tags.map((t: string) => t.trim()).filter(Boolean)
      : [],
    difficulty: record.difficulty ? String(record.difficulty).trim() : undefined,
    status: rawStatus as RAGKnowledgeStatus,
    version: record.version ? String(record.version).trim() : '1.0.0',
    metadata: record.metadata ? { ...record.metadata } : {},
  };

  return {
    valid: true,
    errors: [],
    sanitizedRecord: sanitized,
  };
}

export interface RAGDatasetManifest {
  datasetName: string;
  version: string;
  description?: string;
  records: any[];
}

export interface DatasetValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: RAGDatasetManifest;
}

/**
 * Validates top-level structure of a RAG dataset file:
 * - datasetName (non-empty string)
 * - version (non-empty string)
 * - records (array of records)
 * Also gracefully supports flat array files for backward compatibility.
 */
export function validateRAGDatasetStructure(data: any): DatasetValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Dataset must be a valid JSON object or array'] };
  }

  // Gracefully support flat array of records for backward compatibility
  if (Array.isArray(data)) {
    return {
      valid: true,
      errors: [],
      manifest: {
        datasetName: 'PlacementOS RAG Dataset (Flat)',
        version: data[0]?.version || '1.0.0',
        records: data,
      },
    };
  }

  // Validate standard manifest object
  const rawDatasetName = data.datasetName;
  if (!rawDatasetName || typeof rawDatasetName !== 'string' || !rawDatasetName.trim()) {
    errors.push('datasetName is required and must be a non-empty string');
  }

  const rawVersion = data.version;
  if (!rawVersion || typeof rawVersion !== 'string' || !rawVersion.trim()) {
    errors.push('version is required and must be a non-empty string');
  }

  const rawRecords = data.records;
  if (rawRecords === undefined || rawRecords === null) {
    errors.push('records is required and must be a JSON array');
  } else if (!Array.isArray(rawRecords)) {
    errors.push('records must be a JSON array');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    manifest: {
      datasetName: String(rawDatasetName).trim(),
      version: String(rawVersion).trim(),
      description: data.description ? String(data.description).trim() : undefined,
      records: rawRecords,
    },
  };
}

const RAGKnowledgeSchema = new Schema<IRAGKnowledge>(
  {
    sourceId: {
      type: String,
      required: [true, 'sourceId is required'],
      trim: true,
      index: true,
    },
    sourceType: {
      type: String,
      required: [true, 'sourceType is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'content is required'],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    roles: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    version: {
      type: String,
      default: '1.0.0',
      trim: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring deterministic canonical identity (sourceId + version)
RAGKnowledgeSchema.index({ sourceId: 1, version: 1 }, { unique: true });

export const RAGKnowledge: Model<IRAGKnowledge> =
  mongoose.models.RAGKnowledge ||
  mongoose.model<IRAGKnowledge>('RAGKnowledge', RAGKnowledgeSchema);
