import mongoose from 'mongoose';
import {
  KnowledgeChunk,
  IKnowledgeChunk,
  KnowledgeSourceType,
} from '../models/KnowledgeChunk';
import { generateEmbedding } from './embeddingService';

export interface HybridRetrievalFilter {
  sourceTypes?: KnowledgeSourceType[];
  company?: string;
  role?: string;
  skill?: string;
  status?: string;
}

export interface HybridRetrievalOptions {
  limit?: number;
  vectorLimit?: number;
  keywordLimit?: number;
  vectorCandidates?: number;
  semanticWeight?: number;
  keywordWeight?: number;
  filter?: HybridRetrievalFilter;
  embeddingGenerator?: (query: string) => Promise<number[]>;
}

export interface RawRetrievalCandidate {
  chunkId: string;
  content: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  chunkIndex: number;
  title?: string;
  company?: string;
  role?: string;
  skill?: string;
  tags?: string[];
  vectorScore?: number;
  keywordScore?: number;
}

export interface HybridRetrievalResult {
  chunkId: string;
  content: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  chunkIndex: number;
  title?: string;
  company?: string;
  role?: string;
  skill?: string;
  tags?: string[];
  vectorScore: number;
  keywordScore: number;
  hybridScore: number;
}

// Configurable defaults defined centrally
export const DEFAULT_RETRIEVAL_LIMIT = 10;
export const DEFAULT_VECTOR_LIMIT = 20;
export const DEFAULT_KEYWORD_LIMIT = 20;
export const DEFAULT_VECTOR_CANDIDATES = 50;
export const DEFAULT_SEMANTIC_WEIGHT = 0.65;
export const DEFAULT_KEYWORD_WEIGHT = 0.35;

// Stable deterministic order for source types when scores tie
export const SOURCE_TYPE_ORDER: Record<KnowledgeSourceType, number> = {
  interview_experience: 1,
  skill_question: 2,
  aptitude_question: 3,
  job_posting: 4,
  career_guidance: 5,
};

/**
 * Calculates cosine similarity between two numeric vectors.
 * Gemini embeddings are typically unit-normalized, so dot product equals cosine similarity.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, sim); // clamp non-negative for similarity scores
}

/**
 * Normalizes an array of raw scores to [0, 1] relative to the maximum observed score.
 * This preserves linear proportionality between scores while scaling the peak to 1.0.
 * Missing / non-retrieved scores (0 or negative) remain 0.
 */
export function normalizeScores(scores: number[]): number[] {
  if (!scores || scores.length === 0) return [];
  const max = Math.max(...scores.map((s) => (typeof s === 'number' && !Number.isNaN(s) ? s : 0)));
  if (max <= 0) {
    return scores.map(() => 0);
  }
  return scores.map((s) => {
    if (typeof s !== 'number' || Number.isNaN(s) || s <= 0) return 0;
    return Math.min(1, Math.max(0, s / max));
  });
}

/**
 * Deterministic comparison function for ranking hybrid retrieval results:
 * 1. hybridScore descending
 * 2. vectorScore descending
 * 3. keywordScore descending
 * 4. sourceType using stable deterministic ordering
 * 5. sourceId ascending
 * 6. chunkIndex ascending
 * 7. chunkId ascending
 */
export function compareHybridResults(
  a: HybridRetrievalResult,
  b: HybridRetrievalResult
): number {
  // 1. hybridScore descending (with epsilon for float stability)
  if (Math.abs(b.hybridScore - a.hybridScore) > 1e-6) {
    return b.hybridScore - a.hybridScore;
  }
  // 2. vectorScore descending
  if (Math.abs(b.vectorScore - a.vectorScore) > 1e-6) {
    return b.vectorScore - a.vectorScore;
  }
  // 3. keywordScore descending
  if (Math.abs(b.keywordScore - a.keywordScore) > 1e-6) {
    return b.keywordScore - a.keywordScore;
  }
  // 4. sourceType stable ordering
  const orderA = SOURCE_TYPE_ORDER[a.sourceType] ?? 99;
  const orderB = SOURCE_TYPE_ORDER[b.sourceType] ?? 99;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  // 5. sourceId ascending
  const sourceComp = (a.sourceId || '').localeCompare(b.sourceId || '');
  if (sourceComp !== 0) {
    return sourceComp;
  }
  // 6. chunkIndex ascending
  if (a.chunkIndex !== b.chunkIndex) {
    return a.chunkIndex - b.chunkIndex;
  }
  // 7. chunkId ascending
  return (a.chunkId || '').localeCompare(b.chunkId || '');
}

