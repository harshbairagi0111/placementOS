import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './routes/auth';
import { studentsRouter } from './routes/students';
import { interviewsRouter } from './routes/interviews';
import { recruitersRouter } from './routes/recruiters';
import { roadmapRouter } from './routes/roadmap';
import { badgesRouter } from './routes/badges';
import { resumeRouter } from './routes/resume';
import { portfolioRouter } from './routes/portfolio';
import { certificationsRouter } from './routes/certifications';
import { mentorRouter } from './routes/mentor';
import { aptitudeRouter } from './routes/aptitude';
import { tpoRouter } from './routes/tpo';
import { academicianRouter } from './routes/academician';
import { experiencesRouter } from './routes/experiences';
import { skillsRouter } from './routes/skills';
import { filesRouter } from './routes/files';
import { verificationRouter } from './routes/verification';
import { mentorshipRouter } from './routes/mentorship';
import { conversationsRouter } from './routes/conversations';
import { studentMemoryRouter } from './routes/studentMemory';
import { connectDB } from './src/db/db';
import { seedAptitudeQuestions } from './scripts/seedAptitudeQuestions';
import { seedSkillQuestions } from './scripts/seedSkillQuestions';
import { seedMentors } from './scripts/seedMentors';
import { seedCodingQuestions } from './scripts/seedCodingQuestions';
import { codingRouter } from './routes/coding';
import { createCorsOptions, validateProductionConfig } from './routes/securityConfig';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Validate production configuration (e.g. JWT secret strength, fails fast on insecure defaults)
  validateProductionConfig();

  // Initialize DB connection on boot
  try {
    await connectDB();
    // Seed initial curated aptitude questions if database is empty
    await seedAptitudeQuestions();
    // Seed initial curated industry skill questions if database is empty
    await seedSkillQuestions();
    // Seed and verify initial faculty mentors
    await seedMentors();
    // Seed initial curated coding questions idempotently
    await seedCodingQuestions({ quiet: true });
  } catch (err: any) {
    console.error('Initial MongoDB connection error on boot:', err.message || err);
  }

  // Security Headers Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Avoid breaking frontend bundle / external assets
      frameguard: false, // Required for AI Studio iframe preview
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.disable('x-powered-by');

  // Environment-based CORS Middleware
  app.use(cors(createCorsOptions()));

  // JSON request body size limit protection (1MB)
  app.use(express.json({ limit: '1mb' }));
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large. Maximum allowed size is 1MB.' });
    }
    next(err);
  });

  // Health Check Route
  app.get('/api/health', async (req: Request, res: Response) => {
    let dbStatus = 'disconnected';
    if (process.env.MONGODB_URI) {
      const state = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (state === 1) {
        dbStatus = 'connected';
      } else if (state === 2) {
        dbStatus = 'connecting';
      } else {
        dbStatus = 'disconnected';
      }
    } else {
      dbStatus = 'unconfigured (missing MONGODB_URI)';
    }

    res.json({
      status: 'ok',
      service: 'placementOS-api',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  });

  // DB Health Check Route
  app.get('/api/health/db', async (req: Request, res: Response) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({ connected: isConnected });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/interviews', interviewsRouter);
  app.use('/api/recruiters', recruitersRouter);
  app.use('/api', recruitersRouter);
  app.use('/api/roadmap', roadmapRouter);
  app.use('/api/badges', badgesRouter);
  app.use('/api/resume', resumeRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/certifications', certificationsRouter);
  app.use('/api/mentor', mentorRouter);
  app.use('/api/aptitude', aptitudeRouter);
  app.use('/api/coding', codingRouter);
  app.use('/api/skills', skillsRouter);
  app.use('/api/tpo', tpoRouter);
  app.use('/api/academician', academicianRouter);
  app.use('/api/experiences', experiencesRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/documents', filesRouter);
  app.use('/api/verification', verificationRouter);
  app.use('/api/mentorship', mentorshipRouter);
  app.use('/api', mentorshipRouter);
  app.use('/api/conversations', conversationsRouter);
  app.use('/api/student-memory', studentMemoryRouter);

  // Global Error-Handling Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Log detailed server-side error for monitoring and debugging
    console.error('Unhandled server error:', err);

    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large. Maximum allowed size is 1MB.' });
    }
    if (err.name === 'MulterError') {
      const isProd = process.env.NODE_ENV === 'production';
      return res.status(400).json({
        error: isProd ? 'File upload error' : `File upload error: ${err.message}`,
      });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const statusCode =
      typeof err.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;

    // In production, mask 500 errors to prevent leaking database strings, stack traces, paths or internal details
    if (isProd && statusCode >= 500) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(statusCode).json({
      error: isProd ? (statusCode === 404 ? 'Not found' : 'Request failed') : (err.message || 'Server error'),
    });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
