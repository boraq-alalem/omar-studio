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
      {/* Desktop Table */}
      <Card className="hidden md:block shadow-lg">
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {archivedTheses.map((thesis, index) => (
          <Card key={thesis.id} className="p-4 rounded-2xl border border-border/50 bg-card shadow-modern-lg" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-base leading-tight line-clamp-2 text-right">
                  {thesis.title}
                </h4>
                <div className="h-px w-full bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
              </div>
              
              <div className="space-y-2">
                <span className="text-muted-foreground font-medium text-xs">المؤلف:</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                    {thesis.author.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-sm truncate">{thesis.author.name}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-muted-foreground font-medium text-xs">التخصص:</span>
                  <p className="text-sm font-medium truncate" title={thesis.specialization.name}>{thesis.specialization.name}</p>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  {thesis.degree.name}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground font-medium text-xs">الجامعة:</span>
                <p className="text-sm font-medium truncate" title={thesis.university.name}>{thesis.university.name}</p>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-border/30">
                <Button variant="outline" size="sm" asChild className="flex-1 h-9 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20">
                  <a href={`${thesis.pdf_path}`} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    تحميل
                  </a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoading} className="flex-1 h-9 hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-900/20">
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      استعادة
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                        تأكيد الاستعادة
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        هل أنت متأكد من استعادة هذه الرسالة؟ سيتم نقلها إلى قائمة الرسائل النشطة.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRestore(thesis.id)} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl">
                        استعادة
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoading} className="flex-1 h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4 mr-2" />
                      حذف
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                        تأكيد الحذف النهائي
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        هل أنت متأكد من حذف هذه الرسالة نهائياً؟ هذه العملية لا يمكن التراجع عنها.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePermanently(thesis.id)} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl">
                        حذف نهائي
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
