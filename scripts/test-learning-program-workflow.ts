import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import express from 'express';
import bcrypt from 'bcryptjs';
import { studentsRouter } from '../routes/students';
import { recruitersRouter } from '../routes/recruiters';
import { User, IUser } from '../src/models/User';
import { LearningProgram } from '../src/models/LearningProgram';
import { LearningProgramApplication } from '../src/models/LearningProgramApplication';
import { connectDB } from '../src/db/db';

console.log('====================================================');
console.log('  LEARNING PROGRAM CAPACITY & CONCURRENCY TEST SUITE');
console.log('====================================================\n');

async function runTests() {
  await connectDB();
  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos';
  process.env.JWT_SECRET = JWT_SECRET;

  const app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);
  app.use('/api/recruiters', recruitersRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[Setup] Test server running on ${baseUrl}`);

  async function makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    token?: string
  ): Promise<{ status: number; body: any }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, body: data };
  }

  const timestamp = Date.now();
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Create isolated recruiter user
  const recruiter = await User.create({
    name: 'CloudCorp Recruiter',
    email: `recruiter.${timestamp}@cloudcorp.io`,
    password: passwordHash,
    role: 'industry',
    company: 'CloudCorp Systems',
    department: 'Engineering',
  } as IUser);
  const recruiterToken = jwt.sign(
    { userId: (recruiter._id as any).toString(), email: recruiter.email, role: 'industry' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Create unauthorized recruiter user
  const unauthorizedRecruiter = await User.create({
    name: 'OtherCorp Recruiter',
    email: `other.${timestamp}@othercorp.io`,
    password: passwordHash,
    role: 'industry',
    company: 'OtherCorp',
  } as IUser);
  const unauthorizedToken = jwt.sign(
    { userId: (unauthorizedRecruiter._id as any).toString(), email: unauthorizedRecruiter.email, role: 'industry' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Create student users
  const studentA = await User.create({
    name: 'Candidate Alice',
    email: `alice.${timestamp}@university.edu`,
    password: passwordHash,
    role: 'student',
    college: 'Test Tech University',
  } as IUser);
  const studentAToken = jwt.sign(
    { userId: (studentA._id as any).toString(), email: studentA.email, role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentB = await User.create({
    name: 'Candidate Bob',
    email: `bob.${timestamp}@university.edu`,
    password: passwordHash,
    role: 'student',
    college: 'Test Tech University',
  } as IUser);
  const studentBToken = jwt.sign(
    { userId: (studentB._id as any).toString(), email: studentB.email, role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentC = await User.create({
    name: 'Candidate Charlie',
    email: `charlie.${timestamp}@university.edu`,
    password: passwordHash,
    role: 'student',
    college: 'Test Tech University',
  } as IUser);
  const studentCToken = jwt.sign(
    { userId: (studentC._id as any).toString(), email: studentC.email, role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  let passedTests = 0;

  try {
    // -------------------------------------------------------------
    // TEST 1: Student can apply even if enrolledCount >= capacity
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Student application allowed when enrolledCount >= capacity ---');
    const fullProgram = await LearningProgram.create({
      title: 'Full Capacity Cloud Architecture Workshop',
      company: 'CloudCorp Systems',
      recruiterId: recruiter._id,
      type: 'Workshop',
      capacity: 1,
      enrolledCount: 1, // Already at capacity 1/1
      status: 'Active',
    });

    const applyRes = await makeRequest(
      'POST',
      `/api/students/learning-programs/${fullProgram._id}/apply`,
      { motivation: 'I really want to join if a seat opens up!' },
      studentAToken
    );

    assert.strictEqual(
      applyRes.status,
      201,
      `Expected 201 Created on application when enrolledCount >= capacity, got ${applyRes.status}: ${JSON.stringify(applyRes.body)}`
    );
    assert.strictEqual(applyRes.body.success, true);
    assert.strictEqual(applyRes.body.application.status, 'APPLIED');

    // Verify program enrolledCount did NOT change from application
    const checkProg1 = await LearningProgram.findById(fullProgram._id);
    assert.strictEqual(checkProg1?.enrolledCount, 1, 'enrolledCount must remain 1 after application');
    console.log('✓ PASS: Student successfully applied to full program without premature capacity rejection');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Concurrency test: capacity=1, two simultaneous selections
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Concurrency test (capacity=1, 2 simultaneous selections) ---');
    const compProg = await LearningProgram.create({
      title: 'High-Concurrency Distributed Systems Cohort',
      company: 'CloudCorp Systems',
      recruiterId: recruiter._id,
      type: 'Mentorship',
      capacity: 1, // Only 1 seat available!
      enrolledCount: 0,
      status: 'Active',
    });

    // Student B and Student C apply
    const appBRes = await makeRequest(
      'POST',
      `/api/students/learning-programs/${compProg._id}/apply`,
      { motivation: 'Candidate Bob applying' },
      studentBToken
    );
    assert.strictEqual(appBRes.status, 201);
    const appBId = appBRes.body.application.id;

    const appCRes = await makeRequest(
      'POST',
      `/api/students/learning-programs/${compProg._id}/apply`,
      { motivation: 'Candidate Charlie applying' },
      studentCToken
    );
    assert.strictEqual(appCRes.status, 201);
    const appCId = appCRes.body.application.id;

    // Concurrently trigger SELECTION for both applicants
    console.log(`[Concurrency] Dispatching simultaneous selection requests for ${appBId} and ${appCId}...`);
    const [selectRes1, selectRes2] = await Promise.all([
      makeRequest(
        'PATCH',
        `/api/recruiters/learning-programs/${compProg._id}/applications/${appBId}`,
        { status: 'SELECTED' },
        recruiterToken
      ),
      makeRequest(
        'PATCH',
        `/api/recruiters/learning-programs/${compProg._id}/applications/${appCId}`,
        { status: 'SELECTED' },
        recruiterToken
      ),
    ]);

    const statuses = [selectRes1.status, selectRes2.status];
    console.log(`[Concurrency] Status codes returned: ${statuses.join(', ')}`);

    // Exactly one must be 200, and exactly one must be 409 Conflict
    assert.ok(
      statuses.includes(200),
      `Expected one 200 OK, got: ${statuses.join(', ')}`
    );
    assert.ok(
      statuses.includes(409),
      `Expected one 409 Conflict, got: ${statuses.join(', ')}`
    );

    // Verify program enrolledCount in database is strictly 1 (NOT 2!)
    const checkCompProg = await LearningProgram.findById(compProg._id);
    assert.strictEqual(
      checkCompProg?.enrolledCount,
      1,
      `enrolledCount must be exactly 1, found ${checkCompProg?.enrolledCount}`
    );

    // Verify in database that exactly one application is SELECTED and the other remains APPLIED
    const appBDoc = await LearningProgramApplication.findById(appBId);
    const appCDoc = await LearningProgramApplication.findById(appCId);

    const dbStatuses = [appBDoc?.status, appCDoc?.status];
    assert.strictEqual(
      dbStatuses.filter((s) => s === 'SELECTED').length,
      1,
      'Exactly one application must be SELECTED in DB'
    );
    assert.strictEqual(
      dbStatuses.filter((s) => s === 'APPLIED').length,
      1,
      'The losing application must remain APPLIED in DB without side-effects'
    );

    console.log('✓ PASS: Concurrency test verified: Exactly 1 candidate selected, 1 rejected with 409, enrolledCount strictly equals 1');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Capacity restriction enforced on subsequent selection
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Subsequent selection attempt when capacity reached ---');
    const losingAppId = appBDoc?.status === 'APPLIED' ? appBId : appCId;
    const secondSelectRes = await makeRequest(
      'PATCH',
      `/api/recruiters/learning-programs/${compProg._id}/applications/${losingAppId}`,
      { status: 'SELECTED' },
      recruiterToken
    );

    assert.strictEqual(
      secondSelectRes.status,
      409,
      `Expected 409 Conflict on selecting when capacity full, got ${secondSelectRes.status}: ${JSON.stringify(secondSelectRes.body)}`
    );
    assert.ok(
      secondSelectRes.body.error?.toLowerCase().includes('capacity'),
      `Expected error message to mention capacity, got "${secondSelectRes.body.error}"`
    );
    console.log('✓ PASS: Selection correctly blocked with 409 Conflict when cohort capacity reached');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: Duplicate selection on already selected applicant
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Duplicate selection attempt on already selected applicant ---');
    const winningAppId = appBDoc?.status === 'SELECTED' ? appBId : appCId;
    const dupSelectRes = await makeRequest(
      'PATCH',
      `/api/recruiters/learning-programs/${compProg._id}/applications/${winningAppId}`,
      { status: 'SELECTED' },
      recruiterToken
    );

    assert.strictEqual(
      dupSelectRes.status,
      409,
      `Expected 409 Conflict on already selected applicant, got ${dupSelectRes.status}`
    );
    console.log('✓ PASS: Duplicate selection attempt rejected with 409 Conflict');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Rejection does NOT modify capacity
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Rejection does NOT modify enrolledCount ---');
    const countBeforeReject = checkCompProg?.enrolledCount;
    const rejectRes = await makeRequest(
      'PATCH',
      `/api/recruiters/learning-programs/${compProg._id}/applications/${losingAppId}`,
      { status: 'REJECTED' },
      recruiterToken
    );

    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.application.status, 'REJECTED');

    const checkAfterReject = await LearningProgramApplication.findById(losingAppId);
    assert.strictEqual(checkAfterReject?.status, 'REJECTED');

    const progAfterReject = await LearningProgram.findById(compProg._id);
    assert.strictEqual(
      progAfterReject?.enrolledCount,
      countBeforeReject,
      'enrolledCount must NOT change when rejecting an applicant'
    );
    console.log('✓ PASS: Rejection successfully transitioned without modifying enrolledCount');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: UNDER_REVIEW does NOT modify capacity
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: UNDER_REVIEW does NOT modify enrolledCount ---');
    const prog3 = await LearningProgram.create({
      title: 'Workshop for Under Review Test',
      company: 'CloudCorp Systems',
      recruiterId: recruiter._id,
      type: 'Workshop',
      capacity: 5,
      enrolledCount: 0,
      status: 'Active',
    });

    const app3Res = await makeRequest(
      'POST',
      `/api/students/learning-programs/${prog3._id}/apply`,
      { motivation: 'Candidate Alice applying for review test' },
      studentAToken
    );
    assert.strictEqual(app3Res.status, 201);
    const app3Id = app3Res.body.application.id;

    const underReviewRes = await makeRequest(
      'PATCH',
      `/api/recruiters/learning-programs/${prog3._id}/applications/${app3Id}`,
      { status: 'UNDER_REVIEW' },
      recruiterToken
    );

    assert.strictEqual(underReviewRes.status, 200);
    assert.strictEqual(underReviewRes.body.application.status, 'UNDER_REVIEW');

    const prog3AfterReview = await LearningProgram.findById(prog3._id);
    assert.strictEqual(
      prog3AfterReview?.enrolledCount,
      0,
      'enrolledCount must remain 0 when moving to UNDER_REVIEW'
    );
    console.log('✓ PASS: UNDER_REVIEW transitioned without modifying enrolledCount');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 7: Unauthorized recruiter access check
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Unauthorized recruiter check ---');
    const unauthRes = await makeRequest(
      'PATCH',
      `/api/recruiters/learning-programs/${prog3._id}/applications/${app3Id}`,
      { status: 'SELECTED' },
      unauthorizedToken
    );

    assert.strictEqual(unauthRes.status, 403, 'Recruiter without ownership must receive 403 Forbidden');
    console.log('✓ PASS: Unauthorized recruiter correctly blocked with 403 Forbidden');
    passedTests++;

    console.log('\n====================================================');
    console.log(` ALL ${passedTests} / 7 TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
