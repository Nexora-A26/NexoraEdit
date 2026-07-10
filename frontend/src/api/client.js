const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

function requestLanguage(explicitLanguage) {
  return explicitLanguage || localStorage.getItem('nexoraedit_language') || 'ar';
}

async function apiFetch(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(requestLanguage() === 'en' ? 'The server took too long to respond. Please try again.' : 'استغرق الخادم وقتاً طويلاً. يرجى المحاولة مجدداً.');
    throw new Error(requestLanguage() === 'en' ? 'Could not connect to the server. Please check your connection and try again.' : 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مجدداً.');
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || (requestLanguage() === 'en' ? 'Something went wrong while contacting the server.' : 'حدث خطأ أثناء الاتصال بالخادم.'));
  return data;
}

export function getTools() {
  return apiFetch(`${API_BASE}/tools`, { headers: { 'X-Language': requestLanguage() } }).then(parseResponse).then((r) => r.data);
}

export function getToolSettings() {
  return apiFetch(`${API_BASE}/tools/settings`, { headers: { 'X-Language': requestLanguage() } }).then(parseResponse).then((r) => r.data || {});
}

export function createJob(endpoint, formData, language) {
  const options = { method: 'POST' };
  options.headers = { 'X-Language': requestLanguage(language) };
  if (formData instanceof FormData) {
    options.body = formData;
  } else {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(formData);
  }
  return apiFetch(`${API_BASE}${endpoint}`, options, 120000).then(parseResponse).then((r) => r.data);
}

export function getJob(jobId) {
  return apiFetch(`${API_BASE}/jobs/${encodeURIComponent(jobId)}`, { headers: { 'X-Language': requestLanguage() } }, 15000).then(parseResponse).then((r) => r.data);
}

export function getDownloadUrl(jobId) {
  return `${API_BASE}/download/${encodeURIComponent(jobId)}`;
}
