"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { UniversityForm } from '@/components/manage-data/UniversityForm';
import { SpecializationForm } from '@/components/manage-data/SpecializationForm';
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { ReservedThesisTitle, UniversityWithSpecializationsAdmin, Specialization as SpecializationType, Degree } from "@/types/api";
import { addReservedTitle, updateReservedTitle, getUniversities, getDegrees, checkReservedTitleExists } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox"; // Added Combobox import

const reservedTitleFormSchema = z.object({
  title: z.string().min(5, { message: "العنوان يجب أن يكون 5 أحرف على الأقل." }),
  person_name: z.string().min(3, { message: "اسم الشخص يجب أن يكون 3 أحرف على الأقل." }),
  university_id: z.string().min(1, { message: "الرجاء اختيار الجامعة." }),
  specialization_id: z.string().min(1, { message: "الرجاء اختيار التخصص." }),
  degree: z.string().min(1, { message: "الرجاء اختيار الدرجة العلمية." }),
  date: z.date({ required_error: "تاريخ الحجز مطلوب." }),
});

type ReservedTitleFormValues = z.infer<typeof reservedTitleFormSchema>;

interface ReservedTitleFormProps {
  initialData?: ReservedThesisTitle;
}

export function ReservedTitleForm({ initialData }: ReservedTitleFormProps) {
  // إضافة حالة لإظهار نموذج إضافة جامعة وتخصص
  const [addUniversityOpen, setAddUniversityOpen] = useState(false);
  const [addSpecializationOpen, setAddSpecializationOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [allUniversities, setAllUniversities] = useState<any[]>([]); // University[]
  const [allSpecializations, setAllSpecializations] = useState<SpecializationType[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  const defaultValues: ReservedTitleFormValues = {
      title: initialData?.title || "",
      person_name: initialData?.person_name || "",
      university_id: "", 
      specialization_id: "", 
      degree: initialData?.degree || "",
      date: initialData?.date ? new Date(initialData.date.split('/').reverse().join('-')) : new Date(),
  };

  const form = useForm<ReservedTitleFormValues>({
    resolver: zodResolver(reservedTitleFormSchema),
    defaultValues,
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoadingDropdowns(true);
      try {
        const [univs, fetchedDegrees] = await Promise.all([
          getUniversities(),
          getDegrees()
        ]);
        setAllUniversities(Array.isArray(univs) ? univs : []);
        setDegrees(fetchedDegrees);
        // لا يوجد تخصصات في كل الجامعات، لذلك التخصصات تبقى فارغة
        setAllSpecializations([]);

        if (initialData) {
            form.setValue('title', initialData.title);
            form.setValue('person_name', initialData.person_name);
            const foundUniv = univs.find(u => u.name === initialData.university);
            if (foundUniv) {
              form.setValue('university_id', foundUniv.id.toString());
            }
            // تعيين التخصص مباشرة من كل التخصصات
            const foundSpec = specs.find(s => s.name === initialData.specialization);
            if (foundSpec) {
              form.setValue('specialization_id', foundSpec.id.toString());
            }
            form.setValue('degree', initialData.degree);
            if (initialData.date) {
               const dateParts = initialData.date.split('/');
               if (dateParts.length === 3) {
                form.setValue('date', new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0])));
               } else {
                 form.setValue('date', new Date(initialData.date)); // Fallback for other formats
               }
            }
        }

      } catch (err) {
        toast({ title: "خطأ", description: "فشل تحميل بيانات الجامعات أو الدرجات.", variant: "destructive" });
      } finally {
        setIsLoadingDropdowns(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]); 

  // لم يعد هناك حاجة لتصفية التخصصات حسب الجامعة


  async function onSubmit(data: ReservedTitleFormValues) {
    setIsSubmitting(true);

    // تحقق من تكرار العنوان عند الإضافة فقط
    if (!initialData) {
      const exists = await checkReservedTitleExists(data.title);
      if (exists) {
        setIsSubmitting(false);
        return; // لا تكمل الإضافة إذا كان العنوان موجوداً
      }
    }

    const selectedUniversity = allUniversities.find(u => u.id.toString() === data.university_id);
    const selectedSpecialization = allSpecializations.find(s => s.id.toString() === data.specialization_id);
    if (!selectedUniversity || !selectedSpecialization) {
      toast({ title: "خطأ", description: "الرجاء اختيار جامعة وتخصص صالحين.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!data.degree) { 
      toast({ title: "خطأ", description: "الرجاء اختيار درجة علمية.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const apiData = {
      title: data.title,
      person_name: data.person_name,
      university: selectedUniversity.name,
      specialization: selectedSpecialization.name,
      degree: data.degree,
      date: format(data.date, "dd/MM/yyyy"), 
    };

    try {
      if (initialData) {
        await updateReservedTitle(initialData.id, apiData);
        toast({ title: "نجاح", description: "تم تعديل العنوان المحجوز بنجاح." });
      } else {
        await addReservedTitle(apiData);
        toast({ title: "نجاح", description: "تمت إضافة العنوان المحجوز بنجاح." });
      }
      router.push("/reserved-titles");
      router.refresh();
    } catch (error: any) {
      const errorMessage = error?.errors ? Object.values(error.errors).flat().join(', ') : error.message;
      toast({
        title: "خطأ",
        description: errorMessage || (initialData ? "فشل تعديل العنوان." : "فشل إضافة العنوان."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  useEffect(() => { 
    if (initialData && allUniversities.length > 0 && degrees.length > 0) {
        const univMatch = allUniversities.find(u => u.name === initialData.university);
        const degreeMatch = initialData.degree;

        const dateToSet = initialData.date 
        ? (() => {
            const dateParts = initialData.date.split('/');
            if (dateParts.length === 3) {
                // Assuming dd/MM/yyyy from API if split gives 3 parts
                return new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
            }
            return new Date(initialData.date); // Fallback for other formats
        })()
        : new Date();

        form.reset({
            title: initialData.title,
            person_name: initialData.person_name,
            university_id: univMatch?.id.toString() || "",
            specialization_id: "", 
            degree: degreeMatch || "",
            date: dateToSet,
        });
    } else if (!initialData) {
        form.reset(defaultValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, allUniversities, degrees]);

  
  // عرض جميع الجامعات بدون تصفية
  const universityOptions = allUniversities.map(uni => ({ value: uni.id.toString(), label: uni.name }));
  const specializationOptions = allSpecializations.map(spec => ({ value: spec.id.toString(), label: spec.name }));
  const degreeOptions = degrees.map(deg => ({ value: deg.name, label: deg.name }));


  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">
          {initialData ? "تعديل عنوان محجوز" : "إضافة عنوان محجوز جديد"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان الرسالة المقترح</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: دراسة تأثير الذكاء الاصطناعي..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="person_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشخص الحاجز</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: فاطمة علي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="university_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجامعة</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Combobox
                        options={universityOptions}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          form.setValue('specialization_id', ''); // Reset specialization
                        }}
                        placeholder={isLoadingDropdowns ? "جاري التحميل..." : universityOptions.length === 0 ? "لا توجد جامعات" : "اختر الجامعة"}
                        disabled={isLoadingDropdowns || universityOptions.length === 0}
                      />
                      <Dialog open={addUniversityOpen} onOpenChange={setAddUniversityOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" title="إضافة جامعة جديدة">
                            <PlusCircle className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogTitle>إضافة جامعة جديدة</DialogTitle>
                      <UniversityForm
                            onSuccess={async () => {
                              setAddUniversityOpen(false);
                              setIsLoadingDropdowns(true);
                              const univs = await getUniversities();
                              setAllUniversities(univs);
                              setIsLoadingDropdowns(false);
                              toast({ title: "نجاح", description: "تمت إضافة الجامعة." });
                            }}
                            onCancel={() => setAddUniversityOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="specialization_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التخصص</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Combobox
                        options={specializationOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={isLoadingDropdowns ? "جاري التحميل..." : specializationOptions.length === 0 ? "لا توجد تخصصات" : "اختر التخصص"}
                        disabled={isLoadingDropdowns || specializationOptions.length === 0}
                      />
                      <Dialog open={addSpecializationOpen} onOpenChange={setAddSpecializationOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" title="إضافة تخصص جديد">
                            <PlusCircle className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogTitle>إضافة تخصص جديد</DialogTitle>
                          <SpecializationForm
                            onSuccess={async () => {
                              setAddSpecializationOpen(false);
                              setIsLoadingDropdowns(true);
                              // لا حاجة لجلب الجامعات هنا، فقط إعادة تحميل التخصصات إذا لزم
                              setIsLoadingDropdowns(false);
                              toast({ title: "نجاح", description: "تمت إضافة التخصص." });
                            }}
                            onCancel={() => setAddSpecializationOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدرجة العلمية</FormLabel>
                    <Combobox
                        options={degreeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={isLoadingDropdowns ? "جاري التحميل..." : degreeOptions.length === 0 ? "لا توجد درجات" : "اختر الدرجة العلمية"}
                        disabled={isLoadingDropdowns || degreeOptions.length === 0}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاريخ الحجز</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: arSA }) : <span>اختر تاريخ</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                          locale={arSA}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting || isLoadingDropdowns} className="w-full">
               {(isSubmitting || isLoadingDropdowns) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {initialData ? "حفظ التعديلات" : "إضافة العنوان"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
