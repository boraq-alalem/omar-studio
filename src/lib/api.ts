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
import { saveUuidMapping } from './uuidMap';

const API_BASE_URL = 'https://alalem.c-library.org/api';
const INTERNAL_API_BASE_URL = 'http://127.0.0.1:8000/api';

async function checkReachable(url: string): Promise<boolean> {
  try {
    // استخدم endpoint ثابت للفحص
    const res = await fetch(url + '/stats', { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const internalUrl = `${INTERNAL_API_BASE_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
      // 'Content-Type': 'application/json', // Not for FormData
      // Add Authorization header if needed later
    },
  };

  // تحقق من الوصول للرابطين أولاً عبر /stats
  const [mainOk, internalOk] = await Promise.all([
    checkReachable(API_BASE_URL),
    checkReachable(INTERNAL_API_BASE_URL)
  ]);
  if (!mainOk && !internalOk) {
    throw new Error('لا يمكن الوصول إلى الموقع الرئيسي ولا الخادم المحلي');
  } else if (!mainOk) {
    throw new Error('لا يمكن الوصول إلى الموقع الرئيسي');
  } else if (!internalOk) {
    throw new Error('لا يمكن الوصول إلى الخادم المحلي');
  }

  // أرسل الطلبين معًا وانتظر النتيجة من كليهما
  let errors: string[] = [];
  const requests = [
    fetch(url, { ...defaultOptions, ...options }).then(async (response) => {
      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        throw new Error('API الرئيسي: ' + (errorData.message || response.statusText));
      }
      // For 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }
      return response.json();
    }).catch(e => { errors.push(e.message); return undefined; }),
    fetch(internalUrl, { ...defaultOptions, ...options }).then(async (response) => {
      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        throw new Error('الخادم المحلي: ' + (errorData.message || response.statusText));
      }
      return null; // لا نحتاج نتيجة الخادم المحلي
    }).catch(e => { errors.push(e.message); return undefined; })
  ];

  const [mainResult, _] = await Promise.all(requests);

  if (errors.length > 0) {
    throw new Error('فشل الإرسال في: ' + errors.join(' | '));
  }

  return mainResult as T;
}

// دالة fetchApiLocal لجلب البيانات من القاعدة المحلية فقط
async function fetchApiLocal<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const internalUrl = `${INTERNAL_API_BASE_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
    },
  };
  const response = await fetch(internalUrl, { ...defaultOptions, ...options });
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: `HTTP error! status: ${response.status}` };
    }
    throw new Error('الخادم المحلي: ' + (errorData.message || response.statusText));
  }
  return response.json();
}

// 1. General Statistics
export const getGeneralStats = () => fetchApi<GeneralStats>('/stats');

// 2. Theses
export const getLatestTheses = () => fetchApiLocal<Thesis[]>('/theses/latest');

export const searchTheses = (params: { title: string; author?: string; degree_id?: string; specialization_id?: string; university_id?: string; year?: string }) => {
  const queryParams = new URLSearchParams(params as any).toString();
  return fetchApiLocal<Thesis[]>(`/theses/search?${queryParams}`);
};

export const searchThesesGuests = (params: { title: string; author?: string; degree_id?: string; specialization_id?: string; university_id?: string; year?: string }) => {
  const queryParams = new URLSearchParams(params as any).toString();
  return fetchApiLocal<ThesisGuest[]>(`/theses/search-guests?${queryParams}`);
};

export const addThesis = (formData: FormData) => fetchApi<AddThesisResponse>('/theses/', { method: 'POST', body: formData });

export const updateThesis = (id: number, formData: FormData) => {
  formData.append('_method', 'PUT');
  return fetchApi<UpdateThesisResponse>(`/theses/${id}`, { method: 'POST', body: formData });
};

export const archiveThesis = (id: number) => fetchApi<ArchiveThesisResponse>(`/theses/${id}`, { method: 'DELETE' });

export const getThesisYears = () => fetchApi<ThesisYear[]>('/theses/years');

