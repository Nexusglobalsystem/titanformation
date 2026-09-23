"use client";

import { useSyncExternalStore } from "react";

const storageKey = "titan-campus-theme";
const changeEvent = "titan-palette-change";

function subscribe(onChange: () => void) {
  window.addEventListener(changeEvent, onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey && event.key !== null) return;
    document.documentElement.dataset.campusTheme =
      event.newValue === "light" ? "light" : "dark";
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function PaletteToggle() {
  const light = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.campusTheme === "light",
    () => false,
  );

  function toggle() {
    const theme = light ? "dark" : "light";
    document.documentElement.dataset.campusTheme = theme;
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // The palette still works when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  return (
    <button
      type="button"
      className="campus-palette-toggle"
      aria-label="Palette claire"
      aria-pressed={light}
      title={light ? "Passer à la palette sombre" : "Passer à la palette claire"}
      onClick={toggle}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </svg>
      <span>Palette claire</span>
    </button>
  );
}
