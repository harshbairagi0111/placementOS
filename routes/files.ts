import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { fileStorage, StoredFileMetadata } from '../src/services/fileStorage';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { Resume } from '../src/models/Resume';
import { Certification } from '../src/models/Certification';
import {
  JobApplication,
  JobApplicationStatus,
  normalizeJobApplicationStatus,
  ELIGIBLE_DOCUMENT_ACCESS_STATUSES,
} from '../src/models/JobApplication';
import { JobPosting } from '../src/models/JobPosting';
import { User } from '../src/models/User';
import { sendSafeServerError } from './errorHandler';

export const filesRouter = Router();

/**
 * Authoritative helper to determine whether a JobApplication status qualifies
 * a candidate for document/resume inspection by an industry/recruiter partner.
 *
 * Uses ONLY PlacementOS canonical application statuses:
 *   'Applied', 'Under Review', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Rejected'
 *
 * Security policy (Deny-by-Default):
 * - Active / recruitment-relevant canonical status -> document access allowed
 * - Rejected status -> document access denied
 * - Any unknown / unrecognized / unapproved status -> DENY BY DEFAULT (returns false)
 */
export function isApplicationEligibleForDocumentAccess(status?: string | null): boolean {
  if (!status || typeof status !== 'string') {
    return false;
  }

  const canonical = normalizeJobApplicationStatus(status);
  if (!canonical) {
    // Unrecognized, invented, or empty status -> DENY BY DEFAULT
    return false;
  }

  // Explicitly verify membership in canonical eligible statuses
  return (ELIGIBLE_DOCUMENT_ACCESS_STATUSES as readonly string[]).includes(canonical);
}

/**
 * Verifies whether the authenticated user has legitimate authorization to access a student's document.
 * - Uses ONLY canonical User roles: student, industry, academician, institution.
 * - Students can ONLY view their own documents (strictly protects against IDOR).
 * - Industry users can ONLY view candidate documents if they own the job posting,
 *   the student applied to that job posting, and the application is in an eligible status.
 * - Institution users can ONLY view documents of students enrolled in their institution.
 * - Academicians can ONLY view documents of students affiliated with their academic institution.
 */
