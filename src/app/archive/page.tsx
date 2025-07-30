
export const dynamic = 'force-dynamic';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ArchiveClientPage } from './ArchiveClientPage';
import { getArchivedTheses } from '@/lib/api';

export default async function ArchivePage() {
  const initialArchivedTheses = await getArchivedTheses().catch(() => []);

  return (
    <AppLayout>
      <PageHeader title="إدارة الأرشيف" description="عرض، استعادة، وحذف الرسائل المؤرشفة نهائياً." />
      <ArchiveClientPage initialArchivedTheses={initialArchivedTheses} />
    </AppLayout>
  );
}
