import fs from 'fs-extra';
import path from 'node:path';
import { config } from '../config.js';
import { loadJobs, deleteJob as deleteJobFromStore } from './jobStore.js';
import { resolveWithin } from '../utils/files.js';

function toolSettingsPath() {
  return path.join(config.rootDir, 'storage', 'toolSettings.json');
}

function appSettingsPath() {
  return path.join(config.rootDir, 'storage', 'settings.json');
}

export async function getToolSettings() {
  try {
    const exists = await fs.pathExists(toolSettingsPath());
    if (!exists) return {};
    return (await fs.readJson(toolSettingsPath())) || {};
  } catch { return {}; }
}

export async function saveToolSettings(settings) {
  await fs.writeJson(toolSettingsPath(), settings, { spaces: 2 });
}

export async function getSettings() {
  const defaults = {
    siteName: 'NexoraEdit',
    phone: '03302277',
    email: 'nexora0126@gmail.com',
    defaultLanguage: 'ar',
    showDisabledTools: false,
    maxUploadSizeMB: 25
  };
  try {
    const exists = await fs.pathExists(appSettingsPath());
    if (!exists) return defaults;
    return { ...defaults, ...((await fs.readJson(appSettingsPath())) || {}) };
  } catch { return defaults; }
}

export async function saveSettings(s) {
  const current = await getSettings();
  const updates = {};
  if (typeof s?.siteName === 'string' && s.siteName.trim()) updates.siteName = s.siteName.trim().slice(0, 80);
  if (typeof s?.phone === 'string') updates.phone = s.phone.trim().slice(0, 40);
  if (typeof s?.email === 'string') updates.email = s.email.trim().slice(0, 120);
  if (['ar', 'en'].includes(s?.defaultLanguage)) updates.defaultLanguage = s.defaultLanguage;
  if (typeof s?.showDisabledTools === 'boolean') updates.showDisabledTools = s.showDisabledTools;
  if (Number.isFinite(Number(s?.maxUploadSizeMB))) {
    updates.maxUploadSizeMB = Math.max(1, Math.min(Number(s.maxUploadSizeMB), config.maxFileMb));
  }
  const merged = { ...current, ...updates };
  await fs.writeJson(appSettingsPath(), merged, { spaces: 2 });
  return merged;
}

export async function getFiles(type) {
  const dir = type === 'uploads' ? config.uploadDir : config.resultsDir;
  const exists = await fs.pathExists(dir);
  if (!exists) return [];
  const files = [];

  async function walk(currentDir, relativeDir = '') {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(currentDir, entry.name);
      const rel = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs, rel);
      } else if (entry.isFile() && entry.name !== '.gitkeep') {
        const stats = await fs.stat(abs);
        const ext = path.extname(entry.name);
        const baseName = path.basename(entry.name, ext);
        const parts = baseName.split('_');
        const originalName = parts.length > 1 ? parts.slice(1).join('_') + ext : entry.name;
        files.push({
          filename: rel.replace(/\\/g, '/'),
          originalName,
          type,
          extension: ext,
          size: stats.size,
          createdAt: stats.birthtime || stats.mtime,
          folder: type,
          downloadUrl: `/api/admin/files/${type}/${encodeURIComponent(rel.replace(/\\/g, '/'))}/download`
        });
      }
    }
  }

  await walk(dir);
  return files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteFile(type, filename) {
  const dir = type === 'uploads' ? config.uploadDir : config.resultsDir;
  const filePath = resolveWithin(dir, filename);
  const exists = await fs.pathExists(filePath);
  if (!exists) return false;
  await fs.remove(filePath);
  return true;
}

export async function getJobs() {
  const jobs = await loadJobs();
  return Object.values(jobs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteJob(jobId) {
  if (/^[a-f0-9-]{30,40}$/i.test(jobId || '')) {
    await fs.remove(resolveWithin(config.resultsDir, jobId)).catch(() => undefined);
  }
  return deleteJobFromStore(jobId);
}

export default {
  getToolSettings, saveToolSettings, getSettings, saveSettings,
  getFiles, deleteFile, getJobs, deleteJob, getStats
};

export async function getStats() {
  const [uploads, results] = await Promise.all([
    getFiles('uploads'),
    getFiles('results')
  ]);
  const jobs = await getJobs();
  const toolSettings = await getToolSettings();
  const toolsArr = Object.values(toolSettings);
  const enabled = toolsArr.filter(t => t.enabled !== false).length;
  const disabled = toolsArr.filter(t => t.enabled === false).length;
  return {
    uploadedFilesCount: uploads.length,
    resultFilesCount: results.length,
    jobsCount: jobs.length,
    enabledToolsCount: enabled,
    disabledToolsCount: disabled,
    latestJob: jobs.length > 0 ? jobs[0] : null
  };
}
