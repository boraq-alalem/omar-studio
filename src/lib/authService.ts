
import type { User, UserRole, PermissionId, ApiRole, ApiUser, LoginResponse, CreateUserRequest, CreateUserResponse } from '@/types/users';
import { ALL_PERMISSIONS } from '@/types/users';
import { EXTERNAL_LINKS, API_ENDPOINTS } from './endpoints';

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

// Token storage - use cookies for persistence
const getLocalToken = () => getCookie('localToken');
const getRemoteToken = () => getCookie('remoteToken');
const getCurrentApiUser = () => {
  const stored = getCookie('currentApiUser');
  if (stored) {
    try {
      return JSON.parse(decodeURIComponent(stored));
    } catch (e) {
      console.error('Failed to parse stored user:', e);
      deleteCookie('currentApiUser');
    }
  }
  return null;
};

const setLocalToken = (token: string | null) => {
  if (token) {
    setCookie('localToken', token, 7);
  } else {
    deleteCookie('localToken');
  }
};

const setRemoteToken = (token: string | null) => {
  if (token) {
    setCookie('remoteToken', token, 7);
  } else {
    deleteCookie('remoteToken');
  }
};

const setCurrentApiUser = (user: ApiUser | null) => {
  if (user) {
    setCookie('currentApiUser', encodeURIComponent(JSON.stringify(user)), 7);
  } else {
    deleteCookie('currentApiUser');
  }
};

