import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { User, IUser } from '../src/models/User';
import { MentorshipRequest, IMentorshipRequest } from '../src/models/MentorshipRequest';

export const mentorshipRouter = Router();

// Safe projection for mentor public profiles (no private contact or credentials exposed)
const MENTOR_SAFE_PROJECTION =
  'name college collegeName department designation skills bio industryExperience researchAreas isMentorAvailable mentorAreas mentorshipTypes createdAt';

// Safe projection for student profiles shown to mentors (purposeful, no credentials or unnecessary private contact info)
const STUDENT_SAFE_PROJECTION =
  'name email college collegeName degree targetRole skills bio cgpa githubUrl linkedinUrl';

/**
 * GET /api/mentors
 * Student/Public discovery endpoint for human faculty mentors.
 * Filters by search query, department, expertise/mentorArea, mentorshipType, and availability.
 */
mentorshipRouter.get('/mentors', async (req: AuthRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is unavailable.' });
    }

    const {
      search,
      department,
      expertise,
      mentorshipType,
      availability,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Base query: only users with role 'academician'
    const query: any = { role: 'academician' };

    // Availability filter: default to only available mentors unless explicitly specified
    if (availability === 'all') {
      // no filter on isMentorAvailable
    } else if (availability === 'false') {
      query.isMentorAvailable = false;
    } else {
      query.isMentorAvailable = true;
    }

    // Department filter
    if (department && typeof department === 'string' && department.trim()) {
      query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    }

    // Expertise / Mentor Area filter
    if (expertise && typeof expertise === 'string' && expertise.trim()) {
      query.$or = [
        { mentorAreas: { $regex: new RegExp(expertise.trim(), 'i') } },
        { skills: { $regex: new RegExp(expertise.trim(), 'i') } },
        { researchAreas: { $regex: new RegExp(expertise.trim(), 'i') } },
      ];
    }

    // Mentorship Type filter
    if (mentorshipType && typeof mentorshipType === 'string' && mentorshipType.trim()) {
      query.mentorshipTypes = mentorshipType.trim();
    }

    // Free text search
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchOr = [
        { name: searchRegex },
        { department: searchRegex },
        { designation: searchRegex },
        { college: searchRegex },
        { collegeName: searchRegex },
        { skills: searchRegex },
        { mentorAreas: searchRegex },
        { bio: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const [mentors, total] = await Promise.all([
      User.find(query)
        .select(MENTOR_SAFE_PROJECTION)
        .sort({ isMentorAvailable: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Compute active mentees count for each mentor
    const mentorIds = mentors.map((m) => m._id);
    const activeMenteesCounts = await MentorshipRequest.aggregate([
      { $match: { mentorId: { $in: mentorIds }, status: 'ACCEPTED' } },
      { $group: { _id: '$mentorId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const c of activeMenteesCounts) {
      countMap.set(c._id.toString(), c.count);
    }

    const enrichedMentors = mentors.map((m) => ({
      ...m,
      id: m._id.toString(),
      activeMenteesCount: countMap.get(m._id.toString()) || 0,
    }));

    return res.json({
      success: true,
      mentors: enrichedMentors,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch mentors');
  }
});

/**
 * GET /api/mentors/:mentorId
 * Detailed profile for a single mentor, including active capacity and optional student-specific request status.
 */
mentorshipRouter.get('/mentors/:mentorId', async (req: AuthRequest, res: Response) => {
  try {
    const { mentorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ error: 'Invalid mentor ID format' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is unavailable.' });
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'academician' })
      .select(MENTOR_SAFE_PROJECTION)
      .lean();

    if (!mentor) {
      return res.status(404).json({ error: 'Faculty mentor not found' });
    }

    // Active mentees count
    const activeMenteesCount = await MentorshipRequest.countDocuments({
      mentorId,
      status: 'ACCEPTED',
    });

    // Check if optional auth token is present to provide existing request context
    let existingRequest = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const decoded = jwt.default.verify(token, secret) as any;
          if (decoded && decoded.userId) {
            existingRequest = await MentorshipRequest.findOne({
              studentId: decoded.userId,
              mentorId,
            })
              .sort({ createdAt: -1 })
              .lean();
          }
        }
      } catch (err) {
        // Silently proceed without existingRequest if token is expired/invalid
      }
    }

    return res.json({
      success: true,
      mentor: {
        ...mentor,
        id: mentor._id.toString(),
        activeMenteesCount,
        existingRequest: existingRequest
          ? {
              id: existingRequest._id.toString(),
              status: existingRequest.status,
              createdAt: existingRequest.createdAt,
              message: existingRequest.message,
              mentorshipArea: existingRequest.mentorshipArea,
              responseNote: existingRequest.responseNote,
              respondedAt: existingRequest.respondedAt,
            }
          : null,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch mentor profile');
  }
});

/**
 * POST /api/mentorship/requests
 * Authenticated student creates a mentorship request.
 * Strictly derives studentId from req.user.userId.
 * Blocks duplicate active requests (PENDING or ACCEPTED).
 */
mentorshipRouter.post(
  '/requests',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const studentId = req.user?.userId;
      const userRole = req.user?.role;

      if (!studentId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (userRole !== 'student') {
        return res.status(403).json({ error: 'Only registered students can submit mentorship requests' });
      }

      const { mentorId, message, mentorshipArea } = req.body;

      if (!mentorId || typeof mentorId !== 'string') {
        return res.status(400).json({ error: 'mentorId is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        return res.status(400).json({ error: 'Invalid mentor ID format' });
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          error: 'Please provide a message explaining why you are seeking mentorship and your goals',
        });
      }

      if (studentId === mentorId) {
        return res.status(400).json({ error: 'Cannot submit a mentorship request to yourself' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      // 1. Verify mentor exists and is an academician
      const mentor = await User.findOne({ _id: mentorId, role: 'academician' });
      if (!mentor) {
        return res.status(404).json({ error: 'Faculty mentor not found' });
      }

      // 2. Check if mentor is accepting requests
      if (!mentor.isMentorAvailable) {
        return res.status(400).json({
          error: 'This faculty mentor is not currently accepting new mentorship requests',
        });
      }

      // 3. Duplicate request protection
      // Check for any active request (PENDING or ACCEPTED)
      const existingActiveRequest = await MentorshipRequest.findOne({
        studentId,
        mentorId,
        status: { $in: ['PENDING', 'ACCEPTED'] },
      });

      if (existingActiveRequest) {
        if (existingActiveRequest.status === 'PENDING') {
          return res.status(409).json({
            error: 'You already have a pending mentorship request with this mentor. Please wait for their response.',
            requestId: existingActiveRequest._id.toString(),
            status: existingActiveRequest.status,
          });
        }
        if (existingActiveRequest.status === 'ACCEPTED') {
          return res.status(409).json({
            error: 'You are already an active mentee with this faculty mentor.',
            requestId: existingActiveRequest._id.toString(),
            status: existingActiveRequest.status,
          });
        }
      }

      // 4. Create new mentorship request
      const newRequest = await MentorshipRequest.create({
        studentId,
        mentorId,
        status: 'PENDING',
        message: message.trim(),
        mentorshipArea: typeof mentorshipArea === 'string' ? mentorshipArea.trim() : '',
      });

      return res.status(201).json({
        success: true,
        message: 'Mentorship request submitted successfully',
        request: {
          id: newRequest._id.toString(),
          studentId: newRequest.studentId.toString(),
          mentorId: newRequest.mentorId.toString(),
          status: newRequest.status,
          message: newRequest.message,
          mentorshipArea: newRequest.mentorshipArea,
          createdAt: newRequest.createdAt,
        },
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to submit mentorship request');
    }
  }
);

/**
 * GET /api/mentorship/requests/my
 * Student views their submitted mentorship requests and active mentors.
 */
mentorshipRouter.get(
  '/requests/my',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user?.role !== 'student') {
        return res.status(403).json({ error: 'Forbidden: Access restricted to students' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      const requests = await MentorshipRequest.find({ studentId })
        .sort({ createdAt: -1 })
        .populate({
          path: 'mentorId',
          select: MENTOR_SAFE_PROJECTION,
        })
        .populate({
          path: 'studentId',
          select: 'name email college collegeName degree targetRole skills bio',
        })
        .lean();

      const formattedRequests = requests.map((r: any) => {
        const mentorDoc = r.mentorId || {};
        const studentDoc = r.studentId || {};
        return {
          id: r._id.toString(),
          status: r.status,
          message: r.message,
          mentorshipArea: r.mentorshipArea,
          responseNote: r.responseNote || '',
          respondedAt: r.respondedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          student: {
            id: studentDoc._id ? studentDoc._id.toString() : studentId,
            name: studentDoc.name || 'Student Candidate',
            email: studentDoc.email || req.user?.email || '',
          },
          mentor: {
            id: mentorDoc._id ? mentorDoc._id.toString() : r.mentorId,
            name: mentorDoc.name || 'Faculty Mentor',
            college: mentorDoc.collegeName || mentorDoc.college || '',
            department: mentorDoc.department || '',
            designation: mentorDoc.designation || '',
            skills: mentorDoc.skills || [],
            mentorAreas: mentorDoc.mentorAreas || [],
            mentorshipTypes: mentorDoc.mentorshipTypes || [],
            isMentorAvailable: mentorDoc.isMentorAvailable,
          },
        };
      });

      const activeMentors = formattedRequests
        .filter((r) => r.status === 'ACCEPTED')
        .map((r) => ({
          requestId: r.id,
          acceptedDate: r.respondedAt || r.updatedAt,
          mentor: r.mentor,
          mentorshipArea: r.mentorshipArea,
          message: r.message,
        }));

      return res.json({
        success: true,
        requests: formattedRequests,
        activeMentors,
        totalRequests: formattedRequests.length,
        activeCount: activeMentors.length,
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to fetch student requests');
    }
  }
);

/**
 * GET /api/mentorship/requests/incoming
 * Academician views incoming requests from students.
 * Strictly checks that req.user.role === 'academician' and queries mentorId = req.user.userId.
 */
mentorshipRouter.get(
  '/requests/incoming',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const mentorId = req.user?.userId;
      const userRole = req.user?.role;

      if (!mentorId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (userRole !== 'academician') {
        return res.status(403).json({ error: 'Access restricted to faculty academicians' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      const { status } = req.query;
      const query: any = { mentorId };
      if (status && typeof status === 'string' && ['PENDING', 'ACCEPTED', 'REJECTED'].includes(status.toUpperCase())) {
        query.status = status.toUpperCase();
      }

      const requests = await MentorshipRequest.find(query)
        .sort({ createdAt: -1 })
        .populate({
          path: 'studentId',
          select: STUDENT_SAFE_PROJECTION,
        })
        .lean();

      const formattedRequests = requests.map((r: any) => {
        const studentDoc = r.studentId || {};
        // Context-aware student email visibility:
        // Visible for authorized mentor on PENDING and ACCEPTED mentorship requests.
        // Omitted for REJECTED requests to minimize student exposure after rejection.
        const isAuthorizedActiveOrPending = r.status === 'PENDING' || r.status === 'ACCEPTED';
        return {
          id: r._id.toString(),
          status: r.status,
          message: r.message,
          mentorshipArea: r.mentorshipArea,
          responseNote: r.responseNote || '',
          respondedAt: r.respondedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          student: {
            id: studentDoc._id ? studentDoc._id.toString() : r.studentId,
            name: studentDoc.name || 'Student Candidate',
            email: isAuthorizedActiveOrPending ? (studentDoc.email || '') : undefined,
            college: studentDoc.collegeName || studentDoc.college || '',
            degree: studentDoc.degree || '',
            targetRole: studentDoc.targetRole || '',
            skills: studentDoc.skills || [],
            bio: studentDoc.bio || '',
            cgpa: studentDoc.cgpa,
            githubUrl: studentDoc.githubUrl || '',
            linkedinUrl: studentDoc.linkedinUrl || '',
          },
        };
      });

      return res.json({
        success: true,
        requests: formattedRequests,
        pendingCount: formattedRequests.filter((r) => r.status === 'PENDING').length,
        acceptedCount: formattedRequests.filter((r) => r.status === 'ACCEPTED').length,
        rejectedCount: formattedRequests.filter((r) => r.status === 'REJECTED').length,
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to fetch incoming requests');
    }
  }
);

/**
 * GET /api/mentorship/requests/:requestId
 * Fetch details for a specific mentorship request.
 * Strictly verifies ownership:
 * - Accessible only to the requesting student (request.studentId == authenticatedUser)
 *   OR the assigned mentor (request.mentorId == authenticatedUser).
 * - Third party or unrelated mentor receives 403 Forbidden.
 * - Context-aware student email visibility:
 *   - Student always sees their own email.
 *   - Authorized mentor sees student email for PENDING and ACCEPTED requests.
 *   - Omitted for REJECTED requests.
 */
mentorshipRouter.get(
  '/requests/:requestId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: 'Invalid request ID format' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      const request = await MentorshipRequest.findById(requestId)
        .populate({
          path: 'studentId',
          select: STUDENT_SAFE_PROJECTION,
        })
        .populate({
          path: 'mentorId',
          select: MENTOR_SAFE_PROJECTION,
        })
        .lean();

      if (!request) {
        return res.status(404).json({ error: 'Mentorship request not found' });
      }

      const studentIdStr = (request.studentId as any)?._id
        ? (request.studentId as any)._id.toString()
        : request.studentId?.toString();
      const mentorIdStr = (request.mentorId as any)?._id
        ? (request.mentorId as any)._id.toString()
        : request.mentorId?.toString();

      const userRole = req.user?.role;
      const isStudentOwner = userRole === 'student' && userId === studentIdStr;
      const isMentorRecipient = userRole === 'academician' && userId === mentorIdStr;

      if (!isStudentOwner && !isMentorRecipient) {
        return res.status(403).json({
          error: 'Unauthorized: You do not have permission to view this mentorship request',
        });
      }

      const studentDoc = (request.studentId as any) || {};
      const mentorDoc = (request.mentorId as any) || {};

      // Context-aware student email visibility
      const showStudentEmail =
        isStudentOwner ||
        (isMentorRecipient && (request.status === 'PENDING' || request.status === 'ACCEPTED'));

      return res.json({
        success: true,
        request: {
          id: request._id.toString(),
          status: request.status,
          message: request.message,
          mentorshipArea: request.mentorshipArea,
          responseNote: request.responseNote || '',
          respondedAt: request.respondedAt,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          student: {
            id: studentDoc._id ? studentDoc._id.toString() : studentIdStr,
            name: studentDoc.name || 'Student Candidate',
            email: showStudentEmail ? (studentDoc.email || '') : undefined,
            college: studentDoc.collegeName || studentDoc.college || '',
            degree: studentDoc.degree || '',
            targetRole: studentDoc.targetRole || '',
            skills: studentDoc.skills || [],
            bio: studentDoc.bio || '',
            cgpa: studentDoc.cgpa,
            githubUrl: studentDoc.githubUrl || '',
            linkedinUrl: studentDoc.linkedinUrl || '',
          },
          mentor: {
            id: mentorDoc._id ? mentorDoc._id.toString() : mentorIdStr,
            name: mentorDoc.name || 'Faculty Mentor',
            college: mentorDoc.collegeName || mentorDoc.college || '',
            department: mentorDoc.department || '',
            designation: mentorDoc.designation || '',
            skills: mentorDoc.skills || [],
            mentorAreas: mentorDoc.mentorAreas || [],
            mentorshipTypes: mentorDoc.mentorshipTypes || [],
            isMentorAvailable: mentorDoc.isMentorAvailable,
          },
        },
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to fetch mentorship request details');
    }
  }
);

/**
 * GET /api/mentorship/students/:studentId
 * Mentor retrieves student profile ONLY IF a legitimate mentorship relationship exists
 * (PENDING request or ACCEPTED active mentorship).
 * Blocks arbitrary student contact lookup by unrelated mentors.
 */
mentorshipRouter.get(
  '/students/:studentId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const mentorId = req.user?.userId;
      const userRole = req.user?.role;
      const { studentId } = req.params;

      if (!mentorId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (userRole !== 'academician') {
        return res.status(403).json({ error: 'Access restricted to faculty academicians' });
      }

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID format' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      // Verify legitimate mentorship relationship exists between this mentor and the student
      const relationship = await MentorshipRequest.findOne({
        mentorId,
        studentId,
        status: { $in: ['PENDING', 'ACCEPTED'] },
      }).lean();

      if (!relationship) {
        return res.status(403).json({
          error: 'Unauthorized: You do not have an active or pending mentorship relationship with this student',
        });
      }

      const student = await User.findOne({ _id: studentId, role: 'student' })
        .select(STUDENT_SAFE_PROJECTION)
        .lean();

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.json({
        success: true,
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email, // Visible because legitimate relationship is verified
          college: student.collegeName || student.college || '',
          degree: student.degree || '',
          targetRole: student.targetRole || '',
          skills: student.skills || [],
          bio: student.bio || '',
          cgpa: student.cgpa,
          githubUrl: student.githubUrl || '',
          linkedinUrl: student.linkedinUrl || '',
          relationshipStatus: relationship.status,
          mentorshipArea: relationship.mentorshipArea,
        },
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to fetch student profile');
    }
  }
);

/**
 * PATCH /api/mentorship/requests/:requestId/accept
 * Academician accepts a student's mentorship request.
 * Strictly verifies ownership and atomically transitions status PENDING -> ACCEPTED.
 */
mentorshipRouter.patch(
  '/requests/:requestId/accept',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const mentorId = req.user?.userId;
      const userRole = req.user?.role;
      const { requestId } = req.params;
      const { responseNote } = req.body;

      if (!mentorId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (userRole !== 'academician') {
        return res.status(403).json({ error: 'Access restricted to faculty academicians' });
      }

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: 'Invalid request ID format' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      const now = new Date();
      const updateFields: any = {
        status: 'ACCEPTED',
        respondedAt: now,
        updatedAt: now,
      };
      if (responseNote && typeof responseNote === 'string') {
        updateFields.responseNote = responseNote.trim();
      }

      // Atomic conditional update: enforces _id, mentorId (from auth), and status === 'PENDING'
      const updatedRequest = await MentorshipRequest.findOneAndUpdate(
        {
          _id: requestId,
          mentorId,
          status: 'PENDING',
        },
        {
          $set: updateFields,
        },
        {
          returnDocument: 'after',
        }
      );

      if (!updatedRequest) {
        // Fallback check to determine exact status for correct HTTP response
        const existingRequest = await MentorshipRequest.findById(requestId).lean();
        if (!existingRequest) {
          return res.status(404).json({ error: 'Mentorship request not found' });
        }

        // Ownership authorization check
        if (existingRequest.mentorId.toString() !== mentorId) {
          return res.status(403).json({
            error: 'Unauthorized: You are not authorized to respond to this mentorship request',
          });
        }

        // Request has already been processed (ACCEPTED or REJECTED)
        return res.status(409).json({
          error: 'Mentorship request has already been processed.',
          currentStatus: existingRequest.status,
        });
      }

      return res.json({
        success: true,
        message: 'Mentorship request accepted successfully',
        request: {
          id: updatedRequest._id.toString(),
          status: updatedRequest.status,
          responseNote: updatedRequest.responseNote,
          respondedAt: updatedRequest.respondedAt,
          updatedAt: updatedRequest.updatedAt,
        },
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to accept mentorship request');
    }
  }
);

/**
 * PATCH /api/mentorship/requests/:requestId/reject
 * Academician rejects a student's mentorship request.
 * Strictly verifies ownership and atomically transitions status PENDING -> REJECTED.
 */
mentorshipRouter.patch(
  '/requests/:requestId/reject',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const mentorId = req.user?.userId;
      const userRole = req.user?.role;
      const { requestId } = req.params;
      const { responseNote } = req.body;

      if (!mentorId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (userRole !== 'academician') {
        return res.status(403).json({ error: 'Access restricted to faculty academicians' });
      }

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: 'Invalid request ID format' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      const now = new Date();
      const updateFields: any = {
        status: 'REJECTED',
        respondedAt: now,
        updatedAt: now,
      };
      if (responseNote && typeof responseNote === 'string') {
        updateFields.responseNote = responseNote.trim();
      }

      // Atomic conditional update: enforces _id, mentorId (from auth), and status === 'PENDING'
      const updatedRequest = await MentorshipRequest.findOneAndUpdate(
        {
          _id: requestId,
          mentorId,
          status: 'PENDING',
        },
        {
          $set: updateFields,
        },
        {
          returnDocument: 'after',
        }
      );

      if (!updatedRequest) {
        // Fallback check to determine exact status for correct HTTP response
        const existingRequest = await MentorshipRequest.findById(requestId).lean();
        if (!existingRequest) {
          return res.status(404).json({ error: 'Mentorship request not found' });
        }

        // Ownership authorization check
        if (existingRequest.mentorId.toString() !== mentorId) {
          return res.status(403).json({
            error: 'Unauthorized: You are not authorized to respond to this mentorship request',
          });
        }

        // Request has already been processed (ACCEPTED or REJECTED)
        return res.status(409).json({
          error: 'Mentorship request has already been processed.',
          currentStatus: existingRequest.status,
        });
      }

      return res.json({
        success: true,
        message: 'Mentorship request rejected',
        request: {
          id: updatedRequest._id.toString(),
          status: updatedRequest.status,
          responseNote: updatedRequest.responseNote,
          respondedAt: updatedRequest.respondedAt,
          updatedAt: updatedRequest.updatedAt,
        },
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to reject mentorship request');
    }
  }
);

/**
 * GET /api/mentorship/my-mentees
 * Academician views all actively accepted student mentees.
 */
mentorshipRouter.get(
  '/my-mentees',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const mentorId = req.user?.userId;
      const userRole = req.user?.role;

      if (!mentorId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (userRole !== 'academician') {
        return res.status(403).json({ error: 'Access restricted to faculty academicians' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection is unavailable.' });
      }

      const activeRelationships = await MentorshipRequest.find({
        mentorId,
        status: 'ACCEPTED',
      })
        .sort({ respondedAt: -1, updatedAt: -1 })
        .populate({
          path: 'studentId',
          select: STUDENT_SAFE_PROJECTION,
        })
        .lean();

      const mentees = activeRelationships.map((rel: any) => {
        const student = rel.studentId || {};
        return {
          relationshipId: rel._id.toString(),
          status: rel.status,
          acceptedDate: rel.respondedAt || rel.updatedAt,
          mentorshipArea: rel.mentorshipArea,
          initialMessage: rel.message,
          student: {
            id: student._id ? student._id.toString() : rel.studentId,
            name: student.name || 'Student Mentee',
            email: student.email || '',
            college: student.collegeName || student.college || '',
            degree: student.degree || '',
            targetRole: student.targetRole || '',
            skills: student.skills || [],
            bio: student.bio || '',
            cgpa: student.cgpa,
            githubUrl: student.githubUrl || '',
            linkedinUrl: student.linkedinUrl || '',
          },
        };
      });

      return res.json({
        success: true,
        mentees,
        count: mentees.length,
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to fetch mentees');
    }
  }
);
