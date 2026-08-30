import { useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme, BRAND_ACCENT } from "../context/ThemeContext";
import { THEME_LABELS } from "../config/theme.config";
import { Sun, Moon } from "lucide-react";
import { ConfirmDialog } from "./ui";

/* Ikon garis tipis (24x24, stroke) — satu per menu, biar tiap item mudah dikenali sekilas */
const ICONS = {
  ringkasan:
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users:
    "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-2.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-3.5-6",
  tarif:
    "M9 5H6a1 1 0 00-1 1v3l9.6 9.6a2 2 0 002.83 0l3.17-3.17a2 2 0 000-2.83L11 5H9zm-.5 4.5h.01",
  denda: "M12 8v4l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z M9 3h6",
  area: "M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  kendaraan:
    "M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13m-14 0h14m-14 0a2 2 0 00-2 2v3a1 1 0 001 1h1m14-6a2 2 0 012 2v3a1 1 0 01-1 1h-1m-13 0a1.5 1.5 0 103 0m10 0a1.5 1.5 0 103 0m-13 0h10",
  komentar:
    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  aktivasi: "M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z",
  log: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  masuk: "M11 16l-4-4m0 0l4-4m-4 4h11m-3-7h2a2 2 0 012 2v10a2 2 0 01-2 2h-2",
  keluar: "M9 8l4 4m0 0l-4 4m4-4H2m11-7h2a2 2 0 012 2v10a2 2 0 01-2 2h-2",
  transaksi:
    "M9 17V9m3 8V5m3 12v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
  booking:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  rekap: "M9 19V6l7-3v13M9 19l-6 2V8l6-2m0 13l7-3M16 3l6 2v13l-6-2",
  riwayat: "M12 8v4l2.5 1.5M21 12a9 9 0 11-4.5-7.79M3 4v5h5",
};

const MENU = {
  admin: [
    { to: "/admin", label: "Ringkasan", end: true, icon: "ringkasan" },
    { to: "/admin/users", label: "Pengguna", icon: "users" },
    { to: "/admin/tarif", label: "Tarif Parkir", icon: "tarif" },
    { to: "/admin/pengaturan-denda", label: "Pengaturan Denda", icon: "denda" },
    { to: "/admin/area", label: "Area Parkir", icon: "area" },
    { to: "/admin/kendaraan", label: "Kendaraan", icon: "kendaraan" },
    { to: "/admin/komentar", label: "Komentar", icon: "komentar" },
    {
      to: "/admin/permintaan-aktivasi",
      label: "Permintaan Aktivasi",
      icon: "aktivasi",
    },
    { to: "/admin/log", label: "Log Aktivitas", icon: "log" },
  ],
  petugas: [
    { to: "/petugas", label: "Ringkasan", end: true, icon: "ringkasan" },
    { to: "/petugas/kendaraan", label: "Tambah Kendaraan", icon: "kendaraan" },
    { to: "/petugas/masuk", label: "Kendaraan Masuk", icon: "masuk" },
    { to: "/petugas/keluar", label: "Kendaraan Keluar", icon: "keluar" },
    { to: "/petugas/transaksi", label: "Riwayat Transaksi", icon: "transaksi" },
    { to: "/petugas/booking", label: "Booking Masuk", icon: "booking" },
  ],
  owner: [
    { to: "/owner", label: "Ringkasan", end: true, icon: "ringkasan" },
    { to: "/owner/rekap", label: "Rekap Transaksi", icon: "rekap" },
  ],
  pelanggan: [
    { to: "/pelanggan", label: "Booking Parkir", end: true, icon: "booking" },
    { to: "/pelanggan/riwayat", label: "Booking Saya", icon: "riwayat" },
  ],
};

const ROLE_LABEL = {
  admin: "Administrator",
  petugas: "Petugas Lapangan",
  owner: "Pemilik Usaha",
  pelanggan: "Pelanggan",
};

