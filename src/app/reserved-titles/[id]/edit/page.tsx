
// Similar to EditThesisPage, this assumes we might not have a direct GET /reserved-titles/:id endpoint.
// Data might need to be passed or fetched client-side from a list.

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EditReservedTitleClientPage } from '../EditReservedTitleClientPage';
import { getLatestReservedTitles, searchReservedTitles } from '@/lib/api'; // Assuming search can find by ID or part of title
import type { ReservedThesisTitle } from '@/types/api';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function EditReservedTitlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const titleId = parseInt(resolvedParams.id, 10);
  let titleToEdit: ReservedThesisTitle | undefined = undefined;

  try {
    // Attempt to find the reserved title. This is inefficient.
    // A dedicated GET /reserved-titles/:id endpoint would be better.
    const allTitles = await getLatestReservedTitles(); 
    titleToEdit = allTitles.find((t: ReservedThesisTitle) => t.id === titleId);
     if (!titleToEdit) {
        const searchResults = await searchReservedTitles(resolvedParams.id); // Assuming search can find by ID/title part
        titleToEdit = searchResults.find((t: ReservedThesisTitle) => t.id === titleId);
    }
  } catch (e) {
    console.error("Failed to fetch reserved title data for editing:", e);
  }
  
  return (
    <AppLayout>
      <PageHeader title={titleToEdit ? `تعديل العنوان: ${titleToEdit.title}` : "تعديل عنوان محجوز"}>
        <Button variant="outline" asChild>
            <Link href="/reserved-titles">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى قائمة العناوين
            </Link>
        </Button>
      </PageHeader>
      <EditReservedTitleClientPage 
        titleId={titleId}
        initialTitleData={titleToEdit}
      />
    </AppLayout>
  );
}

