import { HybridRetrievalResult } from './hybridRetrievalService';

/**
 * Standard context boundary constants for AI Mentor RAG.
 */
export const RECENT_MESSAGES_LIMIT = 20;
export const RETRIEVAL_LIMIT = 5;
export const MEMORY_RECORDS_LIMIT = 20;
export const MAX_RETRIEVED_KNOWLEDGE_CHARS = 8000;

/**
 * Whitelisted public metadata fields permitted in sanitized knowledge chunks.
 * Private security, administrative, and database internals are strictly excluded.
 */
export const PERMITTED_CHUNK_FIELDS = [
  'chunkId',
  'sourceType',
  'sourceId',
  'chunkIndex',
  'title',
  'company',
  'role',
  'skill',
  'content',
  'tags',
  'hybridScore',
  'vectorScore',
  'keywordScore',
] as const;

/**
 * Sensitive fields that must NEVER appear in prompt context or public API responses.
 */
export const SENSITIVE_PRIVATE_FIELDS = [
  'studentId',
  'recruiterId',
  'reviewerId',
  'password',
  'correctAnswerIndex',
  'optionWeights',
  'answerKey',
  'embedding',
  '__v',
  '_id',
] as const;

export interface SanitizedKnowledgeChunk {
  chunkId: string;
  sourceType: string;
  sourceId?: string;
  chunkIndex?: number;
  title?: string;
  company?: string;
  role?: string;
  skill?: string;
  content: string;
  tags?: string[];
  hybridScore?: number;
}

export interface GuardrailOptions {
  maxChunks?: number;
  maxChars?: number;
}

/**
 * Sanitizes a single knowledge chunk or candidate object.
 * Strips all internal database properties, private IDs, answer keys, and embeddings.
 */
export function sanitizeKnowledgeChunk(rawChunk: any): SanitizedKnowledgeChunk | null {
  if (!rawChunk || typeof rawChunk !== 'object') return null;

  const content = typeof rawChunk.content === 'string' ? rawChunk.content.trim() : '';
  if (!content) return null;

  const sourceType = typeof rawChunk.sourceType === 'string' ? rawChunk.sourceType : 'general';
  const chunkId = typeof rawChunk.chunkId === 'string'
    ? rawChunk.chunkId
    : String(rawChunk._id || `chunk-${Date.now()}`);

  const sanitized: SanitizedKnowledgeChunk = {
    chunkId,
    sourceType,
    content,
  };

  if (typeof rawChunk.sourceId === 'string') sanitized.sourceId = rawChunk.sourceId;
  if (typeof rawChunk.chunkIndex === 'number') sanitized.chunkIndex = rawChunk.chunkIndex;
  if (typeof rawChunk.title === 'string' && rawChunk.title.trim()) sanitized.title = rawChunk.title.trim();
  if (typeof rawChunk.company === 'string' && rawChunk.company.trim()) sanitized.company = rawChunk.company.trim();
  if (typeof rawChunk.role === 'string' && rawChunk.role.trim()) sanitized.role = rawChunk.role.trim();
  if (typeof rawChunk.skill === 'string' && rawChunk.skill.trim()) sanitized.skill = rawChunk.skill.trim();
  if (Array.isArray(rawChunk.tags)) {
    sanitized.tags = rawChunk.tags.filter((t: any) => typeof t === 'string' && t.trim());
  }
  if (typeof rawChunk.hybridScore === 'number') {
    sanitized.hybridScore = Math.round(rawChunk.hybridScore * 1000) / 1000;
  }

  return sanitized;
}

/**
 * Builds safe, delimited, untrusted-context reference text for Gemini prompt injection resistance.
 *
 * Rules:
 * 1. Chunks are bounded to maxChunks (default RETRIEVAL_LIMIT = 5).
 * 2. Only whitelisted public metadata is rendered.
 * 3. Each chunk is explicitly enclosed in demarcation blocks and marked as passive reference material.
 * 4. Overall text size is bounded by maxChars (default MAX_RETRIEVED_KNOWLEDGE_CHARS = 8000).
 * 5. If empty, outputs clear non-hallucination instruction.
 */
