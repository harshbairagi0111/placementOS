import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express from 'express';
import mongoose from 'mongoose';
import { studentsRouter } from '../routes/students';
import { recruitersRouter } from '../routes/recruiters';
import { certificationsRouter } from '../routes/certifications';
import { mentorshipRouter } from '../routes/mentorship';
import { verificationRouter } from '../routes/verification';
import { filesRouter } from '../routes/files';
import { resumeRouter } from '../routes/resume';
import { aptitudeRouter } from '../routes/aptitude';
import { interviewsRouter } from '../routes/interviews';
import { roadmapRouter } from '../routes/roadmap';
import { experiencesRouter } from '../routes/experiences';
import { academicianRouter } from '../routes/academician';
import { connectDB } from '../src/db/db';
import { User } from '../src/models/User';
import { Project } from '../src/models/Project';
import { Internship } from '../src/models/Internship';
import { Achievement } from '../src/models/Achievement';
import { Certification } from '../src/models/Certification';
import { JobPosting } from '../src/models/JobPosting';
import { JobApplication } from '../src/models/JobApplication';
import { LearningProgram } from '../src/models/LearningProgram';
import { MentorshipRequest } from '../src/models/MentorshipRequest';
import { InterviewExperience } from '../src/models/InterviewExperience';
import { AptitudeTestSession } from '../src/models/AptitudeTestSession';
import { MockInterviewSession } from '../src/models/MockInterviewSession';
import { Roadmap } from '../src/models/Roadmap';
import { Resume } from '../src/models/Resume';
import { fileStorage } from '../src/services/fileStorage';

console.log('====================================================');
console.log('   IDOR / OBJECT-LEVEL AUTHORIZATION TEST SUITE');
console.log('   (PLACEMENTOS SIH 2026 FIX #10.2C)');
console.log('====================================================\n');

