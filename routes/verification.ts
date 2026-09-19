import express, { Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { User } from '../src/models/User';
import { Certification } from '../src/models/Certification';
import { Project } from '../src/models/Project';
import { Internship } from '../src/models/Internship';
import { Achievement } from '../src/models/Achievement';

export const verificationRouter = express.Router();

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

type SupportedItemType = 'certification' | 'project' | 'internship' | 'achievement';

function getModelForType(type: string): mongoose.Model<any> | null {
  const normalized = String(type || '').trim().toLowerCase();
  switch (normalized) {
    case 'certification':
    case 'certifications':
      return Certification;
    case 'project':
    case 'projects':
      return Project;
    case 'internship':
    case 'internships':
      return Internship;
    case 'achievement':
    case 'achievements':
      return Achievement;
    default:
      return null;
  }
}

function normalizeItemType(type: string): SupportedItemType {
  const normalized = String(type || '').trim().toLowerCase();
  if (normalized.startsWith('cert')) return 'certification';
  if (normalized.startsWith('proj')) return 'project';
  if (normalized.startsWith('intern')) return 'internship';
  if (normalized.startsWith('achieve')) return 'achievement';
  return 'certification';
}

function isNonEmptyString(val: any): boolean {
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * Centralized helper for verification evidence.
 * Verifies that the record has at least one valid existing evidence source:
 * - Certification: fileId, fileUrl, credentialUrl
 * - Project: fileId, githubUrl, liveUrl
 * - Internship: fileId, certificateUrl
 * - Achievement: fileId, credentialUrl
 *
 * Null, undefined, and empty/whitespace-only strings are treated as missing.
 */
export function hasVerifiableEvidence(type: string, item: any): boolean {
  if (!item) return false;
  const normalized = normalizeItemType(type);

  switch (normalized) {
    case 'certification':
      return (
        isNonEmptyString(item.fileId) ||
        isNonEmptyString(item.fileUrl) ||
        isNonEmptyString(item.credentialUrl)
      );
    case 'project':
      return (
        isNonEmptyString(item.fileId) ||
        isNonEmptyString(item.githubUrl) ||
        isNonEmptyString(item.liveUrl)
      );
    case 'internship':
      return (
        isNonEmptyString(item.fileId) ||
        isNonEmptyString(item.certificateUrl)
      );
    case 'achievement':
      return (
        isNonEmptyString(item.fileId) ||
        isNonEmptyString(item.credentialUrl)
      );
    default:
      return false;
  }
}

/**
 * Helper to authenticate verifier and resolve their institutional college scope.
 * Only 'academician' and 'institution' roles are authorized to verify.
 */
async function authorizeVerifier(req: AuthRequest, res: Response): Promise<{
  verifierUser: any;
  verifierCollege: string;
} | null> {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    return null;
  }

  if (role !== 'academician' && role !== 'institution') {
    res.status(403).json({
      error: 'Forbidden: Only academicians and institutional reviewers are authorized to verify student portfolio evidence.',
    });
    return null;
  }

  let verifierObjId: any = userId;
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      verifierObjId = new mongoose.Types.ObjectId(userId);
    }
  } catch {
    verifierObjId = userId;
  }

  const verifierUser = await User.findOne({
    $or: [{ _id: verifierObjId }, { _id: userId }],
  }).select('name email role college collegeName department');

  if (!verifierUser) {
    res.status(404).json({ error: 'Verifier profile not found.' });
    return null;
  }

  const verifierCollege = (verifierUser.collegeName || verifierUser.college || '').trim();
  if (!verifierCollege) {
    res.status(403).json({
      error: 'Forbidden: Verifier profile lacks an institutional college affiliation. Contact administrator.',
    });
    return null;
  }

  return { verifierUser, verifierCollege };
}

/**
 * GET /api/verification/requests
 * Verification queue scoped to students from the verifier's college.
 * Query params:
 *   - status: 'PENDING' (default) | 'VERIFIED' | 'REJECTED' | 'ALL'
 *   - type: 'all' (default) | 'certification' | 'project' | 'internship' | 'achievement'
 *   - search: optional search query (student name, title, organization)
 */
