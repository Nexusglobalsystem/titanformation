import * as React from "react";
import { cn } from "../lib/cn";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, label, className, ...props }, ref) => {
    const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props}>
        {label && (
          <div className="flex items-center justify-between font-body text-xs text-foreground-muted">
            <span>{label}</span>
            <span className="font-mono-label tabular-nums">{Math.round(pct)}%</span>
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-full bg-surface-zebra"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 dark:bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  },
);
Progress.displayName = "Progress";
