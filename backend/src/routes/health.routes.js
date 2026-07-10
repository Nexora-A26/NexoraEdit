import { Router } from 'express';
const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, service: 'NexoraEdit API', status: 'healthy', time: new Date().toISOString() });
});

export default router;