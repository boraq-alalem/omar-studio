
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
import { Skeleton } from '@/components/ui/skeleton';

function AppHeader() {
  const { toggleSidebar, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { currentUser, apiUser, logout, isLoading } = useAuth(); // Get currentUser and logout from useAuth
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // router.push('/login'); // Redirect to login page after logout - if you have one
    router.refresh(); // Refresh to reflect logged out state
  };
  
  const userDisplayName = apiUser?.name || currentUser?.fullName || currentUser?.username || 'المستخدم';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-none">
        <div className="flex items-center">
          <SidebarTrigger className={isMobile ? 'flex' : 'md:hidden'} />
          <div className="hidden md:block">
            {/* Potentially breadcrumbs or page title here */}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-md" />
          ) : (currentUser || apiUser) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-3">
                  <UserCircle className="h-6 w-6" />
                  <span className="hidden md:inline font-medium">{userDisplayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled className="flex flex-col items-start !opacity-100">
                  <span className="font-semibold">{userDisplayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {apiUser?.roles?.[0]?.name || currentUser?.role || 'مستخدم'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>ملفي الشخصي</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button variant="outline">تسجيل الدخول</Button> // Placeholder for login
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
        <Sidebar side="right" collapsible="icon" variant="sidebar">
          <SidebarHeader className="p-6 flex items-center gap-3 justify-center">
             <Image src="https://placehold.co/40x40.png" alt="Al-Alem Logo" width={40} height={40} className="rounded-full" data-ai-hint="logo book" />
            <h1 className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">العالم</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-sidebar-foreground/70 text-center">
              &copy; {new Date().getFullYear()} المكتبة المركزية
            </p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
