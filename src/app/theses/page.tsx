
// تم حذف التكرار
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { ThesesClientPage } from './ThesesClientPage'; // Client component for interactivity
import { getLatestTheses, getUniversities, getSpecializations, getDegrees, getThesisYears } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ThesesPage() {
  // Fetch initial data for the client component
  // This data can be passed as props or fetched client-side as well
  const thesesResponse = await getLatestTheses().catch(() => ({ data: [], pagination: { current_page: 1, last_page: 1, total: 0 } }));
  const initialTheses = thesesResponse.data || [];
  const universities = await getUniversities().catch(() => []);
  const specializations = await getSpecializations().catch(() => []);
  const degrees = await getDegrees().catch(() => []);
  const years = await getThesisYears().catch(() => []);

  return (
    <AppLayout>
      <PageHeader title="إدارة الرسائل" description="بحث، عرض، إضافة، وتعديل الرسائل الأكاديمية.">
        <Link href="/theses/add" passHref>
          <Button>
            <PlusCircle className="ml-2 h-5 w-5" />
            إضافة رسالة جديدة
          </Button>
        </Link>
      </PageHeader>
      <ThesesClientPage
        initialTheses={initialTheses}
        universities={universities}
        specializations={specializations}
        degrees={degrees}
        years={years}
      />
    </AppLayout>
  );
}
