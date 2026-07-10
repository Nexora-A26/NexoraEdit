import path from 'node:path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { createJob, updateJob } from '../services/jobStore.js';
import { cleanupFiles, validateUploadedFiles } from '../utils/files.js';
import * as pdfService from '../services/pdf.service.js';

const ALLOWED = ['.pdf'];

function createHandler(handlerFn, allowedExts = ALLOWED, minFiles = 1, requiresPageInput = false, requiresTextInput = false) {
  return async (req, res) => {
    try {
      const files = req.files || [];
      if (!files || files.length < minFiles) {
        return res.status(400).json({ success: false, message: `هذه الأداة تحتاج إلى ${minFiles} ملف على الأقل.` });
      }
      await validateUploadedFiles(files, allowedExts);
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
      const job = createJob({ id: jobId, category: 'pdf', tool: req.path.split('/').pop(), status: 'queued', progress: 0, message: 'في قائمة الانتظار...', files: saved.map((f) => ({ originalname: f.originalname, size: f.size })), output: null });
      res.status(202).json({ success: true, data: job });
      processJobAsync(jobId, () => handlerFn(saved, jobDir, req));
    } catch (err) {
      await cleanupFiles(req.files);
      if (!res.headersSent) res.status(err.status || 500).json({ success: false, message: err.message || 'حدث خطأ داخلي.' });
    }
  };
}

export const handleMerge = createHandler(async (saved, jobDir) => pdfService.mergePdfs(saved, jobDir), ALLOWED, 2);
export const handleSplit = createHandler(async (saved, jobDir) => pdfService.splitPdf(saved, jobDir));
export const handleRotate = createHandler(async (saved, jobDir) => pdfService.rotatePdf(saved, jobDir));
export const handleCompress = createHandler(async (saved, jobDir) => pdfService.compressPdf(saved, jobDir));
export const handleImagesToPdf = createHandler(async (saved, jobDir) => pdfService.imagesToPdf(saved, jobDir), ['.jpg', '.jpeg', '.png']);

export const handleExtractPages = createHandler(async (saved, jobDir, req) => pdfService.extractPages(saved, jobDir, req.body.pages || ''));
export const handleDeletePages = createHandler(async (saved, jobDir, req) => pdfService.deletePages(saved, jobDir, req.body.pages || ''));
export const handleReorderPages = createHandler(async (saved, jobDir, req) => pdfService.reorderPages(saved, jobDir, req.body.pages || ''));
export const handleReversePages = createHandler(async (saved, jobDir, _req) => pdfService.reversePages(saved, jobDir));
export const handleAddWatermark = createHandler(async (saved, jobDir, req) => pdfService.addWatermark(saved, jobDir, req.body.text || 'NexoraEdit'));
export const handleAddPageNumbers = createHandler(async (saved, jobDir) => pdfService.addPageNumbers(saved, jobDir));
export const handleText = createHandler(async (saved, jobDir) => pdfService.pdfText(saved[0]));

export const handleInfo = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files || files.length < 1) return res.status(400).json({ success: false, message: 'يرجى رفع ملف PDF.' });
    await validateUploadedFiles(files, ['.pdf']);
    const jobId = uuidv4();
    const jobDir = path.join(config.resultsDir, jobId);
    await fs.ensureDir(jobDir);
    const dest = path.join(jobDir, files[0].filename);
    await fs.copy(files[0].path, dest, { overwrite: true });
    await cleanupFiles(files);
    const saved = [{ ...files[0], path: dest }];
    const result = await pdfService.pdfInfo(saved[0]);
    const job = createJob({ id: jobId, category: 'pdf', tool: 'info', status: 'completed', progress: 100, message: result.message, info: result.info, output: null });
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    await cleanupFiles(req.files);
    if (!res.headersSent) res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

async function processJobAsync(jobId, processFn) {
  try {
    updateJob(jobId, { status: 'processing', progress: 30, message: 'جاري المعالجة...' });
    const result = await processFn();
    updateJob(jobId, { status: 'completed', progress: 100, message: result.message, output: { path: result.outputPath, downloadName: result.downloadName, mimeType: result.mimeType } });
  } catch (err) {
    updateJob(jobId, { status: 'failed', progress: 100, message: err.message || 'فشلت المعالجة.' });
  }
}
