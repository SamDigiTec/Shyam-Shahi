import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import type { UserRole } from '../types/cms';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  email_verified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  needsFirstAdmin: boolean;
  refreshAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (payload: {
    email: string;
    full_name: string;
    password: string;
    invite_token?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsFirstAdmin, setNeedsFirstAdmin] = useState(false);

  const refreshAuth = useCallback(async () => {
    try {
      const status = await apiRequest<{ needsFirstAdmin: boolean }>('/api/auth/setup-status');
      setNeedsFirstAdmin(status.needsFirstAdmin);
    } catch {
      // ignore
    }

    try {
      const res = await apiRequest<{ user: AuthUser }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(res.user);
    setNeedsFirstAdmin(false);
    return res.user;
  };

  const signup = async (payload: {
    email: string;
    full_name: string;
    password: string;
    invite_token?: string;
  }) => {
    const res = await apiRequest<{ user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setUser(res.user);
    setNeedsFirstAdmin(false);
    return res.user;
  };

  const logout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, needsFirstAdmin, refreshAuth, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