// API helper function
async function fetchApi<T>(endpoint: string, options: RequestInit = {}, useLocal = false): Promise<T> {
  const baseUrl = useLocal ? EXTERNAL_LINKS.API_BASE_URL_LOCAL : EXTERNAL_LINKS.API_BASE_URL_PROD;
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token exists
  const token = useLocal ? getLocalToken() : getRemoteToken();
  
  // If we're trying to use local server but no local token exists
  // and this is not a login request, throw an error
  if (useLocal && !token && !endpoint.includes(API_ENDPOINTS.LOGIN)) {
    throw new Error('No local token available for authenticated request');
  }
  
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP error! status: ${response.status}` };
    }
    throw errorData;
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

// Login to both servers
export async function login(email: string, password: string): Promise<LoginResponse & { localToken: string | null, remoteToken: string }> {
  const loginData = { email, password };
  let localSuccess = false;
  let remoteSuccess = false;
  let localResponse: LoginResponse | null = null;
  let remoteResponse: LoginResponse | null = null;
  
  try {
    // Login to remote server first
    remoteResponse = await fetchApi<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(loginData),
    }, false);
    setRemoteToken(remoteResponse.access_token);
    remoteSuccess = true;
    
    // Check if user has writer-titles role
    const hasWriterTitlesRole = remoteResponse.user.roles.some(role => role.name === 'writer-titles');
    
    // If user has writer-titles role, skip local server login
    if (hasWriterTitlesRole) {
      console.log('User has writer-titles role, skipping local server login');
      setCurrentApiUser(remoteResponse.user);
      return {
        ...remoteResponse,
        localToken: null,
        remoteToken: remoteResponse.access_token
      };
    }
  } catch (error) {
    console.log('Failed to login to remote server:', error);
  }
  
  // If not writer-titles or remote login failed, try local server
  try {
    // Login to local server
    localResponse = await fetchApi<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(loginData),
    }, true);
    setLocalToken(localResponse.access_token);
    localSuccess = true;
  } catch (error) {
    console.log('Failed to login to local server:', error);
  }
  
  // For writer-titles users, only remote server needs to succeed
  // For other users, both servers must succeed
  if (remoteSuccess && remoteResponse) {
    const hasWriterTitlesRole = remoteResponse.user.roles.some(role => role.name === 'writer-titles');
    
    if (hasWriterTitlesRole) {
      // Writer-titles users only need remote login
      setCurrentApiUser(remoteResponse.user);
      return {
        ...remoteResponse,
        localToken: localSuccess ? localResponse!.access_token : null,
        remoteToken: remoteResponse.access_token
      };
    } else if (localSuccess) {
      // Other users need both logins
      setCurrentApiUser(localResponse!.user);
      return {
        ...localResponse!,
        localToken: localResponse!.access_token,
        remoteToken: remoteResponse.access_token
      };
    }
  }
  
  // Clear any stored tokens if login failed
  setLocalToken(null);
  setRemoteToken(null);
  setCurrentApiUser(null);
  
  // Check if remote login succeeded but local failed
  if (remoteSuccess && !localSuccess) {
    const hasWriterTitlesRole = remoteResponse!.user.roles.some(role => role.name === 'writer-titles');
    if (!hasWriterTitlesRole) {
      throw new Error('فشل تسجيل الدخول. الخادم المحلي غير متاح حالياً.');
    }
  }
  
  throw new Error('فشل تسجيل الدخول. يجب أن تكون جميع الخوادم متصلة للمتابعة.');
}

// Get all roles with permissions
export async function getAllRoles(): Promise<ApiRole[]> {
  return fetchApi<ApiRole[]>('/roles-with-permissions');
}

// Helper function to check if user has writer-titles role
export function hasWriterTitlesRole(user: ApiUser): boolean {
  return user.roles.some(role => role.name === 'writer-titles');
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const currentUser = getCurrentApiUser();
  if (!currentUser) return null;
  
  // Check if user has writer-titles role
  const isWriterTitles = hasWriterTitlesRole(currentUser);
  
  // Convert API user to legacy User format
  return {
    id: currentUser.id,
    username: currentUser.email,
    fullName: currentUser.name,
    role: isWriterTitles ? 'editor' : 'admin', // Use editor role for writer-titles
    permissions: currentUser.permissions.includes('إضافة مستخدمين') ? ['manage_users'] : [],
  };
}

// Get all users (mock for now)
export async function getAllUsers(): Promise<User[]> {
  // This would need to be implemented in the API
  return [];
}

// Add user to both servers
export async function addUser(userData: CreateUserRequest): Promise<{ local_user: any, remote_user: any, uuid_stored: boolean }> {
  const results: { local_user: any, remote_user: any, uuid_stored: boolean } = { local_user: null, remote_user: null, uuid_stored: false };
  let localSuccess = false;
  let remoteSuccess = false;
  
  try {
    // Add to local server
    const localResponse = await fetchApi<CreateUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true);
    results.local_user = localResponse.user;
    localSuccess = true;
  } catch (error) {
    console.log('Failed to add user to local server:', error);
  }
  
  try {
    // Add to remote server
    const remoteResponse = await fetchApi<CreateUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false);
    results.remote_user = remoteResponse.user;
    remoteSuccess = true;
  } catch (error) {
    console.log('Failed to add user to remote server:', error);
  }
  
  // Store UUIDs if both succeeded
  if (results.local_user && results.remote_user && results.local_user.id && results.remote_user.id) {
    try {
      await storeUserUuids(results.local_user.id, results.remote_user.id);
      results.uuid_stored = true;
    } catch (error) {
      console.log('Failed to store UUIDs:', error);
    }
  }
  
  // Both must succeed for user creation
  if (localSuccess && remoteSuccess) {
    return results;
  }
  
  throw new Error('فشل إضافة المستخدم في أحد الخوادم أو كليهما');
}

// Store user UUIDs in both servers
async function storeUserUuids(id_local: number, id_remote: number): Promise<void> {
  const uuidData = { id_local: String(id_local), id_remote: String(id_remote) };
  
  const endpoints = [
    { base: EXTERNAL_LINKS.API_BASE_URL_LOCAL, token: getLocalToken(), name: 'المحلي' },
    { base: EXTERNAL_LINKS.API_BASE_URL_PROD, token: getRemoteToken(), name: 'الخارجي' }
  ];
  
  await Promise.all(endpoints.map(async ({ base, token, name }) => {
    try {
      const response = await fetch(`${base.replace(/\/$/, '')}/user-uuids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(uuidData),
      });
      
      if (response.ok) {
        console.log(`تم حفظ UUIDs بنجاح في الخادم ${name}`);
      } else {
        console.log(`فشل حفظ UUIDs في الخادم ${name}: ${response.status}`);
      }
    } catch (e) {
      console.error(`خطأ في حفظ UUIDs في الخادم ${name}:`, e);
    }
  }));
}

// Legacy functions for compatibility
export async function getUserById(id: number): Promise<User | undefined> {
  return undefined;
}

export interface AddUserInput {
  username: string;
  fullName?: string;
  password?: string;
  role: UserRole;
  permissions: PermissionId[];
}

export interface UpdateUserInput {
  id: number;
  username?: string;
  fullName?: string;
  role?: UserRole;
  permissions?: PermissionId[];
}

export async function updateUser(userId: number, updates: Omit<UpdateUserInput, 'id'>): Promise<User> {
  throw new Error('Not implemented');
}

export async function deleteUser(userId: number): Promise<{ message: string }> {
  throw new Error('Not implemented');
}

export async function updateProfile(userId: number, data: { fullName?: string }): Promise<User> {
  throw new Error('Not implemented');
}

export async function changePassword(userId: number, currentPassword?: string, newPassword?: string): Promise<{ message: string }> {
  throw new Error('Not implemented');
}

export async function logout(): Promise<void> {
  setLocalToken(null);
  setRemoteToken(null);
  setCurrentApiUser(null);
  
  // Clear all auth cookies
  deleteCookie('localToken');
  deleteCookie('remoteToken');
  deleteCookie('currentApiUser');
}
