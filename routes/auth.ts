import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { getJwtSecret } from './securityConfig';
import { authRateLimiter } from './authRateLimiter';
import { sendSafeServerError } from './errorHandler';

export const authRouter = Router();

// Re-export getJwtSecret for backward compatibility with any direct callers
export { getJwtSecret };

const handleSignup = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      name,
      role,
      college,
      collegeName,
      degree,
      targetRole,
      company,
      department,
      designation,
      inviteCode,
    } = req.body;
    const userName = fullName || name;

    if (!email || !password || !userName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const allowedRoles = ['student', 'industry', 'academician', 'institution'] as const;
    type ValidRole = typeof allowedRoles[number];

    if (!role || !allowedRoles.includes(role as ValidRole)) {
      return res.status(400).json({
        error: 'A valid role is required. Allowed roles: student, industry, academician, institution',
      });
    }
    const userRole = role as ValidRole;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is unavailable. Please check MongoDB configuration.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const institution = collegeName || college || undefined;
    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: userName,
      role: userRole,
      college: institution,
      collegeName: institution,
      degree: degree || undefined,
      targetRole: targetRole || undefined,
      company: company || undefined,
      department: department || undefined,
      designation: designation || undefined,
    });

    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email, role: newUser.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        fullName: newUser.name,
        role: newUser.role,
        college: newUser.college,
        collegeName: newUser.collegeName || newUser.college,
        degree: newUser.degree,
        targetRole: newUser.targetRole,
        targetCtc: newUser.targetCtc,
        phone: newUser.phone,
        githubUrl: newUser.githubUrl,
        linkedinUrl: newUser.linkedinUrl,
        skills: newUser.skills || [],
        bio: newUser.bio,
        cgpa: newUser.cgpa,
        graduationYear: newUser.graduationYear,
        readinessScore: newUser.readinessScore,
        company: newUser.company,
        department: newUser.department,
        designation: newUser.designation,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error during signup');
  }
};

// POST /api/auth/signup (Targeted Rate Limited)
authRouter.post('/signup', authRateLimiter, handleSignup);

// POST /api/auth/register (alias for signup, Targeted Rate Limited)
authRouter.post('/register', authRateLimiter, handleSignup);

// POST /api/auth/login (Targeted Rate Limited)
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is unavailable. Please check MongoDB configuration.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        fullName: user.name,
        role: user.role,
        college: user.college,
        collegeName: user.collegeName || user.college,
        degree: user.degree,
        targetRole: user.targetRole,
        targetCtc: user.targetCtc,
        phone: user.phone,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        skills: user.skills || [],
        bio: user.bio,
        cgpa: user.cgpa,
        graduationYear: user.graduationYear,
        readinessScore: user.readinessScore,
        dsaSolved: user.dsaSolved,
        systemDesignScore: user.systemDesignScore,
        mockInterviewsCompleted: user.mockInterviewsCompleted,
        company: user.company,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error during login');
  }
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user.userId).select('-password');
      if (user) {
        return res.json({
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            fullName: user.name,
            role: user.role,
            college: user.college,
            collegeName: user.collegeName || user.college,
            degree: user.degree,
            targetRole: user.targetRole,
            targetCtc: user.targetCtc,
            phone: user.phone,
            githubUrl: user.githubUrl,
            linkedinUrl: user.linkedinUrl,
            skills: user.skills || [],
            bio: user.bio,
            cgpa: user.cgpa,
            graduationYear: user.graduationYear,
            readinessScore: user.readinessScore,
            dsaSolved: user.dsaSolved,
            systemDesignScore: user.systemDesignScore,
            mockInterviewsCompleted: user.mockInterviewsCompleted,
            company: user.company,
            department: user.department,
            designation: user.designation,
          },
        });
      }
    }

    return res.status(404).json({ error: 'User not found' });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching user profile');
  }
});
