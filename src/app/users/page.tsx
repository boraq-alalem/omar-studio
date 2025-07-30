export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { UsersClientPage } from './UsersClientPage';
// import { getAllUsers } from '@/lib/authService'; // Data fetching will be client-side for this mock

export default async function UsersPage() {
  // For this mock, we'll fetch users on the client side in UsersClientPage
  // If this were a real app with SSR, you might fetch initial users here.
  // const initialUsers = await getAllUsers().catch(() => []);

  return (
    <AppLayout>
      <PageHeader title="إدارة المستخدمين" description="عرض، إضافة، تعديل، وحذف المستخدمين." />
      <UsersClientPage />
    </AppLayout>
  );
}
