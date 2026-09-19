import { HybridRetrievalResult } from './hybridRetrievalService';
import { KnowledgeSourceType } from '../models/KnowledgeChunk';

/**
 * Definition of a deterministic RAG evaluation case.
 */
export interface RagEvaluationCase {
  id: string;
  query: string;
  expectedSourceTypes: KnowledgeSourceType[];
  expectedKeywords: string[];
  expectedCompany?: string;
  expectedRole?: string;
  expectedSkill?: string;
  /**
   * Optional defensible ground-truth count of expected relevant records for this benchmark case.
   * If provided, Recall@K = Math.min(1, relevantCount / expectedRelevantCount).
   */
  expectedRelevantCount?: number;
  description?: string;
}

/**
 * Result of evaluating a single evaluation case.
 */
export interface CaseEvaluationResult {
  caseId: string;
  query: string;
  k: number;
  retrievedCount: number;
  relevantCount: number;
  hitAtK: boolean;
  precisionAtK: number;
  recallAtK: number | null; // null if total relevant is unknown/unspecified
  reciprocalRank: number; // 1 / rank of first relevant result, or 0
  firstRelevantRank: number | null;
  judgments: Array<{
    chunkId: string;
    sourceType: string;
    title?: string;
    company?: string;
    role?: string;
    skill?: string;
    isRelevant: boolean;
    matchedCriteria: string[];
  }>;
}

/**
 * Aggregate report for a full evaluation run.
 */
export interface SuiteEvaluationReport {
  timestamp: Date;
  totalCases: number;
  k: number;
  hitRate: number; // Hit@K percentage (0 to 1)
  meanPrecision: number; // Precision@K average (0 to 1)
  meanRecall?: number | null; // Average Recall@K across cases with defensible denominators
  mrr: number; // Mean Reciprocal Rank (0 to 1)
  passedThresholds: boolean;
  thresholds: {
    minHitRate: number;
    minPrecision: number;
    minMrr: number;
  };
  caseResults: CaseEvaluationResult[];
  failedCases: CaseEvaluationResult[];
}

/**
 * Determines deterministically whether a retrieved chunk is relevant to the evaluation case.
 *
 * Deterministic Relevance Rules:
 * 1. Source type MUST be in expectedSourceTypes. Otherwise isRelevant = false.
 * 2. If expectedCompany is specified, the result MUST match it case-insensitively across:
 *    company, title, content, or tags. Otherwise isRelevant = false.
 * 3. If expectedRole is specified, the result MUST match it case-insensitively across:
 *    role, title, content, or tags. Otherwise isRelevant = false.
 * 4. If expectedSkill is specified, the result MUST match it case-insensitively across:
 *    skill, title, content, or tags. Otherwise isRelevant = false.
 * 5. At least one expected keyword MUST match case-insensitively across:
 *    title, content, skill, company, role, or tags. Otherwise isRelevant = false.
 *
 * Relevance strictly requires:
 *   source type matches
 *   AND company matches if specified
 *   AND role matches if specified
 *   AND skill matches if specified
 *   AND at least one expected keyword matches
 */
