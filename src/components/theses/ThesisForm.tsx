"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Thesis, Degree, UniversityWithSpecializationsAdmin, Specialization as SpecializationType } from "@/types/api";
import { addThesisBoth, updateThesisBoth, getUniversitiesWithSpecializationsAdmin, getDegrees, checkThesisTitleExists, sendUuidsToBothServers, getRemoteIdByLocalId, getUniversities, getSpecializations, addSpecializationToUniversity } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox"; // Added Combobox import
import { API_ENDPOINTS, EXTERNAL_LINKS } from '@/lib/endpoints';
import { UniversityForm } from '@/components/manage-data/UniversityForm';
import { SpecializationForm } from '@/components/manage-data/SpecializationForm';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const thesisFormSchema = z.object({
  title: z.string().min(5, { message: "العنوان يجب أن يكون 5 أحرف على الأقل." }),
  year: z.date({ required_error: "تاريخ النشر مطلوب." }),
  university_id: z.string().min(1, { message: "الرجاء اختيار الجامعة." }),
  specialization_id: z.string().min(1, { message: "الرجاء اختيار التخصص." }),
  degree_id: z.string().min(1, { message: "الرجاء اختيار الدرجة." }),
  author_name: z.string().min(3, { message: "اسم المؤلف يجب أن يكون 3 أحرف على الأقل." }),
  pdf: z.instanceof(File).optional(),
});

type ThesisFormValues = z.infer<typeof thesisFormSchema>;

interface ThesisFormProps {
  initialData?: Thesis & { author_name?: string };
  degrees?: Degree[]; // اجعلها اختيارية
}

