"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { UserWithoutSuperAdmin } from '@/types/users';

interface UsersTableProps {
  users: UserWithoutSuperAdmin[];
  onEdit: (user: UserWithoutSuperAdmin) => void;
  onDelete: (userId: number) => void;
  isDeleting: number | null;
}

export function UsersTable({ users, onEdit, onDelete, isDeleting }: UsersTableProps) {
  return (
    <div className="relative w-full rounded-2xl border border-border/50 bg-card shadow-modern-lg">
      <div className="w-full" style={{ transform: 'scale(1)', transformOrigin: 'top right' }}>
        <style jsx>{`
          @media (max-width: 768px) {
            .mobile-scale {
              transform: scale(0.75);
              transform-origin: top right;
            }
          }
        `}</style>
        <Table className="mobile-scale">
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 md:px-6">
                <div className="flex items-center justify-end gap-1 md:gap-2">
                  <span className="text-xs md:text-sm">اسم المستخدم</span>
                  <div className="w-1 h-1 md:w-2 md:h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                </div>
              </TableHead>
              <TableHead className="px-2 md:px-6">
                <div className="flex items-center justify-end gap-1 md:gap-2">
                  <span className="text-xs md:text-sm">البريد</span>
                  <div className="w-1 h-1 md:w-2 md:h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                </div>
              </TableHead>
              <TableHead className="px-2 md:px-6">
                <div className="flex items-center justify-end gap-1 md:gap-2">
                  <span className="text-xs md:text-sm">الدور</span>
                  <div className="w-1 h-1 md:w-2 md:h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
              </TableHead>
              <TableHead className="px-2 md:px-6">
                <div className="flex items-center justify-end gap-1 md:gap-2">
                  <span className="text-xs md:text-sm">إجراءات</span>
                  <div className="w-1 h-1 md:w-2 md:h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id} className="group" style={{ animationDelay: `${index * 0.1}s` }}>
                <TableCell className="px-2 md:px-6">
                  <div className="flex items-center gap-1 md:gap-3">
                    <div className="w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-semibold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-xs md:text-sm truncate">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-2 md:px-6">
                  <div className="flex items-center gap-1 md:gap-2">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"/>
                    </svg>
                    <span className="text-muted-foreground text-xs md:text-sm truncate">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell className="px-2 md:px-6">
                  <div className="inline-flex items-center px-2 md:px-3 py-1 rounded-lg md:rounded-xl text-xs font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                    <span className="truncate">{user.roles.length > 0 ? user.roles[0].name : 'دور'}</span>
                  </div>
                </TableCell>
                <TableCell className="px-2 md:px-6">
                  <div className="flex gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                      disabled={isDeleting === user.id}
                      className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDeleting === user.id}
                          className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          {isDeleting === user.id ? (
                            <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                            تأكيد الحذف
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-base">
                            هل أنت متأكد من حذف المستخدم "{user.name}"؟ هذه العملية لا يمكن التراجع عنها.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(user.id)}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}