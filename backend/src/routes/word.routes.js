import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireToolEnabled } from '../middleware/toolCheck.js';
import {
  handleExtractText, handleWordCount, handleFindReplace,
  handleToTxt, handleCleanText, handleToHtml,
  handleExtractHeadings, handleExtractLinks, handleCreateFromText
} from '../controllers/word.controller.js';

const router = Router();

router.post('/extract-text', requireToolEnabled('word-extract-text'), upload.array('files', 1), handleExtractText);
router.post('/word-count', requireToolEnabled('word-count'), upload.array('files', 1), handleWordCount);
router.post('/find-replace', requireToolEnabled('word-find-replace'), upload.array('files', 1), handleFindReplace);
router.post('/to-txt', requireToolEnabled('word-to-txt'), upload.array('files', 1), handleToTxt);
router.post('/clean-text', requireToolEnabled('word-clean-text'), upload.array('files', 1), handleCleanText);
router.post('/to-html', requireToolEnabled('word-to-html'), upload.array('files', 1), handleToHtml);
router.post('/extract-headings', requireToolEnabled('word-extract-headings'), upload.array('files', 1), handleExtractHeadings);
router.post('/extract-links', requireToolEnabled('word-extract-links'), upload.array('files', 1), handleExtractLinks);
router.post('/create-from-text', requireToolEnabled('create-from-text'), upload.array('files', 0), handleCreateFromText);

export default router;