verificationRouter.get('/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authScope = await authorizeVerifier(req, res);
    if (!authScope) return;

    const { verifierCollege } = authScope;
    const statusQuery = String(req.query.status || 'PENDING').trim().toUpperCase();
    const typeQuery = String(req.query.type || 'all').trim().toLowerCase();
    const searchQuery = String(req.query.search || '').trim().toLowerCase();

    // 1. Fetch all student user IDs belonging to the verifier's college
    const collegeRegex = new RegExp(`^${escapeRegex(verifierCollege)}$`, 'i');
    const studentUsers = await User.find({
      role: 'student',
      $or: [{ collegeName: collegeRegex }, { college: collegeRegex }],
    }).select('_id name email college collegeName department degree');

    if (studentUsers.length === 0) {
      return res.status(200).json({
        success: true,
        college: verifierCollege,
        total: 0,
        requests: [],
      });
    }

    const studentMap = new Map<string, any>();
    const studentIds: any[] = [];

    studentUsers.forEach((s) => {
      const sId = s._id.toString();
      studentMap.set(sId, s);
      studentIds.push(s._id);
      studentIds.push(sId);
    });

    // 2. Build verification status filter
    const statusFilter: any = {};
    if (statusQuery === 'ALL') {
      statusFilter.$in = ['PENDING', 'VERIFIED', 'REJECTED'];
    } else if (['PENDING', 'VERIFIED', 'REJECTED'].includes(statusQuery)) {
      statusFilter.$eq = statusQuery;
    } else {
      statusFilter.$eq = 'PENDING';
    }

    const baseDbQuery: any = {
      userId: { $in: studentIds },
      verificationStatus: statusFilter,
    };

    const results: any[] = [];

    // Helper to format item
    const formatItem = (doc: any, type: SupportedItemType) => {
      const studentIdStr = doc.userId ? doc.userId.toString() : '';
      const student = studentMap.get(studentIdStr) || {
        _id: studentIdStr,
        name: 'Unknown Student',
        email: '',
        college: verifierCollege,
        department: '',
        degree: '',
      };

      let title = doc.title || '';
      let description = doc.description || '';

      if (type === 'internship' && !title) {
        title = `${doc.role || 'Intern'} at ${doc.organization || 'Organization'}`;
      }

      return {
        id: doc._id.toString(),
        type,
        title,
        description,
        student: {
          id: student._id ? student._id.toString() : studentIdStr,
          name: student.name,
          email: student.email,
          college: student.collegeName || student.college || verifierCollege,
          department: student.department || '',
          degree: student.degree || '',
        },
        metadata: {
          issuer: doc.issuer || '',
          category: doc.category || '',
          dateIssued: doc.dateIssued || '',
          role: doc.role || '',
          duration: doc.duration || '',
          technologies: doc.technologies || [],
          organization: doc.organization || '',
          rank: doc.rank || '',
          date: doc.date || '',
          location: doc.location || '',
          outcomes: doc.outcomes || '',
          status: doc.status || '',
          source: doc.source || 'manual',
        },
        evidence: {
          fileId: doc.fileId || '',
          fileUrl: doc.fileUrl || (doc.fileId ? `/api/files/${doc.fileId}` : ''),
          fileName: doc.fileName || '',
          credentialUrl: doc.credentialUrl || '',
          githubUrl: doc.githubUrl || '',
          liveUrl: doc.liveUrl || '',
          certificateUrl: doc.certificateUrl || '',
        },
        hasEvidence: hasVerifiableEvidence(type, doc),
        verificationStatus: doc.verificationStatus || 'PENDING',
        verificationNote: doc.verificationNote || '',
        verifiedBy: doc.verifiedBy || null,
        verifiedAt: doc.verifiedAt || null,
        submittedAt: doc.createdAt || doc.addedAt || new Date(),
      };
    };

    // 3. Query relevant collections
    if (typeQuery === 'all' || typeQuery === 'certification') {
      const certs = await Certification.find(baseDbQuery).sort({ createdAt: -1, addedAt: -1 }).lean();
      certs.forEach((c) => results.push(formatItem(c, 'certification')));
    }

    if (typeQuery === 'all' || typeQuery === 'project') {
      const projs = await Project.find(baseDbQuery).sort({ createdAt: -1 }).lean();
      projs.forEach((p) => results.push(formatItem(p, 'project')));
    }

    if (typeQuery === 'all' || typeQuery === 'internship') {
      const interns = await Internship.find(baseDbQuery).sort({ createdAt: -1 }).lean();
      interns.forEach((i) => results.push(formatItem(i, 'internship')));
    }

    if (typeQuery === 'all' || typeQuery === 'achievement') {
      const achs = await Achievement.find(baseDbQuery).sort({ createdAt: -1 }).lean();
      achs.forEach((a) => results.push(formatItem(a, 'achievement')));
    }

    // 4. Apply optional client search query
    let filteredResults = results;
    if (searchQuery) {
      filteredResults = results.filter((item) => {
        const studentName = (item.student?.name || '').toLowerCase();
        const studentEmail = (item.student?.email || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const org = (item.metadata?.organization || item.metadata?.issuer || '').toLowerCase();
        return (
          studentName.includes(searchQuery) ||
          studentEmail.includes(searchQuery) ||
          title.includes(searchQuery) ||
          org.includes(searchQuery)
        );
      });
    }

    // 5. Sort: FIFO for PENDING (oldest submission first so reviewers handle in order), newest first for others
    if (statusQuery === 'PENDING') {
      filteredResults.sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
    } else {
      filteredResults.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    }

    return res.status(200).json({
      success: true,
      college: verifierCollege,
      total: filteredResults.length,
      requests: filteredResults,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error loading verification queue');
  }
});

/**
 * GET /api/verification/stats
 * Provides overview counts for verifier's college.
 */
verificationRouter.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authScope = await authorizeVerifier(req, res);
    if (!authScope) return;

    const { verifierCollege } = authScope;
    const collegeRegex = new RegExp(`^${escapeRegex(verifierCollege)}$`, 'i');
    const studentUsers = await User.find({
      role: 'student',
      $or: [{ collegeName: collegeRegex }, { college: collegeRegex }],
    }).select('_id');

    const studentIds: any[] = [];
    studentUsers.forEach((s) => {
      studentIds.push(s._id);
      studentIds.push(s._id.toString());
    });

    if (studentIds.length === 0) {
      return res.status(200).json({
        success: true,
        college: verifierCollege,
        pendingCount: 0,
        verifiedCount: 0,
        rejectedCount: 0,
        totalCount: 0,
        byType: {
          certification: { pending: 0, verified: 0, rejected: 0 },
          project: { pending: 0, verified: 0, rejected: 0 },
          internship: { pending: 0, verified: 0, rejected: 0 },
          achievement: { pending: 0, verified: 0, rejected: 0 },
        },
      });
    }

    const countByTypeAndStatus = async (model: mongoose.Model<any>) => {
      const [pending, verified, rejected] = await Promise.all([
        model.countDocuments({ userId: { $in: studentIds }, verificationStatus: 'PENDING' }),
        model.countDocuments({ userId: { $in: studentIds }, verificationStatus: 'VERIFIED' }),
        model.countDocuments({ userId: { $in: studentIds }, verificationStatus: 'REJECTED' }),
      ]);
      return { pending, verified, rejected };
    };

    const [certCounts, projCounts, internCounts, achCounts] = await Promise.all([
      countByTypeAndStatus(Certification),
      countByTypeAndStatus(Project),
      countByTypeAndStatus(Internship),
      countByTypeAndStatus(Achievement),
    ]);

    const pendingCount = certCounts.pending + projCounts.pending + internCounts.pending + achCounts.pending;
    const verifiedCount = certCounts.verified + projCounts.verified + internCounts.verified + achCounts.verified;
    const rejectedCount = certCounts.rejected + projCounts.rejected + internCounts.rejected + achCounts.rejected;
    const totalCount = pendingCount + verifiedCount + rejectedCount;

    return res.status(200).json({
      success: true,
      college: verifierCollege,
      pendingCount,
      verifiedCount,
      rejectedCount,
      totalCount,
      byType: {
        certification: certCounts,
        project: projCounts,
        internship: internCounts,
        achievement: achCounts,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error loading verification stats');
  }
});

/**
 * GET /api/verification/:type/:id
 * Retrieve a specific record for inspection.
 */
verificationRouter.get('/:type/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authScope = await authorizeVerifier(req, res);
    if (!authScope) return;

    const { verifierCollege } = authScope;
    const { type, id } = req.params;

    const Model = getModelForType(type);
    if (!Model) {
      return res.status(400).json({ error: `Invalid item type '${type}'` });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid record ID',
        error: 'Invalid record ID',
      });
    }

    const item = await Model.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Portfolio record not found' });
    }

    // Verify institutional affiliation
    const student = await User.findById(item.userId).select('name email college collegeName department degree');
    if (!student) {
      return res.status(404).json({ error: 'Owner student not found' });
    }

    const studentCollege = (student.collegeName || student.college || '').trim().toLowerCase();
    if (studentCollege !== verifierCollege.toLowerCase()) {
      return res.status(403).json({
        error: 'Forbidden: You can only inspect records for students from your own institution.',
      });
    }

    const normalizedType = normalizeItemType(type);

    return res.status(200).json({
      success: true,
      item: {
        id: item._id.toString(),
        type: normalizedType,
        title: item.title || (item as any).organization || 'Untitled',
        description: item.description || '',
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          college: student.collegeName || student.college,
          department: student.department || '',
          degree: student.degree || '',
        },
        metadata: {
          issuer: (item as any).issuer || '',
          category: (item as any).category || '',
          dateIssued: (item as any).dateIssued || '',
          role: (item as any).role || '',
          duration: (item as any).duration || '',
          technologies: (item as any).technologies || [],
          organization: (item as any).organization || '',
          rank: (item as any).rank || '',
          date: (item as any).date || '',
          location: (item as any).location || '',
          outcomes: (item as any).outcomes || '',
          status: (item as any).status || '',
          source: (item as any).source || 'manual',
        },
        evidence: {
          fileId: (item as any).fileId || '',
          fileUrl: (item as any).fileUrl || ((item as any).fileId ? `/api/files/${(item as any).fileId}` : ''),
          fileName: (item as any).fileName || '',
          credentialUrl: (item as any).credentialUrl || '',
          githubUrl: (item as any).githubUrl || '',
          liveUrl: (item as any).liveUrl || '',
          certificateUrl: (item as any).certificateUrl || '',
        },
        hasEvidence: hasVerifiableEvidence(normalizedType, item),
        verificationStatus: item.verificationStatus || 'PENDING',
        verificationNote: item.verificationNote || '',
        verifiedBy: item.verifiedBy || null,
        verifiedAt: item.verifiedAt || null,
        submittedAt: item.createdAt || (item as any).addedAt || new Date(),
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error loading record detail');
  }
});

