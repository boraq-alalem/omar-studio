"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, GraduationCap, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UniversityForm } from '@/components/manage-data/UniversityForm';
import { SpecializationForm } from '@/components/manage-data/SpecializationForm';

export function ManageDataClientPage() {
  const { isAuthenticated, isLoading, apiUser } = useAuth();
  const router = useRouter();
  const [isUniversityFormOpen, setIsUniversityFormOpen] = useState(false);
  const [isSpecializationFormOpen, setIsSpecializationFormOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  const canManageData = apiUser?.permissions.includes('إضافة الجامعات والتعديل عليها');

  if (!canManageData && !isLoading) {
    return (
      <div className="text-center py-10 text-destructive">
        <Building2 size={48} className="mx-auto mb-2" />
        <p>ليس لديك الصلاحية لعرض هذه الصفحة.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="universities" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="universities" className="text-base py-3">
            <Building2 className="ml-2 h-5 w-5" />
            إدارة الجامعات
          </TabsTrigger>
          <TabsTrigger value="specializations" className="text-base py-3">
            <GraduationCap className="ml-2 h-5 w-5" />
            إدارة التخصصات
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="universities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                إدارة الجامعات
              </CardTitle>
              <Dialog open={isUniversityFormOpen} onOpenChange={setIsUniversityFormOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة جامعة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة جامعة جديدة</DialogTitle>
                  </DialogHeader>
                  <UniversityForm
                    onSuccess={() => setIsUniversityFormOpen(false)}
                    onCancel={() => setIsUniversityFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                يمكنك إضافة جامعات جديدة للنظام. سيتم التحقق من عدم وجود المعرف مسبقاً.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specializations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                إدارة التخصصات
              </CardTitle>
              <Dialog open={isSpecializationFormOpen} onOpenChange={setIsSpecializationFormOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة تخصص جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة تخصص جديد</DialogTitle>
                  </DialogHeader>
                  <SpecializationForm
                    onSuccess={() => setIsSpecializationFormOpen(false)}
                    onCancel={() => setIsSpecializationFormOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                يمكنك إضافة تخصصات جديدة للنظام. سيتم التحقق من عدم وجود المعرف مسبقاً.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}