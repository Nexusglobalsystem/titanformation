/**
 * Source de vérité JS des tokens — pour tout ce que les classes NativeWind
 * ne couvrent pas (couleur d'icône, styles inline, génération HTML
 * expo-print). Mêmes valeurs que global.css ; garder les deux synchronisés
 * si un token change (portage manuel de packages/ui/src/tokens/tokens.css).
 */

interface SemanticColor {
  fg: string;
  bg: string;
}

export interface AppColors {
  primary: string;
  accent: string;
  accentText: string;
  danger: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  foreground: string;
  foregroundMuted: string;
  zebra: string;
  success: SemanticColor;
  warning: SemanticColor;
  error: SemanticColor;
}

export interface AppTheme {
  scheme: "light" | "dark";
  colors: AppColors;
  spacing: (n: number) => number;
  gutter: number;
  radii: { sm: number; DEFAULT: number; md: number; lg: number; xl: number; full: number };
  typography: {
    display: string;
    body: string;
    monoLabel: string;
  };
}

const spacingUnit = 4;
const spacing = (n: number) => n * spacingUnit;

const radii = { sm: 2, DEFAULT: 4, md: 6, lg: 8, xl: 12, full: 9999 };

// Familles chargées au lot 0.4 (@expo-google-fonts/*) ; en attendant,
// react-native retombe sur la police système, aucune erreur.
const typography = {
  display: "HankenGrotesk_600SemiBold",
  body: "Manrope_400Regular",
  monoLabel: "GeistMono_500Medium",
};

export const lightTheme: AppTheme = {
  scheme: "light",
  colors: {
    primary: "#003366",
    accent: "#D4AF37",
    accentText: "#7A5E1D",
    danger: "#B3261E",
    background: "#f8f9fa",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    border: "#dde3ea",
    foreground: "#0b1c30",
    foregroundMuted: "#4b5b6e",
    zebra: "#f2f4f7",
    success: { fg: "#1b7a43", bg: "#e5f4ea" },
    warning: { fg: "#8a5a00", bg: "#fdf1dc" },
    error: { fg: "#b3261e", bg: "#fbe9e7" },
  },
  spacing,
  gutter: 24,
  radii,
  typography,
};

export const darkTheme: AppTheme = {
  scheme: "dark",
  colors: {
    ...lightTheme.colors,
    accentText: "#D4AF37",
    background: "#050c14",
    surface: "#0c1622",
    surfaceElevated: "#101e30",
    border: "#1c2b3c",
    foreground: "#e7eaf0",
    foregroundMuted: "#a9b4c4",
    zebra: "#0f1a28",
    success: { fg: "#7fd99a", bg: "#113321" },
    warning: { fg: "#ffc94d", bg: "#3a2a05" },
    error: { fg: "#ffb4ab", bg: "#3a1613" },
  },
  spacing,
  gutter: 24,
  radii,
  typography,
};
