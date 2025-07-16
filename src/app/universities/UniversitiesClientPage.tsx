
"use client";

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Building, Library, Loader2, Search, FilterX } from 'lucide-react';
import type { UniversityWithSpecializationsAdmin, Specialization, University } from '@/types/api';
import { addSpecializationToUniversity, getSpecializations as getAllSpecializationsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const addSpecializationDialogSchema = z.object({
  specialization_input: z.string().min(1, { message: "الرجاء إدخال أو اختيار تخصص." }),
});
type AddSpecializationDialogFormValues = z.infer<typeof addSpecializationDialogSchema>;



interface UniversitiesClientPageProps {
  allUniversities: University[];
  universitiesWithSpecs: UniversityWithSpecializationsAdmin[];
}

export function UniversitiesClientPage({ allUniversities, universitiesWithSpecs }: UniversitiesClientPageProps) {

  // دمج الجامعات مع التخصصات: كل الجامعات، وإذا لها تخصصات أضفها، وإلا مصفوفة فارغة
  const mergeUniversities = (all: University[], specs: UniversityWithSpecializationsAdmin[]): UniversityWithSpecializationsAdmin[] => {
    const specsMap = new Map(specs.map(u => [u.id, u.specializations]));
    return all.map(u => ({
      id: u.id,
      name: u.name,
      specializations: specsMap.get(u.id) || []
    }));
  };
  const [displayedUniversities, setDisplayedUniversities] = useState<UniversityWithSpecializationsAdmin[]>(mergeUniversities(allUniversities, universitiesWithSpecs));
  const [allSpecializationsData, setAllSpecializationsData] = useState<Specialization[]>([]);
  const [isLoadingAllSpecializations, setIsLoadingAllSpecializations] = useState(true);
  const [selectedUniversityForDialog, setSelectedUniversityForDialog] = useState<UniversityWithSpecializationsAdmin | null>(null);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false); // For refreshing the whole list
  const { toast } = useToast();

  const [searchMode, setSearchMode] = useState<'university' | 'specialization'>('university');
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('');
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);


  const dialogForm = useForm<AddSpecializationDialogFormValues>({
    resolver: zodResolver(addSpecializationDialogSchema),
    defaultValues: { specialization_input: "" },
  });

  useEffect(() => {
    async function fetchGlobalSpecializations() {
      setIsLoadingAllSpecializations(true);
      try {
        const specs = await getAllSpecializationsApi();
        setAllSpecializationsData(specs || []);
      } catch (error) {
        toast({ title: "خطأ", description: "فشل تحميل قائمة التخصصات العامة.", variant: "destructive" });
        setAllSpecializationsData([]);
      } finally {
        setIsLoadingAllSpecializations(false);
      }
    }
    fetchGlobalSpecializations();
  }, [toast]);

  const refreshUniversitiesList = async () => {
    setIsLoadingUniversities(true);
    try {
      const [all, specs] = await Promise.all([
        (await import('@/lib/api')).getUniversities(),
        (await import('@/lib/api')).getUniversitiesWithSpecializationsAdmin()
      ]);
      setDisplayedUniversities(mergeUniversities(all, specs));
      setSelectedFilterValue('');
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحديث قائمة الجامعات.", variant: "destructive" });
    } finally {
      setIsLoadingUniversities(false);
    }
  };

  const handleAddSpecializationToUni = async (values: AddSpecializationDialogFormValues) => {
    if (!selectedUniversityForDialog) return;
    setIsSubmittingDialog(true);

    const inputValue = values.specialization_input;
    const existingGlobalSpec = allSpecializationsData.find(s => s.name.toLowerCase() === inputValue.toLowerCase());

    let payload: { specialization_name: string } | { specialization_id: number };
    let specDisplayValue: string;

    if (existingGlobalSpec) {
      payload = { specialization_id: existingGlobalSpec.id };
      specDisplayValue = existingGlobalSpec.name;
    } else {
      payload = { specialization_name: inputValue };
      specDisplayValue = inputValue;
    }
    
    const currentUniSpecializations = selectedUniversityForDialog.specializations && Array.isArray(selectedUniversityForDialog.specializations) ? selectedUniversityForDialog.specializations : [];
    const isAlreadyAddedToCurrentUni = currentUniSpecializations.some(uniSpec => {
        if (existingGlobalSpec) return uniSpec.id === existingGlobalSpec.id;
        return uniSpec.name.toLowerCase() === inputValue.toLowerCase();
    });

    if (isAlreadyAddedToCurrentUni) {
        toast({ title: "موجود بالفعل", description: `التخصص "${specDisplayValue}" مضاف بالفعل لجامعة "${selectedUniversityForDialog.name}".`, variant: "destructive" });
        setIsSubmittingDialog(false);
        return;
    }

    try {
      await addSpecializationToUniversity(selectedUniversityForDialog.id, payload);
      toast({ title: "نجاح", description: `تمت إضافة التخصص "${specDisplayValue}" إلى جامعة "${selectedUniversityForDialog.name}".` });
      dialogForm.reset();
      await refreshUniversitiesList(); // Refresh the main list
      // تحديث الجامعة المختارة في الحوار بعد الإضافة
      const merged = mergeUniversities(allUniversities, universitiesWithSpecs);
      const updatedUni = merged.find(u => u.id === selectedUniversityForDialog.id);
      if (updatedUni) setSelectedUniversityForDialog(updatedUni); else setSelectedUniversityForDialog(null);
    } catch (error) {
      toast({ title: "خطأ", description: "لم نتمكن من إضافة التخصص. حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsSubmittingDialog(false);
    }
  };

  const watchedDialogSpecializationInput = dialogForm.watch('specialization_input');

  const isDialogSpecializationAlreadyAdded = useMemo(() => {
    if (!selectedUniversityForDialog || !watchedDialogSpecializationInput || !allSpecializationsData || allSpecializationsData.length === 0) return false;
    const inputValue = watchedDialogSpecializationInput.toLowerCase();
    const existingGlobalSpec = allSpecializationsData.find(s => s.name.toLowerCase() === inputValue);
    const uniSpecializations = selectedUniversityForDialog.specializations && Array.isArray(selectedUniversityForDialog.specializations) ? selectedUniversityForDialog.specializations : [];
    return uniSpecializations.some(uniSpec => {
      if (existingGlobalSpec) return uniSpec.id === existingGlobalSpec.id;
      return uniSpec.name.toLowerCase() === inputValue;
    });
  }, [watchedDialogSpecializationInput, selectedUniversityForDialog, allSpecializationsData]);

  // Filter Section Logic
  const handleSearchModeChange = (newMode: 'university' | 'specialization') => {
    setSearchMode(newMode);
    setSelectedFilterValue(''); // Reset selected value when mode changes
    // setDisplayedUniversities(initialUniversities || []); // Optionally reset list immediately
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedFilterValue) {
      setDisplayedUniversities(mergeUniversities(allUniversities, universitiesWithSpecs));
      return;
    }
    setIsApplyingFilter(true);
    let filtered: UniversityWithSpecializationsAdmin[] = [];
    if (searchMode === 'university') {
      filtered = mergeUniversities(allUniversities, universitiesWithSpecs).filter(uni => uni.id.toString() === selectedFilterValue);
    } else if (searchMode === 'specialization') {
      const selectedSpecName = allSpecializationsData.find(s => s.id.toString() === selectedFilterValue)?.name;
      if(selectedSpecName){
        filtered = mergeUniversities(allUniversities, universitiesWithSpecs).filter(uni => 
          Array.isArray(uni.specializations) && uni.specializations.some(spec => spec.name === selectedSpecName)
        );
      }
    }
    setDisplayedUniversities(filtered);
    setIsApplyingFilter(false);
  };

  const handleClearFilters = () => {
    setSelectedFilterValue('');
    setDisplayedUniversities(mergeUniversities(allUniversities, universitiesWithSpecs));
  };

  const filterOptions = useMemo(() => {
    if (searchMode === 'university') {
      return (allUniversities || []).map((uni: University) => ({ value: uni.id.toString(), label: uni.name }));
    } else { // specialization
      return allSpecializationsData.map((spec: Specialization) => ({ value: spec.id.toString(), label: spec.name }));
    }
  }, [searchMode, allUniversities, allSpecializationsData]);
  
  const isFilterActive = selectedFilterValue !== '';
  const isSearchButtonDisabled = !selectedFilterValue || isApplyingFilter || isLoadingAllSpecializations;
  const isClearFiltersButtonDisabled = !isFilterActive || isApplyingFilter;


  if (isLoadingUniversities && (!displayedUniversities || displayedUniversities.length === 0)) {
     return ( /* Skeleton for initial full list loading */
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-32 mt-3" />
            </Card>
          ))}
        </div>
      );
  }
  
  if ((!allUniversities || allUniversities.length === 0) && !isLoadingUniversities) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Building size={48} className="mx-auto mb-2" />
        <p>لا توجد جامعات لعرضها حالياً. قد تحتاج إلى إضافتها أولاً.</p>
      </div>
    );
  }
  
  const globalSpecializationOptionsForDialog = (allSpecializationsData || []).map(spec => ({ value: spec.name, label: spec.name }));

  return (
    <div className="space-y-6">
      <Card className="p-4 shadow-sm">
        <div className="bg-muted/30 p-4 rounded-lg border border-muted mb-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            فلترة النتائج
          </h3>
          
          <Tabs value={searchMode} onValueChange={(value) => handleSearchModeChange(value as 'university' | 'specialization')} dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="university" className="text-base py-2">
                <Building className="ml-2 h-4 w-4" />
                فلترة حسب الجامعة
              </TabsTrigger>
              <TabsTrigger value="specialization" className="text-base py-2">
                <Library className="ml-2 h-4 w-4" />
                فلترة حسب التخصص
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="bg-card p-3 rounded-lg border">
              <div className="mb-2">
                <label className="text-sm font-medium block mb-1">
                  {searchMode === 'university' ? 'اختر الجامعة:' : 'اختر التخصص:'}
                </label>
              </div>
              <Combobox
                options={filterOptions}
                value={selectedFilterValue}
                onChange={(value) => setSelectedFilterValue(value)}
                placeholder={isLoadingAllSpecializations && searchMode === 'specialization' ? "جاري تحميل التخصصات..." : `اختر ${searchMode === 'university' ? 'جامعة' : 'تخصصاً'}...`}
                searchPlaceholder={`ابحث عن ${searchMode === 'university' ? 'جامعة' : 'تخصص'}...`}
                notFoundText={`لم يتم العثور على ${searchMode === 'university' ? 'جامعة' : 'تخصص'}.`}
                disabled={isLoadingAllSpecializations && searchMode === 'specialization'}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClearFilters} disabled={isClearFiltersButtonDisabled}>
                <FilterX className="ml-2 h-4 w-4" />
                مسح الفلتر
              </Button>
              <Button type="submit" disabled={isSearchButtonDisabled}>
                <Search className="ml-2 h-4 w-4" />
                {isApplyingFilter ? 'جار البحث...' : 'تطبيق الفلتر'}
              </Button>
            </div>
          </form>
          
          {isFilterActive && (
            <div className="mt-4 p-2 bg-primary/10 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {searchMode === 'university' ? 'تم الفلترة حسب الجامعة:' : 'تم الفلترة حسب التخصص:'}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {filterOptions.find(opt => opt.value === selectedFilterValue)?.label || selectedFilterValue}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-7 px-2">
                <FilterX className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {isApplyingFilter && ( /* Skeleton for when applying filter */
         <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <div className="flex flex-wrap gap-2"><Skeleton className="h-6 w-20" /></div>
            </Card>
          ))}
        </div>
      )}

      {!isApplyingFilter && displayedUniversities.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Library size={48} className="mx-auto mb-2" />
          <p>لا توجد نتائج تطابق معايير البحث الحالية.</p>
        </div>
      )}

      {!isApplyingFilter && displayedUniversities.length > 0 && (
        <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Building className="inline ml-1 h-5 w-5" /> اسم الجامعة</TableHead>
              <TableHead><Library className="inline ml-1 h-5 w-5" /> التخصصات</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedUniversities.map((uni) => (
              <TableRow key={uni.id}>
                <TableCell className="font-medium font-headline">{uni.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {uni.specializations && Array.isArray(uni.specializations) && uni.specializations.length > 0 ? (
                      uni.specializations.map((spec) => (
                        <Badge key={spec.id} variant="secondary" className="text-sm">{spec.name}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">لا توجد تخصصات</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Dialog open={selectedUniversityForDialog?.id === uni.id} onOpenChange={(isOpen) => {
                      if (!isOpen) {
                          setSelectedUniversityForDialog(null);
                          dialogForm.reset();
                      } else {
                          setSelectedUniversityForDialog(uni);
                          dialogForm.reset();
                      }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => {
                          setSelectedUniversityForDialog(uni);
                          dialogForm.reset();
                      }}>
                        <PlusCircle className="ml-1 h-4 w-4" /> إضافة تخصص
                      </Button>
                    </DialogTrigger>
                    {selectedUniversityForDialog?.id === uni.id && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-headline">إضافة تخصص لجامعة: {selectedUniversityForDialog.name}</DialogTitle>
                        <DialogDescription>
                          اختر تخصصاً موجوداً أو أدخل اسم تخصص جديد لإضافته لهذه الجامعة.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...dialogForm}>
                        <form onSubmit={dialogForm.handleSubmit(handleAddSpecializationToUni)} className="space-y-4 py-4">
                          <FormField
                            control={dialogForm.control}
                            name="specialization_input"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>التخصص</FormLabel>
                                <FormControl>
                                  <Combobox
                                    options={globalSpecializationOptionsForDialog}
                                    value={field.value}
                                    onChange={(value) => field.onChange(value)}
                                    placeholder={
                                      isLoadingAllSpecializations ? "جاري تحميل التخصصات..." :
                                      globalSpecializationOptionsForDialog.length === 0 ? "لا توجد تخصصات عامة" :
                                      "اختر أو أدخل اسم التخصص"
                                    }
                                    searchPlaceholder="ابحث عن تخصص..."
                                    notFoundText="لم يتم العثور على تخصص. يمكنك كتابة اسم جديد."
                                    disabled={isLoadingAllSpecializations || (globalSpecializationOptionsForDialog.length === 0 && !isLoadingAllSpecializations)}
                                  />
                                </FormControl>
                                <FormMessage />
                                {isDialogSpecializationAlreadyAdded && watchedDialogSpecializationInput && (
                                  <p className="text-sm text-destructive">هذا التخصص مضاف بالفعل لهذه الجامعة.</p>
                                )}
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                             <Button
                               type="submit"
                               disabled={isSubmittingDialog || isLoadingAllSpecializations || isDialogSpecializationAlreadyAdded || !watchedDialogSpecializationInput?.trim()}
                             >
                              {(isSubmittingDialog || isLoadingAllSpecializations) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                              إضافة التخصص
                             </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                    )}
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Card>
       )}
       {(isLoadingUniversities && displayedUniversities && displayedUniversities.length > 0) && ( /* Loading indicator when refreshing list */
         <div className="text-center py-4">
           <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
           <p className="text-muted-foreground">جاري تحديث قائمة الجامعات...</p>
         </div>
       )}
    </div>
  );
}

    