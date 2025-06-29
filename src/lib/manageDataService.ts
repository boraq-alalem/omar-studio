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

// Check if university ID exists in both servers - returns array of servers where it exists
async function checkUniversityIdExists(id: number): Promise<string[]> {
  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  const existsIn = [];
  for (const server of servers) {
    try {
      const result = await fetchApi<any[]>(`/universities/search?id=${id}`, {}, server.useLocal);
      if (result && result.length > 0) {
        existsIn.push(server.name);
      }
    } catch (error) {
      // Ignore network errors, continue checking
    }
  }
  return existsIn;
}

// Check if university name exists in both servers - returns array of servers where it exists
async function checkUniversityNameExists(name: string): Promise<string[]> {
  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  const existsIn = [];
  for (const server of servers) {
    try {
      const result = await fetchApi<any[]>(`/universities/search?name=${encodeURIComponent(name)}`, {}, server.useLocal);
      if (result && result.length > 0) {
        existsIn.push(server.name);
      }
    } catch (error) {
      // Ignore network errors, continue checking
    }
  }
  return existsIn;
}

// Check if specialization ID exists in both servers - returns array of servers where it exists
async function checkSpecializationIdExists(id: number): Promise<string[]> {
  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  const existsIn = [];
  for (const server of servers) {
    try {
      const result = await fetchApi<any[]>(`/specializations/search?id=${id}`, {}, server.useLocal);
      if (result && result.length > 0) {
        existsIn.push(server.name);
      }
    } catch (error) {
      // Ignore network errors, continue checking
    }
  }
  return existsIn;
}

// Check if specialization name exists in both servers - returns array of servers where it exists
async function checkSpecializationNameExists(name: string): Promise<string[]> {
  const servers = [
    { name: 'الخادم المحلي', useLocal: true },
    { name: 'الاستضافة', useLocal: false }
  ];

  const existsIn = [];
  for (const server of servers) {
    try {
      const result = await fetchApi<any[]>(`/specializations/search?name=${encodeURIComponent(name)}`, {}, server.useLocal);
      if (result && result.length > 0) {
        existsIn.push(server.name);
      }
    } catch (error) {
      // Ignore network errors, continue checking
    }
  }
  return existsIn;
}

// Add university to both servers
export async function addUniversityToBothServers(data: UniversityData): Promise<void> {
  console.log('🔍 بدء التحقق من الجامعة:', data);
  
  // Check all 4 conditions before proceeding
  const [idExistsIn, nameExistsIn] = await Promise.all([
    checkUniversityIdExists(data.id),
    checkUniversityNameExists(data.name)
  ]);
  
  console.log('📊 نتائج التحقق:');
  console.log('- المعرف موجود في:', idExistsIn);
  console.log('- الاسم موجود في:', nameExistsIn);
  
  // If ANY check fails, stop completely - no additions to any server
  if (idExistsIn.length > 0) {
    console.log('❌ توقف: المعرف موجود');
    throw new Error(`المعرف موجود بالفعل في ${idExistsIn[0]}`);
  }
  
  if (nameExistsIn.length > 0) {
    console.log('❌ توقف: الاسم موجود');
    throw new Error(`الاسم موجود بالفعل في ${nameExistsIn[0]}`);
  }
  
  console.log('✅ التحقق مكتمل - بدء الإضافة');

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

// Get highest ID from both servers
async function getHighestId(endpoint: string): Promise<number> {
  const servers = [
    { useLocal: true },
    { useLocal: false }
  ];

  let highestId = 0;
  for (const server of servers) {
    try {
      const result = await fetchApi<any[]>(endpoint, {}, server.useLocal);
      if (result && Array.isArray(result) && result.length > 0) {
        const maxId = Math.max(...result.map(item => item.id || 0));
        if (maxId > highestId) {
          highestId = maxId;
        }
      }
    } catch (error) {
      // Ignore network errors, continue checking
    }
  }
  return highestId;
}

// Get highest university ID
export async function getHighestUniversityId(): Promise<number> {
  return getHighestId('/universities');
}

// Get highest specialization ID
export async function getHighestSpecializationId(): Promise<number> {
  return getHighestId('/specializations');
}

// Add specialization to both servers
export async function addSpecializationToBothServers(data: SpecializationData): Promise<void> {
  console.log('🔍 بدء التحقق من التخصص:', data);
  
  // Check all 4 conditions before proceeding
  const [idExistsIn, nameExistsIn] = await Promise.all([
    checkSpecializationIdExists(data.id),
    checkSpecializationNameExists(data.name)
  ]);
  
  console.log('📊 نتائج التحقق:');
  console.log('- المعرف موجود في:', idExistsIn);
  console.log('- الاسم موجود في:', nameExistsIn);
  
  // If ANY check fails, stop completely - no additions to any server
  if (idExistsIn.length > 0) {
    console.log('❌ توقف: المعرف موجود');
    throw new Error(`المعرف موجود بالفعل في ${idExistsIn[0]}`);
  }
  
  if (nameExistsIn.length > 0) {
    console.log('❌ توقف: الاسم موجود');
    throw new Error(`الاسم موجود بالفعل في ${nameExistsIn[0]}`);
  }
  
  console.log('✅ التحقق مكتمل - بدء الإضافة');

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