"use client";

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArchiveRestore, Trash2, FileText, Download } from 'lucide-react';
import type { ArchivedThesis } from '@/types/api';
import { restoreArchivedThesisBoth, permanentlyDeleteThesisBoth, getArchivedTheses, getRemoteIdByLocalId } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ArchiveClientPageProps {
  initialArchivedTheses: ArchivedThesis[];
}

export function ArchiveClientPage({ initialArchivedTheses }: ArchiveClientPageProps) {
  const [archivedTheses, setArchivedTheses] = useState<ArchivedThesis[]>([]); // ابدأ ببيانات فارغة
  const [isLoading, setIsLoading] = useState(false); // For actions
  const [refreshing, setRefreshing] = useState(true); // ابدأ بتحميل البيانات
  const [remoteIds, setRemoteIds] = useState<{ [id_local: number]: string | null }>({});
  const { toast } = useToast();

  // جلب البيانات تلقائياً عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      setRefreshing(true);
      try {
        const data = await getArchivedTheses();
        setArchivedTheses(data);
      } catch (error) {
        toast({ title: 'خطأ في التحديث', description: 'تعذر تحديث بيانات الأرشيف.', variant: 'destructive' });
      } finally {
        setRefreshing(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // جلب id_remote لكل رسالة عند تحميل الرسائل
  useEffect(() => {
    async function fetchRemoteIds() {
      const ids: { [id_local: number]: string | null } = {};
      await Promise.all(
        archivedTheses.map(async (thesis) => {
          const remoteId = await getRemoteIdByLocalId(thesis.id);
          ids[thesis.id] = remoteId;
        })
      );
      setRemoteIds(ids);
    }
    if (archivedTheses.length > 0) {
      fetchRemoteIds();
    }
  }, [archivedTheses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getArchivedTheses();
      setArchivedTheses(data);
      toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الأرشيف.' });
    } catch (error) {
      toast({ title: 'خطأ في التحديث', description: 'تعذر تحديث بيانات الأرشيف.', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRestore = async (id: number) => {
    setIsLoading(true);
    try {
      const idRemote = remoteIds[id];
      console.log('Restoring - Local ID:', id, 'Remote ID:', idRemote);
      await restoreArchivedThesisBoth(id, idRemote);
      setArchivedTheses(archivedTheses.filter(thesis => thesis.id !== id));
      toast({ title: "نجاح", description: "تمت استعادة الرسالة بنجاح." });
    } catch (error) {
      console.error('Restore error:', error);
      toast({ title: "خطأ في الاستعادة", description: "لم نتمكن من استعادة الرسالة. حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePermanently = async (id: number) => {
    setIsLoading(true);
    try {
      const idRemote = remoteIds[id];
      console.log('Permanently deleting - Local ID:', id, 'Remote ID:', idRemote);
      await permanentlyDeleteThesisBoth(id, idRemote);
      setArchivedTheses(archivedTheses.filter(thesis => thesis.id !== id));
      toast({ title: "نجاح", description: "تم حذف الرسالة نهائياً." });
    } catch (error) {
      console.error('Permanent delete error:', error);
      toast({ title: "خطأ في الحذف", description: "لم نتمكن من حذف الرسالة نهائياً. حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (refreshing) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (archivedTheses.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <FileText size={48} className="mx-auto mb-2" />
        <p>الأرشيف فارغ حالياً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleRefresh} disabled={refreshing || isLoading} variant="outline">
          {refreshing ? 'جاري التحديث...' : 'تحديث'}
        </Button>
      </div>
      <Card className="shadow-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="border border-gray-200">محلي</TableHead>
            <TableHead className="border border-gray-200">خارجي</TableHead>
            <TableHead className="border border-gray-200" style={{ padding: 0, width: '1px' }}>
              <div style={{ borderLeft: '2px solid #e5e7eb', height: '100%', minHeight: '32px' }} />
            </TableHead>
            <TableHead className="border border-gray-200">العنوان</TableHead>
            <TableHead className="border border-gray-200">المؤلف</TableHead>
            <TableHead className="border border-gray-200">الجامعة</TableHead>
            <TableHead className="border border-gray-200">التخصص</TableHead>
            <TableHead className="border border-gray-200">الدرجة</TableHead>
            <TableHead className="border border-gray-200">السنة</TableHead>
            <TableHead className="border border-gray-200">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {archivedTheses.map((thesis) => (
            <TableRow key={thesis.id}>
              <TableCell className="border border-gray-200 font-mono text-xs text-muted-foreground">{thesis.id}</TableCell>
              <TableCell className="border border-gray-200 font-mono text-xs text-muted-foreground">{remoteIds[thesis.id] ?? <span className="text-gray-400">...</span>}</TableCell>
              <TableCell className="border border-gray-200" style={{ padding: 0, width: '1px' }}>
                <div style={{ borderLeft: '2px solid #e5e7eb', height: '100%', minHeight: '32px' }} />
              </TableCell>
              <TableCell className="border border-gray-200 font-medium">{thesis.title}</TableCell>
              <TableCell className="border border-gray-200">{thesis.author.name}</TableCell>
              <TableCell className="border border-gray-200">{thesis.university.name}</TableCell>
              <TableCell className="border border-gray-200">{thesis.specialization.name}</TableCell>
              <TableCell className="border border-gray-200">{thesis.degree.name}</TableCell>
              <TableCell className="border border-gray-200">{thesis.year}</TableCell>
              <TableCell className="border border-gray-200 space-x-1 whitespace-nowrap">
                 <Button variant="ghost" size="icon" asChild>
                    <a href={`${thesis.pdf_path}`} target="_blank" rel="noopener noreferrer" aria-label="Download PDF">
                      <Download className="h-4 w-4 text-blue-500" />
                    </a>
                  </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading} aria-label="Restore Thesis">
                      <ArchiveRestore className="h-4 w-4 text-green-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد من رغبتك في استعادة هذه الرسالة؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم نقل هذه الرسالة من الأرشيف إلى قائمة الرسائل النشطة.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRestore(thesis.id)} className="bg-green-500 hover:bg-green-600">
                        استعادة
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading} aria-label="Delete Thesis Permanently">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الرسالة بشكل دائم من النظام.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePermanently(thesis.id)} className="bg-destructive hover:bg-destructive/90">
                        حذف نهائي
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
    </div>
  );
}
