import { aiClient } from '../../routes/geminiClient';
import { EXPECTED_EMBEDDING_DIMENSIONS } from '../models/KnowledgeChunk';

export const DEFAULT_EMBEDDING_MODEL = process.env.RAG_EMBEDDING_MODEL?.trim() || 'gemini-embedding-2-preview';

export interface EmbeddingOptions {
  model?: string;
  expectedDimension?: number;
}

/**
 * Normalizes input text for embedding generation:
 * - Trims leading/trailing whitespace
 * - Collapses excessive whitespace and blank lines into single spaces
 */
export function normalizeTextForEmbedding(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to embed must be a non-empty string');
  }

  const normalized = text.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    throw new Error('Text to embed must be a non-empty string');
  }

  return normalized;
}

/**
 * Returns expected embedding dimension for the given or default model
 */
export function getEmbeddingDimension(model: string = DEFAULT_EMBEDDING_MODEL): number {
  if (model.includes('text-embedding-004') || model.includes('gemini-embedding-2')) {
    return EXPECTED_EMBEDDING_DIMENSIONS; // 768
  }
  return EXPECTED_EMBEDDING_DIMENSIONS;
}

/**
 * Strips sensitive strings (API keys, authorization headers) from error messages
 */
function sanitizeErrorMessage(error: any): string {
  let msg = error?.message || String(error);
  msg = msg.replace(/key=[^& \s]+/gi, 'key=REDACTED');
  msg = msg.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer REDACTED');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) {
    msg = msg.split(process.env.GEMINI_API_KEY).join('REDACTED');
  }
  return msg;
}

/**
 * Validates that an embedding vector is a valid, non-empty array of numbers
 * and matches the expected dimension.
 * Throws an Error containing "dimension mismatch" if the vector length does not match expectedDim.
 */
export function validateEmbeddingVector(
  values: number[],
  expectedDim?: number,
  model: string = DEFAULT_EMBEDDING_MODEL
): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`Embedding model "${model}" did not return a valid embedding vector`);
  }

  const isValidNumeric = values.every((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!isValidNumeric) {
    throw new Error(`Embedding vector from model "${model}" contains non-numeric or NaN values`);
  }

  if (expectedDim && values.length !== expectedDim) {
    throw new Error(
      `Embedding dimension mismatch: expected ${expectedDim}, received ${values.length}`
    );
  }

  return values;
}

/**
 * Generates a single numeric vector embedding for the provided text.
 *
 * Requirements:
 * - Rejects empty or non-string text
 * - Normalizes input text
 * - Checks for GEMINI_API_KEY without exposing credentials
 * - Calls Google's embedContent API via the shared aiClient
 * - Validates numeric array representation and vector dimensions
 * - Sanitizes errors to prevent secret leakage
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  const normalizedText = normalizeTextForEmbedding(text);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Embeddings cannot be generated.');
  }

  const model = options.model || DEFAULT_EMBEDDING_MODEL;
  const expectedDim = options.expectedDimension ?? getEmbeddingDimension(model);

  try {
    const response = await aiClient.models.embedContent({
      model,
      contents: normalizedText,
      config: expectedDim ? { outputDimensionality: expectedDim } : undefined,
    });

    const values: number[] =
      (response as any)?.embedding?.values ||
      (response as any)?.embeddings?.[0]?.values ||
      (Array.isArray((response as any)?.values) ? (response as any).values : []);

    return validateEmbeddingVector(values, expectedDim, model);
  } catch (error: any) {
    const safeMessage = sanitizeErrorMessage(error);
    throw new Error(`Failed to generate embedding: ${safeMessage}`);
  }
}

/**
 * Generates embeddings for multiple texts sequentially or in small controlled batches.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: EmbeddingOptions = {}
): Promise<number[][]> {
  if (!Array.isArray(texts)) {
    throw new Error('Texts to embed must be an array of strings');
  }

  const results: number[][] = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text, options);
    results.push(embedding);
  }
  return results;
}
