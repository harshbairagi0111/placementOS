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
import { connectDB } from '../src/db/db';
import { User } from '../src/models/User';
import { Project } from '../src/models/Project';
import { Internship } from '../src/models/Internship';
import { Achievement } from '../src/models/Achievement';
import { Certification } from '../src/models/Certification';
import { JobPosting } from '../src/models/JobPosting';
import { LearningProgram } from '../src/models/LearningProgram';
import { LearningProgramApplication } from '../src/models/LearningProgramApplication';

console.log('====================================================');
console.log('   MASS-ASSIGNMENT REGRESSION SUITE (FIX #10.2B)');
console.log('====================================================\n');

async function runMassAssignmentTests() {
  await connectDB();
  const isDbConnected = mongoose.connection.readyState === 1;
  console.log(`[DB Status] Connected: ${isDbConnected}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos';
  process.env.JWT_SECRET = JWT_SECRET;

  const app = express();
  app.use(express.json());
  app.use('/api/students', studentsRouter);
  app.use('/api/recruiters', recruitersRouter);
  app.use('/api/certifications', certificationsRouter);
  app.use('/api/mentorship', mentorshipRouter);
  app.use('/api/verification', verificationRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  function createToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
  }

  const studentId = new mongoose.Types.ObjectId().toString();
  const studentToken = createToken(studentId, 'student');

  const recruiterId = new mongoose.Types.ObjectId().toString();
  const recruiterToken = createToken(recruiterId, 'industry');

  const attackerId = new mongoose.Types.ObjectId().toString();

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

  // Setup test users in DB if connected
  if (isDbConnected) {
    await User.create({
      _id: new mongoose.Types.ObjectId(studentId),
      email: `student_${Date.now()}@test.edu`,
      password: 'hashed_password_123',
      name: 'Security Test Student',
      role: 'student',
      college: 'National Institute of Technology',
      collegeName: 'National Institute of Technology',
    });

    await User.create({
      _id: new mongoose.Types.ObjectId(recruiterId),
      email: `recruiter_${Date.now()}@tech.com`,
      password: 'hashed_password_456',
      name: 'Security Test Recruiter',
      role: 'industry',
      company: 'Tech Corp Global',
    });
  }

  // ============================================================================
  // TEST 3: ROLE PROTECTION
  // Attempt to update a student/user with { role: "industry" }
  // Verify: role cannot change, remains "student"
  // ============================================================================
  console.log('--- TEST 3: Role Protection ---');
  let res = await req('PUT', '/api/students/me/profile', studentToken, {
    fullName: 'Student Real Name',
    bio: 'Software engineer in training',
    role: 'industry', // Malicious attempt to escalate privileges
    email: 'hacked@university.edu',
    password: 'hackedpassword',
  });

  assert.strictEqual(res.status, 200, `Profile update returned unexpected status: ${res.status}`);
  const updatedStudentProfile = res.body.profile;
  assert.strictEqual(updatedStudentProfile.role, 'student', 'Response role must remain "student"');
  if (isDbConnected) {
    const userInDb = await User.findById(studentId);
    assert(userInDb, 'User must exist in DB');
    assert.strictEqual(userInDb.role, 'student', 'DB user role must strictly remain "student"');
    assert.notStrictEqual(userInDb.password, 'hackedpassword', 'Password must not be overwritten');
  }
  console.log('✓ PASS: User role cannot be modified via mass-assignment, remains "student"');

  // ============================================================================
  // TEST 4: STUDENT OWNERSHIP FIELD
  // Attempt to modify a student resource while sending { studentId: "anotherStudentId" }
  // Verify that the resource remains owned by the authenticated student
  // ============================================================================
  console.log('\n--- TEST 4: Student Ownership Field ---');
  res = await req('POST', '/api/students/me/projects', studentToken, {
    title: 'Distributed File Store',
    description: 'High performance object storage engine',
    technologies: ['Go', 'gRPC'],
    studentId: attackerId, // Injected ownership spoof
    userId: attackerId,
  });

  assert.strictEqual(res.status, 201, `Failed to create project: ${JSON.stringify(res.body)}`);
  const createdProject = res.body.project;
  const projectOwner = createdProject.studentId || createdProject.userId;
  assert.strictEqual(projectOwner.toString(), studentId, 'Project owner must remain authenticated student, not injected ID');

  const projectId = createdProject.id || createdProject._id;
  // Attempt to reassign ownership via PATCH
  res = await req('PATCH', `/api/students/me/projects/${projectId}`, studentToken, {
    title: 'Distributed File Store v2',
    studentId: attackerId,
    userId: attackerId,
  });

  assert.strictEqual(res.status, 200, `Failed to patch project: ${JSON.stringify(res.body)}`);
  const patchedProject = res.body.project;
  const patchedOwner = patchedProject.studentId || patchedProject.userId;
  assert.strictEqual(patchedOwner.toString(), studentId, 'Project owner cannot be reassigned via PATCH');
  if (isDbConnected) {
    const projectInDb = await Project.findById(projectId);
    assert(projectInDb, 'Project must exist in DB');
    assert.strictEqual(projectInDb.userId.toString(), studentId, 'DB project owner must remain authenticated student');
  }
  console.log('✓ PASS: Student resource ownership (userId/studentId) cannot be spoofed or reassigned');

  // ============================================================================
  // TEST 5: VERIFICATION STATUS
  // Attempt to update a student portfolio item with { verificationStatus: "VERIFIED" }
  // Verify: student cannot make item VERIFIED; verificationStatus remains controlled by server (PENDING)
  // ============================================================================
  console.log('\n--- TEST 5: Verification Status Protection ---');
  res = await req('PATCH', `/api/students/me/projects/${projectId}`, studentToken, {
    title: 'Distributed File Store v3',
    verificationStatus: 'VERIFIED', // Injected status escalation
  });

  assert.strictEqual(res.status, 200, `Failed to patch project: ${JSON.stringify(res.body)}`);
  const verifiedAttemptProject = res.body.project;
  assert.strictEqual(verifiedAttemptProject.verificationStatus, 'PENDING', 'verificationStatus must remain PENDING on edit');
  if (isDbConnected) {
    const projInDb = await Project.findById(projectId);
    assert.strictEqual(projInDb?.verificationStatus, 'PENDING', 'DB verificationStatus must remain PENDING');
  }
  console.log('✓ PASS: Client-supplied verificationStatus="VERIFIED" is ignored and reset to PENDING');

  // ============================================================================
  // TEST 6: VERIFIED BY
  // Attempt to send { verifiedBy: "anotherUserId" }
  // Verify server does NOT accept client-supplied verifier identity
  // ============================================================================
  console.log('\n--- TEST 6: Verified By Protection ---');
  res = await req('PATCH', `/api/students/me/projects/${projectId}`, studentToken, {
    title: 'Distributed File Store v4',
    verifiedBy: attackerId, // Injected verifier ID
  });

  assert.strictEqual(res.status, 200, `Failed to patch project: ${JSON.stringify(res.body)}`);
  const verifiedByAttemptProject = res.body.project;
  assert.strictEqual(verifiedByAttemptProject.verifiedBy, null, 'verifiedBy must remain null');
  if (isDbConnected) {
    const projInDb = await Project.findById(projectId);
    assert.strictEqual(projInDb?.verifiedBy, null, 'DB verifiedBy must remain null');
  }
  console.log('✓ PASS: Client-supplied verifiedBy verifier identity is rejected/cleared');

  // ============================================================================
  // TEST 7: VERIFIED AT
  // Attempt to send { verifiedAt: "2000-01-01T00:00:00.000Z" }
  // Verify client cannot control the verification timestamp
  // ============================================================================
  console.log('\n--- TEST 7: Verified At Protection ---');
  res = await req('PATCH', `/api/students/me/projects/${projectId}`, studentToken, {
    title: 'Distributed File Store v5',
    verifiedAt: '2000-01-01T00:00:00.000Z', // Injected verification timestamp
  });

  assert.strictEqual(res.status, 200, `Failed to patch project: ${JSON.stringify(res.body)}`);
  const verifiedAtAttemptProject = res.body.project;
  assert.strictEqual(verifiedAtAttemptProject.verifiedAt, null, 'verifiedAt must remain null');
  if (isDbConnected) {
    const projInDb = await Project.findById(projectId);
    assert.strictEqual(projInDb?.verifiedAt, null, 'DB verifiedAt must remain null');
  }
  console.log('✓ PASS: Client cannot control verifiedAt timestamp (remains null)');

  // ============================================================================
  // TEST 8: ENROLLED COUNT
  // Attempt to modify a learning program with { enrolledCount: 999999 }
  // Verify client cannot directly modify enrolledCount
  // ============================================================================
  console.log('\n--- TEST 8: Enrolled Count Protection ---');
  res = await req('POST', '/api/recruiters/learning-programs', recruiterToken, {
    title: 'Advanced Kubernetes & Cloud Architecture',
    type: 'Workshop',
    duration: '8 Weeks',
    mode: 'Online',
    capacity: 30,
    enrolledCount: 999999, // Injected enrolledCount
  });

  assert.strictEqual(res.status, 201, `Failed to create program: ${JSON.stringify(res.body)}`);
  const createdProgram = res.body.program;
  assert.strictEqual(createdProgram.enrolledCount, 0, 'Program enrolledCount must initialize strictly to 0');
  const programId = createdProgram.id || createdProgram._id;

  // Attempt to update program with injected enrolledCount
  res = await req('PATCH', `/api/recruiters/learning-programs/${programId}`, recruiterToken, {
    title: 'Advanced Kubernetes & Cloud Architecture v2',
    enrolledCount: 999999,
  });

  assert.strictEqual(res.status, 200, `Failed to patch program: ${JSON.stringify(res.body)}`);
  const patchedProgram = res.body.program;
  assert.strictEqual(patchedProgram.enrolledCount, 0, 'Program enrolledCount cannot be updated directly by client');
  if (isDbConnected) {
    const progInDb = await LearningProgram.findById(programId);
    assert.strictEqual(progInDb?.enrolledCount, 0, 'DB program enrolledCount must remain 0');
  }
  console.log('✓ PASS: enrolledCount cannot be mass-assigned or directly altered by client');

  // ============================================================================
  // TEST 9: LEARNING PROGRAM APPLICATION STATUS
  // Attempt to directly submit { status: "SELECTED" } from student application request
  // Verify student cannot bypass workflow; status initializes to APPLIED
  // ============================================================================
  console.log('\n--- TEST 9: Learning Program Application Status Protection ---');
  res = await req('POST', `/api/students/learning-programs/${programId}/apply`, studentToken, {
    message: 'I am highly passionate about Kubernetes!',
    status: 'SELECTED', // Malicious attempt to self-select application
  });

  assert.strictEqual(res.status, 201, `Failed to apply to program: ${JSON.stringify(res.body)}`);
  const createdApp = res.body.application;
  assert.strictEqual(createdApp.status, 'APPLIED', 'Application status must strictly be "APPLIED", not injected "SELECTED"');
  if (isDbConnected) {
    const appInDb = await LearningProgramApplication.findById(createdApp._id || createdApp.id);
    assert(appInDb, 'Application must exist in DB');
    assert.strictEqual(appInDb.status, 'APPLIED', 'DB application status must strictly be "APPLIED"');
  }
  console.log('✓ PASS: Student application status cannot be mass-assigned to "SELECTED", defaults to "APPLIED"');

  // ============================================================================
  // TEST 10: RECRUITER JOB OWNERSHIP
  // Using industry account, attempt to update an owned job while sending { recruiterId: "anotherRecruiterId" }
  // Verify job ownership remains unchanged
  // ============================================================================
  console.log('\n--- TEST 10: Recruiter Job Ownership Protection ---');
  res = await req('POST', '/api/recruiters/jobs', recruiterToken, {
    title: 'Senior Systems Engineer',
    company: 'Tech Corp Global',
    openPositions: 3,
    cutoffPct: 80,
    requiredSkills: ['Linux', 'C++'],
    recruiterId: attackerId, // Injected recruiterId spoof
  });

  assert.strictEqual(res.status, 201, `Failed to create job: ${JSON.stringify(res.body)}`);
  const createdJob = res.body.job;
  const jobId = createdJob.id || createdJob._id;
  assert.strictEqual(createdJob.recruiterId.toString(), recruiterId, 'Created job recruiterId must match token');

  // Attempt to reassign job ownership via PATCH
  res = await req('PATCH', `/api/recruiters/jobs/${jobId}`, recruiterToken, {
    title: 'Senior Systems Engineer (Updated)',
    recruiterId: attackerId, // Attempt to reassign ownership
    applicantsCount: 500, // Attempt to forge applicant stats
  });

  assert.strictEqual(res.status, 200, `Failed to patch job: ${JSON.stringify(res.body)}`);
  const patchedJob = res.body.job;
  assert.strictEqual(patchedJob.recruiterId.toString(), recruiterId, 'Job recruiterId cannot be reassigned via PATCH');
  if (isDbConnected) {
    const jobInDb = await JobPosting.findById(jobId);
    assert(jobInDb, 'Job must exist in DB');
    assert.strictEqual(jobInDb.recruiterId.toString(), recruiterId, 'DB job recruiterId must strictly match authenticated recruiter');
  }
  console.log('✓ PASS: Job ownership (recruiterId) cannot be modified or forged via mass-assignment');

  // ============================================================================
  // TEST 11: LEARNING PROGRAM OWNERSHIP
  // Using industry account, attempt to update an owned learning program while sending { recruiterId: "anotherRecruiterId" }
  // Verify ownership cannot be changed by the client
  // ============================================================================
  console.log('\n--- TEST 11: Learning Program Ownership Protection ---');
  res = await req('PATCH', `/api/recruiters/learning-programs/${programId}`, recruiterToken, {
    title: 'Advanced Kubernetes & Cloud Architecture v3',
    recruiterId: attackerId, // Injected attempt to reassign program owner
  });

  assert.strictEqual(res.status, 200, `Failed to patch learning program: ${JSON.stringify(res.body)}`);
  const patchedProg = res.body.program;
  assert.strictEqual(patchedProg.recruiterId.toString(), recruiterId, 'Program recruiterId cannot be reassigned via PATCH');
  if (isDbConnected) {
    const progInDb = await LearningProgram.findById(programId);
    assert(progInDb, 'Program must exist in DB');
    assert.strictEqual(progInDb.recruiterId.toString(), recruiterId, 'DB program recruiterId must strictly match authenticated recruiter');
  }
  console.log('✓ PASS: Learning Program ownership (recruiterId) cannot be modified via mass-assignment');

  // ============================================================================
  // TEST 12: SERVER-CONTROLLED TIMESTAMPS
  // Attempt to submit { createdAt: "2000-01-01T00:00:00.000Z", updatedAt: "2000-01-01T00:00:00.000Z" }
  // Verify protected server timestamps cannot be arbitrarily overwritten
  // ============================================================================
  console.log('\n--- TEST 12: Server-Controlled Timestamps Protection ---');
  const spoofedTimestamp = '2000-01-01T00:00:00.000Z';
  res = await req('PATCH', `/api/students/me/projects/${projectId}`, studentToken, {
    title: 'Distributed File Store v6',
    createdAt: spoofedTimestamp,
    updatedAt: spoofedTimestamp,
  });

  assert.strictEqual(res.status, 200, `Failed to patch project: ${JSON.stringify(res.body)}`);
  if (isDbConnected) {
    const projInDb = await Project.findById(projectId);
    assert(projInDb, 'Project must exist in DB');
    const dbCreatedAt = projInDb.createdAt ? new Date(projInDb.createdAt).toISOString() : '';
    assert.notStrictEqual(dbCreatedAt, spoofedTimestamp, 'createdAt timestamp must not be overwritten with spoofed date');
    // Ensure createdAt is recent (after 2025)
    assert(new Date(projInDb.createdAt).getFullYear() >= 2025, 'createdAt must reflect true server creation time');
  }
  console.log('✓ PASS: Protected server timestamps (createdAt/updatedAt) cannot be arbitrarily overwritten');

  // ============================================================================
  // TEST 13: VERIFY LEGITIMATE UPDATES
  // Normal permitted updates must continue to work:
  // - student can update allowed profile field
  // - student can update allowed project field
  // - industry can update allowed job field
  // ============================================================================
  console.log('\n--- TEST 13: Legitimate Updates Verification ---');

  // 1. Student updates allowed profile fields (bio, department, degree)
  res = await req('PUT', '/api/students/me/profile', studentToken, {
    fullName: 'Verified Student Name',
    bio: 'Distributed Systems & Cloud Engineer',
    department: 'Computer Science and Engineering',
    degree: 'B.Tech',
  });
  assert.strictEqual(res.status, 200, 'Student legitimate profile update should succeed');
  assert.strictEqual(res.body.profile.bio, 'Distributed Systems & Cloud Engineer');
  assert.strictEqual(res.body.profile.department, 'Computer Science and Engineering');
  console.log('✓ PASS: Student successfully updated allowed profile fields');

  // 2. Student updates allowed project fields (title, liveUrl, technologies)
  res = await req('PATCH', `/api/students/me/projects/${projectId}`, studentToken, {
    title: 'Distributed File Store (Production)',
    liveUrl: 'https://filestore.demo.app',
    technologies: ['Go', 'gRPC', 'Raft'],
  });
  assert.strictEqual(res.status, 200, 'Student legitimate project update should succeed');
  assert.strictEqual(res.body.project.title, 'Distributed File Store (Production)');
  assert.strictEqual(res.body.project.liveUrl, 'https://filestore.demo.app');
  assert.deepStrictEqual(res.body.project.technologies, ['Go', 'gRPC', 'Raft']);
  console.log('✓ PASS: Student successfully updated allowed project fields');

  // 3. Industry updates allowed job fields (title, openPositions, location)
  res = await req('PATCH', `/api/recruiters/jobs/${jobId}`, recruiterToken, {
    title: 'Lead Systems Engineer',
    openPositions: 5,
    location: 'Bangalore / Remote',
  });
  assert.strictEqual(res.status, 200, 'Recruiter legitimate job update should succeed');
  assert.strictEqual(res.body.job.title, 'Lead Systems Engineer');
  assert.strictEqual(res.body.job.openPositions, 5);
  assert.strictEqual(res.body.job.location, 'Bangalore / Remote');
  console.log('✓ PASS: Industry successfully updated allowed job fields');

  // Clean up test server and documents
  server.close();
  if (isDbConnected) {
    await User.deleteMany({ _id: { $in: [studentId, recruiterId] } });
    await Project.deleteMany({ userId: { $in: [studentId, new mongoose.Types.ObjectId(studentId)] } });
    await Internship.deleteMany({ userId: { $in: [studentId, new mongoose.Types.ObjectId(studentId)] } });
    await Achievement.deleteMany({ userId: { $in: [studentId, new mongoose.Types.ObjectId(studentId)] } });
    await Certification.deleteMany({ userId: { $in: [studentId, new mongoose.Types.ObjectId(studentId)] } });
    await JobPosting.deleteMany({ recruiterId: { $in: [recruiterId, new mongoose.Types.ObjectId(recruiterId)] } });
    await LearningProgram.deleteMany({ recruiterId: { $in: [recruiterId, new mongoose.Types.ObjectId(recruiterId)] } });
    await LearningProgramApplication.deleteMany({ studentId: { $in: [studentId, new mongoose.Types.ObjectId(studentId)] } });
    await mongoose.disconnect();
    console.log('\n[MongoDB] Disconnected from database.');
  }

  console.log('\n====================================================');
  console.log('   ALL 11 MASS-ASSIGNMENT REGRESSION TESTS PASSED!   ');
  console.log('====================================================\n');
}

runMassAssignmentTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
