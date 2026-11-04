async function request(method, url, body, { keepalive = false } = {}) {
  const opts = { method, headers: {}, credentials: 'same-origin', keepalive };
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  let data = null;
  try { data = await res.json(); } catch { /* leer */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Fehler ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (u) => request('GET', `/api${u}`),
  post: (u, b = {}, opts) => request('POST', `/api${u}`, b, opts),
  put: (u, b = {}, opts) => request('PUT', `/api${u}`, b, opts),
  del: (u) => request('DELETE', `/api${u}`),
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/api/admin/uploads', fd);
  },
};
