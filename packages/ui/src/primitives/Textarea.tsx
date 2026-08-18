import * as React from "react";
import { cn } from "../lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, id, error, label, hint, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-body text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "rounded border border-border bg-surface px-3 py-2 font-body text-sm text-foreground placeholder:text-foreground-muted",
            "outline-none transition-[border-color,box-shadow] focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus-visible:border-error focus-visible:ring-error",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="font-body text-xs text-foreground-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="font-body text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
