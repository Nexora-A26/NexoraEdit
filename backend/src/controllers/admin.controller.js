import adminService from '../services/admin.service.js';
import * as jobStore from '../services/jobStore.js';
import toolsData from '../../data/tools.js';
import { config } from '../config.js';
import { resolveWithin } from '../utils/files.js';

export async function getStats(req, res, next) {
  try {
    const data = await adminService.getStats();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getUploadedFiles(req, res, next) {
  try {
    const data = await adminService.getFiles('uploads');
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getResultFiles(req, res, next) {
  try {
    const data = await adminService.getFiles('results');
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function downloadFile(req, res, next) {
  try {
    const { type } = req.params;
    const filename = req.params[0] || req.params.filename;
    if (type !== 'uploads' && type !== 'results') {
      return res.status(400).json({ success: false, message: 'Invalid file type' });
    }
    const dir = type === 'uploads' ? config.uploadDir : config.resultsDir;
    const filePath = resolveWithin(dir, filename);
    res.download(filePath);
  } catch (err) { next(err); }
}

export async function deleteFile(req, res, next) {
  try {
    const { type } = req.params;
    const filename = req.params[0] || req.params.filename;
    if (type !== 'uploads' && type !== 'results') {
      return res.status(400).json({ success: false, message: 'Invalid file type' });
    }
    const deleted = await adminService.deleteFile(type, filename);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.json({ success: true, message: 'File deleted' });
  } catch (err) { next(err); }
}

export async function getJobs(req, res, next) {
  try {
    const data = await adminService.getJobs();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getJobDetail(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = jobStore.getJob(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
}

export async function deleteJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const deleted = await adminService.deleteJob(jobId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) { next(err); }
}

function flatTools(toolsData) {
  const result = {};
  for (const cat of toolsData.categories) {
    for (const sub of cat.subcategories) {
      for (const tool of sub.tools) {
        result[tool.id] = tool;
      }
    }
  }
  return result;
}

export async function getTools(req, res, next) {
  try {
    const toolSettings = await adminService.getToolSettings();
    const flat = flatTools(toolsData);
    const enriched = [];
    for (const [id, tool] of Object.entries(flat)) {
      const settings = toolSettings[id] || {};
      enriched.push({
        id,
        title: tool.title?.ar || tool.title?.en || tool.title || id,
        titleEn: tool.title?.en || tool.title?.ar || tool.title || id,
        category: tool.category || tool.categoryId || id.split('-')[0],
        endpoint: tool.endpoint,
        status: settings.enabled === false ? 'disabled' : 'working',
        enabled: settings.enabled !== undefined ? settings.enabled : true,
        featured: settings.featured || false,
        icon: tool.icon || 'FileText'
      });
    }
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
}

export async function toggleTool(req, res, next) {
  try {
    const { toolId } = req.params;
    const settings = await adminService.getToolSettings();
    const current = settings[toolId] || { enabled: true, featured: false };
    settings[toolId] = { ...current, enabled: current.enabled === false ? true : false };
    await adminService.saveToolSettings(settings);
    res.json({ success: true, data: settings[toolId] });
  } catch (err) { next(err); }
}

export async function updateTool(req, res, next) {
  try {
    const { toolId } = req.params;
    const { enabled, featured } = req.body;
    const settings = await adminService.getToolSettings();
    const current = settings[toolId] || {};
    settings[toolId] = {
      ...current,
      ...(enabled !== undefined ? { enabled } : {}),
      ...(featured !== undefined ? { featured } : {})
    };
    await adminService.saveToolSettings(settings);
    res.json({ success: true, data: settings[toolId] });
  } catch (err) { next(err); }
}

export async function getAppSettings(req, res, next) {
  try {
    const data = await adminService.getSettings();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function updateAppSettings(req, res, next) {
  try {
    const data = await adminService.saveSettings(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
