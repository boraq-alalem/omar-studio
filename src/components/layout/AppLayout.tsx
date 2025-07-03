
"use client";

import type React from 'react';
import Link from 'next/link'; // Added Link import
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun, UserCircle } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileBottomNav } from './MobileBottomNav';

function AppHeader() {
  const { toggleSidebar, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { currentUser, apiUser, logout, isLoading } = useAuth(); // Get currentUser and logout from useAuth
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN); // تحويل المستخدم إلى صفحة تسجيل الدخول مباشرة
    // router.refresh(); // لم نعد بحاجة إلى تحديث الصفحة لأننا سنتحول إلى صفحة تسجيل الدخول
  };
  
  const userDisplayName = apiUser?.name || currentUser?.fullName || currentUser?.username || 'المستخدم';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 sm:h-18 items-center justify-between mobile-padding max-w-none">
        <div className="flex items-center gap-4">
          <SidebarTrigger className={`${isMobile ? 'flex' : 'md:hidden'} h-9 w-9 rounded-xl hover:bg-accent/50 transition-colors`} />
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-foreground/80">المكتبة المركزية</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            className="h-9 w-9 rounded-xl hover:bg-accent/50 transition-all duration-200 hover:scale-105"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {isLoading ? (
            <Skeleton className="h-9 w-24 rounded-xl" />
          ) : (currentUser || apiUser) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-9 rounded-xl hover:bg-accent/50 transition-all duration-200">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <UserCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:inline font-medium text-sm">{userDisplayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl border-border/50 shadow-modern-lg">
                <DropdownMenuItem disabled className="flex flex-col items-start !opacity-100 p-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-base">{userDisplayName}</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {apiUser?.roles?.[0]?.name || currentUser?.role || 'مستخدم'}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="rounded-lg mx-2 mb-1">
                  <Link href="/profile" className="flex items-center gap-3 p-3">
                    <UserCircle className="h-4 w-4" />
                    <span>ملفي الشخصي</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg mx-2 mb-2 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20">
                  <div className="flex items-center gap-3 p-1">
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button variant="outline" className="rounded-xl">تسجيل الدخول</Button>
          )}
        </div>
      </div>
    </header>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: isAuthLoading } = useAuth();

  // If auth is still loading, we might want to show a full page loader
  // or let the AuthProvider handle it. Here, we just check for AppHeader.
  // The AuthProvider itself already has a loading state.

  return (
      <SidebarProvider defaultOpen={true}>
        <Sidebar side="right" collapsible="icon" variant="sidebar" className="border-l border-border/50">
          <SidebarHeader className="p-6 flex items-center gap-4 justify-center border-b border-sidebar-border/50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10">
              <svg className="w-6 h-6 text-white group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <h1 className="font-headline text-xl font-bold text-sidebar-foreground">العالم</h1>
              <p className="text-xs text-sidebar-foreground/60 mt-1">المكتبة المركزية</p>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border/50 group-data-[collapsible=icon]:hidden">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sidebar-foreground/60">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">متصل بالخادم</span>
              </div>
              <p className="text-xs text-sidebar-foreground/50">
                &copy; {new Date().getFullYear()} جميع الحقوق محفوظة
              </p>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col min-h-screen bg-gradient-to-br from-background to-background/95">
          <AppHeader />
          <main className="flex-1 mobile-padding py-6 pb-20 md:pb-6 overflow-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
          <MobileBottomNav />
        </SidebarInset>
      </SidebarProvider>
  );
}
