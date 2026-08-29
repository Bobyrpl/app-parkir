import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme, BRAND_ACCENT } from "../context/ThemeContext";
import { THEME_LABELS } from "../config/theme.config";
import {
  ArrowLeft,
  User,
  AtSign,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  ShieldCheck,
  UserCog,
  Crown,
  Users as UsersIcon,
  Check,
  X,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

export default function Register() {
  const [namaLengkap, setNamaLengkap] = useState("");
  const [username, setUsername] = useState("");
  const [noTelp, setNoTelp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [tampilkanPassword, setTampilkanPassword] = useState(false);
  const [tampilkanKonfirmasi, setTampilkanKonfirmasi] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { themeVars, isDark, toggleTheme } = useTheme();

  // Indikator cocok/tidaknya konfirmasi password, murni buat bantu user
  // sebelum submit — validasi asli tetap di backend (rule "confirmed").
  const konfirmasiCocok =
    passwordConfirmation.length > 0 ? passwordConfirmation === password : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setErrors({});
    setLoading(true);

    try {
      // role tidak dikirim dari sini — backend memaksa role jadi "pelanggan"
      await register(
        namaLengkap,
        username,
        noTelp,
        password,
        passwordConfirmation,
      );
      navigate("/pelanggan");
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setError(err.response.data.message || "Data tidak valid");
      } else {
        setError(err.response?.data?.message || "Registrasi gagal, coba lagi");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-4 sm:p-6 antialiased relative overflow-hidden transition-colors duration-300"
    >
      {/* Ambient background glow & dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(var(--color-border) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Tombol ganti tema */}
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? THEME_LABELS.dark.title : THEME_LABELS.light.title}
        aria-label={isDark ? THEME_LABELS.dark.ariaLabel : THEME_LABELS.light.ariaLabel}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 h-9 w-9 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{ "--tw-ring-color": BRAND_ACCENT }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="relative w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-xl shadow-2xl shadow-black/80">
        {/* Panel kiri - identitas sistem */}
        <div className="relative hidden md:flex flex-col items-center justify-center text-center bg-[var(--color-section)] border-r border-[var(--color-border)] p-10">
          <div className="relative flex flex-col items-center">
            <img
              src="/images/logo.png"
              alt="Logo ParkirKu"
              className="h-16 w-16 object-contain rounded-2xl mb-6 shadow-xl border border-[var(--color-border)]"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-4 shadow-sm">
              <Sparkles size={12} className="text-[var(--color-text-secondary)]" />
              <span>REGISTRASI PELANGGAN</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-[var(--color-text)] leading-snug mb-3">
              Buat Akun Pelanggan
              <br />
              <span className="text-[var(--color-text-secondary)]">Booking Parkir Online</span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xs mx-auto mb-8">
              Daftar sebagai pelanggan untuk pesan slot parkir lebih awal, bayar
              non-tunai via QRIS, dan akses tiket barcode instan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <UsersIcon size={13} className="text-purple-400" />
                Akses Pelanggan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <ShieldCheck size={13} className="text-emerald-500" />
                Slot Terjamin
              </span>
            </div>
          </div>
        </div>

        {/* Panel kanan - form register */}
        <div className="p-6 sm:p-10 flex flex-col justify-center bg-[var(--color-bg)]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-6 w-fit transition-colors group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Kembali ke beranda
          </Link>

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--color-text)] mb-1 tracking-tight">
            Daftar Akun Baru
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Lengkapi data untuk membuat akun pelanggan baru.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                NAMA LENGKAP
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                />
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-xl bg-[var(--color-bg)]/80 border border-[var(--color-border)] pl-10 pr-3.5 py-2 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] focus:border-[var(--color-text-secondary)] transition-all placeholder:text-[var(--color-text-muted)]"
                  placeholder="mis. Budi Santoso"
                />
              </div>
              {errors.nama_lengkap && (
                <p className="mt-1 text-xs text-rose-500 font-mono">
                  {errors.nama_lengkap[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                USERNAME
              </label>
              <div className="relative">
                <AtSign
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[var(--color-bg)]/80 border border-[var(--color-border)] pl-10 pr-3.5 py-2 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] focus:border-[var(--color-text-secondary)] transition-all placeholder:text-[var(--color-text-muted)]"
                  placeholder="mis. budi.santoso"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-500 font-mono">
                  {errors.username[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                NO. TELEPON
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                />
                <input
                  type="tel"
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value)}
                  required
                  pattern="[0-9]{10,15}"
                  className="w-full rounded-xl bg-[var(--color-bg)]/80 border border-[var(--color-border)] pl-10 pr-3.5 py-2 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] focus:border-[var(--color-text-secondary)] transition-all placeholder:text-[var(--color-text-muted)]"
                  placeholder="mis. 081234567890"
                />
              </div>
              {errors.no_telp && (
                <p className="mt-1 text-xs text-rose-500 font-mono">
                  {errors.no_telp[0]}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <input
                    type={tampilkanPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-[var(--color-bg)]/80 border border-[var(--color-border)] pl-10 pr-9 py-2 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] focus:border-[var(--color-text-secondary)] transition-all placeholder:text-[var(--color-text-muted)]"
                    placeholder="min. 6 char"
                  />
                  <button
                    type="button"
                    onClick={() => setTampilkanPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-1"
                    aria-label={tampilkanPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {tampilkanPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  KONFIRMASI
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <input
                    type={tampilkanKonfirmasi ? "text" : "password"}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full rounded-xl bg-[var(--color-bg)]/80 border pl-10 pr-14 py-2 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:border-[var(--color-text-secondary)] transition-all placeholder:text-[var(--color-text-muted)] ${
                      konfirmasiCocok === false
                        ? "border-rose-500/60 focus:ring-rose-500/30"
                        : konfirmasiCocok === true
                          ? "border-emerald-500/60 focus:ring-emerald-500/30"
                          : "border-[var(--color-border)] focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)]"
                    }`}
                    placeholder="ulangi"
                  />
                  {konfirmasiCocok !== null && (
                    <span
                      className={`absolute right-8 top-1/2 -translate-y-1/2 ${
                        konfirmasiCocok ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {konfirmasiCocok ? <Check size={14} /> : <X size={14} />}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setTampilkanKonfirmasi((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-1"
                    aria-label={
                      tampilkanKonfirmasi ? "Sembunyikan" : "Tampilkan"
                    }
                  >
                    {tampilkanKonfirmasi ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {errors.password && (
              <p className="text-xs text-rose-500 font-mono">
                {errors.password[0]}
              </p>
            )}

            {error && (
              <p className="text-xs font-mono text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--color-button-bg)] text-[var(--color-button-text)] font-semibold py-3 text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-black/20 mt-3"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Daftar sebagai Pelanggan
                </>
              )}
            </button>

            <p className="text-center text-xs text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border)]">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-[var(--color-text)] hover:text-[var(--color-text)] font-medium hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
