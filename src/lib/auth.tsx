import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

type User = { id: number; email: string; role: string; must_change_password?: boolean };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  /** Set user after login/verify (session cookie is set by API). */
  setSessionUser: (user: User) => void;
  /** Log out and redirect. If redirectTo is provided, go there; otherwise go to /. */
  logout: (redirectTo?: string) => void;
  /** Update stored user (e.g. after role change to host). */
  updateUser: (partial: Partial<User>) => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>('/api/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const setSessionUser = useCallback((u: User) => {
    setUser(u);
  }, []);

  const logout = useCallback(async (redirectTo?: string) => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* ignore */
    }
    setUser(null);
    window.location.href = redirectTo ?? '/';
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setSessionUser, logout, updateUser, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * Whether a role carries admin authority.
 *
 * A superadmin IS an admin. Written once because the API learned the same
 * lesson the hard way — thirteen hand-written role === 'admin' checks there
 * would each have refused a superadmin, and the browser had the same bug in the
 * user menu and the notification bell.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'superadmin';
}

/** Where a signed-in user's console lives. */
export function consoleHome(role: string | null | undefined): string {
  if (isAdminRole(role)) return '/admin/overview';
  if (role === 'host') return '/host/overview';
  return '/dashboard';
}
