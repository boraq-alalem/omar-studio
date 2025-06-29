
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
    <SidebarMenu>
      {visibleNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              variant="default"
              className={cn(
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'w-full justify-start'
              )}
              tooltip={item.label}
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate font-headline">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
