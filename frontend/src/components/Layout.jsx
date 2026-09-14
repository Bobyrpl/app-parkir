import { useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
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
      className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-neutral-100 text-neutral-900 text-xs font-semibold border border-neutral-200 hover:border-neutral-400 transition-colors disabled:cursor-wait"
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
            className="h-4 w-4 animate-spin text-white"
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

/* Bottom nav mobile: maksimal 4 menu utama tampil sebagai tab,
   sisanya (kalau ada) dibuka lewat tab "Menu" yang memunculkan
   bottom sheet sendiri (bukan sidebar kiri). */
function MobileBottomNav({ menu, moreOpen, onToggleMore }) {
  const tabs = menu.slice(0, 4);
  const hasMore = menu.length > tabs.length;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around bg-white border-t border-neutral-200 px-1 pt-1.5"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {tabs.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => onToggleMore(false)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1"
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex items-center justify-center h-7 w-7 rounded-full transition-colors ${
                  isActive && !moreOpen ? "bg-neutral-900" : "bg-transparent"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive && !moreOpen ? "text-white" : "text-neutral-400"
                  }`}
                />
              </span>
              <span
                className={`text-[10px] leading-none truncate max-w-full px-1 ${
                  isActive && !moreOpen ? "text-neutral-900 font-semibold" : "text-neutral-500"
                }`}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => onToggleMore((prev) => !prev)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1"
        >
          <span
            className={`flex items-center justify-center h-7 w-7 rounded-full transition-colors ${
              moreOpen ? "bg-neutral-900" : "bg-transparent"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className={`h-[18px] w-[18px] ${moreOpen ? "text-white" : "text-neutral-400"}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </span>
          <span
            className={`text-[10px] leading-none ${
              moreOpen ? "text-neutral-900 font-semibold" : "text-neutral-500"
            }`}
          >
            Menu
          </span>
        </button>
      )}
    </nav>
  );
}

/* Bottom sheet berisi menu sisa (yang tidak kebagian slot di bottom nav)
   + profil singkat & tombol keluar. Muncul di atas bottom nav saat tab
   "Menu" dipencet, murni komponen mobile — tidak menyentuh sidebar kiri. */
function MobileMoreSheet({ open, onClose, moreItems, user, roleLabel, onLogoutClick }) {
  if (!open) return null;

  return (
    <>
      <div
        className="md:hidden fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl border-t border-neutral-200 shadow-2xl max-h-[70vh] overflow-y-auto"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>

        {/* Profil singkat */}
        <div className="flex items-center gap-3 px-4 pt-2 pb-3 border-b border-neutral-100">
          <ProfileAvatar />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate leading-tight">
              {user?.nama_lengkap}
            </p>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Sisa menu */}
        <div className="px-2 py-2 grid grid-cols-3 gap-1.5">
          {moreItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-50 text-neutral-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-neutral-400"}`}
                  />
                  <span className="text-[11px] leading-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Keluar */}
        <div className="px-4 pt-2 pb-1">
          <button
            onClick={() => {
              onClose();
              onLogoutClick();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100"
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
            Keluar Akun
          </button>
        </div>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = MENU[user?.role] || [];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "1",
  );

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
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col md:flex-row antialiased font-sans">
      {/* Overlay gelap di belakang sidebar saat dibuka di mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: off-canvas di mobile, statis + bisa dikecilkan di layar md ke atas */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 shrink-0 bg-white border-r border-neutral-200 flex flex-col
                shadow-xl shadow-neutral-200/60
                transition-[transform,width] duration-300 ease-in-out
                md:static md:translate-x-0 md:shadow-none
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                ${collapsed ? "md:w-20 w-72" : "w-72"}`}
      >
        {/* Tombol kecilkan/lebarkan, tampil di layar md ke atas */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Lebarkan menu" : "Kecilkan menu"}
          className="hidden md:flex absolute -right-3.5 top-7 z-10 h-7 w-7 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all shadow-sm"
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
          className={`px-5 py-5 border-b border-neutral-200 flex items-center ${
            collapsed ? "md:justify-center md:px-0" : "justify-between"
          }`}
        >
          <div
            className={`flex items-center gap-3 min-w-0 ${collapsed ? "md:gap-0" : ""}`}
          >
            <img
              src="/images/logo.png"
              alt="Logo ParkirKu"
              className="h-8 w-8 object-contain rounded-lg shrink-0"
            />
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="font-semibold text-sm text-neutral-900 leading-tight truncate">
                ParkirKu
              </p>
              <p className="text-[10px] leading-none text-neutral-400 tracking-wide uppercase mt-0.5 truncate">
                Pelabuhan Tanjung Perak
              </p>
            </div>
          </div>
          {/* Tombol tutup, hanya tampil di mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg p-1.5 transition-colors shrink-0"
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
            className={`px-3 pb-2 text-[10px] font-semibold tracking-widest uppercase text-neutral-400 ${
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
                    ? "bg-neutral-900 text-white font-medium"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-900"
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
        <div className="p-3 border-t border-neutral-200 space-y-2 bg-neutral-50">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-white border border-neutral-200 ${
              collapsed ? "md:justify-center md:p-1.5" : ""
            }`}
          >
            <ProfileAvatar />
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="text-xs font-semibold text-neutral-900 truncate leading-tight">
                {user?.nama_lengkap}
              </p>
              <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                {ROLE_LABEL[user?.role]}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={collapsed ? "Keluar" : undefined}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all ${
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
      <main className="flex-1 overflow-y-auto min-w-0 bg-white flex flex-col">
        {/* Header mobile: logo & status saja, navigasi sepenuhnya lewat bottom nav */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/images/logo.png"
                alt="Logo ParkirKu"
                className="h-6 w-6 object-contain rounded"
              />
              <span className="font-semibold text-sm text-neutral-900">
                ParkirKu
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Online</span>
          </div>
        </div>

        {/* Top subtle highlight banner */}
        <div className="hidden md:flex items-center justify-between px-8 py-3 border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="tracking-wide uppercase">Sistem Parkir Pelabuhan Tanjung Perak</span>
          </div>
          <span className="text-neutral-500">Portal {ROLE_LABEL[user?.role]}</span>
        </div>

        {/* Content Container */}
        <div className="p-4 pb-24 sm:p-6 md:p-8 md:pb-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>

      {/* Bottom nav khusus mobile, referensi tab bar gaya app native */}
      <MobileBottomNav
        menu={menu}
        moreOpen={mobileMoreOpen}
        onToggleMore={setMobileMoreOpen}
      />
      <MobileMoreSheet
        open={mobileMoreOpen}
        onClose={() => setMobileMoreOpen(false)}
        moreItems={menu.slice(4)}
        user={user}
        roleLabel={ROLE_LABEL[user?.role]}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

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