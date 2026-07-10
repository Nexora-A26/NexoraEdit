const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

function getAdminKey() { return sessionStorage.getItem('nexoraedit_admin_key'); }

async function adminFetch(url, options = {}) {
  const key = getAdminKey();
  const headers = { ...options.headers };
  if (key) headers['x-admin-key'] = key;
  const response = await fetch(`${API_BASE}/admin${url}`, { ...options, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { sessionStorage.removeItem('nexoraedit_admin_key'); window.location.reload(); }
    throw new Error(data?.message || 'Admin API error');
  }
  return response.json().then(r => r.data);
}

function encodePath(value) {
  return String(value || '').split('/').map(encodeURIComponent).join('/');
}

async function downloadWithAuth(url, fallbackName, needsAdmin = true) {
  const headers = needsAdmin ? { 'x-admin-key': getAdminKey() || '' } : {};
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Download failed');
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fallbackName || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export const adminApi = {
  getStats: () => adminFetch('/stats'),
  getUploadedFiles: () => adminFetch('/files/uploads'),
  getResultFiles: () => adminFetch('/files/results'),
  downloadFile: (type, filename) => downloadWithAuth(`${API_BASE}/admin/files/${encodeURIComponent(type)}/${encodePath(filename)}/download`, String(filename).split('/').pop()),
  downloadJob: (jobId, fileName) => downloadWithAuth(`${API_BASE}/download/${encodeURIComponent(jobId)}`, fileName || `job-${jobId}`, false),
  deleteFile: (type, filename) => adminFetch(`/files/${encodeURIComponent(type)}/${encodePath(filename)}`, { method: 'DELETE' }),
  getJobs: () => adminFetch('/jobs'),
  getJob: (jobId) => adminFetch(`/jobs/${jobId}`),
  deleteJob: (jobId) => adminFetch(`/jobs/${jobId}`, { method: 'DELETE' }),
  getTools: () => adminFetch('/tools'),
  toggleTool: (toolId) => adminFetch(`/tools/${toolId}/toggle`, { method: 'PATCH' }),
  updateTool: (toolId, data) => adminFetch(`/tools/${toolId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  getSettings: () => adminFetch('/settings'),
  updateSettings: (data) => adminFetch('/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
};