// 3. Filters (Dropdowns)
export const getSpecializations = () => fetchApi<Specialization[]>('/specializations');
export const getUniversities = () => fetchApi<University[]>('/universities');
export const getDegrees = () => fetchApi<Degree[]>('/degrees');

// 4. Universities and Specializations
export const getUniversitiesWithSpecializationsAdmin = () => fetchApi<UniversityWithSpecializationsAdmin[]>('/universities-with-specializations');
export const getUniversitiesWithSpecializationsGuests = () => fetchApi<UniversityWithSpecializationsGuest[]>('/universities-with-specializations-guests');
export const searchUniversities = (name: string) => fetchApi<University[]>(`/universities/search?name=${encodeURIComponent(name)}`);

export const addSpecializationToUniversity = (universityId: number, data: { specialization_name: string } | { specialization_id: number }) => {
  // Assuming the API expects specialization_name for new, or specialization_id for existing.
  // The API doc is vague; let's assume it's { specialization_name: "New Spec" }
  const formData = new FormData();
  if ('specialization_name' in data) {
    formData.append('specialization_name', data.specialization_name);
  } else {
    formData.append('specialization_id', data.specialization_id.toString());
  }
  // The API spec body for 4.4 is "غير محدد". Sending as FormData for now.
  return fetchApi<AddSpecializationToUniversityResponse>(`/universities/${universityId}/add-specialization`, { method: 'POST', body: formData });
};


// 5. Archive
export const getArchivedTheses = () => fetchApi<ArchivedThesis[]>('/archived-theses');
export const restoreArchivedThesis = (id: number) => fetchApi<RestoreArchivedThesisResponse>(`/archived-theses/${id}/restore`, { method: 'POST' });
// Updated as per user request
export const permanentlyDeleteThesis = (id: number) => fetchApi<DeleteThesisResponse>(`/archived-theses/${id}`, { method: 'DELETE' });

// 6. Reserved Titles
export const getLatestReservedTitles = () => fetchApi<ReservedThesisTitle[]>('/reserved-thesis-titles-latest');
export const getLatestReservedTitlesGuests = () => fetchApi<ReservedThesisTitleGuest[]>('/reserved-thesis-titles-latest-guests');

