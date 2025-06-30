"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, BookOpen, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Specialization {
  id: number;
  name: string;
}

interface University {
  id: number;
  name: string;
  specializations: Specialization[];
  location?: string;
  established_year?: number;
}

interface UniversitiesTableProps {
  universities: University[];
  onAddSpecialization?: (university: University) => void;
  onEdit?: (university: University) => void;
  onDelete?: (universityId: number) => void;
  className?: string;
}

export function UniversitiesTable({ 
  universities, 
  onAddSpecialization, 
  onEdit, 
  onDelete, 
  className 
}: UniversitiesTableProps) {
  
  const getSpecializationCount = (count: number) => {
    if (count === 0) return 'لا توجد تخصصات';
    if (count === 1) return 'تخصص واحد';
    if (count === 2) return 'تخصصان';
    if (count <= 10) return `${count} تخصصات`;
    return `${count} تخصص`;
  };

  const getCountColor = (count: number) => {
    if (count === 0) return 'from-gray-500/10 to-gray-600/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    if (count <= 5) return 'from-yellow-500/10 to-amber-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
    if (count <= 10) return 'from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    return 'from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
  };

  return (
    <div className={cn("relative w-full overflow-auto rounded-2xl border border-border/50 bg-card shadow-modern-lg", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>اسم الجامعة</span>
                <Building className="w-4 h-4 text-blue-500" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>عدد التخصصات</span>
                <BookOpen className="w-4 h-4 text-green-500" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>التخصصات</span>
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>الإجراءات</span>
                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {universities.map((university, index) => (
            <TableRow key={university.id} className="group" style={{ animationDelay: `${index * 0.05}s` }}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {university.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {university.name}
                    </h4>
                    {university.location && (
                      <p className="text-xs text-muted-foreground">{university.location}</p>
                    )}
                    <div className="h-1 w-8 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={cn("rounded-xl font-semibold", getCountColor(university.specializations.length))}>
                  {getSpecializationCount(university.specializations.length)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="max-w-md">
                  {university.specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {university.specializations.slice(0, 3).map((spec) => (
                        <span
                          key={spec.id}
                          className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                        >
                          {spec.name}
                        </span>
                      ))}
                      {university.specializations.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                          +{university.specializations.length - 3} أخرى
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">لا توجد تخصصات</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {onAddSpecialization && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddSpecialization(university)}
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-900/20"
                      title="إضافة تخصص"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(university)}
                      className="h-8 w-8 p-0 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-600 dark:hover:bg-yellow-900/20"
                      title="تعديل"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(university.id)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20"
                      title="حذف"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}