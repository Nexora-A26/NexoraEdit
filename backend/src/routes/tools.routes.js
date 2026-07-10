import { Router } from 'express';
import toolsData from '../../data/tools.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, data: toolsData });
});

export default router;
