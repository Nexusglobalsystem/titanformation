/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-text": "rgb(var(--color-accent-text) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        "foreground-muted": "rgb(var(--color-foreground-muted) / <alpha-value>)",
        zebra: "rgb(var(--color-zebra) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        "success-bg": "rgb(var(--color-success-bg) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        "warning-bg": "rgb(var(--color-warning-bg) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        "error-bg": "rgb(var(--color-error-bg) / <alpha-value>)",
      },
      spacing: {
        gutter: "24px",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      fontFamily: {
        // Mêmes noms d'utilitaires que apps/web/src/app/globals.css
        // (font-display/font-body/font-mono-label). RN charge des polices
        // statiques par graisse (pas de variable font + font-weight libre
        // comme sur le web) — poids par défaut le plus courant ici ;
        // d'autres graisses s'ajoutent à la demande (ex. font-display-bold).
        display: ["HankenGrotesk_600SemiBold"],
        body: ["Manrope_400Regular"],
        "mono-label": ["GeistMono_500Medium"],
      },
    },
  },
  plugins: [],
};
