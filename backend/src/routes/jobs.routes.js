import { Router } from 'express';
import { getJob, toPublicJob } from '../services/jobStore.js';

const router = Router();

// GET /api/jobs/:jobId
router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة.' });
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: toPublicJob(job) });
});

export default router;
