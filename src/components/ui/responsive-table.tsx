"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  emptyMessage = "لا توجد بيانات للعرض",
  loading = false,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-modern animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg w-1/4"></div>
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg w-1/3"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg w-1/3"></div>
                  <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg w-1/2"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg w-1/5"></div>
                  <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg w-2/3"></div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={cn("card-modern", className)}>
        <CardContent className="p-12 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">لا توجد بيانات</h3>
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {data.map((item, index) => (
          <Card key={index} className="card-modern hover:shadow-modern-lg transition-all duration-300 hover:scale-[1.02] group">
            <CardContent className="p-5">
              <div className="space-y-4">
                {columns.map((column, colIndex) => {
                  const value = item[column.key];
                  const displayValue = column.render ? column.render(value, item) : value;
                  
                  return (
                    <div key={String(column.key)} className="flex justify-between items-start gap-3 py-2 border-b border-border/20 last:border-b-0">
                      <span className="text-sm font-semibold text-muted-foreground min-w-0 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {column.mobileLabel || column.label}:
                      </span>
                      <div className="text-sm text-right min-w-0 flex-1 font-medium">
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 h-1 w-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full overflow-auto rounded-2xl border border-border/50 bg-card shadow-modern-lg", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <tr className="border-b border-border/50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "h-14 px-6 text-right align-middle font-semibold text-foreground/80 first:rounded-tr-2xl last:rounded-tl-2xl",
                  column.className
                )}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>{column.label}</span>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className="border-b border-border/30 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 hover:shadow-sm group"
            >
              {columns.map((column) => {
                const value = item[column.key];
                const displayValue = column.render ? column.render(value, item) : value;
                
                return (
                  <td
                    key={String(column.key)}
                    className={cn(
                      "p-6 align-middle text-right text-sm font-medium group-hover:text-foreground transition-colors",
                      column.className
                    )}
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}