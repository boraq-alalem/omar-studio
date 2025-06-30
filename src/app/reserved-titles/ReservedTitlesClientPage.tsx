
"use client";

import type React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, FileLock2, FilterX } from 'lucide-react';
import Link from 'next/link';
import type { ReservedThesisTitle } from '@/types/api';
import { searchReservedTitles as apiSearchReservedTitles, deleteReservedTitle as apiDeleteReservedTitle } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns'; 

export function ReservedTitlesClientPage({ initialReservedTitles }: { initialReservedTitles: ReservedThesisTitle[] }) {
  const [reservedTitles, setReservedTitles] = useState<ReservedThesisTitle[]>(initialReservedTitles);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) {
        // Already disabled, but as a safeguard if called directly
        setReservedTitles(initialReservedTitles); 
        return;
    }
    setIsLoading(true);
    try {
      const results = await apiSearchReservedTitles(searchTerm);
      setReservedTitles(results);
    } catch (error) {
      toast({ title: "خطأ في البحث", description: "لم نتمكن من إجراء البحث. حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDeleteReservedTitle(id);
      setReservedTitles(reservedTitles.filter(title => title.id !== id));
      toast({ title: "نجاح", description: "تم حذف العنوان المحجوز بنجاح." });
    } catch (error) {
      toast({ title: "خطأ في الحذف", description: "لم نتمكن من حذف العنوان. حاول مرة أخرى.", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString.split('/').reverse().join('-')), 'yyyy/MM/dd');
    } catch {
      return dateString; 
    }
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setReservedTitles(initialReservedTitles);
  };

  const isSearchActive = searchTerm.trim() !== '';
  const isSearchButtonDisabled = isLoading || !isSearchActive;
  const isClearFiltersButtonDisabled = isLoading || !isSearchActive;
  
  if (initialReservedTitles === null) {
    return (
      <div className="text-center py-10 text-destructive">
        <FileLock2 size={48} className="mx-auto mb-2" />
        <p>فشل تحميل بيانات العناوين المحجوزة. يرجى المحاولة مرة أخرى لاحقًا.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center">
          <Input
            type="text"
            placeholder="بحث عن عنوان محجوز..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow min-w-[200px]"
          />
          <Button type="submit" disabled={isSearchButtonDisabled}>
            <Search className="ml-2 h-4 w-4" />
            {isLoading ? 'جار البحث...' : 'بحث'}
          </Button>
          <Button type="button" variant="outline" onClick={handleClearFilters} disabled={isClearFiltersButtonDisabled}>
            <FilterX className="ml-2 h-4 w-4" />
            مسح الفلاتر
          </Button>
        </form>
      </Card>

      {isLoading && (
         <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && reservedTitles.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <FileLock2 size={48} className="mx-auto mb-2" />
          <p>لا توجد عناوين محجوزة لعرضها. حاول تعديل معايير البحث أو إضافة عناوين جديدة.</p>
        </div>
      )}

      {!isLoading && reservedTitles.length > 0 && (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعرف</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>اسم الشخص</TableHead>
                  <TableHead>الجامعة</TableHead>
                  <TableHead>التخصص</TableHead>
                  <TableHead>الدرجة</TableHead>
                  <TableHead>تاريخ الحجز</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservedTitles.map((title) => (
                  <TableRow key={title.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{title.id}</TableCell>
                    <TableCell className="font-medium">{title.title}</TableCell>
                    <TableCell>{title.person_name}</TableCell>
                    <TableCell>{title.university}</TableCell>
                    <TableCell>{title.specialization}</TableCell>
                    <TableCell>{title.degree}</TableCell>
                    <TableCell>{formatDate(title.date)}</TableCell>
                    <TableCell className="space-x-1 whitespace-nowrap">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/reserved-titles/${title.id}/edit`} aria-label="Edit Reserved Title">
                           <Edit className="h-4 w-4 text-yellow-500" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete Reserved Title">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من رغبتك في حذف هذا العنوان المحجوز؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف هذا العنوان نهائياً ولا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(title.id)} className="bg-destructive hover:bg-destructive/90">
                              حذف
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
            {reservedTitles.map((title, index) => (
              <Card key={title.id} className="p-4 rounded-2xl border border-border/50 bg-card shadow-modern-lg" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-base leading-tight line-clamp-2 text-right">
                      {title.title}
                    </h4>
                    <div className="h-px w-full bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-muted-foreground font-medium text-xs">الشخص:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                        {title.person_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm truncate">{title.person_name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-muted-foreground font-medium text-xs">التخصص:</span>
                      <p className="text-sm font-medium truncate" title={title.specialization}>{title.specialization}</p>
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                      {title.degree}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground font-medium text-xs">الجامعة:</span>
                    <p className="text-sm font-medium truncate" title={title.university}>{title.university}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t border-border/30">
                    <Button variant="outline" size="sm" asChild className="flex-1 h-9 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20">
                      <Link href={`/reserved-titles/${title.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        تعديل
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4 mr-2" />
                          حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                            تأكيد الحذف
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-base">
                            هل أنت متأكد من حذف هذا العنوان المحجوز؟ هذه العملية لا يمكن التراجع عنها.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(title.id)} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl">
                            حذف
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