/**
 * Pure merging, score normalization, deduplication, and deterministic ranking function.
 * Separated from database calls for reliable and deterministic unit testing.
 */
export function mergeAndRankRetrievalResults(
  vectorResults: RawRetrievalCandidate[],
  keywordResults: RawRetrievalCandidate[],
  options: {
    semanticWeight?: number;
    keywordWeight?: number;
    limit?: number;
  } = {}
): HybridRetrievalResult[] {
  const semanticWeight = options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT;
  const keywordWeight = options.keywordWeight ?? DEFAULT_KEYWORD_WEIGHT;
  const limit = options.limit !== undefined ? options.limit : DEFAULT_RETRIEVAL_LIMIT;

  if (limit <= 0) {
    return [];
  }

  // Map to deduplicate by stable chunkId
  const candidateMap = new Map<
    string,
    {
      base: RawRetrievalCandidate;
      rawVectorScore: number;
      rawKeywordScore: number;
    }
  >();

  for (const v of vectorResults) {
    if (!v || !v.chunkId) continue;
    candidateMap.set(v.chunkId, {
      base: v,
      rawVectorScore: v.vectorScore ?? 0,
      rawKeywordScore: 0,
    });
  }

  for (const k of keywordResults) {
    if (!k || !k.chunkId) continue;
    const existing = candidateMap.get(k.chunkId);
    if (existing) {
      existing.rawKeywordScore = k.keywordScore ?? 0;
    } else {
      candidateMap.set(k.chunkId, {
        base: k,
        rawVectorScore: 0,
        rawKeywordScore: k.keywordScore ?? 0,
      });
    }
  }

  const allCandidates = Array.from(candidateMap.values());
  if (allCandidates.length === 0) {
    return [];
  }

  // Normalize scores across retrieved batches
  const rawVectorScores = allCandidates.map((c) => c.rawVectorScore);
  const rawKeywordScores = allCandidates.map((c) => c.rawKeywordScore);

  const normalizedVectorScores = normalizeScores(rawVectorScores);
  const normalizedKeywordScores = normalizeScores(rawKeywordScores);

  const finalResults: HybridRetrievalResult[] = allCandidates.map((c, idx) => {
    const normVec = normalizedVectorScores[idx];
    const normKey = normalizedKeywordScores[idx];
    const combinedScore = normVec * semanticWeight + normKey * keywordWeight;
    const hybridScore = Math.round(combinedScore * 1e6) / 1e6;

    // Explicit projection of approved fields ONLY:
    return {
      chunkId: c.base.chunkId,
      content: c.base.content,
      sourceType: c.base.sourceType,
      sourceId: c.base.sourceId,
      chunkIndex: c.base.chunkIndex,
      title: c.base.title,
      company: c.base.company,
      role: c.base.role,
      skill: c.base.skill,
      tags: Array.isArray(c.base.tags) ? [...c.base.tags] : [],
      vectorScore: Math.round(normVec * 1e6) / 1e6,
      keywordScore: Math.round(normKey * 1e6) / 1e6,
      hybridScore,
    };
  });

  // Deterministic sort
  finalResults.sort(compareHybridResults);

  // Apply limit
  return finalResults.slice(0, limit);
}

/**
 * Builds Atlas Vector Search compatible filter for $vectorSearch.filter.
 * Atlas Vector Search supports equality and comparison operators ($in, $eq) on indexed filter fields,
 * but does NOT support JavaScript RegExp objects.
 */
