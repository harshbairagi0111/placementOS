import assert from 'assert';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  KnowledgeChunk,
  ATLAS_VECTOR_SEARCH_INDEX_SPEC,
  ATLAS_TEXT_SEARCH_INDEX_SPEC,
  EXPECTED_EMBEDDING_DIMENSIONS,
} from '../src/models/KnowledgeChunk';
import {
  retrieveRelevantKnowledge,
  mergeAndRankRetrievalResults,
  normalizeScores,
  compareHybridResults,
  buildMongoFilter,
  buildVectorSearchFilter,
  DEFAULT_SEMANTIC_WEIGHT,
  DEFAULT_KEYWORD_WEIGHT,
  DEFAULT_RETRIEVAL_LIMIT,
  RawRetrievalCandidate,
  HybridRetrievalResult,
} from '../src/services/hybridRetrievalService';
import { connectDB } from '../src/db/db';

dotenv.config();

console.log('====================================================');
console.log('   HYBRID RAG RETRIEVAL (FIX #11.2) TEST SUITE     ');
console.log('====================================================\n');

async function runHybridRetrievalTests() {
  let dbConnected = false;
  try {
    const conn = await connectDB();
    if (conn || mongoose.connection.readyState === 1) {
      dbConnected = true;
    }
  } catch (err: any) {
    console.warn('[Test Info] MongoDB connection not active; testing pure retrieval and fallback logic.');
  }

  // ----------------------------------------------------
  // TEST 1: Empty or whitespace query is rejected
  // ----------------------------------------------------
  console.log('--- TEST 1: Empty Query Validation ---');
  await assert.rejects(
    async () => {
      await retrieveRelevantKnowledge('');
    },
    (err: any) => {
      return err instanceof Error && err.message.toLowerCase().includes('non-empty string');
    },
    'Test 1 failed: Empty string must reject with non-empty string validation error'
  );

  await assert.rejects(
    async () => {
      await retrieveRelevantKnowledge('   \t\n  ');
    },
    (err: any) => {
      return err instanceof Error && err.message.toLowerCase().includes('non-empty string');
    },
    'Test 1 failed: Whitespace-only string must reject with non-empty string validation error'
  );
  console.log('✓ PASS: Test 1 — Empty and whitespace queries properly rejected.\n');

  // ----------------------------------------------------
  // TEST 2: Result merging (same chunk in vector and keyword appears exactly once)
  // ----------------------------------------------------
  console.log('--- TEST 2: Result Merging & Deduplication ---');
  const sharedChunkId = 'chunk-shared-123';
  const vectorList: RawRetrievalCandidate[] = [
    {
      chunkId: sharedChunkId,
      content: 'Shared knowledge chunk content about System Design.',
      sourceType: 'interview_experience',
      sourceId: 'exp-1',
      chunkIndex: 0,
      title: 'Google System Design Interview',
      company: 'Google',
      vectorScore: 0.92,
    },
    {
      chunkId: 'chunk-vector-only-456',
      content: 'Vector only chunk content.',
      sourceType: 'skill_question',
      sourceId: 'skill-q1',
      chunkIndex: 0,
      vectorScore: 0.85,
    },
  ];

  const keywordList: RawRetrievalCandidate[] = [
    {
      chunkId: sharedChunkId,
      content: 'Shared knowledge chunk content about System Design.',
      sourceType: 'interview_experience',
      sourceId: 'exp-1',
      chunkIndex: 0,
      title: 'Google System Design Interview',
      company: 'Google',
      keywordScore: 12.5,
    },
    {
      chunkId: 'chunk-keyword-only-789',
      content: 'Keyword only chunk content.',
      sourceType: 'aptitude_question',
      sourceId: 'apt-q1',
      chunkIndex: 0,
      keywordScore: 8.0,
    },
  ];

  const merged = mergeAndRankRetrievalResults(vectorList, keywordList);
  const sharedOccurrences = merged.filter((r) => r.chunkId === sharedChunkId);
  assert.strictEqual(sharedOccurrences.length, 1, 'Test 2 failed: Shared chunk must appear exactly once');
  assert.strictEqual(merged.length, 3, 'Test 2 failed: 3 unique chunks expected');
  assert.strictEqual(sharedOccurrences[0].vectorScore, 1.0, 'Test 2 failed: Normalized vector score of top match should be 1.0');
  assert.strictEqual(sharedOccurrences[0].keywordScore, 1.0, 'Test 2 failed: Normalized keyword score of top match should be 1.0');
  console.log('✓ PASS: Test 2 — Chunks retrieved by both methods merged into a single result.\n');

  // ----------------------------------------------------
  // TEST 3: Vector-only result receives keywordScore = 0 and participates in ranking
  // ----------------------------------------------------
  console.log('--- TEST 3: Vector-Only Result Score Assignment ---');
  const vectorOnlyMatch = merged.find((r) => r.chunkId === 'chunk-vector-only-456');
  assert.ok(vectorOnlyMatch, 'Vector-only result must be present in final list');
  assert.strictEqual(vectorOnlyMatch.keywordScore, 0, 'Vector-only result must have keywordScore = 0');
  assert.ok(vectorOnlyMatch.vectorScore > 0, 'Vector-only result must retain positive normalized vector score');
  assert.ok(vectorOnlyMatch.hybridScore > 0, 'Vector-only result must have positive hybridScore');
  console.log(`✓ PASS: Test 3 — Vector-only chunk has keywordScore = 0 and participates in ranking (hybridScore: ${vectorOnlyMatch.hybridScore}).\n`);

  // ----------------------------------------------------
  // TEST 4: Keyword-only result receives vectorScore = 0 and participates in ranking
  // ----------------------------------------------------
  console.log('--- TEST 4: Keyword-Only Result Score Assignment ---');
  const keywordOnlyMatch = merged.find((r) => r.chunkId === 'chunk-keyword-only-789');
  assert.ok(keywordOnlyMatch, 'Keyword-only result must be present in final list');
  assert.strictEqual(keywordOnlyMatch.vectorScore, 0, 'Keyword-only result must have vectorScore = 0');
  assert.ok(keywordOnlyMatch.keywordScore > 0, 'Keyword-only result must retain positive normalized keyword score');
  assert.ok(keywordOnlyMatch.hybridScore > 0, 'Keyword-only result must have positive hybridScore');
  console.log(`✓ PASS: Test 4 — Keyword-only chunk has vectorScore = 0 and participates in ranking (hybridScore: ${keywordOnlyMatch.hybridScore}).\n`);

  // ----------------------------------------------------
  // TEST 5: Hybrid scoring weights (65% semantic / 35% keyword)
  // ----------------------------------------------------
  console.log('--- TEST 5: Weighted Hybrid Formula Verification ---');
  // Shared chunk had raw vector 0.92 (normalized 1.0) and raw keyword 12.5 (normalized 1.0)
  // With default weights: 1.0 * 0.65 + 1.0 * 0.35 = 1.0
  assert.strictEqual(sharedOccurrences[0].hybridScore, 1.0, 'Top combined chunk must score 1.0');

  // Custom weights test: 80% semantic / 20% keyword
  const customMerged = mergeAndRankRetrievalResults(vectorList, keywordList, {
    semanticWeight: 0.8,
    keywordWeight: 0.2,
  });
  const customShared = customMerged.find((r) => r.chunkId === sharedChunkId);
  assert.strictEqual(customShared?.hybridScore, 1.0, 'Custom weighted score must equal 1.0 when both components are 1.0');

  // Keyword-only chunk with normalized keyword score 8.0/12.5 = 0.64
  // Hybrid score = 0 * 0.8 + 0.64 * 0.2 = 0.128
  const customKeyword = customMerged.find((r) => r.chunkId === 'chunk-keyword-only-789');
  const expectedKeywordHybrid = Math.round(0.64 * 0.2 * 1e6) / 1e6;
  assert.strictEqual(
    customKeyword?.hybridScore,
    expectedKeywordHybrid,
    `Custom keyword hybrid score must match formula (expected ${expectedKeywordHybrid}, got ${customKeyword?.hybridScore})`
  );
  console.log('✓ PASS: Test 5 — Configured semantic and keyword weights applied accurately.\n');

  // ----------------------------------------------------
  // TEST 6: Deterministic ordering across repeated ranking and tie breaking
  // ----------------------------------------------------
  console.log('--- TEST 6: Deterministic Ordering & Tie Breaking ---');
  const tiedCandidates: RawRetrievalCandidate[] = [
    {
      chunkId: 'chunk-b',
      content: 'Tied chunk B',
      sourceType: 'skill_question',
      sourceId: 'src-1',
      chunkIndex: 1,
      vectorScore: 0.5,
    },
    {
      chunkId: 'chunk-a',
      content: 'Tied chunk A',
      sourceType: 'interview_experience', // Higher priority sourceType order (1 vs 2)
      sourceId: 'src-1',
      chunkIndex: 0,
      vectorScore: 0.5,
    },
    {
      chunkId: 'chunk-c',
      content: 'Tied chunk C',
      sourceType: 'skill_question',
      sourceId: 'src-1',
      chunkIndex: 0, // Lower chunkIndex than chunk-b (0 vs 1)
      vectorScore: 0.5,
    },
  ];

  // Run multiple rankings on shuffled inputs
  const run1 = mergeAndRankRetrievalResults(tiedCandidates, []);
  const run2 = mergeAndRankRetrievalResults([...tiedCandidates].reverse(), []);

  assert.strictEqual(run1.length, 3);
  assert.strictEqual(run2.length, 3);
  for (let i = 0; i < run1.length; i++) {
    assert.strictEqual(
      run1[i].chunkId,
      run2[i].chunkId,
      `Tie breaking must be completely deterministic at index ${i}`
    );
  }

  // Verify tie-break priority:
  // 1st should be 'chunk-a' (sourceType: 'interview_experience' precedes 'skill_question')
  // 2nd should be 'chunk-c' (chunkIndex 0 precedes chunkIndex 1)
  // 3rd should be 'chunk-b' (chunkIndex 1)
  assert.strictEqual(run1[0].chunkId, 'chunk-a', 'Tie break 1: interview_experience must rank before skill_question');
  assert.strictEqual(run1[1].chunkId, 'chunk-c', 'Tie break 2: lower chunkIndex must rank before higher chunkIndex');
  assert.strictEqual(run1[2].chunkId, 'chunk-b', 'Tie break 3: higher chunkIndex follows');
  console.log('✓ PASS: Test 6 — Deterministic ordering and multi-level tie breaking verified.\n');

  // ----------------------------------------------------
  // TEST 7: Result limit enforcement
  // ----------------------------------------------------
  console.log('--- TEST 7: Result Limit Enforcement ---');
  const manyCandidates: RawRetrievalCandidate[] = Array.from({ length: 25 }, (_, i) => ({
    chunkId: `chunk-limit-${i}`,
    content: `Content ${i}`,
    sourceType: 'interview_experience',
    sourceId: `source-${i}`,
    chunkIndex: 0,
    vectorScore: 1 - i * 0.02,
  }));

  // Limit = 5 (at most 5 results)
  const limitedResults5 = mergeAndRankRetrievalResults(manyCandidates, [], { limit: 5 });
  assert.strictEqual(limitedResults5.length, 5, 'Results count must strictly equal 5 for limit: 5');

  // Limit = 1 (at most 1 result)
  const limitedResults1 = mergeAndRankRetrievalResults(manyCandidates, [], { limit: 1 });
  assert.strictEqual(limitedResults1.length, 1, 'Results count must strictly equal 1 for limit: 1');

  // Limit = 0 (MUST return empty array, NEVER return 1 result)
  const limitedResults0 = mergeAndRankRetrievalResults(manyCandidates, [], { limit: 0 });
  assert.strictEqual(limitedResults0.length, 0, 'limit: 0 must return an empty array');
  assert.deepStrictEqual(limitedResults0, [], 'limit: 0 must return []');

  // Negative limit (MUST return empty array)
  const limitedResultsNeg = mergeAndRankRetrievalResults(manyCandidates, [], { limit: -5 });
  assert.strictEqual(limitedResultsNeg.length, 0, 'Negative limit must return an empty array');

  // Omitted limit defaults to 10
  const defaultLimitedResults = mergeAndRankRetrievalResults(manyCandidates, []);
  assert.strictEqual(defaultLimitedResults.length, 10, 'Omitted limit must default to 10');

  // End-to-end retrieveRelevantKnowledge with limit: 0 returns []
  const e2eZeroLimit = await retrieveRelevantKnowledge('React interview questions', { limit: 0 });
  assert.deepStrictEqual(e2eZeroLimit, [], 'retrieveRelevantKnowledge with limit: 0 must return []');

  console.log('✓ PASS: Test 7 — Result limits enforced (0 returns [], negative returns [], 5 returns 5, default returns 10).\n');

  // ----------------------------------------------------
  // TEST 8: Metadata contains only approved retrieval fields
  // ----------------------------------------------------
  console.log('--- TEST 8: Metadata Projection & Field Whitelist ---');
  const sampleResult = merged[0];
  const allowedKeys = new Set([
    'chunkId',
    'content',
    'sourceType',
    'sourceId',
    'chunkIndex',
    'title',
    'company',
    'role',
    'skill',
    'tags',
    'vectorScore',
    'keywordScore',
    'hybridScore',
  ]);

  for (const key of Object.keys(sampleResult)) {
    assert.ok(
      allowedKeys.has(key),
      `Field "${key}" is not permitted in HybridRetrievalResult`
    );
  }
  console.log('✓ PASS: Test 8 — Returned results conform strictly to approved metadata fields.\n');

  // ----------------------------------------------------
  // TEST 9: No duplicate chunks in final results
  // ----------------------------------------------------
  console.log('--- TEST 9: Strict Deduplication ---');
  const seenIds = new Set<string>();
  for (const r of merged) {
    assert.ok(!seenIds.has(r.chunkId), `Duplicate chunkId "${r.chunkId}" detected in final results`);
    seenIds.add(r.chunkId);
  }
  console.log('✓ PASS: Test 9 — No duplicate chunks present in final output.\n');

  // ----------------------------------------------------
  // TEST 10: No private fields exposed
  // ----------------------------------------------------
  console.log('--- TEST 10: Private Student and Security Fields Exclusion ---');
  const privateFields = [
    'studentId',
    'recruiterId',
    'reviewerId',
    'reviewedBy',
    'correctAnswerIndex',
    'password',
    'embedding',
    'auth',
  ];

  for (const r of merged) {
    for (const field of privateFields) {
      assert.strictEqual(
        (r as any)[field],
        undefined,
        `Security violation: Field "${field}" must never be exposed in retrieval results`
      );
    }
  }
  console.log('✓ PASS: Test 10 — Private student IDs, reviewer IDs, and answer keys are strictly excluded.\n');

  // ----------------------------------------------------
  // TEST 11: Source filtering & Atlas Vector Filter Compatibility
  // ----------------------------------------------------
  console.log('--- TEST 11: Server-Side Filtering & Atlas Vector Filter Compatibility ---');

  // Helper to detect any RegExp object recursively
  function containsRegExp(obj: any): boolean {
    if (!obj) return false;
    if (obj instanceof RegExp) return true;
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (containsRegExp(obj[key])) return true;
      }
    }
    return false;
  }

  const comprehensiveFilter = {
    sourceTypes: ['interview_experience', 'skill_question'] as any,
    company: 'Amazon',
    role: 'SDE-1',
    skill: 'TypeScript',
    status: 'approved',
  };

  // 1. Verify Atlas Vector Search filter contains NO RegExp objects
  const vectorFilter = buildVectorSearchFilter(comprehensiveFilter);
  assert.strictEqual(
    containsRegExp(vectorFilter),
    false,
    'Atlas Vector Search filter must NEVER contain JavaScript RegExp objects'
  );
  assert.deepStrictEqual(vectorFilter.sourceType, { $in: ['interview_experience', 'skill_question'] });
  assert.deepStrictEqual(vectorFilter.status, { $eq: 'approved' });
  assert.deepStrictEqual(vectorFilter.company, { $eq: 'Amazon' });
  assert.deepStrictEqual(vectorFilter.role, { $eq: 'SDE-1' });
  assert.deepStrictEqual(vectorFilter.skill, { $eq: 'TypeScript' });

  // 2. Verify buildMongoFilter maintains regex capabilities for keyword/match stages
  const mongoFilter = buildMongoFilter(comprehensiveFilter);
  assert.deepStrictEqual(mongoFilter.sourceType, { $in: ['interview_experience', 'skill_question'] });
  assert.ok(mongoFilter.company instanceof RegExp, 'Company filter must be case-insensitive regex in MongoDB filter');
  assert.ok(mongoFilter.role instanceof RegExp, 'Role filter must be case-insensitive regex in MongoDB filter');
  assert.ok(mongoFilter.skill instanceof RegExp, 'Skill filter must be case-insensitive regex in MongoDB filter');

  console.log('✓ PASS: Test 11 — Atlas Vector filter contains 0 RegExp objects and supports Atlas equality operators.\n');

  // ----------------------------------------------------
  // TEST 12: Atlas Index Specifications (Vector & Text)
  // ----------------------------------------------------
  console.log('--- TEST 12: Atlas Index Specifications Verification ---');
  assert.strictEqual(ATLAS_VECTOR_SEARCH_INDEX_SPEC.name, 'vector_index');
  assert.strictEqual(ATLAS_VECTOR_SEARCH_INDEX_SPEC.definition.fields[0].numDimensions, 768);
  assert.strictEqual(ATLAS_VECTOR_SEARCH_INDEX_SPEC.definition.fields[0].similarity, 'cosine');

  assert.strictEqual(ATLAS_TEXT_SEARCH_INDEX_SPEC.name, 'knowledge_text_index');
  const textSearchFields = Object.keys(ATLAS_TEXT_SEARCH_INDEX_SPEC.definition.mappings.fields);
  assert.ok(textSearchFields.includes('content'), 'Atlas text search index must include content');
  assert.ok(textSearchFields.includes('title'), 'Atlas text search index must include title');
  assert.ok(textSearchFields.includes('company'), 'Atlas text search index must include company');
  assert.ok(textSearchFields.includes('role'), 'Atlas text search index must include role');
  assert.ok(textSearchFields.includes('skill'), 'Atlas text search index must include skill');
  assert.ok(textSearchFields.includes('tags'), 'Atlas text search index must include tags');
  assert.ok(!textSearchFields.includes('embedding'), 'Atlas text search index must NOT include embedding');
  assert.ok(!textSearchFields.includes('studentId'), 'Atlas text search index must NOT include studentId');
  console.log('✓ PASS: Test 12 — Both vector_index and knowledge_text_index specifications verified.\n');

  // ----------------------------------------------------
  // TEST 13: End-to-End retrieveRelevantKnowledge with mock embedding
  // ----------------------------------------------------
  console.log('--- TEST 13: End-to-End retrieveRelevantKnowledge Flow ---');
  const mockEmbeddingGenerator = async (text: string) => {
    // Deterministic 768-dimensional mock embedding vector
    return Array(EXPECTED_EMBEDDING_DIMENSIONS).fill(0.01);
  };

  const results = await retrieveRelevantKnowledge('React JavaScript Frontend Interview', {
    limit: 5,
    embeddingGenerator: mockEmbeddingGenerator,
  });

  assert.ok(Array.isArray(results), 'retrieveRelevantKnowledge must return an array');
  assert.ok(results.length <= 5, 'Results length must not exceed limit');
  if (results.length > 0) {
    const topResult = results[0];
    assert.ok(topResult.chunkId, 'Result must have chunkId');
    assert.ok(topResult.content, 'Result must have content');
    assert.ok(typeof topResult.hybridScore === 'number', 'Result must have numeric hybridScore');
    assert.ok(typeof topResult.vectorScore === 'number', 'Result must have numeric vectorScore');
    assert.ok(typeof topResult.keywordScore === 'number', 'Result must have numeric keywordScore');
  }
  console.log(`✓ PASS: Test 13 — End-to-end retrieveRelevantKnowledge executed successfully (returned ${results.length} chunks).\n`);

  console.log('====================================================');
  console.log('  ALL 13 HYBRID RETRIEVAL TESTS PASSED SUCCESSFULLY! ');
  console.log('====================================================\n');

  if (dbConnected) {
    await mongoose.disconnect();
  }
  process.exit(0);
}

runHybridRetrievalTests().catch((err) => {
  console.error('FATAL TEST FAILURE:', err);
  process.exit(1);
});
