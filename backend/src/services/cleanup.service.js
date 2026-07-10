import fs from 'fs-extra';
import path from 'node:path';
import { config } from '../config.js';
import { deleteJob, loadJobs } from './jobStore.js';
import { resolveWithin } from '../utils/files.js';

let cleanupRunning = false;

async function removeOldChildren(directory, cutoffMs) {
  if (!await fs.pathExists(directory)) return;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.gitkeep') continue;
    const absolutePath = resolveWithin(directory, entry.name);
    const stats = await fs.stat(absolutePath).catch(() => null);
    if (stats && stats.mtimeMs < cutoffMs) await fs.remove(absolutePath);
  }
}

export async function cleanupExpiredData() {
  if (cleanupRunning) return;
  cleanupRunning = true;
  try {
    const now = Date.now();
    const retentionCutoff = now - config.jobRetentionHours * 60 * 60 * 1000;
    const jobs = await loadJobs();
    for (const job of Object.values(jobs)) {
      const timestamp = new Date(job.updatedAt || job.createdAt || 0).getTime();
      if (!Number.isFinite(timestamp) || timestamp >= retentionCutoff) continue;
      if (/^[a-f0-9-]{30,40}$/i.test(job.id || '')) {
        await fs.remove(resolveWithin(config.resultsDir, job.id)).catch(() => undefined);
      }
      await deleteJob(job.id);
    }

    const tempDirectory = path.join(config.uploadDir, 'temp');
    await removeOldChildren(tempDirectory, now - 60 * 60 * 1000);
  } finally {
    cleanupRunning = false;
  }
}

export function startCleanupTask() {
  cleanupExpiredData().catch((error) => console.error('Initial cleanup failed:', error.message));
  const timer = setInterval(() => {
    cleanupExpiredData().catch((error) => console.error('Scheduled cleanup failed:', error.message));
  }, 60 * 60 * 1000);
  timer.unref();
}
