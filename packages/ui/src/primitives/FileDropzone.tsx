"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface FileDropzoneProps {
  name: string;
  accept?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

function IconUploadCloud() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 17.5a4 4 0 0 1-1-7.87 5 5 0 0 1 9.6-1.66A4.5 4.5 0 0 1 17 17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12v7M9 15.5 12 12l3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FileDropzone({ name, accept, label, hint, required, className }: FileDropzoneProps) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  function applyFiles(files: FileList | null) {
    if (files && files.length > 0) setFileName(files[0].name);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="font-body text-sm font-medium text-foreground">
          {label}
          {required && " *"}
        </label>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          if (inputRef.current) inputRef.current.files = e.dataTransfer.files;
          applyFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-4 py-6 text-center transition-colors",
          isDragActive ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-accent/40",
        )}
      >
        <span className="text-foreground-muted">
          <IconUploadCloud />
        </span>
        {fileName ? (
          <p className="font-body text-sm text-foreground">{fileName}</p>
        ) : (
          <p className="font-body text-xs text-foreground-muted">
            Glissez un fichier ici ou <span className="text-accent-text underline">cliquez pour parcourir</span>
          </p>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          required={required}
          className="sr-only"
          onChange={(e) => applyFiles(e.target.files)}
        />
      </div>
      {hint && <p className="font-body text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}
