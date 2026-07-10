import adminService from '../services/admin.service.js';

export function requireToolEnabled(toolId) {
  return async (req, res, next) => {
    try {
      const settings = await adminService.getToolSettings();
      const tool = settings[toolId];
      if (tool && tool.enabled === false) {
        const lang = req.headers['x-language'] || 'ar';
        const msg = lang === 'en' ? 'This tool is currently disabled by admin' : 'هذه الأداة معطلة حالياً من الإدارة';
        return res.status(403).json({ success: false, message: msg });
      }
      next();
    } catch {
      next();
    }
  };
}
