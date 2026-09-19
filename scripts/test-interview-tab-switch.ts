import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { interviewsRouter } from '../routes/interviews';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { connectDB } from '../src/db/db';

console.log('====================================================');
console.log('  AI MOCK INTERVIEW: RULE 1 TAB SWITCH TEST SUITE   ');
console.log('====================================================\n');

async function runTests() {
  await connectDB();
  const isDbConnected = mongoose.connection.readyState === 1;
  console.log(`[DB Status] Connected: ${isDbConnected}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos-32characters!';
  process.env.JWT_SECRET = JWT_SECRET;
  // Use instant fallback logic for interview answers/feedback during tests
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
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  [PASS] Test ${total}: ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  [FAIL] Test ${total}: ${name}`);
        console.error(err);
        process.exitCode = 1;
      });
  }

  console.log('--- Test Group: Tab Switch Termination & Lifecycle ---\n');

  let activeSessionId: string = '';

  // 1. Active student starts interview and switches tab -> session terminated
  await test('Active student switches tab -> session terminated with status TERMINATED', async () => {
    const startRes = await req('POST', '/api/interviews/start', studentA_Token, {
      company: 'Google',
      role: 'Frontend Engineer',
      category: 'System Design',
    });
    assert.strictEqual(startRes.status, 201, 'Start interview should succeed with 201');
    assert.ok(startRes.data.sessionId || startRes.data._id, 'Should return sessionId');
    activeSessionId = startRes.data.sessionId || startRes.data._id;

    // Simulate tab switch termination
    const termRes = await req('POST', `/api/interviews/${activeSessionId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
      remark: 'Cheating detected: Candidate attempted to switch tabs or leave the interview.',
    });
    assert.strictEqual(termRes.status, 200, 'Terminate should succeed with 200');
    assert.strictEqual(termRes.data.status, 'TERMINATED', 'Status should be TERMINATED');
    assert.strictEqual(termRes.data.verdict, 'TERMINATED', 'Verdict should be TERMINATED');
  });

  // 2. Termination reason is TAB_SWITCH
  await test('Termination reason is TAB_SWITCH', async () => {
    const fetchRes = await req('GET', `/api/interviews/${activeSessionId}`, studentA_Token);
    assert.strictEqual(fetchRes.status, 200, 'Fetching terminated session should return 200');
    assert.strictEqual(fetchRes.data.session.terminationReason, 'TAB_SWITCH', 'terminationReason must be TAB_SWITCH');
  });

  // 3. Remark is persisted correctly in database
  await test('Remark is persisted correctly in database', async () => {
    const fetchRes = await req('GET', `/api/interviews/${activeSessionId}`, studentA_Token);
    assert.strictEqual(fetchRes.status, 200);
    const expectedRemark = 'Cheating detected: Candidate attempted to switch tabs or leave the interview.';
    assert.strictEqual(fetchRes.data.session.remark, expectedRemark, 'Remark must match specified message');
    assert.strictEqual(fetchRes.data.session.reviewNote, expectedRemark, 'ReviewNote must be updated');
    assert.strictEqual(fetchRes.data.session.flaggedForReview, true, 'flaggedForReview must be true');
    assert.ok(Array.isArray(fetchRes.data.session.violations), 'Violations must be an array');
    const tabSwitchViolations = fetchRes.data.session.violations.filter((v: any) => v.type === 'TAB_SWITCH');
    assert.strictEqual(tabSwitchViolations.length, 1, 'Should record exactly one TAB_SWITCH violation');
    assert.strictEqual(tabSwitchViolations[0].details, expectedRemark);
  });

  // 4. Student cannot continue after termination
  await test('Student cannot continue interview or submit answers after termination', async () => {
    const answerRes = await req('POST', `/api/interviews/${activeSessionId}/answer`, studentA_Token, {
      question: 'Explain React reconciliation',
      answer: 'React uses a virtual DOM diffing algorithm.',
    });
    assert.strictEqual(answerRes.status, 403, 'Submitting answer after termination must be rejected with 403');
    assert.strictEqual(answerRes.data.terminated, true, 'Response must indicate session is terminated');

    // Attempting to complete the terminated session must also be rejected
    const completeRes = await req('POST', `/api/interviews/${activeSessionId}/complete`, studentA_Token, {
      violations: [],
      questionLogs: [],
    });
    assert.strictEqual(completeRes.status, 403, 'Completing terminated session must be rejected with 403');
    assert.strictEqual(completeRes.data.terminated, true, 'Response must indicate termination');
  });

  // 5. Unauthenticated termination request -> rejected
  await test('Unauthenticated termination request -> rejected (401 or 403)', async () => {
    const unauthRes = await req('POST', `/api/interviews/${activeSessionId}/terminate`, undefined, {
      reason: 'TAB_SWITCH',
    });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');

    const nonStudentRes = await req('POST', `/api/interviews/${activeSessionId}/terminate`, recruiterToken, {
      reason: 'TAB_SWITCH',
    });
    assert.strictEqual(nonStudentRes.status, 403, 'Non-student request must return 403');
  });

  // 6. Student cannot terminate another student's session (IDOR protection)
  await test("Student cannot terminate another student's session (IDOR protection)", async () => {
    // Student B creates an active session
    const startResB = await req('POST', '/api/interviews/start', studentB_Token, {
      company: 'Amazon',
      role: 'Backend Engineer',
      category: 'Distributed Systems',
    });
    assert.strictEqual(startResB.status, 201);
    const sessionBId = startResB.data.sessionId || startResB.data._id;

    // Student A tries to terminate Student B's session
    const hackRes = await req('POST', `/api/interviews/${sessionBId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
    });
    assert.strictEqual(hackRes.status, 403, "Tampering with another student's session must return 403");

    // Verify Student B's session remains active
    const verifyRes = await req('GET', `/api/interviews/${sessionBId}`, studentB_Token);
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.session.status, 'active', "Student B's session must remain active");
    assert.strictEqual(verifyRes.data.session.verdict, 'Pending', "Student B's verdict must remain Pending");
  });

  // 7. Invalid session ID -> rejected safely
  await test('Invalid session ID -> rejected safely (400 or 404)', async () => {
    const invalidIdRes = await req('POST', '/api/interviews/invalid_non_mongo_id/terminate', studentA_Token, {
      reason: 'TAB_SWITCH',
    });
    assert.strictEqual(invalidIdRes.status, 400, 'Invalid format ID must return 400');

    const notFoundMongoId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await req('POST', `/api/interviews/${notFoundMongoId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
    });
    assert.strictEqual(notFoundRes.status, 404, 'Non-existent session must return 404');
  });

  // 8. Already completed interview -> not overwritten
  await test('Already completed interview -> not overwritten by termination', async () => {
    // Student A starts a session to complete
    const startRes = await req('POST', '/api/interviews/start', studentA_Token, {
      company: 'Microsoft',
      role: 'Cloud Architect',
      category: 'Azure Cloud',
    });
    assert.strictEqual(startRes.status, 201);
    const completedSessionId = startRes.data.sessionId || startRes.data._id;

    // Complete the session normally
    const completeRes = await req('POST', `/api/interviews/${completedSessionId}/complete`, studentA_Token, {
      violations: [],
      questionLogs: [
        {
          question: 'What is Azure Blob Storage?',
          answer: 'Scalable object storage for cloud workloads.',
          techScore: 90,
          commScore: 88,
          confidenceScore: 85,
        },
      ],
      realtimePostureScore: 92,
      realtimeEyeContactScore: 90,
    });
    assert.strictEqual(completeRes.status, 200, 'Interview completion must succeed');
    const originalVerdict = completeRes.data.verdict;
    const originalScore = completeRes.data.overallScore;

    // Now attempt to terminate this completed session
    const termAttemptRes = await req('POST', `/api/interviews/${completedSessionId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
    });
    assert.strictEqual(termAttemptRes.status, 409, 'Terminating an already completed session must return 409 Conflict');

    // Confirm that session in DB preserves original score and verdict
    const verifyRes = await req('GET', `/api/interviews/${completedSessionId}`, studentA_Token);
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.session.status, 'completed', 'Status must remain completed');
    assert.strictEqual(verifyRes.data.session.verdict, originalVerdict, 'Verdict must not be altered');
    assert.strictEqual(verifyRes.data.session.score, originalScore, 'Score must not be overwritten');
  });

  // 9. Already terminated interview -> remains unchanged/idempotent
  await test('Already terminated interview -> remains unchanged and idempotent', async () => {
    const repeatTermRes = await req('POST', `/api/interviews/${activeSessionId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
    });
    assert.strictEqual(repeatTermRes.status, 200, 'Idempotent call should return 200');
    assert.strictEqual(repeatTermRes.data.alreadyTerminated, true, 'alreadyTerminated flag should be true');
    assert.strictEqual(repeatTermRes.data.status, 'TERMINATED');
  });

  // 10. Repeated tab-switch events -> only one termination result and single violation entry
  await test('Repeated tab-switch events -> exactly one TAB_SWITCH violation entry', async () => {
    // Fire 3 simultaneous or sequential terminate requests
    await Promise.all([
      req('POST', `/api/interviews/${activeSessionId}/terminate`, studentA_Token, { reason: 'TAB_SWITCH' }),
      req('POST', `/api/interviews/${activeSessionId}/terminate`, studentA_Token, { reason: 'TAB_SWITCH' }),
      req('POST', `/api/interviews/${activeSessionId}/terminate`, studentA_Token, { reason: 'TAB_SWITCH' }),
    ]);

    const fetchRes = await req('GET', `/api/interviews/${activeSessionId}`, studentA_Token);
    assert.strictEqual(fetchRes.status, 200);
    const tabViolations = fetchRes.data.session.violations.filter((v: any) => v.type === 'TAB_SWITCH');
    assert.strictEqual(tabViolations.length, 1, 'There must only be 1 TAB_SWITCH violation record despite multiple events');
  });

  // 11. Internal interview interactions -> do not terminate
  await test('Internal interview interactions do not terminate session', async () => {
    const startRes = await req('POST', '/api/interviews/start', studentA_Token, {
      company: 'Netflix',
      role: 'Senior Systems Engineer',
      category: 'Concurrency',
    });
    assert.strictEqual(startRes.status, 201);
    const normalSessionId = startRes.data.sessionId || startRes.data._id;

    // Normal internal interaction: answering a question
    const answerRes = await req('POST', `/api/interviews/${normalSessionId}/answer`, studentA_Token, {
      question: 'How does Netflix achieve zero-downtime deployments?',
      answer: 'Using Spinnaker, blue-green deployment pipelines, and Chaos Monkey.',
    });
    assert.strictEqual(answerRes.status, 200, 'Normal answer should succeed');

    const checkRes = await req('GET', `/api/interviews/${normalSessionId}`, studentA_Token);
    assert.strictEqual(checkRes.status, 200);
    assert.strictEqual(checkRes.data.session.status, 'active', 'Session must remain active during normal interactions');
    assert.strictEqual(checkRes.data.session.verdict, 'Pending', 'Verdict must remain Pending');
  });

  // 12. Returning to the tab after termination -> interview remains terminated
  await test('Returning to the tab after termination -> interview remains permanently terminated', async () => {
    const listRes = await req('GET', '/api/interviews/sessions', studentA_Token);
    assert.strictEqual(listRes.status, 200);
    const foundTerminated = listRes.data.sessions.find((s: any) => String(s.id) === String(activeSessionId));
    assert.ok(foundTerminated, 'Terminated session must be present in student session history');
    assert.strictEqual(foundTerminated.status, 'TERMINATED', 'Status in history must be TERMINATED');
    assert.strictEqual(foundTerminated.verdict, 'TERMINATED', 'Verdict in history must be TERMINATED');
    assert.strictEqual(foundTerminated.terminationReason, 'TAB_SWITCH', 'terminationReason must be TAB_SWITCH');
  });

  // 13. Client code inspection: keepalive: true and unload listeners configured
  await test('Client code inspection: keepalive: true and page unload listeners are active', async () => {
    const fs = await import('fs');
    const clientCode = fs.readFileSync('src/components/dashboards/AiMockInterviewSimulator.tsx', 'utf-8');
    assert.ok(
      clientCode.includes('keepalive: true'),
      'AiMockInterviewSimulator must configure keepalive: true on termination fetch'
    );
    assert.ok(
      clientCode.includes("'beforeunload'"),
      'AiMockInterviewSimulator must listen to beforeunload event for page refresh'
    );
    assert.ok(
      clientCode.includes("'pagehide'"),
      'AiMockInterviewSimulator must listen to pagehide event for unload'
    );
    assert.ok(
      clientCode.includes("'visibilitychange'"),
      'AiMockInterviewSimulator must listen to visibilitychange event for tab switch'
    );
  });

  // 14. Simulated page refresh / unload termination delivers TAB_SWITCH and remark
  await test('Simulated page refresh / unload termination delivers TAB_SWITCH and remark', async () => {
    const startRes = await req('POST', '/api/interviews/start', studentA_Token, {
      company: 'Apple',
      role: 'CoreOS Engineer',
      category: 'Operating Systems',
    });
    assert.strictEqual(startRes.status, 201);
    const refreshSessionId = startRes.data.sessionId || startRes.data._id;

    // Simulate page refresh triggering unload-safe keepalive fetch
    const refreshTermRes = await req('POST', `/api/interviews/${refreshSessionId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
      remark: 'Cheating detected: Candidate attempted to switch tabs or leave the interview.',
    });
    assert.strictEqual(refreshTermRes.status, 200);
    assert.strictEqual(refreshTermRes.data.status, 'TERMINATED');
    assert.strictEqual(refreshTermRes.data.terminationReason, 'TAB_SWITCH');
    assert.strictEqual(
      refreshTermRes.data.remark,
      'Cheating detected: Candidate attempted to switch tabs or leave the interview.'
    );

    // Verify persisted session in DB
    const checkDbRes = await req('GET', `/api/interviews/${refreshSessionId}`, studentA_Token);
    assert.strictEqual(checkDbRes.status, 200);
    assert.strictEqual(checkDbRes.data.session.status, 'TERMINATED');
    assert.strictEqual(checkDbRes.data.session.verdict, 'TERMINATED');
    assert.strictEqual(checkDbRes.data.session.terminationReason, 'TAB_SWITCH');
    assert.strictEqual(
      checkDbRes.data.session.remark,
      'Cheating detected: Candidate attempted to switch tabs or leave the interview.'
    );
  });

  // 15. Student reloading page cannot resume or submit answers to the terminated session
  await test('Student reloading page cannot resume or submit answers to the terminated session', async () => {
    // Attempt to resume/answer the terminated session after reload
    const tryResumeRes = await req('POST', `/api/interviews/${activeSessionId}/answer`, studentA_Token, {
      question: 'Can I resume my interview after refreshing?',
      answer: 'Attempting to resume...',
    });
    assert.strictEqual(tryResumeRes.status, 403);
    assert.strictEqual(tryResumeRes.data.terminated, true);

    const tryCompleteRes = await req('POST', `/api/interviews/${activeSessionId}/complete`, studentA_Token, {
      violations: [],
      questionLogs: [],
    });
    assert.strictEqual(tryCompleteRes.status, 403);
    assert.strictEqual(tryCompleteRes.data.terminated, true);
  });

  // 16. Security requirement: Query parameter tokens are rejected (no credential leakage)
  await test('Security requirement: Query parameter token is rejected to prevent credential leakage', async () => {
    const leakAttemptRes = await fetch(`${baseUrl}/api/interviews/${activeSessionId}/terminate?token=${studentA_Token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'TAB_SWITCH' }),
    });
    assert.strictEqual(leakAttemptRes.status, 401, 'Query param tokens must be rejected');
  });

  server.close();
  console.log(`\n====================================================`);
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED SUCCESSFULLY `);
  console.log(`====================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
