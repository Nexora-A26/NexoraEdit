import path from 'node:path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { createJob, updateJob } from '../services/jobStore.js';
import { cleanupFiles, validateUploadedFiles } from '../utils/files.js';
import * as wordService from '../services/word.service.js';

const ALLOWED = ['.docx'];

async function runJob(req, res, tool, processFn, noFile = false) {
  try {
    if (!noFile) {
      const files = req.files || [];
      if (!files || files.length < 1) return res.status(400).json({ success: false, message: 'يرجى رفع ملف Word.' });
      await validateUploadedFiles(files, ALLOWED);
    }
    const jobId = uuidv4();
    const jobDir = path.join(config.resultsDir, jobId);
    await fs.ensureDir(jobDir);
    let saved = [];
    if (!noFile) {
      for (const file of req.files) {
        const dest = path.join(jobDir, file.filename);
        await fs.copy(file.path, dest, { overwrite: true });
        saved.push({ ...file, path: dest });
      }
      await cleanupFiles(req.files);
    }
    const job = createJob({ id: jobId, category: 'word', tool, status: 'queued', progress: 0, message: 'في قائمة الانتظار...', files: noFile ? [] : saved.map((f) => ({ originalname: f.originalname, size: f.size })), output: null });
    res.status(202).json({ success: true, data: job });
    processJobAsync(jobId, () => processFn(saved, jobDir, req));
  } catch (err) {
    await cleanupFiles(req.files);
    if (!res.headersSent) res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

export const handleExtractText = (req, res) => runJob(req, res, 'extract-text', (s) => wordService.extractText(s[0]));
export const handleWordCount = (req, res) => runJob(req, res, 'word-count', (s) => wordService.wordCount(s[0]));
export const handleToTxt = (req, res) => runJob(req, res, 'to-txt', (s) => wordService.toTxt(s[0]));
export const handleCleanText = (req, res) => runJob(req, res, 'clean-text', (s) => wordService.cleanText(s[0]));
export const handleToHtml = (req, res) => runJob(req, res, 'to-html', (s) => wordService.toHtml(s[0]));
export const handleExtractHeadings = (req, res) => runJob(req, res, 'extract-headings', (s) => wordService.extractHeadings(s[0]));
export const handleExtractLinks = (req, res) => runJob(req, res, 'extract-links', (s) => wordService.extractLinks(s[0]));
export const handleCreateFromText = (req, res) => runJob(req, res, 'create-from-text', (_s, jobDir, req) => wordService.createFromText(req.body.text || 'نص جديد', jobDir), true);

export const handleFindReplace = (req, res) => runJob(req, res, 'find-replace', async (s) => {
  const findText = req.body.find || '';
  const replaceText = req.body.replace || '';
  if (!findText) throw new Error('يرجى إدخال النص المطلوب البحث عنه.');
  return wordService.findReplace(s[0], findText, replaceText);
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
