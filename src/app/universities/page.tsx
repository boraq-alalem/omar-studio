export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { UniversitiesClientPage } from './UniversitiesClientPage';
import { getUniversitiesWithSpecializationsAdmin, getUniversities } from '@/lib/api';
import type { UniversityWithSpecializationsAdmin, University } from '@/types/api';

export default async function UniversitiesPage() {
  let allUniversities: University[] = [];
  let universitiesWithSpecs: UniversityWithSpecializationsAdmin[] = [];
  try {
    // getUniversities returns { remote: [...], local: [...] }
    const universitiesResult = await getUniversities();
    // If fetchApiBoth returns an object with remote/local, filter intersection
    let localUnis: University[] = [];
    let remoteUnis: University[] = [];
    if (universitiesResult && typeof universitiesResult === 'object' && 'local' in universitiesResult && 'remote' in universitiesResult) {
      localUnis = Array.isArray(universitiesResult.local) ? universitiesResult.local : [];
      remoteUnis = Array.isArray(universitiesResult.remote) ? universitiesResult.remote : [];
      // Only show universities present in both
      allUniversities = localUnis.filter(lu => remoteUnis.some(ru => ru.id === lu.id));
    } else if (Array.isArray(universitiesResult)) {
      // fallback: show all
      allUniversities = universitiesResult;
    }
    // For specs, use only those matching filtered universities
    const specsResult = await getUniversitiesWithSpecializationsAdmin();
    if (specsResult && typeof specsResult === 'object' && 'local' in specsResult && 'remote' in specsResult) {
      const localSpecs = Array.isArray(specsResult.local) ? specsResult.local : [];
      const remoteSpecs = Array.isArray(specsResult.remote) ? specsResult.remote : [];
      // Only specs for universities present in both
      universitiesWithSpecs = localSpecs.filter(ls => allUniversities.some(u => u.id === ls.id));
    } else if (Array.isArray(specsResult)) {
      universitiesWithSpecs = specsResult.filter(s => allUniversities.some(u => u.id === s.id));
    }
  } catch (error) {
    console.error("Failed to fetch universities data on server:", error);
    // fallback to empty arrays
  }

  return (
    <AppLayout>
      <PageHeader title="إدارة الجامعات والتخصصات" description="عرض الجامعات وإضافة تخصصات لها." />
      <UniversitiesClientPage
        allUniversities={allUniversities}
        universitiesWithSpecs={universitiesWithSpecs}
      />
    </AppLayout>
  );
}
