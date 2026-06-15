import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-700 border border-green-500/20",
  warning: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  error: "bg-red-500/10 text-red-700 border border-red-500/20",
  info: "bg-blue-500/10 text-blue-700 border border-blue-500/20",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = "default",
  className,
}) => {
  return (
    <span
      className={cn(
        "text-xs rounded-full px-2.5 py-1 font-medium capitalize",
        variantStyles[variant],
        className
      )}
    >
      {status}
    </span>
  );
};
