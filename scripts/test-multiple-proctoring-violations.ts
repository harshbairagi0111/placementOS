import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express from 'express';
import mongoose from 'mongoose';
import { interviewsRouter } from '../routes/interviews';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { connectDB } from '../src/db/db';
import {
  MAX_PROCTORING_VIOLATIONS,
  MULTIPLE_VIOLATIONS_TERMINATION_REASON,
  MULTIPLE_VIOLATIONS_TERMINATION_REMARK,
  countActualProctoringViolations,
  EyeContactTracker,
  EYE_CONTACT_THRESHOLD,
  EYE_CONTACT_VIOLATION_DURATION_MS,
  EYE_CONTACT_VIOLATION_TYPE,
  EYE_CONTACT_VIOLATION_MESSAGE,
} from '../src/utils/eyeContactProctoring';

console.log('================================================================');
console.log('  PLACEMENTOS — AI MOCK INTERVIEW RULE 4 VERIFICATION SUITE     ');
console.log('  Automatic Termination After Multiple Proctoring Violations    ');
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

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', err.message);
      process.exitCode = 1;
    }
  }

  // Helper to create a clean mock interview session
  async function createActiveSession(userId: string, overrides: Record<string, any> = {}) {
    if (isDbConnected) {
      const doc: any = await MockInterviewSession.create({
        userId,
        company: 'Google',
        category: 'Software Engineering',
        role: 'Full Stack Engineer',
        targetRole: 'Full Stack Engineer',
        date: new Date().toISOString().split('T')[0],
        score: 0,
        status: 'active',
        verdict: 'Pending',
        violations: [],
        deviceEvents: [],
        questionLogs: [],
        ...overrides,
      });
      return doc?._id?.toString() || '';
    } else {
      // Use in-memory fallback via start endpoint
      const res = await req('POST', '/api/interviews/start', studentA_Token, {
        companyName: 'Google',
        roleName: 'Full Stack Engineer',
      });
      return res.data?.sessionId;
    }
  }

  console.log('--- 1. Central Constant & Helper Verification ---');

  await test('MAX_PROCTORING_VIOLATIONS is centralized and equals 3', () => {
    assert.strictEqual(MAX_PROCTORING_VIOLATIONS, 3, 'MAX_PROCTORING_VIOLATIONS must equal 3');
    assert.strictEqual(MULTIPLE_VIOLATIONS_TERMINATION_REASON, 'MULTIPLE_PROCTORING_VIOLATIONS');
  });

  await test('countActualProctoringViolations correctly counts actual violations and ignores informational device events', () => {
    const mixedEvents = [
      { type: 'CONNECTED_DEVICE_DETECTED', isInformational: true },
      { type: 'CONNECTED_DEVICE_DISCONNECTED', isInformational: true },
      { type: 'EYE_CONTACT', timestamp: new Date().toISOString() },
      { type: 'CONNECTED_DEVICE_DETECTED', isInformational: true },
      { type: 'NO_FACE_DETECTED', timestamp: new Date().toISOString() },
    ];
    const actualCount = countActualProctoringViolations(mixedEvents);
    assert.strictEqual(actualCount, 2, 'Should only count actual violations (EYE_CONTACT, NO_FACE_DETECTED)');
  });

  console.log('\n--- 2. Progressive Violations (1st, 2nd, 3rd) & Automatic Termination ---');

  const session1Id = await createActiveSession(studentA_Id);

  await test('First Violation: session remains ACTIVE with count 1/3 and terminated=false', async () => {
    const res = await req('POST', `/api/interviews/${session1Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 35,
      durationMs: 3100,
    });

    assert.strictEqual(res.status, 200, 'Expected 200 on first violation');
    assert.strictEqual(res.data.status, 'active', 'Session must remain active on 1st violation');
    assert.strictEqual(res.data.terminated, false, 'terminated flag must be false');
    assert.strictEqual(res.data.actualViolationsCount, 1, 'actualViolationsCount must be 1');
    assert.strictEqual(res.data.maxViolations, 3, 'maxViolations must be 3');

    // Verify via GET session endpoint
    const getRes = await req('GET', `/api/interviews/${session1Id}`, studentA_Token);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.data.session.status, 'active');
    assert.strictEqual(getRes.data.actualViolationsCount, 1);
  });

  await test('Second Violation: session remains ACTIVE with count 2/3 and terminated=false', async () => {
    const res = await req('POST', `/api/interviews/${session1Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 28,
      durationMs: 3200,
    });

    assert.strictEqual(res.status, 200, 'Expected 200 on second violation');
    assert.strictEqual(res.data.status, 'active', 'Session must remain active on 2nd violation');
    assert.strictEqual(res.data.terminated, false, 'terminated flag must be false');
    assert.strictEqual(res.data.actualViolationsCount, 2, 'actualViolationsCount must be 2');

    const getRes = await req('GET', `/api/interviews/${session1Id}`, studentA_Token);
    assert.strictEqual(getRes.data.actualViolationsCount, 2);
    assert.strictEqual(getRes.data.session.status, 'active');
  });

  await test('Third Violation: triggers automatic TERMINATION immediately with MULTIPLE_PROCTORING_VIOLATIONS', async () => {
    const res = await req('POST', `/api/interviews/${session1Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 20,
      durationMs: 3500,
    });

    assert.strictEqual(res.status, 200, 'Expected 200 on third violation');
    assert.strictEqual(res.data.status, 'TERMINATED', 'Status must transition to TERMINATED on 3rd violation');
    assert.strictEqual(res.data.terminated, true, 'terminated must be true');
    assert.strictEqual(res.data.actualViolationsCount, 3, 'actualViolationsCount must be 3');
    assert.strictEqual(res.data.terminationReason, 'MULTIPLE_PROCTORING_VIOLATIONS');
    assert.ok(res.data.remark.includes('multiple proctoring violations'), 'Remark must explain automatic termination');

    // Verify session in DB/store has all 3 violations recorded and status=TERMINATED
    const getRes = await req('GET', `/api/interviews/${session1Id}`, studentA_Token);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.data.session.status, 'TERMINATED');
    assert.strictEqual(getRes.data.session.verdict, 'TERMINATED');
    assert.strictEqual(getRes.data.session.terminationReason, 'MULTIPLE_PROCTORING_VIOLATIONS');
    assert.strictEqual(getRes.data.actualViolationsCount, 3, 'All 3 violations must remain persisted in history');
  });

  console.log('\n--- 3. Fourth Violation / Post-Termination Safety ---');

  await test('Fourth Violation: rejected with 409, session remains TERMINATED, history not corrupted', async () => {
    const res = await req('POST', `/api/interviews/${session1Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 15,
      durationMs: 4000,
    });

    assert.strictEqual(res.status, 409, 'Expected 409 conflict when session is already terminated');
    assert.strictEqual(res.data.active, false);
    assert.strictEqual(res.data.status, 'TERMINATED');

    const getRes = await req('GET', `/api/interviews/${session1Id}`, studentA_Token);
    assert.strictEqual(getRes.data.session.status, 'TERMINATED');
    assert.strictEqual(getRes.data.actualViolationsCount, 3, 'Violation count must not exceed 3');
    assert.strictEqual(getRes.data.session.terminationReason, 'MULTIPLE_PROCTORING_VIOLATIONS');
  });

  console.log('\n--- 4. Rule 2 Preservation: Browser Connected Devices Do NOT Count ---');

  const session2Id = await createActiveSession(studentA_Id);

  await test('CONNECTED_DEVICE_DETECTED does not increment violation count (0/3 remains 0/3)', async () => {
    const res = await req('POST', `/api/interviews/${session2Id}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      api: 'webusb',
      vendorId: '0x1234',
      productId: '0x5678',
      deviceClass: 'Mass Storage',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.eventType, 'CONNECTED_DEVICE_DETECTED');
    assert.strictEqual(res.data.actualViolationsCount, 0, 'actualViolationsCount must remain 0');

    const getRes = await req('GET', `/api/interviews/${session2Id}`, studentA_Token);
    assert.strictEqual(getRes.data.actualViolationsCount, 0);
    assert.strictEqual(getRes.data.session.status, 'active');
  });

  await test('CONNECTED_DEVICE_DISCONNECTED does not increment violation count', async () => {
    const res = await req('POST', `/api/interviews/${session2Id}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DISCONNECTED',
      api: 'webusb',
      vendorId: '0x1234',
      productId: '0x5678',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.actualViolationsCount, 0, 'actualViolationsCount must still be 0');

    const getRes = await req('GET', `/api/interviews/${session2Id}`, studentA_Token);
    assert.strictEqual(getRes.data.actualViolationsCount, 0);
  });

  await test('Actual violation increments count to 1 after informational device events', async () => {
    const res = await req('POST', `/api/interviews/${session2Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 42,
      durationMs: 3100,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.actualViolationsCount, 1, 'actualViolationsCount must be 1');
    assert.strictEqual(res.data.status, 'active');
  });

  console.log('\n--- 5. Rule 1 Preservation: Tab Switch Remains Immediate ---');

  await test('Tab Switch on session with 0 violations terminates immediately without needing 3', async () => {
    const sessTab0Id = await createActiveSession(studentA_Id);
    const res = await req('POST', `/api/interviews/${sessTab0Id}/terminate`, studentA_Token);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'TERMINATED');
    assert.strictEqual(res.data.terminationReason, 'TAB_SWITCH');

    const getRes = await req('GET', `/api/interviews/${sessTab0Id}`, studentA_Token);
    assert.strictEqual(getRes.data.session.status, 'TERMINATED');
    assert.strictEqual(getRes.data.session.terminationReason, 'TAB_SWITCH');
  });

  await test('Tab Switch on session with 1 violation terminates immediately', async () => {
    const sessTab1Id = await createActiveSession(studentA_Id);
    await req('POST', `/api/interviews/${sessTab1Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3100,
    });

    const res = await req('POST', `/api/interviews/${sessTab1Id}/terminate`, studentA_Token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'TERMINATED');
    assert.strictEqual(res.data.terminationReason, 'TAB_SWITCH');
  });

  await test('Tab Switch on session with 2 violations terminates immediately', async () => {
    const sessTab2Id = await createActiveSession(studentA_Id);
    await req('POST', `/api/interviews/${sessTab2Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3100,
    });
    await req('POST', `/api/interviews/${sessTab2Id}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 38,
      durationMs: 3100,
    });

    const res = await req('POST', `/api/interviews/${sessTab2Id}/terminate`, studentA_Token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'TERMINATED');
    assert.strictEqual(res.data.terminationReason, 'TAB_SWITCH');
  });

  console.log('\n--- 6. Rule 3 Integration: Eye Contact Below 50% for 3s Counts as 1 Violation ---');

  await test('Rule 3 EyeContactTracker continuously for 3s produces ONE violation event', () => {
    const tracker = new EyeContactTracker(EYE_CONTACT_THRESHOLD, EYE_CONTACT_VIOLATION_DURATION_MS);

    const t0 = 10000;
    assert.strictEqual(tracker.processFrame(70, t0, true), null, 'Score >= 50 should not trigger violation');
    // Drops below 50% at t0 + 1000 (starts timer)
    assert.strictEqual(tracker.processFrame(45, t0 + 1000, true), null, '1 second in (initial drop) should not trigger');
    assert.strictEqual(tracker.processFrame(40, t0 + 2500, true), null, '1.5s after drop should not trigger');
    assert.strictEqual(tracker.processFrame(40, t0 + 3900, true), null, '2.9s after drop should not trigger');

    // At t0 + 4100, elapsed = 3100ms >= 3000ms
    const result = tracker.processFrame(35, t0 + 4100, true);
    assert.ok(result !== null, 'Continuous 3.1s of <50% must trigger a violation');
    assert.strictEqual(result?.type, EYE_CONTACT_VIOLATION_TYPE);
    assert.strictEqual(result?.eyeContactScore, 35);
    assert.ok(result?.durationMs >= 3000);

    // Debounce check: immediately next tick should not produce duplicate violation
    assert.strictEqual(tracker.processFrame(30, t0 + 4200, true), null, 'Subsequent frames in same violation episode must debounce');
  });

  console.log('\n--- 7. Concurrent Violations / Race Condition Protection ---');

  await test('Concurrent violation submissions: exactly 3 violations recorded, terminates safely without overrun', async () => {
    const concurrentSessionId = await createActiveSession(studentA_Id);

    // Fire 5 distinct valid violation requests simultaneously
    const promises = [
      req('POST', `/api/interviews/${concurrentSessionId}/violation`, studentA_Token, {
        type: 'EYE_CONTACT',
        eyeContactScore: 40,
        durationMs: 3100,
        id: 'req_A',
      }),
      req('POST', `/api/interviews/${concurrentSessionId}/violation`, studentA_Token, {
        type: 'EYE_CONTACT',
        eyeContactScore: 35,
        durationMs: 3200,
        id: 'req_B',
      }),
      req('POST', `/api/interviews/${concurrentSessionId}/violation`, studentA_Token, {
        type: 'EYE_CONTACT',
        eyeContactScore: 30,
        durationMs: 3300,
        id: 'req_C',
      }),
      req('POST', `/api/interviews/${concurrentSessionId}/violation`, studentA_Token, {
        type: 'EYE_CONTACT',
        eyeContactScore: 25,
        durationMs: 3400,
        id: 'req_D',
      }),
      req('POST', `/api/interviews/${concurrentSessionId}/violation`, studentA_Token, {
        type: 'EYE_CONTACT',
        eyeContactScore: 20,
        durationMs: 3500,
        id: 'req_E',
      }),
    ];

    const responses = await Promise.all(promises);

    // Inspect results
    const successful = responses.filter((r) => r.status === 200);
    const conflicts = responses.filter((r) => r.status === 409);

    assert.strictEqual(successful.length, 3, 'Exactly 3 violation requests must succeed to reach threshold');
    assert.strictEqual(conflicts.length, 2, 'Requests arriving after termination must receive 409');

    // Inspect persisted session state
    const getRes = await req('GET', `/api/interviews/${concurrentSessionId}`, studentA_Token);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.data.session.status, 'TERMINATED', 'Session must be TERMINATED');
    assert.strictEqual(getRes.data.session.verdict, 'TERMINATED');
    assert.strictEqual(getRes.data.session.terminationReason, 'MULTIPLE_PROCTORING_VIOLATIONS');
    assert.strictEqual(getRes.data.actualViolationsCount, 3, 'Count must be exactly 3, not exceeding MAX_PROCTORING_VIOLATIONS');
  });

  console.log('\n--- 8. Inactive Session Integrity (Already Terminated / Completed) ---');

  await test('Already TERMINATED session rejects late violation and does not modify termination state', async () => {
    const preTermSessionId = await createActiveSession(studentA_Id, {
      status: 'TERMINATED',
      verdict: 'TERMINATED',
      terminationReason: 'TAB_SWITCH',
      remark: 'Candidate switched tabs',
    });

    const res = await req('POST', `/api/interviews/${preTermSessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3100,
    });

    assert.strictEqual(res.status, 409, 'Must reject late violation on terminated session with 409');
    assert.strictEqual(res.data.active, false);

    const getRes = await req('GET', `/api/interviews/${preTermSessionId}`, studentA_Token);
    assert.strictEqual(getRes.data.session.status, 'TERMINATED');
    assert.strictEqual(getRes.data.session.terminationReason, 'TAB_SWITCH', 'Original termination reason must be preserved');
  });

  await test('Already COMPLETED session rejects late violation and must NOT change to TERMINATED', async () => {
    const preCompletedSessionId = await createActiveSession(studentA_Id, {
      status: 'completed',
      verdict: 'STRONG HIRE',
      feedback: 'Excellent interview performance',
    });

    const res = await req('POST', `/api/interviews/${preCompletedSessionId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 30,
      durationMs: 3100,
    });

    assert.strictEqual(res.status, 409, 'Must reject violation on completed session with 409');
    assert.strictEqual(res.data.status, 'completed');

    const getRes = await req('GET', `/api/interviews/${preCompletedSessionId}`, studentA_Token);
    assert.strictEqual(getRes.data.session.status, 'completed', 'Session must remain completed');
    assert.strictEqual(getRes.data.session.verdict, 'STRONG HIRE', 'Completed verdict must not be overwritten');
  });

  console.log('\n--- 9. Security: IDOR & Authorization Controls ---');

  await test('IDOR Protection: Student B cannot record violations on Student A session', async () => {
    const studentASessionId = await createActiveSession(studentA_Id);

    const res = await req('POST', `/api/interviews/${studentASessionId}/violation`, studentB_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 20,
      durationMs: 3500,
    });

    assert.strictEqual(res.status, 403, 'Expected 403 Forbidden for cross-student violation attempt');

    // Confirm session A violation count is still 0
    const getRes = await req('GET', `/api/interviews/${studentASessionId}`, studentA_Token);
    assert.strictEqual(getRes.data.actualViolationsCount, 0);
  });

  await test('Role authorization: Recruiter/Industry cannot record proctoring violations (403)', async () => {
    const sessId = await createActiveSession(studentA_Id);

    const res = await req('POST', `/api/interviews/${sessId}/violation`, recruiterToken, {
      type: 'EYE_CONTACT',
      eyeContactScore: 30,
      durationMs: 3200,
    });

    assert.strictEqual(res.status, 403, 'Industry role cannot submit candidate proctoring violations');
  });

  await test('Unauthenticated request rejected with 401', async () => {
    const sessId = await createActiveSession(studentA_Id);
    const res = await req('POST', `/api/interviews/${sessId}/violation`, undefined, {
      type: 'EYE_CONTACT',
      eyeContactScore: 30,
      durationMs: 3200,
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated request must return 401');
  });

  await test('Invalid session ID rejected with 400', async () => {
    const res = await req('POST', '/api/interviews/invalid-id-xyz/violation', studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 30,
      durationMs: 3200,
    });
    assert.strictEqual(res.status, 400, 'Invalid session ID format must return 400');
  });

  console.log('\n--- 10. Idempotent Termination Verification ---');

  await test('Idempotent repeated termination and violation requests preserve final state', async () => {
    const sessId = await createActiveSession(studentA_Id);

    // Trigger 3 violations to terminate
    await req('POST', `/api/interviews/${sessId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 40,
      durationMs: 3100,
    });
    await req('POST', `/api/interviews/${sessId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 35,
      durationMs: 3100,
    });
    await req('POST', `/api/interviews/${sessId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 30,
      durationMs: 3100,
    });

    // Repeat termination call
    const termRepeatRes = await req('POST', `/api/interviews/${sessId}/terminate`, studentA_Token);
    assert.strictEqual(termRepeatRes.status, 200);
    assert.strictEqual(termRepeatRes.data.status, 'TERMINATED');
    assert.strictEqual(termRepeatRes.data.terminationReason, 'MULTIPLE_PROCTORING_VIOLATIONS', 'Must preserve original reason');

    // Repeat violation call
    const violRepeatRes = await req('POST', `/api/interviews/${sessId}/violation`, studentA_Token, {
      type: 'EYE_CONTACT',
      eyeContactScore: 25,
      durationMs: 3100,
    });
    assert.strictEqual(violRepeatRes.status, 409);

    // Final inspection
    const getRes = await req('GET', `/api/interviews/${sessId}`, studentA_Token);
    assert.strictEqual(getRes.data.session.status, 'TERMINATED');
    assert.strictEqual(getRes.data.session.terminationReason, 'MULTIPLE_PROCTORING_VIOLATIONS');
    assert.strictEqual(getRes.data.actualViolationsCount, 3);
  });

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passed} / ${total} tests passed`);
  console.log('================================================================\n');

  server.close();
  if (isDbConnected) {
    await mongoose.disconnect();
  }

  if (passed === total) {
    console.log('ALL TESTS PASSED SUCCESSFULLY! Rule 4 verification complete.\n');
    process.exit(0);
  } else {
    console.error(`FAILED: ${total - passed} test(s) failed.\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