export async function checkDocumentAccessAuthorization(
  user: { userId: string; role: string },
  ownerStudentId: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!ownerStudentId) {
    return { allowed: false, reason: 'Document ownership could not be verified.' };
  }

  const requestingUserId = String(user.userId);
  const role = (user.role || '').trim().toLowerCase();

  // 1. Student access: Student can ONLY view their own document (strictly protects against IDOR)
  if (role === 'student') {
    if (requestingUserId === ownerStudentId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Forbidden: Students cannot access documents belonging to other candidates.',
    };
  }

  // Self-ownership check for any role if user is the direct owner of the document
  if (requestingUserId === ownerStudentId) {
    return { allowed: true };
  }

  // 2. Industry / Recruiter access:
  // Must authenticate + own the job posting + candidate must have an eligible application for that job
  if (role === 'industry') {
    let recruiterObjId: any = requestingUserId;
    try {
      if (mongoose.Types.ObjectId.isValid(requestingUserId)) {
        recruiterObjId = new mongoose.Types.ObjectId(requestingUserId);
      }
    } catch {
      recruiterObjId = requestingUserId;
    }

    // Step A: Find all JobPostings owned by this industry partner
    const recruiterJobs = await JobPosting.find({
      $or: [
        { recruiterId: requestingUserId },
        { recruiterId: recruiterObjId },
      ],
    }).select('_id');

    if (!recruiterJobs || recruiterJobs.length === 0) {
      return {
        allowed: false,
        reason: 'Forbidden: Industry user has no posted recruitment opportunities.',
      };
    }

    const allJobKeys = recruiterJobs.map((job) => job._id.toString());
    const jobObjectIds = recruiterJobs.map((job) => job._id);
    const searchJobIds = Array.from(new Set([...allJobKeys, ...jobObjectIds]));

    let studentObjId: any = ownerStudentId;
    try {
      if (mongoose.Types.ObjectId.isValid(ownerStudentId)) {
        studentObjId = new mongoose.Types.ObjectId(ownerStudentId);
      }
    } catch {
      studentObjId = ownerStudentId;
    }

    // Step B: Find all applications submitted by this student for this recruiter's jobs
    const candidateApplications = await JobApplication.find({
      userId: { $in: [ownerStudentId, studentObjId] },
      jobPostingId: { $in: searchJobIds },
    }).select('status jobPostingId');

    if (!candidateApplications || candidateApplications.length === 0) {
      return {
        allowed: false,
        reason: 'Forbidden: Recruiter does not have an active application relationship with this candidate.',
      };
    }

    // Step C: Verify application status is eligible (e.g. not Rejected, Withdrawn, etc.)
    const hasEligibleApplication = candidateApplications.some((app) =>
      isApplicationEligibleForDocumentAccess(app.status)
    );

    if (hasEligibleApplication) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Forbidden: Candidate application is no longer in an active recruitment status.',
    };
  }

  // 3. Institution access:
  // Must have canonical role 'institution' and student must be enrolled in the institution's college
  if (role === 'institution') {
    let requestingObjId: any = requestingUserId;
    try {
      if (mongoose.Types.ObjectId.isValid(requestingUserId)) {
        requestingObjId = new mongoose.Types.ObjectId(requestingUserId);
      }
    } catch {
      requestingObjId = requestingUserId;
    }

    const institutionUser = await User.findOne({
      $or: [{ _id: requestingObjId }, { _id: requestingUserId }],
    }).select('college collegeName role');

    if (!institutionUser) {
      return { allowed: false, reason: 'Forbidden: Institution profile not found.' };
    }

    const institutionCollege = (institutionUser.collegeName || institutionUser.college || '').trim().toLowerCase();
    if (!institutionCollege) {
      return {
        allowed: false,
        reason: 'Forbidden: Institution profile missing college designation.',
      };
    }

    let studentObjId: any = ownerStudentId;
    try {
      if (mongoose.Types.ObjectId.isValid(ownerStudentId)) {
        studentObjId = new mongoose.Types.ObjectId(ownerStudentId);
      }
    } catch {
      studentObjId = ownerStudentId;
    }

    const studentUser = await User.findOne({
      $or: [{ _id: studentObjId }, { _id: ownerStudentId }],
    }).select('college collegeName');

    if (!studentUser) {
      return { allowed: false, reason: 'Forbidden: Student profile not found.' };
    }

    const studentCollege = (studentUser.collegeName || studentUser.college || '').trim().toLowerCase();
    if (studentCollege && studentCollege === institutionCollege) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Forbidden: Institution users can only access documents of students enrolled in their institution.',
    };
  }

  // 4. Academician access:
  // Must have canonical role 'academician' and student must be affiliated with academician's institution
  if (role === 'academician') {
    let requestingObjId: any = requestingUserId;
    try {
      if (mongoose.Types.ObjectId.isValid(requestingUserId)) {
        requestingObjId = new mongoose.Types.ObjectId(requestingUserId);
      }
    } catch {
      requestingObjId = requestingUserId;
    }

    const academicianUser = await User.findOne({
      $or: [{ _id: requestingObjId }, { _id: requestingUserId }],
    }).select('college collegeName department role');

    if (!academicianUser) {
      return { allowed: false, reason: 'Forbidden: Academician profile not found.' };
    }

    const academicianCollege = (academicianUser.collegeName || academicianUser.college || '').trim().toLowerCase();
    if (!academicianCollege) {
      return {
        allowed: false,
        reason: 'Forbidden: Academician profile missing college affiliation.',
      };
    }

    let studentObjId: any = ownerStudentId;
    try {
      if (mongoose.Types.ObjectId.isValid(ownerStudentId)) {
        studentObjId = new mongoose.Types.ObjectId(ownerStudentId);
      }
    } catch {
      studentObjId = ownerStudentId;
    }

    const studentUser = await User.findOne({
      $or: [{ _id: studentObjId }, { _id: ownerStudentId }],
    }).select('college collegeName department');

    if (!studentUser) {
      return { allowed: false, reason: 'Forbidden: Student profile not found.' };
    }

    const studentCollege = (studentUser.collegeName || studentUser.college || '').trim().toLowerCase();
    if (studentCollege && studentCollege === academicianCollege) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Forbidden: Academicians can only access documents of students affiliated with their academic institution.',
    };
  }

  // 5. Default deny for any unknown or unauthorized role
  return { allowed: false, reason: 'Forbidden: Access denied.' };
}

