import path from 'node:path';
import fs from 'fs-extra';
import archiver from 'archiver';

export async function createZip(outputPath, entries) {
  await fs.ensureDir(path.dirname(outputPath));
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    entries.forEach((entry) => {
      archive.file(entry.path, { name: entry.name });
    });
    archive.finalize();
  });
}