import { createContext, useContext, useEffect, useState } from "react";

// Token warna netral, dipakai bareng oleh Login, Register, dan seluruh
// dashboard (admin/petugas/owner/pelanggan) lewat CSS variable, supaya satu
// perubahan di sini otomatis konsisten di semua halaman. Palet ini sama
// dengan yang dipakai di Landing.jsx dan Bantuan.jsx: monokrom hitam-putih-
// abu netral, tanpa aksen biru. Warna aksen brand (#C90000) tetap dipakai
// terpisah, hanya untuk detail kecil seperti wordmark "Ku" — bukan warna
// interaktif utama.
export const THEME_VARS = {
  light: {
    "--color-bg": "#ffffff",
    "--color-bg-rgb": "255, 255, 255",
    "--color-section": "#fafafa",
    "--color-card": "#ffffff",
    "--color-border": "#e5e5e5",
    "--color-text": "#171717",
    "--color-text-secondary": "#737373",
    "--color-text-muted": "#a3a3a3",
    "--color-button-bg": "#171717",
    "--color-button-text": "#ffffff",
  },
  dark: {
    "--color-bg": "#0a0a0a",
    "--color-bg-rgb": "10, 10, 10",
    "--color-section": "#171717",
    "--color-card": "#171717",
    "--color-border": "#2e2e2e",
    "--color-text": "#fafafa",
    "--color-text-secondary": "#a3a3a3",
    "--color-text-muted": "#737373",
    "--color-button-bg": "#fafafa",
    "--color-button-text": "#171717",
  },
};

export const BRAND_ACCENT = "#171717";

const STORAGE_KEY = "parkirku-theme";

const ThemeContext = createContext(null);

// Default ke mode terang (konsisten dengan Landing & Bantuan yang selalu
// putih), kecuali OS pengguna secara eksplisit minta mode gelap.
function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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
