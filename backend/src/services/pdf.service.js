import path from 'node:path';
import fs from 'fs-extra';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { createZip } from './archiveService.js';
import pdfParse from 'pdf-parse';

function safeBaseName(fileName) {
  return path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9-_\u0600-\u06FF]+/g, '-');
}

export async function mergePdfs(files, outputDir) {
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const bytes = await fs.readFile(file.path);
    const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  const outputPath = path.join(outputDir, 'merged.pdf');
  await fs.writeFile(outputPath, await mergedPdf.save());
  return { outputPath, downloadName: 'merged.pdf', mimeType: 'application/pdf', message: 'تم دمج ملفات PDF بنجاح.' };
}

export async function splitPdf(files, outputDir) {
  const resultFiles = [];
  for (const file of files) {
    const bytes = await fs.readFile(file.path);
    const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const baseName = safeBaseName(file.originalname);
    for (const pageIndex of sourcePdf.getPageIndices()) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
      newPdf.addPage(page);
      const outputPath = path.join(outputDir, `${baseName}-page-${pageIndex + 1}.pdf`);
      await fs.writeFile(outputPath, await newPdf.save());
      resultFiles.push({ path: outputPath, name: `${baseName}-page-${pageIndex + 1}.pdf` });
    }
  }
  if (resultFiles.length === 1) {
    return { outputPath: resultFiles[0].path, downloadName: resultFiles[0].name, mimeType: 'application/pdf', message: 'تم تقسيم الملف بنجاح.' };
  }
  const zipPath = path.join(outputDir, 'split-pages.zip');
  await createZip(zipPath, resultFiles);
  return { outputPath: zipPath, downloadName: 'split-pages.zip', mimeType: 'application/zip', message: 'تم تقسيم الصفحات وحفظها داخل ملف ZIP.' };
}

export async function rotatePdf(files, outputDir) {
  const bytes = await fs.readFile(files[0].path);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + 90) % 360));
  }
  const outputPath = path.join(outputDir, 'rotated.pdf');
  await fs.writeFile(outputPath, await pdfDoc.save());
  return { outputPath, downloadName: 'rotated.pdf', mimeType: 'application/pdf', message: 'تم تدوير صفحات PDF بنجاح.' };
}

export async function extractPages(files, outputDir, pageRanges) {
  const file = files[0];
  const bytes = await fs.readFile(file.path);
  const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  const pagesToExtract = parsePageRanges(pageRanges, totalPages);
  if (pagesToExtract.length === 0) throw new Error('يرجى إدخال أرقام صفحات صحيحة.');
  const newPdf = await PDFDocument.create();
  for (const pageIndex of pagesToExtract) {
    const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
    newPdf.addPage(page);
  }
  const outputPath = path.join(outputDir, 'extracted-pages.pdf');
  await fs.writeFile(outputPath, await newPdf.save());
  return { outputPath, downloadName: 'extracted-pages.pdf', mimeType: 'application/pdf', message: `تم استخراج ${pagesToExtract.length} صفحة بنجاح.` };
}

export async function deletePages(files, outputDir, pagesToDelete) {
  const file = files[0];
  const bytes = await fs.readFile(file.path);
  const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  const deleteSet = new Set(parsePageRanges(pagesToDelete, totalPages));
  if (deleteSet.size === 0) throw new Error('يرجى إدخال أرقام صفحات صحيحة للحذف.');
  const indicesToKeep = [];
  for (let i = 0; i < totalPages; i++) {
    if (!deleteSet.has(i)) indicesToKeep.push(i);
  }
  if (indicesToKeep.length === 0) throw new Error('لا يمكن حذف كل صفحات الملف.');
  const newPdf = await PDFDocument.create();
  for (const pageIndex of indicesToKeep) {
    const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
    newPdf.addPage(page);
  }
  const outputPath = path.join(outputDir, 'deleted-pages.pdf');
  await fs.writeFile(outputPath, await newPdf.save());
  return { outputPath, downloadName: 'deleted-pages.pdf', mimeType: 'application/pdf', message: `تم حذف ${totalPages - indicesToKeep.length} صفحة بنجاح.` };
}

export async function reorderPages(files, outputDir, newOrder) {
  const file = files[0];
  const bytes = await fs.readFile(file.path);
  const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();
  if (!newOrder || !newOrder.trim()) throw new Error('يرجى إدخال ترتيب الصفحات.');
  if (newOrder.length > 10000) throw new Error('ترتيب الصفحات طويل جداً.');
  const values = newOrder.split(',').map((value) => value.trim()).filter(Boolean);
  if (values.some((value) => !/^\d+$/.test(value))) throw new Error('ترتيب الصفحات يجب أن يحتوي على أرقام مفصولة بفواصل.');
  const order = values.map((value) => Number(value) - 1);
  if (order.length !== totalPages || new Set(order).size !== totalPages || order.some((index) => index < 0 || index >= totalPages)) {
    throw new Error(`أدخل جميع الصفحات مرة واحدة بالضبط. هذا الملف يحتوي على ${totalPages} صفحة.`);
  }
  const newPdf = await PDFDocument.create();
  for (const pageIndex of order) {
    const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
    newPdf.addPage(page);
  }
  const outputPath = path.join(outputDir, 'reordered.pdf');
  await fs.writeFile(outputPath, await newPdf.save());
  return { outputPath, downloadName: 'reordered.pdf', mimeType: 'application/pdf', message: 'تم إعادة ترتيب الصفحات بنجاح.' };
}

