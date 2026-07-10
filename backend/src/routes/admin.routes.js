import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
  getStats,
  getUploadedFiles,
  getResultFiles,
  downloadFile,
  deleteFile,
  getJobs,
  getJobDetail,
  deleteJob,
  getTools,
  toggleTool,
  updateTool,
  getAppSettings,
  updateAppSettings
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/files/uploads', getUploadedFiles);
router.get('/files/results', getResultFiles);
router.get('/files/:type/*/download', downloadFile);
router.delete('/files/:type/*', deleteFile);
router.get('/jobs', getJobs);
router.get('/jobs/:jobId', getJobDetail);
router.delete('/jobs/:jobId', deleteJob);
router.get('/tools', getTools);
router.patch('/tools/:toolId/toggle', toggleTool);
router.patch('/tools/:toolId', updateTool);
router.get('/settings', getAppSettings);
router.patch('/settings', updateAppSettings);

export default router;
