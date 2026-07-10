import assert from 'node:assert/strict';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';

const testStorage = await fs.mkdtemp(path.join(os.tmpdir(), 'nexoraedit-smoke-'));
process.env.NODE_ENV = 'test';
process.env.STORAGE_DIR = testStorage;
process.env.ADMIN_KEY = 'smoke-test-admin-key';

const { app } = await import('../src/app.js');
const server = await new Promise((resolve) => {
  const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
});
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const passedTools = [];

async function jsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${data.message || 'Request failed'}`);
  return data.data;
}

async function submit(endpoint, files = [], fields = {}) {
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) body.append(name, value);
  for (const file of files) body.append('files', new Blob([file.buffer], { type: file.type }), file.name);
  return jsonResponse(await fetch(`${baseUrl}${endpoint}`, { method: 'POST', body, headers: { 'X-Language': 'en' } }));
}

async function waitForJob(job) {
  let current = job;
  for (let attempt = 0; attempt < 120 && !['completed', 'failed'].includes(current.status); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 75));
    current = await jsonResponse(await fetch(`${baseUrl}/jobs/${encodeURIComponent(job.id)}`));
  }
  assert.equal(current.status, 'completed', current.message || 'Job did not complete');
  assert.equal(current.output?.path, undefined, 'Public job response leaked an internal path');
  return current;
}

async function runOutputTool(name, endpoint, files = [], fields = {}) {
  const job = await waitForJob(await submit(endpoint, files, fields));
  assert.equal(job.output?.ready, true, `${name} did not create a downloadable result`);
  const response = await fetch(`${baseUrl}/download/${encodeURIComponent(job.id)}`);
  assert.equal(response.status, 200, `${name} download failed`);
  const buffer = Buffer.from(await response.arrayBuffer());
  assert.ok(buffer.length > 0, `${name} created an empty download`);
  passedTools.push(name);
  return { job, buffer };
}

async function runStaticTool(name, endpoint, files = [], fields = {}) {
  const job = await waitForJob(await submit(endpoint, files, fields));
  passedTools.push(name);
  return job;
}

async function makePdf(pageCount = 3) {
  const document = await PDFDocument.create();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = document.addPage([300, 300]);
    page.drawText(`NexoraEdit page ${pageNumber}`, { x: 30, y: 250, size: 18 });
  }
  return Buffer.from(await document.save());
}

const pdfBuffer = await makePdf();
const secondPdfBuffer = await makePdf(1);
const pdfFile = () => ({ name: 'sample.pdf', type: 'application/pdf', buffer: pdfBuffer });
const secondPdfFile = () => ({ name: 'second.pdf', type: 'application/pdf', buffer: secondPdfBuffer });
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7P8AAAAASUVORK5CYII=', 'base64');

const wordBuffer = await Packer.toBuffer(new Document({
  sections: [{ children: [
    new Paragraph({ text: 'NexoraEdit Heading', heading: HeadingLevel.HEADING_1 }),
    new Paragraph('Hello from the NexoraEdit smoke test with extra   spaces.'),
    new Paragraph({ children: [new ExternalHyperlink({
      link: 'https://example.com',
      children: [new TextRun({ text: 'Example link', style: 'Hyperlink' })]
    })] })
  ] }]
}));
const wordFile = () => ({ name: 'sample.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: wordBuffer });

const workbook = new ExcelJS.Workbook();
const scores = workbook.addWorksheet('Scores');
scores.addRows([
  ['Name', 'Score', 'Notes'],
  ['Ali', 10, ' hello   world '],
  ['', '', ''],
  ['Maya', 20, 'Value'],
  ['Ali', 10, ' hello   world ']
]);
const extra = workbook.addWorksheet('Extra');
extra.addRows([['Name', 'Score', 'Notes'], ['Nour', 30, 'Other']]);
const excelBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
const excelFile = (name = 'scores.xlsx') => ({ name, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: excelBuffer });
const csvBuffer = Buffer.from('Name,Score\nAli,10\nMaya,20\n', 'utf8');
const csvFile = () => ({ name: 'scores.csv', type: 'text/csv', buffer: csvBuffer });

try {
  assert.equal((await fetch(`${baseUrl}/health`)).status, 200);

  const merge = await runOutputTool('pdf-merge', '/pdf/merge', [pdfFile(), secondPdfFile()]);
  assert.equal((await PDFDocument.load(merge.buffer)).getPageCount(), 4);
  await runOutputTool('pdf-split', '/pdf/split', [pdfFile()]);
  await runOutputTool('pdf-rotate', '/pdf/rotate', [pdfFile()]);
  await runOutputTool('pdf-compress', '/pdf/compress', [pdfFile()]);
  await runOutputTool('pdf-extract-pages', '/pdf/extract-pages', [pdfFile()], { pages: '1-2' });
  await runOutputTool('pdf-delete-pages', '/pdf/delete-pages', [pdfFile()], { pages: '2' });
  await runOutputTool('pdf-images-to-pdf', '/pdf/images-to-pdf', [{ name: 'pixel.png', type: 'image/png', buffer: pngBuffer }]);
  await runOutputTool('pdf-reorder-pages', '/pdf/reorder-pages', [pdfFile()], { pages: '3,1,2' });
  await runOutputTool('pdf-reverse-pages', '/pdf/reverse-pages', [pdfFile()]);
  const pdfInfo = await runStaticTool('pdf-info', '/pdf/info', [pdfFile()]);
  assert.equal(pdfInfo.info.pages, 3);
  await runOutputTool('pdf-to-text', '/pdf/text', [pdfFile()]);
  await runOutputTool('pdf-add-watermark', '/pdf/add-watermark', [pdfFile()], { text: 'CONFIDENTIAL' });
  await runOutputTool('pdf-add-page-numbers', '/pdf/add-page-numbers', [pdfFile()]);

  const fakePdfBody = new FormData();
  fakePdfBody.append('files', new Blob(['not a pdf'], { type: 'application/pdf' }), 'fake.pdf');
  assert.equal((await fetch(`${baseUrl}/pdf/rotate`, { method: 'POST', body: fakePdfBody })).status, 400, 'A fake PDF was accepted');

  await runOutputTool('word-extract-text', '/word/extract-text', [wordFile()]);
  const countResult = await runOutputTool('word-count', '/word/word-count', [wordFile()]);
  assert.ok(JSON.parse(countResult.buffer.toString('utf8')).words >= 6);
  await runOutputTool('word-clean-text', '/word/clean-text', [wordFile()]);
  await runOutputTool('word-find-replace', '/word/find-replace', [wordFile()], { find: 'Hello', replace: 'Welcome' });
  await runOutputTool('word-to-txt', '/word/to-txt', [wordFile()]);
  await runOutputTool('word-to-html', '/word/to-html', [wordFile()]);
  await runOutputTool('word-extract-headings', '/word/extract-headings', [wordFile()]);
  await runOutputTool('word-extract-links', '/word/extract-links', [wordFile()]);
  await runOutputTool('create-from-text', '/word/create-from-text', [], { text: 'A real generated Word document.' });

  const analysis = await runStaticTool('excel-analyze', '/excel/analyze', [excelFile()]);
  assert.equal(analysis.analyzeData.sheets.length, 2);
  await runOutputTool('excel-to-csv', '/excel/to-csv', [excelFile()]);
  await runOutputTool('excel-csv-to-excel', '/excel/csv-to-excel', [csvFile()]);
  await runOutputTool('excel-split-sheets', '/excel/split-sheets', [excelFile()]);
  await runOutputTool('excel-merge-files', '/excel/merge-files', [excelFile('first.xlsx'), excelFile('second.xlsx')]);
  await runOutputTool('excel-merge-sheets', '/excel/merge-sheets', [excelFile()]);
  await runOutputTool('excel-remove-empty-rows', '/excel/remove-empty-rows', [excelFile()]);
  await runOutputTool('excel-remove-empty-columns', '/excel/remove-empty-columns', [excelFile()]);
  const dedupe = await runOutputTool('excel-remove-duplicates', '/excel/remove-duplicates', [excelFile()]);
  const dedupedWorkbook = new ExcelJS.Workbook();
  await dedupedWorkbook.xlsx.load(dedupe.buffer);
  assert.equal(dedupedWorkbook.worksheets[0].actualRowCount - 1, 2);
  await runOutputTool('excel-clean-spaces', '/excel/clean-spaces', [excelFile()]);
  await runOutputTool('excel-find-replace', '/excel/find-replace', [excelFile()], { find: 'Ali', replace: 'Karim' });
  await runOutputTool('excel-fill-empty', '/excel/fill-empty', [excelFile()], { text: 'N/A' });
  const summary = await runStaticTool('excel-summary', '/excel/summary', [excelFile()]);
  assert.equal(summary.analyzeData.duplicateCount, 1);
  const firstPreview = await runStaticTool('excel-preview-first', '/excel/preview/first', [excelFile()], { mode: 'first' });
  assert.ok(firstPreview.analyzeData.data.length > 0);
  const lastPreview = await runStaticTool('excel-preview-last', '/excel/preview/last', [excelFile()], { mode: 'last' });
  assert.ok(lastPreview.analyzeData.data.length > 0);
  await runOutputTool('sort', '/excel/sort', [excelFile()], { column: 'Score', direction: 'desc' });
  await runOutputTool('filter', '/excel/filter', [excelFile()], { column: 'Name', value: 'Ali' });

  assert.equal(passedTools.length, 39);
  console.log(`Smoke tests passed for all ${passedTools.length} tools, downloads, API privacy, and invalid-file rejection.`);
} finally {
  await new Promise((resolve) => server.close(resolve));
  await fs.remove(testStorage);
}
