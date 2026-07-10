import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import fs from 'fs-extra';
import path from 'node:path';
import { config } from './config.js';
import healthRoutes from './routes/health.routes.js';
import toolsRoutes from './routes/tools.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import downloadRoutes from './routes/download.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import wordRoutes from './routes/word.routes.js';
import excelRoutes from './routes/excel.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminService from './services/admin.service.js';
import { loadJobs } from './services/jobStore.js';
import { startCleanupTask } from './services/cleanup.service.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

await fs.ensureDir(config.uploadDir);
await fs.ensureDir(config.resultsDir);
await fs.ensureDir(path.dirname(config.jobsFile));
await loadJobs();
startCleanupTask();

export const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
if (config.allowedOrigins.length > 0) {
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      const error = new Error('Origin is not allowed.');
      error.status = 403;
      return callback(error);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Admin-Key', 'X-Language']
  }));
}
app.use(express.json({ limit: '256kb' }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again shortly.' }
});
const processingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many processing requests. Please wait before trying again.' }
});
app.use('/api', apiLimiter);

app.get('/api', (_req, res) => {
  res.json({ success: true, message: 'NexoraEdit API is running' });
});

app.use('/api/health', healthRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/pdf', processingLimiter, pdfRoutes);
app.use('/api/word', processingLimiter, wordRoutes);
app.use('/api/excel', processingLimiter, excelRoutes);
app.use('/api/admin', adminRoutes);

// Public tool settings
app.get('/api/tools/settings', async (_req, res) => {
  const settings = await adminService.getToolSettings();
  res.json({ success: true, data: settings });
});

const frontendIndex = path.join(config.frontendDistDir, 'index.html');
if (config.isProduction && await fs.pathExists(frontendIndex)) {
  app.use(express.static(config.frontendDistDir, { maxAge: '1d', index: false }));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => res.sendFile(frontendIndex));
} else {
  app.get('/', (_req, res) => res.json({ success: true, message: 'NexoraEdit API is running. Start the Vite frontend for the website.' }));
}

app.use(notFoundHandler);
app.use(errorHandler);
