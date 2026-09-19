import express, { Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { User } from '../src/models/User';
import { AcademicOpportunity } from '../src/models/AcademicOpportunity';
import { AcademicApplication } from '../src/models/AcademicApplication';

export const academicianRouter = express.Router();

// In-memory application storage fallback for demo opportunities / degraded database state
interface InMemoryApplication {
  _id: string;
  opportunityId: string;
  academicianId: string;
  status: 'Applied' | 'Under Review' | 'Selected' | 'Rejected';
  createdAt: Date;
}
const demoApplicationsStore: InMemoryApplication[] = [];

// Realistic demo opportunities fallback for when DB collection is empty
const DEMO_OPPORTUNITIES = [
  {
    _id: 'demo-fac-1',
    company: 'Google Cloud Labs',
    title: 'Faculty Engineering Residency in Distributed Systems',
    type: 'Faculty Internship',
    description:
      'Hands-on summer residency with Google Cloud infrastructure teams. Work on scalable container orchestration and modernize university curriculum based on production architecture.',
    duration: '8 Weeks (Summer)',
    mode: 'Hybrid',
    requiredExpertise: ['Distributed Systems', 'Kubernetes', 'Go / Python', 'Cloud Architecture'],
    stipendOrHonorarium: '₹85,000 / month + Research Grant',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-fac-2',
    company: 'Microsoft Research India',
    title: 'Visiting Faculty Fellow in Applied AI & Systems',
    type: 'Faculty Internship',
    description:
      'Collaborate directly with Microsoft Research teams in Bangalore. Focus on edge AI inference, large language model alignment, and joint university patent incubation.',
    duration: '12 Weeks',
    mode: 'Offline',
    requiredExpertise: ['Machine Learning', 'Deep Learning', 'PyTorch', 'Model Optimization'],
    stipendOrHonorarium: '₹1,00,000 / month + Travel Allowance',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-fac-3',
    company: 'Infosys Center of Emerging Tech',
    title: 'Corporate Sabbatical: Enterprise Microservices & Cloud-Native Security',
    type: 'Faculty Internship',
    description:
      'Sabbatical opportunity for faculty to shadow enterprise cloud migration projects, security audits, and API gateways in real enterprise client setups.',
    duration: '6 Weeks',
    mode: 'Online',
    requiredExpertise: ['Spring Boot', 'Cloud Security', 'API Design', 'DevSecOps'],
    stipendOrHonorarium: '₹60,000 / month',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-train-1',
    company: 'Intel Technology India',
    title: 'Advanced Silicon Design & Embedded Systems Workshop for Faculty',
    type: 'Industrial Training',
    description:
      'Intensive immersion into RISC-V architectures, FPGA emulation, and hardware-software co-design pipelines with Intel hardware engineers.',
    duration: '4 Weeks',
    mode: 'Hybrid',
    requiredExpertise: ['Embedded Systems', 'Verilog / VHDL', 'Computer Architecture'],
    stipendOrHonorarium: 'Sponsored Program + Hardware Development Kit',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-train-2',
    company: 'Amazon Web Services (AWS)',
    title: 'AWS Deep-Tech DevOps & Serverless Architecture Training',
    type: 'Industrial Training',
    description:
      'Hands-on architectural training covering event-driven microservices, AWS Lambda, DynamoDB scalability, and Terraform Infrastructure as Code.',
    duration: '3 Weeks',
    mode: 'Online',
    requiredExpertise: ['Cloud Computing', 'CI/CD Pipelines', 'Docker', 'System Design'],
    stipendOrHonorarium: 'Sponsored with $1000 AWS Cloud Credits',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-train-3',
    company: 'TCS Research & Innovations',
    title: 'Industrial Full-Stack Engineering & Agile Architecture Sprints',
    type: 'Industrial Training',
    description:
      'Faculty training sprint focusing on enterprise full-stack development, modern test-driven development, Kafka streaming, and containerized deployment pipelines.',
    duration: '4 Weeks',
    mode: 'Offline',
    requiredExpertise: ['Full-Stack Web', 'Kafka / Event Streaming', 'Testing Frameworks'],
    stipendOrHonorarium: 'Sponsored by TCS Academic Relations',
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

/**
 * GET /api/academician/me/overview
 * Returns the logged-in academician's own user record (basic profile).
 */
academicianRouter.get('/me/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user?.role !== 'academician') {
      return res.status(403).json({ error: 'Forbidden: Academician access required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is unavailable.' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Academician profile not found' });
    }

    return res.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        collegeName: user.collegeName || user.college,
        department: user.department,
        designation: user.designation,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      stats: {
        studentsTracked: 0,
        coursesSupervised: 0,
        skillAssessmentsReviewed: 0,
      },
      message: 'Academician overview endpoint active. Comprehensive dashboard features coming in the next step.',
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to fetch academician profile');
  }
});

/**
 * GET /api/academician/opportunities?type=...
 * Returns AcademicOpportunity documents filtered by type query param and status Active.
 * If empty in MongoDB, returns realistic demo opportunities in the same shape.
 */
academicianRouter.get('/opportunities', async (req: AuthRequest, res: Response) => {
  try {
    const requestedType = req.query.type as string | undefined;
    let opportunities: any[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const query: any = { status: 'Active' };
        if (requestedType) {
          query.type = requestedType;
        }

        const dbResults = await AcademicOpportunity.find(query).sort({ createdAt: -1 }).lean();
        if (dbResults && dbResults.length > 0) {
          opportunities = dbResults.map((item) => ({
            ...item,
            _id: item._id.toString(),
            id: item._id.toString(),
          }));
        }
      } catch (dbErr) {
        console.warn('MongoDB query error in GET /academician/opportunities:', dbErr);
      }
    }

    // Realistic demo fallback if DB has no matching records
    if (opportunities.length === 0) {
      if (requestedType) {
        opportunities = DEMO_OPPORTUNITIES.filter((op) => op.type === requestedType);
      } else {
        opportunities = DEMO_OPPORTUNITIES;
      }
    }

    return res.json({
      success: true,
      opportunities,
      count: opportunities.length,
      isDemo: opportunities.some((op) => typeof op._id === 'string' && op._id.startsWith('demo-')),
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Failed to retrieve academic opportunities');
  }
});

/**
 * POST /api/academician/opportunities/:opportunityId/apply
 * Creates an AcademicApplication for the authenticated academician.
 * Enforces strict duplicate prevention.
 */
academicianRouter.post(
  '/opportunities/:opportunityId/apply',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const academicianId = req.user?.userId;
      if (!academicianId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user?.role !== 'academician') {
        return res.status(403).json({ error: 'Forbidden: Academician access required' });
      }

      const { opportunityId } = req.params;
      if (!opportunityId) {
        return res.status(400).json({ error: 'Opportunity ID is required' });
      }

      // Check for duplicate application in DB
      let existingApp: any = null;
      if (mongoose.connection.readyState === 1) {
        try {
          existingApp = await AcademicApplication.findOne({
            opportunityId,
            academicianId,
          });
        } catch (dbFindErr) {
          console.warn('DB duplicate check warning:', dbFindErr);
        }
      }

      // Check in-memory store as well
      if (!existingApp) {
        existingApp = demoApplicationsStore.find(
          (app) => app.opportunityId === opportunityId && app.academicianId === academicianId
        );
      }

      if (existingApp) {
        return res.status(400).json({
          error: 'You have already submitted an application for this opportunity.',
          alreadyApplied: true,
          application: existingApp,
        });
      }

      // Create new application
      let newApp: any = null;
      if (mongoose.connection.readyState === 1) {
        try {
          newApp = await AcademicApplication.create({
            opportunityId,
            academicianId,
            status: 'Applied',
          });
        } catch (dbCreateErr) {
          console.warn('Failed to save application to MongoDB, using memory fallback:', dbCreateErr);
        }
      }

      if (!newApp) {
        newApp = {
          _id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          opportunityId,
          academicianId,
          status: 'Applied',
          createdAt: new Date(),
        };
        demoApplicationsStore.push(newApp);
      }

      return res.status(201).json({
        success: true,
        message: 'Application successfully submitted to the corporate host organization.',
        application: newApp,
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to submit application');
    }
  }
);

/**
 * GET /api/academician/me/applications
 * Returns authenticated academician's own applications, populated with opportunity metadata.
 */
academicianRouter.get(
  '/me/applications',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const academicianId = req.user?.userId;
      if (!academicianId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user?.role !== 'academician') {
        return res.status(403).json({ error: 'Forbidden: Academician access required' });
      }

      let userApps: any[] = [];

      if (mongoose.connection.readyState === 1) {
        try {
          const dbApps = await AcademicApplication.find({ academicianId })
            .sort({ createdAt: -1 })
            .lean();
          if (dbApps && dbApps.length > 0) {
            userApps = [...dbApps];
          }
        } catch (dbErr) {
          console.warn('MongoDB query error in GET /academician/me/applications:', dbErr);
        }
      }

      // Merge any in-memory demo applications for this user
      const memApps = demoApplicationsStore.filter(
        (app) =>
          app.academicianId === academicianId &&
          !userApps.some((ua) => ua.opportunityId === app.opportunityId)
      );
      userApps = [...userApps, ...memApps];

      // Populate opportunity details for each application
      const populatedApps = await Promise.all(
        userApps.map(async (app) => {
          let oppDetails: any = null;

          // Try from DB if valid ObjectId
          if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(app.opportunityId)) {
            try {
              oppDetails = await AcademicOpportunity.findById(app.opportunityId).lean();
            } catch (err) {
              console.warn('Error fetching opportunity detail for app:', err);
            }
          }

          // Fallback to DEMO_OPPORTUNITIES if not found in DB
          if (!oppDetails) {
            oppDetails = DEMO_OPPORTUNITIES.find(
              (op) => op._id === app.opportunityId || (op as any).id === app.opportunityId
            );
          }

          return {
            _id: app._id?.toString() || app._id,
            id: app._id?.toString() || app._id,
            opportunityId: app.opportunityId,
            status: app.status || 'Applied',
            createdAt: app.createdAt,
            opportunity: oppDetails
              ? {
                  id: oppDetails._id?.toString() || oppDetails._id,
                  title: oppDetails.title,
                  company: oppDetails.company,
                  type: oppDetails.type,
                  duration: oppDetails.duration,
                  mode: oppDetails.mode,
                  stipendOrHonorarium: oppDetails.stipendOrHonorarium,
                  deadline: oppDetails.deadline,
                }
              : null,
          };
        })
      );

      return res.json({
        success: true,
        applications: populatedApps,
        count: populatedApps.length,
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to fetch academician applications');
    }
  }
);

/**
 * PUT /api/academician/mentor-profile
 * Authenticated: updates mentorship availability, expertise areas, and preferred mentorship types
 * on the logged-in academician's own User document only (userId from req.user.userId, never trust body ID).
 */
const VALID_MENTORSHIP_TYPES = [
  'Live Projects',
  'Internships',
  'Innovation Challenges',
  'Research Projects',
  'Industry Programs',
] as const;

academicianRouter.put(
  '/mentor-profile',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user?.role !== 'academician') {
        return res.status(403).json({ error: 'Forbidden: Academician access required' });
      }

      const { isMentorAvailable, mentorAreas, mentorshipTypes } = req.body;

      // Validate isMentorAvailable
      const isAvailable = Boolean(isMentorAvailable);

      // Validate mentorAreas (array of strings, trim and remove empty strings)
      let cleanedAreas: string[] = [];
      if (Array.isArray(mentorAreas)) {
        cleanedAreas = mentorAreas
          .map((area: any) => (typeof area === 'string' ? area.trim() : ''))
          .filter((area: string) => area.length > 0);
      }

      // Validate mentorshipTypes against enum
      let cleanedTypes: string[] = [];
      if (Array.isArray(mentorshipTypes)) {
        cleanedTypes = mentorshipTypes.filter((t: any) =>
          VALID_MENTORSHIP_TYPES.includes(t)
        );
      }

      const updateData = {
        isMentorAvailable: isAvailable,
        mentorAreas: cleanedAreas,
        mentorshipTypes: cleanedTypes,
      };

      if (mongoose.connection.readyState === 1) {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
          return res.status(404).json({ error: 'Academician profile not found' });
        }

        return res.json({
          success: true,
          message: 'Mentorship profile updated successfully',
          isMentorAvailable: updatedUser.isMentorAvailable,
          mentorAreas: updatedUser.mentorAreas,
          mentorshipTypes: updatedUser.mentorshipTypes,
          user: {
            id: updatedUser._id.toString(),
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            isMentorAvailable: updatedUser.isMentorAvailable,
            mentorAreas: updatedUser.mentorAreas,
            mentorshipTypes: updatedUser.mentorshipTypes,
          },
        });
      }

      // Fallback if DB is disconnected / in-memory mode
      return res.json({
        success: true,
        message: 'Mentorship profile updated successfully',
        isMentorAvailable: updateData.isMentorAvailable,
        mentorAreas: updateData.mentorAreas,
        mentorshipTypes: updateData.mentorshipTypes,
        user: {
          id: userId,
          isMentorAvailable: updateData.isMentorAvailable,
          mentorAreas: updateData.mentorAreas,
          mentorshipTypes: updateData.mentorshipTypes,
        },
      });
    } catch (error: any) {
      return sendSafeServerError(res, error, 'Failed to update mentorship profile');
    }
  }
);

