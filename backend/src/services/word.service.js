import fs from 'fs-extra';
import mammoth from 'mammoth';
import PizZip from 'pizzip';
import path from 'node:path';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function extractText(file) {
  const buffer = await fs.readFile(file.path);
  const result = await mammoth.extractRawText({ buffer });
  const outputPath = path.join(path.dirname(file.path), 'extracted-text.txt');
  await fs.writeFile(outputPath, result.value, 'utf-8');
  return { text: result.value, outputPath, downloadName: 'extracted-text.txt', mimeType: 'text/plain', message: 'تم استخراج النص بنجاح.' };
}

export async function wordCount(file) {
  const buffer = await fs.readFile(file.path);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  const spaces = (text.match(/\s/g) || []).length;
  const paragraphs = text.split('\n').filter((l) => l.trim().length > 0).length;
  const pages = Math.max(1, Math.ceil(words / 250));
  const report = { words, chars, charsNoSpaces, lines, spaces, paragraphs };
  const reportPath = path.join(path.dirname(file.path), 'word-count.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });
  return { ...report, outputPath: reportPath, downloadName: 'word-count.json', mimeType: 'application/json', message: `تم حساب الكلمات والحروف: ${words} كلمة، ${chars} حرف، ${paragraphs} فقرة.` };
}

export async function findReplace(file, findText, replaceText) {
  if (String(findText).length > 500 || String(replaceText).length > 500) throw new Error('نص البحث أو الاستبدال طويل جداً.');
  const buffer = await fs.readFile(file.path);
  const zip = new PizZip(buffer);
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) throw new Error('ملف Word غير صالح.');
  const xmlContent = documentFile.asText();
  const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedFind, 'g');
  let count = 0;
  const updatedXml = xmlContent.replace(/(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g, (_match, open, encodedText, close) => {
    const text = unescapeXml(encodedText);
    const matches = text.match(regex);
    if (!matches) return `${open}${encodedText}${close}`;
    count += matches.length;
    return `${open}${escapeXml(text.replace(regex, replaceText))}${close}`;
  });
  zip.file('word/document.xml', updatedXml);
  const outputPath = path.join(path.dirname(file.path), 'modified.docx');
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  await fs.writeFile(outputPath, buf);
  return { outputPath, downloadName: 'modified.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', message: `تم استبدال "${findText}" بـ "${replaceText}" في ${count} موضع.` };
}

export async function toTxt(file) {
  const buffer = await fs.readFile(file.path);
  const result = await mammoth.extractRawText({ buffer });
  const outputPath = path.join(path.dirname(file.path), 'converted.txt');
  await fs.writeFile(outputPath, result.value, 'utf-8');
  return { outputPath, downloadName: 'converted.txt', mimeType: 'text/plain', message: 'تم تحويل Word إلى TXT بنجاح.' };
}

export async function toHtml(file) {
  const buffer = await fs.readFile(file.path);
  const result = await mammoth.convertToHtml({ buffer });
  const outputPath = path.join(path.dirname(file.path), 'converted.html');
  await fs.writeFile(outputPath, result.value, 'utf-8');
  return { outputPath, downloadName: 'converted.html', mimeType: 'text/html', message: 'تم تحويل Word إلى HTML بنجاح.' };
}

export async function cleanText(file) {
  const buffer = await fs.readFile(file.path);
  const result = await mammoth.extractRawText({ buffer });
  const cleaned = result.value
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  const outputPath = path.join(path.dirname(file.path), 'cleaned.txt');
  await fs.writeFile(outputPath, cleaned, 'utf-8');
  return { outputPath, downloadName: 'cleaned.txt', mimeType: 'text/plain', message: 'تم تنظيف النص بنجاح.' };
}

export async function extractHeadings(file) {
  const buffer = await fs.readFile(file.path);
  const zip = new PizZip(buffer);
  const documentXml = zip.file('word/document.xml')?.asText() || '';
  const headings = [];
  const paragraphRegex = /<w:p[\s\S]*?<\/w:p>/g;
  const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  const paragraphs = documentXml.match(paragraphRegex) || [];
  for (const paragraph of paragraphs) {
    const styleMatch = paragraph.match(/<w:pStyle[^>]*w:val="([^"]+)"/);
    const style = styleMatch?.[1]?.toLowerCase() || '';
    if (!style.includes('heading') && !style.includes('title')) continue;
    const parts = [];
    let match;
    while ((match = textRegex.exec(paragraph)) !== null) {
      parts.push(unescapeXml(match[1]));
    }
    const heading = parts.join('').trim();
    if (heading) headings.push(heading);
  }
  const outputPath = path.join(path.dirname(file.path), 'headings.json');
  await fs.writeJson(outputPath, { headings, count: headings.length }, { spaces: 2 });
  return { outputPath, downloadName: 'headings.json', mimeType: 'application/json', message: `تم استخراج ${headings.length} عنوان.` };
}

export async function extractLinks(file) {
  const buffer = await fs.readFile(file.path);
  const result = await mammoth.convertToHtml({ buffer });
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const links = [];
  let match;
  while ((match = linkRegex.exec(result.value)) !== null) {
    links.push({ url: match[1], text: match[2] });
  }
  const outputPath = path.join(path.dirname(file.path), 'links.json');
  await fs.writeJson(outputPath, { links, count: links.length }, { spaces: 2 });
  return { outputPath, downloadName: 'links.json', mimeType: 'application/json', message: `تم استخراج ${links.length} رابط.` };
}

export async function createFromText(text, outputDir) {
  if (String(text || '').length > 100000) throw new Error('النص طويل جداً. الحد الأقصى 100,000 حرف.');
  const lines = String(text || '').split(/\r?\n/);
  const doc = new Document({
    sections: [{
      children: lines.map((line) => new Paragraph({
        children: [new TextRun({ text: line || ' ' })]
      }))
    }]
  });
  const outputPath = path.join(outputDir, 'created.docx');
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
  return { outputPath, downloadName: 'created.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', message: 'تم إنشاء ملف Word جديد بنجاح.' };
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function unescapeXml(str) {
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
