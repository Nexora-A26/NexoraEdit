import fs from 'fs-extra';
import { config } from '../config.js';

let jobsCache = null;
let saveQueue = Promise.resolve();

export async function loadJobs() {
  if (jobsCache) return jobsCache;
  try {
    const exists = await fs.pathExists(config.jobsFile);
    if (!exists) {
      jobsCache = {};
      return jobsCache;
    }
    const data = await fs.readJson(config.jobsFile);
    jobsCache = data || {};
    return jobsCache;
  } catch {
    jobsCache = {};
    return jobsCache;
  }
}

export async function saveJobs() {
  const snapshot = JSON.parse(JSON.stringify(jobsCache || {}));
  saveQueue = saveQueue
    .then(() => fs.writeJson(config.jobsFile, snapshot, { spaces: 2 }))
    .catch((err) => console.error('Failed to save jobs:', err.message));
  return saveQueue;
}

export function createJob(jobData) {
  if (!jobsCache) jobsCache = {};
  const job = {
    ...jobData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  jobsCache[job.id] = job;
  saveJobs();
  return job;
}

export function getJob(jobId) {
  return jobsCache?.[jobId] || null;
}

export function updateJob(jobId, patch) {
  const job = jobsCache?.[jobId];
  if (!job) return null;
  const updated = { ...job, ...patch, updatedAt: new Date().toISOString() };
  jobsCache[jobId] = updated;
  saveJobs();
  return updated;
}

export function toPublicJob(job) {
  if (!job) return null;
  return {
    ...job,
    output: job.output ? {
      ready: Boolean(job.output.path),
      downloadName: job.output.downloadName,
      mimeType: job.output.mimeType
    } : null
  };
}

export async function deleteJob(jobId) {
  await loadJobs();
  if (!jobsCache?.[jobId]) return false;
  delete jobsCache[jobId];
  await saveJobs();
  return true;
}
