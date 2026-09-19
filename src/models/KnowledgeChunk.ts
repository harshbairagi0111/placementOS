import mongoose, { Schema, Document, Model } from 'mongoose';

export type KnowledgeSourceType =
  | 'interview_experience'
  | 'skill_question'
  | 'aptitude_question'
  | 'job_posting'
  | 'career_guidance'
  | 'technical_knowledge'
  | 'interview_question'
  | 'project_guidance'
  | 'resume_guidance'
  | 'placement_strategy'
  | string;

export interface IKnowledgeChunk extends Document {
  content: string;
  embedding: number[];
  sourceType: KnowledgeSourceType;
  sourceId: string;
  chunkIndex: number;
  chunkKey: string;
  title?: string;
  company?: string;
  role?: string;
  skill?: string;
  tags: string[];
  status?: string;
  knowledgeId?: mongoose.Types.ObjectId | string;
  contentHash?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Atlas Vector Search Index Configuration Specification
 *
 * To enable semantic vector search on MongoDB Atlas:
 * 1. Navigate to Atlas UI -> Database Deployments -> Atlas Search -> Create Search Index
 * 2. Select "Atlas Vector Search" (JSON Editor)
 * 3. Set Index Name: "vector_index"
 * 4. Target Collection: "placementos.knowledgechunks"
 * 5. Paste the definition below:
 */
export const ATLAS_VECTOR_SEARCH_INDEX_SPEC = {
  name: 'vector_index',
  definition: {
    fields: [
      {
        type: 'vector',
        path: 'embedding',
        numDimensions: 768,
        similarity: 'cosine',
      },
      {
        type: 'filter',
        path: 'sourceType',
      },
      {
        type: 'filter',
        path: 'company',
      },
      {
        type: 'filter',
        path: 'role',
      },
      {
        type: 'filter',
        path: 'skill',
      },
      {
        type: 'filter',
        path: 'status',
      },
      {
        type: 'filter',
        path: 'tags',
      },
    ],
  },
} as const;

/**
 * MongoDB Atlas Search Text Index Configuration Specification
 *
 * To enable keyword search on MongoDB Atlas:
 * 1. Navigate to Atlas UI -> Database Deployments -> Atlas Search -> Create Search Index
 * 2. Select "Atlas Search" (JSON Editor)
 * 3. Set Index Name: "knowledge_text_index"
 * 4. Target Collection: "placementos.knowledgechunks"
 * 5. Paste the definition below:
 */
export const ATLAS_TEXT_SEARCH_INDEX_SPEC = {
  name: 'knowledge_text_index',
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        content: {
          type: 'string',
          analyzer: 'lucene.standard',
        },
        title: {
          type: 'string',
          analyzer: 'lucene.standard',
        },
        company: {
          type: 'string',
          analyzer: 'lucene.standard',
        },
        role: {
          type: 'string',
          analyzer: 'lucene.standard',
        },
        skill: {
          type: 'string',
          analyzer: 'lucene.standard',
        },
        tags: {
          type: 'string',
          analyzer: 'lucene.standard',
        },
        sourceType: {
          type: 'string',
          analyzer: 'lucene.keyword',
        },
        status: {
          type: 'string',
          analyzer: 'lucene.keyword',
        },
      },
    },
  },
} as const;

export const EXPECTED_EMBEDDING_DIMENSIONS = 768;

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    content: {
      type: String,
      required: [true, 'KnowledgeChunk content is required'],
      trim: true,
      validate: {
        validator: (v: string) => typeof v === 'string' && v.trim().length > 0,
        message: 'KnowledgeChunk content must be a non-empty string',
      },
    },
    embedding: {
      type: [Number],
      required: [true, 'KnowledgeChunk embedding vector is required'],
      validate: {
        validator: (v: number[]) =>
          Array.isArray(v) &&
          v.length > 0 &&
          v.every((x) => typeof x === 'number' && !Number.isNaN(x)),
        message: 'KnowledgeChunk embedding must be a non-empty array of valid numbers',
      },
    },
    sourceType: {
      type: String,
      required: [true, 'KnowledgeChunk sourceType is required'],
      trim: true,
      index: true,
    },
    sourceId: {
      type: String,
      required: [true, 'KnowledgeChunk sourceId is required'],
      trim: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    chunkKey: {
      type: String,
      required: [true, 'KnowledgeChunk chunkKey is required for deterministic duplicate prevention'],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      trim: true,
      index: true,
    },
    skill: {
      type: String,
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      trim: true,
      index: true,
    },
    knowledgeId: {
      type: Schema.Types.Mixed,
      index: true,
    },
    contentHash: {
      type: String,
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

// Compound unique index for deterministic source-chunk identity
KnowledgeChunkSchema.index(
  { sourceType: 1, sourceId: 1, chunkIndex: 1 },
  { unique: true }
);

// MongoDB text search index on approved knowledge fields
KnowledgeChunkSchema.index(
  {
    content: 'text',
    title: 'text',
    company: 'text',
    role: 'text',
    skill: 'text',
    tags: 'text',
  },
  {
    name: 'knowledge_text_index',
    weights: {
      title: 5,
      skill: 4,
      company: 3,
      role: 3,
      content: 2,
      tags: 1,
    },
  }
);

export const KnowledgeChunk: Model<IKnowledgeChunk> =
  (mongoose.models.KnowledgeChunk as Model<IKnowledgeChunk>) ||
  mongoose.model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema);
