import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  KnowledgeChunk,
  IKnowledgeChunk,
  KnowledgeSourceType,
  EXPECTED_EMBEDDING_DIMENSIONS,
} from '../models/KnowledgeChunk';
import {
  RAGKnowledge,
  IRAGKnowledge,
} from '../models/RAGKnowledge';
import {
  InterviewExperience,
  IInterviewExperience,
} from '../models/InterviewExperience';
import {
  SkillQuestion,
  ISkillQuestion,
} from '../models/SkillQuestion';
import {
  AptitudeQuestion,
  IAptitudeQuestion,
} from '../models/AptitudeQuestion';
import {
  JobPosting,
  IJobPosting,
} from '../models/JobPosting';
import { generateEmbedding } from './embeddingService';

export interface ChunkDraft {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  chunkIndex: number;
  chunkKey: string;
  title: string;
  content: string;
  company?: string;
  role?: string;
  skill?: string;
  tags: string[];
  status?: string;
  knowledgeId?: string | mongoose.Types.ObjectId;
  metadata: Record<string, any>;
}

export interface IngestionOptions {
  embeddingGenerator?: (text: string) => Promise<number[]>;
  dryRun?: boolean;
  onProgress?: (message: string) => void;
  limit?: number;
}

export interface SourceIngestionResult {
  sourceType: KnowledgeSourceType;
  sourcesProcessed: number;
  chunksUpserted: number;
  staleChunksCleaned: number;
  skipped: number;
  errors: Array<{ sourceId: string; error: string }>;
}

export interface IngestionSummary {
  startedAt: Date;
  completedAt: Date;
  totalChunksUpserted: number;
  resultsBySource: Record<KnowledgeSourceType, SourceIngestionResult>;
}

/**
 * Deterministic text chunker:
 * - If text is within maxChunkSize, returns single chunk
 * - If text exceeds maxChunkSize, splits cleanly at paragraph or sentence boundaries
 */
