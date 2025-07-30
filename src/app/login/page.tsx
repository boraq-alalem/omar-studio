"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const storedAttempts = localStorage.getItem('failedAttempts');
    const storedLockoutEnd = localStorage.getItem('lockoutEndTime');

    if (storedAttempts) {
      setFailedAttempts(parseInt(storedAttempts, 10));
    }
    if (storedLockoutEnd) {
      const endTime = parseInt(storedLockoutEnd, 10);
      if (endTime > Date.now()) {
        setLockoutEndTime(endTime);
      } else {
        // If lockout time has passed, clear storage
        localStorage.removeItem('lockoutEndTime');
        localStorage.removeItem('failedAttempts');
        setFailedAttempts(0);
        setLockoutEndTime(null);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutEndTime) {
      const calculateRemainingTime = () => {
        const now = Date.now();
        const timeDiff = lockoutEndTime - now;
        if (timeDiff <= 0) {
          setLockoutEndTime(null);
          setFailedAttempts(0);
          setRemainingTime(0);
          localStorage.removeItem('lockoutEndTime');
          localStorage.removeItem('failedAttempts');
          clearInterval(timer);
        } else {
          const minutes = Math.floor(timeDiff / (1000 * 60));
          const seconds = Math.ceil((timeDiff % (1000 * 60)) / 1000);
          setRemainingTime(minutes * 60 + seconds); // Store total seconds for easier display logic
        }
      };

      calculateRemainingTime(); // Initial calculation
      timer = setInterval(calculateRemainingTime, 1000);
    }

    return () => clearInterval(timer);
  }, [lockoutEndTime]);

  const handleLoginAttempt = useCallback(async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      
      // On successful login, reset failed attempts and lockout
      localStorage.removeItem('failedAttempts');
      localStorage.removeItem('lockoutEndTime');
      setFailedAttempts(0);
      setLockoutEndTime(null);

      setApiUser(result.user);
      updateTokens(result.localToken, result.remoteToken);
      
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
      
      router.push('/dashboard');
    } catch (error: any) {
      let errorMsg = error?.message || "فشل تسجيل الدخول.";
      
      // Increment failed attempts on failure
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      localStorage.setItem('failedAttempts', newFailedAttempts.toString());

      if (newFailedAttempts >= 5) {
        const lockoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
        const newLockoutEndTime = Date.now() + lockoutDuration;
        setLockoutEndTime(newLockoutEndTime);
        localStorage.setItem('lockoutEndTime', newLockoutEndTime.toString());
        errorMsg = `لقد تجاوزت الحد الأقصى للمحاولات. يرجى المحاولة مرة أخرى بعد 10 دقائق.`;
      } else if (errorMsg.includes("يرجى إدخال معلومات صحيحة") || errorMsg.includes("Invalid credentials") || errorMsg.includes("unauthorized") || errorMsg.includes("401")) {
        errorMsg = `بيانات الدخول غير صحيحة. لديك ${5 - newFailedAttempts} محاولات متبقية.`;
      }
      
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [failedAttempts, setApiUser, updateTokens, toast, router]);

  const onSubmit = useCallback(async (data: LoginFormValues) => {
    if (lockoutEndTime && lockoutEndTime > Date.now()) {
      toast({
        title: "محاولات متكررة",
        description: `يرجى الانتظار ${Math.floor(remainingTime / 60)} دقيقة و ${remainingTime % 60} ثانية قبل المحاولة مرة أخرى.`,
        variant: "destructive",
      });
      return;
    }
    await handleLoginAttempt(data);
  }, [lockoutEndTime, handleLoginAttempt, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden mobile-padding">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800" />
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
                          disabled={!!lockoutEndTime}
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
                          disabled={!!lockoutEndTime}
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
              {lockoutEndTime && remainingTime > 0 && (
                <p className="text-red-500 text-center text-sm">
                  تم قفل تسجيل الدخول. يرجى المحاولة مرة أخرى بعد {Math.floor(remainingTime / 60)} دقيقة و {remainingTime % 60} ثانية.
                </p>
              )}
              {!lockoutEndTime && failedAttempts > 0 && (
                <p className="text-orange-500 text-center text-sm">
                  لديك {5 - failedAttempts} محاولات متبقية قبل القفل.
                </p>
              )}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium btn-gradient rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isSubmitting || !!lockoutEndTime}
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
        </CardContent>
      </Card>
    </div>
  );
}