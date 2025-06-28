
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { User, ApiRole, CreateUserRequest } from '@/types/users';
import { addUser, getAllRoles } from '@/lib/authService';
import { Loader2 } from 'lucide-react';

const userFormSchema = z.object({
  name: z.string().min(2, { message: "اسم المستخدم يجب أن يكون حرفين على الأقل." }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." }),
  role_id: z.number({ required_error: "الرجاء اختيار نوع المستخدم." }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const isEditing = !!initialData;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialData?.fullName || "",
      email: initialData?.username || "",
      password: "",
      role_id: 0,
    },
  });

  // Load roles on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData = await getAllRoles();
        setRoles(rolesData);
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل تحميل أنواع المستخدمين.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingRoles(false);
      }
    };
    loadRoles();
  }, [toast]);

  async function onSubmit(data: UserFormValues) {
    if (isEditing) {
      toast({
        title: "تنبيه",
        description: "تعديل المستخدمين غير متاح حالياً.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userData: CreateUserRequest = {
        name: data.name,
        email: data.email,
        password: data.password,
        role_id: data.role_id,
      };
      
      const result = await addUser(userData);
      
      toast({ 
        title: "نجاح", 
        description: `تمت إضافة المستخدم بنجاح. المعرف المحلي: ${result.local_user?.id || 'غير متاح'}، المعرف الخارجي: ${result.remote_user?.id || 'غير متاح'}` 
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل إضافة المستخدم.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingRoles) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="mr-2">جاري تحميل أنواع المستخدمين...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المستخدم</FormLabel>
              <FormControl>
                <Input placeholder="مثال: أحمد محمد" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input type="email" placeholder="مثال: user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormDescription>يجب أن تكون كلمة المرور 6 أحرف على الأقل.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع المستخدم</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المستخدم" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-muted-foreground">
                          الصلاحيات: {role.permissions.map(p => p.name).join('، ')}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Display selected role permissions */}
        {form.watch('role_id') && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">صلاحيات هذا النوع:</h4>
            <div className="text-sm text-muted-foreground">
              {roles.find(r => r.id === form.watch('role_id'))?.permissions.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {p.name}
                </div>
              )) || 'لا توجد صلاحيات'}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إضافة مستخدم
            </Button>
        </div>
      </form>
    </Form>
  );
}
