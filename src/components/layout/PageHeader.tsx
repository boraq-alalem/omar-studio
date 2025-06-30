
import type React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const PageHeader = ({ title, description, children }: PageHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl blur-2xl"></div>
        <div className="relative bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  {description}
                </p>
              )}
            </div>
            {children && (
              <div className="flex items-center gap-2 flex-wrap">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
