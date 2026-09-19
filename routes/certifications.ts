import { Router, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { Type } from '@google/genai';
import { Certification, CertificationCategory } from '../src/models/Certification';
import { authMiddleware, AuthRequest } from './authMiddleware';
import { sendSafeServerError } from './errorHandler';
import { callGeminiResilient } from './geminiClient';
import { fileStorage, validateFile, MAX_FILE_SIZE_BYTES } from '../src/services/fileStorage';

export const certificationsRouter = Router();

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
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }
  }
  return null;
}

// GET /api/certifications/me — return user's certifications, grouped by category
certificationsRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let userCertifications: any[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = userId;
        try {
          userObjId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjId = userId;
        }

        userCertifications = await Certification.find({
          $or: [{ userId: userObjId }, { userId: String(userId) }],
        } as any).sort({ addedAt: -1, createdAt: -1 });
      } catch (dbErr) {
        console.warn('MongoDB error fetching certifications:', dbErr);
      }
    }

    const grouped: Record<CertificationCategory, any[]> = {
      Global: [],
      National: [],
      'Local/College': [],
      Other: [],
    };

    userCertifications.forEach((cert) => {
      const cat = (cert.category as CertificationCategory) || 'Other';
      if (grouped[cat]) {
        grouped[cat].push(cert);
      } else {
        grouped.Other.push(cert);
      }
    });

    return res.status(200).json({
      success: true,
      certifications: userCertifications,
      grouped,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error fetching certifications');
  }
});

