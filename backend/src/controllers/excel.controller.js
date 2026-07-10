import path from 'node:path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { createJob, updateJob } from '../services/jobStore.js';
import { cleanupFiles, validateUploadedFiles } from '../utils/files.js';
import * as excelService from '../services/excel.service.js';

const ALLOWED = ['.xlsx', '.csv'];

async function runJob(req, res, tool, processFn, isStatic = false) {
  try {
    const files = req.files || [];
    if (!files || files.length < 1) return res.status(400).json({ success: false, message: 'يرجى رفع ملف Excel.' });
    await validateUploadedFiles(files, ALLOWED);
    const jobId = uuidv4();
    const jobDir = path.join(config.resultsDir, jobId);
    await fs.ensureDir(jobDir);
    const saved = [];
    for (const file of files) {
      const dest = path.join(jobDir, file.filename);
      await fs.copy(file.path, dest, { overwrite: true });
      saved.push({ ...file, path: dest });
    }
    await cleanupFiles(files);
    const job = createJob({ id: jobId, category: 'excel', tool, status: 'queued', progress: 0, message: 'في قائمة الانتظار...', files: saved.map((f) => ({ originalname: f.originalname, size: f.size })), output: null });
    res.status(202).json({ success: true, data: job });
    if (isStatic) {
      try {
        updateJob(jobId, { status: 'processing', progress: 50, message: 'جاري التحليل...' });
        const result = await processFn(saved, jobDir, req);
        updateJob(jobId, { status: 'completed', progress: 100, message: result.message, output: result.outputPath ? { path: result.outputPath, downloadName: result.downloadName, mimeType: result.mimeType } : null, analyzeData: result.data || result.sheets ? { data: result.data, sheets: result.sheets, fileName: result.fileName, headers: result.headers, totalRows: result.totalRows, totalCols: result.totalCols, emptyCells: result.emptyCells, duplicateCount: result.duplicateCount, colStats: result.colStats, colTypes: result.colTypes, previewRows: result.previewRows } : null });
      } catch (err) {
        updateJob(jobId, { status: 'failed', progress: 100, message: err.message || 'فشل التحليل.' });
      }
    } else {
      processJobAsync(jobId, () => processFn(saved, jobDir, req));
    }
  } catch (err) {
    await cleanupFiles(req.files);
    if (!res.headersSent) res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

export const handleAnalyze = (req, res) => runJob(req, res, 'analyze', (s) => excelService.analyzeExcel(s[0]), true);
export const handleToCsv = (req, res) => runJob(req, res, 'to-csv', (s) => excelService.toCsv(s[0]));
export const handleCsvToExcel = (req, res) => runJob(req, res, 'csv-to-excel', (s) => excelService.csvToExcel(s[0]));
export const handleSplitSheets = (req, res) => runJob(req, res, 'split-sheets', (s) => excelService.splitSheets(s[0]));
export const handleMergeFiles = (req, res) => runJob(req, res, 'merge-files', (s, jd) => excelService.mergeFiles(s, jd));
export const handleMergeSheets = (req, res) => runJob(req, res, 'merge-sheets', (s) => excelService.mergeSheets(s[0]));
export const handleRemoveEmptyRows = (req, res) => runJob(req, res, 'remove-empty-rows', (s) => excelService.removeEmptyRows(s[0]));
export const handleRemoveEmptyColumns = (req, res) => runJob(req, res, 'remove-empty-columns', (s) => excelService.removeEmptyColumns(s[0]));
export const handleRemoveDuplicates = (req, res) => runJob(req, res, 'remove-duplicates', (s) => excelService.removeDuplicates(s[0]));
export const handleCleanSpaces = (req, res) => runJob(req, res, 'clean-spaces', (s) => excelService.cleanSpaces(s[0]));
export const handleSummary = (req, res) => runJob(req, res, 'summary', (s) => excelService.summaryExcel(s[0]), true);
export const handlePreview = (req, res) => runJob(req, res, 'preview', (s, jd, req) => excelService.previewData(s[0], req.body.mode || 'first'), true);
export const handleFillEmpty = (req, res) => runJob(req, res, 'fill-empty', (s, jd, req) => excelService.fillEmpty(s[0], req.body.text || ''));
export const handleSort = (req, res) => runJob(req, res, 'sort', (s, jd, req) => excelService.sortData(s[0], req.body.column || '', req.body.direction || 'asc'));
export const handleFilter = (req, res) => runJob(req, res, 'filter', (s, jd, req) => excelService.filterData(s[0], req.body.column || '', req.body.value || ''));

export const handleFindReplaceExcel = (req, res) => runJob(req, res, 'find-replace', async (s) => {
  const findText = req.body.find || '';
  const replaceText = req.body.replace || '';
  if (!findText) throw new Error('يرجى إدخال القيمة المطلوب البحث عنها.');
  return excelService.findReplaceExcel(s[0], findText, replaceText);
});

async function processJobAsync(jobId, processFn) {
  try {
    updateJob(jobId, { status: 'processing', progress: 30, message: 'جاري المعالجة...' });
    const result = await processFn();
    updateJob(jobId, { status: 'completed', progress: 100, message: result.message, output: { path: result.outputPath, downloadName: result.downloadName, mimeType: result.mimeType } });
  } catch (err) {
    updateJob(jobId, { status: 'failed', progress: 100, message: err.message || 'فشلت المعالجة.' });
  }
}
