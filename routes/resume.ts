import { Router, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { Type } from '@google/genai';
import { Resume } from '../src/models/Resume';
import { User } from '../src/models/User';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { callGeminiResilient } from './geminiClient';
import { fileStorage, validateFile, MAX_FILE_SIZE_BYTES } from '../src/services/fileStorage';

export const resumeRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

function parseJsonSafely(raw: string): any {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try extracting JSON from markdown code block
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }
  }
  return null;
}

// GET /api/resume/latest — returns the user's most recent resume analysis, or null if none exists
resumeRouter.get('/latest', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can manage resumes' });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = userId;
        try {
          userObjId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjId = userId;
        }

        const latestResume = await Resume.findOne({
          $or: [{ userId: userObjId }, { userId: String(userId) }],
        }).sort({ createdAt: -1 });

        if (latestResume) {
          return res.status(200).json({
            success: true,
            resume: {
              id: latestResume._id,
              fileName: latestResume.fileName || 'Resume.pdf',
              fileId: latestResume.fileId || null,
              fileUrl: latestResume.fileUrl || (latestResume.fileId ? `/api/files/${latestResume.fileId}` : null),
              atsScore: latestResume.atsScore,
              formattingScore: latestResume.formattingScore,
              quantifiedImpactScore: latestResume.quantifiedImpactScore,
              keywordMatchPct: latestResume.keywordMatchPct,
              feedback: latestResume.feedback || '',
              skillsFound: latestResume.skillsFound || [],
              missingSkills: latestResume.missingSkills || [],
              suggestions: latestResume.suggestions || [],
              targetRole: latestResume.targetRole || 'Software Development Engineer',
              updatedAt: latestResume.updatedAt,
            },
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB error fetching latest resume:', dbErr);
      }
    }

    return res.status(200).json({ success: true, resume: null });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching latest resume');
  }
});

