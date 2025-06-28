
import type { User, UserRole, PermissionId, ApiRole, ApiUser, LoginResponse, CreateUserRequest, CreateUserResponse } from '@/types/users';
import { ALL_PERMISSIONS } from '@/types/users';
import { EXTERNAL_LINKS } from './endpoints';

// Token storage - use localStorage for persistence
const getLocalToken = () => typeof window !== 'undefined' ? localStorage.getItem('localToken') : null;
const getRemoteToken = () => typeof window !== 'undefined' ? localStorage.getItem('remoteToken') : null;
const getCurrentApiUser = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentApiUser');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

const setLocalToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('localToken', token);
    } else {
      localStorage.removeItem('localToken');
    }
  }
};

const setRemoteToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('remoteToken', token);
    } else {
      localStorage.removeItem('remoteToken');
    }
  }
};

const setCurrentApiUser = (user: ApiUser | null) => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('currentApiUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentApiUser');
    }
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
export async function login(email: string, password: string): Promise<LoginResponse> {
  const loginData = { email, password };
  
  try {
    // Login to local server
    const localResponse = await fetchApi<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    }, true);
    setLocalToken(localResponse.access_token);
    
    // Login to remote server
    const remoteResponse = await fetchApi<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    }, false);
    setRemoteToken(remoteResponse.access_token);
    
    setCurrentApiUser(localResponse.user);
    return localResponse;
  } catch (error) {
    throw new Error('فشل تسجيل الدخول');
  }
}

// Get all roles with permissions
export async function getAllRoles(): Promise<ApiRole[]> {
  return fetchApi<ApiRole[]>('/roles-with-permissions');
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const currentUser = getCurrentApiUser();
  if (!currentUser) return null;
  
  // Convert API user to legacy User format
  return {
    id: currentUser.id,
    username: currentUser.email,
    fullName: currentUser.name,
    role: 'admin', // Default role
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
  const results = { local_user: null, remote_user: null, uuid_stored: false };
  
  try {
    // Add to local server
    const localResponse = await fetchApi<CreateUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true);
    results.local_user = localResponse.user;
    
    // Add to remote server
    const remoteResponse = await fetchApi<CreateUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false);
    results.remote_user = remoteResponse.user;
    
    // Store UUIDs
    if (results.local_user?.id && results.remote_user?.id) {
      await storeUserUuids(results.local_user.id, results.remote_user.id);
      results.uuid_stored = true;
    }
    
    return results;
  } catch (error: any) {
    throw new Error(error.message || 'فشل إضافة المستخدم');
  }
}

// Store user UUIDs in both servers
async function storeUserUuids(id_local: number, id_remote: number): Promise<void> {
  const uuidData = { id_local: String(id_local), id_remote: String(id_remote) };
  
  const endpoints = [
    { base: EXTERNAL_LINKS.API_BASE_URL_LOCAL, token: getLocalToken() },
    { base: EXTERNAL_LINKS.API_BASE_URL_PROD, token: getRemoteToken() }
  ];
  
  await Promise.all(endpoints.map(async ({ base, token }) => {
    try {
      await fetch(`${base.replace(/\/$/, '')}/user-uuids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(uuidData),
      });
    } catch (e) {
      console.error('Failed to store user UUIDs:', e);
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
}
