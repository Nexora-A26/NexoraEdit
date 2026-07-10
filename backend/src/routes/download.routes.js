import { Router } from 'express';
import { getJob } from '../services/jobStore.js';
import fs from 'fs-extra';
import path from 'node:path';
import { config } from '../config.js';
import { resolveWithin } from '../utils/files.js';

const router = Router();

router.get('/:jobId', async (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة.' });
  if (job.status !== 'completed' || !job.output?.path) {
    return res.status(400).json({ success: false, message: 'الملف الناتج غير جاهز بعد.' });
  }
  const relativeOutputPath = path.relative(config.resultsDir, job.output.path);
  let outputPath;
  try {
    outputPath = resolveWithin(config.resultsDir, relativeOutputPath);
  } catch {
    return res.status(404).json({ success: false, message: 'ملف النتيجة غير موجود.' });
  }
  const exists = await fs.pathExists(outputPath);
  if (!exists) return res.status(404).json({ success: false, message: 'ملف النتيجة غير موجود.' });
  res.set('Cache-Control', 'private, no-store');
  res.download(outputPath, job.output.downloadName);
});

export default router;
