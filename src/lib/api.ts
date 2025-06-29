import type {
  GeneralStats,
  Thesis,
  ThesisGuest,
  AddThesisResponse,
  UpdateThesisResponse,
  ArchiveThesisResponse,
  ThesisYear,
  Specialization,
  University,
  Degree,
  UniversityWithSpecializationsAdmin,
  UniversityWithSpecializationsGuest,
  AddSpecializationToUniversityResponse,
  ArchivedThesis,
  RestoreArchivedThesisResponse,
  DeleteThesisResponse,
  ReservedThesisTitle,
  ReservedThesisTitleGuest,
  AddReservedTitleResponse,
  UpdateReservedTitleResponse,
  DeleteReservedTitleResponse,
  ApiError
} from '@/types/api';
import { API_ENDPOINTS, EXTERNAL_LINKS } from './endpoints';
import { useServerError } from '@/contexts/ServerErrorContext';
import { toast } from '@/hooks/use-toast';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD.replace(/\/$/, '')}${endpoint}`;
  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
      // 'Content-Type': 'application/json', // Not for FormData
      // Add Authorization header if needed later
    },
  };

  // if (!(options.body instanceof FormData) && options.method !== 'GET' && options.method !== 'HEAD') {
  //   defaultOptions.headers = { ...defaultOptions.headers, 'Content-Type': 'application/json' };
  // }


  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }
      console.error(
        'API Error:',
        errorData && Object.keys(errorData).length > 0
          ? errorData
          : `No error details. Status: ${response.status}, URL: ${response.url}`
      );
      throw errorData || { message: `HTTP error! status: ${response.status}` };
    }
  // For 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

async function fetchApiBoth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const urls = [
    EXTERNAL_LINKS.API_BASE_URL_LOCAL,
    EXTERNAL_LINKS.API_BASE_URL_PROD
  ];
  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };
  
  // Merge headers properly
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  const fetches = urls.map(base => {
    const url = `${base.replace(/\/$/, '')}${endpoint}`;
    console.log('Fetching from:', url);
    return fetch(url, mergedOptions);
  });
  const results = await Promise.allSettled(fetches);
  let allFailed = true;
  let lastError = null;
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const url = urls[i];
    
    if (result.status === 'fulfilled' && result.value.ok) {
      allFailed = false;
      console.log(`Success from ${url}:`, result.value.status);
      if (result.value.status === 204) return undefined as T;
      return result.value.json();
    } else if (result.status === 'fulfilled') {
      console.error(`HTTP error from ${url}:`, result.value.status, result.value.statusText);
      lastError = `HTTP ${result.value.status} from ${url}`;
    } else {
      console.error(`Network error from ${url}:`, result.reason);
      lastError = `Network error from ${url}: ${result.reason}`;
    }
  }
  
  if (allFailed) {
    console.error('All API requests failed. Last error:', lastError);
    throw new Error(`Both API requests failed. Last error: ${lastError}`);
  }
}

// Remove problematic event listener

// 1. General Statistics
export const getGeneralStats = () => fetchApiBoth<GeneralStats>('/stats');

// 2. Theses
export const getLatestTheses = () => fetchApiBoth<Thesis[]>('/theses/latest');

export const searchTheses = (params: { title: string; author?: string; degree_id?: string; specialization_id?: string; university_id?: string; year?: string }) => {
  const queryParams = new URLSearchParams(params as any).toString();
  return fetchApiBoth<Thesis[]>(`/theses/search?${queryParams}`);
};

export const searchThesesGuests = (params: { title: string; author?: string; degree_id?: string; specialization_id?: string; university_id?: string; year?: string }) => {
  const queryParams = new URLSearchParams(params as any).toString();
  return fetchApiBoth<ThesisGuest[]>(`/theses/search-guests?${queryParams}`);
};

export const addThesis = (formData: FormData) => fetchApiBoth<AddThesisResponse>('/theses/', { method: 'POST', body: formData });

export const updateThesis = (id: number, formData: FormData) => {
  formData.append('_method', 'PUT');
  return fetchApiBoth<UpdateThesisResponse>(`/theses/${id}`, { method: 'POST', body: formData });
};

export const archiveThesis = (id: number) => fetchApiBoth<ArchiveThesisResponse>(`/theses/${id}`, { method: 'DELETE' });

export const getThesisYears = () => fetchApiBoth<ThesisYear[]>('/theses/years');

// 3. Filters (Dropdowns)
export const getSpecializations = () => fetchApiBoth<Specialization[]>('/specializations');
export const getUniversities = () => fetchApiBoth<University[]>('/universities');
export const getDegrees = () => fetchApiBoth<Degree[]>('/degrees');

// 4. Universities and Specializations
export const getUniversitiesWithSpecializationsAdmin = () => fetchApiBoth<UniversityWithSpecializationsAdmin[]>('/universities-with-specializations');
export const getUniversitiesWithSpecializationsGuests = () => fetchApiBoth<UniversityWithSpecializationsGuest[]>('/universities-with-specializations-guests');
export const searchUniversities = (name: string) => fetchApiBoth<University[]>(`/universities/search?name=${encodeURIComponent(name)}`);

export const addSpecializationToUniversity = (universityId: number, data: { specialization_name: string } | { specialization_id: number }) => {
  const requestBody = {
    ...data,
    university_id: universityId
  };
  
  return fetchApiBoth<AddSpecializationToUniversityResponse>(`/universities/${universityId}/add-specialization`, { 
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
};


// 5. Archive
export const getArchivedTheses = () => fetchApiBoth<ArchivedThesis[]>('/archived-theses');
export const restoreArchivedThesis = (id: number) => fetchApiBoth<RestoreArchivedThesisResponse>(`/archived-theses/${id}/restore`, { method: 'POST' });
// Updated as per user request
export const permanentlyDeleteThesis = (id: number) => fetchApiBoth<DeleteThesisResponse>(`/archived-theses/${id}`, { method: 'DELETE' });

// 6. Reserved Titles
export const getLatestReservedTitles = () => {
  const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD}reserved-thesis-titles-latest`;
  return fetch(url, { headers: { 'Accept': 'application/json' } }).then(res => res.json());
};
export const getLatestReservedTitlesGuests = () => fetchApiBoth<ReservedThesisTitleGuest[]>(
  '/reserved-thesis-titles-latest-guests'
);

