import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ManageDataClientPage } from './ManageDataClientPage';

export default function ManageDataPage() {
  return (
    <AppLayout>
      <PageHeader title="إدارة البيانات" description="إضافة وإدارة الجامعات والتخصصات." />
      <ManageDataClientPage />
    </AppLayout>
  );
}