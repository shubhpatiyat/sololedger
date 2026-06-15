import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  meta?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  meta,
  icon: Icon,
  trend,
  className,
}) => {
  return (
    <Card
      className={cn(
        "border-border bg-card hover:shadow-md transition-all duration-300 hover:scale-[1.02] group",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {(meta || trend) && (
            <div className="flex items-center gap-2">
              {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    trend.isPositive
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  )}
                >
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
