"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { addSpecializationToBothServers, getHighestSpecializationId } from '@/lib/manageDataService';

const specializationFormSchema = z.object({
  id: z.number({ required_error: "المعرف مطلوب." }).min(1, { message: "المعرف يجب أن يكون أكبر من 0." }),
  name: z.string().min(2, { message: "اسم التخصص يجب أن يكون حرفين على الأقل." }),
});

type SpecializationFormValues = z.infer<typeof specializationFormSchema>;

interface SpecializationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function SpecializationForm({ onSuccess, onCancel }: SpecializationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highestId, setHighestId] = useState<number>(0);
  const [isLoadingHighestId, setIsLoadingHighestId] = useState(true);

  useEffect(() => {
    const fetchHighestId = async () => {
      try {
        const id = await getHighestSpecializationId();
        setHighestId(id);
      } catch (error) {
        console.error('Failed to fetch highest specialization ID:', error);
      } finally {
        setIsLoadingHighestId(false);
      }
    };
    fetchHighestId();
  }, []);

  const form = useForm<SpecializationFormValues>({
    resolver: zodResolver(specializationFormSchema),
    defaultValues: {
      id: 0,
      name: "",
    },
  });

  async function onSubmit(data: SpecializationFormValues) {
    setIsSubmitting(true);
    try {
      await addSpecializationToBothServers(data);
      
      toast({ 
        title: "نجاح", 
        description: "تمت إضافة التخصص بنجاح في كلا الخادمين." 
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل إضافة التخصص.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">المعرف</FormLabel>
              <div className="bg-muted/30 p-3 rounded-lg border border-muted mb-2">
                <p className="text-sm mb-2">
                  يجب أن يكون المعرف فريداً وغير مستخدم مسبقاً
                </p>
                {!isLoadingHighestId && (
                  <div className="flex items-center gap-2 mb-2 bg-primary/10 p-2 rounded">
                    <span className="text-sm font-medium">أكبر معرف موجود حالياً:</span>
                    <span className="font-mono font-bold text-primary">{highestId}</span>
                  </div>
                )}
              </div>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder={isLoadingHighestId ? "جاري التحميل..." : `أدخل معرفاً أكبر من ${highestId}`}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  disabled={isLoadingHighestId}
                  className="text-lg font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم التخصص</FormLabel>
              <FormControl>
                <Input placeholder="مثال: الرياضيات" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إضافة تخصص
          </Button>
        </div>
      </form>
    </Form>
  );
}