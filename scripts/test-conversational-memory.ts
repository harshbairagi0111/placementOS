import assert from 'assert';
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Conversation, IConversation } from '../src/models/Conversation';
import { Message, IMessage } from '../src/models/Message';
import { StudentMemory, IStudentMemory } from '../src/models/StudentMemory';
import { KnowledgeChunk } from '../src/models/KnowledgeChunk';
import {
  createConversation,
  listStudentConversations,
  getConversation,
  addMessage,
  getMessages,
  deleteConversation,
  DEFAULT_MESSAGES_LIMIT,
  MAX_MESSAGES_LIMIT,
  MAX_MESSAGE_CONTENT_LENGTH,
} from '../src/services/conversationService';
import {
  normalizeMemoryKey,
  validateMemoryCategory,
  validateMemoryConfidence,
  getStudentMemories,
  getStudentMemory,
  upsertStudentMemory,
  deleteStudentMemory,
} from '../src/services/memoryService';
import { retrieveRelevantKnowledge } from '../src/services/hybridRetrievalService';
import { conversationsRouter } from '../routes/conversations';
import { studentMemoryRouter } from '../routes/studentMemory';
import { getJwtSecret } from '../routes/securityConfig';
import { connectDB } from '../src/db/db';

dotenv.config();

console.log('====================================================');
console.log('  CONVERSATIONAL & STUDENT MEMORY (FIX #11.3) TESTS ');
console.log('====================================================\n');

