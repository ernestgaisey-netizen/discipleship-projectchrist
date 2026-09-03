import { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(() => authService.getUser());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!authService.isLoggedIn()) return;
    try {
      const u = await authService.me();
      setUser(u);
    } catch {
      authService.logout();
      setUser(null);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.data?.user) setUser(res.data.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    setUser,
    isLoggedIn: !!user,
    isAdmin: user && ['admin', 'pastor'].includes(user.role),
    loading,
    login,
    logout,
    refresh,
  };
}