// POST /api/certifications/upload — accepts PDF/image, persists file, uses Gemini multimodal extraction
certificationsRouter.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  let storedFile: any = null;
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'No certificate file uploaded' });
    }

    // 1. Validate file format, size, and magic bytes
    const validation = validateFile(file.buffer, file.originalname, file.mimetype);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error || 'Invalid certificate file format.',
      });
    }

    const mimeType = validation.mimeType;

    // 2. Persist into GridFS storage
    try {
      storedFile = await fileStorage.uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: validation.mimeType,
        userId: String(userId),
        ownerStudentId: String(userId),
        category: 'certification',
        documentType: 'certification',
      });
    } catch (storageErr: any) {
      console.error('[Certificate Upload] Storage error:', storageErr);
      return res.status(503).json({
        error: 'Storage unavailable',
      });
    }

    const base64Data = file.buffer.toString('base64');

    if (!process.env.GEMINI_API_KEY) {
      if (storedFile?.fileId) {
        await fileStorage.deleteFile(storedFile.fileId).catch(() => {});
      }
      return res.status(422).json({
        error: 'Unable to extract certificate details — please fill in the details manually.',
      });
    }

    let extractedData: {
      title?: string;
      issuer?: string;
      category?: CertificationCategory;
      dateIssued?: string;
      credentialUrl?: string;
      confident?: boolean;
    } | null = null;

    try {
      const response = await callGeminiResilient({
        models: ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'],
        contents: [
          {
            inlineData: {
              mimeType: mimeType === 'application/octet-stream' ? 'application/pdf' : mimeType,
              data: base64Data,
            },
          },
          `Examine this uploaded certificate or achievement document.
Extract:
1. title: Exact official name of the certificate, course, or achievement.
2. issuer: Organization, university, or platform that issued it (e.g. AWS, Google, Coursera, NPTEL, Stanford, IIT Bombay, Local College).
3. category: Classify as strictly one of:
   - "Global" (e.g. AWS, Google Cloud, Coursera, Microsoft, Meta, edX, Cisco, Oracle, Udemy, LinkedIn Learning)
   - "National" (e.g. NPTEL, Swayam, Skill India, government/state bodies, AICTE)
   - "Local/College" (e.g. college workshops, university hackathons, campus clubs, internal certificates)
   - "Other" (if unclear or unclassifiable)
4. dateIssued: Date or month/year issued if present (e.g. "May 2024", "2023-11-15"), or empty string if not found.
5. credentialUrl: Verification link or URL if printed on the document, or empty string.
6. confident: boolean, set to true ONLY if you can clearly read and identify BOTH title and issuer with high confidence. Otherwise set to false.`,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              issuer: { type: Type.STRING },
              category: {
                type: Type.STRING,
                enum: ['Global', 'National', 'Local/College', 'Other'],
              },
              dateIssued: { type: Type.STRING },
              credentialUrl: { type: Type.STRING },
              confident: { type: Type.BOOLEAN },
            },
            required: ['title', 'issuer', 'category', 'confident'],
          },
        },
      });

      if (response.text) {
        extractedData = parseJsonSafely(response.text);
      }
    } catch (geminiErr: any) {
      console.warn('Gemini error during certificate multimodal extraction:', geminiErr?.message || geminiErr);
    }

    if (
      !extractedData ||
      !extractedData.confident ||
      !extractedData.title ||
      !extractedData.issuer ||
      extractedData.title.trim().length < 2 ||
      extractedData.issuer.trim().length < 2
    ) {
      // Clean up orphaned stored file on extraction failure
      if (storedFile?.fileId) {
        await fileStorage.deleteFile(storedFile.fileId).catch(() => {});
      }
      return res.status(422).json({
        error: 'Unable to extract certificate details confidently — please fill in the details manually.',
      });
    }

    const validCategory: CertificationCategory = ['Global', 'National', 'Local/College', 'Other'].includes(
      extractedData.category as string
    )
      ? (extractedData.category as CertificationCategory)
      : 'Other';

    let savedCert: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = userId;
        try {
          userObjId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjId = userId;
        }

        savedCert = await Certification.create({
          userId: userObjId,
          title: extractedData.title.trim(),
          issuer: extractedData.issuer.trim(),
          category: validCategory,
          dateIssued: extractedData.dateIssued || '',
          credentialUrl: extractedData.credentialUrl || '',
          fileUrl: storedFile.fileUrl,
          fileId: storedFile.fileId,
          fileName: storedFile.originalName,
          mimeType: storedFile.mimeType,
          fileSize: storedFile.size,
          source: 'upload',
          verificationStatus: 'PENDING',
          verificationNote: '',
          verifiedBy: null,
          verifiedAt: null,
        });
      } catch (dbErr) {
        console.warn('MongoDB error creating certification:', dbErr);
        if (storedFile?.fileId) {
          await fileStorage.deleteFile(storedFile.fileId).catch(() => {});
        }
        return sendSafeServerError(res, dbErr, 'Database failed to save certification record');
      }
    }

    const responseCert = savedCert
      ? savedCert
      : {
          _id: `cert_${Date.now()}`,
          userId,
          title: extractedData.title.trim(),
          issuer: extractedData.issuer.trim(),
          category: validCategory,
          dateIssued: extractedData.dateIssued || '',
          credentialUrl: extractedData.credentialUrl || '',
          fileUrl: storedFile.fileUrl,
          fileId: storedFile.fileId,
          fileName: storedFile.originalName,
          mimeType: storedFile.mimeType,
          fileSize: storedFile.size,
          source: 'upload',
          addedAt: new Date(),
        };

    return res.status(200).json({
      success: true,
      message: 'Certificate uploaded and extracted successfully',
      certification: responseCert,
    });
  } catch (error: any) {
    if (storedFile?.fileId) {
      await fileStorage.deleteFile(storedFile.fileId).catch(() => {});
    }
    return sendSafeServerError(res, error, 'Server error uploading certification');
  }
});