export async function reversePages(files, outputDir) {
  const file = files[0];
  const bytes = await fs.readFile(file.path);
  const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const indices = sourcePdf.getPageIndices().reverse();
  const newPdf = await PDFDocument.create();
  for (const pageIndex of indices) {
    const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
    newPdf.addPage(page);
  }
  const outputPath = path.join(outputDir, 'reversed.pdf');
  await fs.writeFile(outputPath, await newPdf.save());
  return { outputPath, downloadName: 'reversed.pdf', mimeType: 'application/pdf', message: 'تم عكس ترتيب الصفحات بنجاح.' };
}

export async function compressPdf(files, outputDir) {
  const file = files[0];
  const bytes = await fs.readFile(file.path);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const outputPath = path.join(outputDir, 'optimized.pdf');
  await fs.writeFile(outputPath, await pdfDoc.save({ useObjectStreams: true }));
  const originalSize = file.size;
  let compressedSize = (await fs.stat(outputPath)).size;
  if (compressedSize >= originalSize) {
    await fs.copy(file.path, outputPath, { overwrite: true });
    compressedSize = originalSize;
  }
  const saved = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  const message = Number(saved) > 0
    ? `تم تحسين الملف وتوفير ${saved}% من الحجم.`
    : 'الملف محسّن مسبقاً، لذلك تم الحفاظ على حجمه وجودته بدون تكبيره.';
  return { outputPath, downloadName: 'optimized.pdf', mimeType: 'application/pdf', message };
}

export async function imagesToPdf(files, outputDir) {
  const pdfDoc = await PDFDocument.create();
  for (const file of files) {
    const imageBytes = await fs.readFile(file.path);
    const ext = path.extname(file.path).toLowerCase();
    let image;
    if (ext === '.jpg' || ext === '.jpeg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (ext === '.png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error(`نوع الصورة غير مدعوم: ${ext}`);
    }
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  const outputPath = path.join(outputDir, 'images.pdf');
  await fs.writeFile(outputPath, await pdfDoc.save());
  return { outputPath, downloadName: 'images.pdf', mimeType: 'application/pdf', message: 'تم تحويل الصور إلى PDF بنجاح.' };
}

export async function pdfInfo(file) {
  const bytes = await fs.readFile(file.path);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const info = {
    pages: pdfDoc.getPageCount(),
    pageSize: file.size,
    pageSizeFormatted: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(file.size / 1024)} KB`,
    encrypted: pdfDoc.isEncrypted,
    title: pdfDoc.getTitle() || '—',
    author: pdfDoc.getAuthor() || '—'
  };
  return { info, message: `الملف يحتوي على ${info.pages} صفحة وبحجم ${info.pageSizeFormatted}.` };
}

export async function pdfText(file) {
  const bytes = await fs.readFile(file.path);
  let text = '';
  let pages = 0;
  try {
    const data = await pdfParse(bytes);
    pages = data.numpages || 0;
    text = (data.text || '').trim();
  } catch {
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    pages = pdfDoc.getPageCount();
    text = '';
  }
  if (!text) {
    text = '(لم يتم العثور على نص قابل للاستخراج داخل هذا الملف. قد يكون الملف عبارة عن صور أو يحتاج OCR.)';
  }
  const outputPath = path.join(path.dirname(file.path), 'extracted-text.txt');
  await fs.writeFile(outputPath, text, 'utf-8');
  return {
    outputPath,
    downloadName: 'extracted-text.txt',
    mimeType: 'text/plain',
    message: `تم تجهيز ملف النص من ${pages || 0} صفحة.`
  };
}

export async function addWatermark(files, outputDir, watermarkText) {
  if (String(watermarkText || '').length > 200) throw new Error('نص العلامة المائية طويل جداً.');
  const file = files[0];
  const bytes = await fs.readFile(file.path);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(watermarkText || 'NexoraEdit', {
      x: width / 4,
      y: height / 2,
      size: 48,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.3,
      rotate: degrees(-45)
    });
  }
  const outputPath = path.join(outputDir, 'watermarked.pdf');
  await fs.writeFile(outputPath, await pdfDoc.save());
  return { outputPath, downloadName: 'watermarked.pdf', mimeType: 'application/pdf', message: 'تم إضافة العلامة المائية بنجاح.' };
}

export async function addPageNumbers(files, outputDir) {
  const file = files[0];
  const bytes = await fs.readFile(file.path);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width } = page.getSize();
    page.drawText(`${i + 1}`, { x: width - 40, y: 20, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  }
  const outputPath = path.join(outputDir, 'numbered.pdf');
  await fs.writeFile(outputPath, await pdfDoc.save());
  return { outputPath, downloadName: 'numbered.pdf', mimeType: 'application/pdf', message: 'تم إضافة ترقيم الصفحات بنجاح.' };
}

function parsePageRanges(ranges, totalPages) {
  const pages = new Set();
  const parts = String(ranges || '').split(',').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
      const s = Math.max(1, Math.min(start, totalPages));
      const e = Math.min(totalPages, Math.max(end || s, s));
      for (let i = s; i <= e; i++) pages.add(i - 1);
    } else {
      const n = parseInt(part, 10);
      if (n >= 1 && n <= totalPages) pages.add(n - 1);
    }
  }
  return [...pages].sort((a, b) => a - b);
}
