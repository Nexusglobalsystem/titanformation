"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "../lib/cn";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toInitialHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  const paragraphs = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`);
  return paragraphs.join("") || "<p></p>";
}

function IconBold() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4h6.5a3.5 3.5 0 0 1 0 7H7V4Zm0 7h7a3.5 3.5 0 0 1 0 7H7v-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconItalic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 4h7M7 20h7M14 4 10 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconBulletList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="4.5" cy="6" r="1.3" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1.3" fill="currentColor" />
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconNumberedList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <text x="1.5" y="8" fontSize="6.5" fill="currentColor" stroke="none">
        1
      </text>
      <text x="1.5" y="14" fontSize="6.5" fill="currentColor" stroke="none">
        2
      </text>
      <text x="1.5" y="20" fontSize="6.5" fill="currentColor" stroke="none">
        3
      </text>
    </svg>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active ? "bg-accent text-on-accent" : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export interface RichTextEditorProps {
  name: string;
  defaultValue?: string | null;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id?: string;
}

export function RichTextEditor({ name, defaultValue, label, hint, error, required, id }: RichTextEditorProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const [html, setHtml] = React.useState(() => toInitialHtml(defaultValue ?? ""));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
    ],
    content: html,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        id: inputId,
        "aria-describedby": cn(hintId, errorId) || "",
        "aria-invalid": error ? "true" : "false",
      },
    },
  });

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-body text-sm font-medium text-foreground">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <input type="hidden" name={name} value={html} />
      <div
        className={cn(
          "rounded border border-border bg-surface transition-[border-color,box-shadow]",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent",
          error && "border-error focus-within:border-error focus-within:ring-error",
        )}
      >
        <div className="flex items-center gap-1 border-b border-border px-2 py-1">
          <ToolbarButton
            label="Gras"
            active={Boolean(editor?.isActive("bold"))}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <IconBold />
          </ToolbarButton>
          <ToolbarButton
            label="Italique"
            active={Boolean(editor?.isActive("italic"))}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <IconItalic />
          </ToolbarButton>
          <ToolbarButton
            label="Liste à puces"
            active={Boolean(editor?.isActive("bulletList"))}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <IconBulletList />
          </ToolbarButton>
          <ToolbarButton
            label="Liste numérotée"
            active={Boolean(editor?.isActive("orderedList"))}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <IconNumberedList />
          </ToolbarButton>
        </div>
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-32 [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:font-body [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-foreground [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0"
        />
      </div>
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
}
