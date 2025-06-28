"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import type { GeneralStats } from '@/types/api';
import { BookOpen, Users, Building, Library, GraduationCap, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardClientPageProps {
  initialStats: GeneralStats | null;
  initialError: string | null;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-md ${className}`} />
);

export function DashboardClientPage({ initialStats, initialError }: DashboardClientPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect to login
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="لوحة التحكم الرئيسية" description="نظرة عامة على إحصائيات النظام." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="لوحة التحكم الرئيسية" description="نظرة عامة على إحصائيات النظام." />
      {initialError && <p className="text-destructive">{initialError}</p>}
      {initialStats && !initialError && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="إجمالي الرسائل"
            value={initialStats.total_theses}
            icon={BookOpen}
            description="العدد الكلي للرسائل المسجلة"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          />
          <StatCard
            title="رسائل الماجستير"
            value={initialStats.master_theses}
            icon={GraduationCap}
            description="عدد رسائل الماجستير"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          />
          <StatCard
            title="رسائل الدكتوراه"
            value={initialStats.phd_theses}
            icon={FileText}
            description="عدد رسائل الدكتوراه"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          />
          <StatCard
            title="إجمالي المؤلفين"
            value={initialStats.total_authors}
            icon={Users}
            description="العدد الكلي للمؤلفين"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          />
          <StatCard
            title="إجمالي الجامعات"
            value={initialStats.total_universities}
            icon={Building}
            description="العدد الكلي للجامعات المسجلة"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          />
          <StatCard
            title="إجمالي التخصصات"
            value={initialStats.total_specializations}
            icon={Library}
            description="العدد الكلي للتخصصات المتاحة"
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          />
        </div>
      )}
      {!initialStats && !initialError && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}