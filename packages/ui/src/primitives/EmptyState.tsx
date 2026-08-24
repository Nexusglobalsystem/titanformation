import * as React from "react";
import { cn } from "../lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-DEFAULT border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated text-foreground-muted">
          {icon}
        </span>
      )}
      <p className="font-body text-sm text-foreground-muted">{title}</p>
      {action}
    </div>
  );
}