export function buildVectorSearchFilter(filter?: HybridRetrievalFilter): Record<string, any> {
  const vectorFilter: Record<string, any> = {};
  if (!filter) return vectorFilter;

  if (Array.isArray(filter.sourceTypes) && filter.sourceTypes.length > 0) {
    vectorFilter.sourceType = { $in: filter.sourceTypes };
  }
  if (filter.status?.trim()) {
    vectorFilter.status = { $eq: filter.status.trim() };
  }
  // Pass exact/equality string filters for indexed filter fields, NEVER RegExp objects
  if (filter.company?.trim()) {
    vectorFilter.company = { $eq: filter.company.trim() };
  }
  if (filter.role?.trim()) {
    vectorFilter.role = { $eq: filter.role.trim() };
  }
  if (filter.skill?.trim()) {
    vectorFilter.skill = { $eq: filter.skill.trim() };
  }

  return vectorFilter;
}

/**
 * Builds server-side MongoDB filter from user-provided retrieval filter.
 */
export function buildMongoFilter(filter?: HybridRetrievalFilter): Record<string, any> {
  const mongoFilter: Record<string, any> = {};
  if (!filter) return mongoFilter;

  if (Array.isArray(filter.sourceTypes) && filter.sourceTypes.length > 0) {
    mongoFilter.sourceType = { $in: filter.sourceTypes };
  }
  if (filter.company?.trim()) {
    mongoFilter.company = new RegExp(`^${filter.company.trim()}$`, 'i');
  }
  if (filter.role?.trim()) {
    mongoFilter.role = new RegExp(`^${filter.role.trim()}$`, 'i');
  }
  if (filter.skill?.trim()) {
    mongoFilter.skill = new RegExp(`^${filter.skill.trim()}$`, 'i');
  }
  if (filter.status?.trim()) {
    mongoFilter.status = filter.status.trim();
  }

  return mongoFilter;
}

/**
 * Executes vector retrieval against KnowledgeChunk using MongoDB Atlas $vectorSearch
 * with fallback to in-memory cosine similarity if $vectorSearch is not supported by the environment.
 */