async function runIdorTests() {
  await connectDB();
  const isDbConnected = mongoose.connection.readyState === 1;
  console.log(`[DB Status] Connected: ${isDbConnected}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos';
  process.env.JWT_SECRET = JWT_SECRET;

  const app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);
  app.use('/api/recruiters', recruitersRouter);
  app.use('/api', recruitersRouter);
  app.use('/api/certifications', certificationsRouter);
  app.use('/api/mentorship', mentorshipRouter);
  app.use('/api/verification', verificationRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/resume', resumeRouter);
  app.use('/api/aptitude', aptitudeRouter);
  app.use('/api/interviews', interviewsRouter);
  app.use('/api/roadmap', roadmapRouter);
  app.use('/api/experiences', experiencesRouter);
  app.use('/api/academician', academicianRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  function createToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
  }

  // Define User Identities
  const studentA_Id = new mongoose.Types.ObjectId().toString();
  const studentB_Id = new mongoose.Types.ObjectId().toString();
  const tokenStudentA = createToken(studentA_Id, 'student');
  const tokenStudentB = createToken(studentB_Id, 'student');

  const recruiterA_Id = new mongoose.Types.ObjectId().toString();
  const recruiterB_Id = new mongoose.Types.ObjectId().toString();
  const tokenRecruiterA = createToken(recruiterA_Id, 'industry');
  const tokenRecruiterB = createToken(recruiterB_Id, 'industry');

  const academicianA_Id = new mongoose.Types.ObjectId().toString();
  const academicianB_Id = new mongoose.Types.ObjectId().toString();
  const tokenAcademicianA = createToken(academicianA_Id, 'academician');
  const tokenAcademicianB = createToken(academicianB_Id, 'academician');

  const institutionA_Id = new mongoose.Types.ObjectId().toString();
  const institutionB_Id = new mongoose.Types.ObjectId().toString();
  const tokenInstitutionA = createToken(institutionA_Id, 'institution');
  const tokenInstitutionB = createToken(institutionB_Id, 'institution');

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

  // Seed DB records if connected
  if (isDbConnected) {
    await User.create([
      {
        _id: new mongoose.Types.ObjectId(studentA_Id),
        email: `studentA_${Date.now()}@collegeA.edu`,
        password: 'password123',
        name: 'Student Alice',
        role: 'student',
        college: 'College Alpha',
        collegeName: 'College Alpha',
      },
      {
        _id: new mongoose.Types.ObjectId(studentB_Id),
        email: `studentB_${Date.now()}@collegeB.edu`,
        password: 'password123',
        name: 'Student Bob',
        role: 'student',
        college: 'College Beta',
        collegeName: 'College Beta',
      },
      {
        _id: new mongoose.Types.ObjectId(recruiterA_Id),
        email: `recruiterA_${Date.now()}@corpA.com`,
        password: 'password123',
        name: 'Recruiter Alice',
        role: 'industry',
        company: 'Corp Alpha',
      },
      {
        _id: new mongoose.Types.ObjectId(recruiterB_Id),
        email: `recruiterB_${Date.now()}@corpB.com`,
        password: 'password123',
        name: 'Recruiter Bob',
        role: 'industry',
        company: 'Corp Beta',
      },
      {
        _id: new mongoose.Types.ObjectId(academicianA_Id),
        email: `academicianA_${Date.now()}@collegeA.edu`,
        password: 'password123',
        name: 'Professor Alpha',
        role: 'academician',
        college: 'College Alpha',
        collegeName: 'College Alpha',
      },
      {
        _id: new mongoose.Types.ObjectId(academicianB_Id),
        email: `academicianB_${Date.now()}@collegeB.edu`,
        password: 'password123',
        name: 'Professor Beta',
        role: 'academician',
        college: 'College Beta',
        collegeName: 'College Beta',
      },
      {
        _id: new mongoose.Types.ObjectId(institutionA_Id),
        email: `tpoA_${Date.now()}@collegeA.edu`,
        password: 'password123',
        name: 'TPO College Alpha',
        role: 'institution',
        college: 'College Alpha',
        collegeName: 'College Alpha',
      },
      {
        _id: new mongoose.Types.ObjectId(institutionB_Id),
        email: `tpoB_${Date.now()}@collegeB.edu`,
        password: 'password123',
        name: 'TPO College Beta',
        role: 'institution',
        college: 'College Beta',
        collegeName: 'College Beta',
      },
    ]);
  }

  let passedTests = 0;
  let totalTests = 0;

  function recordPass(testName: string) {
    totalTests++;
    passedTests++;
    console.log(`  ✓ PASSED: ${testName}`);
  }

  // ============================================================================
  // SCENARIO 1: Student A attempts to modify Student B's project
  // ============================================================================
  console.log('\n--- Scenario 1: Student A attempts to update Student B project ---');
  let projB = await Project.create({
    userId: new mongoose.Types.ObjectId(studentB_Id),
    title: 'Bob Distributed DB',
    description: 'Raft consensus in Go',
    technologies: ['Go', 'Raft'],
  });
  let res = await req('PATCH', `/api/students/me/projects/${projB._id}`, tokenStudentA, {
    title: 'Alice Hijacked Project',
  });
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  let checkProjB = await Project.findById(projB._id);
  assert.strictEqual(checkProjB?.title, 'Bob Distributed DB', 'Project title must remain intact');
  recordPass('Student A cannot modify Student B project (returns 404/403, data intact)');

  // ============================================================================
  // SCENARIO 2: Student A attempts to delete Student B's project
  // ============================================================================
  console.log('\n--- Scenario 2: Student A attempts to delete Student B project ---');
  res = await req('DELETE', `/api/students/me/projects/${projB._id}`, tokenStudentA);
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  checkProjB = await Project.findById(projB._id);
  assert(checkProjB !== null, 'Project B must still exist in database');
  recordPass('Student A cannot delete Student B project (returns 404/403, record retained)');

  // ============================================================================
  // SCENARIO 3: Student A attempts to update Student B's internship
  // ============================================================================
  console.log('\n--- Scenario 3: Student A attempts to update Student B internship ---');
  let internB = await Internship.create({
    userId: new mongoose.Types.ObjectId(studentB_Id),
    organization: 'Stripe',
    role: 'Backend Intern',
    duration: '3 Months',
    status: 'Completed',
  });
  res = await req('PATCH', `/api/students/me/internships/${internB._id}`, tokenStudentA, {
    organization: 'Hijacked Company',
  });
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  let checkInternB = await Internship.findById(internB._id);
  assert.strictEqual(checkInternB?.organization, 'Stripe', 'Internship organization must remain Stripe');
  recordPass('Student A cannot update Student B internship');

  // ============================================================================
  // SCENARIO 4: Student A attempts to delete Student B's internship
  // ============================================================================
  console.log('\n--- Scenario 4: Student A attempts to delete Student B internship ---');
  res = await req('DELETE', `/api/students/me/internships/${internB._id}`, tokenStudentA);
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  checkInternB = await Internship.findById(internB._id);
  assert(checkInternB !== null, 'Internship B must not be deleted');
  recordPass('Student A cannot delete Student B internship');

  // ============================================================================
  // SCENARIO 5: Student A attempts to update Student B's achievement
  // ============================================================================
  console.log('\n--- Scenario 5: Student A attempts to update Student B achievement ---');
  let achB = await Achievement.create({
    userId: new mongoose.Types.ObjectId(studentB_Id),
    title: 'ACM ICPC Regional Finalist',
    organization: 'ICPC',
    rank: 'Top 10',
  });
  res = await req('PATCH', `/api/students/me/achievements/${achB._id}`, tokenStudentA, {
    title: 'Tampered Achievement',
  });
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  let checkAchB = await Achievement.findById(achB._id);
  assert.strictEqual(checkAchB?.title, 'ACM ICPC Regional Finalist', 'Achievement title must remain unchanged');
  recordPass('Student A cannot update Student B achievement');

  // ============================================================================
  // SCENARIO 6: Student A attempts to delete Student B's achievement
  // ============================================================================
  console.log('\n--- Scenario 6: Student A attempts to delete Student B achievement ---');
  res = await req('DELETE', `/api/students/me/achievements/${achB._id}`, tokenStudentA);
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  checkAchB = await Achievement.findById(achB._id);
  assert(checkAchB !== null, 'Achievement B must not be deleted');
  recordPass('Student A cannot delete Student B achievement');

  // ============================================================================
  // SCENARIO 7: Student A attempts to update Student B's certification
  // ============================================================================
  console.log('\n--- Scenario 7: Student A attempts to update Student B certification ---');
  let certB = await Certification.create({
    userId: new mongoose.Types.ObjectId(studentB_Id),
    title: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    credentialUrl: 'https://aws.amazon.com/verify/AWS-999',
  });
  assert(certB, 'certB must be created');
  res = await req('PATCH', `/api/certifications/${certB._id}`, tokenStudentA, {
    title: 'Alice Hijacked Cert',
  });
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  let checkCertB = await Certification.findById(certB._id);
  assert.strictEqual(checkCertB?.title, 'AWS Certified Solutions Architect', 'Cert title must remain AWS Certified');
  recordPass('Student A cannot update Student B certification');

  // ============================================================================
  // SCENARIO 8: Student A attempts to delete Student B's certification
  // ============================================================================
  console.log('\n--- Scenario 8: Student A attempts to delete Student B certification ---');
  res = await req('DELETE', `/api/certifications/${certB._id}`, tokenStudentA);
  assert(res.status === 404 || res.status === 403, `Expected 403/404, got ${res.status}`);
  checkCertB = await Certification.findById(certB._id);
  assert(checkCertB !== null, 'Certification B must not be deleted');
  recordPass('Student A cannot delete Student B certification');

  // ============================================================================
  // SCENARIO 9: Recruiter A attempts to update Recruiter B's job posting
  // ============================================================================
  console.log('\n--- Scenario 9: Recruiter A attempts to update Recruiter B job posting ---');
  let jobB = await JobPosting.create({
    recruiterId: new mongoose.Types.ObjectId(recruiterB_Id),
    title: 'Principal Distributed Systems Engineer',
    company: 'Corp Beta',
    type: 'Job',
    status: 'Active',
    ctc: '₹45 LPA',
    cutoffPct: 80,
  });
  res = await req('PATCH', `/api/recruiters/jobs/${jobB._id}`, tokenRecruiterA, {
    title: 'Corp Alpha Hijacked Role',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  let checkJobB = await JobPosting.findById(jobB._id);
  assert.strictEqual(checkJobB?.title, 'Principal Distributed Systems Engineer', 'Job title must remain intact');
  recordPass('Recruiter A cannot update Recruiter B job posting (returns 403)');

  // ============================================================================
  // SCENARIO 10: Recruiter A attempts to delete Recruiter B's learning program
  // ============================================================================
  console.log('\n--- Scenario 10: Recruiter A attempts to delete Recruiter B learning program ---');
  let progB = await LearningProgram.create({
    recruiterId: new mongoose.Types.ObjectId(recruiterB_Id),
    company: 'Corp Beta',
    title: 'Cloud Native Microservices Bootcamp',
    type: 'Training Program',
    skillsCovered: ['Kubernetes', 'Docker', 'Go'],
    capacity: 25,
    enrolledCount: 0,
    status: 'Active',
  });
  res = await req('DELETE', `/api/recruiters/learning-programs/${progB._id}`, tokenRecruiterA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  let checkProgB = await LearningProgram.findById(progB._id);
  assert(checkProgB !== null, 'LearningProgram B must not be deleted');
  recordPass('Recruiter A cannot delete Recruiter B learning program (returns 403)');

  // ============================================================================
  // SCENARIO 11: Recruiter A attempts to view candidate ranking for Recruiter B's job
  // ============================================================================
  console.log('\n--- Scenario 11: Recruiter A attempts to view candidates for Recruiter B job ---');
  res = await req('GET', `/api/recruiters/jobs/${jobB._id}/candidates`, tokenRecruiterA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  recordPass('Recruiter A cannot view candidates for Recruiter B job (returns 403)');

  // ============================================================================
  // SCENARIO 12: Recruiter A attempts to update candidate status on Recruiter B's job application
  // ============================================================================
  console.log('\n--- Scenario 12: Recruiter A attempts to update status on Recruiter B job application ---');
  let appB = await JobApplication.create({
    jobPostingId: jobB._id,
    userId: new mongoose.Types.ObjectId(studentB_Id),
    company: 'Corp Beta',
    role: 'Principal Distributed Systems Engineer',
    status: 'Applied',
    appliedAt: new Date(),
  });
  res = await req('PATCH', `/api/recruiters/applications/${appB._id}/status`, tokenRecruiterA, {
    status: 'Offer',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  let checkAppB = await JobApplication.findById(appB._id);
  assert.strictEqual(checkAppB?.status, 'Applied', 'Application status must remain Applied');
  recordPass('Recruiter A cannot update application status on Recruiter B job (returns 403)');

  // ============================================================================
  // SCENARIO 13: Academician B attempts to accept/reject Mentorship Request assigned to Academician A
  // ============================================================================
  console.log('\n--- Scenario 13: Academician B attempts to accept Academician A mentorship request ---');
  let mentorReqA = await MentorshipRequest.create({
    studentId: new mongoose.Types.ObjectId(studentA_Id),
    mentorId: new mongoose.Types.ObjectId(academicianA_Id),
    mentorshipArea: 'Career Guidance',
    message: 'Seeking mentorship in Distributed Systems',
    status: 'PENDING',
  });
  assert(mentorReqA, 'mentorReqA must be created');
  res = await req('PATCH', `/api/mentorship/requests/${mentorReqA._id}/accept`, tokenAcademicianB, {
    responseNote: 'Hijacked by Professor Beta',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  let checkReqA = await MentorshipRequest.findById(mentorReqA._id);
  assert.strictEqual(checkReqA?.status, 'PENDING', 'Mentorship request status must remain PENDING');
  recordPass('Academician B cannot accept Mentorship Request assigned to Academician A (returns 403)');

  // ============================================================================
  // SCENARIO 14: Verifier B (College Beta) attempts to verify portfolio item of Student from College Alpha
  // ============================================================================
  console.log('\n--- Scenario 14: Cross-institution verification IDOR ---');
  let projAlpha = await Project.create({
    userId: new mongoose.Types.ObjectId(studentA_Id), // Belongs to College Alpha
    title: 'Alpha Student Project',
    description: 'Verification target project',
    technologies: ['TypeScript', 'Express'],
    verificationStatus: 'PENDING',
  });
  res = await req('PATCH', `/api/verification/projects/${projAlpha._id}/verify`, tokenInstitutionB, {
    verificationNote: 'Unauthorized cross-institution approval',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  let checkProjAlpha = await Project.findById(projAlpha._id);
  assert.strictEqual(checkProjAlpha?.verificationStatus, 'PENDING', 'Verification status must remain PENDING');
  recordPass('Verifier from College Beta cannot verify Student A from College Alpha (returns 403)');

  // ============================================================================
  // SCENARIO 15: Student A attempts to access/download private file belonging to Student B
  // ============================================================================
  console.log('\n--- Scenario 15: Cross-user private file access/download IDOR ---');
  // Valid PDF header bytes %PDF
  const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const storedFile = await fileStorage.uploadFile({
    buffer: validPdfBuffer,
    originalName: 'bob_resume.pdf',
    mimeType: 'application/pdf',
    userId: studentB_Id,
    ownerStudentId: studentB_Id,
    category: 'resume',
  });
  res = await req('GET', `/api/files/${storedFile.fileId}`, tokenStudentA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  recordPass('Student A cannot download Student B private document (returns 403)');

  // ============================================================================
  // SCENARIO 16: Student A attempts to delete private file belonging to Student B
  // ============================================================================
  console.log('\n--- Scenario 16: Cross-user file deletion IDOR ---');
  res = await req('DELETE', `/api/files/${storedFile.fileId}`, tokenStudentA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  const stillExistingFile = await fileStorage.getFile(storedFile.fileId);
  assert(stillExistingFile !== null, 'File must not be deleted');
  recordPass('Student A cannot delete Student B private document (returns 403)');

  // ============================================================================
  // SCENARIO 17: Student A attempts to view Aptitude Mock Test report of Student B
  // ============================================================================
  console.log('\n--- Scenario 17: Cross-user aptitude test report view IDOR ---');
  let sessionB = await AptitudeTestSession.create({
    userId: studentB_Id,
    mode: 'mock',
    category: 'Quantitative',
    startedAt: new Date(Date.now() - 3600000),
    completedAt: new Date(),
    questions: [
      {
        questionId: 'q1',
        category: 'Quantitative',
        questionText: 'What is 2+2?',
        options: ['1', '2', '3', '4'],
        correctAnswerIndex: 3,
        selectedAnswerIndex: 3,
        isCorrect: true,
      },
    ],
  });
  res = await req('GET', `/api/aptitude/mock/${sessionB._id}/report`, tokenStudentA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  recordPass('Student A cannot view Student B mock test report (returns 403)');

  // ============================================================================
  // BONUS SCENARIO 18: Student A attempts to update Student B's roadmap progress
  // ============================================================================
  console.log('\n--- Scenario 18: Cross-user roadmap progress update IDOR ---');
  let roadmapB = await Roadmap.create({
    userId: new mongoose.Types.ObjectId(studentB_Id),
    targetRole: 'Senior SRE',
    generatedAt: new Date(),
    phases: [
      {
        weekNum: 1,
        phase: 'Phase 1',
        title: 'Linux Fundamentals',
        topics: [{ id: 't1', title: 'Kernel Internals', completed: false }],
        targetQuestions: 10,
        solvedQuestions: 0,
        easyTarget: 4,
        mediumTarget: 4,
        hardTarget: 2,
      },
    ],
  });
  res = await req('PUT', `/api/roadmap/${roadmapB._id}/progress`, tokenStudentA, {
    phases: [
      {
        weekNum: 1,
        phase: 'Phase 1',
        title: 'Linux Fundamentals',
        topics: [{ id: 't1', title: 'Kernel Internals', completed: true }],
        targetQuestions: 10,
        solvedQuestions: 10,
        easyTarget: 4,
        mediumTarget: 4,
        hardTarget: 2,
      },
    ],
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  let checkRoadmapB = await Roadmap.findById(roadmapB._id);
  assert.strictEqual(checkRoadmapB?.phases[0].topics[0].completed, false, 'Roadmap progress must remain untouched');
  recordPass('Student A cannot update Student B roadmap progress (returns 403)');

  // ============================================================================
  // BONUS SCENARIO 19: Malformed ObjectId handling (returns 400 Bad Request)
  // ============================================================================
  console.log('\n--- Scenario 19: Malformed ObjectId parameter validation ---');
  res = await req('PATCH', '/api/students/me/projects/invalid-object-id', tokenStudentA, {
    title: 'Testing Validation',
  });
  assert.strictEqual(res.status, 400, `Expected 400 Bad Request on invalid ID, got ${res.status}`);
  recordPass('Malformed ObjectId parameter rejected with HTTP 400');

  // ============================================================================
  // BONUS SCENARIO 20: Cross-user complete mock interview session
  // ============================================================================
  console.log('\n--- Scenario 20: Cross-user interview completion IDOR ---');
  let interviewB = await MockInterviewSession.create({
    userId: studentB_Id,
    company: 'Meta',
    role: 'Software Engineer',
    category: 'System Design',
    date: new Date().toISOString().split('T')[0],
    score: 0,
    verdict: 'Pending',
    questionLogs: [
      {
        questionText: 'Design WhatsApp',
        userAnswer: 'Used Erlang actor model',
        score: 90,
      },
    ],
  });
  res = await req('POST', `/api/interviews/${interviewB._id}/complete`, tokenStudentA, {
    violations: [],
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  let checkInterviewB = await MockInterviewSession.findById(interviewB._id);
  assert.strictEqual(checkInterviewB?.verdict, 'Pending', 'Interview session verdict must remain Pending');
  recordPass('Student A cannot complete Student B interview session (returns 403)');

  // ============================================================================
  // SCENARIO 21: Test A — Unauthenticated user attempts to answer
  // ============================================================================
  console.log('\n--- Scenario 21: Unauthenticated user attempts to answer mock interview ---');
  const initialLogCount = checkInterviewB?.questionLogs?.length || 1;
  res = await req('POST', `/api/interviews/${interviewB._id}/answer`, undefined, {
    question: 'How do you scale WebSocket connections?',
    answer: 'Use Redis Pub/Sub backplane.',
  });
  assert.strictEqual(res.status, 401, `Expected 401 Unauthorized for unauthenticated request, got ${res.status}`);
  checkInterviewB = await MockInterviewSession.findById(interviewB._id);
  assert.strictEqual(checkInterviewB?.questionLogs?.length, initialLogCount, 'Question logs must not be modified by unauthenticated request');
  recordPass('Unauthenticated request to submit interview answer is rejected (401, no mutation)');

  // ============================================================================
  // SCENARIO 22: Test B & F — Student A attacks Student B interview session (IDOR write)
  // ============================================================================
  console.log('\n--- Scenario 22: Student A attempts to answer Student B mock interview ---');
  res = await req('POST', `/api/interviews/${interviewB._id}/answer`, tokenStudentA, {
    question: 'How do you scale WebSocket connections?',
    answer: 'Hacked by Alice without authorization.',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden for cross-user answer submission, got ${res.status}`);
  checkInterviewB = await MockInterviewSession.findById(interviewB._id);
  assert.strictEqual(checkInterviewB?.questionLogs?.length, initialLogCount, 'Student B questionLogs length must remain strictly unchanged');
  recordPass('Student A cannot submit answer to Student B session (returns 403, questionLogs not mutated)');

  // ============================================================================
  // SCENARIO 23: Test D — Malformed / Invalid session ID validation
  // ============================================================================
  console.log('\n--- Scenario 23: Malformed / Invalid session ID validation ---');
  res = await req('POST', '/api/interviews/invalid-session-id-12345/answer', tokenStudentB, {
    question: 'Invalid ID Test',
    answer: 'Should be rejected before query',
  });
  assert.strictEqual(res.status, 400, `Expected 400 Bad Request on invalid session ID, got ${res.status}`);
  assert.strictEqual(res.body?.error, 'Invalid session ID', 'Should return safe error message');
  recordPass('Malformed session ID rejected with HTTP 400 (no 500 or CastError)');

  // ============================================================================
  // SCENARIO 24: Test E — Body identity spoofing cannot bypass authorization
  // ============================================================================
  console.log('\n--- Scenario 24: Body identity spoofing bypass attempt ---');
  res = await req('POST', `/api/interviews/${interviewB._id}/answer`, tokenStudentA, {
    userId: studentB_Id,
    question: 'Spoofing Test Question',
    answer: 'Attacker attempting spoofing in request body',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden on body spoofing attempt, got ${res.status}`);
  checkInterviewB = await MockInterviewSession.findById(interviewB._id);
  assert.strictEqual(checkInterviewB?.questionLogs?.length, initialLogCount, 'Spoofing request must not mutate questionLogs');
  recordPass('Body identity spoofing rejected (authoritative req.user enforced, 403)');

  // ============================================================================
  // SCENARIO 25: Non-student role (e.g. recruiter) blocked from interview answer
  // ============================================================================
  console.log('\n--- Scenario 25: Non-student role blocked from interview answer ---');
  res = await req('POST', `/api/interviews/${interviewB._id}/answer`, tokenRecruiterA, {
    question: 'Recruiter role test',
    answer: 'Recruiter answer should fail role check',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden for non-student role, got ${res.status}`);
  checkInterviewB = await MockInterviewSession.findById(interviewB._id);
  assert.strictEqual(checkInterviewB?.questionLogs?.length, initialLogCount, 'Non-student role must not mutate session');
  recordPass('Non-student role blocked from answering interview session (403)');

  // ============================================================================
  // SCENARIO 26: Test C — Student B accesses own session (Legitimate flow preserved)
  // ============================================================================
  console.log('\n--- Scenario 26: Student B legitimately answers own mock interview ---');
  res = await req('POST', `/api/interviews/${interviewB._id}/answer`, tokenStudentB, {
    question: 'How do you handle distributed transactions?',
    answer: 'Use the Saga pattern with compensating transactions or 2PC where strict ACID is essential.',
  });
  assert.strictEqual(res.status, 200, `Expected 200 OK for legitimate owner answer, got ${res.status}`);
  assert(res.body?.questionLog, 'Response must include questionLog entry');
  assert(typeof res.body?.techScore === 'number', 'Response must include techScore');
  checkInterviewB = await MockInterviewSession.findById(interviewB._id);
  assert.strictEqual(checkInterviewB?.questionLogs?.length, initialLogCount + 1, 'Question logs must have new entry appended');
  const latestLog = checkInterviewB?.questionLogs?.[checkInterviewB.questionLogs.length - 1];
  assert.strictEqual(latestLog?.question, 'How do you handle distributed transactions?');
  recordPass('Student B legitimately submits answer to own session (200 OK, question logged)');

  // ============================================================================
  // RECRUITER IDOR AUTHORIZATION TESTS (Fix #10.2C Continuation - Recruiter Endpoints)
  // ============================================================================
  console.log('\n====================================================');
  console.log('   RECRUITER IDOR & OBJECT OWNERSHIP TESTS (A-H)');
  console.log('====================================================\n');

  // Seed Job Postings for Recruiter A and Recruiter B
  const recruiterJobA = await JobPosting.create({
    recruiterId: new mongoose.Types.ObjectId(recruiterA_Id),
    title: 'Senior Distributed Systems Engineer',
    company: 'Corp Alpha',
    description: 'High throughput backend engineering',
    type: 'Job',
    location: 'Remote',
    requiredSkills: ['Go', 'Distributed Systems', 'Kubernetes'],
    openPositions: 3,
    ctc: '₹35 LPA',
    status: 'Active',
  });

  const recruiterJobB = await JobPosting.create({
    recruiterId: new mongoose.Types.ObjectId(recruiterB_Id),
    title: 'Lead Frontend Architect',
    company: 'Corp Beta',
    description: 'React, TypeScript and microfrontends',
    type: 'Job',
    location: 'Bangalore',
    requiredSkills: ['React', 'TypeScript', 'Tailwind'],
    openPositions: 2,
    ctc: '₹40 LPA',
    status: 'Active',
  });

  // ----------------------------------------------------------------------------
  // TEST A: Recruiter A accessing Recruiter B's job candidate context (Expected: 403)
  // ----------------------------------------------------------------------------
  console.log('\n--- Test A: Recruiter A accesses candidate context with Recruiter B job ID ---');
  res = await req('GET', `/api/candidates/${studentB_Id}/profile?jobId=${recruiterJobB._id}`, tokenRecruiterA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden for Recruiter A using Recruiter B job context, got ${res.status}`);
  recordPass('Test A: Recruiter A accessing Recruiter B job candidate profile context returns 403');

  res = await req('GET', `/api/candidates/${studentB_Id}/portfolio?jobId=${recruiterJobB._id}`, tokenRecruiterA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden for Recruiter A using Recruiter B job portfolio context, got ${res.status}`);
  recordPass('Test A: Recruiter A accessing Recruiter B job candidate portfolio context returns 403');

  // ----------------------------------------------------------------------------
  // TEST B: Recruiter A using arbitrary Student B ID without legitimate context (Expected: 403)
  // ----------------------------------------------------------------------------
  console.log('\n--- Test B: Recruiter A accesses arbitrary Student B ID without legitimate context ---');
  res = await req('GET', `/api/candidates/${studentB_Id}/profile`, tokenRecruiterA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden for arbitrary student ID access without context, got ${res.status}`);
  recordPass('Test B: Recruiter A querying arbitrary Student B profile without context returns 403');

  res = await req('GET', `/api/candidates/${studentB_Id}/portfolio`, tokenRecruiterA);
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden for arbitrary student portfolio access without context, got ${res.status}`);
  recordPass('Test B: Recruiter A querying arbitrary Student B portfolio without context returns 403');

  // ----------------------------------------------------------------------------
  // TEST C: Legitimate recruiter candidate access (Expected: 200)
  // ----------------------------------------------------------------------------
  console.log('\n--- Test C: Legitimate recruiter candidate access ---');
  // C.1: Access via recruiter-owned job context
  res = await req('GET', `/api/candidates/${studentB_Id}/profile?jobId=${recruiterJobA._id}`, tokenRecruiterA);
  assert.strictEqual(res.status, 200, `Expected 200 OK for legitimate job owner candidate evaluation, got ${res.status}`);
  assert.strictEqual(res.body?.success, true, 'Profile response must indicate success');
  assert.strictEqual(res.body?.candidate?.id, studentB_Id, 'Returned candidate ID must match target');
  assert(res.body?.jobMatch, 'Should include jobMatch object');
  recordPass('Test C.1: Recruiter A accessing candidate profile with own Job A context succeeds (200 OK)');

  res = await req('GET', `/api/candidates/${studentB_Id}/portfolio?jobId=${recruiterJobA._id}`, tokenRecruiterA);
  assert.strictEqual(res.status, 200, `Expected 200 OK for legitimate job owner portfolio evaluation, got ${res.status}`);
  assert.strictEqual(res.body?.success, true, 'Portfolio response must indicate success');
  recordPass('Test C.2: Recruiter A accessing candidate portfolio with own Job A context succeeds (200 OK)');

  // C.3: Access via existing job application relationship
  await JobApplication.create({
    userId: new mongoose.Types.ObjectId(studentA_Id),
    jobPostingId: recruiterJobA._id,
    company: recruiterJobA.company,
    role: recruiterJobA.title,
    status: 'Applied',
    appliedAt: '2026-09-01',
  });
  res = await req('GET', `/api/candidates/${studentA_Id}/profile`, tokenRecruiterA);
  assert.strictEqual(res.status, 200, `Expected 200 OK for candidate with existing application to recruiter job, got ${res.status}`);
  assert.strictEqual(res.body?.candidate?.id, studentA_Id, 'Returned candidate ID must match');
  recordPass('Test C.3: Recruiter A accessing candidate with existing application (no explicit jobId) succeeds (200 OK)');

  // ----------------------------------------------------------------------------
  // TEST D: Recruiter A invites a student using Recruiter B's job (Expected: 403, no mutation)
  // ----------------------------------------------------------------------------
  console.log('\n--- Test D: Recruiter A invites candidate using Recruiter B job ---');
  const countBeforeD = await JobApplication.countDocuments();
  res = await req('POST', `/api/candidates/${studentB_Id}/invite`, tokenRecruiterA, {
    jobId: recruiterJobB._id,
    jobTitle: 'Hacked Position',
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden for inviting with another recruiter job, got ${res.status}`);
  const countAfterD = await JobApplication.countDocuments();
  assert.strictEqual(countAfterD, countBeforeD, 'No JobApplication must be created on 403');
  recordPass('Test D: Recruiter A inviting candidate using Recruiter B job is rejected (403, no application created)');

  // ----------------------------------------------------------------------------
  // TEST E: Recruiter A attempts to spoof recruiter/company ownership (Expected: 403 / unbypassable)
  // ----------------------------------------------------------------------------
  console.log('\n--- Test E: Recruiter A attempts body ownership spoofing ---');
  const countBeforeE = await JobApplication.countDocuments();
  res = await req('POST', `/api/candidates/${studentB_Id}/invite`, tokenRecruiterA, {
    recruiterId: recruiterB_Id,
    companyId: 'corp-beta',
    company: 'Corp Beta',
    jobId: recruiterJobB._id,
  });
  assert.strictEqual(res.status, 403, `Expected 403 Forbidden when spoofing recruiterId with foreign job, got ${res.status}`);
  const countAfterE = await JobApplication.countDocuments();
  assert.strictEqual(countAfterE, countBeforeE, 'No application created on spoofed foreign job');
  recordPass('Test E: Body ownership spoofing cannot bypass authorization (403, no mutation)');

  // ----------------------------------------------------------------------------
  // TEST F: Invalid student ID validation (Expected: 400)
  // ----------------------------------------------------------------------------
  console.log('\n--- Test F: Invalid student ID validation ---');
  res = await req('GET', `/api/candidates/invalid-student-id-12345/profile?jobId=${recruiterJobA._id}`, tokenRecruiterA);
  assert.strictEqual(res.status, 400, `Expected 400 Bad Request for invalid student ID in profile, got ${res.status}`);
  assert.strictEqual(res.body?.error, 'Invalid candidate ID', 'Clean 400 error message returned');

  res = await req('POST', '/api/candidates/invalid-student-id-12345/invite', tokenRecruiterA, {
    jobId: recruiterJobA._id,
  });
  assert.strictEqual(res.status, 400, `Expected 400 Bad Request for invalid student ID in invite, got ${res.status}`);
  recordPass('Test F: Invalid student ID rejected with HTTP 400 (no 500 or CastError)');

  // ----------------------------------------------------------------------------
  // TEST G: Invalid job ID validation (Expected: 400)
  // ----------------------------------------------------------------------------
  console.log('\n--- Test G: Invalid job ID validation ---');
  res = await req('GET', `/api/candidates/${studentB_Id}/profile?jobId=malformed-job-id-999`, tokenRecruiterA);
  assert.strictEqual(res.status, 400, `Expected 400 Bad Request for invalid job ID in profile, got ${res.status}`);
  assert.strictEqual(res.body?.error, 'Invalid job ID', 'Clean 400 error message returned');

  res = await req('POST', `/api/candidates/${studentB_Id}/invite`, tokenRecruiterA, {
    jobId: 'malformed-job-id-999',
  });
  assert.strictEqual(res.status, 400, `Expected 400 Bad Request for invalid job ID in invite, got ${res.status}`);
  recordPass('Test G: Invalid job ID rejected with HTTP 400 (no 500 or CastError)');

  // ----------------------------------------------------------------------------
  // TEST H: Unauthorized request does not mutate data & Legitimate invite succeeds
  // ----------------------------------------------------------------------------
  console.log('\n--- Test H: Verify data mutation integrity & legitimate invitation ---');
  const countBeforeH = await JobApplication.countDocuments();
  // Legitimate invitation for recruiter-owned Job A
  res = await req('POST', `/api/candidates/${studentB_Id}/invite`, tokenRecruiterA, {
    jobId: recruiterJobA._id,
    company: 'Untrusted Spoofed Company Name', // should be ignored in favor of recruiterJobA.company
  });
  assert.strictEqual(res.status, 200, `Expected 200 OK for legitimate invitation, got ${res.status}`);
  assert.strictEqual(res.body?.success, true, 'Invitation response must be successful');
  const countAfterH = await JobApplication.countDocuments();
  assert.strictEqual(countAfterH, countBeforeH + 1, 'Exactly one JobApplication must be created');

  const createdInvite = await JobApplication.findOne({
    userId: new mongoose.Types.ObjectId(studentB_Id),
    jobPostingId: recruiterJobA._id,
  });
  assert(createdInvite, 'Created invitation record must exist in database');
  assert.strictEqual(createdInvite.company, 'Corp Alpha', 'Company must be authoritatively derived from persisted job, not untrusted body');
  assert.strictEqual(createdInvite.role, recruiterJobA.title, 'Role must match job title');
  assert.strictEqual(createdInvite.status, 'Interview Invited', 'Status must be Interview Invited');
  recordPass('Test H: Unauthorized requests do not mutate DB; legitimate invite creates authoritative application (200 OK)');

  // Cleanup server
  server.close();

  console.log('\n====================================================');
  console.log(`   ALL ${passedTests} / ${totalTests} IDOR AUTHORIZATION TESTS PASSED!`);
  console.log('====================================================\n');
}

runIdorTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ IDOR TEST SUITE FAILED:', err);
    process.exit(1);
  });