// POST /api/resume/analyze — accepts uploaded file or text, persists file, runs Gemini ATS analysis
resumeRouter.post('/analyze', authMiddleware, upload.single('resume'), async (req: AuthRequest, res: Response) => {
  let storedFile: any = null;
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can upload and analyze resumes' });
    }

    const file = req.file;
    const { resumeText, targetRole = 'Software Development Engineer' } = req.body || {};

    let fileName = file?.originalname || 'Uploaded_Resume.pdf';
    let fileBuffer = file?.buffer;
    let mimeType = file?.mimetype || 'application/pdf';

    // 1. If file is provided, validate extension, size, and magic bytes
    if (file && fileBuffer) {
      const validation = validateFile(fileBuffer, file.originalname, file.mimetype);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error || 'Invalid file format.',
        });
      }

      mimeType = validation.mimeType;
      fileName = validation.sanitizedOriginalName;

      // Persist the file into persistent GridFS storage
      try {
        storedFile = await fileStorage.uploadFile({
          buffer: fileBuffer,
          originalName: file.originalname,
          mimeType: validation.mimeType,
          userId: String(userId),
          ownerStudentId: String(userId),
          category: 'resume',
          documentType: 'resume',
        });
      } catch (storageErr: any) {
        console.error('[Resume Upload] Storage failure:', storageErr);
        return res.status(503).json({
          success: false,
          error: 'Storage unavailable',
        });
      }
    }

    let promptContents: any[] = [];

    if (fileBuffer) {
      // Inline file payload for Gemini analysis
      const base64Data = fileBuffer.toString('base64');
      promptContents.push({
        inlineData: {
          mimeType: mimeType === 'application/octet-stream' ? 'application/pdf' : mimeType,
          data: base64Data,
        },
      });
    }

    let textPrompt = `Analyze this resume for ATS (Applicant Tracking System) optimization and readiness for the target role: "${targetRole}".
Evaluate:
1. ATS Score (0 to 100): overall compatibility with standard ATS screeners.
2. Formatting Score (0 to 100): readability, section headings, typography structure.
3. Quantified Impact Score (0 to 100): presence of Google XYZ format (Accomplished [X] as measured by [Y], by doing [Z]) and metrics.
4. Keyword Match Pct (0 to 100): match percentage for high-impact keywords required for ${targetRole}.
5. Strong Skills Found: array of 4 to 8 high-value technical and core skills extracted.
6. Missing High-Impact Keywords: array of 3 to 6 key missing skills/technologies for ${targetRole}.
7. Feedback Summary: 2-3 concise sentences detailing overall resume strengths and core weaknesses.
8. Suggestions: 3-4 actionable tips to improve score.`;

    if (resumeText && typeof resumeText === 'string' && resumeText.trim().length > 0) {
      textPrompt += `\n\nResume Text Content:\n${resumeText.trim()}`;
    }

    promptContents.push(textPrompt);

    let analysisResult: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await callGeminiResilient({
          models: ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'],
          contents: promptContents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                atsScore: { type: Type.NUMBER },
                formattingScore: { type: Type.NUMBER },
                quantifiedImpactScore: { type: Type.NUMBER },
                keywordMatchPct: { type: Type.NUMBER },
                skillsFound: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                missingSkills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                feedback: { type: Type.STRING },
                suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'atsScore',
                'formattingScore',
                'quantifiedImpactScore',
                'keywordMatchPct',
                'skillsFound',
                'missingSkills',
                'feedback',
                'suggestions',
              ],
            },
          },
        });

        if (response.text) {
          analysisResult = parseJsonSafely(response.text);
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call error during resume analysis:', geminiErr?.message || geminiErr);
      }
    }

    // Return clean JSON error if Gemini analysis failed or produced no result
    if (!analysisResult || typeof analysisResult.atsScore !== 'number') {
      // Clean up orphaned stored file if Gemini analysis fails
      if (storedFile?.fileId) {
        await fileStorage.deleteFile(storedFile.fileId).catch(() => {});
      }
      return res.status(503).json({
        success: false,
        error: 'The AI model is currently experiencing high demand. Please try again in a few moments.',
      });
    }

    // Find previous resume record to replace and clean up old stored file
    let oldFileId: string | null = null;
    let savedResume: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = userId;
        try {
          userObjId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjId = userId;
        }

        const prev = await Resume.findOne({
          $or: [{ userId: userObjId }, { userId: String(userId) }],
        }).sort({ createdAt: -1 });
        if (prev?.fileId) {
          oldFileId = prev.fileId;
        }

        // 1. Create new resume record FIRST
        savedResume = await Resume.create({
          userId: userObjId,
          fileName,
          fileId: storedFile?.fileId || '',
          fileUrl: storedFile?.fileUrl || '',
          mimeType: storedFile?.mimeType || mimeType,
          fileSize: storedFile?.size || 0,
          atsScore: analysisResult.atsScore,
          formattingScore: analysisResult.formattingScore,
          quantifiedImpactScore: analysisResult.quantifiedImpactScore,
          keywordMatchPct: analysisResult.keywordMatchPct,
          skillsFound: analysisResult.skillsFound,
          missingSkills: analysisResult.missingSkills,
          feedback: analysisResult.feedback,
          suggestions: analysisResult.suggestions,
          targetRole,
        });

        // 2. Only after successful creation of new record, clean up older resume records
        await Resume.deleteMany({
          _id: { $ne: savedResume._id },
          $or: [{ userId: userObjId }, { userId: String(userId) }],
        });

        // 3. Only after database replacement, delete old GridFS file
        if (oldFileId && storedFile && oldFileId !== storedFile.fileId) {
          await fileStorage.deleteFile(oldFileId).catch((delErr) => {
            console.warn(`[Resume Replace] Cleanup warning for old file ${oldFileId}:`, delErr?.message || delErr);
          });
        }

        // Also update User readinessScore
        await User.findByIdAndUpdate(userId, {
          readinessScore: analysisResult.atsScore,
        });
      } catch (dbErr) {
        console.warn('MongoDB error saving resume analysis:', dbErr);
        // Clean up orphan stored file if DB save failed
        if (storedFile?.fileId) {
          await fileStorage.deleteFile(storedFile.fileId).catch((cleanupErr) => {
            console.warn('[Resume Upload] Orphan cleanup warning after DB error:', cleanupErr?.message || cleanupErr);
          });
        }
        return sendSafeServerError(res, dbErr, 'Failed to save resume record to database.');
      }
    }

    const returnDoc = savedResume
      ? {
          id: savedResume._id,
          fileName: savedResume.fileName,
          fileId: savedResume.fileId || null,
          fileUrl: savedResume.fileUrl || (savedResume.fileId ? `/api/files/${savedResume.fileId}` : null),
          atsScore: savedResume.atsScore,
          formattingScore: savedResume.formattingScore,
          quantifiedImpactScore: savedResume.quantifiedImpactScore,
          keywordMatchPct: savedResume.keywordMatchPct,
          skillsFound: savedResume.skillsFound,
          missingSkills: savedResume.missingSkills,
          feedback: savedResume.feedback,
          suggestions: savedResume.suggestions,
          targetRole: savedResume.targetRole,
          updatedAt: savedResume.updatedAt,
        }
      : {
          id: `res_${Date.now()}`,
          fileName,
          fileId: storedFile?.fileId || null,
          fileUrl: storedFile?.fileUrl || null,
          ...analysisResult,
          targetRole,
          updatedAt: new Date().toISOString(),
        };

    return res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully',
      resume: returnDoc,
    });
  } catch (error: any) {
    if (storedFile?.fileId) {
      await fileStorage.deleteFile(storedFile.fileId).catch(() => {});
    }
    return sendSafeServerError(res, error, 'Server error analyzing resume');
  }
});

// DELETE /api/resume — remove user's resume record and persistent file
resumeRouter.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user?.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can manage resumes' });
    }

    let userObjId: any = userId;
    try {
      userObjId = new mongoose.Types.ObjectId(userId);
    } catch {
      userObjId = userId;
    }

    const resumes = await Resume.find({
      $or: [{ userId: userObjId }, { userId: String(userId) }],
    });

    for (const r of resumes) {
      if (r.fileId) {
        await fileStorage.deleteFile(r.fileId).catch(() => {});
      }
    }

    await Resume.deleteMany({
      $or: [{ userId: userObjId }, { userId: String(userId) }],
    });

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error deleting resume');
  }
});
