// src/lib/ThemeContext.tsx
// Light / dark mode for the whole app.
//
//   const { colors, isDark, setMode } = useTheme();     // colours for the current mode
//   const useStyles = createStyles((colors) => ({ ... })); // styles that follow the mode
//   const styles = useStyles();                            // inside a component
//
// The choice is remembered on the device. Pesa starts in light mode until the user changes it.
// Needs:  npx expo install @react-native-async-storage/async-storage
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StyleSheet } from "react-native";
import { darkColors, lightColors, Palette } from "../constants/theme";

export type Mode = "light" | "dark";

type ThemeState = {
  mode: Mode;
  isDark: boolean;
  colors: Palette;
  setMode: (mode: Mode) => void;
};

const STORAGE_KEY = "pesa.appearance";

// Used when a screen is rendered outside the provider: plain light mode
const ThemeContext = createContext<ThemeState>({
  mode: "light",
  isDark: false,
  colors: lightColors,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");

  // Load the saved choice once, when the app starts
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "dark" || saved === "light") setModeState(saved);
      })
      .catch(() => {
        // Nothing saved or storage blocked: stay in light mode
      });
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Not saved: the choice still works until the app is closed
    });
  }, []);

  const value = useMemo<ThemeState>(
    () => ({
      mode,
      isDark: mode === "dark",
      colors: mode === "dark" ? darkColors : lightColors,
      setMode,
    }),
    [mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  return useContext(ThemeContext);
}

/**
 * Like StyleSheet.create, but the styles are built from the colours of the current mode.
 * Returns a hook. Each mode's styles are built once and reused.
 */
export function createStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(factory: (colors: Palette) => T): () => T {
  const cache = new Map<Palette, T>();

  return function useStyles(): T {
    const { colors } = useTheme();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors)) as T;
      cache.set(colors, styles);
    }
    return styles;
  };
}
