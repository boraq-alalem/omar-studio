
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, ApiUser } from '@/types/users';
import { getCurrentUser as apiGetCurrentUser, logout as apiLogout } from '@/lib/authService';
import { ROUTES } from '@/lib/endpoints';

// Cookie utilities
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
};

const getCookie = (name: string): string | null => {
  if (typeof document !== 'undefined') {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

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
  updateTokens: (local: string | null, remote: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [remoteToken, setRemoteToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user and tokens from cookies on mount
  useEffect(() => {
    const storedUser = getCookie('currentApiUser');
    const storedLocalToken = getCookie('localToken');
    const storedRemoteToken = getCookie('remoteToken');
    
    if (storedUser) {
      try {
        const user = JSON.parse(decodeURIComponent(storedUser));
        setApiUser(user);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        deleteCookie('currentApiUser');
      }
    }
    
    if (storedLocalToken) setLocalToken(storedLocalToken);
    if (storedRemoteToken) setRemoteToken(storedRemoteToken);
    
    setIsLoading(false);
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
    
    // Clear cookies
    deleteCookie('currentApiUser');
    deleteCookie('localToken');
    deleteCookie('remoteToken');
    
    router.push(ROUTES.LOGIN);
  }, [router]);

  const setApiUserAndStore = useCallback((user: ApiUser | null) => {
    setApiUser(user);
    if (user) {
      setCookie('currentApiUser', encodeURIComponent(JSON.stringify(user)), 7);
    } else {
      deleteCookie('currentApiUser');
    }
  }, []);
  
  // Update tokens in cookies when they change
  useEffect(() => {
    if (localToken) {
      setCookie('localToken', localToken, 7);
    } else {
      deleteCookie('localToken');
    }
  }, [localToken]);
  
  useEffect(() => {
    if (remoteToken) {
      setCookie('remoteToken', remoteToken, 7);
    } else {
      deleteCookie('remoteToken');
    }
  }, [remoteToken]);
  
  // Function to update tokens
  const updateTokens = useCallback((local: string | null, remote: string | null) => {
    setLocalToken(local);
    setRemoteToken(remote);
    
    // Update cookies directly
    if (local) {
      setCookie('localToken', local, 7);
    } else {
      deleteCookie('localToken');
    }
    
    if (remote) {
      setCookie('remoteToken', remote, 7);
    } else {
      deleteCookie('remoteToken');
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
      setApiUser: setApiUserAndStore,
      updateTokens
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