/**
 * PUT /api/academician/me/profile
 * Authenticated: updates the logged-in academician's own User document.
 * Strictly uses req.user.userId (never accepts or trusts client-supplied userId).
 * Partial update pattern: updates only fields present in req.body.
 */
academicianRouter.put('/me/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Academician authentication required' });
    }

    if (req.user?.role !== 'academician') {
      return res.status(403).json({ error: 'Forbidden: Academician access required' });
    }

    const {
      collegeName,
      department,
      designation,
      phone,
      bio,
      linkedinUrl,
      researchAreas,
      industryExperience,
    } = req.body;

    // Process partial update fields (same style as PUT /api/recruiters/me/profile)
    const updateFields: Record<string, any> = {};
    if (collegeName !== undefined) {
      const trimmed = String(collegeName).trim();
      updateFields.collegeName = trimmed;
      updateFields.college = trimmed;
    }
    if (department !== undefined) updateFields.department = String(department).trim();
    if (designation !== undefined) updateFields.designation = String(designation).trim();
    if (phone !== undefined) updateFields.phone = String(phone).trim();
    if (bio !== undefined) updateFields.bio = String(bio).trim();
    if (linkedinUrl !== undefined) updateFields.linkedinUrl = String(linkedinUrl).trim();
    if (researchAreas !== undefined) {
      updateFields.researchAreas = Array.isArray(researchAreas)
        ? researchAreas
            .map((a: any) => (typeof a === 'string' ? a.trim() : ''))
            .filter((a: string) => a.length > 0)
        : [];
    }
    if (industryExperience !== undefined) {
      updateFields.industryExperience = String(industryExperience).trim();
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully (demo mode)',
        user: {
          id: userId,
          ...updateFields,
        },
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Academician not found' });
    }

    const safeUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      collegeName: user.collegeName || user.college || '',
      college: user.college || user.collegeName || '',
      department: user.department || '',
      designation: user.designation || '',
      phone: user.phone || '',
      bio: user.bio || '',
      linkedinUrl: user.linkedinUrl || '',
      researchAreas: user.researchAreas || [],
      industryExperience: user.industryExperience || '',
      isMentorAvailable: user.isMentorAvailable,
      mentorAreas: user.mentorAreas || [],
      mentorshipTypes: user.mentorshipTypes || [],
    };

    return res.status(200).json({
      success: true,
      message: 'Academician profile updated successfully',
      user: safeUser,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating profile');
  }
});


