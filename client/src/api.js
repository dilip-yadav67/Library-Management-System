// VITE_API_URL = https://<render-app>.onrender.com/api   (local dev mein '/api' + vite proxy)
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const KEY = 'lp_token';

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Server se connect nahi ho paaya. Internet ya backend check karein.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
    setToken(null);
    window.dispatchEvent(new Event('lp:logout'));
  }
  if (!res.ok) throw new Error(data.message || 'Kuch galat ho gaya');
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b || {}),
  put: (p, b) => request('PUT', p, b || {}),
  del: (p) => request('DELETE', p),
  async download(path, filename) {
    const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error('Download fail ho gaya');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const isoDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function timeAgo(d) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d)) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
