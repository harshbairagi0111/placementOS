import { GoogleGenAI } from '@google/genai';

export const aiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GeminiCallParams {
  contents: any;
  config?: any;
  models?: string[];
  maxRetriesPerModel?: number;
}

/**
 * Executes a resilient Gemini content generation call with automatic
 * retry on transient errors (503 UNAVAILABLE, 429 RATE_LIMIT, timeout)
 * and seamless fallback to secondary models if the primary model is busy.
 */
export async function callGeminiResilient(params: GeminiCallParams) {
  const models = params.models && params.models.length > 0
    ? params.models
    : ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];

  const maxRetries = params.maxRetriesPerModel ?? 2;
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          err?.status === 503 ||
          err?.status === 429 ||
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('temporarily') ||
          errMsg.includes('ECONNRESET') ||
          errMsg.includes('ETIMEDOUT');

        console.warn(`[Gemini Resilient] Model "${model}" (attempt ${attempt}/${maxRetries}) failed:`, errMsg);

        if (isTransient && attempt < maxRetries) {
          // Exponential backoff wait (600ms, 1200ms)
          const waitMs = attempt * 600;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        } else {
          // Break out to try the next fallback model in the list
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini AI model attempts failed.');
}
