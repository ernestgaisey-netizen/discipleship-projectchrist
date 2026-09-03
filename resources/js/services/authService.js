import api from './apiClient';
import { TOKEN_KEY, USER_KEY } from '../config/api';

const authService = {
  async register(name, email, password, passwordConfirmation) {
    const data = await api.post('/auth/register', {
      name, email, password,
      password_confirmation: passwordConfirmation,
    });
    if (data.data?.token) {
      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    }
    return data;
  },

  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    if (data.data?.token) {
      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    }
    return data; // may contain mfa_required: true
  },

  async verifyMfa(userId, code) {
    const data = await api.post('/auth/mfa/verify-login', { user_id: userId, code });
    if (data.data?.token) {
      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    }
    return data;
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async me() {
    const data = await api.get('/auth/me');
    if (data.data) localStorage.setItem(USER_KEY, JSON.stringify(data.data));
    return data.data;
  },

  async updateProfile(updates) {
    const data = await api.patch('/auth/profile', updates);
    if (data.data) localStorage.setItem(USER_KEY, JSON.stringify(data.data));
    return data.data;
  },

  async changePassword(currentPassword, password, passwordConfirmation) {
    return api.post('/auth/change-password', {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    });
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, email, password, passwordConfirmation) {
    return api.post('/auth/reset-password', {
      token, email, password,
      password_confirmation: passwordConfirmation,
    });
  },

  // MFA
  async mfaSetup()           { return api.get('/auth/mfa/setup'); },
  async mfaEnable(code)      { return api.post('/auth/mfa/enable', { code }); },
  async mfaDisable(code)     { return api.post('/auth/mfa/disable', { code }); },

  getToken() { return localStorage.getItem(TOKEN_KEY); },
  getUser()  { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
  isLoggedIn() { return !!localStorage.getItem(TOKEN_KEY); },
  isAdmin()    { const u = this.getUser(); return u && ['admin','pastor'].includes(u.role); },
};

export default authService;
