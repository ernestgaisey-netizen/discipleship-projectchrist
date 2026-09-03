import { API_BASE, TOKEN_KEY, USER_KEY } from '../config/api';

async function request(method, path, body, isFormData = false) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  headers['Accept'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Token is invalid/expired/revoked — clear stale session and let the app
    // redirect to login instead of leaving the user stuck seeing "Unauthenticated"
    // on every action while the navbar still shows them as logged in.
    if (res.status === 401 && token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status  = res.status;
    err.errors  = data.errors || null;
    err.code    = data.code || null;
    throw err;
  }

  return data;
}

const api = {
  get:    (path)         => request('GET', path),
  post:   (path, body)   => request('POST', path, body),
  patch:  (path, body)   => request('PATCH', path, body),
  put:    (path, body)   => request('PUT', path, body),
  delete: (path)         => request('DELETE', path),
  upload: (path, formData) => request('POST', path, formData, true),
};

export default api;
