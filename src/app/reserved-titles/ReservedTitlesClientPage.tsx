
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
        <Card className="shadow-lg">
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
      )}
    </div>
  );
}
