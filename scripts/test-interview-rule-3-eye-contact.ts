import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express from 'express';
import mongoose from 'mongoose';
import { interviewsRouter } from '../routes/interviews';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { connectDB } from '../src/db/db';
import {
  EyeContactTracker,
  EYE_CONTACT_THRESHOLD,
  EYE_CONTACT_VIOLATION_DURATION_MS,
  EYE_CONTACT_VIOLATION_TYPE,
  EYE_CONTACT_VIOLATION_MESSAGE,
} from '../src/utils/eyeContactProctoring';

console.log('================================================================');
console.log('  AI MOCK INTERVIEW: RULE 3 EYE CONTACT PROCTORING TEST SUITE   ');
console.log('================================================================\n');

async function runTests() {
  await connectDB();
  const isDbConnected = mongoose.connection.readyState === 1;
  console.log(`[DB Status] Connected: ${isDbConnected}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos-32characters!';
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.GEMINI_API_KEY = '';

  const app = express();
  app.use(express.json());
  app.use('/api/interviews', interviewsRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  function createToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
  }

  const studentA_Id = new mongoose.Types.ObjectId().toString();
  const studentB_Id = new mongoose.Types.ObjectId().toString();
  const recruiterId = new mongoose.Types.ObjectId().toString();

  const studentA_Token = createToken(studentA_Id, 'student');
  const studentB_Token = createToken(studentB_Id, 'student');
  const recruiterToken = createToken(recruiterId, 'industry');

  async function req(method: string, endpoint: string, token?: string, body?: any) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const status = res.status;
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status, data };
  }

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✓ ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ✗ ${name}`);
            console.error('   ', err.message);
            process.exitCode = 1;
          });
      } else {
        console.log(`  ✓ ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error('   ', err.message);
      process.exitCode = 1;
    }
  }

  // --- UNIT TESTS: EyeContactTracker Continuous Evaluation ---
  console.log('--- Unit Tests: EyeContactTracker Continuous Duration Logic ---');

  await test('1. Score >= 50% continuously (e.g. 60% for 5s) -> NO eye-contact violation', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    // Feed frames from 0 to 5000ms with score 60%
    for (let t = 0; t <= 5000; t += 100) {
      const v = tracker.processFrame(60, baseTime + t, true);
      assert.strictEqual(v, null, 'Should not generate violation when score >= 50%');
    }
    assert.strictEqual(tracker.getBelowThresholdSince(), null);
    assert.strictEqual(tracker.isViolationLogged(), false);
  });

  await test('2. Score < 50% for only 2 seconds (< 3s duration) -> NO eye-contact violation', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    // Feed frames from 0 to 2000ms with score 45%
    for (let t = 0; t <= 2000; t += 100) {
      const v = tracker.processFrame(45, baseTime + t, true);
      assert.strictEqual(v, null, 'Should not generate violation before 3s');
    }
    assert.strictEqual(tracker.getBelowThresholdSince(), baseTime);
    assert.strictEqual(tracker.isViolationLogged(), false);
  });

  await test('3. Score < 50% continuously for 3 seconds -> exactly ONE eye-contact violation created', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    let createdViolation: any = null;
    for (let t = 0; t <= 3000; t += 100) {
      const v = tracker.processFrame(45, baseTime + t, true);
      if (v) {
        assert.strictEqual(createdViolation, null, 'Only one violation should be returned');
        createdViolation = v;
      }
    }
    assert.notStrictEqual(createdViolation, null, 'A violation must be created at 3s');
    assert.strictEqual(createdViolation.type, EYE_CONTACT_VIOLATION_TYPE);
    assert.strictEqual(createdViolation.details, EYE_CONTACT_VIOLATION_MESSAGE);
    assert.strictEqual(tracker.isViolationLogged(), true);
  });

  await test('4. Score < 50% for 2.9 seconds, then recovers to 50% -> NO violation (timer resets)', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    // 0 to 2900ms at 40%
    for (let t = 0; t <= 2900; t += 100) {
      const v = tracker.processFrame(40, baseTime + t, true);
      assert.strictEqual(v, null);
    }
    // At 3000ms, recovers to 50% (exactly 50% is NOT a violation)
    const vAt3000 = tracker.processFrame(50, baseTime + 3000, true);
    assert.strictEqual(vAt3000, null, 'Exactly 50% is not a violation');
    assert.strictEqual(tracker.getBelowThresholdSince(), null, 'Timer must be reset');
    assert.strictEqual(tracker.isViolationLogged(), false);
  });

  await test('5. Score remains < 50% after violation is created -> still only ONE violation (no spam)', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    let violationCount = 0;
    // Feed frames from 0 to 8000ms with score 40%
    for (let t = 0; t <= 8000; t += 100) {
      const v = tracker.processFrame(40, baseTime + t, true);
      if (v) violationCount++;
    }
    assert.strictEqual(violationCount, 1, 'Only one violation must be logged for the continuous episode');
    assert.strictEqual(tracker.isViolationLogged(), true);
  });

  await test('6. After recovery to >= 50%, subsequent drop < 50% for 3s creates independent second violation', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    let violations: any[] = [];

    // Episode 1: 0 to 3500ms at 40% -> 1 violation
    for (let t = 0; t <= 3500; t += 100) {
      const v = tracker.processFrame(40, baseTime + t, true);
      if (v) violations.push(v);
    }
    assert.strictEqual(violations.length, 1);

    // Recovery: 3600 to 6000ms at 75%
    for (let t = 3600; t <= 6000; t += 100) {
      const v = tracker.processFrame(75, baseTime + t, true);
      assert.strictEqual(v, null);
    }
    assert.strictEqual(tracker.getBelowThresholdSince(), null);
    assert.strictEqual(tracker.isViolationLogged(), false);

    // Episode 2: 6100 to 9500ms at 42% -> 2nd violation
    for (let t = 6100; t <= 9500; t += 100) {
      const v = tracker.processFrame(42, baseTime + t, true);
      if (v) violations.push(v);
    }
    assert.strictEqual(violations.length, 2, 'Must create an independent second violation for new episode');
  });

  await test('7. Invalid, missing, or loading face data (null, undefined, NaN) does NOT start timer', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    assert.strictEqual(tracker.processFrame(null, baseTime, true), null);
    assert.strictEqual(tracker.processFrame(undefined, baseTime + 100, true), null);
    assert.strictEqual(tracker.processFrame(NaN, baseTime + 200, true), null);
    assert.strictEqual(tracker.getBelowThresholdSince(), null, 'Timer must not start on invalid data');
  });

  await test('8. Inactive interview (isSessionActive = false) ignores frames and resets tracker', () => {
    const tracker = new EyeContactTracker();
    const baseTime = 100000;
    // Try feeding < 50% when session is not active
    for (let t = 0; t <= 5000; t += 100) {
      const v = tracker.processFrame(30, baseTime + t, false);
      assert.strictEqual(v, null);
    }
    assert.strictEqual(tracker.getBelowThresholdSince(), null);
  });

  // --- INTEGRATION TESTS: Backend API & Session Lifecycle ---
  console.log('\n--- Integration Tests: Backend Violation Endpoint & Proctoring Lifecycle ---');

  // Helper to start an active session
  async function createActiveSession(userId: string, token: string) {
    const res = await req('POST', '/api/interviews/start', token, {
      company: 'Google',
      jobRole: 'Software Engineer',
      candidateName: 'Test Student',
      studentEmail: 'student@example.com',
      studentCollege: 'Test Institute',
      studentDegree: 'B.Tech CS',
    });
    assert(res.status === 200 || res.status === 201, `Failed to start interview: ${JSON.stringify(res.data)}`);
    const id = res.data.sessionId || res.data._id || (res.data.session && (res.data.session.sessionId || res.data.session._id));
    assert(id, 'SessionId expected');
    return id as string;
  }

  await test('9. Active student records EYE_CONTACT violation -> saved, interview remains ACTIVE', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 42,
      durationMs: 3100,
      timestamp: new Date().toISOString(),
      details: EYE_CONTACT_VIOLATION_MESSAGE,
    });

    assert.strictEqual(vRes.status, 200);
    assert.strictEqual(vRes.data.success, true);
    assert.strictEqual(vRes.data.sessionStatus, 'active');
    assert.strictEqual(vRes.data.violation.type, 'EYE_CONTACT');

    // Verify session in DB/memory remains active and contains the violation
    const getRes = await req('GET', `/api/interviews/${sessionId}`, studentA_Token);
    assert.strictEqual(getRes.status, 200);
    const sessionData = getRes.data.session || getRes.data;
    assert.strictEqual(sessionData.status, 'active');
    const dbViolations = sessionData.violations || [];
    const eyeContactViolation = dbViolations.find((v: any) => v.type === 'EYE_CONTACT');
    assert.ok(eyeContactViolation, 'EYE_CONTACT violation must be present in session');
    assert.strictEqual(eyeContactViolation.details, EYE_CONTACT_VIOLATION_MESSAGE);
  });

  await test('10. Repeated identical violation within debounce window is deduplicated', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    const vId = `v_ec_dedup_${Date.now()}`;
    const vRes1 = await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      id: vId,
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3000,
    });
    assert.strictEqual(vRes1.status, 200);
    assert.strictEqual(vRes1.data.deduplicated, undefined);

    // Immediate repeat
    const vRes2 = await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      id: vId,
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3000,
    });
    assert.strictEqual(vRes2.status, 200);
    assert.strictEqual(vRes2.data.deduplicated, true);
  });

  await test('11. Score >= 50% rejected by backend violation endpoint with 400', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 50, // Exactly 50% is NOT a violation
      durationMs: 3500,
    });
    assert.strictEqual(vRes.status, 400);
    assert.ok(vRes.data.error.includes('below threshold'));
  });

  await test('12. Duration < 3000ms rejected by backend violation endpoint with 400', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 35,
      durationMs: 2500, // Less than 3000ms
    });
    assert.strictEqual(vRes.status, 400);
    assert.ok(vRes.data.error.includes('at least 3000ms'));
  });

  await test('13. Unauthenticated request to violation endpoint returns 401', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, undefined, {
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3000,
    });
    assert.strictEqual(vRes.status, 401);
  });

  await test('14. Wrong student (IDOR attempt) returns 403 Forbidden', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    // Student B attempts to post violation to Student A's session
    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, studentB_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3000,
    });
    assert.strictEqual(vRes.status, 403);
  });

  await test('15. Recruiter/non-student role returns 403 Forbidden', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, recruiterToken, {
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3000,
    });
    assert.strictEqual(vRes.status, 403);
  });

  await test('16. Terminated interview rejects violations (409 Conflict)', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    // Terminate session (e.g. Tab switch)
    const termRes = await req('POST', `/api/interviews/${sessionId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
      remark: 'Cheating detected: Candidate attempted to switch tabs or leave the interview.',
    });
    assert.strictEqual(termRes.status, 200);

    // Attempt to report eye contact violation on terminated session
    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 30,
      durationMs: 3000,
    });
    assert.strictEqual(vRes.status, 409);
    assert.strictEqual(vRes.data.status, 'TERMINATED');
  });

  await test('17. Completed interview rejects violations (409 Conflict)', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    // Complete the interview
    const compRes = await req('POST', `/api/interviews/${sessionId}/complete`, studentA_Token, {
      questionLogs: [
        { questionText: 'Explain microservices', answer: 'Microservices architecture...', score: 85, feedback: 'Good', postureScore: 90, eyeContactScore: 85 }
      ],
      violations: [],
    });
    assert.strictEqual(compRes.status, 200);

    // Attempt to report eye contact violation on completed session
    const vRes = await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 30,
      durationMs: 3000,
    });
    assert.strictEqual(vRes.status, 409);
    assert.strictEqual(vRes.data.status, 'completed');
  });

  await test('18. EYE_CONTACT violations are included in session completion and proctoring score calculation', async () => {
    const sessionId = await createActiveSession(studentA_Id, studentA_Token);

    // Report one EYE_CONTACT violation during interview
    await req('POST', `/api/interviews/${sessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 38,
      durationMs: 3200,
      details: EYE_CONTACT_VIOLATION_MESSAGE,
    });

    // Complete the interview
    const compRes = await req('POST', `/api/interviews/${sessionId}/complete`, studentA_Token, {
      questionLogs: [
        { questionText: 'What is polymorphism?', answer: 'Polymorphism allows...', score: 90, feedback: 'Solid', postureScore: 92, eyeContactScore: 88 }
      ],
      violations: [], // server-side violation should merge automatically
    });

    assert.strictEqual(compRes.status, 200);
    // Base 100 minus 5 penalty for eye contact violation = 95
    assert.strictEqual(compRes.data.proctoringScore, 95);
    const sessionViolations = compRes.data.violations || [];
    const ecViolation = sessionViolations.find((v: any) => v.type === 'EYE_CONTACT');
    assert.ok(ecViolation, 'Merged violations must retain EYE_CONTACT violation');
  });

  // Clean up
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected from database.');
  }

  console.log('\n================================================================');
  console.log(`  RULE 3 TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
