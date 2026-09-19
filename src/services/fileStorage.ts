import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Readable } from 'stream';

export const MAX_FILE_SIZE_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024; // 10MB default

export const FILE_STORAGE_MODE = (process.env.FILE_STORAGE_MODE || 'gridfs').toLowerCase();

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedOriginalName: string;
  mimeType: string;
  extension: string;
}

export interface StoredFileMetadata {
  userId: string;
  ownerStudentId?: string;
  documentType?: 'resume' | 'certification' | 'document';
  documentRecordId?: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: 'resume' | 'certification' | 'document';
  uploadedAt: Date;
}

export interface UploadFileResult {
  fileId: string;
  fileUrl: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * Validates file buffer, file size, extensions, and file signatures / magic bytes.
 */
export function validateFile(
  buffer: Buffer,
  originalName: string,
  declaredMimeType?: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: 'Uploaded file is empty.',
      sanitizedOriginalName: '',
      mimeType: '',
      extension: '',
    };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const mb = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of ${mb}MB.`,
      sanitizedOriginalName: '',
      mimeType: '',
      extension: '',
    };
  }

  // Prevent path traversal & extract clean basename
  const rawBase = path.basename(originalName || 'document');
  const sanitizedOriginalName = rawBase.replace(/[\/\\]/g, '').replace(/[^\w.\-]/g, '_');
  const ext = path.extname(sanitizedOriginalName).toLowerCase();

  const allowedExtensions: Record<string, string[]> = {
    '.pdf': ['application/pdf', 'application/x-pdf'],
    '.png': ['image/png'],
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.doc': ['application/msword'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
    ],
  };

  if (!allowedExtensions[ext]) {
    return {
      valid: false,
      error: `Unsupported file type "${ext}". Allowed formats: PDF, PNG, JPG, JPEG, DOC, DOCX.`,
      sanitizedOriginalName,
      mimeType: '',
      extension: ext,
    };
  }

  // Explicitly block dangerous extensions
  const dangerous = ['.exe', '.sh', '.bat', '.cmd', '.js', '.ts', '.py', '.php', '.pl', '.vbs', '.scr', '.bin', '.msi'];
  if (dangerous.includes(ext)) {
    return {
      valid: false,
      error: 'Dangerous or executable file formats are prohibited.',
      sanitizedOriginalName,
      mimeType: '',
      extension: ext,
    };
  }

  // Magic bytes / signature verification
  if (ext === '.pdf') {
    if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return {
        valid: false,
        error: 'Invalid PDF format: file signature does not match PDF specification.',
        sanitizedOriginalName,
        mimeType: 'application/pdf',
        extension: ext,
      };
    }
  } else if (ext === '.png') {
    if (buffer.length < 4 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      return {
        valid: false,
        error: 'Invalid PNG format: file signature does not match PNG specification.',
        sanitizedOriginalName,
        mimeType: 'image/png',
        extension: ext,
      };
    }
  } else if (ext === '.jpg' || ext === '.jpeg') {
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return {
        valid: false,
        error: 'Invalid JPEG format: file signature does not match JPEG specification.',
        sanitizedOriginalName,
        mimeType: 'image/jpeg',
        extension: ext,
      };
    }
  } else if (ext === '.doc') {
    if (buffer.length < 4 || buffer[0] !== 0xd0 || buffer[1] !== 0xcf || buffer[2] !== 0x11 || buffer[3] !== 0xe0) {
      return {
        valid: false,
        error: 'Invalid DOC format: file signature does not match OLE compound specification.',
        sanitizedOriginalName,
        mimeType: 'application/msword',
        extension: ext,
      };
    }
  } else if (ext === '.docx') {
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return {
        valid: false,
        error: 'Invalid DOCX format: file signature does not match ZIP container specification.',
        sanitizedOriginalName,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: ext,
      };
    }
  }

  // Canonical mime type
  let resolvedMime = declaredMimeType;
  if (!resolvedMime || resolvedMime === 'application/octet-stream') {
    if (ext === '.pdf') resolvedMime = 'application/pdf';
    else if (ext === '.png') resolvedMime = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') resolvedMime = 'image/jpeg';
    else if (ext === '.doc') resolvedMime = 'application/msword';
    else if (ext === '.docx') resolvedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return {
    valid: true,
    sanitizedOriginalName,
    mimeType: resolvedMime || 'application/pdf',
    extension: ext,
  };
}

function isDevelopmentDiskAllowed(): boolean {
  return (
    (FILE_STORAGE_MODE === 'development_disk' || FILE_STORAGE_MODE === 'filesystem') &&
    process.env.NODE_ENV !== 'production'
  );
}

const DISK_STORAGE_DIR = process.env.PERSISTENT_STORAGE_DIR || path.join(process.cwd(), '.persistent_storage');

function ensureDiskDirs() {
  const filesDir = path.join(DISK_STORAGE_DIR, 'files');
  const metaDir = path.join(DISK_STORAGE_DIR, 'meta');
  if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
  return { filesDir, metaDir };
}

/**
 * Retrieves the MongoDB GridFSBucket using existing Mongoose connection, or null if disconnected.
 */
function getBucket(): any | null {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'documents',
    });
  }
  return null;
}

/**
 * Storage Service abstraction (MongoDB GridFS persistent storage)
 */
export const fileStorage = {
  /**
   * Validates whether a file identifier is syntactically valid for the active storage mode.
   */
  isValidId(fileId: string): boolean {
    if (!fileId || typeof fileId !== 'string') {
      return false;
    }
    const cleanId = fileId.trim();
    if (FILE_STORAGE_MODE === 'gridfs' || !isDevelopmentDiskAllowed()) {
      return /^[0-9a-fA-F]{24}$/.test(cleanId) && mongoose.mongo.ObjectId.isValid(cleanId);
    }
    return /^[0-9a-fA-F]{24}$/.test(cleanId) || /^[0-9a-zA-Z_\-]{12,64}$/.test(cleanId);
  },

  /**
   * Validates and persists a file into persistent GridFS storage.
   * Fails explicitly if the persistent storage service is unavailable.
   */
  async uploadFile(options: {
    buffer: Buffer;
    originalName: string;
    mimeType?: string;
    userId: string;
    ownerStudentId?: string;
    documentType?: 'resume' | 'certification' | 'document';
    documentRecordId?: string;
    category?: 'resume' | 'certification' | 'document';
  }): Promise<UploadFileResult> {
    const {
      buffer,
      originalName,
      declaredMimeType,
      userId,
      ownerStudentId = userId,
      documentType,
      documentRecordId,
      category = 'document',
    } = {
      ...options,
      declaredMimeType: options.mimeType,
    };

    const validation = validateFile(buffer, originalName, declaredMimeType);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed');
    }

    const safeExt = validation.extension;
    const safeStorageFileName = `${userId}/${crypto.randomUUID()}${safeExt}`;
    const resolvedDocType = documentType || category;

    // Production & Default: GridFS persistent storage
    if (FILE_STORAGE_MODE === 'gridfs' || !isDevelopmentDiskAllowed()) {
      const bucket = getBucket();
      if (!bucket) {
        throw new Error(
          'Document storage unavailable: MongoDB GridFS connection is required for persistent document storage.'
        );
      }

      const uploadStream = bucket.openUploadStream(safeStorageFileName, {
        contentType: validation.mimeType,
        metadata: {
          userId: String(userId),
          ownerStudentId: String(ownerStudentId),
          documentType: resolvedDocType,
          documentRecordId: documentRecordId ? String(documentRecordId) : undefined,
          originalName: validation.sanitizedOriginalName,
          mimeType: validation.mimeType,
          size: buffer.length,
          category,
          uploadedAt: new Date(),
        },
      });

      const fileId = uploadStream.id.toString();

      await new Promise<void>((resolve, reject) => {
        uploadStream.on('finish', () => resolve());
        uploadStream.on('error', (err: any) => reject(err));
        uploadStream.end(buffer);
      });

      return {
        fileId,
        fileUrl: `/api/files/${fileId}`,
        fileName: safeStorageFileName,
        originalName: validation.sanitizedOriginalName,
        mimeType: validation.mimeType,
        size: buffer.length,
      };
    }

    // Explicit non-production development fallback (only when FILE_STORAGE_MODE=development_disk)
    const { filesDir, metaDir } = ensureDiskDirs();
    const fileId = crypto.randomBytes(12).toString('hex');
    const diskFilePath = path.join(filesDir, fileId);
    const diskMetaPath = path.join(metaDir, `${fileId}.json`);

    const meta: StoredFileMetadata = {
      userId: String(userId),
      ownerStudentId: String(ownerStudentId),
      documentType: resolvedDocType,
      documentRecordId: documentRecordId ? String(documentRecordId) : undefined,
      originalName: validation.sanitizedOriginalName,
      mimeType: validation.mimeType,
      size: buffer.length,
      category,
      uploadedAt: new Date(),
    };

    await fs.promises.writeFile(diskFilePath, buffer);
    await fs.promises.writeFile(
      diskMetaPath,
      JSON.stringify(
        {
          _id: fileId,
          filename: safeStorageFileName,
          contentType: validation.mimeType,
          length: buffer.length,
          uploadDate: new Date(),
          metadata: meta,
        },
        null,
        2
      )
    );

    return {
      fileId,
      fileUrl: `/api/files/${fileId}`,
      fileName: safeStorageFileName,
      originalName: validation.sanitizedOriginalName,
      mimeType: validation.mimeType,
      size: buffer.length,
    };
  },

  /**
   * Retrieves file metadata and an open stream creator for download.
   */
  async getFile(fileId: string): Promise<{
    file: any;
    metadata: StoredFileMetadata;
    openStream: () => Readable;
  } | null> {
    if (!this.isValidId(fileId)) {
      return null;
    }

    const bucket = getBucket();
    if (bucket && mongoose.mongo.ObjectId.isValid(fileId)) {
      try {
        const files = await bucket.find({ _id: new mongoose.mongo.ObjectId(fileId) }).toArray();
        if (files && files.length > 0) {
          const fileDoc = files[0];
          return {
            file: fileDoc,
            metadata: (fileDoc.metadata || {}) as StoredFileMetadata,
            openStream: () => bucket.openDownloadStream(new mongoose.mongo.ObjectId(fileId)),
          };
        }
      } catch (gridErr: any) {
        console.warn(`[fileStorage.getFile] GridFS error for file ${fileId}:`, gridErr?.message || gridErr);
      }
    }

    // Check development disk storage if explicitly allowed
    if (isDevelopmentDiskAllowed()) {
      const { filesDir, metaDir } = ensureDiskDirs();
      const diskFilePath = path.join(filesDir, fileId);
      const diskMetaPath = path.join(metaDir, `${fileId}.json`);

      if (fs.existsSync(diskFilePath) && fs.existsSync(diskMetaPath)) {
        try {
          const metaRaw = await fs.promises.readFile(diskMetaPath, 'utf8');
          const fileDoc = JSON.parse(metaRaw);
          return {
            file: fileDoc,
            metadata: fileDoc.metadata as StoredFileMetadata,
            openStream: () => fs.createReadStream(diskFilePath),
          };
        } catch (readErr) {
          console.error('[fileStorage.getFile] Error reading disk file metadata:', readErr);
        }
      }
    }

    return null;
  },

  /**
   * Returns a readable stream for the file.
   */
  async getFileStream(fileId: string): Promise<Readable> {
    const stored = await this.getFile(fileId);
    if (!stored) {
      throw new Error('File not found in storage');
    }
    return stored.openStream();
  },

  /**
   * Deletes a file from persistent storage. Safe against missing files.
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.isValidId(fileId)) {
      return false;
    }

    let deleted = false;
    const bucket = getBucket();
    if (bucket && mongoose.mongo.ObjectId.isValid(fileId)) {
      try {
        await bucket.delete(new mongoose.mongo.ObjectId(fileId));
        deleted = true;
      } catch (err: any) {
        if (!err?.message?.includes('FileNotFound') && err?.code !== 'ENOENT') {
          console.warn(`[fileStorage.deleteFile] GridFS delete warning ${fileId}:`, err?.message || err);
        }
      }
    }

    if (isDevelopmentDiskAllowed()) {
      const { filesDir, metaDir } = ensureDiskDirs();
      const diskFilePath = path.join(filesDir, fileId);
      const diskMetaPath = path.join(metaDir, `${fileId}.json`);

      if (fs.existsSync(diskFilePath)) {
        try {
          await fs.promises.unlink(diskFilePath);
          deleted = true;
        } catch {}
      }
      if (fs.existsSync(diskMetaPath)) {
        try {
          await fs.promises.unlink(diskMetaPath);
          deleted = true;
        } catch {}
      }
    }

    return deleted;
  },
};