/**
 * PATCH /api/verification/:type/:id/verify
 * Approve portfolio item evidence.
 * Enforces:
 *   1. Authenticated user
 *   2. Verifier role (academician or institution)
 *   3. Verifier/student institutional affiliation match
 *   4. Concurrency check: item must be currently PENDING
 *   5. Backend controls verifiedBy and verifiedAt (client inputs ignored)
 */
verificationRouter.patch('/:type/:id/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authScope = await authorizeVerifier(req, res);
    if (!authScope) return;

    const { verifierUser, verifierCollege } = authScope;
    const { type, id } = req.params;

    const Model = getModelForType(type);
    if (!Model) {
      return res.status(400).json({ error: `Invalid item type '${type}'` });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid record ID',
        error: 'Invalid record ID',
      });
    }

    const item = await Model.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Portfolio record not found' });
    }

    // Verify institutional affiliation
    const student = await User.findById(item.userId).select('name email college collegeName');
    if (!student) {
      return res.status(404).json({ error: 'Owner student not found' });
    }

    const studentCollege = (student.collegeName || student.college || '').trim().toLowerCase();
    if (studentCollege !== verifierCollege.toLowerCase()) {
      return res.status(403).json({
        error: 'Forbidden: You can only verify credentials for students from your own institution.',
      });
    }

    // Concurrency / double-review check: must currently be PENDING
    if (item.verificationStatus !== 'PENDING') {
      return res.status(409).json({
        error: `Conflict: This record has already been reviewed. Current status is '${item.verificationStatus}' (reviewed by: ${item.verifiedBy || 'Authorized Verifier'}).`,
        currentStatus: item.verificationStatus,
      });
    }

    // Centralized evidence check: require at least one valid evidence source
    if (!hasVerifiableEvidence(type, item)) {
      return res.status(400).json({
        message: 'Portfolio item cannot be verified because no supporting evidence is attached.',
        error: 'Portfolio item cannot be verified because no supporting evidence is attached.',
      });
    }

    // Apply verification
    const verifierSignature = verifierUser.name
      ? `${verifierUser.name} (${verifierUser.role === 'institution' ? 'Institution / TPO' : 'Faculty Academician'})`
      : verifierUser.email;

    item.verificationStatus = 'VERIFIED';
    item.verificationNote = '';
    item.verifiedBy = verifierSignature;
    item.verifiedAt = new Date();

    await item.save();

    return res.status(200).json({
      success: true,
      message: 'Portfolio item successfully verified.',
      item: {
        id: item._id.toString(),
        type: normalizeItemType(type),
        title: item.title || (item as any).organization,
        verificationStatus: item.verificationStatus,
        verifiedBy: item.verifiedBy,
        verifiedAt: item.verifiedAt,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error verifying portfolio item');
  }
});