/**
 * GET /api/files/:fileId
 * Streams the persisted document from GridFS storage with verified relationship authorization.
 */
filesRouter.get('/:fileId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { fileId } = req.params;
    if (!fileId || !fileStorage.isValidId(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const stored = await fileStorage.getFile(fileId);
    if (!stored) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Identify owner student ID from file metadata, or fallback to database model references
    let ownerStudentId = String(stored.metadata?.ownerStudentId || stored.metadata?.userId || '');
    if (!ownerStudentId) {
      const resume = await Resume.findOne({ fileId }).select('userId');
      if (resume?.userId) {
        ownerStudentId = resume.userId.toString();
      } else {
        const cert = await Certification.findOne({ fileId }).select('userId');
        if (cert?.userId) {
          ownerStudentId = cert.userId.toString();
        }
      }
    }

    // Strict relationship-based authorization check
    const authCheck = await checkDocumentAccessAuthorization(user, ownerStudentId);
    if (!authCheck.allowed) {
      return res.status(403).json({
        error: authCheck.reason || 'Forbidden: You do not have permission to view this document.',
      });
    }

    // Set standard secure response headers
    const mimeType = stored.metadata?.mimeType || stored.file.contentType || 'application/pdf';
    const originalName = stored.metadata?.originalName || 'document.pdf';
    const safeFilename = originalName.replace(/[\r\n"\\\/]/g, '_');
    const isDownload = req.query.download === 'true' || req.query.download === '1';

    res.setHeader('Content-Type', mimeType);
    if (typeof stored.file.length === 'number' && stored.file.length > 0) {
      res.setHeader('Content-Length', stored.file.length);
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(originalName)}`
    );

    const downloadStream = stored.openStream();
    downloadStream.on('error', (streamErr: any) => {
      console.error(`[filesRouter] Stream error for file ${fileId}:`, streamErr);
      if (!res.headersSent) {
        sendSafeServerError(res, streamErr, 'Failed to stream document');
      }
    });

    downloadStream.pipe(res);
  } catch (error: any) {
    if (!res.headersSent) {
      return sendSafeServerError(res, error, 'Server error retrieving file');
    }
  }
});

/**
 * DELETE /api/files/:fileId
 * Deletes a persisted file if requested by owner or authorized staff.
 */
filesRouter.delete('/:fileId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { fileId } = req.params;
    if (!fileId || !fileStorage.isValidId(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const stored = await fileStorage.getFile(fileId);
    if (!stored) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let ownerStudentId = String(stored.metadata?.ownerStudentId || stored.metadata?.userId || '');
    if (!ownerStudentId) {
      const resume = await Resume.findOne({ fileId }).select('userId');
      if (resume?.userId) {
        ownerStudentId = resume.userId.toString();
      } else {
        const cert = await Certification.findOne({ fileId }).select('userId');
        if (cert?.userId) {
          ownerStudentId = cert.userId.toString();
        }
      }
    }

    const isOwner = ownerStudentId && ownerStudentId === String(user.userId);
    let isAuthorizedInstitution = false;

    if ((user.role || '').trim().toLowerCase() === 'institution') {
      const institutionUser = await User.findById(user.userId).select('college collegeName role');
      const studentUser = await User.findById(ownerStudentId).select('college collegeName');
      const institutionCollege = (institutionUser?.collegeName || institutionUser?.college || '').trim().toLowerCase();
      const studentCollege = (studentUser?.collegeName || studentUser?.college || '').trim().toLowerCase();
      if (institutionCollege && studentCollege && institutionCollege === studentCollege) {
        isAuthorizedInstitution = true;
      }
    }

    if (!isOwner && !isAuthorizedInstitution) {
      return res.status(403).json({ error: 'Forbidden: You cannot delete this document' });
    }

    // Clean up database references first
    await Resume.updateMany(
      { fileId },
      { $unset: { fileId: 1, fileUrl: 1 } }
    );
    await Certification.updateMany(
      { fileId },
      { $unset: { fileId: 1, fileUrl: 1 } }
    );

    // Delete from storage
    try {
      await fileStorage.deleteFile(fileId);
    } catch (cleanErr: any) {
      console.warn(`[filesRouter] Storage cleanup warning for file ${fileId}:`, cleanErr?.message || cleanErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      fileId,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error deleting file');
  }
});
