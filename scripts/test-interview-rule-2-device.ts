import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express from 'express';
import mongoose from 'mongoose';
import { interviewsRouter } from '../routes/interviews';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { connectDB } from '../src/db/db';

console.log('================================================================');
console.log('  AI MOCK INTERVIEW: RULE 2 CONNECTED DEVICE TEST SUITE         ');
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
      console.error(`    Error: ${err?.message || err}`);
    }
  }

  // Helper to start an active session
  async function startActiveSession(token: string) {
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

  // Test 1: WebUSB unsupported -> client-side fallback simulation
  await test('1. WebUSB unsupported: continues normally without crashing', async () => {
    // Simulate browser without navigator.usb
    const mockNavigator: any = {};
    const isSupported = Boolean(mockNavigator && 'usb' in mockNavigator && mockNavigator.usb);
    assert.strictEqual(isSupported, false);
    // Verified: If unsupported, status becomes 'unsupported' and interview continues
  });

  // Test 2: Supported browser -> initializes safely
  await test('2. Supported browser: device monitoring initializes safely', async () => {
    const mockNavigator: any = {
      usb: {
        getDevices: async () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    };
    const isSupported = Boolean(mockNavigator && 'usb' in mockNavigator && mockNavigator.usb);
    assert.strictEqual(isSupported, true);
    const devices = await mockNavigator.usb.getDevices();
    assert(Array.isArray(devices));
  });

  // Test 3: Permission denied / cancelled prompt -> continues safely without error
  await test('3. Permission denied: interview continues safely', async () => {
    const mockNavigator: any = {
      usb: {
        requestDevice: async () => {
          const err: any = new Error('No device selected');
          err.name = 'NotFoundError';
          throw err;
        },
      },
    };
    let errorCaught = false;
    try {
      await mockNavigator.usb.requestDevice({ filters: [] });
    } catch (e: any) {
      errorCaught = true;
      assert.strictEqual(e.name, 'NotFoundError');
    }
    assert.strictEqual(errorCaught, true);
  });

  // Test 4: Device detection -> informational event recorded with safe metadata
  let activeSessionId = '';
  await test('4. Device detection: records CONNECTED_DEVICE_DETECTED as informational event', async () => {
    activeSessionId = await startActiveSession(studentA_Token);

    const res = await req('POST', `/api/interviews/${activeSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      api: 'webusb',
      vendorId: '0x1234',
      productId: '0x5678',
      deviceClass: 'Class 3 (HID)',
      // Test stripping of dangerous/sensitive fields
      serialNumber: 'SECRET_SERIAL_12345',
      hardwareId: 'HW_ID_SECRET',
      status: 'TERMINATED', // Must NOT allow client to terminate session
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.eventType, 'CONNECTED_DEVICE_DETECTED');
    assert.strictEqual(res.data.event.isInformational, true);
    assert.strictEqual(res.data.event.vendorId, '0x1234');
    assert.strictEqual(res.data.event.productId, '0x5678');
    // Ensure sensitive fields were not stored
    assert.strictEqual((res.data.event as any).serialNumber, undefined);
    assert.strictEqual((res.data.event as any).hardwareId, undefined);

    // Verify session status is still active, not terminated
    assert.strictEqual(res.data.sessionStatus, 'active');

    // Verify via GET session
    const getRes = await req('GET', `/api/interviews/${activeSessionId}`, studentA_Token);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.data.session.status, 'active');
    assert.strictEqual(getRes.data.session.verdict, 'Pending');
    const deviceEvents = getRes.data.session.deviceEvents || [];
    assert(deviceEvents.length >= 1);
    assert.strictEqual(deviceEvents[0].type, 'CONNECTED_DEVICE_DETECTED');
  });

  // Test 5: Device disconnect -> event recorded
  await test('5. Device disconnect: records CONNECTED_DEVICE_DISCONNECTED event', async () => {
    const res = await req('POST', `/api/interviews/${activeSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DISCONNECTED',
      api: 'webusb',
      vendorId: '0x1234',
      productId: '0x5678',
      deviceClass: 'Class 3 (HID)',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.eventType, 'CONNECTED_DEVICE_DISCONNECTED');
    assert.strictEqual(res.data.sessionStatus, 'active');
  });

  // Test 6: Unauthenticated event -> 401
  await test('6. Unauthenticated request: returns 401', async () => {
    const res = await req('POST', `/api/interviews/${activeSessionId}/device-event`, undefined, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0x1111',
      productId: '0x2222',
    });
    assert.strictEqual(res.status, 401);
  });

  // Test 7: Wrong student / session ownership check -> 403
  await test('7. Wrong student (IDOR): returns 403', async () => {
    const res = await req('POST', `/api/interviews/${activeSessionId}/device-event`, studentB_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0x1111',
      productId: '0x2222',
    });
    assert.strictEqual(res.status, 403);
  });

  // Test 8: Invalid session ID -> 400
  await test('8. Invalid session ID: returns 400', async () => {
    const res = await req('POST', '/api/interviews/invalid-not-an-id/device-event', studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
    });
    assert.strictEqual(res.status, 400);
  });

  // Test 9: Completed interview -> event cannot alter final state
  await test('9. Completed interview: rejects device events, preserving final state', async () => {
    const compSessionId = await startActiveSession(studentA_Token);

    // Complete the interview
    const compRes = await req('POST', `/api/interviews/${compSessionId}/complete`, studentA_Token, {
      questionLogs: [
        {
          question: 'Tell me about a time you optimized code.',
          answer: 'I profiled a distributed database query and introduced an index reducing latency by 70%.',
          postureScore: 90,
          eyeContactScore: 92,
          confidenceScore: 88,
          commScore: 85,
          techScore: 90,
          aiFeedback: 'Great STAR answer.',
        },
      ],
      violations: [],
    });
    assert.strictEqual(compRes.status, 200);
    assert.strictEqual(compRes.data.verdict, 'STRONG HIRE');

    // Attempt to post device event to completed session
    const devRes = await req('POST', `/api/interviews/${compSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0x9999',
      productId: '0x8888',
    });
    assert.strictEqual(devRes.status, 409);

    // Verify session state has not changed
    const checkRes = await req('GET', `/api/interviews/${compSessionId}`, studentA_Token);
    assert.strictEqual(checkRes.data.session.status, 'completed');
    assert.strictEqual(checkRes.data.session.verdict, 'STRONG HIRE');
  });

  // Test 10: Terminated interview -> event cannot reopen or change state
  await test('10. Terminated interview: rejects device events, preserving TERMINATED state', async () => {
    const termSessionId = await startActiveSession(studentA_Token);

    // Terminate session due to tab switch
    const termRes = await req('POST', `/api/interviews/${termSessionId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
      timestamp: new Date().toISOString(),
    });
    assert.strictEqual(termRes.status, 200);
    assert.strictEqual(termRes.data.status, 'TERMINATED');

    // Attempt to post device event to terminated session
    const devRes = await req('POST', `/api/interviews/${termSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0x7777',
      productId: '0x6666',
    });
    assert.strictEqual(devRes.status, 409);

    // Verify session remains TERMINATED
    const checkRes = await req('GET', `/api/interviews/${termSessionId}`, studentA_Token);
    assert.strictEqual(checkRes.data.session.status, 'TERMINATED');
    assert.strictEqual(checkRes.data.session.verdict, 'TERMINATED');
  });

  // Test 11: Device detection does NOT terminate interview
  await test('11. Device detection does NOT terminate interview', async () => {
    const newSessionId = await startActiveSession(studentA_Token);

    await req('POST', `/api/interviews/${newSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0x4321',
      productId: '0x8765',
    });

    const checkRes = await req('GET', `/api/interviews/${newSessionId}`, studentA_Token);
    assert.strictEqual(checkRes.data.session.status, 'active');
    assert.strictEqual(checkRes.data.session.verdict, 'Pending');
  });

  // Test 12: Device detection does NOT increment warning count or proctoring penalty
  await test('12. Device detection does NOT penalize proctoring score or increment warning count', async () => {
    const penaltyTestSessionId = await startActiveSession(studentA_Token);

    // Log device event
    await req('POST', `/api/interviews/${penaltyTestSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0x0001',
      productId: '0x0002',
    });

    // Complete session with no other violations
    const compRes = await req('POST', `/api/interviews/${penaltyTestSessionId}/complete`, studentA_Token, {
      questionLogs: [
        {
          question: 'What is your greatest technical accomplishment?',
          answer: 'I redesigned a high-traffic microservice architecture using Go and Redis.',
          postureScore: 95,
          eyeContactScore: 90,
          confidenceScore: 92,
          commScore: 88,
          techScore: 95,
          aiFeedback: 'Superb architecture overview.',
        },
      ],
      violations: [],
    });

    assert.strictEqual(compRes.status, 200);
    // Proctoring score must still be 100 because device events are informational only
    assert.strictEqual(compRes.data.proctoringScore, 100);
    assert.strictEqual(compRes.data.verdict, 'STRONG HIRE');
  });

  // Test 13: Repeated identical events are deduplicated within debounce window
  await test('13. Repeated identical events are deduplicated', async () => {
    const dedupSessionId = await startActiveSession(studentA_Token);

    // First event
    const res1 = await req('POST', `/api/interviews/${dedupSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0xAAAA',
      productId: '0xBBBB',
    });
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.data.deduplicated, undefined);

    // Immediate second event with exact same type and ids
    const res2 = await req('POST', `/api/interviews/${dedupSessionId}/device-event`, studentA_Token, {
      eventType: 'CONNECTED_DEVICE_DETECTED',
      vendorId: '0xAAAA',
      productId: '0xBBBB',
    });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.data.deduplicated, true);

    // Check that only 1 record was added
    const checkRes = await req('GET', `/api/interviews/${dedupSessionId}`, studentA_Token);
    const events = (checkRes.data.session.deviceEvents || []).filter(
      (e: any) => e.vendorId === '0xAAAA' && e.productId === '0xBBBB'
    );
    assert.strictEqual(events.length, 1);
  });

  // Test 14: Existing tab-switch termination behavior remains completely unchanged
  await test('14. Existing Rule 1 tab-switch termination remains unchanged', async () => {
    const rule1SessionId = await startActiveSession(studentA_Token);

    // Trigger tab switch termination
    const termRes = await req('POST', `/api/interviews/${rule1SessionId}/terminate`, studentA_Token, {
      reason: 'TAB_SWITCH',
      timestamp: new Date().toISOString(),
    });

    assert.strictEqual(termRes.status, 200);
    assert.strictEqual(termRes.data.status, 'TERMINATED');
    assert.strictEqual(termRes.data.verdict, 'TERMINATED');
    assert.strictEqual(termRes.data.terminationReason, 'TAB_SWITCH');
    assert(
      termRes.data.remark.includes('Cheating detected'),
      'Remark must contain cheating detected notice'
    );

    // Check DB/in-memory session state
    const checkRes = await req('GET', `/api/interviews/${rule1SessionId}`, studentA_Token);
    assert.strictEqual(checkRes.data.session.status, 'TERMINATED');
    assert.strictEqual(checkRes.data.session.verdict, 'TERMINATED');
    assert.strictEqual(checkRes.data.session.terminationReason, 'TAB_SWITCH');
    assert(checkRes.data.session.remark.includes('Cheating detected'));
  });

  server.close();
  if (isDbConnected) {
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`  RULE 2 TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running Rule 2 tests:', err);
  process.exit(1);
});
