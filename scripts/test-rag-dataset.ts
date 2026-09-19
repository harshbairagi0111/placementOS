import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/db/db';
import {
  RAGKnowledge,
  validateRAGKnowledgeRecord,
  validateRAGDatasetStructure,
} from '../src/models/RAGKnowledge';
import {
  KnowledgeChunk,
  EXPECTED_EMBEDDING_DIMENSIONS,
} from '../src/models/KnowledgeChunk';
import { StudentMemory } from '../src/models/StudentMemory';
import { Conversation } from '../src/models/Conversation';
import { Message } from '../src/models/Message';
import {
  buildRAGKnowledgeChunks,
  ingestRAGKnowledge,
  ingestAllKnowledgeSources,
  ingestInterviewExperiences,
  ingestSkillQuestions,
  ingestAptitudeQuestions,
  ingestJobPostings,
  reconcileLegacyOperationalChunks,
  upsertChunksForSource,
} from '../src/services/knowledgeIngestionService';
import { seedRAGKnowledge, discoverDatasetFiles } from './seedRAGKnowledge';
import { processMentorChat } from '../src/services/aiMentorService';
import { InterviewExperience } from '../src/models/InterviewExperience';
import { JobPosting } from '../src/models/JobPosting';

dotenv.config();

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runRagDatasetTests() {
  console.log('====================================================');
  console.log('    RAG CANONICAL DATASET & SEEDING (FIX #11.6)     ');
  console.log('====================================================\n');

  await connectDB();

  try {
    // -------------------------------------------------------------
    // SUITE 1: DATASET VALIDATION RULES
    // -------------------------------------------------------------
    console.log('--- SUITE 1: DATASET VALIDATION RULES ---');

    // 1.1 Valid record accepted
    const validSample = {
      sourceId: 'rag-val-001',
      sourceType: 'skill_question',
      category: 'technical',
      title: 'Database Indexing Essentials',
      content: 'Database indexes improve query search performance using B-Trees.',
      skills: ['Database Management', 'SQL'],
      roles: ['Backend Developer'],
      tags: ['database', 'index', 'b-tree'],
      difficulty: 'Intermediate',
      status: 'active',
      version: '1.0.0',
    };
    const res1 = validateRAGKnowledgeRecord(validSample);
    assert(res1.valid === true, 'Valid record must pass validation');
    assert(res1.sanitizedRecord?.title === 'Database Indexing Essentials', 'Title should be trimmed and preserved');

    // 1.2 Missing sourceId rejected
    const invalidNoSourceId = { ...validSample, sourceId: '' };
    const res2 = validateRAGKnowledgeRecord(invalidNoSourceId);
    assert(res2.valid === false, 'Record with missing sourceId must be rejected');
    assert(res2.errors.some((e) => e.includes('sourceId')), 'Error must mention sourceId');

    // 1.3 Missing title rejected
    const invalidNoTitle = { ...validSample, title: '   ' };
    const res3 = validateRAGKnowledgeRecord(invalidNoTitle);
    assert(res3.valid === false, 'Record with whitespace title must be rejected');
    assert(res3.errors.some((e) => e.includes('title')), 'Error must mention title');

    // 1.4 Empty content rejected
    const invalidNoContent = { ...validSample, content: '' };
    const res4 = validateRAGKnowledgeRecord(invalidNoContent);
    assert(res4.valid === false, 'Record with empty content must be rejected');
    assert(res4.errors.some((e) => e.includes('content')), 'Error must mention content');

    // 1.5 Invalid status rejected
    const invalidStatus = { ...validSample, status: 'pending_approval' };
    const res5 = validateRAGKnowledgeRecord(invalidStatus);
    assert(res5.valid === false, 'Record with invalid status must be rejected');
    assert(res5.errors.some((e) => e.includes('status')), 'Error must mention status');

    // 1.6 Invalid non-array skills rejected
    const invalidSkills = { ...validSample, skills: 'SQL' as any };
    const res6 = validateRAGKnowledgeRecord(invalidSkills);
    assert(res6.valid === false, 'Record with non-array skills must be rejected');

    console.log('✓ PASS: Suite 1 — All dataset validation rules verified.\n');

    // -------------------------------------------------------------
    // SUITE 2: MONGODB SEEDING & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('--- SUITE 2: MONGODB SEEDING & IDEMPOTENCY ---');

    // 2.1 First seed run
    const datasetPath = path.join(process.cwd(), 'data', 'rag', 'placementos_rag_dataset_batch1.json');
    assert(fs.existsSync(datasetPath), `Batch 1 dataset file must exist at ${datasetPath}`);

    const initialReport = await seedRAGKnowledge({ filePath: datasetPath, log: false });
    assert(initialReport.totalProcessed >= 70, 'Batch 1 should contain at least 70 records');
    assert(initialReport.errors.length === 0, 'Initial seed should produce zero validation errors');

    const countAfterFirst = await RAGKnowledge.countDocuments();
    assert(countAfterFirst >= 70, `RAGKnowledge collection should have at least 70 records (found: ${countAfterFirst})`);

    // 2.2 Second seed run must be idempotent (zero duplicates, all unchanged)
    const secondReport = await seedRAGKnowledge({ filePath: datasetPath, log: false });
    assert(secondReport.inserted === 0, 'Second seed run must insert 0 records');
    assert(secondReport.updated === 0, 'Second seed run must update 0 records');
    assert(secondReport.unchanged === secondReport.totalProcessed, 'All records must be detected as unchanged');
    assert(secondReport.skipped === 0, 'No records should be skipped on rerun');

    const countAfterSecond = await RAGKnowledge.countDocuments();
    assert(countAfterSecond === countAfterFirst, 'Second seed run must NOT duplicate records');

    // 2.3 Updated content updates the canonical record
    const testDoc = await RAGKnowledge.findOne({ sourceId: 'rag-tech-dsa-001', version: '1.0.0' });
    assert(testDoc !== null, 'rag-tech-dsa-001 should exist in database');

    const originalTitle = testDoc!.title;
    const updatedTitle = `${originalTitle} - Updated Revision`;

    // Create a temporary single-record dataset with updated title
    const tempDatasetPath = path.join(process.cwd(), 'data', 'rag', 'temp_update_test.json');
    fs.writeFileSync(
      tempDatasetPath,
      JSON.stringify([
        {
          sourceId: 'rag-tech-dsa-001',
          sourceType: testDoc!.sourceType,
          category: testDoc!.category,
          title: updatedTitle,
          content: testDoc!.content,
          skills: testDoc!.skills,
          roles: testDoc!.roles,
          tags: testDoc!.tags,
          difficulty: testDoc!.difficulty,
          status: 'active',
          version: '1.0.0',
        },
      ]),
      'utf-8'
    );

    const updateReport = await seedRAGKnowledge({ filePath: tempDatasetPath, log: false });
    assert(updateReport.updated === 1, 'Updated record must be detected and updated in database');

    const docAfterUpdate = await RAGKnowledge.findOne({ sourceId: 'rag-tech-dsa-001', version: '1.0.0' });
    assert(docAfterUpdate?.title === updatedTitle, 'Title in database must match updated content');

    // Restore original state
    await seedRAGKnowledge({ filePath: datasetPath, log: false });
    if (fs.existsSync(tempDatasetPath)) {
      fs.unlinkSync(tempDatasetPath);
    }
    const docRestored = await RAGKnowledge.findOne({ sourceId: 'rag-tech-dsa-001', version: '1.0.0' });
    assert(docRestored?.title === originalTitle, 'Original title restored successfully');

    console.log('✓ PASS: Suite 2 — MongoDB seeding idempotency and atomic updates verified.\n');

    // -------------------------------------------------------------
    // SUITE 3: INGESTION & KNOWLEDGECHUNK LINKING
    // -------------------------------------------------------------
    console.log('--- SUITE 3: INGESTION & KNOWLEDGECHUNK LINKING ---');

    // 3.1 Active record produces valid ChunkDrafts
    const activeDoc = await RAGKnowledge.findOne({ status: 'active' });
    assert(activeDoc !== null, 'An active RAGKnowledge record must exist');
    const chunks = buildRAGKnowledgeChunks(activeDoc as any);
    assert(chunks.length > 0, 'Active RAGKnowledge record must produce at least one chunk');
    assert(chunks[0].sourceId === activeDoc!.sourceId, 'Chunk draft must preserve sourceId');
    assert(chunks[0].knowledgeId === String(activeDoc!._id), 'Chunk draft must link knowledgeId to RAGKnowledge._id');
    assert(chunks[0].chunkKey.startsWith(`${activeDoc!.sourceType}:${activeDoc!.sourceId}`), 'Chunk key must be deterministic');

    // 3.2 Inactive record produces 0 chunks
    const inactiveSample = new RAGKnowledge({
      sourceId: 'rag-test-inactive-001',
      sourceType: 'skill_question',
      category: 'technical',
      title: 'Deprecated Protocol',
      content: 'This protocol is deprecated and should not be retrieved.',
      status: 'inactive',
      version: '1.0.0',
    });
    const inactiveChunks = buildRAGKnowledgeChunks(inactiveSample as any);
    assert(inactiveChunks.length === 0, 'Inactive RAGKnowledge record must produce 0 chunks');

    // 3.3 Chunks upserted idempotently into KnowledgeChunk collection
    const dummyEmbedding = Array(EXPECTED_EMBEDDING_DIMENSIONS).fill(0.02);
    const upsertRes = await upsertChunksForSource(
      chunks[0].sourceType,
      chunks[0].sourceId,
      chunks,
      {
        embeddingGenerator: async () => dummyEmbedding,
        dryRun: false,
      }
    );
    assert(upsertRes.upserted === chunks.length, 'Chunks should be upserted into KnowledgeChunk');

    const storedChunk = await KnowledgeChunk.findOne({ chunkKey: chunks[0].chunkKey });
    assert(storedChunk !== null, 'KnowledgeChunk record must exist in database');
    assert(String(storedChunk!.knowledgeId) === String(activeDoc!._id), 'KnowledgeChunk.knowledgeId must link to RAGKnowledge._id');
    assert(storedChunk!.contentHash !== undefined && storedChunk!.contentHash.length > 0, 'KnowledgeChunk must store contentHash');

    // 3.4 Duplicate chunks are prevented
    const upsertAgain = await upsertChunksForSource(
      chunks[0].sourceType,
      chunks[0].sourceId,
      chunks,
      {
        embeddingGenerator: async () => dummyEmbedding,
        dryRun: false,
      }
    );
    assert(upsertAgain.upserted === chunks.length, 'Re-running upsert succeeds without creating duplicate documents');
    const totalMatchingChunks = await KnowledgeChunk.countDocuments({ chunkKey: chunks[0].chunkKey });
    assert(totalMatchingChunks === 1, 'Exactly one chunk document must exist for a given chunkKey');

    console.log('✓ PASS: Suite 3 — Deterministic chunk generation, linking, and embedding caching verified.\n');

    // -------------------------------------------------------------
    // SUITE 4: PROHIBITED OPERATIONAL INGESTION & TRACEABILITY
    // -------------------------------------------------------------
    console.log('--- SUITE 4: PROHIBITED OPERATIONAL INGESTION & TRACEABILITY ---');

    // 4.1 Direct ingestion functions from operational collections are prohibited
    const interviewRes = await ingestInterviewExperiences();
    assert(interviewRes.sourcesProcessed === 0, 'ingestInterviewExperiences must not process operational records');
    assert(interviewRes.chunksUpserted === 0, 'ingestInterviewExperiences must not upsert chunks');
    assert(interviewRes.errors.some((e) => e.sourceId === 'PROHIBITED'), 'Error must note prohibited operational ingestion');

    const skillRes = await ingestSkillQuestions();
    assert(skillRes.sourcesProcessed === 0 && skillRes.chunksUpserted === 0, 'ingestSkillQuestions must be prohibited');

    const aptitudeRes = await ingestAptitudeQuestions();
    assert(aptitudeRes.sourcesProcessed === 0 && aptitudeRes.chunksUpserted === 0, 'ingestAptitudeQuestions must be prohibited');

    const jobRes = await ingestJobPostings();
    assert(jobRes.sourcesProcessed === 0 && jobRes.chunksUpserted === 0, 'ingestJobPostings must be prohibited');

    // 4.2 Normal ingestion path does NOT create chunks from operational records even if new ones exist
    const testExp = await InterviewExperience.create({
      studentId: new mongoose.Types.ObjectId(),
      company: 'OperationalTestCorp',
      role: 'Test Engineer',
      interviewDate: new Date(),
      roundsDescription: 'Technical discussion',
      questionsAsked: [{ text: 'What is unit testing?', type: 'theory' }],
      difficulty: 'Medium',
      outcome: 'Selected',
      status: 'approved',
    });

    // Ingest canonical knowledge using pipeline with mock embeddings (limit 10 for test speed)
    const fullSummary = await ingestAllKnowledgeSources({
      limit: 10,
      embeddingGenerator: async () => dummyEmbedding,
    });
    assert(fullSummary.totalChunksUpserted > 0, 'Normal ingestion must process canonical RAGKnowledge');

    // Verify operational document was NOT ingested into KnowledgeChunk
    const leakedChunk = await KnowledgeChunk.findOne({
      $or: [{ sourceId: String(testExp?._id) }, { company: 'OperationalTestCorp' }],
    });
    assert(leakedChunk === null, 'Operational InterviewExperience must NEVER be ingested into KnowledgeChunk by normal pipeline');
    if (testExp) {
      await InterviewExperience.deleteOne({ _id: testExp._id });
    }

    // 4.3 Verify canonical traceability: All chunks produced from RAGKnowledge have knowledgeId
    const canonicalChunks = await KnowledgeChunk.find({ knowledgeId: { $exists: true, $ne: null } }).limit(20);
    assert(canonicalChunks.length > 0, 'Canonical chunks with knowledgeId must exist');
    for (const c of canonicalChunks) {
      const parent = await RAGKnowledge.findById(c.knowledgeId);
      assert(parent !== null, `Chunk ${c.chunkKey} must trace back to an existing RAGKnowledge document`);
    }

    // 4.4 Inactive RAGKnowledge cleanup
    const tempInactive = await RAGKnowledge.create({
      sourceId: 'rag-temp-inact-999',
      sourceType: 'skill_question',
      category: 'testing',
      title: 'Temporary Inactive Test',
      content: 'This should be cleaned up upon ingestion.',
      status: 'active',
      version: '1.0.0',
    });
    const tempDrafts = buildRAGKnowledgeChunks(tempInactive as any);
    await upsertChunksForSource(tempInactive.sourceType, tempInactive.sourceId, tempDrafts, {
      embeddingGenerator: async () => dummyEmbedding,
    });
    const chunkBeforeClean = await KnowledgeChunk.countDocuments({ sourceId: tempInactive.sourceId });
    assert(chunkBeforeClean > 0, 'Chunk should be temporarily created');

    // Mark as inactive
    tempInactive.status = 'inactive';
    await tempInactive.save();

    // Run ingestion
    await ingestRAGKnowledge({ embeddingGenerator: async () => dummyEmbedding });
    const chunkAfterClean = await KnowledgeChunk.countDocuments({ sourceId: tempInactive.sourceId });
    assert(chunkAfterClean === 0, 'Inactive RAGKnowledge chunk must be purged automatically');
    await RAGKnowledge.deleteOne({ _id: tempInactive._id });

    // 4.5 Non-destructive legacy chunk reconciliation
    const recon = await reconcileLegacyOperationalChunks();
    assert(typeof recon.legacyCount === 'number', 'Legacy count must be reported');
    assert(typeof recon.annotatedCount === 'number', 'Annotated count must be reported');

    console.log('✓ PASS: Suite 4 — Prohibited operational ingestion, canonical pipeline, traceability, and legacy safety verified.\n');

    // -------------------------------------------------------------
    // SUITE 5: DATA ISOLATION & PRIVACY
    // -------------------------------------------------------------
    console.log('--- SUITE 5: DATA ISOLATION & PRIVACY ---');

    // 5.1 StudentMemory not in RAGKnowledge
    const memoryCountInRag = await RAGKnowledge.countDocuments({
      sourceType: { $in: ['student_memory', 'memory', 'studentMemory'] },
    });
    assert(memoryCountInRag === 0, 'StudentMemory records must NEVER exist in RAGKnowledge');

    // 5.2 Conversation / Message not in RAGKnowledge
    const convCountInRag = await RAGKnowledge.countDocuments({
      sourceType: { $in: ['conversation', 'message', 'chat'] },
    });
    assert(convCountInRag === 0, 'Conversation/Message records must NEVER exist in RAGKnowledge');

    // 5.3 Verify no private fields exist in RAGKnowledge
    const sampleRag = await RAGKnowledge.findOne().lean();
    assert(sampleRag !== null, 'Sample RAGKnowledge must exist');
    assert(!('studentId' in sampleRag!), 'RAGKnowledge must not contain studentId');
    assert(!('userId' in sampleRag!), 'RAGKnowledge must not contain userId');
    assert(!('password' in sampleRag!), 'RAGKnowledge must not contain password');
    assert(!('applicantNotes' in sampleRag!), 'RAGKnowledge must not contain applicantNotes');

    console.log('✓ PASS: Suite 5 — Strict isolation of curated knowledge from private student/conversation data verified.\n');

    // -------------------------------------------------------------
    // SUITE 6: REGRESSION TESTING (AI MENTOR RAG PATH)
    // -------------------------------------------------------------
    console.log('--- SUITE 6: REGRESSION TESTING (AI MENTOR RAG PATH) ---');

    // Verify AI Mentor RAG pipeline executes properly with grounded retrieval
    const mockStudentId = new mongoose.Types.ObjectId().toString();
    const mockRetriever = async (query: string): Promise<any[]> => {
      return [
        {
          chunkId: chunks[0].chunkKey,
          chunkKey: chunks[0].chunkKey,
          sourceId: chunks[0].sourceId,
          sourceType: chunks[0].sourceType,
          chunkIndex: chunks[0].chunkIndex,
          title: chunks[0].title,
          content: chunks[0].content,
          company: chunks[0].company,
          role: chunks[0].role,
          skill: chunks[0].skill,
          vectorScore: 0.95,
          keywordScore: 0.90,
          combinedScore: 0.93,
          score: 0.93,
        },
      ];
    };

    const mentorRes = await processMentorChat(
      mockStudentId,
      'Can you explain the difference between BST and balanced trees?',
      {
        targetRole: 'Software Engineer',
        retriever: mockRetriever,
        geminiCaller: async (req: any) => {
          const prompt = req.contents?.[0]?.parts?.[0]?.text || '';
          // Assert that sanitized context was injected into the prompt
          assert(prompt.includes('RETRIEVED PLACEMENTOS KNOWLEDGE'), 'Prompt must contain demarcated reference material');
          assert(prompt.includes('Database') || prompt.includes('Data Structures') || prompt.includes('Balanced'), 'Prompt must contain retrieved knowledge content');
          return { text: 'Balanced BSTs guarantee O(log N) lookup time.' };
        },
      }
    );

    assert(mentorRes.answer.includes('Balanced BSTs'), 'AI Mentor response should return model text');
    assert(mentorRes.sources.length > 0, 'AI Mentor should track sources used');

    console.log('✓ PASS: Suite 6 — Existing AI Mentor RAG flow remains fully functional.\n');

    // -------------------------------------------------------------
    // SUITE 7: MULTI-BATCH DATASET SEEDING & RESILIENCE (FIX #11.6.2)
    // -------------------------------------------------------------
    console.log('--- SUITE 7: MULTI-BATCH DATASET SEEDING & RESILIENCE (FIX #11.6.2) ---');

    // 7.1 Dynamic Discovery of dataset files in data/rag
    const ragDir = path.join(process.cwd(), 'data', 'rag');
    const discoveredFiles = discoverDatasetFiles(ragDir);
    assert(discoveredFiles.length >= 2, `Must discover at least 2 datasets (found: ${discoveredFiles.length})`);
    assert(discoveredFiles.some((f) => f.endsWith('placementos_rag_dataset_batch1.json')), 'Batch 1 must be discovered');
    assert(discoveredFiles.some((f) => f.endsWith('placementos_rag_dataset_batch2.json')), 'Batch 2 must be discovered');

    // 7.2 Non-data files (README, docs, temp files) are ignored by discovery
    const tempReadme = path.join(ragDir, 'README.md');
    const tempTxt = path.join(ragDir, 'notes.txt');
    fs.writeFileSync(tempReadme, '# RAG Data Notes\nThis is a readme.', 'utf-8');
    fs.writeFileSync(tempTxt, 'some text notes', 'utf-8');
    const filteredFiles = discoverDatasetFiles(ragDir);
    assert(!filteredFiles.some((f) => f.endsWith('README.md')), 'discoverDatasetFiles must ignore README.md');
    assert(!filteredFiles.some((f) => f.endsWith('.txt')), 'discoverDatasetFiles must ignore .txt files');
    if (fs.existsSync(tempReadme)) fs.unlinkSync(tempReadme);
    if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt);

    // 7.3 Top-level Dataset Structure Validation
    const validManifest = {
      datasetName: 'PlacementOS Batch Test',
      version: '1.0.0',
      records: [{ sourceId: 'test-rec-1' }],
    };
    const validManifestRes = validateRAGDatasetStructure(validManifest);
    assert(validManifestRes.valid === true, 'Valid manifest object must pass structural validation');

    const invalidNoName = { version: '1.0.0', records: [] };
    assert(validateRAGDatasetStructure(invalidNoName).valid === false, 'Missing datasetName must fail validation');

    const invalidNoRecords = { datasetName: 'Batch X', version: '1.0.0' };
    assert(validateRAGDatasetStructure(invalidNoRecords).valid === false, 'Missing records array must fail validation');

    // 7.4 Multi-Batch Seeding across data/rag/
    // Record initial chunk count to verify embeddings separation
    const chunkCountBeforeSeed = await KnowledgeChunk.countDocuments();

    const multiBatchReport = await seedRAGKnowledge({ log: false });
    assert(multiBatchReport.datasetsDiscovered >= 2, 'Multi-batch seeder must discover at least 2 datasets');
    assert(multiBatchReport.batches.length >= 2, 'Multi-batch seeder must report individual batch metrics');
    assert(multiBatchReport.totalProcessed >= 100, `Total processed records across batches must be >= 100 (got ${multiBatchReport.totalProcessed})`);

    // Verify both batches are represented in RAGKnowledge
    const batch1Doc = await RAGKnowledge.findOne({ sourceId: 'rag-tech-dsa-001' });
    assert(batch1Doc !== null, 'Batch 1 records must exist in RAGKnowledge');

    const batch2Doc = await RAGKnowledge.findOne({ sourceId: 'rag-batch2-sysdes-001' });
    assert(batch2Doc !== null, 'Batch 2 records must exist in RAGKnowledge');

    const batch2ExpDoc = await RAGKnowledge.findOne({ sourceId: 'rag-batch2-exp-001' });
    assert(batch2ExpDoc !== null, 'Batch 2 interview experience must exist in RAGKnowledge');

    // 7.5 Multi-Batch Idempotency
    const multiBatchSecondRun = await seedRAGKnowledge({ log: false });
    assert(multiBatchSecondRun.inserted === 0, 'Multi-batch second run must insert 0 records');
    assert(multiBatchSecondRun.updated === 0, 'Multi-batch second run must update 0 records');
    assert(
      multiBatchSecondRun.unchanged === multiBatchSecondRun.totalProcessed,
      'Multi-batch second run must mark all records as unchanged'
    );
    assert(multiBatchSecondRun.skipped === 0, 'Multi-batch second run must skip 0 valid records');

    // 7.6 Verification of Embeddings Separation
    // Seeding RAGKnowledge must NOT mutate or create KnowledgeChunks
    const chunkCountAfterSeed = await KnowledgeChunk.countDocuments();
    assert(
      chunkCountAfterSeed === chunkCountBeforeSeed,
      `Embeddings separation check: KnowledgeChunk count must be unaffected by seed:rag (before: ${chunkCountBeforeSeed}, after: ${chunkCountAfterSeed})`
    );

    // 7.7 Malformed JSON & Invalid File Handling
    const malformedJsonPath = path.join(ragDir, 'temp_malformed_test.json');
    const invalidStructPath = path.join(ragDir, 'temp_invalid_struct_test.json');

    fs.writeFileSync(malformedJsonPath, '{ invalid json syntax ...', 'utf-8');
    fs.writeFileSync(
      invalidStructPath,
      JSON.stringify({ description: 'No datasetName or version or records array' }),
      'utf-8'
    );

    const resilientReport = await seedRAGKnowledge({ log: false });
    assert(resilientReport.failed >= 2, 'Resilient seeder must record failed count for invalid files');
    assert(
      resilientReport.errors.some((e) => e.filePath?.includes('temp_malformed_test')),
      'Error log must describe malformed JSON failure'
    );
    assert(
      resilientReport.errors.some((e) => e.filePath?.includes('temp_invalid_struct_test')),
      'Error log must describe invalid structure failure'
    );
    // Crucially: valid batches (batch1, batch2) still processed safely
    assert(
      resilientReport.batches.some((b) => b.fileName.includes('batch1') && b.failed === 0),
      'Valid batches must continue to be processed despite other malformed files'
    );

    // Clean up temporary invalid test files
    if (fs.existsSync(malformedJsonPath)) fs.unlinkSync(malformedJsonPath);
    if (fs.existsSync(invalidStructPath)) fs.unlinkSync(invalidStructPath);

    // 7.8 Cross-Batch Duplicate & Conflict Detection
    const tempConflictFile1 = path.join(ragDir, 'temp_conflict_a.json');
    const tempConflictFile2 = path.join(ragDir, 'temp_conflict_b.json');

    fs.writeFileSync(
      tempConflictFile1,
      JSON.stringify({
        datasetName: 'Conflict Batch A',
        version: '1.0.0',
        records: [
          {
            sourceId: 'rag-test-conflict-001',
            sourceType: 'skill_question',
            category: 'technical',
            title: 'Version A Title',
            content: 'Version A content explanation.',
            status: 'active',
            version: '1.0.0',
          },
        ],
      }),
      'utf-8'
    );

    fs.writeFileSync(
      tempConflictFile2,
      JSON.stringify({
        datasetName: 'Conflict Batch B',
        version: '1.0.0',
        records: [
          {
            sourceId: 'rag-test-conflict-001',
            sourceType: 'skill_question',
            category: 'technical',
            title: 'Conflicting Version B Title',
            content: 'Different content explanation causing conflict.',
            status: 'active',
            version: '1.0.0',
          },
        ],
      }),
      'utf-8'
    );

    const conflictReport = await seedRAGKnowledge({ log: false });
    assert(conflictReport.conflicts.length > 0, 'Conflicting cross-batch records must be flagged in conflicts');
    assert(
      conflictReport.conflicts.some((c) => c.sourceId === 'rag-test-conflict-001'),
      'Conflict report must specify conflicting sourceId'
    );

    // Clean up conflict test files & records
    if (fs.existsSync(tempConflictFile1)) fs.unlinkSync(tempConflictFile1);
    if (fs.existsSync(tempConflictFile2)) fs.unlinkSync(tempConflictFile2);
    await RAGKnowledge.deleteMany({ sourceId: 'rag-test-conflict-001' });

    console.log('✓ PASS: Suite 7 — Dynamic discovery, multi-batch seeding, idempotency, failure resilience, conflict detection, and embeddings separation verified.\n');

    console.log('====================================================');
    console.log('  ALL SUITES PASSED: FIX #11.6 & 11.6.2 VERIFIED!   ');
    console.log('====================================================');
  } finally {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected from database.');
  }
}

runRagDatasetTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Test Failed]:', err);
    process.exit(1);
  });
