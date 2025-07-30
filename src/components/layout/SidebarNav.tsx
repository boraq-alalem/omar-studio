
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookMarked, Archive, Building2, FileLock2, Cog, UsersRound } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Navigation items with their required permissions
const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, permission: null }, // Always visible
  { href: '/theses', label: 'الرسائل', icon: BookMarked, permission: 'الرسائل' },
  { href: '/archive', label: 'الأرشيف', icon: Archive, permission: 'الرسائل' },
  { href: '/universities', label: 'الجامعات والتخصصات', icon: Building2, permission: 'إضافة الجامعات والتعديل عليها' },
  { href: '/manage-data', label: 'إدارة البيانات', icon: Cog, permission: 'إضافة الجامعات والتعديل عليها' },
  { href: '/reserved-titles', label: 'العناوين المحجوزة', icon: FileLock2, permission: 'العناوين محجوزة' },
  { href: '/users', label: 'إدارة المستخدمين', icon: UsersRound, permission: 'إضافة مستخدمين' },
];

// { href: '/settings', label: 'الإعدادات', icon: Cog }, // Future enhancement

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, apiUser } = useAuth();

  // Get user permissions
  const userPermissions = apiUser?.permissions || currentUser?.permissions || [];
  
  // Filter navigation items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (!item.permission) return true; // Always show items without permission requirement
    return userPermissions.includes(item.permission);
  });


  return (
    <SidebarMenu className="space-y-2">
      {visibleNavItems.map((item, index) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <SidebarMenuItem key={item.href} className="animate-fade-in">
            <Link href={item.href}>
              <SidebarMenuButton
                variant="default"
                className={cn(
                  'w-full justify-start h-12 rounded-xl transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25 hover:shadow-xl hover:shadow-sidebar-primary/30'
                    : 'hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:scale-[1.02] hover:shadow-md',
                  'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700'
                )}
                tooltip={item.label}
                isActive={isActive}
              >
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-sidebar-accent/30 text-sidebar-foreground/70 group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground'
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="truncate font-medium text-sm group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full group-data-[collapsible=icon]:hidden" />
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
