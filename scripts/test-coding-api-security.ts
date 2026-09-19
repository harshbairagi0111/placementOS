import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import { connectDB } from '../src/db/db';
import { CodingQuestion } from '../src/models/CodingQuestion';
import { codingRouter } from '../routes/coding';
import { seedCodingQuestions } from './seedCodingQuestions';
import { validateCodingDataset } from './validateCodingDataset';
import { allCodingQuestions } from '../data/codingQuestions/index';
import { getJwtSecret } from '../routes/securityConfig';

dotenv.config();

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/coding', codingRouter);
  return app;
}

async function runCodingReadinessTestSuite() {
  console.log('====================================================');
  console.log('   PLACEMENTOS CODING READINESS CHANGE 1A TEST SUITE');
  console.log('====================================================\n');

  let passes = 0;
  let failures = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${testName}`);
      passes++;
    } else {
      console.error(`  ✖ FAIL: ${testName}`);
      failures++;
    }
  }

  // 1. DATASET VALIDATION
  console.log('--- 1. Dataset Static Validation ---');
  const datasetValidation = validateCodingDataset(allCodingQuestions);
  assert(datasetValidation.passed, `Dataset passes all validation checks (${allCodingQuestions.length} questions)`);
  assert(datasetValidation.metrics.totalQuestions >= 30, `Total questions (${datasetValidation.metrics.totalQuestions}) >= 30`);
  assert(Object.keys(datasetValidation.metrics.categories).length >= 9, `At least 9 distinct coding categories present`);
  assert(datasetValidation.metrics.publicTestCases >= 30, `Public test cases count (${datasetValidation.metrics.publicTestCases}) >= 30`);
  assert(datasetValidation.metrics.hiddenTestCases >= 90, `Hidden test cases count (${datasetValidation.metrics.hiddenTestCases}) >= 90`);

  // Connect to DB for remaining tests
  try {
    await connectDB();
  } catch (err: any) {
    console.error('Database connection error:', err);
    process.exit(1);
  }

  // 2. IDEMPOTENT SEEDING
  console.log('\n--- 2. Idempotent Seeding Verification ---');
  const firstSeed = await seedCodingQuestions({ quiet: true });
  const countAfterFirstSeed = await CodingQuestion.countDocuments({ isActive: true });
  assert(countAfterFirstSeed >= 30, `Initial seed populated ${countAfterFirstSeed} active questions in MongoDB`);

  const secondSeed = await seedCodingQuestions({ quiet: true });
  const countAfterSecondSeed = await CodingQuestion.countDocuments({ isActive: true });
  assert(countAfterSecondSeed === countAfterFirstSeed, `Second seed did not duplicate questions (Count: ${countAfterSecondSeed})`);
  assert(secondSeed.upserted === 0, `Second seed had 0 new upserts (all matched existing slugs)`);

  // 3. DATABASE MODEL & TEST CASE VISIBILITY
  console.log('\n--- 3. Database Schema & Test Cases Storage ---');
  const sampleDbDoc = await CodingQuestion.findOne({ slug: 'two-sum' });
  assert(sampleDbDoc !== null, 'Found "two-sum" in database');
  if (sampleDbDoc) {
    const rawPublicCases = sampleDbDoc.testCases.filter((tc) => tc.visibility === 'PUBLIC');
    const rawHiddenCases = sampleDbDoc.testCases.filter((tc) => tc.visibility === 'HIDDEN');
    assert(rawPublicCases.length >= 2, `DB document has ${rawPublicCases.length} PUBLIC test cases`);
    assert(rawHiddenCases.length >= 3, `DB document has ${rawHiddenCases.length} HIDDEN test cases stored server-side`);
  }

  // 4. API SECURITY & HIDDEN TEST CASE STRIPPING
  console.log('\n--- 4. API Security & Hidden Test Case Stripping ---');
  const testApp = createTestApp();
  const server = testApp.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const studentUserId = new mongoose.Types.ObjectId().toString();
  const studentToken = jwt.sign(
    { userId: studentUserId, email: 'student@placementos.edu', role: 'student' },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  const studentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${studentToken}`,
  };

  try {
    // 4a. GET /api/coding/questions (with optional or authenticated headers)
    const listRes = await fetch(`${baseUrl}/api/coding/questions`, { headers: studentHeaders });
    const listData = await listRes.json();
    assert(listRes.ok, `GET /api/coding/questions returned 200 OK`);
    assert(Array.isArray(listData.questions) && listData.questions.length >= 30, `API returned ${listData.questions?.length} questions`);

    // Verify absolutely ZERO hidden test cases leaked
    let leakedHiddenCases = 0;
    let totalPublicReturned = 0;
    for (const q of listData.questions || []) {
      for (const tc of q.testCases || []) {
        if (tc.visibility === 'HIDDEN') leakedHiddenCases++;
        if (tc.visibility === 'PUBLIC') totalPublicReturned++;
      }
    }
    assert(leakedHiddenCases === 0, `Zero HIDDEN test cases exposed in questions list (found: ${leakedHiddenCases})`);
    assert(totalPublicReturned >= 30, `Public test cases returned cleanly (${totalPublicReturned} test cases)`);

    // 4b. GET /api/coding/questions/:id by slug
    const singleRes = await fetch(`${baseUrl}/api/coding/questions/two-sum`, { headers: studentHeaders });
    const singleData = await singleRes.json();
    assert(singleRes.ok, `GET /api/coding/questions/two-sum returned 200 OK`);
    assert(singleData.question?.title === 'Two Sum', `Returned correct question title: "${singleData.question?.title}"`);
    
    const singleHiddenLeaked = (singleData.question?.testCases || []).filter((tc: any) => tc.visibility === 'HIDDEN');
    assert(singleHiddenLeaked.length === 0, `Zero HIDDEN test cases exposed in single question endpoint`);
    assert(singleData.question?.testCases?.length >= 2, `PUBLIC test cases returned in single question endpoint`);
    assert(singleData.question?.starterCode?.cpp !== undefined, `Starter code for cpp present in single question endpoint`);

    // 4c. Inactive question rejection
    await CodingQuestion.updateOne({ slug: 'two-sum' }, { $set: { isActive: false } });
    const inactiveRes = await fetch(`${baseUrl}/api/coding/questions/two-sum`, { headers: studentHeaders });
    assert(inactiveRes.status === 404, `Inactive question rejected with 404 (Status: ${inactiveRes.status})`);
    // Restore active state
    await CodingQuestion.updateOne({ slug: 'two-sum' }, { $set: { isActive: true } });

    // 4d. Rejection of student mutations (POST, PUT, DELETE)
    const postRes = await fetch(`${baseUrl}/api/coding/questions`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ title: 'Hacked Question' }),
    });
    assert(postRes.status === 403, `POST /api/coding/questions rejected with 403 Forbidden for students (Status: ${postRes.status})`);

    const putRes = await fetch(`${baseUrl}/api/coding/questions/two-sum`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({ title: 'Modified' }),
    });
    assert(putRes.status === 403, `PUT /api/coding/questions/:id rejected with 403 Forbidden for students (Status: ${putRes.status})`);

    const deleteRes = await fetch(`${baseUrl}/api/coding/questions/two-sum`, {
      method: 'DELETE',
      headers: studentHeaders,
    });
    assert(deleteRes.status === 403, `DELETE /api/coding/questions/:id rejected with 403 Forbidden for students (Status: ${deleteRes.status})`);

    // 5. PROGRESS TRACKING TEST
    console.log('\n--- 5. Coding Progress Tracking ---');
    const progRes = await fetch(`${baseUrl}/api/coding/progress`, { headers: studentHeaders });
    const progData = await progRes.json();
    assert(progRes.ok, `GET /api/coding/progress returned 200 OK`);
    assert(progData.progress !== undefined, `Progress document initialized for user`);

    const solveRes = await fetch(`${baseUrl}/api/coding/progress/record-solution`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ difficulty: 'MEDIUM', runtimeMs: 14 }),
    });
    const solveData = await solveRes.json();
    assert(solveRes.ok, `POST /api/coding/progress/record-solution recorded solution`);
    assert(solveData.progress?.problemsSolved >= 1, `problemsSolved incremented (current: ${solveData.progress?.problemsSolved})`);
    assert(solveData.progress?.mediumSolved >= 1, `mediumSolved incremented (current: ${solveData.progress?.mediumSolved})`);
    assert(solveData.progress?.fastestRuntimeMs === 14, `fastestRuntimeMs recorded as 14ms`);

  } finally {
    server.close();
  }

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passes} PASSED, ${failures} FAILED`);
  console.log('====================================================\n');

  if (failures > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCodingReadinessTestSuite().catch((err) => {
  console.error('Fatal error running coding test suite:', err);
  process.exit(1);
});