export const addReservedTitle = (data: Omit<ReservedThesisTitle, 'id'>) => {
  const body = new URLSearchParams(data as any);
  const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD}reserved-thesis-titles`;
  return fetch(url, {
    method: 'POST',
    body: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
  }).then(res => res.json());
};

export const updateReservedTitle = (id: number, data: Omit<ReservedThesisTitle, 'id'>) => {
  const body = new URLSearchParams(data as any);
  const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD}reserved-thesis-titles/${id}`;
  return fetch(url, {
    method: 'PUT',
    body: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
  }).then(res => res.json());
};

export const deleteReservedTitle = (id: number) => {
  const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD}reserved-thesis-titles/${id}`;
  return fetch(url, { method: 'DELETE', headers: { 'Accept': 'application/json' } }).then(res => res.json());
};

export const searchReservedTitles = (query: string) => {
  const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD}reserved-thesis-titles-search?q=${encodeURIComponent(query)}`;
  return fetch(url, { headers: { 'Accept': 'application/json' } })
    .then(res => res.json());
};
export const searchReservedTitlesGuests = (query: string) => fetchApiBoth<ReservedThesisTitleGuest[]>(`/reserved-thesis-titles-search-guests?q=${encodeURIComponent(query)}`);

// 7. Check Thesis Title Exists
/**
 * يتحقق من وجود عنوان رسالة في كل من الخادم المحلي والاستضافة.
 * يعرض Toast إذا كان العنوان موجود في أي خادم.
 * يرجع true إذا كان العنوان موجود في أي خادم، false إذا لم يوجد في أي خادم.
 */
export async function checkThesisTitleExists(title: string): Promise<boolean> {
  const urls = [
    { base: EXTERNAL_LINKS.API_BASE_URL_LOCAL, label: 'الخادم المحلي' },
    { base: EXTERNAL_LINKS.API_BASE_URL_PROD, label: 'الاستضافة' }
  ];
  const results = await Promise.all(urls.map(async ({ base, label }) => {
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/theses/search?title=${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          toast({
            title: 'تنبيه',
            description: `العنوان موجود بالفعل في ${label}`,
            variant: 'destructive',
          });
          return true;
        }
      }
    } catch {
      // تجاهل أخطاء الاتصال بالخادم
    }
    return false;
  }));
  return results.some(Boolean);
}

/**
 * يتحقق من وجود عنوان محجوز في الاستضافة فقط.
 * يعرض Toast إذا كان العنوان موجود.
 * يرجع true إذا كان العنوان موجود، false إذا لم يوجد.
 */
