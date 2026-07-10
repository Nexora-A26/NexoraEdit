import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production';

function positiveNumber(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
}

const adminKey = String(process.env.ADMIN_KEY || (isProduction ? '' : 'change-me-in-env')).trim();
if (isProduction && (adminKey.length < 16 || ['123456', 'change-me', 'change-me-in-env'].includes(adminKey))) {
  throw new Error('ADMIN_KEY must be a unique value of at least 16 characters in production.');
}

const defaultFrontendOrigins = isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = String(process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const storageDir = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(rootDir, 'storage');

export const config = {
  isProduction,
  port: Number(process.env.PORT || 4000),
  allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : defaultFrontendOrigins,
  maxFileMb: positiveNumber(process.env.MAX_FILE_MB, 50, 100),
  jobRetentionHours: positiveNumber(process.env.JOB_RETENTION_HOURS, 24, 168),
  trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false,
  rootDir,
  frontendDistDir: path.resolve(rootDir, '..', 'frontend', 'dist'),
  storageDir,
  uploadDir: path.join(storageDir, 'uploads'),
  resultsDir: path.join(storageDir, 'results'),
  jobsFile: path.join(storageDir, 'jobs.json'),
  adminKey
};