function Icon({ name, className }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Avatar profil: tampilkan foto asli kalau ada, kalau tidak ada
   fallback ke inisial. Klik untuk ganti foto lewat file picker. */
function ProfileAvatar() {
  const { user, uploadFotoProfil } = useAuth();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  function pilihFile() {
    if (!uploading) fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("File harus berupa gambar");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError("Ukuran foto maksimal 2MB");
      return;
    }

    setUploading(true);
    try {
      await uploadFotoProfil(file);
      showSuccess("Foto profil berhasil diperbarui");
    } catch (err) {
      showError(err?.response?.data?.message || "Gagal mengunggah foto profil");
    } finally {
      setUploading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={pilihFile}
      disabled={uploading}
      title="Ganti foto profil"
      className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-[var(--color-card)] text-[var(--color-text)] text-xs font-semibold border border-[var(--color-border)] hover:border-[var(--color-text-secondary)] transition-colors disabled:cursor-wait shadow-sm"
    >
      {user?.foto_profil_url ? (
        <img
          src={user.foto_profil_url}
          alt={user?.nama_lengkap}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials(user?.nama_lengkap)}</span>
      )}

      {/* Overlay ikon kamera, muncul saat hover / lagi upload */}
      <span
        className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity ${
          uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {uploading ? (
          <svg
            className="h-4 w-4 animate-spin text-[var(--color-text)]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M12 3a9 9 0 019 9h-3a6 6 0 00-6-6V3z"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.75"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7h3l1.5-2h7L17 7h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z"
            />
            <circle cx="12" cy="13" r="3.5" stroke="white" strokeWidth="1.75" />
          </svg>
        )}
      </span>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = MENU[user?.role] || [];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "1",
  );
  const { themeVars, isDark, toggleTheme } = useTheme();

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col md:flex-row antialiased transition-colors duration-300"
    >
      {/* Overlay gelap di belakang sidebar saat dibuka di mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: off-canvas di mobile, statis + bisa dikecilkan di layar md ke atas */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 shrink-0 bg-[var(--color-card)]/95 backdrop-blur-md border-r border-[var(--color-border)] flex flex-col
                shadow-2xl shadow-black/50
                transition-[transform,width] duration-300 ease-in-out
                md:static md:translate-x-0 md:shadow-none
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                ${collapsed ? "md:w-20 w-72" : "w-72"}`}
      >
        {/* Tombol kecilkan/lebarkan, tampil di layar md ke atas */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Lebarkan menu" : "Kecilkan menu"}
          className="hidden md:flex absolute -right-3.5 top-7 z-10 h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] transition-all shadow-md"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Brand */}
        <div
          className={`px-5 py-5 border-b border-[var(--color-border)] flex items-center ${
            collapsed ? "md:justify-center md:px-0" : "justify-between"
          }`}
        >
          <div
            className={`flex items-center gap-3 min-w-0 ${collapsed ? "md:gap-0" : ""}`}
          >
            <img
              src="/images/logo.png"
              alt="Logo ParkirKu"
              className="h-8 w-8 object-contain rounded-lg shrink-0 drop-shadow"
            />
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="font-display font-bold text-sm text-[var(--color-text)] leading-tight truncate">
                ParkirKu
              </p>
              <p className="text-[10px] leading-none text-[var(--color-text-secondary)] font-mono tracking-wider uppercase mt-0.5 truncate">
                Pelabuhan Tanjung Perak
              </p>
            </div>
          </div>
          {/* Tombol tutup, hanya tampil di mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] rounded-lg p-1.5 transition-colors shrink-0"
            aria-label="Tutup menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <p
            className={`px-3 pb-2 text-[10px] font-mono font-semibold tracking-widest uppercase text-[var(--color-text-muted)] ${
              collapsed ? "md:hidden" : ""
            }`}
          >
            Navigasi
          </p>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
                  collapsed ? "md:justify-center md:px-2" : ""
                } ${
                  isActive
                    ? "bg-[var(--color-button-bg)] text-[var(--color-button-text)] font-semibold shadow-md shadow-black/20"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]/80 hover:text-[var(--color-text)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-[var(--color-button-text)]" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]"
                    }`}
                  />
                  <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profil & keluar */}
        <div className="p-3 border-t border-[var(--color-border)] space-y-2 bg-[var(--color-card)]/50">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-[var(--color-bg)]/50 border border-[var(--color-border)] ${
              collapsed ? "md:justify-center md:p-1.5" : ""
            }`}
          >
            <ProfileAvatar />
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="text-xs font-semibold text-[var(--color-text)] truncate leading-tight">
                {user?.nama_lengkap}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-mono truncate mt-0.5">
                {ROLE_LABEL[user?.role]}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={collapsed ? "Keluar" : undefined}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ${
              collapsed ? "md:justify-center md:px-2" : ""
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="h-4 w-4 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className={collapsed ? "md:hidden" : ""}>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-[var(--color-bg)] flex flex-col">
        {/* Header mobile dengan tombol hamburger */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-card)]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] rounded-lg p-2 transition-colors"
              aria-label="Buka menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/images/logo.png"
                alt="Logo ParkirKu"
                className="h-6 w-6 object-contain rounded"
              />
              <span className="font-display font-bold text-sm text-[var(--color-text)]">
                ParkirKu
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? THEME_LABELS.dark.title : THEME_LABELS.light.title}
              aria-label={isDark ? THEME_LABELS.dark.ariaLabel : THEME_LABELS.light.ariaLabel}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              style={{ "--tw-ring-color": BRAND_ACCENT }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Top subtle highlight banner */}
        <div className="hidden md:flex items-center justify-between px-8 py-3 border-b border-[var(--color-border)] bg-[var(--color-card)]/50 backdrop-blur-sm text-xs font-mono text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>SISTEM PARKIR PELABUHAN TANJUNG PERAK</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? THEME_LABELS.dark.title : THEME_LABELS.light.title}
              aria-label={isDark ? THEME_LABELS.dark.ariaLabel : THEME_LABELS.light.ariaLabel}
              className="h-7 w-7 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <span className="text-[var(--color-text-secondary)]">Portal {ROLE_LABEL[user?.role]}</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Keluar dari Sistem?"
        message="Anda akan diarahkan kembali ke halaman login. Sesi Anda akan diakhiri."
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}