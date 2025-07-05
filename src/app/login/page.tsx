"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { login } from '@/lib/authService';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح." }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { setApiUser, updateTokens } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      
      // Update auth context with user and tokens
      setApiUser(result.user);
      updateTokens(result.localToken, result.remoteToken);
      
      // Check if user has writer-titles role
      const hasWriterTitlesRole = result.user.roles.some(role => role.name === 'writer-titles');
      
      if (hasWriterTitlesRole && !result.localToken) {
        toast({ 
          title: "نجح تسجيل الدخول", 
          description: `مرحباً ${result.user.name} - تم تسجيل الدخول مباشرة (مستخدم writer-titles)` 
        });
      } else {
        toast({ 
          title: "نجح تسجيل الدخول", 
          description: `مرحباً ${result.user.name}` 
        });
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "فشل تسجيل الدخول.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden mobile-padding">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      
      <Card className="w-full max-w-md card-modern shadow-modern-lg animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
            </svg>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            تسجيل الدخول
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            أدخل بياناتك للوصول إلى نظام المكتبة المركزية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground">البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="email" 
                          placeholder="مثال: user@example.com" 
                          className="h-12 pl-12 pr-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          {...field} 
                        />
                        <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"/>
                        </svg>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground">كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="password" 
                          placeholder="********" 
                          className="h-12 pl-12 pr-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          {...field} 
                        />
                        <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                        </svg>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium btn-gradient rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <LogIn className="ml-2 h-5 w-5" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce-gentle"></div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300">بيانات تجريبية</h4>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">البريد:</span>
                <code className="bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded text-xs">boraq@gmail.com</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">كلمة المرور:</span>
                <code className="bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded text-xs">11223344</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}