export function ThesisForm({ initialData, degrees }: ThesisFormProps) {
  // إضافة حالة لإظهار نموذج إضافة جامعة وتخصص في Dialog
  const [addUniversityOpen, setAddUniversityOpen] = useState(false);
  const [addSpecializationOpen, setAddSpecializationOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [allUniversities, setAllUniversities] = useState<UniversityWithSpecializationsAdmin[]>([]);
  const [allSpecializations, setAllSpecializations] = useState<SpecializationType[]>([]);
  const [degreesState, setDegrees] = useState<Degree[]>(degrees || []);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  const defaultValues = initialData
    ? {
        title: initialData.title,
        year: initialData.year ? new Date(parseInt(initialData.year, 10), 0, 1) : new Date(),
        university_id: initialData.university?.id.toString() || "",
        specialization_id: initialData.specialization?.id.toString() || "",
        degree_id: initialData.degree?.id.toString() || "",
        author_name: initialData.author?.name || initialData.author_name || "",
      }
    : {
        title: "",
        year: new Date(),
        university_id: "",
        specialization_id: "",
        degree_id: "",
        author_name: "",
      };

  const form = useForm<ThesisFormValues>({
    resolver: zodResolver(thesisFormSchema),
    defaultValues,
  });

  // إذا تم تمرير الدرجات من الأعلى استخدمها، وإلا جلبها من API
  useEffect(() => {
    async function fetchData() {
      setIsLoadingDropdowns(true);
      try {
        let fetchedDegrees = degrees;
        let univs;
        let specs;
        if (!degrees) {
          [univs, specs, fetchedDegrees] = await Promise.all([
            getUniversities(),
            getSpecializations(),
            getDegrees()
          ]);
        } else {
          [univs, specs] = await Promise.all([
            getUniversities(),
            getSpecializations()
          ]);
        }
        // Handle fetchApiBoth result
        let universitiesList = [];
        if (univs && typeof univs === 'object' && 'local' in univs && 'remote' in univs) {
          const localUnis = Array.isArray(univs.local) ? univs.local : [];
          const remoteUnis = Array.isArray(univs.remote) ? univs.remote : [];
          universitiesList = localUnis.filter(lu => remoteUnis.some(ru => ru.id === lu.id));
        } else if (Array.isArray(univs)) {
          universitiesList = univs;
        }
        setAllUniversities(universitiesList);
        // Specializations
        let specsList = [];
        if (specs && typeof specs === 'object' && 'local' in specs && 'remote' in specs) {
          const localSpecs = Array.isArray(specs.local) ? specs.local : [];
          const remoteSpecs = Array.isArray(specs.remote) ? specs.remote : [];
          specsList = localSpecs.filter(ls => remoteSpecs.some(rs => rs.id === ls.id));
        } else if (Array.isArray(specs)) {
          specsList = specs;
        }
        setAllSpecializations(specsList);
        setDegrees(fetchedDegrees || []);
      } catch (err) {
        toast({ title: "خطأ", description: "فشل تحميل بيانات الجامعات أو التخصصات أو الدرجات.", variant: "destructive" });
      } finally {
        setIsLoadingDropdowns(false);
      }
    }
    fetchData();
  }, [degrees]);

  const watchedUniversityId = form.watch('university_id');
  // لم يعد هناك حاجة لتصفية التخصصات حسب الجامعة


  async function onSubmit(data: ThesisFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("year", format(data.year, "yyyy"));
    formData.append("university_id", data.university_id);
    formData.append("specialization_id", data.specialization_id);
    formData.append("degree_id", data.degree_id);
    formData.append("author_name", data.author_name);
    if (data.pdf) {
      formData.append("pdf", data.pdf);
    }

    try {
      if (initialData) {
        // ...existing code...
        let idLocal = initialData.id;
        let idRemote: string | null = null;
        if (typeof window !== 'undefined') {
          // @ts-ignore
          const nav = window.history.state && window.history.state.usr;
          if (nav) {
            if (nav.id_local) idLocal = nav.id_local;
            if (nav.id_remote) idRemote = nav.id_remote;
          }
        }
        if (!idRemote) {
          idRemote = await getRemoteIdByLocalId(idLocal);
        }
        await updateThesisBoth(idLocal, idRemote, formData);
        toast({ title: "نجاح", description: "تم تعديل الرسالة بنجاح في كل الخوادم." });
      } else {
        if (!data.pdf) {
          form.setError("pdf", { type: "manual", message: "ملف PDF مطلوب عند إضافة رسالة جديدة." });
          setIsSubmitting(false);
          return;
        }
        // تحقق من العنوان في كل الخوادم قبل الإضافة
        const exists = await checkThesisTitleExists(data.title);
        if (exists) {
          setIsSubmitting(false);
          return;
        }
        // تحقق من ارتباط التخصص بالجامعة
        const selectedUniversity = allUniversities.find(u => u.id.toString() === data.university_id);
        const selectedSpecialization = allSpecializations.find(s => s.id.toString() === data.specialization_id);
        let isLinked = false;
        if (selectedUniversity && selectedSpecialization) {
          isLinked = Array.isArray(selectedUniversity.specializations) && selectedUniversity.specializations.some(s => s.id === selectedSpecialization.id);
        }
        if (!isLinked && selectedUniversity && selectedSpecialization) {
          // أضف التخصص للجامعة أولاً
          await addSpecializationToUniversity(selectedUniversity.id, { specialization_id: selectedSpecialization.id });
        }
        // إضافة الرسالة في كل خادم وجمع المعرفات
        const { id_local, id_remote } = await addThesisBoth(formData);
        if (id_local && id_remote) {
          await sendUuidsToBothServers(id_local, id_remote);
        }
        toast({ title: "نجاح", description: "تمت إضافة الرسالة بنجاح." });
      }
      router.push("/theses");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || (initialData ? "فشل تعديل الرسالة." : "فشل إضافة الرسالة."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // تم حذف التكرار: استخدم فقط allUniversities
  const universityOptions = allUniversities.map(uni => ({ value: uni.id.toString(), label: uni.name }));
  const specializationOptions = allSpecializations.map(spec => ({ value: spec.id.toString(), label: spec.name }));
  const degreeOptions = degreesState.map(deg => ({ value: deg.id.toString(), label: deg.name }));


  return (
    <Card className="shadow-xl">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="font-headline text-xl sm:text-2xl text-primary">
          {initialData ? "تعديل الرسالة" : "إضافة رسالة جديدة"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان الرسالة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: تطوير تطبيقات الويب الحديثة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="author_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المؤلف</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: أحمد محمد" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاريخ النشر</FormLabel>
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
                            {field.value ? format(field.value, "PPP", { locale: arSA }) : <span>اختر تاريخ النشر</span>}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                          form.setValue('specialization_id', ''); 
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
                              let universitiesList = [];
                              if (univs && typeof univs === 'object' && 'local' in univs && 'remote' in univs) {
                                const localUnis = Array.isArray(univs.local) ? univs.local : [];
                                const remoteUnis = Array.isArray(univs.remote) ? univs.remote : [];
                                universitiesList = localUnis.filter(lu => remoteUnis.some(ru => ru.id === lu.id));
                              } else if (Array.isArray(univs)) {
                                universitiesList = univs;
                              }
                              setAllUniversities(universitiesList);
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
                              const specs = await getSpecializations();
                              let specsList = [];
                              if (specs && typeof specs === 'object' && 'local' in specs && 'remote' in specs) {
                                const localSpecs = Array.isArray(specs.local) ? specs.local : [];
                                const remoteSpecs = Array.isArray(specs.remote) ? specs.remote : [];
                                specsList = localSpecs.filter(ls => remoteSpecs.some(rs => rs.id === ls.id));
                              } else if (Array.isArray(specs)) {
                                specsList = specs;
                              }
                              setAllSpecializations(specsList);
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
                name="degree_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدرجة العلمية</FormLabel>
                    <Combobox
                      options={degreeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={isLoadingDropdowns ? "جاري التحميل..." : degreeOptions.length === 0 ? "لا توجد درجات" : "اختر الدرجة"}
                      disabled={isLoadingDropdowns || degreeOptions.length === 0}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pdf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملف PDF {initialData ? "(اختياري للتعديل)" : ""}</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} 
                    />
                  </FormControl>
                  <FormDescription>
                    {initialData && initialData.pdf_path ? `الملف الحالي: ${initialData.pdf_path.split('/').pop()}` : "الرجاء تحميل ملف PDF الخاص بالرسالة."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isSubmitting || isLoadingDropdowns} className="w-full sm:w-auto sm:min-w-[200px]">
              {(isSubmitting || isLoadingDropdowns) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {initialData ? "حفظ التعديلات" : "إضافة الرسالة"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