export function chunkTextDeterministically(
  text: string,
  contextHeader: string,
  maxChunkSize: number = 1000,
  overlap: number = 100
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= maxChunkSize) {
    return [contextHeader ? `${contextHeader}\n\n${normalized}` : normalized];
  }

  const chunks: string[] = [];
  const paragraphs = normalized.split(/\n{2,}/);
  let currentBuffer = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentBuffer.length + trimmedPara.length + 2 <= maxChunkSize) {
      currentBuffer = currentBuffer ? `${currentBuffer}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentBuffer) {
        chunks.push(contextHeader ? `${contextHeader}\n\n${currentBuffer}` : currentBuffer);
      }

      // If single paragraph is larger than maxChunkSize, split by sentences
      if (trimmedPara.length > maxChunkSize) {
        const sentences = trimmedPara.split(/(?<=[.?!])\s+/);
        let sentenceBuffer = '';
        for (const sentence of sentences) {
          if (sentenceBuffer.length + sentence.length + 1 <= maxChunkSize) {
            sentenceBuffer = sentenceBuffer ? `${sentenceBuffer} ${sentence}` : sentence;
          } else {
            if (sentenceBuffer) {
              chunks.push(contextHeader ? `${contextHeader}\n\n${sentenceBuffer}` : sentenceBuffer);
              const overlapText = sentenceBuffer.slice(-overlap);
              sentenceBuffer = `${overlapText} ${sentence}`.trim();
            } else {
              chunks.push(contextHeader ? `${contextHeader}\n\n${sentence}` : sentence);
              sentenceBuffer = '';
            }
          }
        }
        currentBuffer = sentenceBuffer;
      } else {
        const overlapText = currentBuffer ? currentBuffer.slice(-overlap) : '';
        currentBuffer = overlapText ? `${overlapText}\n\n${trimmedPara}` : trimmedPara;
      }
    }
  }

  if (currentBuffer) {
    chunks.push(contextHeader ? `${contextHeader}\n\n${currentBuffer}` : currentBuffer);
  }

  return chunks.length > 0 ? chunks : [contextHeader ? `${contextHeader}\n\n${normalized}` : normalized];
}

/**
 * Builds deterministic chunk drafts for an InterviewExperience.
 *
 * Rules:
 * - Only approved experiences are eligible
 * - Private student data (studentId, reviewedBy, student identity) is strictly excluded
 */
export function buildInterviewExperienceChunks(
  exp: IInterviewExperience & { _id: any }
): ChunkDraft[] {
  if (exp.status !== 'approved') {
    return [];
  }

  const sourceId = String(exp._id);
  const company = (exp.company || 'Unknown Company').trim();
  const role = (exp.role || 'Software Engineer').trim();
  const difficulty = (exp.difficulty || 'Medium').trim();
  const outcome = (exp.outcome || 'Awaiting Result').trim();

  const formattedQuestions = (exp.questionsAsked || [])
    .map((q, idx) => `Question ${idx + 1} (${q.type}): ${q.text}`)
    .join('\n');

  const contextHeader = `[Interview Experience: ${company} | Role: ${role} | Difficulty: ${difficulty}]`;

  const bodyParts = [
    `Company: ${company}`,
    `Role: ${role}`,
    `Difficulty: ${difficulty}`,
    `Outcome: ${outcome}`,
    exp.roundsDescription ? `Rounds & Interview Process:\n${exp.roundsDescription.trim()}` : '',
    formattedQuestions ? `Interview Questions Asked:\n${formattedQuestions}` : '',
  ].filter(Boolean);

  const fullText = bodyParts.join('\n\n');
  const textChunks = chunkTextDeterministically(fullText, contextHeader, 1200, 100);

  const tags = Array.from(
    new Set([
      'interview_experience',
      company.toLowerCase(),
      role.toLowerCase(),
      difficulty.toLowerCase(),
      outcome.toLowerCase(),
    ])
  );

  return textChunks.map((content, idx) => ({
    sourceType: 'interview_experience' as KnowledgeSourceType,
    sourceId,
    chunkIndex: idx,
    chunkKey: `interview_experience:${sourceId}:${idx}`,
    title: `${company} - ${role} Interview Experience (Part ${idx + 1}/${textChunks.length})`,
    content,
    company,
    role,
    tags,
    status: 'approved',
    metadata: {
      company,
      role,
      difficulty,
      outcome,
      questionsCount: (exp.questionsAsked || []).length,
    },
  }));
}

/**
 * Builds deterministic chunk drafts for a SkillQuestion.
 *
 * Rules:
 * - Only active questions are eligible
 * - Strictly excludes security-sensitive answer keys (correctAnswerIndex, optionWeights)
 * - Retains educational scenario, code snippet, and explanation
 */
export function buildSkillQuestionChunks(
  q: ISkillQuestion & { _id: any }
): ChunkDraft[] {
  if (q.isActive === false) {
    return [];
  }

  const sourceId = String(q._id);
  const skill = (q.skill || 'General').trim();
  const category = (q.category || 'technical').trim();
  const difficulty = (q.difficulty || 'Intermediate').trim();

  const parts = [
    `Skill: ${skill}`,
    `Category: ${category}`,
    `Difficulty: ${difficulty}`,
    `Question: ${q.questionText.trim()}`,
    q.scenarioText?.trim() ? `Scenario:\n${q.scenarioText.trim()}` : '',
    q.codeSnippet?.trim() ? `Code Snippet:\n\`\`\`\n${q.codeSnippet.trim()}\n\`\`\`` : '',
    q.explanation?.trim() ? `Educational Explanation:\n${q.explanation.trim()}` : '',
  ].filter(Boolean);

  const content = parts.join('\n\n');
  const tags = Array.from(
    new Set(['skill_question', skill.toLowerCase(), category.toLowerCase(), difficulty.toLowerCase()])
  );

  return [
    {
      sourceType: 'skill_question' as KnowledgeSourceType,
      sourceId,
      chunkIndex: 0,
      chunkKey: `skill_question:${sourceId}:0`,
      title: `${skill} Skill Concept (${difficulty})`,
      content,
      skill,
      tags,
      status: 'active',
      metadata: {
        skill,
        skillId: q.skillId,
        category,
        difficulty,
      },
    },
  ];
}

/**
 * Builds deterministic chunk drafts for an AptitudeQuestion.
 *
 * Rules:
 * - Only questions with meaningful educational explanations are indexed
 * - Strictly excludes correctAnswerIndex and raw option letters/keys
 */
