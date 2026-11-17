// src/constants/theme.ts
// Single source of truth for the Pesa look and feel.
// Colours now come in two sets, light and dark. Screens get the active set from useTheme().
// `colors` (the light set) is still exported so a screen that has not been converted yet keeps working.

export const lightColors = {
  // Brand green
  primary: "#0C8A3F",
  primaryDark: "#087033", // dark green: text on light green, logo clasp
  primaryPressed: "#087033", // button background while pressed
  primarySoft: "#E5F6EB",

  // Deep green panels (splash, dashboard hero) and what sits on them
  ink: "#0B4A33",
  inkSoft: "#125E42",
  onInk: "#F2FAF5",
  onInkMuted: "#A8CDBA",
  leaf: "#34C77B", // bright green for the logo on dark backgrounds

  // Splash screen shapes (three layered greens)
  splashDark: "#093F2A",
  splashMid: "#0F5E3E",
  splashLight: "#147B4D",

  // Soft mint circles on the white auth pages
  mint: "#DDF3E6",
  mintSoft: "#EAF7EF",
  mintFaint: "#F2FAF5",

  // See-through shapes on dark panels
  glass: "rgba(255, 255, 255, 0.07)",
  glassBorder: "rgba(255, 255, 255, 0.14)",
  leafSoft: "rgba(52, 199, 123, 0.14)",

  // Gold means savings: set aside and locked
  gold: "#E9B949",

  // Surfaces
  background: "#F5F8F6", // screen background
  surface: "#FFFFFF", // cards, modals, white pages
  field: "#F4F6F6", // input fill
  border: "#E1E8E4",

  // Text
  text: "#14201A",
  textMuted: "#66756D",
  white: "#FFFFFF",

  // Status colours (budget bars, payment results)
  success: "#1E9E5A",
  warning: "#E59A0B",
  warningText: "#8A5A00", // readable amber text on white
  warningSoft: "#FDF3DC",
  danger: "#D64545",
  dangerSoft: "#FCE9E9",
} as const;

// Every colour name, as a plain string, so the dark set can have different values
export type Palette = { [K in keyof typeof lightColors]: string };

export const darkColors: Palette = {
  primary: "#1F9D52",
  primaryDark: "#8FE0B0", // light green: readable on the dark green tint
  primaryPressed: "#17803F",
  primarySoft: "#17382A",

  // The green panels stay as they are: they already work on a dark page
  ink: "#0B4A33",
  inkSoft: "#125E42",
  onInk: "#F2FAF5",
  onInkMuted: "#A8CDBA",
  leaf: "#34C77B",

  splashDark: "#093F2A",
  splashMid: "#0F5E3E",
  splashLight: "#147B4D",

  mint: "#183024",
  mintSoft: "#14261D",
  mintFaint: "#101A15",

  glass: "rgba(255, 255, 255, 0.07)",
  glassBorder: "rgba(255, 255, 255, 0.14)",
  leafSoft: "rgba(52, 199, 123, 0.14)",

  gold: "#E9B949",

  background: "#0E1612",
  surface: "#16211B",
  field: "#1D2B24",
  border: "#26362D",

  text: "#EAF3EE",
  textMuted: "#93A79B",
  white: "#FFFFFF",

  success: "#3DBE7A",
  warning: "#F0A93A",
  warningText: "#F2C46B",
  warningSoft: "#3A2E12",
  danger: "#F06B6B",
  dangerSoft: "#3B2020",
};

// The light set under the old name. New code should call useTheme() instead.
export const colors = lightColors;

// Spacing scale: use these for padding, margin and gaps
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Corner roundness
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// Text sizes
export const fontSize = {
  tiny: 11, // bottom nav labels
  small: 13,
  body: 16,
  title: 20,
  heading: 28,
  amount: 36, // big money numbers
  display: 44, // the one hero number on Home
} as const;

// Text weights
export const fontWeight = {
  regular: "400",
  medium: "500",
  bold: "700",
} as const;