async function executeVectorSearch(
  queryEmbedding: number[],
  options: HybridRetrievalOptions
): Promise<RawRetrievalCandidate[]> {
  const vectorLimit = options.vectorLimit ?? DEFAULT_VECTOR_LIMIT;
  const vectorCandidates = options.vectorCandidates ?? DEFAULT_VECTOR_CANDIDATES;
  const vectorFilter = buildVectorSearchFilter(options.filter);
  const mongoFilter = buildMongoFilter(options.filter);

  // 1. Attempt Atlas Vector Search
  try {
    const vectorSearchStage: Record<string, any> = {
      index: 'vector_index',
      path: 'embedding',
      queryVector: queryEmbedding,
      numCandidates: vectorCandidates,
      limit: vectorLimit,
    };

    // Only assign vectorFilter (which is guaranteed to contain NO JavaScript RegExp objects)
    if (Object.keys(vectorFilter).length > 0) {
      vectorSearchStage.filter = vectorFilter;
    }

    // Apply regex-capable filters (e.g. case-insensitive regex for company/role/skill) via $match stage
    const postMatchStages = Object.keys(mongoFilter).length > 0 ? [{ $match: mongoFilter }] : [];

    const pipeline: any[] = [
      { $vectorSearch: vectorSearchStage },
      ...postMatchStages,
      {
        $project: {
          _id: 1,
          content: 1,
          sourceType: 1,
          sourceId: 1,
          chunkIndex: 1,
          title: 1,
          company: 1,
          role: 1,
          skill: 1,
          tags: 1,
          vectorScore: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const atlasResults = await KnowledgeChunk.aggregate(pipeline).exec();
    if (Array.isArray(atlasResults) && atlasResults.length > 0) {
      return atlasResults.map((doc) => ({
        chunkId: String(doc._id),
        content: doc.content,
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        chunkIndex: doc.chunkIndex,
        title: doc.title,
        company: doc.company,
        role: doc.role,
        skill: doc.skill,
        tags: doc.tags,
        vectorScore: typeof doc.vectorScore === 'number' ? doc.vectorScore : 0,
      }));
    }
  } catch (atlasErr: any) {
    // If $vectorSearch is not supported (e.g. non-Atlas local MongoDB), proceed to in-memory similarity fallback
  }

  // 2. Local / In-memory vector similarity fallback
  try {
    const docs = await KnowledgeChunk.find(mongoFilter, {
      _id: 1,
      content: 1,
      sourceType: 1,
      sourceId: 1,
      chunkIndex: 1,
      title: 1,
      company: 1,
      role: 1,
      skill: 1,
      tags: 1,
      embedding: 1,
    })
      .limit(200)
      .lean();

    const scoredDocs: RawRetrievalCandidate[] = [];
    for (const doc of docs) {
      if (!Array.isArray(doc.embedding) || doc.embedding.length === 0) continue;
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      if (score > 0) {
        scoredDocs.push({
          chunkId: String(doc._id),
          content: doc.content,
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          chunkIndex: doc.chunkIndex,
          title: doc.title,
          company: doc.company,
          role: doc.role,
          skill: doc.skill,
          tags: doc.tags,
          vectorScore: score,
        });
      }
    }

    scoredDocs.sort((a, b) => (b.vectorScore ?? 0) - (a.vectorScore ?? 0));
    return scoredDocs.slice(0, vectorLimit);
  } catch (fallbackErr) {
    return [];
  }
}

/**
 * Executes keyword text retrieval against KnowledgeChunk using MongoDB Atlas $search,
 * with graceful fallback to MongoDB $text search or text-field regex filtering.
 */
async function executeKeywordSearch(
  query: string,
  options: HybridRetrievalOptions
): Promise<RawRetrievalCandidate[]> {
  const keywordLimit = options.keywordLimit ?? DEFAULT_KEYWORD_LIMIT;
  const mongoFilter = buildMongoFilter(options.filter);

  // 1. Attempt Atlas Full-Text Search ($search)
  try {
    const searchStage: Record<string, any> = {
      index: 'knowledge_text_index',
      text: {
        query,
        path: ['content', 'title', 'company', 'role', 'skill', 'tags'],
      },
    };

    const pipeline: any[] = [
      { $search: searchStage },
      ...(Object.keys(mongoFilter).length > 0 ? [{ $match: mongoFilter }] : []),
      { $limit: keywordLimit },
      {
        $project: {
          _id: 1,
          content: 1,
          sourceType: 1,
          sourceId: 1,
          chunkIndex: 1,
          title: 1,
          company: 1,
          role: 1,
          skill: 1,
          tags: 1,
          keywordScore: { $meta: 'searchScore' },
        },
      },
    ];

    const atlasResults = await KnowledgeChunk.aggregate(pipeline).exec();
    if (Array.isArray(atlasResults) && atlasResults.length > 0) {
      return atlasResults.map((doc) => ({
        chunkId: String(doc._id),
        content: doc.content,
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        chunkIndex: doc.chunkIndex,
        title: doc.title,
        company: doc.company,
        role: doc.role,
        skill: doc.skill,
        tags: doc.tags,
        keywordScore: typeof doc.keywordScore === 'number' ? doc.keywordScore : 0,
      }));
    }
  } catch (atlasSearchErr) {
    // If $search is not supported in this MongoDB environment, try native text or regex search
  }

  // 2. Attempt MongoDB Native Text Search ($text)
  try {
    const textQuery = {
      $text: { $search: query },
      ...mongoFilter,
    };

    const textResults = await KnowledgeChunk.find(textQuery, {
      _id: 1,
      content: 1,
      sourceType: 1,
      sourceId: 1,
      chunkIndex: 1,
      title: 1,
      company: 1,
      role: 1,
      skill: 1,
      tags: 1,
      keywordScore: { $meta: 'textScore' },
    })
      .sort({ keywordScore: { $meta: 'textScore' } })
      .limit(keywordLimit)
      .lean();

    if (Array.isArray(textResults) && textResults.length > 0) {
      return textResults.map((doc: any) => ({
        chunkId: String(doc._id),
        content: doc.content,
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        chunkIndex: doc.chunkIndex,
        title: doc.title,
        company: doc.company,
        role: doc.role,
        skill: doc.skill,
        tags: doc.tags,
        keywordScore: typeof doc.keywordScore === 'number' ? doc.keywordScore : 1,
      }));
    }
  } catch (textErr) {
    // $text index may not be initialized yet; fallback to term matching
  }

  // 3. Fallback: Search across approved text fields using term matching
  try {
    const terms = query
      .split(/\s+/)
      .map((t) => t.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter((t) => t.length > 1);

    if (terms.length === 0) return [];

    const regex = new RegExp(terms.join('|'), 'i');
    const regexQuery = {
      $or: [
        { content: regex },
        { title: regex },
        { company: regex },
        { role: regex },
        { skill: regex },
        { tags: regex },
      ],
      ...mongoFilter,
    };

    const docs = await KnowledgeChunk.find(regexQuery, {
      _id: 1,
      content: 1,
      sourceType: 1,
      sourceId: 1,
      chunkIndex: 1,
      title: 1,
      company: 1,
      role: 1,
      skill: 1,
      tags: 1,
    })
      .limit(keywordLimit * 2)
      .lean();

    const scoredDocs: RawRetrievalCandidate[] = [];
    for (const doc of docs) {
      // Calculate simple term frequency relevance score
      let score = 0;
      const combinedText = [
        doc.title,
        doc.skill,
        doc.company,
        doc.role,
        doc.content,
        ...(doc.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      for (const term of terms) {
        const lowerTerm = term.toLowerCase();
        if (combinedText.includes(lowerTerm)) {
          score += 1;
        }
      }

      if (score > 0) {
        scoredDocs.push({
          chunkId: String(doc._id),
          content: doc.content,
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          chunkIndex: doc.chunkIndex,
          title: doc.title,
          company: doc.company,
          role: doc.role,
          skill: doc.skill,
          tags: doc.tags,
          keywordScore: score,
        });
      }
    }

    scoredDocs.sort((a, b) => (b.keywordScore ?? 0) - (a.keywordScore ?? 0));
    return scoredDocs.slice(0, keywordLimit);
  } catch (regexErr) {
    return [];
  }
}

/**
 * Central Hybrid Retrieval function for PlacementOS.
 *
 * 1. Validates the query.
 * 2. Generates query embedding using the existing embeddingService.
 * 3. Performs vector retrieval against KnowledgeChunk.
 * 4. Performs keyword/text retrieval against KnowledgeChunk.
 * 5. Merges and deduplicates results by stable chunkId.
 * 6. Normalizes scores (65% semantic / 35% keyword by default).
 * 7. Produces a deterministic final ranking.
 * 8. Returns clean projected retrieval results with NO private fields.
 */
export async function retrieveRelevantKnowledge(
  query: string,
  options: HybridRetrievalOptions = {}
): Promise<HybridRetrievalResult[]> {
  // 1. Query validation
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Query must be a non-empty string');
  }

  // Early return for zero or negative limit
  if (options.limit !== undefined && options.limit <= 0) {
    return [];
  }

  const normalizedQuery = query.trim();
  const embed = options.embeddingGenerator || generateEmbedding;

  // 2. Generate query embedding safely
  let queryEmbedding: number[] | null = null;
  try {
    queryEmbedding = await embed(normalizedQuery);
  } catch (embedErr: any) {
    // On embedding failure, do not leak secrets; allow keyword-only search if possible
    queryEmbedding = null;
  }

  // 3 & 4. Execute Vector and Keyword retrieval concurrently
  const [vectorCandidates, keywordCandidates] = await Promise.all([
    queryEmbedding && queryEmbedding.length > 0
      ? executeVectorSearch(queryEmbedding, options)
      : Promise.resolve([]),
    executeKeywordSearch(normalizedQuery, options),
  ]);

  // 5, 6, 7 & 8. Merge, deduplicate, normalize scores, and deterministically rank
  return mergeAndRankRetrievalResults(vectorCandidates, keywordCandidates, {
    semanticWeight: options.semanticWeight,
    keywordWeight: options.keywordWeight,
    limit: options.limit,
  });
}
