"use client";
import { useState } from "react";
export function LessonFocus() {
  const [focused, setFocused] = useState(false);
  return (
    <button
      type="button"
      className="focus-toggle"
      aria-pressed={focused}
      onClick={() => setFocused(!focused)}
    >
      <span aria-hidden="true">{focused ? "↙" : "↗"}</span>
      {focused ? "Quitter le mode concentration" : "Mode concentration"}
    </button>
  );
}
