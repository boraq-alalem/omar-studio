
// API Role types based on the API response
export interface ApiRole {
  id: number;
  name: string;
  permissions: ApiPermission[];
}

export interface ApiPermission {
  id: number;
  name: string;
}

// User types for the API
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  roles: ApiRole[];
  permissions: string[];
}

// Login response type
export interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: ApiUser;
}

// Create user request
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role_id: number;
}

// Create user response
export interface CreateUserResponse {
  message: string;
  user: {
    name: string;
    email: string;
    id: number;
    roles: ApiRole[];
  };
}

// Legacy types for compatibility
export type PermissionId =
  | 'view_dashboard'
  | 'manage_theses'
  | 'manage_archived_theses'
  | 'manage_reserved_titles'
  | 'manage_universities_specializations'
  | 'manage_users';

export interface Permission {
  id: PermissionId;
  label: string;
  description?: string;
}

export const ALL_PERMISSIONS: Permission[] = [
  { id: 'view_dashboard', label: 'عرض لوحة التحكم' },
  { id: 'manage_theses', label: 'إدارة الرسائل (إضافة، تعديل، أرشفة)' },
  { id: 'manage_archived_theses', label: 'إدارة الأرشيف (استعادة، حذف نهائي)' },
  { id: 'manage_reserved_titles', label: 'إدارة العناوين المحجوزة (إضافة، تعديل، حذف)' },
  { id: 'manage_universities_specializations', label: 'إدارة الجامعات والتخصصات' },
  { id: 'manage_users', label: 'إدارة المستخدمين (إضافة، تعديل، حذف)' },
];

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: number;
  username: string;
  fullName?: string;
  role: UserRole;
  permissions: PermissionId[];
}
