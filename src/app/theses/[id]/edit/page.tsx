
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EditThesisClientPage } from '../EditThesisClientPage';
import { getDegrees, getLatestTheses, searchTheses } from '@/lib/api';
import type { Thesis } from '@/types/api';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default async function EditThesisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const thesisId = parseInt(resolvedParams.id, 10);

  let thesisToEdit: Thesis | undefined = undefined;
  try {
    const allThesesResult = await getLatestTheses();
    const allThesesArr = Array.isArray(allThesesResult)
      ? allThesesResult
      : Array.isArray(allThesesResult?.data)
        ? allThesesResult.data
        : [];
    thesisToEdit = allThesesArr.find((t: Thesis) => t.id === thesisId);
    if (!thesisToEdit) {
      const searchResultsResult = await searchTheses({ title: resolvedParams.id });
      const searchResultsArr = Array.isArray(searchResultsResult)
        ? searchResultsResult
        : Array.isArray(searchResultsResult?.data)
          ? searchResultsResult.data
          : [];
      thesisToEdit = searchResultsArr.find((t: Thesis) => t.id === thesisId);
    }
  } catch (e) {
    console.error("Failed to fetch thesis data for editing:", e);
  }

  const degrees = await getDegrees().catch(() => []);

  return (
    <AppLayout>
      <PageHeader title={thesisToEdit ? `تعديل الرسالة: ${thesisToEdit.title}` : "تعديل الرسالة"}>
        <Button variant="outline" asChild>
            <Link href="/theses">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى قائمة الرسائل
            </Link>
        </Button>
      </PageHeader>
      <EditThesisClientPage
        thesisId={thesisId}
        initialThesisData={thesisToEdit} 
        degrees={degrees}
      />
    </AppLayout>
  );
}