/**
 * PATCH /api/verification/:type/:id/reject
 * Reject portfolio item evidence with explicit feedback note.
 * Enforces:
 *   1. Authenticated user
 *   2. Verifier role (academician or institution)
 *   3. Verifier/student institutional affiliation match
 *   4. Concurrency check: item must be currently PENDING
 *   5. Backend controls verifiedBy and verifiedAt
 */
verificationRouter.patch('/:type/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authScope = await authorizeVerifier(req, res);
    if (!authScope) return;

    const { verifierUser, verifierCollege } = authScope;
    const { type, id } = req.params;
    const note = String(req.body?.note || req.body?.reason || '').trim();

    if (!note) {
      return res.status(400).json({
        error: 'A reason or note explaining why the evidence was rejected is required so the student can rectify it.',
      });
    }

    const Model = getModelForType(type);
    if (!Model) {
      return res.status(400).json({ error: `Invalid item type '${type}'` });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid record ID',
        error: 'Invalid record ID',
      });
    }

    const item = await Model.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Portfolio record not found' });
    }

    // Verify institutional affiliation
    const student = await User.findById(item.userId).select('name email college collegeName');
    if (!student) {
      return res.status(404).json({ error: 'Owner student not found' });
    }

    const studentCollege = (student.collegeName || student.college || '').trim().toLowerCase();
    if (studentCollege !== verifierCollege.toLowerCase()) {
      return res.status(403).json({
        error: 'Forbidden: You can only review credentials for students from your own institution.',
      });
    }

    // Concurrency / double-review check: must currently be PENDING
    if (item.verificationStatus !== 'PENDING') {
      return res.status(409).json({
        error: `Conflict: This record has already been reviewed. Current status is '${item.verificationStatus}' (reviewed by: ${item.verifiedBy || 'Authorized Verifier'}).`,
        currentStatus: item.verificationStatus,
      });
    }

    // Apply rejection
    const verifierSignature = verifierUser.name
      ? `${verifierUser.name} (${verifierUser.role === 'institution' ? 'Institution / TPO' : 'Faculty Academician'})`
      : verifierUser.email;

    item.verificationStatus = 'REJECTED';
    item.verificationNote = note;
    item.verifiedBy = verifierSignature;
    item.verifiedAt = new Date();

    await item.save();

    return res.status(200).json({
      success: true,
      message: 'Portfolio item evidence rejected with feedback.',
      item: {
        id: item._id.toString(),
        type: normalizeItemType(type),
        title: item.title || (item as any).organization,
        verificationStatus: item.verificationStatus,
        verificationNote: item.verificationNote,
        verifiedBy: item.verifiedBy,
        verifiedAt: item.verifiedAt,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error rejecting portfolio item');
  }
});
