// Konfigurasi terpusat untuk teks/label terkait tema terang-gelap.
// Kalau mau ganti kata-kata ("Terang" -> "Mode Siang", dst), cukup ubah di sini,
// tidak perlu cari-cari satu-satu di Login.jsx, Register.jsx, atau Layout.jsx.

export const THEME_LABELS = {
  dark: {
    id: "dark",
    nama: "Gelap",
    title: "Ganti ke mode terang",
    ariaLabel: "Ganti ke mode terang",
  },
  light: {
    id: "light",
    nama: "Terang",
    title: "Ganti ke mode gelap",
    ariaLabel: "Ganti ke mode gelap",
  },
};

// Dipakai kalau butuh urutan tetap, misal buat dropdown/select tema
export const THEME_OPTIONS = [THEME_LABELS.light, THEME_LABELS.dark];

// Helper: ambil label lawan tema saat ini (buat teks tombol toggle,
// karena tombolnya menampilkan tujuan klik, bukan tema aktif)
export function getToggleLabel(currentTheme) {
  return currentTheme === "dark" ? THEME_LABELS.dark : THEME_LABELS.light;
}
