import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireToolEnabled } from '../middleware/toolCheck.js';
import {
  handleMerge, handleSplit, handleRotate, handleCompress,
  handleExtractPages, handleDeletePages, handleImagesToPdf,
  handleReorderPages, handleReversePages, handleInfo,
  handleText, handleAddWatermark, handleAddPageNumbers
} from '../controllers/pdf.controller.js';

const router = Router();

router.post('/merge', requireToolEnabled('pdf-merge'), upload.array('files', 20), handleMerge);
router.post('/split', requireToolEnabled('pdf-split'), upload.array('files', 1), handleSplit);
router.post('/rotate', requireToolEnabled('pdf-rotate'), upload.array('files', 1), handleRotate);
router.post('/compress', requireToolEnabled('pdf-compress'), upload.array('files', 1), handleCompress);
router.post('/extract-pages', requireToolEnabled('pdf-extract-pages'), upload.array('files', 1), handleExtractPages);
router.post('/delete-pages', requireToolEnabled('pdf-delete-pages'), upload.array('files', 1), handleDeletePages);
router.post('/images-to-pdf', requireToolEnabled('pdf-images-to-pdf'), upload.array('files', 20), handleImagesToPdf);
router.post('/reorder-pages', requireToolEnabled('pdf-reorder-pages'), upload.array('files', 1), handleReorderPages);
router.post('/reverse-pages', requireToolEnabled('pdf-reverse-pages'), upload.array('files', 1), handleReversePages);
router.post('/info', requireToolEnabled('pdf-info'), upload.array('files', 1), handleInfo);
router.post('/text', requireToolEnabled('pdf-to-text'), upload.array('files', 1), handleText);
router.post('/add-watermark', requireToolEnabled('pdf-add-watermark'), upload.array('files', 1), handleAddWatermark);
router.post('/add-page-numbers', requireToolEnabled('pdf-add-page-numbers'), upload.array('files', 1), handleAddPageNumbers);

export default router;
