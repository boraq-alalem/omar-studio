"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size]
      )} />
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
  rows?: number;
}

export function LoadingCard({ className, rows = 3 }: LoadingCardProps) {
  return (
    <Card className={cn("card-modern animate-pulse", className)}>
      <CardContent className="p-6 space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4 rounded-lg" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn("card-modern", className)}>
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          {icon ? (
            <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center">
              {icon}
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
              </svg>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <div className="pt-2">
              {action}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PageLoadingProps {
  title?: string;
  description?: string;
}

export function PageLoading({ title = "جاري التحميل...", description }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
          <LoadingSpinner size="lg" className="text-white" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
    </div>
  );
}