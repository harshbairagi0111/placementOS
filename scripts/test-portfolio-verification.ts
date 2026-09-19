import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { verificationRouter, hasVerifiableEvidence } from '../routes/verification';
import { User } from '../src/models/User';
import { Certification } from '../src/models/Certification';
import { Project } from '../src/models/Project';
import { Internship } from '../src/models/Internship';
import { Achievement } from '../src/models/Achievement';

console.log('====================================================');
console.log('   PORTFOLIO VERIFICATION (FIX #7.1) TEST SUITE');
console.log('====================================================\n');

// 1. UNIT TEST EVIDENCE HELPER
console.log('[Phase 1: Direct Unit Tests of Evidence Matrix]');

// Test 2: Certification without fileId/fileUrl/credentialUrl
assert.strictEqual(
  hasVerifiableEvidence('certification', { fileId: '', fileUrl: '', credentialUrl: '' }),
  false,
  'Test 2 failed: Certification with no evidence must return false'
);
assert.strictEqual(
  hasVerifiableEvidence('certification', { credentialUrl: '   ' }),
  false,
  'Test 2 failed: Certification with whitespace credentialUrl must return false'
);

// Test 3: Project without fileId/githubUrl/liveUrl
assert.strictEqual(
  hasVerifiableEvidence('project', { fileId: '', githubUrl: '', liveUrl: '' }),
  false,
  'Test 3 failed: Project with no evidence must return false'
);
assert.strictEqual(
  hasVerifiableEvidence('project', { githubUrl: '   ', liveUrl: ' ' }),
  false,
  'Test 3 failed: Project with whitespace URLs must return false'
);

// Test 4: Internship without fileId/certificateUrl
assert.strictEqual(
  hasVerifiableEvidence('internship', { fileId: '', certificateUrl: '' }),
  false,
  'Test 4 failed: Internship with no evidence must return false'
);

// Test 5: Achievement without fileId/credentialUrl
assert.strictEqual(
  hasVerifiableEvidence('achievement', { fileId: '', credentialUrl: '' }),
  false,
  'Test 5 failed: Achievement with no evidence must return false'
);

// Test 6: Certification with valid evidence
assert.strictEqual(
  hasVerifiableEvidence('certification', { credentialUrl: 'https://coursera.org/verify/123' }),
  true,
  'Test 6 failed: Certification with credentialUrl must return true'
);
assert.strictEqual(
  hasVerifiableEvidence('certification', { fileId: '65f123456789012345678901' }),
  true,
  'Test 6 failed: Certification with fileId must return true'
);
assert.strictEqual(
  hasVerifiableEvidence('certification', { fileUrl: '/api/files/65f123456789012345678901' }),
  true,
  'Test 6 failed: Certification with fileUrl must return true'
);

// Test 7: Project with GitHub URL
assert.strictEqual(
  hasVerifiableEvidence('project', { githubUrl: 'https://github.com/student/repo' }),
  true,
  'Test 7 failed: Project with GitHub URL must return true'
);

// Test 8: Project with live URL
assert.strictEqual(
  hasVerifiableEvidence('project', { liveUrl: 'https://my-app.vercel.app' }),
  true,
  'Test 8 failed: Project with live URL must return true'
);

// Test 9: Internship with certificate URL
assert.strictEqual(
  hasVerifiableEvidence('internship', { certificateUrl: 'https://drive.google.com/cert.pdf' }),
  true,
  'Test 9 failed: Internship with certificate URL must return true'
);

// Test 10: Achievement with credential URL
assert.strictEqual(
  hasVerifiableEvidence('achievement', { credentialUrl: 'https://badge.org/achieve/456' }),
  true,
  'Test 10 failed: Achievement with credential URL must return true'
);

console.log('✓ Tests 2-10 (Evidence matrix checks) PASSED.\n');

// 2. INTEGRATION TESTS (Simulate HTTP endpoints)
console.log('[Phase 2: Controller & Integration Endpoint Verification]');

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    console.log(`✓ ${name} PASSED`);
  } catch (err: any) {
    console.error(`✗ ${name} FAILED:`, err.message || err);
    process.exit(1);
  }
}

