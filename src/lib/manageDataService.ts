import { EXTERNAL_LINKS } from './endpoints';

interface UniversityData {
  id: number;
  name: string;
}

interface SpecializationData {
  id: number;
  name: string;
}

// Get tokens from localStorage
const getLocalToken = () => typeof window !== 'undefined' ? localStorage.getItem('localToken') : null;
const getRemoteToken = () => typeof window !== 'undefined' ? localStorage.getItem('remoteToken') : null;

// API helper function
async function fetchApi<T>(endpoint: string, options: RequestInit = {}, useLocal = false): Promise<T> {
  const baseUrl = useLocal ? EXTERNAL_LINKS.API_BASE_URL_LOCAL : EXTERNAL_LINKS.API_BASE_URL_PROD;
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
  
  const token = useLocal ? getLocalToken() : getRemoteToken();
  const defaultOptions: RequestInit = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

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

// Check if university ID exists in both servers
async function checkUniversityIdExists(id: number): Promise<string | null> {
  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  for (const server of servers) {
    try {
      const result = await fetchApi<any[]>(`/universities/search?id=${id}`, {}, server.useLocal);
      if (result && result.length > 0) {
        return server.name;
      }
    } catch (error) {
      // Ignore network errors, continue checking
    }
  }
  return null;
}

// Check if specialization ID exists in both servers
async function checkSpecializationIdExists(id: number): Promise<string | null> {
  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  for (const server of servers) {
    try {
      const result = await fetchApi<any[]>(`/specializations/search?id=${id}`, {}, server.useLocal);
      if (result && result.length > 0) {
        return server.name;
      }
    } catch (error) {
      // Ignore network errors, continue checking
    }
  }
  return null;
}

// Add university to both servers
export async function addUniversityToBothServers(data: UniversityData): Promise<void> {
  // First check if ID exists
  const existsIn = await checkUniversityIdExists(data.id);
  if (existsIn) {
    throw new Error(`المعرف موجود بالفعل في ${existsIn}`);
  }

  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  const results = await Promise.allSettled(
    servers.map(server => 
      fetchApi('/universities', {
        method: 'POST',
        body: JSON.stringify(data),
      }, server.useLocal)
    )
  );

  // Check if any failed
  const failures = results
    .map((result, index) => ({ result, server: servers[index] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ server }) => server.name);

  if (failures.length > 0) {
    throw new Error(`فشل الإضافة في: ${failures.join(', ')}`);
  }
}

// Add specialization to both servers
export async function addSpecializationToBothServers(data: SpecializationData): Promise<void> {
  // First check if ID exists
  const existsIn = await checkSpecializationIdExists(data.id);
  if (existsIn) {
    throw new Error(`المعرف موجود بالفعل في ${existsIn}`);
  }

  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  const results = await Promise.allSettled(
    servers.map(server => 
      fetchApi('/specializations', {
        method: 'POST',
        body: JSON.stringify(data),
      }, server.useLocal)
    )
  );

  // Check if any failed
  const failures = results
    .map((result, index) => ({ result, server: servers[index] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ server }) => server.name);

  if (failures.length > 0) {
    throw new Error(`فشل الإضافة في: ${failures.join(', ')}`);
  }
}