export const addReservedTitle = (data: Omit<ReservedThesisTitle, 'id'>) => {
  // API doc says params, but for POST this should be body. Assuming URL encoded form data or JSON.
  // For simplicity, let's use URLSearchParams which results in x-www-form-urlencoded
  const body = new URLSearchParams(data as any);
  return fetchApi<AddReservedTitleResponse>('/reserved-thesis-titles', {
    method: 'POST',
    body: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const updateReservedTitle = (id: number, data: Omit<ReservedThesisTitle, 'id'>) => {
  // API doc says params, but for PUT this should be body.
  const body = new URLSearchParams(data as any);
  return fetchApi<UpdateReservedTitleResponse>(`/reserved-thesis-titles/${id}`, {
    method: 'PUT',
    body: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const deleteReservedTitle = (id: number) => fetchApi<DeleteReservedTitleResponse>(`/reserved-thesis-titles/${id}`, { method: 'DELETE' });
export const searchReservedTitles = (query: string) => fetchApi<ReservedThesisTitle[]>(`/reserved-thesis-titles-search?q=${encodeURIComponent(query)}`);
export const searchReservedTitlesGuests = (query: string) => fetchApi<ReservedThesisTitleGuest[]>(`/reserved-thesis-titles-search-guests?q=${encodeURIComponent(query)}`);

async function addThesisBoth(data: any): Promise<AddThesisResponse> {
  // أضف أولاً على المحلي
  const formDataLocal = new FormData();
  const formDataRemote = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'pdf' && value instanceof File) {
      formDataLocal.append('pdf', value, value.name); // الملف الأصلي للمحلي
    } else if (key === 'pdfRemote' && value instanceof File) {
      formDataRemote.append('pdf', value, value.name); // أول صفحة فقط للاستضافة
    } else if (key !== 'pdf' && key !== 'pdfRemote' && typeof value === 'string') {
      formDataLocal.append(key, value);
      formDataRemote.append(key, value);
    }
  });

  // أضف أولاً على المحلي
  const localRes = await fetch(`${INTERNAL_API_BASE_URL}/theses/`, { method: 'POST', body: formDataLocal });
  if (!localRes.ok) {
    let errorData;
    try { errorData = await localRes.json(); } catch { errorData = { message: `HTTP error! status: ${localRes.status}` }; }
    throw new Error('الخادم المحلي: ' + (errorData.message || localRes.statusText));
  }
  const localData = await localRes.json();
  const id_local = localData.thesis?.id;

  // ثم أضف على الاستضافة
  const mainRes = await fetch(`${API_BASE_URL}/theses/`, { method: 'POST', body: formDataRemote });
  if (!mainRes.ok) {
    let errorData;
    try { errorData = await mainRes.json(); } catch { errorData = { message: `HTTP error! status: ${mainRes.status}` }; }
    throw new Error('الاستضافة: ' + (errorData.message || mainRes.statusText));
  }
  const mainData = await mainRes.json();
  const id_remote = mainData.thesis?.id;

  // تحقق من وجود المعرفات قبل الربط
  if (!id_local || !id_remote) {
    console.error('تعذر استخلاص أحد المعرفين: id_local أو id_remote. لن يتم الربط في uuids.');
    return mainData;
  }

  // حفظ الربط في كلا الموقعين
  try {
    const resLocal = await fetch(`${INTERNAL_API_BASE_URL}/uuids?id_remote=${id_remote}&id_local=${id_local}`, { method: 'POST', body: null });
    const resRemote = await fetch(`${API_BASE_URL}/uuids?id_remote=${id_remote}&id_local=${id_local}`, { method: 'POST', body: null });
  } catch (e) {
    console.error('خطأ في حفظ الربط في جدول uuid:', e);
  }

  return mainData;
}

export { fetchApi, addThesisBoth };

export async function updateThesisBoth(id_local: number, data: any) {
  // 1. جلب id_remote من جدول uuids المحلي
  const uuidRes = await fetch(`${INTERNAL_API_BASE_URL}/uuids/find?local_id=${id_local}`);
  const uuidData = await uuidRes.json();
  const id_remote = uuidData[0]?.id_remote;
  if (!id_remote) {
    throw new Error('تعذر العثور على id_remote للرسالة');
  }

  // 2. تجهيز البيانات (عدم إرسال pdf إلا إذا اختاره المستخدم)
  const formDataLocal = new FormData();
  const formDataRemote = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'pdf' && value instanceof File) {
      formDataLocal.append('pdf', value, value.name); // الملف الأصلي للمحلي
    } else if (key === 'pdfRemote' && value instanceof File) {
      formDataRemote.append('pdf', value, value.name); // أول صفحة فقط للاستضافة
    } else if (key !== 'pdf' && key !== 'pdfRemote' && typeof value === 'string') {
      formDataLocal.append(key, value);
      formDataRemote.append(key, value);
    }
  });
  formDataLocal.append('_method', 'PUT');
  formDataRemote.append('_method', 'PUT');

  // 3. إرسال التعديل للمحلي
  const localRes = await fetch(`${INTERNAL_API_BASE_URL}/theses/${id_local}`, {
    method: 'POST',
    body: formDataLocal,
  });
  if (!localRes.ok) throw new Error('فشل تعديل الرسالة في المحلي');

  // 4. إرسال التعديل للاستضافة
  const remoteRes = await fetch(`${API_BASE_URL}/theses/${id_remote}`, {
    method: 'POST',
    body: formDataRemote,
  });
  if (!remoteRes.ok) throw new Error('فشل تعديل الرسالة في الاستضافة');

  return { local: await localRes.json(), remote: await remoteRes.json() };
}
