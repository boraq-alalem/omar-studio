"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { addUniversityToBothServers } from '@/lib/manageDataService';

const universityFormSchema = z.object({
  id: z.number({ required_error: "المعرف مطلوب." }).min(1, { message: "المعرف يجب أن يكون أكبر من 0." }),
  name: z.string().min(2, { message: "اسم الجامعة يجب أن يكون حرفين على الأقل." }),
});

type UniversityFormValues = z.infer<typeof universityFormSchema>;

interface UniversityFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function UniversityForm({ onSuccess, onCancel }: UniversityFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UniversityFormValues>({
    resolver: zodResolver(universityFormSchema),
    defaultValues: {
      id: 0,
      name: "",
    },
  });

  async function onSubmit(data: UniversityFormValues) {
    setIsSubmitting(true);
    try {
      await addUniversityToBothServers(data);
      
      toast({ 
        title: "نجاح", 
        description: "تمت إضافة الجامعة بنجاح في كلا الخادمين." 
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل إضافة الجامعة.",
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
              <FormLabel>المعرف</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="مثال: 121" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
              <FormLabel>اسم الجامعة</FormLabel>
              <FormControl>
                <Input placeholder="مثال: جامعة الملك سعود" {...field} />
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
            إضافة جامعة
          </Button>
        </div>
      </form>
    </Form>
  );
}