export function buildRetrievedKnowledgeContext(
  results: HybridRetrievalResult[] | any[],
  options: GuardrailOptions = {}
): string {
  const maxChunks = options.maxChunks ?? RETRIEVAL_LIMIT;
  const maxChars = options.maxChars ?? MAX_RETRIEVED_KNOWLEDGE_CHARS;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return 'No relevant PlacementOS reference documents were found for this query.';
  }

  const sanitizedChunks: SanitizedKnowledgeChunk[] = [];
  for (const raw of results.slice(0, maxChunks)) {
    const clean = sanitizeKnowledgeChunk(raw);
    if (clean) sanitizedChunks.push(clean);
  }

  if (sanitizedChunks.length === 0) {
    return 'No relevant PlacementOS reference documents were found for this query.';
  }

  const renderedBlocks: string[] = [];
  let currentLength = 0;

  for (let i = 0; i < sanitizedChunks.length; i++) {
    const chunk = sanitizedChunks[i];
    const header = [
      `--- KNOWLEDGE CHUNK ${i + 1} ---`,
      `[Type: Reference Material | Untrusted Document Content]`,
      `Source Type: ${chunk.sourceType}`,
    ];

    if (chunk.title) header.push(`Title: ${chunk.title}`);
    if (chunk.company) header.push(`Company: ${chunk.company}`);
    if (chunk.role) header.push(`Role: ${chunk.role}`);
    if (chunk.skill) header.push(`Skill: ${chunk.skill}`);

    header.push(`Content:`);
    header.push(chunk.content);
    header.push(`--- END KNOWLEDGE CHUNK ${i + 1} ---`);

    const blockText = header.join('\n');
    if (currentLength + blockText.length > maxChars && renderedBlocks.length > 0) {
      // Reached character budget; stop adding additional chunks to avoid prompt bloat
      break;
    }

    renderedBlocks.push(blockText);
    currentLength += blockText.length + 2;
  }

  return renderedBlocks.join('\n\n');
}

export interface GroundingValidationResult {
  isValid: boolean;
  violations: string[];
}

/**
 * Validates that a constructed prompt adheres to grounding guardrails:
 * - Proper delimiter structures exist
 * - Retrieved section is marked as reference material
 * - No sensitive private fields or embeddings leak into the prompt
 */
export function validateGroundingPrompt(prompt: string): GroundingValidationResult {
  const violations: string[] = [];

  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, violations: ['Prompt is empty or not a string'] };
  }

  // 1. Delimiter checks
  const requiredSections = [
    '=== SYSTEM INSTRUCTIONS ===',
    '=== STUDENT CONTEXT ===',
    '=== RETRIEVED PLACEMENTOS KNOWLEDGE ===',
    '=== CURRENT QUESTION ===',
  ];

  for (const section of requiredSections) {
    if (!prompt.includes(section)) {
      violations.push(`Missing required section delimiter: ${section}`);
    }
  }

  // 2. Sensitive private field leaks
  for (const sensitive of SENSITIVE_PRIVATE_FIELDS) {
    // Check if property appears as JSON key or labeled field, e.g. "studentId:", "password:"
    const regex = new RegExp(`\\b${sensitive}\\b\\s*[:=]`, 'i');
    if (regex.test(prompt)) {
      violations.push(`Prompt leaks sensitive private field: ${sensitive}`);
    }
  }

  // 3. Raw vector embedding leak (e.g. array of 50+ floating point numbers)
  const embeddingArrayPattern = /\[\s*(-?\d+\.\d+,\s*){20,}/;
  if (embeddingArrayPattern.test(prompt)) {
    violations.push('Prompt leaks raw numeric embedding vectors');
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
