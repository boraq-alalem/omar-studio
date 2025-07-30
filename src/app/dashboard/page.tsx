
export const dynamic = 'force-dynamic';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { getGeneralStats } from '@/lib/api';
import type { GeneralStats } from '@/types/api';
import { BookOpen, Users, Building, Library, GraduationCap, FileText } from 'lucide-react';
import { DashboardClientPage } from './DashboardClientPage';

export default async function DashboardPage() {
  let stats: GeneralStats | null = null;
  let error: string | null = null;

  try {
    stats = await getGeneralStats();
  } catch (e) {
    console.error("Failed to fetch stats:", e);
    error = "فشل تحميل الإحصائيات. يرجى المحاولة مرة أخرى.";
  }

  return (
    <AppLayout>
      <DashboardClientPage initialStats={stats} initialError={error} />
    </AppLayout>
  );
}

// Need to add Skeleton component if not already present in ui
// For now, I'll add it to make sure it compiles if stats are loading
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Already imported

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-md ${className}`} />
);
