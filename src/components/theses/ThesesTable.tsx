"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Download, Eye, Calendar, User, GraduationCap, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Thesis {
  id: number;
  title: string;
  author: string;
  year: number;
  degree: string;
  specialization: string;
  university: string;
  pdf_url?: string;
}

interface ThesesTableProps {
  theses: Thesis[];
  onEdit?: (thesis: Thesis) => void;
  onDelete?: (thesisId: number) => void;
  onView?: (thesis: Thesis) => void;
  className?: string;
}

export function ThesesTable({ theses, onEdit, onDelete, onView, className }: ThesesTableProps) {
  const getDegreeColor = (degree: string) => {
    switch (degree.toLowerCase()) {
      case 'ماجستير':
        return 'from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'دكتوراه':
        return 'from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      default:
        return 'from-gray-500/10 to-gray-600/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className={cn("relative w-full rounded-2xl border border-border/50 bg-card shadow-modern-lg", className)}>
      <div className="w-full mobile-scale">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 md:px-6">
              <div className="flex items-center justify-end gap-1 md:gap-2">
                <span className="text-xs md:text-sm">عنوان الرسالة</span>
                <div className="w-1 h-1 md:w-2 md:h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>المؤلف</span>
                <User className="w-4 h-4 text-green-500" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>السنة</span>
                <Calendar className="w-4 h-4 text-orange-500" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>الدرجة</span>
                <GraduationCap className="w-4 h-4 text-purple-500" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>التخصص</span>
                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <span>الجامعة</span>
                <Building className="w-4 h-4 text-indigo-500" />
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
          {theses.map((thesis, index) => (
            <TableRow key={thesis.id} className="group" style={{ animationDelay: `${index * 0.05}s` }}>
              <TableCell className="max-w-xs px-2 md:px-6">
                <div className="space-y-1 md:space-y-2 text-right">
                  <h4 className="font-semibold text-xs md:text-sm leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {thesis.title}
                  </h4>
                  <div className="flex justify-end">
                    <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-medium text-sm">{thesis.author}</span>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                    {thesis.author.charAt(0).toUpperCase()}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <div className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-orange-500/10 to-yellow-500/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
                    {thesis.year}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Badge className={cn("rounded-xl", getDegreeColor(thesis.degree))}>
                    {thesis.degree}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-muted-foreground max-w-32 truncate text-right" title={thesis.specialization}>
                  {thesis.specialization}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-muted-foreground max-w-32 truncate text-right" title={thesis.university}>
                  {thesis.university}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 justify-end">
                  {onView && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(thesis)}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20"
                      title="عرض"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  {thesis.pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(thesis.pdf_url, '_blank')}
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-900/20"
                      title="تحميل PDF"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(thesis)}
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
                      onClick={() => onDelete(thesis.id)}
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
    </div>
  );
}