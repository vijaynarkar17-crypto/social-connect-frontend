import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  cover?: string;
  bio?: string;
  links?: string[];
  theme?: 'light' | 'dark';
  isVerified?: boolean;
  privacy?: { profileVisibility: string; onlineStatus: string; storyVisibility?: string };
  notificationSettings?: { likes: boolean; comments: boolean; follows: boolean; messages: boolean };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, remember = false) => {
    const { data } = await api.post('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password,
      remember,
    });
    setUser(data.user);
  };

  const register = async (email: string, username: string, password: string) => {
    const { data } = await api.post('/api/auth/register', {
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password,
    });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
