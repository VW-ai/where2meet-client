'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, TokenResponse } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const currentUser = await api.getCurrentUser(storedToken);
          setUser(currentUser);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response: TokenResponse = await api.login({ email, password });
    setUser(response.user);
    setToken(response.access_token);
    localStorage.setItem('auth_token', response.access_token);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const response: TokenResponse = await api.signup({ email, password, name });
    setUser(response.user);
    setToken(response.access_token);
    localStorage.setItem('auth_token', response.access_token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const currentUser = await api.getCurrentUser(token);
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to refresh user:', error);
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