export async function checkReservedTitleExists(title: string): Promise<boolean> {
  try {
    const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD}reserved-thesis-titles-search?q=${encodeURIComponent(title)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        toast({
          title: 'تنبيه',
          description: 'العنوان موجود بالفعل',
          variant: 'destructive',
        });
        return true;
      }
    }
  } catch {
    // تجاهل أخطاء الاتصال
  }
  return false;
}

// تقليص PDF إلى 30 صفحة للاستضافة
async function truncatePdfTo30Pages(pdfFile: File): Promise<File> {
  try {
    // استخدام PDF-lib لتقليص الملف
    const { PDFDocument } = await import('pdf-lib');
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const pageCount = pdfDoc.getPageCount();
    if (pageCount <= 30) {
      return pdfFile; // إرجاع الملف كما هو إذا كان 30 صفحة أو أقل
    }
    
    // إنشاء PDF جديد بأول 30 صفحة
    const newPdfDoc = await PDFDocument.create();
    const pages = await newPdfDoc.copyPages(pdfDoc, Array.from({ length: 30 }, (_, i) => i));
    pages.forEach(page => newPdfDoc.addPage(page));
    
    const truncatedPdfBytes = await newPdfDoc.save();
    return new File([truncatedPdfBytes], pdfFile.name, { type: 'application/pdf' });
  } catch (error) {
    console.error('Error truncating PDF:', error);
    return pdfFile; // إرجاع الملف الأصلي في حالة الخطأ
  }
}

// إضافة دالة addThesisBoth التي ترسل الطلب إلى كل خادم وتجمع المعرفات
export async function addThesisBoth(formData: FormData): Promise<{ id_local: number|null, id_remote: number|null }> {
  const pdfFile = formData.get('pdf') as File;
  const ids: { id_local: number|null, id_remote: number|null } = { id_local: null, id_remote: null };
  
  // إرسال للخادم المحلي بالملف الكامل
  try {
    const localFormData = new FormData();
    formData.forEach((value, name) => {
      localFormData.append(name, value);
    });
    const localRes = await fetch(`${EXTERNAL_LINKS.API_BASE_URL_LOCAL.replace(/\/$/, '')}${API_ENDPOINTS.ADD_THESIS}`, { 
      method: 'POST', 
      body: localFormData 
    });
    if (localRes.ok) {
      const data = await localRes.json();
      if (data && data.thesis && data.thesis.id) {
        ids.id_local = data.thesis.id;
      }
    }
  } catch (e) {
    // تجاهل أخطاء الاتصال
  }
  
  // إرسال للاستضافة بملف مقلص إلى 30 صفحة
  if (pdfFile) {
    try {
      const truncatedPdf = await truncatePdfTo30Pages(pdfFile);
      const remoteFormData = new FormData();
      formData.forEach((value, name) => {
        if (name === 'pdf') {
          remoteFormData.append(name, truncatedPdf);
        } else {
          remoteFormData.append(name, value);
        }
      });
      const remoteRes = await fetch(`${EXTERNAL_LINKS.API_BASE_URL_PROD.replace(/\/$/, '')}${API_ENDPOINTS.ADD_THESIS}`, { 
        method: 'POST', 
        body: remoteFormData 
      });
      if (remoteRes.ok) {
        const data = await remoteRes.json();
        if (data && data.thesis && data.thesis.id) {
          ids.id_remote = data.thesis.id;
        }
      }
    } catch (e) {
      // تجاهل أخطاء الاتصال
    }
  }
  
  return ids;
}

// إضافة دالة sendUuidsToBothServers لإرسال المعرفات
export async function sendUuidsToBothServers(id_local: number | string, id_remote: number | string) {
  const endpoints = [
    { base: EXTERNAL_LINKS.API_BASE_URL_LOCAL, label: 'الخادم المحلي' },
    { base: EXTERNAL_LINKS.API_BASE_URL_PROD, label: 'الاستضافة' }
  ];
  // التأكد أن القيم نصوص
  const body = JSON.stringify({ id_local: String(id_local), id_remote: String(id_remote) });
  
  await Promise.all(endpoints.map(async ({ base, label }) => {
    try {
      const url = `${base.replace(/\/$/, '')}/uuids`;
      console.log(`Sending UUIDs to ${label}:`, url, body);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body
      });
      
      console.log(`UUIDs response from ${label}:`, response.status);
      if (!response.ok) {
        console.error(`UUIDs error from ${label}:`, await response.text());
      }
    } catch (e) {
      console.error(`UUIDs network error to ${label}:`, e);
    }
  }));
}

