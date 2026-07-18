import { createContext, useContext, useEffect, type ReactNode } from 'react';
import api from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearAuth,
  setAuthLoading,
  setUser as setReduxUser,
  type User,
} from '@/store/authSlice';
import { clearContent } from '@/store/contentSlice';
import { clearProfiles } from '@/store/profileSlice';

export type { User } from '@/store/authSlice';

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
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const setUser = (nextUser: User | null) => {
    dispatch(setReduxUser(nextUser));
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      dispatch(setReduxUser(data.user));
    } catch {
      dispatch(setReduxUser(null));
    }
  };

  useEffect(() => {
    refreshUser().finally(() => dispatch(setAuthLoading(false)));
    // Redux dispatch is stable and this bootstrap should run only when mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string, remember = false) => {
    const { data } = await api.post('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password,
      remember,
    });
    dispatch(setReduxUser(data.user));
  };

  const register = async (email: string, username: string, password: string) => {
    const { data } = await api.post('/api/auth/register', {
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password,
    });
    dispatch(setReduxUser(data.user));
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    dispatch(clearAuth());
    dispatch(clearContent());
    dispatch(clearProfiles());
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