export function isResultRelevant(
  result: HybridRetrievalResult,
  evaluationCase: RagEvaluationCase
): { isRelevant: boolean; matchedCriteria: string[] } {
  const matchedCriteria: string[] = [];

  // 1. Source type match (mandatory)
  if (!evaluationCase.expectedSourceTypes.includes(result.sourceType)) {
    return { isRelevant: false, matchedCriteria: [] };
  }
  matchedCriteria.push(`sourceType:${result.sourceType}`);

  const titleLower = (result.title || '').toLowerCase();
  const contentLower = (result.content || '').toLowerCase();
  const companyLower = (result.company || '').toLowerCase();
  const roleLower = (result.role || '').toLowerCase();
  const skillLower = (result.skill || '').toLowerCase();
  const tagsLower = (result.tags || []).map((t) => t.toLowerCase());

  // 2. Expected company check (mandatory if specified)
  if (evaluationCase.expectedCompany) {
    const expComp = evaluationCase.expectedCompany.toLowerCase();
    const companyMatches =
      companyLower.includes(expComp) ||
      titleLower.includes(expComp) ||
      contentLower.includes(expComp) ||
      tagsLower.some((t) => t.includes(expComp));

    if (!companyMatches) {
      return { isRelevant: false, matchedCriteria };
    }
    matchedCriteria.push(`company:${evaluationCase.expectedCompany}`);
  }

  // 3. Expected role check (mandatory if specified)
  if (evaluationCase.expectedRole) {
    const expRole = evaluationCase.expectedRole.toLowerCase();
    const roleMatches =
      roleLower.includes(expRole) ||
      titleLower.includes(expRole) ||
      contentLower.includes(expRole) ||
      tagsLower.some((t) => t.includes(expRole));

    if (!roleMatches) {
      return { isRelevant: false, matchedCriteria };
    }
    matchedCriteria.push(`role:${evaluationCase.expectedRole}`);
  }

  // 4. Expected skill check (mandatory if specified)
  if (evaluationCase.expectedSkill) {
    const expSkill = evaluationCase.expectedSkill.toLowerCase();
    const skillMatches =
      skillLower.includes(expSkill) ||
      titleLower.includes(expSkill) ||
      contentLower.includes(expSkill) ||
      tagsLower.some((t) => t.includes(expSkill));

    if (!skillMatches) {
      return { isRelevant: false, matchedCriteria };
    }
    matchedCriteria.push(`skill:${evaluationCase.expectedSkill}`);
  }

  // 5. Keyword check (mandatory: at least one expected keyword must match)
  let keywordMatched = false;
  if (evaluationCase.expectedKeywords && evaluationCase.expectedKeywords.length > 0) {
    for (const kw of evaluationCase.expectedKeywords) {
      const kwLower = kw.toLowerCase();
      const hit =
        titleLower.includes(kwLower) ||
        contentLower.includes(kwLower) ||
        companyLower.includes(kwLower) ||
        roleLower.includes(kwLower) ||
        skillLower.includes(kwLower) ||
        tagsLower.some((t) => t.includes(kwLower));

      if (hit) {
        keywordMatched = true;
        matchedCriteria.push(`keyword:${kw}`);
      }
    }

    if (!keywordMatched) {
      return { isRelevant: false, matchedCriteria };
    }
  }

  return { isRelevant: true, matchedCriteria };
}

/**
 * Calculates Precision@K:
 * Proportion of top-K retrieved documents that are relevant.
 */
export function calculatePrecisionAtK(relevantJudgments: boolean[], k: number): number {
  if (k <= 0) return 0;
  const topK = relevantJudgments.slice(0, k);
  if (topK.length === 0) return 0;
  const relevantCount = topK.filter(Boolean).length;
  return relevantCount / topK.length;
}

/**
 * Calculates Hit@K:
 * True (1) if at least one relevant document is retrieved in the top K, otherwise False (0).
 */
export function calculateHitRate(relevantJudgments: boolean[], k: number): number {
  if (k <= 0) return 0;
  const topK = relevantJudgments.slice(0, k);
  return topK.some(Boolean) ? 1 : 0;
}

/**
 * Calculates Recall@K:
 * Proportion of total expected relevant documents that were retrieved in top K.
 */
export function calculateRecallAtK(
  totalExpectedRelevant: number,
  relevantRetrievedCount: number
): number | null {
  if (totalExpectedRelevant <= 0) return null;
  return Math.min(1, relevantRetrievedCount / totalExpectedRelevant);
}

/**
 * Calculates Recall@K deterministically when a defensible denominator is available.
 *
 * Denominator sources:
 * 1. If `caseItem.expectedRelevantCount` is explicitly defined (> 0), uses that ground-truth count:
 *    recall = Math.min(1, relevantCount / caseItem.expectedRelevantCount).
 * 2. Else if `caseItem.expectedSourceTypes` specifies multiple distinct source categories (length > 1),
 *    the evaluation case expects multi-faceted coverage (e.g., both skill questions and interview experiences).
 *    Recall is measured as the proportion of distinct expected source types represented among the relevant retrieved chunks:
 *    recall = (distinct matched expected source types) / (caseItem.expectedSourceTypes.length).
 * 3. Otherwise, if only a single source type is expected and no total ground-truth count is known,
 *    the complete number of relevant documents across the dynamic database corpus cannot be defensibly
 *    established without full-corpus labeling. To prevent inventing an arbitrary denominator, recallAtK
 *    remains null with clear documented rationale.
 */
export function calculateCaseRecall(
  caseItem: RagEvaluationCase,
  judgments: Array<{ isRelevant: boolean; sourceType: string }>,
  relevantCount: number
): number | null {
  // 1. Explicit ground-truth count provided
  if (typeof caseItem.expectedRelevantCount === 'number' && caseItem.expectedRelevantCount > 0) {
    return Math.min(1, relevantCount / caseItem.expectedRelevantCount);
  }

  // 2. Multi-criteria expected source types: measure coverage of distinct expected categories
  if (caseItem.expectedSourceTypes && caseItem.expectedSourceTypes.length > 1) {
    const coveredTypes = new Set<string>();
    for (const j of judgments) {
      if (j.isRelevant && caseItem.expectedSourceTypes.includes(j.sourceType as any)) {
        coveredTypes.add(j.sourceType);
      }
    }
    return coveredTypes.size / caseItem.expectedSourceTypes.length;
  }

  // 3. Otherwise, complete relevant population in open corpus is unknown; return null to prevent inventing an arbitrary denominator
  return null;
}

