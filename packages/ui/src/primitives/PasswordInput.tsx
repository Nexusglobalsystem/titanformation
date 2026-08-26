"use client";

import * as React from "react";
import { Input, type InputProps } from "./Input";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.4 4.3M6.7 6.7C4 8.5 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.2 3.5-.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "type" | "endAdornment">>(
  (props, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        endAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={visible}
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted transition-colors hover:text-foreground"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";
