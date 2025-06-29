
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, ApiUser } from '@/types/users';
import { getCurrentUser as apiGetCurrentUser, logout as apiLogout } from '@/lib/authService';

interface AuthContextType {
  currentUser: User | null;
  apiUser: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  localToken: string | null;
  remoteToken: string | null;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setApiUser: (user: ApiUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [remoteToken, setRemoteToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user and tokens from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentApiUser');
      const storedLocalToken = localStorage.getItem('localToken');
      const storedRemoteToken = localStorage.getItem('remoteToken');
      
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setApiUser(user);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
      
      if (storedLocalToken) setLocalToken(storedLocalToken);
      if (storedRemoteToken) setRemoteToken(storedRemoteToken);
      
      setIsLoading(false);
    }
  }, []);

  const refetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await apiGetCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch current user", error);
      setCurrentUser(null);
      setApiUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setCurrentUser(null);
    setApiUser(null);
    setLocalToken(null);
    setRemoteToken(null);
    router.push('/login');
  }, [router]);

  const setApiUserAndStore = useCallback((user: ApiUser | null) => {
    setApiUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('currentApiUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentApiUser');
      }
    }
  }, []);



  // Remove the automatic refetch on mount since we're loading from localStorage

  const isAuthenticated = !!currentUser || !!apiUser;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      apiUser, 
      isLoading, 
      isAuthenticated,
      localToken,
      remoteToken,
      refetchUser, 
      logout,
      setApiUser: setApiUserAndStore
    }}>
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
