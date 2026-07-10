import path from 'node:path';
import fs from 'fs-extra';
import { open } from 'node:fs/promises';
import PizZip from 'pizzip';

export function getExtension(fileName) {
  return path.extname(fileName || '').toLowerCase();
}

export function validateFileType(file, allowedExtensions) {
  const ext = getExtension(file.originalname);
  return allowedExtensions.includes(ext);
}

function hasPrefix(buffer, bytes) {
  return bytes.every((value, index) => buffer[index] === value);
}

export async function hasValidFileSignature(file) {
  const extension = getExtension(file.originalname);
  const handle = await open(file.path, 'r');
  const buffer = Buffer.alloc(16);
  try {
    await handle.read(buffer, 0, buffer.length, 0);
  } finally {
    await handle.close();
  }

  if (extension === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (extension === '.png') return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === '.jpg' || extension === '.jpeg') return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
  if (extension === '.docx' || extension === '.xlsx') {
    if (!hasPrefix(buffer, [0x50, 0x4b])) return false;
    try {
      const zip = new PizZip(await fs.readFile(file.path));
      const requiredEntry = extension === '.docx' ? 'word/document.xml' : 'xl/workbook.xml';
      return Boolean(zip.file('[Content_Types].xml') && zip.file(requiredEntry));
    } catch {
      return false;
    }
  }
  if (extension === '.csv') return !buffer.includes(0x00);
  return false;
}

export async function validateUploadedFiles(files, allowedExtensions) {
  for (const file of files || []) {
    const extension = getExtension(file.originalname);
    if (!allowedExtensions.includes(extension)) {
      const error = new Error(`Unsupported file type: ${file.originalname}. Allowed: ${allowedExtensions.join(', ')}`);
      error.status = 400;
      throw error;
    }
    if (!await hasValidFileSignature(file)) {
      const error = new Error(`The content of ${file.originalname} does not match its file type.`);
      error.status = 400;
      throw error;
    }
  }
}

export async function cleanupFiles(files) {
  await Promise.all((files || []).map((file) => file?.path ? fs.remove(file.path).catch(() => undefined) : undefined));
}

export function resolveWithin(baseDirectory, relativePath) {
  const base = path.resolve(baseDirectory);
  const resolved = path.resolve(base, String(relativePath || ''));
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    const error = new Error('Invalid file path.');
    error.status = 400;
    throw error;
  }
  return resolved;
}

export function arrayToMap(arr) {
  const map = {};
  arr.forEach((item) => { map[item.id || item] = item; });
  return map;
}