// جلب id_remote بناءً على id_local من جدول uuids
export async function getRemoteIdByLocalId(id_local: string | number): Promise<string | null> {
  try {
    const res = await fetch(`${EXTERNAL_LINKS.API_BASE_URL_LOCAL}uuids/search?id_local=${id_local}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].id_remote) {
        return data[0].id_remote;
      }
    }
  } catch {
    // تجاهل الأخطاء
  }
  return null;
}

// تعديل الرسالة في كلا الخادمين باستخدام المعرفات الصحيحة
export async function updateThesisBoth(id_local: number, id_remote: string | null, formData: FormData): Promise<void> {
  const pdfFile = formData.get('pdf') as File;
  const requests = [];
  
  // طلب الخادم المحلي بالملف الكامل
  const localFormData = new FormData();
  formData.forEach((value, key) => localFormData.append(key, value));
  localFormData.append('_method', 'PUT');
  requests.push(
    fetch(`${EXTERNAL_LINKS.API_BASE_URL_LOCAL}theses/${id_local}`, {
      method: 'POST',
      body: localFormData,
    })
  );
  
  // طلب الاستضافة بملف مقلص إذا توفر id_remote
  if (id_remote) {
    const remoteFormData = new FormData();
    
    if (pdfFile) {
      const truncatedPdf = await truncatePdfTo30Pages(pdfFile);
      formData.forEach((value, key) => {
        if (key === 'pdf') {
          remoteFormData.append(key, truncatedPdf);
        } else {
          remoteFormData.append(key, value);
        }
      });
    } else {
      formData.forEach((value, key) => remoteFormData.append(key, value));
    }
    
    remoteFormData.append('_method', 'PUT');
    requests.push(
      fetch(`${EXTERNAL_LINKS.API_BASE_URL_PROD}theses/${id_remote}`, {
        method: 'POST',
        body: remoteFormData,
      })
    );
  }
  
  const results = await Promise.allSettled(requests);
  
  // التحقق من النتائج
  let errors = [];
  if (results[0].status === 'rejected' || (results[0].status === 'fulfilled' && !results[0].value.ok)) {
    errors.push('فشل التعديل في الخادم المحلي');
  }
  if (id_remote && results[1] && (results[1].status === 'rejected' || (results[1].status === 'fulfilled' && !results[1].value.ok))) {
    errors.push('فشل التعديل في الاستضافة');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
}

// أرشفة الرسالة في كلا الخادمين باستخدام المعرفات الصحيحة
export async function archiveThesisBoth(id_local: number, id_remote: string | null): Promise<void> {
  const requests = [];
  
  // طلب الخادم المحلي
  requests.push(
    fetch(`${EXTERNAL_LINKS.API_BASE_URL_LOCAL}theses/${id_local}`, {
      method: 'DELETE',
    })
  );
  
  // طلب الاستضافة إذا توفر id_remote
  if (id_remote) {
    requests.push(
      fetch(`${EXTERNAL_LINKS.API_BASE_URL_PROD}theses/${id_remote}`, {
        method: 'DELETE',
      })
    );
  }
  
  const results = await Promise.allSettled(requests);
  
  // التحقق من النتائج
  let errors = [];
  if (results[0].status === 'rejected' || (results[0].status === 'fulfilled' && !results[0].value.ok)) {
    errors.push('فشل الأرشفة في الخادم المحلي');
  }
  if (id_remote && results[1] && (results[1].status === 'rejected' || (results[1].status === 'fulfilled' && !results[1].value.ok))) {
    errors.push('فشل الأرشفة في الاستضافة');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
}

// استعادة الرسالة من الأرشيف في كلا الخادمين باستخدام المعرفات الصحيحة
export async function restoreArchivedThesisBoth(id_local: number, id_remote: string | null): Promise<void> {
  const requests = [];
  
  // طلب الخادم المحلي
  requests.push(
    fetch(`${EXTERNAL_LINKS.API_BASE_URL_LOCAL}archived-theses/${id_local}/restore`, {
      method: 'POST',
    })
  );
  
  // طلب الاستضافة إذا توفر id_remote
  if (id_remote) {
    requests.push(
      fetch(`${EXTERNAL_LINKS.API_BASE_URL_PROD}archived-theses/${id_remote}/restore`, {
        method: 'POST',
      })
    );
  }
  
  const results = await Promise.allSettled(requests);
  
  // التحقق من النتائج
  let errors = [];
  if (results[0].status === 'rejected' || (results[0].status === 'fulfilled' && !results[0].value.ok)) {
    errors.push('فشل الاستعادة في الخادم المحلي');
  }
  if (id_remote && results[1] && (results[1].status === 'rejected' || (results[1].status === 'fulfilled' && !results[1].value.ok))) {
    errors.push('فشل الاستعادة في الاستضافة');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
}

// حذف الرسالة نهائياً في كلا الخادمين باستخدام المعرفات الصحيحة
export async function permanentlyDeleteThesisBoth(id_local: number, id_remote: string | null): Promise<void> {
  const requests = [];
  
  // طلب الخادم المحلي
  requests.push(
    fetch(`${EXTERNAL_LINKS.API_BASE_URL_LOCAL}archived-theses/${id_local}`, {
      method: 'DELETE',
    })
  );
  
  // طلب الاستضافة إذا توفر id_remote
  if (id_remote) {
    requests.push(
      fetch(`${EXTERNAL_LINKS.API_BASE_URL_PROD}archived-theses/${id_remote}`, {
        method: 'DELETE',
      })
    );
  }
  
  const results = await Promise.allSettled(requests);
  
  // التحقق من النتائج
  let errors = [];
  if (results[0].status === 'rejected' || (results[0].status === 'fulfilled' && !results[0].value.ok)) {
    errors.push('فشل الحذف في الخادم المحلي');
  }
  if (id_remote && results[1] && (results[1].status === 'rejected' || (results[1].status === 'fulfilled' && !results[1].value.ok))) {
    errors.push('فشل الحذف في الاستضافة');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
  
  // حذف المعرفات من جدول uuids بعد نجاح الحذف
  await deleteUuidsFromBothServers(id_local);
}

// حذف المعرفات من جدول uuids في كلا الخادمين
export async function deleteUuidsFromBothServers(id_local: number): Promise<void> {
  const endpoints = [
    EXTERNAL_LINKS.API_BASE_URL_LOCAL,
    EXTERNAL_LINKS.API_BASE_URL_PROD
  ];
  await Promise.all(endpoints.map(async (base) => {
    try {
      await fetch(`${base.replace(/\/$/, '')}/uuids?id_local=${id_local}`, {
        method: 'DELETE',
      });
    } catch (e) {
      // تجاهل أخطاء الاتصال
    }
  }));
}

// جلب المستخدمين بدون super admin
export const getUsersWithoutSuperAdmin = async (localToken: string, remoteToken: string) => {
  const servers = [
    { url: EXTERNAL_LINKS.API_BASE_URL_LOCAL, token: localToken, name: 'المحلي' },
    { url: EXTERNAL_LINKS.API_BASE_URL_PROD, token: remoteToken, name: 'الخارجي' }
  ];
  
  for (const server of servers) {
    try {
      const url = `${server.url.replace(/\/$/, '')}/users-without-super-admin`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${server.token}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`Failed to fetch from ${server.name}:`, error);
    }
  }
  
  throw new Error('فشل في جلب المستخدمين من جميع الخوادم');
};

// تعديل مستخدم
export const updateUser = async (userId: number, userData: any, localToken: string, remoteToken: string) => {
  let successCount = 0;
  let firstResponse = null;
  
  // 1. تعديل في الخادم المحلي
  try {
    const localUrl = `${EXTERNAL_LINKS.API_BASE_URL_LOCAL.replace(/\/$/, '')}/users/${userId}`;
    const localResponse = await fetch(localUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (localResponse.ok) {
      successCount++;
      firstResponse = await localResponse.json();
      console.log('تم تعديل المستخدم بنجاح في الخادم المحلي');
    } else if (localResponse.status === 422) {
      const errorData = await localResponse.json();
      throw errorData;
    } else {
      console.log(`فشل تعديل المستخدم في الخادم المحلي: ${localResponse.status}`);
    }
  } catch (error) {
    if (error.errors) throw error; // Validation errors
    console.log('خطأ في تعديل المستخدم في الخادم المحلي:', error);
  }
  
  // 2. جلب id_remote وتعديل في الاستضافة
  try {
    const remoteUserId = await getRemoteUserId(userId, localToken);
    if (remoteUserId) {
      const remoteUrl = `${EXTERNAL_LINKS.API_BASE_URL_PROD.replace(/\/$/, '')}/users/${remoteUserId}`;
      const remoteResponse = await fetch(remoteUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${remoteToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (remoteResponse.ok) {
        successCount++;
        console.log(`تم تعديل المستخدم بنجاح في الاستضافة (ID: ${remoteUserId})`);
      } else {
        console.log(`فشل تعديل المستخدم في الاستضافة: ${remoteResponse.status}`);
      }
    } else {
      console.log('لم يتم العثور على id_remote للمستخدم');
    }
  } catch (error) {
    console.log('خطأ في تعديل المستخدم في الاستضافة:', error);
  }
  
  // يجب أن ينجح في كلا الخادمين
  if (successCount === 2) {
    return firstResponse;
  } else if (successCount === 1) {
    throw new Error('تم التعديل في خادم واحد فقط. يجب النجاح في كلا الخادمين.');
  } else {
    throw new Error('فشل في تعديل المستخدم في جميع الخوادم');
  }
};

// جلب id_remote بناءً على id_local
export const getRemoteUserId = async (localUserId: number, localToken: string): Promise<string | null> => {
  try {
    const url = `${EXTERNAL_LINKS.API_BASE_URL_LOCAL.replace(/\/$/, '')}/user-uuids/search?id_local=${localUserId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localToken}`,
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].id_remote) {
        return data[0].id_remote;
      }
    }
  } catch (error) {
    console.log('Failed to get remote user ID:', error);
  }
  return null;
};

// حذف user_uuids من كلا الخادمين
export const deleteUserUuids = async (localUserId: number, localToken: string, remoteToken: string) => {
  const servers = [
    { url: EXTERNAL_LINKS.API_BASE_URL_LOCAL, token: localToken, name: 'المحلي' },
    { url: EXTERNAL_LINKS.API_BASE_URL_PROD, token: remoteToken, name: 'الاستضافة' }
  ];
  
  for (const server of servers) {
    try {
      const url = `${server.url.replace(/\/$/, '')}/user-uuids?id_local=${localUserId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${server.token}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log(`تم حذف user_uuids بنجاح من ${server.name}`);
      } else {
        console.log(`فشل حذف user_uuids من ${server.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`خطأ في حذف user_uuids من ${server.name}:`, error);
    }
  }
};

// حذف مستخدم
export const deleteUser = async (userId: number, localToken: string, remoteToken: string) => {
  let successCount = 0;
  
  // 1. حذف من الخادم المحلي
  try {
    const localUrl = `${EXTERNAL_LINKS.API_BASE_URL_LOCAL.replace(/\/$/, '')}/users/${userId}`;
    const localResponse = await fetch(localUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localToken}`,
        'Accept': 'application/json',
      },
    });
    
    if (localResponse.ok) {
      successCount++;
      console.log('تم حذف المستخدم بنجاح من الخادم المحلي');
    } else {
      console.log(`فشل حذف المستخدم من الخادم المحلي: ${localResponse.status}`);
    }
  } catch (error) {
    console.log('خطأ في حذف المستخدم من الخادم المحلي:', error);
  }
  
  // 2. جلب id_remote وحذف من الاستضافة
  try {
    const remoteUserId = await getRemoteUserId(userId, localToken);
    if (remoteUserId) {
      const remoteUrl = `${EXTERNAL_LINKS.API_BASE_URL_PROD.replace(/\/$/, '')}/users/${remoteUserId}`;
      const remoteResponse = await fetch(remoteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${remoteToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (remoteResponse.ok) {
        successCount++;
        console.log(`تم حذف المستخدم بنجاح من الاستضافة (ID: ${remoteUserId})`);
      } else {
        console.log(`فشل حذف المستخدم من الاستضافة: ${remoteResponse.status}`);
      }
    } else {
      console.log('لم يتم العثور على id_remote للمستخدم');
    }
  } catch (error) {
    console.log('خطأ في حذف المستخدم من الاستضافة:', error);
  }
  
  // يجب أن ينجح في كلا الخادمين
  if (successCount === 2) {
    // حذف user_uuids بعد نجاح حذف المستخدم
    try {
      await deleteUserUuids(userId, localToken, remoteToken);
    } catch (error) {
      console.log('خطأ في حذف user_uuids:', error);
    }
    return;
  } else if (successCount === 1) {
    throw new Error('تم الحذف من خادم واحد فقط. يجب النجاح في كلا الخادمين.');
  } else {
    throw new Error('فشل في حذف المستخدم من جميع الخوادم');
  }
};
