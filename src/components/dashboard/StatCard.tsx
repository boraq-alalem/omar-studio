
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, description, className }: StatCardProps) => {
  return (
    <Card className={`card-modern shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium font-headline text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">
          {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors flex items-center gap-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
            {description}
          </div>
        )}
        {/* Decorative gradient line */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </CardContent>
    </Card>
  );
};