// POST /api/certifications/manual — save directly as source: 'manual'
certificationsRouter.post('/manual', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, issuer, category = 'Other', dateIssued = '', credentialUrl = '' } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Certificate title is required' });
    }

    if (!issuer || typeof issuer !== 'string' || !issuer.trim()) {
      return res.status(400).json({ error: 'Issuing organization is required' });
    }

    const validCategory: CertificationCategory = ['Global', 'National', 'Local/College', 'Other'].includes(
      category
    )
      ? category
      : 'Other';

    let savedCert: any = null;

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = userId;
        try {
          userObjId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjId = userId;
        }

        savedCert = await Certification.create({
          userId: userObjId,
          title: title.trim(),
          issuer: issuer.trim(),
          category: validCategory,
          dateIssued: typeof dateIssued === 'string' ? dateIssued.trim() : '',
          credentialUrl: typeof credentialUrl === 'string' ? credentialUrl.trim() : '',
          source: 'manual',
          verificationStatus: 'PENDING',
          verificationNote: '',
          verifiedBy: null,
          verifiedAt: null,
        });
      } catch (dbErr) {
        console.warn('MongoDB error creating manual certification:', dbErr);
      }
    }

    const responseCert = savedCert
      ? savedCert
      : {
          _id: `cert_${Date.now()}`,
          userId,
          title: title.trim(),
          issuer: issuer.trim(),
          category: validCategory,
          dateIssued: typeof dateIssued === 'string' ? dateIssued.trim() : '',
          credentialUrl: typeof credentialUrl === 'string' ? credentialUrl.trim() : '',
          source: 'manual',
          verificationStatus: 'PENDING',
          verificationNote: '',
          verifiedBy: null,
          verifiedAt: null,
          addedAt: new Date(),
        };

    return res.status(200).json({
      success: true,
      message: 'Certification added successfully',
      certification: responseCert,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error adding certification');
  }
});

/**
 * PATCH /api/certifications/:id
 * Student updates / resubmits certification.
 * Security rule: Any update resets verificationStatus to PENDING.
 */
certificationsRouter.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid certification ID format' });
    }

    let userObjId: any = userId;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjId = new mongoose.Types.ObjectId(userId);
      }
    } catch {
      userObjId = userId;
    }

    const cert = await Certification.findOne({
      _id: id,
      $or: [{ userId }, { userId: userObjId }],
    });

    if (!cert) {
      return res.status(404).json({ error: 'Certification not found or unauthorized' });
    }

    const { title, issuer, category, dateIssued, credentialUrl } = req.body;
    const VALID_CATEGORIES: CertificationCategory[] = ['Global', 'National', 'Local/College', 'Other'];

    if (title !== undefined) cert.title = String(title).trim();
    if (issuer !== undefined) cert.issuer = String(issuer).trim();
    if (category !== undefined && VALID_CATEGORIES.includes(category)) {
      cert.category = category;
    }
    if (dateIssued !== undefined) cert.dateIssued = String(dateIssued).trim();
    if (credentialUrl !== undefined) cert.credentialUrl = String(credentialUrl).trim();

    // Security rule: reset to PENDING on edit
    cert.verificationStatus = 'PENDING';
    cert.verificationNote = '';
    cert.verifiedBy = null;
    cert.verifiedAt = null;

    await cert.save();

    return res.status(200).json({
      success: true,
      message: 'Certification updated and resubmitted for verification',
      certification: cert,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error updating certification');
  }
});

// DELETE /api/certifications/:id — remove a certification belonging to the user
certificationsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const certId = req.params.id;
    if (!certId || !mongoose.Types.ObjectId.isValid(certId)) {
      return res.status(400).json({ error: 'Invalid certification ID format' });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        let userObjId: any = userId;
        try {
          userObjId = new mongoose.Types.ObjectId(userId);
        } catch {
          userObjId = userId;
        }

        const certToDelete = await Certification.findOne({
          _id: certId,
          $or: [{ userId: userObjId }, { userId: String(userId) }],
        } as any);

        if (!certToDelete) {
          return res.status(404).json({ error: 'Certification not found or unauthorized' });
        }

        const fileIdToDelete =
          certToDelete.fileId ||
          (certToDelete.fileUrl && certToDelete.fileUrl.startsWith('/api/files/')
            ? certToDelete.fileUrl.replace('/api/files/', '')
            : null);

        // 1. Delete database record first
        await Certification.deleteOne({ _id: certToDelete._id });

        // 2. Clean up persisted file from GridFS storage
        if (fileIdToDelete) {
          await fileStorage.deleteFile(fileIdToDelete).catch((delErr) => {
            console.warn(`[Certification Delete] Storage cleanup warning for file ${fileIdToDelete}:`, delErr?.message || delErr);
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB error deleting certification:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Certification removed successfully',
      deletedId: certId,
    });
  } catch (error: any) {
    return sendSafeServerError(res, error, 'Server error deleting certification');
  }
});