export function buildAptitudeQuestionChunks(
  aq: IAptitudeQuestion & { _id: any }
): ChunkDraft[] {
  const explanation = aq.explanation?.trim();
  if (!explanation) {
    // Skip questions without educational explanation
    return [];
  }

  const sourceId = String(aq._id);
  const category = (aq.category || 'Quantitative').trim();
  const subtopic = (aq.subtopic || 'General').trim();
  const difficulty = (aq.difficulty || 'Medium').trim();

  const parts = [
    `Aptitude Category: ${category}`,
    `Subtopic: ${subtopic}`,
    `Difficulty: ${difficulty}`,
    `Problem Concept:\n${aq.questionTemplate.trim()}`,
    `Educational Explanation & Solution Approach:\n${explanation}`,
  ];

  const content = parts.join('\n\n');
  const tags = Array.from(
    new Set(['aptitude_question', category.toLowerCase(), subtopic.toLowerCase(), difficulty.toLowerCase()])
  );

  return [
    {
      sourceType: 'aptitude_question' as KnowledgeSourceType,
      sourceId,
      chunkIndex: 0,
      chunkKey: `aptitude_question:${sourceId}:0`,
      title: `Aptitude: ${category} - ${subtopic} (${difficulty})`,
      content,
      tags,
      status: 'active',
      metadata: {
        category,
        subtopic,
        difficulty,
      },
    },
  ];
}

/**
 * Builds deterministic chunk drafts for a JobPosting.
 *
 * Rules:
 * - Only active postings are indexed
 * - Strictly excludes recruiterId, authentication data, and applicant records
 */
export function buildJobPostingChunks(
  job: IJobPosting & { _id: any }
): ChunkDraft[] {
  if (job.status !== 'Active') {
    return [];
  }

  const sourceId = String(job._id);
  const company = (job.company || 'Unknown Company').trim();
  const title = (job.title || 'Job Opening').trim();
  const type = (job.type || 'Job').trim();
  const location = (job.location || 'Remote / Hybrid').trim();
  const ctc = (job.ctc || '').trim();

  const formattedSkills = (job.requiredSkills || [])
    .map((s) => (typeof s === 'string' ? s : s?.skill))
    .filter(Boolean)
    .join(', ');

  const contextHeader = `[Job Opportunity: ${company} | Title: ${title} | Type: ${type}]`;

  const bodyParts = [
    `Company: ${company}`,
    `Title: ${title}`,
    `Type: ${type}`,
    ctc ? `Compensation: ${ctc}` : '',
    location ? `Location: ${location}` : '',
    formattedSkills ? `Required Competencies & Skills: ${formattedSkills}` : '',
    job.description?.trim() ? `Role Overview & Responsibilities:\n${job.description.trim()}` : '',
  ].filter(Boolean);

  const fullText = bodyParts.join('\n\n');
  const textChunks = chunkTextDeterministically(fullText, contextHeader, 1200, 100);

  const tags = Array.from(
    new Set(['job_posting', type.toLowerCase(), company.toLowerCase(), location.toLowerCase()])
  );

  return textChunks.map((content, idx) => ({
    sourceType: 'job_posting' as KnowledgeSourceType,
    sourceId,
    chunkIndex: idx,
    chunkKey: `job_posting:${sourceId}:${idx}`,
    title: `${company} - ${title} Opportunity (Part ${idx + 1}/${textChunks.length})`,
    content,
    company,
    role: title,
    tags,
    status: 'Active',
    metadata: {
      company,
      title,
      type,
      location,
      ctc,
      requiredSkillsCount: (job.requiredSkills || []).length,
    },
  }));
}

/**
 * Upserts a set of chunk drafts into MongoDB deterministically:
 * - Generates embeddings using the specified embedding generator
 * - Upserts via chunkKey to prevent duplicates
 * - Cleans up any stale chunks if the chunk count has decreased
 */