/**
 * Calculates Reciprocal Rank (RR):
 * 1 / rank of the first relevant document (1-indexed), or 0 if none found.
 */
export function calculateReciprocalRank(relevantJudgments: boolean[]): {
  reciprocalRank: number;
  firstRank: number | null;
} {
  for (let i = 0; i < relevantJudgments.length; i++) {
    if (relevantJudgments[i]) {
      const rank = i + 1;
      return { reciprocalRank: 1 / rank, firstRank: rank };
    }
  }
  return { reciprocalRank: 0, firstRank: null };
}

/**
 * Evaluates a single case against its retrieved results.
 */
export function evaluateRetrievalCase(
  caseItem: RagEvaluationCase,
  retrievedResults: HybridRetrievalResult[],
  k: number = 5
): CaseEvaluationResult {
  const boundedResults = retrievedResults.slice(0, k);
  const judgments = boundedResults.map((res) => {
    const { isRelevant, matchedCriteria } = isResultRelevant(res, caseItem);
    return {
      chunkId: res.chunkId,
      sourceType: res.sourceType,
      title: res.title,
      company: res.company,
      role: res.role,
      skill: res.skill,
      isRelevant,
      matchedCriteria,
    };
  });

  const booleanJudgments = judgments.map((j) => j.isRelevant);
  const relevantCount = booleanJudgments.filter(Boolean).length;
  const hit = calculateHitRate(booleanJudgments, k) === 1;
  const precision = calculatePrecisionAtK(booleanJudgments, k);
  const recallAtK = calculateCaseRecall(caseItem, judgments, relevantCount);
  const { reciprocalRank, firstRank } = calculateReciprocalRank(booleanJudgments);

  return {
    caseId: caseItem.id,
    query: caseItem.query,
    k,
    retrievedCount: boundedResults.length,
    relevantCount,
    hitAtK: hit,
    precisionAtK: precision,
    recallAtK,
    reciprocalRank,
    firstRelevantRank: firstRank,
    judgments,
  };
}

/**
 * Evaluates an entire suite of test cases.
 */
export function evaluateRetrievalSuite(
  cases: RagEvaluationCase[],
  resultsByCaseId: Map<string, HybridRetrievalResult[]>,
  k: number = 5,
  thresholds = { minHitRate: 0.7, minPrecision: 0.5, minMrr: 0.6 }
): SuiteEvaluationReport {
  if (cases.length === 0) {
    return {
      timestamp: new Date(),
      totalCases: 0,
      k,
      hitRate: 0,
      meanPrecision: 0,
      meanRecall: null,
      mrr: 0,
      passedThresholds: false,
      thresholds,
      caseResults: [],
      failedCases: [],
    };
  }

  const caseResults: CaseEvaluationResult[] = [];
  for (const c of cases) {
    const results = resultsByCaseId.get(c.id) || [];
    caseResults.push(evaluateRetrievalCase(c, results, k));
  }

  const hitCount = caseResults.filter((r) => r.hitAtK).length;
  const hitRate = hitCount / caseResults.length;
  const meanPrecision =
    caseResults.reduce((acc, r) => acc + r.precisionAtK, 0) / caseResults.length;
  const mrr =
    caseResults.reduce((acc, r) => acc + r.reciprocalRank, 0) / caseResults.length;

  const casesWithRecall = caseResults.filter((r) => r.recallAtK !== null);
  const meanRecall =
    casesWithRecall.length > 0
      ? casesWithRecall.reduce((acc, r) => acc + (r.recallAtK as number), 0) / casesWithRecall.length
      : null;

  const failedCases = caseResults.filter(
    (r) => !r.hitAtK || r.precisionAtK < thresholds.minPrecision
  );

  const passedThresholds =
    hitRate >= thresholds.minHitRate &&
    meanPrecision >= thresholds.minPrecision &&
    mrr >= thresholds.minMrr;

  return {
    timestamp: new Date(),
    totalCases: cases.length,
    k,
    hitRate: Math.round(hitRate * 1000) / 1000,
    meanPrecision: Math.round(meanPrecision * 1000) / 1000,
    meanRecall: meanRecall !== null ? Math.round(meanRecall * 1000) / 1000 : null,
    mrr: Math.round(mrr * 1000) / 1000,
    passedThresholds,
    thresholds,
    caseResults,
    failedCases,
  };
}
