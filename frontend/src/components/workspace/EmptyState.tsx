import React from "react";
import { LucideIcon, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Package,
  title,
  message,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border p-8 text-center bg-muted/20",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-full bg-muted/50">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
        {title && (
          <p className="font-medium text-foreground">{title}</p>
        )}
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
    </div>
  );
};
