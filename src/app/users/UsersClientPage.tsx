
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, PlusCircle, UsersRound, Loader2 } from 'lucide-react';
import type { User } from '@/types/users';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserForm } from '@/components/users/UserForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function UsersClientPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const { toast } = useToast();
  const { apiUser, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // For now, we'll show a placeholder since the API doesn't have a users list endpoint
    setIsLoading(false);
  }, [isAuthenticated, router]);

  // Delete functionality not implemented yet
  const handleDelete = async (userId: number) => {
    toast({ 
      title: "تنبيه", 
      description: "حذف المستخدمين غير متاح حالياً.", 
      variant: "destructive" 
    });
  };
  
  const openAddUserDialog = () => {
    setSelectedUser(null);
    setIsUserFormOpen(true);
  };

  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };
  
  const onUserFormSubmitSuccess = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    // Refresh would go here when API supports user listing
  };

  const canManageUsers = useMemo(() => 
    apiUser?.permissions.includes('إضافة مستخدمين'), 
    [apiUser]
  );

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (!canManageUsers && !isLoading) {
    return (
      <div className="text-center py-10 text-destructive">
        <UsersRound size={48} className="mx-auto mb-2" />
        <p>ليس لديك الصلاحية لعرض هذه الصفحة.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
        </div>
        <Card>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddUserDialog} disabled={!canManageUsers || isLoading}>
              <PlusCircle className="ml-2 h-5 w-5" />
              إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">
                {selectedUser ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
              </DialogTitle>
            </DialogHeader>
            <UserForm
              initialData={selectedUser}
              onSuccess={onUserFormSubmitSuccess}
              onCancel={() => setIsUserFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-center py-10 text-muted-foreground">
        <UsersRound size={48} className="mx-auto mb-2" />
        <p>قائمة المستخدمين ستظهر هنا بعد تطبيق API عرض المستخدمين.</p>
        <p className="text-sm mt-2">يمكنك إضافة مستخدمين جدد باستخدام الزر أعلاه.</p>
      </div>
    </div>
  );
}
