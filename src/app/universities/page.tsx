
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { UniversitiesClientPage } from './UniversitiesClientPage';
import { getUniversitiesWithSpecializationsAdmin, getUniversities } from '@/lib/api';
import type { UniversityWithSpecializationsAdmin, University } from '@/types/api';

export default async function UniversitiesPage() {
  let allUniversities: University[] = [];
  let universitiesWithSpecs: UniversityWithSpecializationsAdmin[] = [];
  try {
    allUniversities = await getUniversities();
    universitiesWithSpecs = await getUniversitiesWithSpecializationsAdmin();
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
