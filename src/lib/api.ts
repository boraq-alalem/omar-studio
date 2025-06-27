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

const API_BASE_URL = 'https://alalem.c-library.org/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
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

// 1. General Statistics
export const getGeneralStats = () => fetchApi<GeneralStats>('/stats');

// 2. Theses
export const getLatestTheses = () => fetchApi<Thesis[]>('/theses/latest');

export const searchTheses = (params: { title: string; author?: string; degree_id?: string; specialization_id?: string; university_id?: string; year?: string }) => {
  const queryParams = new URLSearchParams(params as any).toString();
  return fetchApi<Thesis[]>(`/theses/search?${queryParams}`);
};

export const searchThesesGuests = (params: { title: string; author?: string; degree_id?: string; specialization_id?: string; university_id?: string; year?: string }) => {
  const queryParams = new URLSearchParams(params as any).toString();
  return fetchApi<ThesisGuest[]>(`/theses/search-guests?${queryParams}`);
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
