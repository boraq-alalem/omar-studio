"use client";

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Edit, Trash2, Calendar, User, GraduationCap, Building, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReservedTitle {
  id: number;
  title: string;
  student_name: string;
  supervisor_name: string;
  degree: string;
  specialization: string;
  university: string;
  reservation_date: string;
  status?: string;
}

interface ReservedTitlesTableProps {
  titles: ReservedTitle[];
  onEdit?: (title: ReservedTitle) => void;
  onDelete?: (titleId: number) => void;
  className?: string;
}

export function ReservedTitlesTable({ titles, onEdit, onDelete, className }: ReservedTitlesTableProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-SA');
    } catch {
      return dateString;
    }
  };

  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {titles.map((title, index) => (
          <Card key={title.id} className="p-4 rounded-2xl border border-border/50 bg-card shadow-modern-lg" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-base leading-tight line-clamp-2 text-right">
                  {title.title}
                </h4>
                <div className="flex justify-end">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-muted-foreground font-medium text-xs">الطالب:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                      {title.student_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm truncate">{title.student_name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-muted-foreground font-medium text-xs">المشرف:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                      {title.supervisor_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm truncate">{title.supervisor_name}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium text-xs">الدرجة:</span>
                  <Badge className={cn("rounded-xl text-xs", getDegreeColor(title.degree))}>
                    {title.degree}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground font-medium text-xs">التخصص:</span>
                  <p className="text-sm font-medium truncate" title={title.specialization}>{title.specialization}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium text-xs">الجامعة:</span>
                  <p className="text-sm font-medium truncate" title={title.university}>{title.university}</p>
                </div>
              </div>
              
              {(onEdit || onDelete) && (
                <div className="flex gap-2 pt-3 border-t border-border/30">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(title)}
                      className="flex-1 h-9 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(title.id)}
                      className="flex-1 h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      حذف
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full overflow-auto rounded-2xl border border-border/50 bg-card shadow-modern-lg", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center justify-end gap-2">
                  <span>العنوان المحجوز</span>
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center justify-end gap-2">
                  <span>اسم الطالب</span>
                  <User className="w-4 h-4 text-green-500" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center justify-end gap-2">
                  <span>المشرف</span>
                  <User className="w-4 h-4 text-blue-500" />
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
                  <span>تاريخ الحجز</span>
                  <Calendar className="w-4 h-4 text-orange-500" />
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
            {titles.map((title, index) => (
              <TableRow key={title.id} className="group" style={{ animationDelay: `${index * 0.05}s` }}>
                <TableCell className="max-w-xs">
                  <div className="space-y-2 text-right">
                    <h4 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {title.title}
                    </h4>
                    <div className="flex justify-end">
                      <div className="h-1 w-12 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-medium text-sm">{title.student_name}</span>
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                      {title.student_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-medium text-sm">{title.supervisor_name}</span>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                      {title.supervisor_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Badge className={cn("rounded-xl", getDegreeColor(title.degree))}>
                      {title.degree}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-muted-foreground max-w-32 truncate text-right" title={title.specialization}>
                    {title.specialization}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-muted-foreground max-w-32 truncate text-right" title={title.university}>
                    {title.university}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-medium">{formatDate(title.reservation_date)}</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 justify-end">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(title)}
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
                        onClick={() => onDelete(title.id)}
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