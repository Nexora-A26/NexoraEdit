import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireToolEnabled } from '../middleware/toolCheck.js';
import {
  handleAnalyze, handleToCsv, handleCsvToExcel, handleSplitSheets,
  handleMergeFiles, handleMergeSheets,
  handleRemoveEmptyRows, handleRemoveEmptyColumns, handleRemoveDuplicates,
  handleCleanSpaces, handleFindReplaceExcel, handleSort, handleFilter,
  handleFillEmpty, handleSummary, handlePreview
} from '../controllers/excel.controller.js';

const router = Router();

router.post('/analyze', requireToolEnabled('excel-analyze'), upload.array('files', 1), handleAnalyze);
router.post('/to-csv', requireToolEnabled('excel-to-csv'), upload.array('files', 1), handleToCsv);
router.post('/csv-to-excel', requireToolEnabled('excel-csv-to-excel'), upload.array('files', 1), handleCsvToExcel);
router.post('/split-sheets', requireToolEnabled('excel-split-sheets'), upload.array('files', 1), handleSplitSheets);
router.post('/merge-files', requireToolEnabled('excel-merge-files'), upload.array('files', 20), handleMergeFiles);
router.post('/merge-sheets', requireToolEnabled('excel-merge-sheets'), upload.array('files', 1), handleMergeSheets);
router.post('/remove-empty-rows', requireToolEnabled('excel-remove-empty-rows'), upload.array('files', 1), handleRemoveEmptyRows);
router.post('/remove-empty-columns', requireToolEnabled('excel-remove-empty-columns'), upload.array('files', 1), handleRemoveEmptyColumns);
router.post('/remove-duplicates', requireToolEnabled('excel-remove-duplicates'), upload.array('files', 1), handleRemoveDuplicates);
router.post('/clean-spaces', requireToolEnabled('excel-clean-spaces'), upload.array('files', 1), handleCleanSpaces);
router.post('/find-replace', requireToolEnabled('excel-find-replace'), upload.array('files', 1), handleFindReplaceExcel);
router.post('/sort', requireToolEnabled('sort'), upload.array('files', 1), handleSort);
router.post('/filter', requireToolEnabled('filter'), upload.array('files', 1), handleFilter);
router.post('/fill-empty', requireToolEnabled('excel-fill-empty'), upload.array('files', 1), handleFillEmpty);
router.post('/summary', requireToolEnabled('excel-summary'), upload.array('files', 1), handleSummary);
router.post('/preview/first', requireToolEnabled('excel-preview-first'), upload.array('files', 1), handlePreview);
router.post('/preview/last', requireToolEnabled('excel-preview-last'), upload.array('files', 1), handlePreview);

export default router;
