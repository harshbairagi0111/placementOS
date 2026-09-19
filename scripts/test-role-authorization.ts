import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express from 'express';
import { studentsRouter } from '../routes/students';
import { recruitersRouter } from '../routes/recruiters';
import { academicianRouter } from '../routes/academician';
import { mentorshipRouter } from '../routes/mentorship';
import { tpoRouter } from '../routes/tpo';
import { verificationRouter } from '../routes/verification';
import { resumeRouter } from '../routes/resume';
import { portfolioRouter } from '../routes/portfolio';
import { skillsRouter } from '../routes/skills';

console.log('====================================================');
console.log('       ROLE AUTHORIZATION SECURITY TEST SUITE       ');
console.log('====================================================\n');

async function runTests() {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos';
  process.env.JWT_SECRET = JWT_SECRET;

  const app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);
  app.use('/api/recruiters', recruitersRouter);
  app.use('/api/academician', academicianRouter);
  app.use('/api/mentorship', mentorshipRouter);
  app.use('/api/tpo', tpoRouter);
  app.use('/api/verification', verificationRouter);
  app.use('/api/resume', resumeRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/skills', skillsRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  function createToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
  }

  const studentToken = createToken('650000000000000000000001', 'student');
  const industryToken = createToken('650000000000000000000002', 'industry');
  const academicianToken = createToken('650000000000000000000003', 'academician');
  const institutionToken = createToken('650000000000000000000004', 'institution');
  const noRoleToken = jwt.sign({ userId: '650000000000000000000005' }, JWT_SECRET, { expiresIn: '1h' });

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

  console.log('--- 1. Testing Industry-only Endpoints ---');
  // Student should be rejected from posting jobs
  let res = await req('POST', '/api/recruiters/jobs', studentToken, { title: 'Engineer' });
  assert.strictEqual(res.status, 403, 'Student must receive 403 on POST /jobs');
  console.log('✓ PASS: Student blocked from POST /jobs (403)');

  // Academician should be rejected from candidate ranking
  res = await req('GET', '/api/recruiters/candidates', academicianToken);
  assert.strictEqual(res.status, 403, 'Academician must receive 403 on GET /candidates');
  console.log('✓ PASS: Academician blocked from GET /candidates (403)');

  // Institution should be rejected from creating learning programs
  res = await req('POST', '/api/recruiters/learning-programs', institutionToken, { title: 'Program' });
  assert.strictEqual(res.status, 403, 'Institution must receive 403 on POST /learning-programs');
  console.log('✓ PASS: Institution blocked from POST /learning-programs (403)');

  console.log('\n--- 2. Testing Academician-only Endpoints ---');
  // Student should be rejected from academician me/overview
  res = await req('GET', '/api/academician/me/overview', studentToken);
  assert.strictEqual(res.status, 403, 'Student must receive 403 on academician /me/overview');
  console.log('✓ PASS: Student blocked from GET /academician/me/overview (403)');

  // Industry should be rejected from applying to academician opportunities
  res = await req('POST', '/api/academician/opportunities/opp-123/apply', industryToken);
  assert.strictEqual(res.status, 403, 'Industry must receive 403 on academician apply');
  console.log('✓ PASS: Industry blocked from POST /academician/opportunities/:id/apply (403)');

  // Institution should be rejected from academician profile
  res = await req('PUT', '/api/academician/me/profile', institutionToken, { name: 'Dr. Test' });
  assert.strictEqual(res.status, 403, 'Institution must receive 403 on academician profile update');
  console.log('✓ PASS: Institution blocked from PUT /academician/me/profile (403)');

  console.log('\n--- 3. Testing Institution/TPO-only Endpoints ---');
  // Student should be rejected from TPO analytics
  res = await req('GET', '/api/tpo/analytics', studentToken);
  assert.strictEqual(res.status, 403, 'Student must receive 403 on GET /tpo/analytics');
  console.log('✓ PASS: Student blocked from GET /tpo/analytics (403)');

  // Industry should be rejected from TPO placement reports
  res = await req('GET', '/api/tpo/placements', industryToken);
  assert.strictEqual(res.status, 403, 'Industry must receive 403 on GET /tpo/placements');
  console.log('✓ PASS: Industry blocked from GET /tpo/placements (403)');

  // Academician should be rejected from TPO moderation queue
  res = await req('GET', '/api/tpo/experiences/pending', academicianToken);
  assert.strictEqual(res.status, 403, 'Academician must receive 403 on GET /tpo/experiences/pending');
  console.log('✓ PASS: Academician blocked from GET /tpo/experiences/pending (403)');

  console.log('\n--- 4. Testing Student-only Endpoints ---');
  // Industry should be rejected from student job applications
  res = await req('POST', '/api/students/me/jobs/job-123/apply', industryToken);
  assert.strictEqual(res.status, 403, 'Industry must receive 403 on POST /students/me/jobs/:jobId/apply');
  console.log('✓ PASS: Industry blocked from student job application (403)');

  // Academician should be rejected from student learning program application
  res = await req('POST', '/api/students/learning-programs/prog-123/apply', academicianToken);
  assert.strictEqual(res.status, 403, 'Academician must receive 403 on student learning program application');
  console.log('✓ PASS: Academician blocked from student learning program application (403)');

  // Institution should be rejected from student mentorship requests list
  res = await req('GET', '/api/mentorship/requests/my', institutionToken);
  assert.strictEqual(res.status, 403, 'Institution must receive 403 on GET /mentorship/requests/my');
  console.log('✓ PASS: Institution blocked from student GET /mentorship/requests/my (403)');

  // Industry should be rejected from student portfolio self-inspection
  res = await req('GET', '/api/portfolio/me', industryToken);
  assert.strictEqual(res.status, 403, 'Industry must receive 403 on GET /portfolio/me');
  console.log('✓ PASS: Industry blocked from GET /portfolio/me (403)');

  // Institution should be rejected from student resume endpoints
  res = await req('GET', '/api/resume/latest', institutionToken);
  assert.strictEqual(res.status, 403, 'Institution must receive 403 on GET /resume/latest');
  console.log('✓ PASS: Institution blocked from GET /resume/latest (403)');

  // Industry should be rejected from student skill profile
  res = await req('GET', '/api/skills/profile', industryToken);
  assert.strictEqual(res.status, 403, 'Industry must receive 403 on GET /skills/profile');
  console.log('✓ PASS: Industry blocked from GET /skills/profile (403)');

  console.log('\n--- 5. Testing Verification Endpoints (Academician & Institution Authorized) ---');
  // Student should be rejected from verifying evidence
  res = await req('PATCH', '/api/verification/project/proj-1/verify', studentToken, { note: 'Verified' });
  assert.strictEqual(res.status, 403, 'Student must receive 403 on PATCH /verification/:type/:id/verify');
  console.log('✓ PASS: Student blocked from verifying portfolio evidence (403)');

  // Industry should be rejected from verifying evidence
  res = await req('PATCH', '/api/verification/internship/intern-1/verify', industryToken, { note: 'Verified' });
  assert.strictEqual(res.status, 403, 'Industry must receive 403 on PATCH /verification/:type/:id/verify');
  console.log('✓ PASS: Industry blocked from verifying portfolio evidence (403)');

  console.log('\n--- 6. Testing Missing/Undefined Role Tokens (Strict Default Rejection) ---');
  // Missing role token should be blocked from student learning-program application
  res = await req('POST', '/api/students/learning-programs/prog-123/apply', noRoleToken, { message: 'Hello' });
  assert.strictEqual(res.status, 403, 'Missing role must receive 403 on student learning program application');
  console.log('✓ PASS: Undefined role blocked from POST /students/learning-programs/:id/apply (403)');

  // Missing role token should be blocked from student learning-program application tracking
  res = await req('GET', '/api/students/learning-program-applications', noRoleToken);
  assert.strictEqual(res.status, 403, 'Missing role must receive 403 on learning-program-applications');
  console.log('✓ PASS: Undefined role blocked from GET /students/learning-program-applications (403)');

  // Missing role token should be blocked from industry jobs
  res = await req('POST', '/api/recruiters/jobs', noRoleToken, { title: 'Engineer' });
  assert.strictEqual(res.status, 403, 'Missing role must receive 403 on recruiter endpoints');
  console.log('✓ PASS: Undefined role blocked from POST /recruiters/jobs (403)');

  // Missing role token should be blocked from academician overview
  res = await req('GET', '/api/academician/me/overview', noRoleToken);
  assert.strictEqual(res.status, 403, 'Missing role must receive 403 on academician endpoints');
  console.log('✓ PASS: Undefined role blocked from GET /academician/me/overview (403)');

  // Missing role token should be blocked from institution TPO analytics
  res = await req('GET', '/api/tpo/analytics', noRoleToken);
  assert.strictEqual(res.status, 403, 'Missing role must receive 403 on TPO endpoints');
  console.log('✓ PASS: Undefined role blocked from GET /tpo/analytics (403)');

  console.log('\n--- 7. Confirming Legitimate Role Access (Not Blocked by 403) ---');
  res = await req('GET', '/api/students/learning-program-applications', studentToken);
  assert.strictEqual(res.status, 200, 'Student should have 200 on learning-program-applications');
  console.log('✓ PASS: Legitimate student accessed GET /students/learning-program-applications (200)');

  res = await req('GET', '/api/recruiters/candidates', industryToken);
  assert.strictEqual(res.status, 200, 'Industry should have 200 on candidates');
  console.log('✓ PASS: Legitimate industry accessed GET /recruiters/candidates (200)');

  res = await req('GET', '/api/academician/me/overview', academicianToken);
  assert.notStrictEqual(res.status, 403, 'Academician must not be blocked by 403 on academician overview');
  console.log(`✓ PASS: Legitimate academician bypassed role barrier on GET /academician/me/overview (Status: ${res.status})`);

  res = await req('GET', '/api/tpo/analytics', institutionToken);
  assert.notStrictEqual(res.status, 403, 'Institution must not be blocked by 403 on TPO analytics');
  console.log(`✓ PASS: Legitimate institution bypassed role barrier on GET /tpo/analytics (Status: ${res.status})`);

  console.log('\n====================================================');
  console.log('   ALL ROLE AUTHORIZATION SECURITY CHECKS PASSED!   ');
  console.log('====================================================');

  server.close();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
