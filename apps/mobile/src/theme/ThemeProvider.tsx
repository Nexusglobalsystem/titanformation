import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "nativewind";
import { darkTheme, lightTheme, type AppTheme } from "./tokens";

interface ThemeContextValue {
  theme: AppTheme;
  scheme: "light" | "dark";
  setScheme: (scheme: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Les classes NativeWind (bg-background, text-accent-text, ...) suivent déjà
// le mode clair/sombre via .dark:root dans global.css — ce contexte ne sert
// qu'aux cas que les classes ne couvrent pas (icônes, styles inline, PDF).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const scheme: "light" | "dark" = colorScheme === "dark" ? "dark" : "light";

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: scheme === "dark" ? darkTheme : lightTheme,
      scheme,
      setScheme: setColorScheme,
    }),
    [scheme, setColorScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme doit être utilisé sous ThemeProvider.");
  }
  return ctx;
}