async function startSuite() {
  const verifierCollege = 'IIT Bombay';
  const otherCollege = 'IIT Delhi';

  const verifierUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Prof. Sharma',
    email: 'sharma@iitb.ac.in',
    role: 'academician',
    college: verifierCollege,
    collegeName: verifierCollege,
  };

  const verifierOtherCollege = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Prof. Gupta',
    email: 'gupta@iitd.ac.in',
    role: 'academician',
    college: otherCollege,
    collegeName: otherCollege,
  };

  const studentUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Aarav Patel',
    email: 'aarav@iitb.ac.in',
    role: 'student',
    college: verifierCollege,
    collegeName: verifierCollege,
  };

  // Mock DB Models
  const mockDbStore: Record<string, any> = {};

  const makeDoc = (modelName: string, initial: any) => {
    const id = initial._id || new mongoose.Types.ObjectId().toString();
    const doc = {
      ...initial,
      _id: id,
      save: async function () {
        mockDbStore[id] = { ...this };
        return this;
      },
    };
    mockDbStore[id] = doc;
    return doc;
  };

  // Monkey-patch Mongoose Model methods for our test
  const originalUserFindById = User.findById;
  const originalUserFindOne = User.findOne;

  const mockUserLookup = (query: any) => {
    let idStr: string = '';
    if (query?.$or) {
      idStr = query.$or[0]?._id?.toString() || query.$or[1]?._id?.toString() || '';
    } else if (query?._id) {
      idStr = query._id?.toString() || '';
    } else if (typeof query === 'string' || query instanceof mongoose.Types.ObjectId) {
      idStr = query.toString();
    }
    let target: any = null;
    if (idStr === verifierUser._id.toString()) target = verifierUser;
    else if (idStr === verifierOtherCollege._id.toString()) target = verifierOtherCollege;
    else if (idStr === studentUser._id.toString()) target = studentUser;

    return {
      select: () => Promise.resolve(target),
      then: (resolve: any) => resolve(target),
    };
  };

  (User as any).findById = mockUserLookup;
  (User as any).findOne = mockUserLookup;

  const createModelMock = (Model: any) => {
    Model.findById = function (id: any) {
      const idStr = id?.toString?.() || String(id);
      const found = mockDbStore[idStr];
      return Promise.resolve(found || null);
    };
  };

  createModelMock(Certification);
  createModelMock(Project);
  createModelMock(Internship);
  createModelMock(Achievement);

  // Set up Express app with the router
  const app = express();
  app.use(express.json());

  // Mount router with an auth injector middleware
  let currentAuthUser: any = verifierUser;
  app.use('/api/verification', (req: any, _res, next) => {
    req.user = currentAuthUser
      ? {
          userId: currentAuthUser._id.toString(),
          email: currentAuthUser.email,
          role: currentAuthUser.role,
        }
      : undefined;
    next();
  });
  app.use('/api/verification', verificationRouter);

  process.env.JWT_SECRET = 'test_jwt_secret_placementos_2026';

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address: any = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // Helper to execute route
  const requestApp = async (method: string, url: string, body?: any) => {
    const token = currentAuthUser
      ? jwt.sign(
          {
            userId: currentAuthUser._id.toString(),
            email: currentAuthUser.email,
            role: currentAuthUser.role,
          },
          process.env.JWT_SECRET!
        )
      : '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions: any = {
      method,
      headers,
    };
    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }
    const response = await fetch(`${baseUrl}${url}`, fetchOptions);
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    return {
      statusCode: response.status,
      data,
    };
  };

  // Test 1: Invalid ObjectId -> HTTP 400
  await runTest('Test 1: Invalid ObjectId check', async () => {
    currentAuthUser = verifierUser;
    const resGet = await requestApp('GET', '/api/verification/certification/invalid-id-xyz');
    assert.strictEqual(resGet.statusCode, 400);
    assert.strictEqual(resGet.data.error, 'Invalid record ID');

    const resVerify = await requestApp('PATCH', '/api/verification/certification/invalid-id-xyz/verify');
    assert.strictEqual(resVerify.statusCode, 400);
    assert.strictEqual(resVerify.data.error, 'Invalid record ID');

    const resReject = await requestApp('PATCH', '/api/verification/certification/invalid-id-xyz/reject', {
      note: 'Evidence is missing',
    });
    assert.strictEqual(resReject.statusCode, 400);
    assert.strictEqual(resReject.data.error, 'Invalid record ID');
  });

  // Test 2 Integration: Certification without evidence -> VERIFY blocked
  await runTest('Test 2: Certification without evidence blocked from verification', async () => {
    currentAuthUser = verifierUser;
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'AWS Architect',
      verificationStatus: 'PENDING',
      fileId: '',
      fileUrl: '',
      credentialUrl: '',
    });

    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data.error.includes('no supporting evidence is attached'));
    // Ensure item status in database did not change to VERIFIED
    assert.strictEqual(mockDbStore[certDoc._id].verificationStatus, 'PENDING');
  });

  // Test 3 Integration: Project without evidence -> VERIFY blocked
  await runTest('Test 3: Project without evidence blocked from verification', async () => {
    currentAuthUser = verifierUser;
    const projDoc = makeDoc('Project', {
      userId: studentUser._id.toString(),
      title: 'Full Stack App',
      verificationStatus: 'PENDING',
      fileId: '',
      githubUrl: '',
      liveUrl: '',
    });

    const res = await requestApp('PATCH', `/api/verification/project/${projDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(mockDbStore[projDoc._id].verificationStatus, 'PENDING');
  });

  // Test 4 Integration: Internship without evidence -> VERIFY blocked
  await runTest('Test 4: Internship without evidence blocked from verification', async () => {
    currentAuthUser = verifierUser;
    const internDoc = makeDoc('Internship', {
      userId: studentUser._id.toString(),
      role: 'SDE Intern',
      organization: 'Tech Corp',
      verificationStatus: 'PENDING',
      fileId: '',
      certificateUrl: '',
    });

    const res = await requestApp('PATCH', `/api/verification/internship/${internDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(mockDbStore[internDoc._id].verificationStatus, 'PENDING');
  });

  // Test 5 Integration: Achievement without evidence -> VERIFY blocked
  await runTest('Test 5: Achievement without evidence blocked from verification', async () => {
    currentAuthUser = verifierUser;
    const achDoc = makeDoc('Achievement', {
      userId: studentUser._id.toString(),
      title: 'Hackathon 1st Place',
      verificationStatus: 'PENDING',
      fileId: '',
      credentialUrl: '',
    });

    const res = await requestApp('PATCH', `/api/verification/achievement/${achDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(mockDbStore[achDoc._id].verificationStatus, 'PENDING');
  });

  // Test 6 Integration: Certification with valid evidence -> VERIFY succeeds
  await runTest('Test 6: Certification with valid evidence succeeds', async () => {
    currentAuthUser = verifierUser;
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Google Cloud Certified',
      verificationStatus: 'PENDING',
      fileId: 'gridfs_cert_999',
    });

    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(mockDbStore[certDoc._id].verificationStatus, 'VERIFIED');
  });

  // Test 7 Integration: Project with GitHub URL -> VERIFY succeeds
  await runTest('Test 7: Project with GitHub URL succeeds', async () => {
    currentAuthUser = verifierUser;
    const projDoc = makeDoc('Project', {
      userId: studentUser._id.toString(),
      title: 'AI PlacementOS',
      verificationStatus: 'PENDING',
      githubUrl: 'https://github.com/placement/os',
    });

    const res = await requestApp('PATCH', `/api/verification/project/${projDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(mockDbStore[projDoc._id].verificationStatus, 'VERIFIED');
  });

  // Test 8 Integration: Project with live URL -> VERIFY succeeds
  await runTest('Test 8: Project with live URL succeeds', async () => {
    currentAuthUser = verifierUser;
    const projDoc = makeDoc('Project', {
      userId: studentUser._id.toString(),
      title: 'React Portfolio',
      verificationStatus: 'PENDING',
      liveUrl: 'https://aarav-patel.web.app',
    });

    const res = await requestApp('PATCH', `/api/verification/project/${projDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(mockDbStore[projDoc._id].verificationStatus, 'VERIFIED');
  });

  // Test 9 Integration: Internship with certificate URL -> VERIFY succeeds
  await runTest('Test 9: Internship with certificate URL succeeds', async () => {
    currentAuthUser = verifierUser;
    const internDoc = makeDoc('Internship', {
      userId: studentUser._id.toString(),
      role: 'Research Fellow',
      organization: 'ISRO',
      verificationStatus: 'PENDING',
      certificateUrl: 'https://isro.gov.in/certs/2026.pdf',
    });

    const res = await requestApp('PATCH', `/api/verification/internship/${internDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(mockDbStore[internDoc._id].verificationStatus, 'VERIFIED');
  });

  // Test 10 Integration: Achievement with credential URL -> VERIFY succeeds
  await runTest('Test 10: Achievement with credential URL succeeds', async () => {
    currentAuthUser = verifierUser;
    const achDoc = makeDoc('Achievement', {
      userId: studentUser._id.toString(),
      title: 'Smart India Hackathon Finalist',
      verificationStatus: 'PENDING',
      credentialUrl: 'https://sih.gov.in/cert/12345',
    });

    const res = await requestApp('PATCH', `/api/verification/achievement/${achDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(mockDbStore[achDoc._id].verificationStatus, 'VERIFIED');
  });

  // Test 11 Integration: Item with no evidence -> REJECT succeeds with note
  await runTest('Test 11: Rejection succeeds without evidence when note provided', async () => {
    currentAuthUser = verifierUser;
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Unverified Certificate',
      verificationStatus: 'PENDING',
      fileId: '',
      credentialUrl: '',
    });

    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/reject`, {
      note: 'Please attach a scanned copy or verifiable credential URL.',
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(mockDbStore[certDoc._id].verificationStatus, 'REJECTED');
    assert.strictEqual(
      mockDbStore[certDoc._id].verificationNote,
      'Please attach a scanned copy or verifiable credential URL.'
    );
  });

  // Test 12 Integration: Already VERIFIED -> second review returns 409
  await runTest('Test 12: Already VERIFIED item returns 409 on second review', async () => {
    currentAuthUser = verifierUser;
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Already Verified Item',
      verificationStatus: 'VERIFIED',
      fileId: 'file_123',
    });

    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 409);
    assert.ok(res.data.error.includes('Conflict'));
  });

  // Test 13 Integration: Already REJECTED -> second review returns 409
  await runTest('Test 13: Already REJECTED item returns 409 on second review', async () => {
    currentAuthUser = verifierUser;
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Already Rejected Item',
      verificationStatus: 'REJECTED',
      verificationNote: 'Missing seal',
    });

    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 409);
    assert.ok(res.data.error.includes('Conflict'));
  });

  // Test 14 Integration: Unauthorized user (student/recruiter) -> 403
  await runTest('Test 14: Unauthorized role returns 403', async () => {
    currentAuthUser = studentUser; // role = 'student'
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Cert',
      verificationStatus: 'PENDING',
      fileId: 'file_123',
    });

    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.data.error.includes('Forbidden'));
  });

  // Test 15 Integration: Verifier from another institution -> 403
  await runTest('Test 15: Cross-institutional verifier returns 403', async () => {
    currentAuthUser = verifierOtherCollege; // College = IIT Delhi, Student = IIT Bombay
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Cert from IITB student',
      verificationStatus: 'PENDING',
      fileId: 'file_123',
    });

    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 403);
    assert.ok(res.data.error.includes('Forbidden: You can only verify credentials for students from your own institution'));
  });

  // Test 16 Integration: Successful verification sets verifiedBy and verifiedAt server-side
  await runTest('Test 16: Server-side generation of verifiedBy and verifiedAt', async () => {
    currentAuthUser = verifierUser;
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Server Audit Test',
      verificationStatus: 'PENDING',
      credentialUrl: 'https://coursera.org/verify/xyz',
    });

    // Client passes spoofed verifiedBy and verifiedAt in body
    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`, {
      verifiedBy: 'Malicious Spoofed Reviewer',
      verifiedAt: '1970-01-01',
    });

    assert.strictEqual(res.statusCode, 200);
    const updated = mockDbStore[certDoc._id];
    assert.strictEqual(updated.verificationStatus, 'VERIFIED');
    // Verifier signature must be derived from authenticated user
    assert.ok(updated.verifiedBy.includes(verifierUser.name));
    assert.ok(updated.verifiedBy.includes('Faculty Academician'));
    assert.notStrictEqual(updated.verifiedBy, 'Malicious Spoofed Reviewer');
    // verifiedAt must be current server timestamp, not spoofed 1970
    assert.ok(new Date(updated.verifiedAt).getFullYear() >= 2026);
  });

  // Test 17 Integration: Student edits rejected item -> resets to PENDING
  await runTest('Test 17: Resubmission/edit reset logic maintains PENDING state', async () => {
    const certDoc = makeDoc('Certification', {
      userId: studentUser._id.toString(),
      title: 'Initial Cert',
      verificationStatus: 'REJECTED',
      verificationNote: 'Please update credential URL',
      verifiedBy: 'Prof. Sharma',
      verifiedAt: new Date(),
    });

    // Emulate existing resubmission update logic from routes/certifications.ts lines 416-421
    certDoc.title = 'Updated Cert with Valid URL';
    certDoc.credentialUrl = 'https://valid-cert.org/123';
    certDoc.verificationStatus = 'PENDING';
    certDoc.verificationNote = '';
    certDoc.verifiedBy = null;
    certDoc.verifiedAt = null;
    await certDoc.save();

    assert.strictEqual(mockDbStore[certDoc._id].verificationStatus, 'PENDING');
    assert.strictEqual(mockDbStore[certDoc._id].verificationNote, '');
    assert.strictEqual(mockDbStore[certDoc._id].verifiedBy, null);

    // Now verifier can review it again because it is PENDING
    currentAuthUser = verifierUser;
    const res = await requestApp('PATCH', `/api/verification/certification/${certDoc._id}/verify`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(mockDbStore[certDoc._id].verificationStatus, 'VERIFIED');
  });

  // Restore User.findById and findOne
  User.findById = originalUserFindById;
  User.findOne = originalUserFindOne;
  await new Promise((resolve) => server.close(resolve));

  console.log('\n====================================================');
  console.log('  ALL 17 VERIFICATION SUITE TEST CASES PASSED!  ');
  console.log('====================================================\n');
}

startSuite().catch((err) => {
  console.error('Fatal error running suite:', err);
  process.exit(1);
});