async function runConversationalMemoryTests() {
  await connectDB();

  const studentAId = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();
  const recruiterId = new mongoose.Types.ObjectId().toString();

  const jwtSecret = getJwtSecret();
  const tokenStudentA = jwt.sign(
    { userId: studentAId, email: 'studentA@example.com', role: 'student' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  const tokenStudentB = jwt.sign(
    { userId: studentBId, email: 'studentB@example.com', role: 'student' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  const tokenRecruiter = jwt.sign(
    { userId: recruiterId, email: 'recruiter@example.com', role: 'recruiter' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  // Set up Express server with the mounted routes
  const app = express();
  app.use(express.json());
  app.use('/api/conversations', conversationsRouter);
  app.use('/api/student-memory', studentMemoryRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // ----------------------------------------------------
    // TEST 1: Student can create conversation
    // ----------------------------------------------------
    console.log('--- TEST 1: Student can create conversation ---');
    const convA = await createConversation(studentAId, {
      title: 'DSA Preparation Session',
      assistantType: 'ai_mentor',
    });
    assert.ok(convA._id, 'Conversation should have an _id');
    assert.strictEqual(convA.studentId.toString(), studentAId);
    assert.strictEqual(convA.title, 'DSA Preparation Session');
    assert.strictEqual(convA.assistantType, 'ai_mentor');
    assert.ok(convA.lastMessageAt);
    console.log('✓ PASS: Test 1 — Conversation created successfully.\n');

    // ----------------------------------------------------
    // TEST 2: Student can list only their own conversations
    // ----------------------------------------------------
    console.log('--- TEST 2: Student lists only own conversations ---');
    // Create conversation for student B
    const convB = await createConversation(studentBId, {
      title: 'Student B Mock Interview',
      assistantType: 'mock_interview',
    });

    const listA = await listStudentConversations(studentAId);
    assert.ok(listA.length >= 1);
    assert.ok(listA.every((c) => c.studentId.toString() === studentAId));
    assert.ok(!listA.some((c) => c._id.toString() === convB._id.toString()));
    console.log('✓ PASS: Test 2 — Listing strictly filters by authenticated student.\n');

    // ----------------------------------------------------
    // TEST 3: Student can retrieve own conversation
    // ----------------------------------------------------
    console.log('--- TEST 3: Student can retrieve own conversation ---');
    const fetchedConv = await getConversation(studentAId, convA._id.toString());
    assert.ok(fetchedConv);
    assert.strictEqual(fetchedConv._id.toString(), convA._id.toString());
    console.log('✓ PASS: Test 3 — Student retrieved own conversation successfully.\n');

    // ----------------------------------------------------
    // TEST 4: Student cannot retrieve another student's conversation
    // ----------------------------------------------------
    console.log('--- TEST 4: Student cannot retrieve another student\'s conversation ---');
    const crossFetch = await getConversation(studentAId, convB._id.toString());
    assert.strictEqual(crossFetch, null, 'Cross-student fetch must return null');

    // Via HTTP API
    const httpCrossRes = await fetch(`${baseUrl}/api/conversations/${convB._id}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.strictEqual(httpCrossRes.status, 403, 'Cross-student access via API must return 403');
    console.log('✓ PASS: Test 4 — Cross-student conversation fetch is blocked.\n');

    // ----------------------------------------------------
    // TEST 5: Student cannot append to another student's conversation
    // ----------------------------------------------------
    console.log('--- TEST 5: Student cannot append to another student\'s conversation ---');
    await assert.rejects(
      async () => {
        await addMessage(studentAId, convB._id.toString(), {
          role: 'user',
          content: 'Sneaky cross-student message',
        });
      },
      (err: any) => err.message.includes('not found') || err.message.includes('denied'),
      'Student A must not append to Student B conversation'
    );

    const httpAppendRes = await fetch(`${baseUrl}/api/conversations/${convB._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ role: 'user', content: 'HTTP cross append attempt' }),
    });
    assert.strictEqual(httpAppendRes.status, 403, 'HTTP cross append must return 403');
    console.log('✓ PASS: Test 5 — Cross-student message appending blocked.\n');

    // ----------------------------------------------------
    // TEST 6: Messages are ordered chronologically
    // ----------------------------------------------------
    console.log('--- TEST 6: Messages ordered chronologically ---');
    const msg1 = await addMessage(studentAId, convA._id.toString(), {
      role: 'user',
      content: 'First question on binary search',
    });
    // Wait slightly to ensure distinct timestamps
    await new Promise((r) => setTimeout(r, 15));
    const msg2 = await addMessage(studentAId, convA._id.toString(), {
      role: 'assistant',
      content: 'Binary search requires a sorted collection.',
    });
    await new Promise((r) => setTimeout(r, 15));
    const msg3 = await addMessage(studentAId, convA._id.toString(), {
      role: 'user',
      content: 'How about time complexity?',
    });

    const messages = await getMessages(studentAId, convA._id.toString());
    assert.strictEqual(messages.length, 3);
    assert.strictEqual(messages[0]._id.toString(), msg1._id.toString());
    assert.strictEqual(messages[1]._id.toString(), msg2._id.toString());
    assert.strictEqual(messages[2]._id.toString(), msg3._id.toString());
    assert.ok(messages[0].createdAt.getTime() <= messages[1].createdAt.getTime());
    assert.ok(messages[1].createdAt.getTime() <= messages[2].createdAt.getTime());
    console.log('✓ PASS: Test 6 — Messages ordered chronologically.\n');

    // ----------------------------------------------------
    // TEST 7: Message pagination respects maximum limits
    // ----------------------------------------------------
    console.log('--- TEST 7: Message pagination respects maximum limits ---');
    const paged1 = await getMessages(studentAId, convA._id.toString(), { limit: 2 });
    assert.strictEqual(paged1.length, 2, 'Limit 2 must return 2 messages');

    const pagedZero = await getMessages(studentAId, convA._id.toString(), { limit: 0 });
    assert.strictEqual(pagedZero.length, 0, 'Limit 0 must return 0 messages');

    assert.strictEqual(DEFAULT_MESSAGES_LIMIT, 50);
    assert.strictEqual(MAX_MESSAGES_LIMIT, 100);
    console.log('✓ PASS: Test 7 — Message pagination limits enforced.\n');

    // ----------------------------------------------------
    // TEST 8: Conversation lastMessageAt updates
    // ----------------------------------------------------
    console.log('--- TEST 8: Conversation lastMessageAt updates ---');
    const updatedConv = await getConversation(studentAId, convA._id.toString());
    assert.ok(updatedConv);
    assert.ok(
      updatedConv.lastMessageAt.getTime() >= msg3.createdAt.getTime(),
      'lastMessageAt must be updated to recent message time'
    );
    console.log('✓ PASS: Test 8 — Conversation lastMessageAt accurately updated.\n');

    // ----------------------------------------------------
    // TEST 9 & 10: Deleting conversation removes messages, preserves StudentMemory
    // ----------------------------------------------------
    console.log('--- TEST 9 & 10: Cascade deletion of messages, preservation of StudentMemory ---');
    // First, save a StudentMemory for student A
    await upsertStudentMemory(studentAId, {
      key: 'target_role',
      value: 'Full Stack Engineer',
      category: 'target_role',
      confidence: 1.0,
      source: 'user_confirmed',
    });

    const deleted = await deleteConversation(studentAId, convA._id.toString());
    assert.strictEqual(deleted, true, 'Conversation deletion must succeed');

    // Check conversation is gone
    const checkConv = await Conversation.findById(convA._id);
    assert.strictEqual(checkConv, null, 'Conversation must be deleted');

    // Check messages are gone
    const checkMessages = await Message.find({ conversationId: convA._id });
    assert.strictEqual(checkMessages.length, 0, 'Associated messages must be cascade-deleted');

    // Check StudentMemory is STILL PRESENT
    const checkMem = await getStudentMemory(studentAId, 'target_role');
    assert.ok(checkMem, 'StudentMemory must NOT be deleted when conversation is deleted');
    assert.strictEqual(checkMem.value, 'Full Stack Engineer');
    console.log('✓ PASS: Test 9 & 10 — Conversation cascade-deleted messages while preserving StudentMemory.\n');

    // ----------------------------------------------------
    // TEST 11: Student can create/update own memory
    // ----------------------------------------------------
    console.log('--- TEST 11: Student can create/update own memory ---');
    const mem1 = await upsertStudentMemory(studentAId, {
      key: 'learning_goal',
      value: 'Master Dynamic Programming',
      category: 'learning_goal',
      confidence: 0.95,
      source: 'user_confirmed',
    });
    assert.ok(mem1._id);
    assert.strictEqual(mem1.studentId.toString(), studentAId);
    assert.strictEqual(mem1.key, 'learning_goal');
    assert.strictEqual(mem1.value, 'Master Dynamic Programming');
    console.log('✓ PASS: Test 11 — Student created memory successfully.\n');

    // ----------------------------------------------------
    // TEST 12: Same student/key does not create duplicates
    // ----------------------------------------------------
    console.log('--- TEST 12: Same student/key updates existing record without duplicating ---');
    const memUpdate = await upsertStudentMemory(studentAId, {
      key: 'learning_goal',
      value: 'Master Dynamic Programming and Graph Algorithms',
      category: 'learning_goal',
      confidence: 1.0,
      source: 'user_confirmed',
    });
    assert.strictEqual(memUpdate._id.toString(), mem1._id.toString(), 'Same document must be updated');
    assert.strictEqual(memUpdate.value, 'Master Dynamic Programming and Graph Algorithms');

    const allGoals = await StudentMemory.find({ studentId: studentAId, key: 'learning_goal' });
    assert.strictEqual(allGoals.length, 1, 'Exactly 1 record must exist for this student and key');
    console.log('✓ PASS: Test 12 — No duplicates created for identical student/key.\n');

    // ----------------------------------------------------
    // TEST 13: Keys are normalized
    // ----------------------------------------------------
    console.log('--- TEST 13: Memory keys normalized deterministically ---');
    assert.strictEqual(normalizeMemoryKey('Target Role'), 'target_role');
    assert.strictEqual(normalizeMemoryKey('target-role'), 'target_role');
    assert.strictEqual(normalizeMemoryKey('TargetRole'), 'target_role');
    assert.strictEqual(normalizeMemoryKey('  target_role  '), 'target_role');
    assert.strictEqual(normalizeMemoryKey('CAREER_GOAL'), 'career_goal');

    // Upserting via normalized variation updates the same record
    const normUpdate = await upsertStudentMemory(studentAId, {
      key: 'Learning-Goal',
      value: 'Updated via hyphenated key',
      category: 'learning_goal',
      confidence: 0.9,
    });
    assert.strictEqual(normUpdate.key, 'learning_goal');
    assert.strictEqual(normUpdate._id.toString(), mem1._id.toString());
    console.log('✓ PASS: Test 13 — Memory keys normalized to deterministic snake_case.\n');

    // ----------------------------------------------------
    // TEST 14: Confidence outside 0–1 is rejected
    // ----------------------------------------------------
    console.log('--- TEST 14: Confidence outside 0–1 rejected ---');
    assert.strictEqual(validateMemoryConfidence(-0.1), false);
    assert.strictEqual(validateMemoryConfidence(1.1), false);
    assert.strictEqual(validateMemoryConfidence('0.5' as any), false);
    assert.strictEqual(validateMemoryConfidence(0), true);
    assert.strictEqual(validateMemoryConfidence(0.5), true);
    assert.strictEqual(validateMemoryConfidence(1), true);

    await assert.rejects(
      async () => {
        await upsertStudentMemory(studentAId, {
          key: 'test_conf',
          value: 'value',
          category: 'other',
          confidence: 1.5,
        });
      },
      (err: any) => err.message.includes('between 0 and 1'),
      'Confidence > 1 must reject'
    );
    console.log('✓ PASS: Test 14 — Confidence scores validated strictly between 0 and 1.\n');

    // ----------------------------------------------------
    // TEST 15: Invalid category is rejected
    // ----------------------------------------------------
    console.log('--- TEST 15: Invalid category rejected ---');
    assert.strictEqual(validateMemoryCategory('invalid_category'), false);
    assert.strictEqual(validateMemoryCategory('target_role'), true);

    await assert.rejects(
      async () => {
        await upsertStudentMemory(studentAId, {
          key: 'test_cat',
          value: 'value',
          category: 'super_secret_cat' as any,
          confidence: 0.5,
        });
      },
      (err: any) => err.message.includes('Invalid memory category'),
      'Invalid category must reject'
    );
    console.log('✓ PASS: Test 15 — Invalid memory categories rejected.\n');

    // ----------------------------------------------------
    // TEST 16: Student cannot access another student's memory
    // ----------------------------------------------------
    console.log('--- TEST 16: Student cannot access another student\'s memory ---');
    // Student A attempts to access student B memory
    await upsertStudentMemory(studentBId, {
      key: 'private_salary_goal',
      value: '200k',
      category: 'goal',
      confidence: 1.0,
      source: 'user_confirmed',
    });

    const crossMem = await getStudentMemory(studentAId, 'private_salary_goal');
    assert.strictEqual(crossMem, null, 'Student A must not see Student B memory');

    const httpCrossMemRes = await fetch(`${baseUrl}/api/student-memory/private_salary_goal`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.strictEqual(httpCrossMemRes.status, 404, 'API returns 404 for unowned memory');
    console.log('✓ PASS: Test 16 — Cross-student memory access prevented.\n');

    // ----------------------------------------------------
    // TEST 17: Student cannot set another student's ID or bypass provenance (Mass Assignment Protection)
    // ----------------------------------------------------
    console.log('--- TEST 17: Mass assignment protection for studentId and metadata ---');
    const fakeClientDate = new Date('2020-01-01T00:00:00.000Z');
    const httpMassAssignRes = await fetch(`${baseUrl}/api/student-memory/hacked_role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        studentId: studentBId, // Attempting to spoof student B ID
        value: 'Spoofed Value',
        category: 'target_role',
        confidence: 0.8,
        source: 'system', // Attempting to claim system provenance
        lastConfirmedAt: fakeClientDate, // Attempting to set client timestamp
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: fakeClientDate,
        updatedAt: fakeClientDate,
      }),
    });
    assert.strictEqual(httpMassAssignRes.status, 200);
    const massAssignData = await httpMassAssignRes.json();
    assert.strictEqual(
      massAssignData.memory.studentId,
      studentAId,
      'Record studentId must strictly match authenticated user, ignoring client payload'
    );
    assert.strictEqual(
      massAssignData.memory.source,
      'user_confirmed',
      'Source must be forced to user_confirmed, ignoring client-supplied "system"'
    );
    const confirmedTime = new Date(massAssignData.memory.lastConfirmedAt).getTime();
    assert.ok(
      Math.abs(Date.now() - confirmedTime) < 10000,
      'lastConfirmedAt must be set to current server time, not client timestamp'
    );
    console.log('✓ PASS: Test 17 — studentId and source derived by server; mass assignment blocked.\n');

    // ----------------------------------------------------
    // TEST 18: StudentMemory is NOT included in KnowledgeChunk retrieval
    // ----------------------------------------------------
    console.log('--- TEST 18: StudentMemory not included in KnowledgeChunk retrieval ---');
    // Verify StudentMemory model is distinct from KnowledgeChunk model
    assert.notStrictEqual(StudentMemory.collection.name, KnowledgeChunk.collection.name);
    assert.strictEqual(StudentMemory.collection.name, 'studentmemories');
    assert.strictEqual(KnowledgeChunk.collection.name, 'knowledgechunks');

    // Perform knowledge search for student memory content
    const retrievalResults = await retrieveRelevantKnowledge('Dynamic Programming and Graph Algorithms', {
      limit: 5,
    });
    // None of the results should be StudentMemory records
    for (const r of retrievalResults) {
      assert.notStrictEqual(r.sourceType, 'student_memory');
      assert.strictEqual((r as any).studentId, undefined);
    }
    console.log('✓ PASS: Test 18 — StudentMemory is strictly isolated from public KnowledgeChunk retrieval.\n');

    // ----------------------------------------------------
    // TEST 19: Unauthenticated conversation access -> 401
    // ----------------------------------------------------
    console.log('--- TEST 19: Unauthenticated access returns 401 ---');
    const unauthRes = await fetch(`${baseUrl}/api/conversations`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');
    console.log('✓ PASS: Test 19 — Unauthenticated request rejected with 401.\n');

    // ----------------------------------------------------
    // TEST 20: Wrong role -> 403
    // ----------------------------------------------------
    console.log('--- TEST 20: Wrong role returns 403 ---');
    const wrongRoleConvRes = await fetch(`${baseUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${tokenRecruiter}` },
    });
    assert.strictEqual(wrongRoleConvRes.status, 403, 'Recruiter accessing conversations must return 403');

    const wrongRoleMemRes = await fetch(`${baseUrl}/api/student-memory`, {
      headers: { Authorization: `Bearer ${tokenRecruiter}` },
    });
    assert.strictEqual(wrongRoleMemRes.status, 403, 'Recruiter accessing student memory must return 403');
    console.log('✓ PASS: Test 20 — Non-student roles rejected with 403.\n');

    // ----------------------------------------------------
    // TEST 21: Cross-student conversation access -> 403 or 404
    // ----------------------------------------------------
    console.log('--- TEST 21: Cross-student conversation access blocked ---');
    const crossAccessRes = await fetch(`${baseUrl}/api/conversations/${convB._id}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.ok(
      [403, 404].includes(crossAccessRes.status),
      'Cross-student conversation access must return 403 or 404'
    );
    console.log('✓ PASS: Test 21 — Cross-student conversation access blocked with 403/404.\n');

    // ----------------------------------------------------
    // TEST 22: Cross-student memory access is blocked
    // ----------------------------------------------------
    console.log('--- TEST 22: Cross-student memory deletion blocked ---');
    const crossDeleteMemRes = await fetch(`${baseUrl}/api/student-memory/private_salary_goal`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.strictEqual(crossDeleteMemRes.status, 404, 'Deleting another student memory must return 404');
    // Ensure Student B's memory is still intact
    const stillExists = await getStudentMemory(studentBId, 'private_salary_goal');
    assert.ok(stillExists, 'Student B memory must remain intact');
    console.log('✓ PASS: Test 22 — Cross-student memory modification blocked.\n');

    // ----------------------------------------------------
    // TEST 23: Malformed conversation ID is rejected safely
    // ----------------------------------------------------
    console.log('--- TEST 23: Malformed conversation ID rejected safely ---');
    const malformedRes = await fetch(`${baseUrl}/api/conversations/not-a-valid-id`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    assert.strictEqual(malformedRes.status, 400, 'Malformed ID must return 400');
    console.log('✓ PASS: Test 23 — Malformed ObjectId rejected safely with 400.\n');

    // ----------------------------------------------------
    // TEST 24: Message content length validation works
    // ----------------------------------------------------
    console.log('--- TEST 24: Message content length validation works ---');
    // Create fresh conversation for student A to test length validation
    const testConv = await createConversation(studentAId, { title: 'Length Test' });

    // Empty content rejected
    const emptyContentRes = await fetch(`${baseUrl}/api/conversations/${testConv._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ role: 'user', content: '   ' }),
    });
    assert.strictEqual(emptyContentRes.status, 400, 'Empty content must return 400');

    // Excessive content rejected
    const hugeContent = 'a'.repeat(MAX_MESSAGE_CONTENT_LENGTH + 50);
    const hugeContentRes = await fetch(`${baseUrl}/api/conversations/${testConv._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({ role: 'user', content: hugeContent }),
    });
    assert.strictEqual(hugeContentRes.status, 400, 'Excessive content must return 400');

    // ----------------------------------------------------
    // TEST 25: StudentMemory Provenance Security & Server Control
    // ----------------------------------------------------
    console.log('--- TEST 25: StudentMemory Provenance Security & Server Control ---');
    // 1. Explicit creation with source: "system" must be forced to user_confirmed
    const systemAttemptRes = await fetch(`${baseUrl}/api/student-memory/system_provenance_test`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        value: 'System Value',
        category: 'skill',
        confidence: 0.9,
        source: 'system',
      }),
    });
    assert.strictEqual(systemAttemptRes.status, 200);
    const systemData = await systemAttemptRes.json();
    assert.strictEqual(systemData.memory.source, 'user_confirmed', 'Source must NOT be system');

    // 2. Explicit creation with source: "assessment" must be forced to user_confirmed
    const assessmentAttemptRes = await fetch(`${baseUrl}/api/student-memory/assessment_provenance_test`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        value: 'Assessment Value',
        category: 'skill',
        confidence: 0.9,
        source: 'assessment',
      }),
    });
    assert.strictEqual(assessmentAttemptRes.status, 200);
    const assessmentData = await assessmentAttemptRes.json();
    assert.strictEqual(assessmentData.memory.source, 'user_confirmed', 'Source must NOT be assessment');

    // 3. Client cannot control lastConfirmedAt
    const arbitraryTimestamp = new Date('2019-05-10T12:00:00Z');
    const timestampAttemptRes = await fetch(`${baseUrl}/api/student-memory/timestamp_test`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        value: 'Timestamp Value',
        category: 'preference',
        confidence: 0.85,
        lastConfirmedAt: arbitraryTimestamp,
      }),
    });
    assert.strictEqual(timestampAttemptRes.status, 200);
    const timestampData = await timestampAttemptRes.json();
    const serverTimestamp = new Date(timestampData.memory.lastConfirmedAt).getTime();
    assert.ok(
      Math.abs(Date.now() - serverTimestamp) < 10000,
      'lastConfirmedAt must be current server time, not arbitrary client timestamp'
    );

    // 4. Memory service directly allows server-side modules to set trusted sources
    const serverInternalMem = await upsertStudentMemory(studentAId, {
      key: 'internal_assessment_score',
      value: 'Level 4 Expert',
      category: 'skill',
      confidence: 0.95,
      source: 'assessment',
    });
    assert.strictEqual(serverInternalMem.source, 'assessment', 'Internal service can set trusted source');

    console.log('✓ PASS: Test 25 — Provenance is strictly server-controlled and protected from client spoofing.\n');

    // Clean up test data created during the test run
    await deleteConversation(studentAId, testConv._id.toString());
    await deleteConversation(studentBId, convB._id.toString());
    await StudentMemory.deleteMany({ studentId: { $in: [studentAId, studentBId] } });

    console.log('✓ PASS: Test 24 — Message content validation properly enforces empty/max-length bounds.\n');

    console.log('====================================================');
    console.log('  ALL 25 CONVERSATIONAL & STUDENT MEMORY TESTS PASSED! ');
    console.log('====================================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runConversationalMemoryTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