export async function upsertChunksForSource(
  sourceType: KnowledgeSourceType,
  sourceId: string,
  chunks: ChunkDraft[],
  options: IngestionOptions = {}
): Promise<{ upserted: number; cleaned: number }> {
  const embed = options.embeddingGenerator || generateEmbedding;

  if (chunks.length === 0) {
    // If source is no longer eligible, clean up all chunks for this source
    const deleteResult = await KnowledgeChunk.deleteMany({ sourceType, sourceId });
    return { upserted: 0, cleaned: deleteResult.deletedCount || 0 };
  }

  let upsertedCount = 0;

  for (const chunk of chunks) {
    const contentHash = crypto.createHash('sha256').update(chunk.content).digest('hex');
    let embedding: number[] = [];

    // Idempotency: Check if existing chunk already has identical content and valid embedding
    const existingChunk = await KnowledgeChunk.findOne({ chunkKey: chunk.chunkKey }).lean();
    if (
      existingChunk &&
      existingChunk.contentHash === contentHash &&
      Array.isArray(existingChunk.embedding) &&
      existingChunk.embedding.length === EXPECTED_EMBEDDING_DIMENSIONS &&
      existingChunk.status === chunk.status &&
      !options.dryRun
    ) {
      // Content unchanged — reuse existing embedding without redundant API calls
      embedding = existingChunk.embedding;
    } else if (!options.dryRun) {
      embedding = await embed(chunk.content);
    } else {
      embedding = Array(EXPECTED_EMBEDDING_DIMENSIONS).fill(0.01);
    }

    if (!Array.isArray(embedding) || embedding.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EXPECTED_EMBEDDING_DIMENSIONS}, received ${embedding?.length ?? 0}`
      );
    }

    await KnowledgeChunk.findOneAndUpdate(
      { chunkKey: chunk.chunkKey },
      {
        $set: {
          content: chunk.content,
          contentHash,
          knowledgeId: chunk.knowledgeId || chunk.metadata?.knowledgeId,
          embedding,
          sourceType: chunk.sourceType,
          sourceId: chunk.sourceId,
          chunkIndex: chunk.chunkIndex,
          chunkKey: chunk.chunkKey,
          title: chunk.title,
          company: chunk.company,
          role: chunk.role,
          skill: chunk.skill,
          tags: chunk.tags,
          status: chunk.status,
          metadata: chunk.metadata,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    upsertedCount++;
  }

  // Clean up any stale chunks if chunk count decreased
  const cleanResult = await KnowledgeChunk.deleteMany({
    sourceType,
    sourceId,
    chunkIndex: { $gte: chunks.length },
  });

  return {
    upserted: upsertedCount,
    cleaned: cleanResult.deletedCount || 0,
  };
}

/**
 * ARCHITECTURAL SAFETY GUARD:
 * Direct operational RAG ingestion from InterviewExperience is strictly PROHIBITED.
 * Operational collections serve transactional features (e.g. peer interview reviews)
 * and must NOT be directly ingested into KnowledgeChunk.
 * All curated RAG knowledge must reside canonically in RAGKnowledge.
 */
export async function ingestInterviewExperiences(
  _options: IngestionOptions = {}
): Promise<SourceIngestionResult> {
  console.warn(
    '[RAG Architecture Warning] Direct operational ingestion from InterviewExperience is prohibited. RAGKnowledge is the sole canonical RAG corpus.'
  );
  return {
    sourceType: 'interview_experience',
    sourcesProcessed: 0,
    chunksUpserted: 0,
    staleChunksCleaned: 0,
    skipped: 0,
    errors: [
      {
        sourceId: 'PROHIBITED',
        error:
          'Direct operational ingestion from InterviewExperience is prohibited. Curate into RAGKnowledge instead.',
      },
    ],
  };
}

/**
 * ARCHITECTURAL SAFETY GUARD:
 * Direct operational RAG ingestion from SkillQuestion is strictly PROHIBITED.
 * Operational collections serve transactional features (e.g. skill testing & scoring)
 * and must NOT be directly ingested into KnowledgeChunk.
 * All curated RAG knowledge must reside canonically in RAGKnowledge.
 */
export async function ingestSkillQuestions(
  _options: IngestionOptions = {}
): Promise<SourceIngestionResult> {
  console.warn(
    '[RAG Architecture Warning] Direct operational ingestion from SkillQuestion is prohibited. RAGKnowledge is the sole canonical RAG corpus.'
  );
  return {
    sourceType: 'skill_question',
    sourcesProcessed: 0,
    chunksUpserted: 0,
    staleChunksCleaned: 0,
    skipped: 0,
    errors: [
      {
        sourceId: 'PROHIBITED',
        error:
          'Direct operational ingestion from SkillQuestion is prohibited. Curate into RAGKnowledge instead.',
      },
    ],
  };
}

/**
 * ARCHITECTURAL SAFETY GUARD:
 * Direct operational RAG ingestion from AptitudeQuestion is strictly PROHIBITED.
 * Operational collections serve transactional features (e.g. aptitude assessments)
 * and must NOT be directly ingested into KnowledgeChunk.
 * All curated RAG knowledge must reside canonically in RAGKnowledge.
 */
export async function ingestAptitudeQuestions(
  _options: IngestionOptions = {}
): Promise<SourceIngestionResult> {
  console.warn(
    '[RAG Architecture Warning] Direct operational ingestion from AptitudeQuestion is prohibited. RAGKnowledge is the sole canonical RAG corpus.'
  );
  return {
    sourceType: 'aptitude_question',
    sourcesProcessed: 0,
    chunksUpserted: 0,
    staleChunksCleaned: 0,
    skipped: 0,
    errors: [
      {
        sourceId: 'PROHIBITED',
        error:
          'Direct operational ingestion from AptitudeQuestion is prohibited. Curate into RAGKnowledge instead.',
      },
    ],
  };
}

/**
 * ARCHITECTURAL SAFETY GUARD:
 * Direct operational RAG ingestion from JobPosting is strictly PROHIBITED.
 * Operational collections serve transactional features (e.g. recruiter job board & applications)
 * and must NOT be directly ingested into KnowledgeChunk.
 * All curated RAG knowledge must reside canonically in RAGKnowledge.
 */
export async function ingestJobPostings(
  _options: IngestionOptions = {}
): Promise<SourceIngestionResult> {
  console.warn(
    '[RAG Architecture Warning] Direct operational ingestion from JobPosting is prohibited. RAGKnowledge is the sole canonical RAG corpus.'
  );
  return {
    sourceType: 'job_posting',
    sourcesProcessed: 0,
    chunksUpserted: 0,
    staleChunksCleaned: 0,
    skipped: 0,
    errors: [
      {
        sourceId: 'PROHIBITED',
        error:
          'Direct operational ingestion from JobPosting is prohibited. Curate into RAGKnowledge instead.',
      },
    ],
  };
}

/**
 * Builds deterministic chunk drafts for a canonical RAGKnowledge MongoDB record.
 *
 * Rules:
 * - Only status === 'active' records are eligible
 * - Private student/recruiter data does not exist in RAGKnowledge
 * - Creates deterministic chunk keys: `${rag.sourceType}:${rag.sourceId}:${chunkIndex}`
 * - Links knowledgeId back to canonical RAGKnowledge._id
 */
export function buildRAGKnowledgeChunks(
  rag: IRAGKnowledge & { _id: any }
): ChunkDraft[] {
  if (rag.status !== 'active') {
    return [];
  }

  const sourceId = String(rag.sourceId).trim();
  const knowledgeId = String(rag._id);
  const title = (rag.title || 'Curated Knowledge').trim();
  const category = (rag.category || 'general').trim();
  const difficulty = (rag.difficulty || '').trim();
  const skill = rag.skills && rag.skills.length > 0 ? rag.skills[0] : undefined;
  const role = rag.roles && rag.roles.length > 0 ? rag.roles[0] : undefined;
  const company = rag.metadata?.company ? String(rag.metadata.company).trim() : undefined;

  const contextHeader = `[${rag.sourceType.toUpperCase()} | Category: ${category}${difficulty ? ` | Difficulty: ${difficulty}` : ''}]`;
  const textChunks = chunkTextDeterministically(rag.content, contextHeader, 1200, 100);

  const tags = Array.from(
    new Set([
      rag.sourceType,
      category.toLowerCase(),
      ...(rag.tags || []).map((t) => t.toLowerCase()),
      ...(rag.skills || []).map((s) => s.toLowerCase()),
      ...(rag.roles || []).map((r) => r.toLowerCase()),
      ...(difficulty ? [difficulty.toLowerCase()] : []),
    ])
  );

  return textChunks.map((content, idx) => ({
    sourceType: rag.sourceType as KnowledgeSourceType,
    sourceId,
    knowledgeId,
    chunkIndex: idx,
    chunkKey: `${rag.sourceType}:${sourceId}:${idx}`,
    title: textChunks.length > 1 ? `${title} (Part ${idx + 1}/${textChunks.length})` : title,
    content,
    company,
    role,
    skill,
    tags,
    status: 'active',
    metadata: {
      ...rag.metadata,
      knowledgeId,
      version: rag.version,
      category: rag.category,
      difficulty: rag.difficulty,
      skills: rag.skills,
      roles: rag.roles,
    },
  }));
}

export interface RAGKnowledgeIngestionResult extends SourceIngestionResult {
  totalProcessed: number;
  totalChunksUpserted: number;
  totalStaleCleaned: number;
  resultsBySource: Record<KnowledgeSourceType, SourceIngestionResult>;
}

/**
 * Ingests all active canonical RAGKnowledge records from MongoDB into KnowledgeChunks.
 * Cleans up any chunks for records that have transitioned to status === 'inactive'.
 *
 * This is the ONLY canonical ingestion pathway in the PlacementOS RAG architecture.
 */
export async function ingestRAGKnowledge(
  options: IngestionOptions = {}
): Promise<RAGKnowledgeIngestionResult> {
  const result: RAGKnowledgeIngestionResult = {
    sourceType: 'skill_question' as KnowledgeSourceType,
    sourcesProcessed: 0,
    totalProcessed: 0,
    chunksUpserted: 0,
    totalChunksUpserted: 0,
    staleChunksCleaned: 0,
    totalStaleCleaned: 0,
    skipped: 0,
    errors: [],
    resultsBySource: {
      skill_question: {
        sourceType: 'skill_question',
        sourcesProcessed: 0,
        chunksUpserted: 0,
        staleChunksCleaned: 0,
        skipped: 0,
        errors: [],
      },
      aptitude_question: {
        sourceType: 'aptitude_question',
        sourcesProcessed: 0,
        chunksUpserted: 0,
        staleChunksCleaned: 0,
        skipped: 0,
        errors: [],
      },
      interview_experience: {
        sourceType: 'interview_experience',
        sourcesProcessed: 0,
        chunksUpserted: 0,
        staleChunksCleaned: 0,
        skipped: 0,
        errors: [],
      },
      job_posting: {
        sourceType: 'job_posting',
        sourcesProcessed: 0,
        chunksUpserted: 0,
        staleChunksCleaned: 0,
        skipped: 0,
        errors: [],
      },
      career_guidance: {
        sourceType: 'career_guidance',
        sourcesProcessed: 0,
        chunksUpserted: 0,
        staleChunksCleaned: 0,
        skipped: 0,
        errors: [],
      },
    },
  };

  const getSourceBucket = (st: string): SourceIngestionResult => {
    if (!result.resultsBySource[st]) {
      result.resultsBySource[st] = {
        sourceType: st,
        sourcesProcessed: 0,
        chunksUpserted: 0,
        staleChunksCleaned: 0,
        skipped: 0,
        errors: [],
      };
    }
    return result.resultsBySource[st];
  };

  // 1. Clean up any chunks for records marked inactive in RAGKnowledge
  const inactiveRecords = await RAGKnowledge.find({ status: 'inactive' }).lean();
  for (const inact of inactiveRecords) {
    const bucket = getSourceBucket(inact.sourceType);
    try {
      const cleanRes = await KnowledgeChunk.deleteMany({
        $or: [{ sourceId: inact.sourceId }, { knowledgeId: inact._id }],
      });
      const cleaned = cleanRes.deletedCount || 0;
      bucket.staleChunksCleaned += cleaned;
      result.staleChunksCleaned += cleaned;
      result.totalStaleCleaned += cleaned;
    } catch (cleanErr: any) {
      const errMsg = `Failed cleaning inactive record chunks: ${cleanErr.message || String(cleanErr)}`;
      bucket.errors.push({ sourceId: inact.sourceId, error: errMsg });
      result.errors.push({ sourceId: inact.sourceId, error: errMsg });
    }
  }

  // 2. Query all active canonical RAGKnowledge records from MongoDB
  let activeQuery = RAGKnowledge.find({ status: 'active' });
  if (options.limit && options.limit > 0) {
    activeQuery = activeQuery.limit(options.limit);
  }
  const activeRecords = await activeQuery.lean();

  for (const rag of activeRecords) {
    const bucket = getSourceBucket(rag.sourceType);
    bucket.sourcesProcessed++;
    result.sourcesProcessed++;
    result.totalProcessed++;

    try {
      const chunks = buildRAGKnowledgeChunks(rag as any);
      if (chunks.length === 0) {
        bucket.skipped++;
        result.skipped++;
        continue;
      }
      const { upserted, cleaned } = await upsertChunksForSource(
        rag.sourceType as KnowledgeSourceType,
        rag.sourceId,
        chunks,
        options
      );
      bucket.chunksUpserted += upserted;
      bucket.staleChunksCleaned += cleaned;
      result.chunksUpserted += upserted;
      result.totalChunksUpserted += upserted;
      result.staleChunksCleaned += cleaned;
      result.totalStaleCleaned += cleaned;
    } catch (err: any) {
      const errMsg = err.message || String(err);
      bucket.errors.push({ sourceId: rag.sourceId, error: errMsg });
      result.errors.push({ sourceId: rag.sourceId, error: errMsg });
    }
  }

  return result;
}

/**
 * Ingests all supported sources into the PlacementOS Knowledge Base.
 * In accordance with Fix #11.6.1, RAGKnowledge is the SOLE canonical RAG corpus.
 * Operational collections (InterviewExperience, SkillQuestion, AptitudeQuestion, JobPosting)
 * are NEVER directly ingested into KnowledgeChunk.
 */
export async function ingestAllKnowledgeSources(
  options: IngestionOptions = {}
): Promise<IngestionSummary> {
  const startedAt = new Date();

  options.onProgress?.('[Ingestion] Ingesting canonical RAGKnowledge corpus (MongoDB)...');
  const ragReport = await ingestRAGKnowledge(options);

  return {
    startedAt,
    completedAt: new Date(),
    totalChunksUpserted: ragReport.totalChunksUpserted,
    resultsBySource: ragReport.resultsBySource,
  };
}

/**
 * Reconciles legacy operational KnowledgeChunk documents created prior to Fix #11.6.1.
 * Ensures backward compatibility without destructive deletion:
 * - Annotates legacy chunks with `metadata.legacyDirectIngestion = true`
 * - Links knowledgeId for any chunks that match canonical RAGKnowledge records
 */
export async function reconcileLegacyOperationalChunks(): Promise<{
  legacyCount: number;
  linkedCount: number;
  annotatedCount: number;
}> {
  const legacyChunks = await KnowledgeChunk.find({
    $or: [{ knowledgeId: { $exists: false } }, { knowledgeId: null }],
  }).lean();

  if (legacyChunks.length === 0) {
    return { legacyCount: 0, linkedCount: 0, annotatedCount: 0 };
  }

  const sourceIds = Array.from(new Set(legacyChunks.map((c) => c.sourceId)));
  const canonicals = await RAGKnowledge.find({ sourceId: { $in: sourceIds } }).lean();
  const canonicalMap = new Map<string, any>(canonicals.map((c) => [c.sourceId, c]));

  let linkedCount = 0;
  let annotatedCount = 0;

  const bulkOps: any[] = [];

  for (const chunk of legacyChunks) {
    const canonical = canonicalMap.get(chunk.sourceId);
    if (canonical) {
      bulkOps.push({
        updateOne: {
          filter: { _id: chunk._id },
          update: {
            $set: {
              knowledgeId: canonical._id,
              'metadata.canonicalRAG': true,
              'metadata.knowledgeId': String(canonical._id),
            },
          },
        },
      });
      linkedCount++;
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: chunk._id },
          update: {
            $set: {
              'metadata.legacyDirectIngestion': true,
              'metadata.canonicalRAG': false,
            },
          },
        },
      });
      annotatedCount++;
    }
  }

  if (bulkOps.length > 0) {
    await KnowledgeChunk.bulkWrite(bulkOps);
  }

  return {
    legacyCount: legacyChunks.length,
    linkedCount,
    annotatedCount,
  };
}
