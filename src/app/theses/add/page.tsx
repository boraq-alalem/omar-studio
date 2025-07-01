
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ThesisForm } from '@/components/theses/ThesisForm';
import { getDegrees } from '@/lib/api';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AddThesisPage() {
  const degrees = await getDegrees().catch(() => []);

  return (
    <AppLayout>
      <PageHeader title="إضافة رسالة جديدة">
         <Button variant="outline" asChild>
            <Link href="/theses">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى قائمة الرسائل
            </Link>
        </Button>
      </PageHeader>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ThesisForm
          degrees={degrees}
        />
      </div>
    </AppLayout>
  );
}
