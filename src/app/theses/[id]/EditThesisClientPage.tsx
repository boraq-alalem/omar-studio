"use client";

import { useState, useEffect } from 'react';
import { ThesisForm } from '@/components/theses/ThesisForm';
import type { Thesis, Degree } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton'; 
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getRemoteIdByLocalId } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';


interface EditThesisClientPageProps {
  thesisId: number;
  initialThesisData?: Thesis; 
  degrees: Degree[];
}

export function EditThesisClientPage({
  thesisId,
  initialThesisData,
  degrees,
}: EditThesisClientPageProps) {
  const [thesis, setThesis] = useState<Thesis | undefined>(initialThesisData);
  const [isLoading, setIsLoading] = useState(!initialThesisData); 
  const [error, setError] = useState<string | null>(null);
  const [idRemote, setIdRemote] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialThesisData) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setError("تعذر تحميل بيانات الرسالة. لا يوجد API مباشر لجلب رسالة واحدة بالمعرف.");
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setThesis(initialThesisData); // Ensure thesis state is updated if initialThesisData is present
      setIsLoading(false); // Ensure loading is false if data is present
    }
  }, [thesisId, initialThesisData]);

  useEffect(() => {
    let id = thesis?.id;
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const nav = window.history.state && window.history.state.usr;
      if (nav && nav.id_remote) {
        setIdRemote(nav.id_remote);
        toast({
          title: 'معرف الاستضافة',
          description: `id_remote: ${nav.id_remote}`,
          variant: 'default',
        });
        return;
      }
    }
    // إذا لم يتم تمرير id_remote من state، جلبه من API
    if (id) {
      getRemoteIdByLocalId(id).then((remote) => {
        setIdRemote(remote);
        if (remote) {
          toast({
            title: 'معرف الاستضافة',
            description: `id_remote: ${remote}`,
            variant: 'default',
          });
        }
      });
    }
  }, [thesis]);

  // استخراج المعرفات من state إذا كانت متوفرة
  let idLocal: number | undefined = thesis?.id;
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const nav = window.history.state && window.history.state.usr;
    if (nav) {
      if (nav.id_local) idLocal = nav.id_local;
    }
  }

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-1/3 ml-auto" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card rounded-lg shadow-md">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">خطأ في تحميل البيانات</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">الرجاء التأكد من أن الرسالة موجودة أو أن الـ API يدعم جلب رسالة فردية.</p>
        </div>
    );
  }

  if (!thesis) {
     return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card rounded-lg shadow-md">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">الرسالة غير موجودة</h2>
            <p className="text-muted-foreground">لم نتمكن من العثور على الرسالة المطلوبة بالمعرف: {thesisId}.</p>
        </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        <span>المعرف المحلي: <b>{thesis?.id ?? '-'}</b></span>
        {' '}||{' '}
        <span>المعرف الخارجي: <b>{idRemote ?? '-'}</b></span>
      </div>
      <ThesisForm
        initialData={thesis}
        degrees={degrees}
      />
    </>
  );
}
