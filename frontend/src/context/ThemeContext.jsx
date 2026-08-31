import { createContext, useContext, useEffect, useState } from "react";

// Token warna yang sama persis dengan yang dipakai di Landing.jsx, supaya
// Login, Register, dan seluruh dashboard (admin/petugas/owner/pelanggan)
// punya identitas visual yang konsisten. Warna aksen brand (#C90000) sengaja
// TIDAK berubah antar tema — dia tetap merah di light maupun dark.
export const THEME_VARS = {
  dark: {
    "--color-bg": "#000000",
    "--color-bg-rgb": "0, 0, 0",
    "--color-section": "#09090b",
    "--color-card": "#09090b",
    "--color-border": "#27272a",
    "--color-text": "#fafafa",
    "--color-text-secondary": "#a1a1aa",
    "--color-text-muted": "#71717a",
    "--color-button-bg": "#C90000",
    "--color-button-text": "#ffffff",
  },
  light: {
    "--color-bg": "#eff4fb",
    "--color-bg-rgb": "239, 244, 251",
    "--color-section": "#f5f8fd",
    "--color-card": "#ffffff",
    "--color-border": "#dbe6f5",
    "--color-text": "#0f172a",
    "--color-text-secondary": "#5b6b85",
    "--color-text-muted": "#8896ac",
    "--color-button-bg": "#C90000",
    "--color-button-text": "#ffffff",
  },
};

export const BRAND_ACCENT = "#C90000";

const STORAGE_KEY = "parkirku-theme";

const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    // Sinkronkan juga ke elemen <html>, kalau-kalau ada gaya global yang
    // ingin ikut mode terang/gelap tanpa lewat inline CSS variables.
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Kalau tema diubah di tab/halaman lain (mis. Landing.jsx), ikut sinkron.
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === STORAGE_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const value = {
    theme,
    toggleTheme,
    themeVars: THEME_VARS[theme],
    isDark: theme === "dark",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  return ctx;
}
