"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, Edit, FileText, Search, Trash2, Download, FilterX } from 'lucide-react';
import Link from 'next/link';
import type { Thesis, University, Specialization, Degree, ThesisYear } from '@/types/api';
import { searchTheses as apiSearchTheses, archiveThesisBoth, getLatestTheses, getRemoteIdByLocalId } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';


interface ThesesClientPageProps {
  initialTheses: Thesis[];
  universities: University[];
  specializations: Specialization[];
  degrees: Degree[];
  years: ThesisYear[];
}

export function ThesesClientPage({ initialTheses, universities, specializations, degrees, years }: ThesesClientPageProps) {
  const [theses, setTheses] = useState<Thesis[]>(initialTheses);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    university_id: '',
    specialization_id: '',
    degree_id: '',
    year: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [remoteIds, setRemoteIds] = useState<Record<number, string | null>>({});
  const [loadingRemoteIds, setLoadingRemoteIds] = useState(true);
  const { toast } = useToast();

  // جلب id_remote لكل رسالة عند تحميل أو تحديث القائمة
  useEffect(() => {
    const fetchRemoteIds = async () => {
      setLoadingRemoteIds(true);
      console.log('Theses data:', theses.map(t => ({ id: t.id, title: t.title })));
      const ids: Record<number, string | null> = {};
      await Promise.all(
        theses.map(async (thesis) => {
          console.log('Searching for local ID:', thesis.id);
          const remoteId = await getRemoteIdByLocalId(thesis.id);
          console.log('Found remote ID:', remoteId, 'for local ID:', thesis.id);
          ids[thesis.id] = remoteId;
        })
      );
      console.log('Final remote IDs mapping:', ids);
      setRemoteIds(ids);
      setLoadingRemoteIds(false);
    };
    fetchRemoteIds();
  }, [theses]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      const searchParams: any = { title: searchTerm };
      if (filters.university_id) searchParams.university_id = filters.university_id;
      if (filters.specialization_id) searchParams.specialization_id = filters.specialization_id;
      if (filters.degree_id) searchParams.degree_id = filters.degree_id;
      if (filters.year) searchParams.year = filters.year;
      
      const results = await apiSearchTheses(searchParams);
      setTheses(results);
    } catch (error) {
      toast({ title: "خطأ في البحث", description: "لم نتمكن من إجراء البحث. حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const idRemote = remoteIds[id];
      console.log('Archiving - Local ID:', id, 'Remote ID:', idRemote);
      await archiveThesisBoth(id, idRemote);
      setTheses(theses.filter(thesis => thesis.id !== id));
      toast({ title: "نجاح", description: "تم نقل الرسالة إلى الأرشيف بنجاح." });
    } catch (error) {
      console.error('Archive error:', error);
      toast({ title: "خطأ في الأرشفة", description: "لم نتمكن من أرشفة الرسالة. حاول مرة أخرى.", variant: "destructive" });
    }
  };
  
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({ university_id: '', specialization_id: '', degree_id: '', year: '' });
    setTheses(initialTheses); 
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await getLatestTheses();
      setTheses(data);
      toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الرسائل.' });
    } catch (error) {
      toast({ title: 'خطأ في التحديث', description: 'تعذر تحديث بيانات الرسائل.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const isAnyFilterActive = 
    searchTerm.trim() !== '' || 
    filters.university_id !== '' || 
    filters.specialization_id !== '' || 
    filters.degree_id !== '' || 
    filters.year !== '';

  const isSearchButtonDisabled = isLoading || !isAnyFilterActive;
  const isClearFiltersButtonDisabled = isLoading || !isAnyFilterActive;
  
  const universityOptions = universities.map(uni => ({ value: uni.id.toString(), label: uni.name }));
  const specializationOptions = specializations.map(spec => ({ value: spec.id.toString(), label: spec.name }));
  const degreeOptions = degrees.map(deg => ({ value: deg.id.toString(), label: deg.name }));
  const yearOptions = years.filter(y => y !== "").map(y => ({ value: y.toString(), label: y.toString() }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
          {isLoading ? 'جاري التحديث...' : 'تحديث'}
        </Button>
      </div>
      <Card className="p-4 shadow-sm">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <Input
              type="text"
              placeholder="بحث بالعنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-2 md:col-span-3 lg:col-span-1"
            />
            <Combobox
              options={universityOptions}
              value={filters.university_id}
              onChange={(value) => handleFilterChange('university_id', value)}
              placeholder="اختر الجامعة"
            />
            <Combobox
              options={specializationOptions}
              value={filters.specialization_id}
              onChange={(value) => handleFilterChange('specialization_id', value)}
              placeholder="اختر التخصص"
            />
            <Combobox
              options={degreeOptions}
              value={filters.degree_id}
              onChange={(value) => handleFilterChange('degree_id', value)}
              placeholder="اختر الدرجة"
            />
            <Combobox
              options={yearOptions}
              value={filters.year}
              onChange={(value) => handleFilterChange('year', value)}
              placeholder="اختر السنة"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClearFilters} disabled={isClearFiltersButtonDisabled}>
              <FilterX className="ml-2 h-4 w-4" />
              مسح الفلاتر
            </Button>
            <Button type="submit" disabled={isSearchButtonDisabled}>
              <Search className="ml-2 h-4 w-4" />
              {isLoading ? 'جار البحث...' : 'بحث'}
            </Button>
          </div>
        </form>
      </Card>

      {isLoading && (
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
      )}

      {!isLoading && theses.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <FileText size={48} className="mx-auto mb-2" />
          <p>لا توجد رسائل لعرضها. حاول تعديل معايير البحث أو إضافة رسائل جديدة.</p>
        </div>
      )}

      {!isLoading && theses.length > 0 && (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border border-gray-200 text-center">المعرف المحلي</TableHead>
                  <TableHead className="border border-gray-200 text-center">المعرف الخارجي</TableHead>
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
                {theses.map((thesis) => (
                  <TableRow key={thesis.id}>
                    <TableCell className="border border-gray-200 font-mono text-xs text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-blue-600 font-semibold">{thesis.id}</span>
                        <span className="text-xs text-gray-500">محلي</span>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-200 font-mono text-xs text-center">
                      <div className="flex flex-col items-center gap-1">
                        {loadingRemoteIds ? (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-gray-500">جاري التحميل...</span>
                          </div>
                        ) : (
                          <span className={`font-semibold ${remoteIds[thesis.id] ? 'text-green-600' : 'text-red-500'}`}>
                            {remoteIds[thesis.id] || 'غير متوفر'}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">خارجي</span>
                      </div>
                    </TableCell>
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
                      <Button variant="ghost" size="icon" asChild>
                        <Link 
                          href={{ pathname: `/theses/${thesis.id}/edit`, query: {} }}
                          // @ts-ignore
                          state={{ thesis, id_local: thesis.id, id_remote: remoteIds[thesis.id] || null }}
                          aria-label="Edit Thesis"
                        >
                          <Edit className="h-4 w-4 text-yellow-500" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Archive Thesis">
                            <Archive className="h-4 w-4 text-orange-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من رغبتك في أرشفة هذه الرسالة؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم نقل هذه الرسالة إلى الأرشيف ويمكن استعادتها لاحقًا.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleArchive(thesis.id)} className="bg-orange-500 hover:bg-orange-600">
                              أرشفة
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
            {theses.map((thesis, index) => (
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
                    <Button variant="outline" size="sm" asChild className="flex-1 h-9 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-600 dark:hover:bg-yellow-900/20">
                      <Link href={{ pathname: `/theses/${thesis.id}/edit`, query: {} }}>
                        <Edit className="h-4 w-4 mr-2" />
                        تعديل
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 h-9 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 dark:hover:bg-orange-900/20">
                          <Archive className="h-4 w-4 mr-2" />
                          أرشفة
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                            تأكيد الأرشفة
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-base">
                            هل أنت متأكد من أرشفة هذه الرسالة؟ يمكن استعادتها لاحقاً.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleArchive(thesis.id)} className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-xl">
                            أرشفة
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
