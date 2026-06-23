import React, { createContext, useContext, useState } from 'react';
import type { AuthUser } from '../types';

interface AuthContextValue { user: AuthUser | null; login: (user: AuthUser) => void; logout: () => void; isAuthenticated: boolean; }
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('saho_user') ?? 'null') as AuthUser | null; } catch { return null; }
  });
  const login = (u: AuthUser) => { localStorage.setItem('saho_user', JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.removeItem('saho_user'); localStorage.removeItem('saho_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
