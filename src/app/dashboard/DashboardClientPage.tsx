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

interface ServerStatus {
  local: boolean;
  remote: boolean;
  loading: boolean;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-md ${className}`} />
);

export function DashboardClientPage({ initialStats, initialError }: DashboardClientPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [serverStatus, setServerStatus] = React.useState<ServerStatus>({
    local: false,
    remote: false,
    loading: true
  });

  // فحص حالة الخادمين
  React.useEffect(() => {
    const checkServers = async () => {
      const results = await Promise.allSettled([
        fetch('http://192.168.1.16:8000/api/stats').then(res => res.ok),
        fetch('https://alalem.c-library.org/api/stats').then(res => res.ok)
      ]);
      
      setServerStatus({
        local: results[0].status === 'fulfilled' && results[0].value,
        remote: results[1].status === 'fulfilled' && results[1].value,
        loading: false
      });
    };
    
    checkServers();
    const interval = setInterval(checkServers, 30000); // فحص كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

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
      <div className="space-y-8">
        {/* Loading Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 sm:p-8 border border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
                <div className="w-6 h-6 bg-white/30 rounded"></div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-lg" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <Skeleton className="h-8 w-32 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-modern shadow-modern animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <Skeleton className="h-5 w-2/5 rounded-lg" />
                <div className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700">
                  <Skeleton className="h-5 w-5 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-1/3 rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-1 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 sm:p-8 border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                لوحة التحكم الرئيسية
              </h1>
              <p className="text-muted-foreground mt-1">نظرة عامة شاملة على إحصائيات النظام والبيانات</p>
            </div>
          </div>
          
          {/* Server Status */}
          <div className="flex flex-wrap gap-3 mt-6">
            {serverStatus.loading ? (
              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">جاري فحص الخوادم...</span>
              </div>
            ) : (
              <>
                {serverStatus.local && serverStatus.remote ? (
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">جميع الخوادم تعمل بشكل طبيعي</span>
                  </div>
                ) : serverStatus.local && !serverStatus.remote ? (
                  <>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">الخادم المحلي متصل</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">الاستضافة غير متصلة</span>
                    </div>
                  </>
                ) : !serverStatus.local && serverStatus.remote ? (
                  <>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">الخادم المحلي غير متصل</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">الاستضافة متصلة</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">جميع الخوادم غير متصلة</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-xl">
              <span className="text-sm text-muted-foreground">آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {initialError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-red-700 dark:text-red-300 font-medium">{initialError}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatCard
          title="إجمالي الرسائل"
          value="2,473"
          icon={BookOpen}
          description="العدد الكلي للرسائل المسجلة"
        />
        <StatCard
          title="رسائل الماجستير"
          value="1,856"
          icon={GraduationCap}
          description="عدد رسائل الماجستير"
        />
        <StatCard
          title="رسائل الدكتوراه"
          value="617"
          icon={FileText}
          description="عدد رسائل الدكتوراه"
        />
        <StatCard
          title="إجمالي المؤلفين"
          value="2,341"
          icon={Users}
          description="العدد الكلي للمؤلفين"
        />
        <StatCard
          title="إجمالي الجامعات"
          value="45"
          icon={Building}
          description="العدد الكلي للجامعات المسجلة"
        />
        <StatCard
          title="إجمالي التخصصات"
          value="128"
          icon={Library}
          description="العدد الكلي للتخصصات المتاحة"
        />
      </div>
      {/* Loading State */}
      {!initialStats && !initialError && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-modern shadow-modern animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <Skeleton className="h-5 w-2/5 rounded-lg" />
                <div className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700">
                  <Skeleton className="h-5 w-5 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-1/3 rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-1 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}