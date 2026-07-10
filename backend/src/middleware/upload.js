import multer from 'multer';
import path from 'node:path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.csv', '.jpg', '.jpeg', '.png']);

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const tempDir = path.join(config.uploadDir, 'temp');
    await fs.ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileMb * 1024 * 1024, files: 20, fields: 20, fieldSize: 256 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      const error = new Error(`Unsupported file type: ${extension || 'unknown'}`);
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  }
});
