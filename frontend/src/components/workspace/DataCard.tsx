import React from "react";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusVariant?: "default" | "success" | "warning" | "error";
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const statusVariants = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-700 border border-green-500/20",
  warning: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  error: "bg-red-500/10 text-red-700 border border-red-500/20",
};

export const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  status,
  statusVariant = "default",
  children,
  className,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border p-4 bg-background/40 hover:bg-background/60 transition-all duration-200 hover:shadow-sm",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{title}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {status && (
          <span
            className={cn(
              "text-xs rounded-full px-2.5 py-1 font-medium whitespace-nowrap flex-shrink-0",
              statusVariants[statusVariant]
            )}
          >
            {status}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};
