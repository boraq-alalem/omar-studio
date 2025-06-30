"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookMarked, Archive, Building2, FileLock2, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard, permission: null },
  { href: '/theses', label: 'الرسائل', icon: BookMarked, permission: 'الرسائل' },
  { href: '/archive', label: 'الأرشيف', icon: Archive, permission: 'الرسائل' },
  { href: '/universities', label: 'الجامعات', icon: Building2, permission: 'إضافة الجامعات والتعديل عليها' },
  { href: '/reserved-titles', label: 'المحجوزة', icon: FileLock2, permission: 'العناوين محجوزة' },
  { href: '/users', label: 'المستخدمين', icon: UsersRound, permission: 'إضافة مستخدمين' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser, apiUser } = useAuth();

  // Get user permissions
  const userPermissions = apiUser?.permissions || currentUser?.permissions || [];
  
  // Filter navigation items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  }).slice(0, 5); // Limit to 5 items for mobile

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px]',
                isActive
                  ? 'bg-gradient-to-t from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg transition-all duration-200',
                isActive 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-transparent'
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium mt-1 truncate w-full text-center">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}