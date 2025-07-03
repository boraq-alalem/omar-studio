
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, PlusCircle, UsersRound, Loader2 } from 'lucide-react';
import type { User, UserWithoutSuperAdmin } from '@/types/users';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserForm } from '@/components/users/UserForm';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/endpoints';
import { useRouter } from 'next/navigation';
import { getUsersWithoutSuperAdmin, deleteUser } from '@/lib/api';
import { UsersTable } from '@/components/users/UsersTable';

export function UsersClientPage() {
  const [users, setUsers] = useState<UserWithoutSuperAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithoutSuperAdmin | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { toast } = useToast();
  const { apiUser, isAuthenticated, localToken, remoteToken } = useAuth();
  const router = useRouter();

  const fetchUsers = async () => {
    if (!localToken && !remoteToken) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const usersData = await getUsersWithoutSuperAdmin(localToken || '', remoteToken || '');
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات المستخدمين. تحقق من تسجيل الدخول.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }
    
    // تأخير قصير للتأكد من تحميل token
    const timer = setTimeout(() => {
      fetchUsers();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, router, localToken, remoteToken]);

  const handleDelete = async (userId: number) => {
    if (!localToken && !remoteToken) return;
    
    try {
      setIsDeleting(userId);
      await deleteUser(userId, localToken || '', remoteToken || '');
      toast({
        title: "نجح",
        description: "تم حذف المستخدم بنجاح",
      });
      await fetchUsers(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المستخدم",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };
  
  const openAddUserDialog = () => {
    setSelectedUser(null);
    setIsUserFormOpen(true);
  };

  const openEditUserDialog = (user: UserWithoutSuperAdmin) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };
  
  const onUserFormSubmitSuccess = () => {
    setIsUserFormOpen(false);
    setSelectedUser(null);
    fetchUsers(); // إعادة تحميل قائمة المستخدمين
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
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(4)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {users.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <UsersRound size={48} className="mx-auto mb-2" />
          <p>لا يوجد مستخدمين لعرضهم</p>
          <p className="text-sm mt-2">يمكنك إضافة مستخدمين جدد باستخدام الزر أعلاه</p>
        </div>
      ) : (
        <UsersTable 
          users={users}
          onEdit={openEditUserDialog}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
