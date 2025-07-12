import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/app/admin/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  description?: string;
  className?: string;
  trend?: {
    value: number;
    label: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  loading = false,
  iconBg = 'bg-zinc-800/60',
  className,
  trend,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4 mt-1 mb-2" />
          {description && <Skeleton className="h-4 w-full mt-2" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-8 w-8 flex items-center justify-center rounded-md ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            "text-xs mt-1 flex items-center",
            trend.type === 'increase' ? 'text-green-500' : 
            trend.type === 'decrease' ? 'text-red-500' : 'text-amber-500'
          )}>
            {trend.type === 'increase' ? '↑' : trend.type === 'decrease' ? '↓' : '→'}
            <span className="ml-1">{trend.value}% {trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
