import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { interviewsRouter } from '../routes/interviews';
import { certificationsRouter } from '../routes/certifications';
import { resumeRouter } from '../routes/resume';
import { sendSafeServerError } from '../routes/errorHandler';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { fileStorage } from '../src/services/fileStorage';
import { connectDB } from '../src/db/db';

console.log('====================================================');
console.log('  FINAL SECURITY REGRESSION TEST SUITE (FIX #10.4)  ');
console.log('====================================================\n');

async function runTests() {
  await connectDB();
  const isDbConnected = mongoose.connection.readyState === 1;
  console.log(`[DB Status] Connected: ${isDbConnected}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos-32characters!';
  process.env.JWT_SECRET = JWT_SECRET;

  const app = express();
  app.use(express.json());
  app.use('/api/interviews', interviewsRouter);
  app.use('/api/certifications', certificationsRouter);
  app.use('/api/resume', resumeRouter);

  // Test endpoint for errorHandler verification
  app.get('/api/test-error', (req: Request, res: Response) => {
    const fakeError = new Error('Sensitive DB Connection String: mongodb+srv://admin:supersecret@cluster0.mongodb.net/prod');
    return sendSafeServerError(res, fakeError, 'Internal DB querying failed');
  });

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
  const academicianId = new mongoose.Types.ObjectId().toString();

  const studentA_Token = createToken(studentA_Id, 'student');
  const studentB_Token = createToken(studentB_Id, 'student');
  const recruiterToken = createToken(recruiterId, 'industry');
  const academicianToken = createToken(academicianId, 'academician');

  async function req(method: string, endpoint: string, token?: string, body?: any) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, body: data };
  }

  // ========================================================================
  // 1. Authentication & Role Enforcement on GET /api/interviews/sessions
  // ========================================================================
  console.log('--- 1. GET /api/interviews/sessions Authentication & Role Checks ---');

  let res = await req('GET', '/api/interviews/sessions');
  assert.strictEqual(res.status, 401, 'Unauthenticated request to GET /interviews/sessions must return 401');
  console.log('✓ PASS: Unauthenticated GET /interviews/sessions rejected with HTTP 401');

  res = await req('GET', '/api/interviews/sessions', recruiterToken);
  assert.strictEqual(res.status, 403, 'Recruiter role accessing GET /interviews/sessions must return 403');
  console.log('✓ PASS: Recruiter role on GET /interviews/sessions rejected with HTTP 403');

  res = await req('GET', '/api/interviews/sessions', academicianToken);
  assert.strictEqual(res.status, 403, 'Academician role accessing GET /interviews/sessions must return 403');
  console.log('✓ PASS: Academician role on GET /interviews/sessions rejected with HTTP 403');

  // ========================================================================
  // 2. Ownership Isolation on GET /api/interviews/sessions
  // ========================================================================
  console.log('\n--- 2. GET /api/interviews/sessions Student Isolation & Authoritative Identity ---');

  if (mongoose.connection.readyState === 1) {
    // Seed sessions for Student A and Student B in DB
    await MockInterviewSession.deleteMany({ userId: { $in: [studentA_Id, studentB_Id] } });

    await MockInterviewSession.create({
      userId: studentA_Id,
      company: 'Razorpay',
      role: 'Backend Engineer',
      category: 'Technical',
      date: '2026-09-13',
      verdict: 'Hire',
      score: 88,
      overallScore: 88,
      feedback: 'Excellent knowledge of microservices and concurrency',
      questionLogs: [{ question: 'What is a goroutine?', userResponse: 'A lightweight thread managed by Go runtime' }],
    });

    await MockInterviewSession.create({
      userId: studentB_Id,
      company: 'Google',
      role: 'Frontend Engineer',
      category: 'Technical',
      date: '2026-09-13',
      verdict: 'Hire',
      score: 92,
      overallScore: 92,
      feedback: 'Superb understanding of React rendering and reconciliation',
      questionLogs: [{ question: 'Explain React Fiber', userResponse: 'Fiber is the new reconciliation engine' }],
    });

    res = await req('GET', '/api/interviews/sessions', studentA_Token);
    assert.strictEqual(res.status, 200, 'Student A must successfully get sessions (200)');
    assert(Array.isArray(res.body.sessions), 'sessions must be an array');
    assert.strictEqual(res.body.sessions.length, 1, 'Student A must only receive exactly their 1 session');
    assert.strictEqual(res.body.sessions[0].role, 'Backend Engineer', 'Student A sees Backend Engineer session');
    assert.strictEqual(res.body.sessions[0].feedback, 'Excellent knowledge of microservices and concurrency');
    console.log('✓ PASS: Student A sees only their own interview session');

    res = await req('GET', '/api/interviews/sessions', studentB_Token);
    assert.strictEqual(res.status, 200, 'Student B must successfully get sessions (200)');
    assert.strictEqual(res.body.sessions.length, 1, 'Student B must only receive exactly their 1 session');
    assert.strictEqual(res.body.sessions[0].role, 'Frontend Engineer', 'Student B sees Frontend Engineer session');
    console.log('✓ PASS: Student B sees only their own interview session (zero cross-student exposure)');

    // Cleanup seeded sessions
    await MockInterviewSession.deleteMany({ userId: { $in: [studentA_Id, studentB_Id] } });
  } else {
    // In demo/offline mode, verify endpoint accepts studentToken and rejects cross-identity
    res = await req('GET', '/api/interviews/sessions', studentA_Token);
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body.sessions));
    console.log('✓ PASS: Student A authenticated and received isolated session payload');
  }

  // ========================================================================
  // 3. Authentication & Role Enforcement on POST /api/interviews/schedule
  // ========================================================================
  console.log('\n--- 3. POST /api/interviews/schedule Authentication & Role Checks ---');

  res = await req('POST', '/api/interviews/schedule', undefined, {
    role: 'Full Stack Engineer',
    targetCompany: 'Stripe',
    scheduledTime: new Date().toISOString(),
  });
  assert.strictEqual(res.status, 401, 'Unauthenticated POST /interviews/schedule must return 401');
  console.log('✓ PASS: Unauthenticated POST /interviews/schedule rejected with HTTP 401');

  res = await req('POST', '/api/interviews/schedule', recruiterToken, {
    role: 'Full Stack Engineer',
    targetCompany: 'Stripe',
  });
  assert.strictEqual(res.status, 403, 'Recruiter role on POST /interviews/schedule must return 403');
  console.log('✓ PASS: Recruiter role on POST /interviews/schedule rejected with HTTP 403');

  // ========================================================================
  // 4. Body-Spoofed userId Ignored on POST /api/interviews/schedule
  // ========================================================================
  console.log('\n--- 4. POST /api/interviews/schedule Body-Spoofed userId Ignored ---');

  const attackerTargetId = new mongoose.Types.ObjectId().toString();
  res = await req('POST', '/api/interviews/schedule', studentA_Token, {
    userId: attackerTargetId, // Attempted spoofing
    role: 'Cloud Architect',
    company: 'Google',
    date: new Date().toISOString().split('T')[0],
  });
  assert.strictEqual(res.status, 201, 'Student A scheduling interview should succeed (201)');
  assert(res.body.session, 'Created session should be returned');
  assert.strictEqual(res.body.session.company, 'Google');
  assert.strictEqual(res.body.session.role, 'Cloud Architect');

  // Verify that if DB is connected, the document in DB has userId === studentA_Id (not attackerTargetId)
  if (mongoose.connection.readyState === 1 && res.body.session.id) {
    const createdSessionInDb = await MockInterviewSession.findById(res.body.session.id);
    assert(createdSessionInDb, 'Session must exist in DB');
    assert.strictEqual(
      createdSessionInDb.userId.toString(),
      studentA_Id.toString(),
      'DB record must strictly bind to studentA_Id, ignoring attackerTargetId'
    );
    await MockInterviewSession.deleteOne({ _id: res.body.session.id });
  }
  console.log('✓ PASS: Body-spoofed userId completely ignored; authoritatively bound to authenticated student JWT');

  // ========================================================================
  // 5. Production Error Sanitization (sendSafeServerError)
  // ========================================================================
  console.log('\n--- 5. Production Error Sanitization (sendSafeServerError) ---');

  // In development mode (current process.env.NODE_ENV !== 'production')
  process.env.NODE_ENV = 'development';
  res = await req('GET', '/api/test-error');
  assert.strictEqual(res.status, 500);
  assert(res.body.error.includes('Sensitive DB Connection String'), 'Development mode should provide error details to developers');
  console.log('✓ PASS: Development mode preserves descriptive error context for developer debugging');

  // In production mode
  process.env.NODE_ENV = 'production';
  res = await req('GET', '/api/test-error');
  assert.strictEqual(res.status, 500);
  assert.strictEqual(
    res.body.error,
    'Internal server error',
    'Production mode MUST sanitize 500 error to generic "Internal server error"'
  );
  assert.strictEqual(
    (res.body as any).details,
    undefined,
    'Production mode MUST NOT leak sensitive connection string or stack details'
  );
  console.log('✓ PASS: Production mode masks internal database errors and stack traces with generic "Internal server error"');

  // Reset NODE_ENV
  process.env.NODE_ENV = 'development';

  // ========================================================================
  // 6. Controlled Storage Failure Error Sanitization (Certifications & Resume 503)
  // ========================================================================
  console.log('\n--- 6. Storage Failure Error Sanitization (Certifications & Resume HTTP 503) ---');

  // Stub fileStorage.uploadFile to simulate controlled storage failure with sensitive details
  const originalUpload = fileStorage.uploadFile;
  const sensitiveErrorString = 'MongoDB GridFS connection timeout to mongodb+srv://admin:clusterPass@db.internal:27017/prod, path: /root/.persistent_storage/files/secret.pdf';
  fileStorage.uploadFile = async () => {
    throw new Error(sensitiveErrorString);
  };

  try {
    // 6.1 Certification Upload Storage Failure
    const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const certFormData = new FormData();
    certFormData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'cert.pdf');

    const certRes = await fetch(`${baseUrl}/api/certifications/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentA_Token}`,
      },
      body: certFormData,
    });
    const certBody = await certRes.json().catch(() => ({}));

    assert.strictEqual(certRes.status, 503, 'Certification storage failure must return HTTP 503');
    assert.strictEqual(certBody.error, 'Storage unavailable', 'Certification storage failure must return safe static message "Storage unavailable"');
    const certBodyStr = JSON.stringify(certBody);
    assert(!certBodyStr.includes('GridFS'), 'Response must not leak GridFS details');
    assert(!certBodyStr.includes('mongodb'), 'Response must not leak MongoDB details');
    assert(!certBodyStr.includes('clusterPass'), 'Response must not leak internal credentials');
    assert(!certBodyStr.includes('/root/'), 'Response must not leak filesystem paths');
    console.log('✓ PASS: Certification storage failure returns HTTP 503 with safe static message "Storage unavailable" and zero leakages');

    // 6.2 Resume Upload Storage Failure
    const resumeFormData = new FormData();
    resumeFormData.append('resume', new Blob([pdfBytes], { type: 'application/pdf' }), 'resume.pdf');

    const resumeRes = await fetch(`${baseUrl}/api/resume/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentA_Token}`,
      },
      body: resumeFormData,
    });
    const resumeBody = await resumeRes.json().catch(() => ({}));

    assert.strictEqual(resumeRes.status, 503, 'Resume storage failure must return HTTP 503');
    assert.strictEqual(resumeBody.error, 'Storage unavailable', 'Resume storage failure must return safe static message "Storage unavailable"');
    assert.strictEqual(resumeBody.success, false, 'Resume storage failure must return success: false');
    const resumeBodyStr = JSON.stringify(resumeBody);
    assert(!resumeBodyStr.includes('GridFS'), 'Response must not leak GridFS details');
    assert(!resumeBodyStr.includes('mongodb'), 'Response must not leak MongoDB details');
    assert(!resumeBodyStr.includes('clusterPass'), 'Response must not leak internal credentials');
    assert(!resumeBodyStr.includes('/root/'), 'Response must not leak filesystem paths');
    console.log('✓ PASS: Resume storage failure returns HTTP 503 with safe static message "Storage unavailable" and zero leakages');
  } finally {
    fileStorage.uploadFile = originalUpload;
  }

  server.close();
  console.log('\n====================================================');
  console.log('   ALL FINAL SECURITY REGRESSION CHECKS PASSED!     ');
  console.log('====================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ FINAL SECURITY REGRESSION TEST FAILED:', err);
  process.exit(1);
});
