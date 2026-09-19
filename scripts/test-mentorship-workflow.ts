import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import express from 'express';
import bcrypt from 'bcryptjs';
import { mentorshipRouter } from '../routes/mentorship';
import { User } from '../src/models/User';
import { MentorshipRequest } from '../src/models/MentorshipRequest';
import { connectDB } from '../src/db/db';

console.log('====================================================');
console.log('   MENTORSHIP WORKFLOW (FIX #8) TEST SUITE');
console.log('====================================================\n');

async function runTests() {
  await connectDB();
  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-placementos';
  process.env.JWT_SECRET = JWT_SECRET;

  // Set up test express server with the mentorshipRouter
  const app = express();
  app.use(express.json());
  app.use('/api/mentorship', mentorshipRouter);
  app.use('/api', mentorshipRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[Setup] Test server running on ${baseUrl}`);

  // Helper for requests
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

  // Create isolated test users
  const testStudentEmail = `test.student.${Date.now()}@test.edu`;
  const testMentor1Email = `test.mentor1.${Date.now()}@faculty.edu`;
  const testMentor2Email = `test.mentor2.${Date.now()}@faculty.edu`;
  const testUnavailableMentorEmail = `test.unavail.${Date.now()}@faculty.edu`;

  const hashedPw = await bcrypt.hash('Test@1234', 8);

  const testStudent = await User.create({
    name: 'Alice Student',
    email: testStudentEmail,
    password: hashedPw,
    role: 'student',
    college: 'Apex Institute of Technology',
    degree: 'B.Tech CSE',
    targetRole: 'Cloud Architect',
    skills: ['Node.js', 'React', 'TypeScript'],
  });

  const testMentor1 = await User.create({
    name: 'Dr. John Mentor',
    email: testMentor1Email,
    password: hashedPw,
    role: 'academician',
    college: 'Apex Institute of Technology',
    department: 'Computer Science',
    designation: 'Professor',
    isMentorAvailable: true,
    mentorAreas: ['Distributed Systems', 'Cloud Architecture'],
    mentorshipTypes: ['Live Projects', 'Research Projects'],
    skills: ['Kubernetes', 'Go', 'Distributed Systems'],
    bio: 'Distributed systems researcher with 15+ years experience.',
  });

  const testMentor2 = await User.create({
    name: 'Dr. Sarah Smith',
    email: testMentor2Email,
    password: hashedPw,
    role: 'academician',
    college: 'Apex Institute of Technology',
    department: 'Artificial Intelligence',
    designation: 'Associate Professor',
    isMentorAvailable: true,
    mentorAreas: ['Machine Learning & AI', 'Computer Vision'],
    mentorshipTypes: ['Innovation Challenges'],
    skills: ['PyTorch', 'Computer Vision'],
  });

  const testUnavailableMentor = await User.create({
    name: 'Dr. Busy Faculty',
    email: testUnavailableMentorEmail,
    password: hashedPw,
    role: 'academician',
    college: 'Apex Institute of Technology',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    isMentorAvailable: false,
    mentorAreas: ['Databases'],
  });

  const studentToken = jwt.sign(
    { userId: testStudent._id.toString(), email: testStudent.email, role: testStudent.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const mentor1Token = jwt.sign(
    { userId: testMentor1._id.toString(), email: testMentor1.email, role: testMentor1.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const mentor2Token = jwt.sign(
    { userId: testMentor2._id.toString(), email: testMentor2.email, role: testMentor2.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    console.log('\n[Phase 1: Mentor Discovery & Filtering]');

    // Test 1: Discover mentors (only isMentorAvailable: true)
    const discRes = await makeRequest('GET', '/api/mentors', null, studentToken);
    assert.strictEqual(discRes.status, 200, 'GET /api/mentors must return 200');
    assert.strictEqual(discRes.body.success, true);
    assert(Array.isArray(discRes.body.mentors), 'mentors must be an array');
    
    // Ensure unavailable mentor is excluded from default discovery
    const hasUnavailable = discRes.body.mentors.some(
      (m: any) => m.id === testUnavailableMentor._id.toString()
    );
    assert.strictEqual(hasUnavailable, false, 'Unavailable mentor must not appear in default discovery');

    // Ensure email, password, and sensitive tokens are NOT exposed
    for (const m of discRes.body.mentors) {
      assert.strictEqual(m.email, undefined, 'Mentor email must not be exposed in public discovery');
      assert.strictEqual(m.password, undefined, 'Password must never be exposed in mentor discovery');
      assert.strictEqual(m.passwordHash, undefined, 'PasswordHash must never be exposed in mentor discovery');
      assert.strictEqual(m.tokens, undefined, 'Tokens must never be exposed in mentor discovery');
    }
    console.log('✓ Test 1: Default mentor discovery filters by isMentorAvailable and excludes email/password/sensitive data');

    // Test 2: Search mentors by name
    const searchRes = await makeRequest('GET', '/api/mentors?search=John', null, studentToken);
    assert.strictEqual(searchRes.status, 200);
    const foundJohn = searchRes.body.mentors.some((m: any) => m.id === testMentor1._id.toString());
    assert.strictEqual(foundJohn, true, 'Search by name "John" must return Dr. John Mentor');
    console.log('✓ Test 2: Search by mentor name works');

    // Test 3: Filter by Department
    const deptRes = await makeRequest('GET', '/api/mentors?department=Artificial%20Intelligence', null, studentToken);
    assert.strictEqual(deptRes.status, 200);
    const foundSarah = deptRes.body.mentors.some((m: any) => m.id === testMentor2._id.toString());
    assert.strictEqual(foundSarah, true, 'Department filter must return Dr. Sarah Smith');
    console.log('✓ Test 3: Filter by department works');

    // Test 4: Filter by Expertise / Mentor Area
    const expRes = await makeRequest('GET', '/api/mentors?expertise=Distributed%20Systems', null, studentToken);
    assert.strictEqual(expRes.status, 200);
    const foundDist = expRes.body.mentors.some((m: any) => m.id === testMentor1._id.toString());
    assert.strictEqual(foundDist, true, 'Expertise filter must return mentor with Distributed Systems');
    console.log('✓ Test 4: Filter by expertise/mentorArea works');

    // Test 5: Single mentor detail
    const detailRes = await makeRequest('GET', `/api/mentors/${testMentor1._id}`, null, studentToken);
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailRes.body.mentor.name, 'Dr. John Mentor');
    assert.strictEqual(detailRes.body.mentor.email, undefined, 'Mentor email must not be exposed in detail');
    assert.strictEqual(detailRes.body.mentor.password, undefined);
    assert.strictEqual(detailRes.body.mentor.passwordHash, undefined);
    assert.strictEqual(typeof detailRes.body.mentor.activeMenteesCount, 'number');
    console.log('✓ Test 5: Single mentor detail endpoint works with safe projections (no email/credentials)');

    console.log('\n[Phase 2: Mentorship Request Creation & Protections]');

    // Test 6: Unauthorized or invalid role cannot create request
    const mentorCreateRes = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      { mentorId: testMentor2._id.toString(), message: 'Hello' },
      mentor1Token // academician role
    );
    assert.strictEqual(mentorCreateRes.status, 403, 'Non-student role must be rejected with 403');
    console.log('✓ Test 6: Role enforcement: only students can create mentorship requests');

    // Test 7: Request to unavailable mentor is rejected
    const unavailReqRes = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      { mentorId: testUnavailableMentor._id.toString(), message: 'Need mentorship in databases' },
      studentToken
    );
    assert.strictEqual(unavailReqRes.status, 400, 'Request to unavailable mentor must return 400');
    console.log('✓ Test 7: Request to unavailable mentor is blocked with 400');

    // Test 8: Empty message is rejected
    const emptyMsgRes = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      { mentorId: testMentor1._id.toString(), message: '   ' },
      studentToken
    );
    assert.strictEqual(emptyMsgRes.status, 400, 'Empty message must return 400');
    console.log('✓ Test 8: Validation: empty request message is blocked');

    // Test 9: Student creates valid request -> PENDING
    const validReqRes = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      {
        mentorId: testMentor1._id.toString(),
        message: 'I would love your mentorship on building high-scale distributed queues and cloud microservices.',
        mentorshipArea: 'Distributed Systems',
      },
      studentToken
    );
    assert.strictEqual(validReqRes.status, 201, 'Valid request creation must return 201');
    assert.strictEqual(validReqRes.body.success, true);
    assert.strictEqual(validReqRes.body.request.status, 'PENDING');
    assert.strictEqual(validReqRes.body.request.studentId, testStudent._id.toString());
    const createdRequestId = validReqRes.body.request.id;
    console.log('✓ Test 9: Valid request creation succeeds and initializes with status PENDING');

    // Test 10: Duplicate PENDING request protection
    const dupRes = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      {
        mentorId: testMentor1._id.toString(),
        message: 'Second duplicate request attempt',
      },
      studentToken
    );
    assert.strictEqual(dupRes.status, 409, 'Duplicate pending request must return 409 Conflict');
    console.log('✓ Test 10: Duplicate active request protection blocks second PENDING request with 409');

    // Test 11: Student views their own requests
    const myReqRes = await makeRequest('GET', '/api/mentorship/requests/my', null, studentToken);
    assert.strictEqual(myReqRes.status, 200);
    assert.strictEqual(myReqRes.body.success, true);
    assert(Array.isArray(myReqRes.body.requests));
    assert.strictEqual(myReqRes.body.requests.length, 1);
    assert.strictEqual(myReqRes.body.requests[0].mentor.name, 'Dr. John Mentor');
    assert.strictEqual(myReqRes.body.requests[0].mentor.email, undefined, 'Mentor email must not be exposed to student in request tracking');
    assert.strictEqual(myReqRes.body.requests[0].status, 'PENDING');
    console.log('✓ Test 11: Student can view their own requests with populated mentor info (no email)');

    console.log('\n[Phase 3: Mentor Request Management & Ownership Security]');

    // Test 12: Mentor 1 sees incoming request
    const incomingRes = await makeRequest('GET', '/api/mentorship/requests/incoming', null, mentor1Token);
    assert.strictEqual(incomingRes.status, 200);
    assert.strictEqual(incomingRes.body.requests.length, 1);
    assert.strictEqual(incomingRes.body.requests[0].student.name, 'Alice Student');
    assert.strictEqual(incomingRes.body.requests[0].student.email, testStudentEmail, 'Authorized mentor sees student email for PENDING request');
    assert.strictEqual(incomingRes.body.requests[0].student.phone, undefined, 'Student phone must not be exposed in incoming requests');
    assert.strictEqual(incomingRes.body.requests[0].student.password, undefined);
    assert.strictEqual(incomingRes.body.requests[0].id, createdRequestId);
    console.log('✓ Test 12: Assigned mentor sees incoming request with student details & email (no phone/credentials)');

    // Test 13: Mentor 2 CANNOT see Mentor 1's request
    const mentor2IncomingRes = await makeRequest('GET', '/api/mentorship/requests/incoming', null, mentor2Token);
    assert.strictEqual(mentor2IncomingRes.status, 200);
    assert.strictEqual(mentor2IncomingRes.body.requests.length, 0, 'Mentor 2 must not see Mentor 1 requests');
    console.log('✓ Test 13: Isolation: Mentor 2 cannot see Mentor 1 incoming requests');

    // Test 14: Mentor 2 CANNOT accept Mentor 1's request (ownership check)
    const unauthorizedAcceptRes = await makeRequest(
      'PATCH',
      `/api/mentorship/requests/${createdRequestId}/accept`,
      { responseNote: 'Sneaky accept attempt' },
      mentor2Token
    );
    assert.strictEqual(unauthorizedAcceptRes.status, 403, 'Unauthorized mentor accept must return 403');
    console.log('✓ Test 14: Ownership check: Unauthorized mentor cannot accept another mentor request (403)');

    // Test 15: Mentor 1 accepts the request (PENDING -> ACCEPTED)
    const acceptRes = await makeRequest(
      'PATCH',
      `/api/mentorship/requests/${createdRequestId}/accept`,
      { responseNote: 'Welcome Alice! Happy to guide your distributed systems journey.' },
      mentor1Token
    );
    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.body.success, true);
    assert.strictEqual(acceptRes.body.request.status, 'ACCEPTED');
    assert.strictEqual(acceptRes.body.request.responseNote, 'Welcome Alice! Happy to guide your distributed systems journey.');
    console.log('✓ Test 15: Mentor accepts request (status transitions to ACCEPTED with responseNote)');

    // Test 16: Status transition protection: already ACCEPTED request cannot be accepted or rejected again
    const reAcceptRes = await makeRequest(
      'PATCH',
      `/api/mentorship/requests/${createdRequestId}/accept`,
      {},
      mentor1Token
    );
    assert.strictEqual(reAcceptRes.status, 409, 'Re-accepting already accepted request must return 409');

    const rejectAcceptedRes = await makeRequest(
      'PATCH',
      `/api/mentorship/requests/${createdRequestId}/reject`,
      {},
      mentor1Token
    );
    assert.strictEqual(rejectAcceptedRes.status, 409, 'Rejecting an already accepted request must return 409');
    console.log('✓ Test 16: Status transition protection: processed request cannot be re-processed (409 Conflict)');

    // Test 17: Duplicate request protection for ACCEPTED relationship
    const dupAcceptedRes = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      {
        mentorId: testMentor1._id.toString(),
        message: 'Another request after already accepted',
      },
      studentToken
    );
    assert.strictEqual(dupAcceptedRes.status, 409, 'Duplicate request to already accepted mentor must return 409');
    console.log('✓ Test 17: Duplicate protection blocks request when student is already an active mentee (409)');

    // Test 18: Student sees mentor in "My Mentors"
    const myMentorsRes = await makeRequest('GET', '/api/mentorship/requests/my', null, studentToken);
    assert.strictEqual(myMentorsRes.status, 200);
    assert.strictEqual(myMentorsRes.body.activeMentors.length, 1);
    assert.strictEqual(myMentorsRes.body.activeMentors[0].mentor.name, 'Dr. John Mentor');
    console.log('✓ Test 18: Student sees accepted mentor in activeMentors list');

    // Test 19: Mentor sees student in "My Mentees"
    const menteesRes = await makeRequest('GET', '/api/mentorship/my-mentees', null, mentor1Token);
    assert.strictEqual(menteesRes.status, 200);
    assert.strictEqual(menteesRes.body.mentees.length, 1);
    assert.strictEqual(menteesRes.body.mentees[0].student.name, 'Alice Student');
    assert.strictEqual(menteesRes.body.mentees[0].student.email, testStudentEmail, 'Authorized mentor sees student email for ACCEPTED mentorship');
    assert.strictEqual(menteesRes.body.mentees[0].student.phone, undefined, 'Student phone must not be exposed in mentees list');
    assert.strictEqual(menteesRes.body.mentees[0].student.password, undefined);
    assert.strictEqual(menteesRes.body.mentees[0].status, 'ACCEPTED');
    console.log('✓ Test 19: Mentor sees student in /api/mentorship/my-mentees with student email (no phone/credentials)');

    console.log('\n[Phase 4: Rejection Workflow]');

    // Test 20: Create second request to Mentor 2 and reject it
    const req2Res = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      {
        mentorId: testMentor2._id.toString(),
        message: 'Requesting AI computer vision mentorship',
        mentorshipArea: 'Computer Vision',
      },
      studentToken
    );
    assert.strictEqual(req2Res.status, 201);
    const req2Id = req2Res.body.request.id;

    const rejectRes = await makeRequest(
      'PATCH',
      `/api/mentorship/requests/${req2Id}/reject`,
      { responseNote: 'Currently at full research capacity this term.' },
      mentor2Token
    );
    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.request.status, 'REJECTED');
    assert.strictEqual(rejectRes.body.request.responseNote, 'Currently at full research capacity this term.');
    console.log('✓ Test 20: Mentor rejects request with note (status transitions to REJECTED)');

    console.log('\n[Phase 5: Concurrency & Atomic State Transitions]');

    // Test 21: Concurrency race condition protection (accept vs reject)
    // Simulate two simultaneous attempts to process the exact same PENDING request
    const req3Res = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      {
        mentorId: testMentor2._id.toString(),
        message: 'Requesting mentorship for concurrency stress test',
        mentorshipArea: 'Machine Learning',
      },
      studentToken
    );
    assert.strictEqual(req3Res.status, 201);
    const req3Id = req3Res.body.request.id;

    // Trigger concurrent accept and reject on the same request
    const [raceRes1, raceRes2] = await Promise.all([
      makeRequest('PATCH', `/api/mentorship/requests/${req3Id}/accept`, { responseNote: 'Race Accept' }, mentor2Token),
      makeRequest('PATCH', `/api/mentorship/requests/${req3Id}/reject`, { responseNote: 'Race Reject' }, mentor2Token),
    ]);

    const raceStatuses = [raceRes1.status, raceRes2.status];
    assert(
      raceStatuses.includes(200) && raceStatuses.includes(409),
      `Concurrent accept/reject must resolve to exactly one 200 and one 409, got: ${raceStatuses.join(', ')}`
    );

    // Verify DB consistency: exactly one terminal status in MongoDB
    const finalReq3 = await MentorshipRequest.findById(req3Id).lean();
    assert(finalReq3, 'Request 3 must exist in DB');
    assert(
      finalReq3.status === 'ACCEPTED' || finalReq3.status === 'REJECTED',
      'Final status must be a valid single terminal state'
    );
    console.log(`✓ Test 21: Concurrency protection verified: exactly 1 succeeded (200) and 1 conflicted (409). Terminal state: ${finalReq3.status}`);

    // Test 22: Concurrency race condition protection (double accept)
    // Clean up prior requests to testMentor2 so a fresh request can be created
    await MentorshipRequest.deleteMany({ studentId: testStudent._id, mentorId: testMentor2._id });

    const req4Res = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      {
        mentorId: testMentor2._id.toString(),
        message: 'Second concurrency test with double accept attempt',
        mentorshipArea: 'Robotics',
      },
      studentToken
    );
    assert.strictEqual(req4Res.status, 201);
    const req4Id = req4Res.body.request.id;

    const [doubleAccept1, doubleAccept2] = await Promise.all([
      makeRequest('PATCH', `/api/mentorship/requests/${req4Id}/accept`, { responseNote: 'Accept First' }, mentor2Token),
      makeRequest('PATCH', `/api/mentorship/requests/${req4Id}/accept`, { responseNote: 'Accept Second' }, mentor2Token),
    ]);

    const doubleStatuses = [doubleAccept1.status, doubleAccept2.status];
    assert(
      doubleStatuses.includes(200) && doubleStatuses.includes(409),
      `Double accept must resolve to exactly one 200 and one 409, got: ${doubleStatuses.join(', ')}`
    );

    const finalReq4 = await MentorshipRequest.findById(req4Id).lean();
    assert(finalReq4 && finalReq4.status === 'ACCEPTED', 'Final status must be ACCEPTED');
    console.log('✓ Test 22: Atomic double-accept concurrency verified: exactly 1 succeeded (200) and 1 conflicted (409)');

    console.log('\n[Phase 5: Context-Aware Mentorship Privacy (Fix #8.2)]');

    // Test 23: Public/general discovery endpoints do not expose student email or private data
    const publicMentorList = await makeRequest('GET', '/api/mentors', null, studentToken);
    assert.strictEqual(publicMentorList.status, 200);
    for (const mentor of publicMentorList.body.mentors) {
      assert.strictEqual(mentor.email, undefined, 'Public mentor listing must not expose mentor email');
      assert.strictEqual(mentor.password, undefined);
    }
    console.log('✓ Test 23: Public discovery privacy: Mentor discovery does not expose email or private credentials');

    // Create a fresh student and pending request for rigorous context-aware testing
    const testStudent2Email = `test.student2.${Date.now()}@test.edu`;
    const testStudent2 = await User.create({
      name: 'Bob Candidate',
      email: testStudent2Email,
      password: hashedPw,
      role: 'student',
      college: 'Apex Institute of Technology',
      degree: 'B.Tech IT',
      targetRole: 'Site Reliability Engineer',
      skills: ['Docker', 'Linux', 'Go'],
    });

    const student2Token = jwt.sign(
      { userId: testStudent2._id.toString(), email: testStudent2.email, role: testStudent2.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Student 2 creates a request to Mentor 1
    const s2ReqRes = await makeRequest(
      'POST',
      '/api/mentorship/requests',
      {
        mentorId: testMentor1._id.toString(),
        message: 'Hello Dr. John, I would appreciate your mentorship on distributed systems.',
        mentorshipArea: 'Distributed Systems',
      },
      student2Token
    );
    assert.strictEqual(s2ReqRes.status, 201);
    const s2RequestId = s2ReqRes.body.request.id;

    // Test 24: Authorized pending mentor CAN see student email via GET /api/mentorship/requests/:requestId
    const pendingReqByMentor1 = await makeRequest(
      'GET',
      `/api/mentorship/requests/${s2RequestId}`,
      null,
      mentor1Token
    );
    assert.strictEqual(pendingReqByMentor1.status, 200);
    assert.strictEqual(
      pendingReqByMentor1.body.request.student.email,
      testStudent2Email,
      'Authorized mentor MUST see student email for pending mentorship request'
    );
    assert.strictEqual(pendingReqByMentor1.body.request.student.password, undefined);
    console.log('✓ Test 24: Context-aware access: Authorized pending mentor CAN see student email for contact');

    // Test 25: Unrelated mentor (Mentor 2) CANNOT see Student 2 request or email (403 Forbidden)
    const pendingReqByUnrelatedMentor = await makeRequest(
      'GET',
      `/api/mentorship/requests/${s2RequestId}`,
      null,
      mentor2Token
    );
    assert.strictEqual(
      pendingReqByUnrelatedMentor.status,
      403,
      'Unrelated mentor must receive 403 Forbidden when requesting another mentor request details'
    );
    console.log('✓ Test 25: Unauthorized isolation: Unrelated mentor receives 403 Forbidden on request details');

    // Test 26: Unrelated mentor CANNOT access Student 2 profile via GET /api/mentorship/students/:studentId
    const unrelatedStudentProfileLookup = await makeRequest(
      'GET',
      `/api/mentorship/students/${testStudent2._id.toString()}`,
      null,
      mentor2Token
    );
    assert.strictEqual(
      unrelatedStudentProfileLookup.status,
      403,
      'Unrelated mentor without mentorship relationship must receive 403 Forbidden'
    );
    console.log('✓ Test 26: Contact isolation: Unrelated mentor CANNOT query student contact profile (403 Forbidden)');

    // Test 27: Authorized mentor CAN access student profile via GET /api/mentorship/students/:studentId
    const authorizedStudentProfileLookup = await makeRequest(
      'GET',
      `/api/mentorship/students/${testStudent2._id.toString()}`,
      null,
      mentor1Token
    );
    assert.strictEqual(authorizedStudentProfileLookup.status, 200);
    assert.strictEqual(
      authorizedStudentProfileLookup.body.student.email,
      testStudent2Email,
      'Authorized mentor MUST see student email via student profile endpoint'
    );
    assert.strictEqual(authorizedStudentProfileLookup.body.student.password, undefined);
    console.log('✓ Test 27: Legitimate relationship: Authorized mentor CAN query student profile with email');

    // Test 28: Student 2 self-access: student can view their own request with their own email
    const student2SelfView = await makeRequest(
      'GET',
      `/api/mentorship/requests/${s2RequestId}`,
      null,
      student2Token
    );
    assert.strictEqual(student2SelfView.status, 200);
    assert.strictEqual(
      student2SelfView.body.request.student.email,
      testStudent2Email,
      'Student must always be able to view their own email'
    );
    assert.strictEqual(
      student2SelfView.body.request.mentor.email,
      undefined,
      'Student request view must not expose mentor email'
    );
    console.log('✓ Test 28: Student self-access: Student can see their own email but not mentor email');

    // Test 29: Post-acceptance visibility: Mentor accepts Student 2 request and still has email access
    const acceptS2Res = await makeRequest(
      'PATCH',
      `/api/mentorship/requests/${s2RequestId}/accept`,
      { responseNote: 'Accepted! Welcome to the lab.' },
      mentor1Token
    );
    assert.strictEqual(acceptS2Res.status, 200);

    const acceptedReqView = await makeRequest(
      'GET',
      `/api/mentorship/requests/${s2RequestId}`,
      null,
      mentor1Token
    );
    assert.strictEqual(acceptedReqView.status, 200);
    assert.strictEqual(
      acceptedReqView.body.request.student.email,
      testStudent2Email,
      'Authorized mentor MUST see student email for accepted mentorship request'
    );
    console.log('✓ Test 29: Accepted relationship: Authorized mentor continues to see student email');

    // Clean up student 2 test data
    await MentorshipRequest.deleteMany({ studentId: testStudent2._id });
    await User.deleteOne({ _id: testStudent2._id });

    console.log('\n====================================================');
    console.log('   ALL 29 MENTORSHIP WORKFLOW TESTS PASSED!   ');
    console.log('====================================================\n');
  } finally {
    // Clean up test data
    await MentorshipRequest.deleteMany({
      $or: [
        { studentId: testStudent._id },
        { mentorId: testMentor1._id },
        { mentorId: testMentor2._id },
      ],
    });
    await User.deleteMany({
      _id: {
        $in: [
          testStudent._id,
          testMentor1._id,
          testMentor2._id,
          testUnavailableMentor._id,
        ],
      },
    });
    server.close();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
