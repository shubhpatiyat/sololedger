import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  manageLink?: string;
  manageLinkText?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon: Icon,
  manageLink,
  manageLinkText = "Manage",
  children,
  className,
  contentClassName,
}) => {
  return (
    <Card className={cn("border-border bg-card shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {title}
          </CardTitle>
          {manageLink && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Link to={manageLink}>{manageLinkText}</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-3 max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};
