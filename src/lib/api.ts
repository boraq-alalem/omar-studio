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
import { EXTERNAL_LINKS } from './endpoints';
import { useServerError } from '@/contexts/ServerErrorContext';
import { toast } from '@/hooks/use-toast';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${EXTERNAL_LINKS.API_BASE_URL_PROD}${endpoint}`;
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
  const { setError } = require('@/contexts/ServerErrorContext');
  const urls = [
    EXTERNAL_LINKS.API_BASE_URL_LOCAL,
    EXTERNAL_LINKS.API_BASE_URL_PROD
  ];
  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
    },
  };
  const fetches = urls.map(base => fetch(`${base.replace(/\/$/, '')}${endpoint}`, { ...defaultOptions, ...options }));
  const results = await Promise.allSettled(fetches);
  let allFailed = true;
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.ok) {
      allFailed = false;
      if (result.value.status === 204) return undefined as T;
      return result.value.json();
    }
  }
  if (allFailed) {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('server-error', { detail: 'فشل بالاتصال بالخادم المحلي أو الاستضافة' }));
      }, 0);
    }
    throw new Error('Both API requests failed');
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('server-error', (e: any) => {
    const { setError } = require('@/contexts/ServerErrorContext');
    setError(e.detail || 'فشل بالاتصال بالخادم المحلي');
  });
}

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
  // Assuming the API expects specialization_name for new, or specialization_id for existing.
  // The API doc is vague; let's assume it's { specialization_name: "New Spec" }
  const formData = new FormData();
  if ('specialization_name' in data) {
    formData.append('specialization_name', data.specialization_name);
  } else {
    formData.append('specialization_id', data.specialization_id.toString());
  }
  // The API spec body for 4.4 is "غير محدد". Sending as FormData for now.
  return fetchApiBoth<AddSpecializationToUniversityResponse>(`/universities/${universityId}/add-specialization`, { method: 'POST', body: formData });
};


// 5. Archive
export const getArchivedTheses = () => fetchApiBoth<ArchivedThesis[]>('/archived-theses');
export const restoreArchivedThesis = (id: number) => fetchApiBoth<RestoreArchivedThesisResponse>(`/archived-theses/${id}/restore`, { method: 'POST' });
// Updated as per user request
export const permanentlyDeleteThesis = (id: number) => fetchApiBoth<DeleteThesisResponse>(`/archived-theses/${id}`, { method: 'DELETE' });

// 6. Reserved Titles
export const getLatestReservedTitles = () => fetchApiBoth<ReservedThesisTitle[]>('/reserved-thesis-titles-latest');
export const getLatestReservedTitlesGuests = () => fetchApiBoth<ReservedThesisTitleGuest[]>('/reserved-thesis-titles-latest-guests');

export const addReservedTitle = (data: Omit<ReservedThesisTitle, 'id'>) => {
  // API doc says params, but for POST this should be body. Assuming URL encoded form data or JSON.
  // For simplicity, let's use URLSearchParams which results in x-www-form-urlencoded
  const body = new URLSearchParams(data as any);
  return fetchApiBoth<AddReservedTitleResponse>('/reserved-thesis-titles', {
    method: 'POST',
    body: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const updateReservedTitle = (id: number, data: Omit<ReservedThesisTitle, 'id'>) => {
  // API doc says params, but for PUT this should be body.
  const body = new URLSearchParams(data as any);
  return fetchApiBoth<UpdateReservedTitleResponse>(`/reserved-thesis-titles/${id}`, {
    method: 'PUT',
    body: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const deleteReservedTitle = (id: number) => fetchApiBoth<DeleteReservedTitleResponse>(`/reserved-thesis-titles/${id}`, { method: 'DELETE' });
export const searchReservedTitles = (query: string) => fetchApiBoth<ReservedThesisTitle[]>(`/reserved-thesis-titles-search?q=${encodeURIComponent(query)}`);
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
