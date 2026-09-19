import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express, { Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  KnowledgeChunk,
  ATLAS_VECTOR_SEARCH_INDEX_SPEC,
  EXPECTED_EMBEDDING_DIMENSIONS,
} from '../src/models/KnowledgeChunk';
import {
  normalizeTextForEmbedding,
  generateEmbedding,
  getEmbeddingDimension,
  validateEmbeddingVector,
} from '../src/services/embeddingService';
import {
  buildInterviewExperienceChunks,
  buildSkillQuestionChunks,
  buildAptitudeQuestionChunks,
  buildJobPostingChunks,
  chunkTextDeterministically,
  upsertChunksForSource,
} from '../src/services/knowledgeIngestionService';
import { mentorRouter } from '../routes/mentor';
import { AuthRequest } from '../routes/authMiddleware';
import { connectDB } from '../src/db/db';

dotenv.config();

console.log('====================================================');
console.log('  RAG FOUNDATION & KNOWLEDGE BASE (FIX #11.1) TESTS  ');
console.log('====================================================\n');

async function runTests() {
  // Connect to DB if available
  let dbConnected = false;
  try {
    const conn = await connectDB();
    if (conn || mongoose.connection.readyState === 1) {
      dbConnected = true;
    }
  } catch (err: any) {
    console.warn('[Test Info] MongoDB connection not available in local test runner; skipping live DB upsert check.');
  }

  // ----------------------------------------------------
  // TEST 1: KnowledgeChunk schema and model loads
  // ----------------------------------------------------
  console.log('--- TEST 1: KnowledgeChunk Schema and Model Loading ---');
  assert.ok(KnowledgeChunk, 'KnowledgeChunk model must be defined');
  assert.strictEqual(KnowledgeChunk.modelName, 'KnowledgeChunk', 'Model name must be KnowledgeChunk');

  const schemaPaths = KnowledgeChunk.schema.paths;
  assert.ok(schemaPaths['content'], 'Schema must have "content" field');
  assert.ok(schemaPaths['embedding'], 'Schema must have "embedding" field');
  assert.ok(schemaPaths['sourceType'], 'Schema must have "sourceType" field');
  assert.ok(schemaPaths['sourceId'], 'Schema must have "sourceId" field');
  assert.ok(schemaPaths['chunkIndex'], 'Schema must have "chunkIndex" field');
  assert.ok(schemaPaths['chunkKey'], 'Schema must have "chunkKey" field');
  assert.ok(schemaPaths['tags'], 'Schema must have "tags" field');
  assert.ok(schemaPaths['metadata'], 'Schema must have "metadata" field');

  // Verify Atlas Vector Search configuration metadata
  assert.strictEqual(
    ATLAS_VECTOR_SEARCH_INDEX_SPEC.name,
    'vector_index',
    'Atlas index spec name must be vector_index'
  );
  assert.strictEqual(
    ATLAS_VECTOR_SEARCH_INDEX_SPEC.definition.fields[0].numDimensions,
    768,
    'Atlas vector dimensions must be 768'
  );
  assert.strictEqual(
    EXPECTED_EMBEDDING_DIMENSIONS,
    768,
    'Expected embedding dimensions must be 768'
  );
  console.log('✓ PASS: Test 1 — KnowledgeChunk model and Atlas vector search spec loaded successfully.\n');

  // ----------------------------------------------------
  // TEST 2: Empty content is rejected
  // ----------------------------------------------------
  console.log('--- TEST 2: Empty Content Validation ---');
  // Embedding normalization rejection
  assert.throws(
    () => normalizeTextForEmbedding(''),
    /Text to embed must be a non-empty string/,
    'Empty string must be rejected by normalizer'
  );
  assert.throws(
    () => normalizeTextForEmbedding('     \n\t  '),
    /Text to embed must be a non-empty string/,
    'Whitespace-only string must be rejected by normalizer'
  );
  assert.throws(
    () => normalizeTextForEmbedding(null as any),
    /Text to embed must be a non-empty string/,
    'Null must be rejected by normalizer'
  );

  // Mongoose schema validation rejection
  const invalidEmptyDoc = new KnowledgeChunk({
    content: '   ',
    embedding: [0.1, 0.2],
    sourceType: 'interview_experience',
    sourceId: 'test-source-id',
    chunkKey: 'interview_experience:test-source-id:0',
  });
  const validationErr = invalidEmptyDoc.validateSync();
  assert.ok(validationErr, 'Validation error expected for empty content');
  assert.ok(
    validationErr?.errors['content'],
    'Schema must flag "content" as invalid when empty'
  );
  console.log('✓ PASS: Test 2 — Empty content rejected by both normalizer and schema validation.\n');

  // ----------------------------------------------------
  // TEST 3: Embedding representation is strictly numeric
  // ----------------------------------------------------
  console.log('--- TEST 3: Embedding Numeric Representation ---');
  // Non-numeric elements should fail schema validation
  const docWithStrings = new KnowledgeChunk({
    content: 'Valid interview experience question',
    embedding: ['not-a-number' as any, 0.5],
    sourceType: 'interview_experience',
    sourceId: 'test-source-id',
    chunkKey: 'interview_experience:test-source-id:0',
  });
  const stringErr = docWithStrings.validateSync();
  assert.ok(stringErr?.errors['embedding'], 'Embedding with non-numeric values must fail validation');

  // Empty embedding array should fail schema validation
  const docWithEmptyEmbedding = new KnowledgeChunk({
    content: 'Valid interview experience question',
    embedding: [],
    sourceType: 'interview_experience',
    sourceId: 'test-source-id',
    chunkKey: 'interview_experience:test-source-id:0',
  });
  const emptyEmbErr = docWithEmptyEmbedding.validateSync();
  assert.ok(emptyEmbErr?.errors['embedding'], 'Empty embedding array must fail validation');

  // Valid numeric array should pass validation
  const validDoc = new KnowledgeChunk({
    content: 'Valid interview experience question',
    embedding: [0.123, -0.456, 0.789],
    sourceType: 'interview_experience',
    sourceId: 'test-source-id',
    chunkKey: 'interview_experience:test-source-id:0',
  });
  const validErr = validDoc.validateSync();
  assert.ifError(validErr);
  assert.strictEqual(validDoc.embedding.length, 3);
  assert.strictEqual(typeof validDoc.embedding[0], 'number');
  console.log('✓ PASS: Test 3 — Embedding validated as strictly numeric array.\n');

  // ----------------------------------------------------
  // REGRESSION TESTS: Embedding Dimension Contract (Fix #11.1 Correction)
  // ----------------------------------------------------
  console.log('--- REGRESSION TEST A: Wrong Dimension (3072 !== 768) Rejection ---');
  // Vector with 3072 values while expected dimension is 768 must fail with an error containing 'dimension mismatch'
  const oversizedVector = Array(3072).fill(0.0123);
  assert.throws(
    () => validateEmbeddingVector(oversizedVector, 768),
    (err: any) => {
      return err instanceof Error && err.message.toLowerCase().includes('dimension mismatch');
    },
    'Test A failed: Vector with 3072 values must throw an error containing "dimension mismatch"'
  );
  console.log('✓ PASS: Regression Test A — 3072-dimensional vector rejected with "dimension mismatch" error.\n');

  console.log('--- REGRESSION TEST B: Correct Dimension (768) Acceptance ---');
  // Vector with exactly 768 numeric values must pass dimension validation
  const valid768Vector = Array(768).fill(0.0456);
  const validatedResult = validateEmbeddingVector(valid768Vector, 768);
  assert.strictEqual(validatedResult.length, 768);
  assert.strictEqual(validatedResult[0], 0.0456);
  console.log('✓ PASS: Regression Test B — 768-dimensional vector accepted without error.\n');

  console.log('--- REGRESSION TEST C: Ingestion Rejects Wrong-Dimensional Vectors ---');
  // Ensure the ingestion path cannot persist a vector whose dimension does not equal 768
  const testDraftChunks = [
    {
      sourceType: 'interview_experience' as const,
      sourceId: 'invalid-dim-test-source',
      chunkIndex: 0,
      chunkKey: 'interview_experience:invalid-dim-test-source:0',
      title: 'Invalid Dimension Test Chunk',
      content: 'This chunk has an invalid dimension mock embedding.',
      tags: ['test'],
      metadata: {},
    },
  ];

  // Ingestion with 3072-dimension generator must be rejected
  const mock3072Embedder = async () => Array(3072).fill(0.05);
  let caughtIngestionError: any = null;
  try {
    await upsertChunksForSource(
      'interview_experience',
      'invalid-dim-test-source',
      testDraftChunks,
      { embeddingGenerator: mock3072Embedder }
    );
  } catch (err: any) {
    caughtIngestionError = err;
  }

  assert.ok(caughtIngestionError, 'Test C failed: Ingestion must throw on dimension mismatch');
  assert.ok(
    caughtIngestionError.message.toLowerCase().includes('dimension mismatch'),
    `Test C failed: Ingestion error message must contain "dimension mismatch", got: ${caughtIngestionError.message}`
  );

  if (dbConnected) {
    // Confirm no invalid chunk was persisted to the database
    const persistedCount = await KnowledgeChunk.countDocuments({
      chunkKey: 'interview_experience:invalid-dim-test-source:0',
    });
    assert.strictEqual(
      persistedCount,
      0,
      'Test C failed: Chunk with invalid embedding dimension must never be persisted'
    );
  }
  console.log('✓ PASS: Regression Test C — Ingestion path rejected wrong-dimensional vector and prevented database persistence.\n');

  // ----------------------------------------------------
  // TEST 4: Two ingestion runs do not create duplicate chunks
  // ----------------------------------------------------
  console.log('--- TEST 4: Deterministic Ingestion & Duplicate Protection ---');
  const dummySourceId = new mongoose.Types.ObjectId().toHexString();
  const mockExpApproved = {
    _id: dummySourceId,
    company: 'Google',
    role: 'Software Engineer',
    difficulty: 'Hard' as const,
    outcome: 'Selected' as const,
    status: 'approved' as const,
    roundsDescription: 'Coding round followed by System Design round.',
    questionsAsked: [
      { text: 'Implement an LRU Cache', type: 'coding' as const },
      { text: 'Explain virtual DOM reconciliation', type: 'theory' as const },
    ],
  };

  // Build drafts
  const run1Drafts = buildInterviewExperienceChunks(mockExpApproved as any);
  const run2Drafts = buildInterviewExperienceChunks(mockExpApproved as any);

  assert.strictEqual(run1Drafts.length, run2Drafts.length, 'Chunk counts must match between runs');
  assert.strictEqual(run1Drafts[0].chunkKey, run2Drafts[0].chunkKey, 'chunkKey must be strictly identical');
  assert.strictEqual(run1Drafts[0].content, run2Drafts[0].content, 'content must be strictly identical');

  if (dbConnected) {
    // Mock deterministic embedding generator
    const mockEmbedder = async () => Array(768).fill(0.01);

    // First ingestion run
    const result1 = await upsertChunksForSource(
      'interview_experience',
      dummySourceId,
      run1Drafts,
      { embeddingGenerator: mockEmbedder }
    );
    assert.strictEqual(result1.upserted, run1Drafts.length);

    // Second ingestion run (simulating re-indexing)
    const result2 = await upsertChunksForSource(
      'interview_experience',
      dummySourceId,
      run2Drafts,
      { embeddingGenerator: mockEmbedder }
    );
    assert.strictEqual(result2.upserted, run2Drafts.length);

    // Query DB: Count of chunks for this sourceId must be exactly run1Drafts.length (NO DUPLICATES)
    const totalInDb = await KnowledgeChunk.countDocuments({
      sourceType: 'interview_experience',
      sourceId: dummySourceId,
    });
    assert.strictEqual(
      totalInDb,
      run1Drafts.length,
      `Expected ${run1Drafts.length} chunks in DB, but found ${totalInDb} (duplicate records detected!)`
    );

    // Clean up test chunks
    await KnowledgeChunk.deleteMany({ sourceId: dummySourceId });
  }

  console.log('✓ PASS: Test 4 — Idempotent chunk keys prevent duplicate chunk records across runs.\n');

  // ----------------------------------------------------
  // TEST 5: Interview experiences status eligibility
  // ----------------------------------------------------
  console.log('--- TEST 5: Interview Experience Status Eligibility ---');
  const pendingExp = {
    _id: 'pending-id-1',
    company: 'Meta',
    role: 'Product Engineer',
    status: 'pending' as const,
    roundsDescription: 'Under review',
  };
  const rejectedExp = {
    _id: 'rejected-id-1',
    company: 'Amazon',
    role: 'SDE II',
    status: 'rejected' as const,
    roundsDescription: 'Spam review',
  };
  const approvedExp = {
    _id: 'approved-id-1',
    company: 'Microsoft',
    role: 'Cloud Architect',
    status: 'approved' as const,
    roundsDescription: 'Technical presentation and systems interview',
    difficulty: 'Medium' as const,
    outcome: 'Selected' as const,
    questionsAsked: [{ text: 'Design distributed cache', type: 'theory' as const }],
  };

  const pendingChunks = buildInterviewExperienceChunks(pendingExp as any);
  const rejectedChunks = buildInterviewExperienceChunks(rejectedExp as any);
  const approvedChunks = buildInterviewExperienceChunks(approvedExp as any);

  assert.strictEqual(pendingChunks.length, 0, 'Pending interview experience must produce 0 chunks');
  assert.strictEqual(rejectedChunks.length, 0, 'Rejected interview experience must produce 0 chunks');
  assert.ok(approvedChunks.length > 0, 'Approved interview experience must produce chunks');
  assert.strictEqual(approvedChunks[0].status, 'approved');
  console.log('✓ PASS: Test 5 — Only approved interview experiences are indexed; pending/rejected excluded.\n');

  // ----------------------------------------------------
  // TEST 6: Private student identifiers NOT included in knowledge text
  // ----------------------------------------------------
  console.log('--- TEST 6: Private User Data Exclusion ---');
  const studentPrivateId = 'student-private-objectid-998877';
  const reviewerPrivateId = 'verifier-academician-id-112233';
  const secretReviewNote = 'Student demonstrated exceptional DSA fundamentals';

  const expWithPrivateData = {
    _id: 'exp-12345',
    studentId: studentPrivateId,
    reviewedBy: reviewerPrivateId,
    reviewNote: secretReviewNote,
    company: 'Apple',
    role: 'iOS Developer',
    status: 'approved' as const,
    difficulty: 'Hard' as const,
    outcome: 'Selected' as const,
    roundsDescription: 'Three rounds focusing on Swift memory management.',
    questionsAsked: [{ text: 'Explain ARC and retain cycles', type: 'theory' as const }],
  };

  const sanitizedChunks = buildInterviewExperienceChunks(expWithPrivateData as any);
  assert.ok(sanitizedChunks.length > 0);

  for (const chunk of sanitizedChunks) {
    assert.ok(
      !chunk.content.includes(studentPrivateId),
      'Knowledge chunk content must NOT contain studentId'
    );
    assert.ok(
      !chunk.content.includes(reviewerPrivateId),
      'Knowledge chunk content must NOT contain reviewedBy'
    );
    assert.ok(
      !chunk.content.includes(secretReviewNote),
      'Knowledge chunk content must NOT contain reviewNote'
    );
    assert.ok(
      !JSON.stringify(chunk.metadata).includes(studentPrivateId),
      'Metadata must NOT contain studentId'
    );
    assert.ok(
      !JSON.stringify(chunk.metadata).includes(reviewerPrivateId),
      'Metadata must NOT contain reviewedBy'
    );
  }

  // Also verify SkillQuestion does not expose correctAnswerIndex
  const mockSkillQuestion = {
    _id: 'sq-123',
    skill: 'TypeScript',
    skillId: 'typescript',
    category: 'technical' as const,
    difficulty: 'Intermediate' as const,
    questionText: 'What is a mapped type?',
    correctAnswerIndex: 2,
    optionWeights: [0, 0, 100, 0],
    explanation: 'Mapped types allow creating new types by transforming properties.',
    isActive: true,
  };
  const skillChunks = buildSkillQuestionChunks(mockSkillQuestion as any);
  assert.ok(skillChunks.length > 0);
  assert.ok(!skillChunks[0].content.includes('correctAnswerIndex'), 'No correctAnswerIndex in text');
  assert.ok(!JSON.stringify(skillChunks[0].metadata).includes('correctAnswerIndex'), 'No correctAnswerIndex in metadata');

  // Also verify AptitudeQuestion does not expose correctAnswerIndex
  const mockAptQuestion = {
    _id: 'aq-123',
    category: 'Quantitative' as const,
    subtopic: 'Speed & Distance',
    difficulty: 'Medium' as const,
    questionTemplate: 'A train crosses a pole in 10 seconds...',
    correctAnswerIndex: 1,
    explanation: 'Use relative speed formula: speed = distance / time.',
  };
  const aptChunks = buildAptitudeQuestionChunks(mockAptQuestion as any);
  assert.ok(aptChunks.length > 0);
  assert.ok(!aptChunks[0].content.includes('correctAnswerIndex'), 'No correctAnswerIndex in text');
  assert.ok(!JSON.stringify(aptChunks[0].metadata).includes('correctAnswerIndex'), 'No correctAnswerIndex in metadata');

  // Also verify JobPosting does not expose recruiterId
  const mockJob = {
    _id: 'job-123',
    recruiterId: 'recruiter-private-account-id',
    company: 'Stripe',
    title: 'Backend Engineer',
    type: 'Job' as const,
    status: 'Active' as const,
    ctc: '24 LPA',
    location: 'Remote',
    description: 'Design payments infrastructure.',
    requiredSkills: ['Node.js', 'PostgreSQL'],
  };
  const jobChunks = buildJobPostingChunks(mockJob as any);
  assert.ok(jobChunks.length > 0);
  assert.ok(!jobChunks[0].content.includes('recruiter-private-account-id'), 'No recruiterId in text');
  assert.ok(!JSON.stringify(jobChunks[0].metadata).includes('recruiter-private-account-id'), 'No recruiterId in metadata');

  console.log('✓ PASS: Test 6 — Private student, recruiter, and answer-key identifiers strictly excluded.\n');

  // ----------------------------------------------------
  // TEST 7: Embedding errors handled safely without secret leakage
  // ----------------------------------------------------
  console.log('--- TEST 7: Embedding Error Handling & Secret Sanitization ---');
  // Test missing GEMINI_API_KEY behavior
  const savedKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    await generateEmbedding('Hello World');
    assert.fail('Should have thrown an error when GEMINI_API_KEY is missing');
  } catch (err: any) {
    assert.ok(
      err.message.includes('GEMINI_API_KEY is not configured'),
      'Error message must clearly state key is missing'
    );
    assert.ok(
      !err.message.includes('undefined'),
      'Error message must be cleanly formatted'
    );
  } finally {
    if (savedKey) {
      process.env.GEMINI_API_KEY = savedKey;
    }
  }
  console.log('✓ PASS: Test 7 — Missing API key handled cleanly without secret leakage.\n');

  // ----------------------------------------------------
  // TEST 8: Missing GEMINI_API_KEY does NOT break server boot
  // ----------------------------------------------------
  console.log('--- TEST 8: Server Resilient Boot Without GEMINI_API_KEY ---');
  const keyBefore = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    // Import or initialize models and services without GEMINI_API_KEY
    const dimension = getEmbeddingDimension();
    assert.strictEqual(dimension, 768);
    // KnowledgeChunk model still works
    const chunkInstance = new KnowledgeChunk({
      content: 'Sample knowledge text',
      embedding: [0.1, 0.2],
      sourceType: 'job_posting',
      sourceId: 'boot-test-1',
      chunkKey: 'job_posting:boot-test-1:0',
    });
    assert.strictEqual(chunkInstance.chunkKey, 'job_posting:boot-test-1:0');
  } finally {
    if (keyBefore) {
      process.env.GEMINI_API_KEY = keyBefore;
    }
  }
  console.log('✓ PASS: Test 8 — Missing GEMINI_API_KEY does not break model initialization or server modules.\n');

  // ----------------------------------------------------
  // TEST 9: Existing AI Mentor behavior remains untouched
  // ----------------------------------------------------
  console.log('--- TEST 9: AI Mentor Route Unchanged & Working ---');
  const app = express();
  app.use(express.json());

  // Mount mentorRouter
  app.use('/api/mentor', mentorRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;

  // Test validation error on empty message
  const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-chars-long';
  const token = jwt.sign(
    { userId: '507f1f77bcf86cd799439011', email: 'student@example.com', role: 'student' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const emptyMsgRes = await fetch(`http://127.0.0.1:${port}/api/mentor/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: '' }),
  });

  assert.strictEqual(emptyMsgRes.status, 400, 'Empty message must return 400');
  const emptyData = await emptyMsgRes.json();
  assert.strictEqual(emptyData.error, 'Message string is required');

  server.close();
  console.log('✓ PASS: Test 9 — AI Mentor route contract intact and unaffected by RAG foundation.\n');

  console.log('====================================================');
  console.log('    ALL 9 RAG FOUNDATION TESTS PASSED CLEANLY!      ');
  console.log('====================================================\n');
}

runTests()
  .then(() => {
    if (mongoose.connection.readyState !== 0) {
      mongoose.disconnect();
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    if (mongoose.connection.readyState !== 0) {
      mongoose.disconnect();
    }
    process.exit(1);
  });
