import { config } from '../config.js';
import crypto from 'node:crypto';

function keysMatch(candidate, expected) {
  const candidateBuffer = Buffer.from(String(candidate || ''));
  const expectedBuffer = Buffer.from(String(expected || ''));
  return candidateBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || !keysMatch(key, config.adminKey)) {
    return res.status(401).json({ success: false, message: 'Unauthorized admin access' });
  }
  next();
}
