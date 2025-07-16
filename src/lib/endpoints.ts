export const ROUTES = {
  LOGIN: '/login',
  THESES: '/theses',
  THESES_ADD: '/theses/add',
  UNIVERSITIES: '/universities',
  RESERVED_TITLES: '/reserved-titles',
  RESERVED_TITLES_ADD: '/reserved-titles/add',
  USERS: '/users',
};

export const API_ENDPOINTS = {
  LOGIN: '/login',
  LATEST_THESES: '/theses/latest',
  ADD_THESIS: '/theses/',
  THESIS_YEARS: '/theses/years',
  SPECIALIZATIONS: '/specializations',
  UNIVERSITIES: '/universities',
  DEGREES: '/degrees',
  UNIVERSITIES_WITH_SPECIALIZATIONS: '/universities-with-specializations',
  UNIVERSITIES_WITH_SPECIALIZATIONS_GUESTS: '/universities-with-specializations-guests',
  ARCHIVED_THESES: '/archived-theses',
  LATEST_RESERVED_TITLES: '/reserved-thesis-titles-latest',
  LATEST_RESERVED_TITLES_GUESTS: '/reserved-thesis-titles-latest-guests',
  RESERVED_TITLES: '/reserved-thesis-titles',
  USERS_WITHOUT_SUPER_ADMIN: '/users-without-super-admin',
};

// تجميع جميع الروابط في مكان واحد
const BASE_URLS = {
  LOCAL: 'http://server:8000/api/',
  PRODUCTION: 'https://alalem.c-library.org/api/',
} as const;

export const EXTERNAL_LINKS = {
  API_BASE_URL_LOCAL: BASE_URLS.LOCAL,
  API_BASE_URL_PROD: BASE_URLS.PRODUCTION,
  PLACEHOLDER_IMAGE: 'https://placehold.co/40x40.png',
  FONTS_GOOGLEAPIS: 'https://fonts.googleapis.com',
  FONTS_GSTATIC: 'https://fonts.gstatic.com',
  FONTS_STYLESHEET: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap',
};

// متغيرات للوصول السريع للروابط
export const API_URLS = {
  LOCAL: BASE_URLS.LOCAL,
  REMOTE: BASE_URLS.PRODUCTION,
} as const;

// دالة مساعدة للحصول على عنوان URL كامل
export const getApiUrl = (endpoint: string, useLocal: boolean = true): string => {
  const baseUrl = useLocal ? API_URLS.LOCAL : API_URLS.REMOTE;
  // إذا كان المسار يبدأ بـ '/' نقوم بإزالته لتجنب تكرار '/' في الرابط
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${baseUrl}${cleanEndpoint}`;
};
