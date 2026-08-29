import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6 antialiased relative overflow-hidden">
      {/* Ambient background glow & dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl shadow-2xl shadow-black/80">
        {/* Panel kiri - identitas sistem */}
        <div className="relative hidden md:flex flex-col items-center justify-center text-center bg-zinc-900/40 border-r border-zinc-800/80 p-10">
          <div className="relative flex flex-col items-center">
            <img
              src="/images/logo.png"
              alt="Logo ParkirKu"
              className="h-16 w-16 object-contain rounded-2xl mb-6 shadow-xl border border-zinc-800"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 mb-4 shadow-sm">
              <Sparkles size={12} className="text-zinc-300" />
              <span>REGISTRASI PELANGGAN</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-zinc-100 leading-snug mb-3">
              Buat Akun Pelanggan
              <br />
              <span className="text-zinc-400">Booking Parkir Online</span>
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto mb-8">
              Daftar sebagai pelanggan untuk pesan slot parkir lebih awal, bayar
              non-tunai via QRIS, dan akses tiket barcode instan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <UsersIcon size={13} className="text-purple-400" />
                Akses Pelanggan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <ShieldCheck size={13} className="text-emerald-400" />
                Slot Terjamin
              </span>
            </div>
          </div>
        </div>

        {/* Panel kanan - form register */}
        <div className="p-6 sm:p-10 flex flex-col justify-center bg-zinc-950/40">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 mb-6 w-fit transition-colors group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Kembali ke beranda
          </Link>

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-100 mb-1 tracking-tight">
            Daftar Akun Baru
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            Lengkapi data untuk membuat akun pelanggan baru.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                NAMA LENGKAP
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 pl-10 pr-3.5 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all placeholder:text-zinc-600"
                  placeholder="mis. Budi Santoso"
                />
              </div>
              {errors.nama_lengkap && (
                <p className="mt-1 text-xs text-rose-400 font-mono">
                  {errors.nama_lengkap[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                USERNAME
              </label>
              <div className="relative">
                <AtSign
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 pl-10 pr-3.5 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all placeholder:text-zinc-600"
                  placeholder="mis. budi.santoso"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-400 font-mono">
                  {errors.username[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                NO. TELEPON
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
                <input
                  type="tel"
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value)}
                  required
                  pattern="[0-9]{10,15}"
                  className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 pl-10 pr-3.5 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all placeholder:text-zinc-600"
                  placeholder="mis. 081234567890"
                />
              </div>
              {errors.no_telp && (
                <p className="mt-1 text-xs text-rose-400 font-mono">
                  {errors.no_telp[0]}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    type={tampilkanPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 pl-10 pr-9 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all placeholder:text-zinc-600"
                    placeholder="min. 6 char"
                  />
                  <button
                    type="button"
                    onClick={() => setTampilkanPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
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
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  KONFIRMASI
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    type={tampilkanKonfirmasi ? "text" : "password"}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full rounded-xl bg-zinc-900/80 border pl-10 pr-14 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:border-zinc-500 transition-all placeholder:text-zinc-600 ${
                      konfirmasiCocok === false
                        ? "border-rose-500/60 focus:ring-rose-500/30"
                        : konfirmasiCocok === true
                          ? "border-emerald-500/60 focus:ring-emerald-500/30"
                          : "border-zinc-800 focus:ring-zinc-400/30"
                    }`}
                    placeholder="ulangi"
                  />
                  {konfirmasiCocok !== null && (
                    <span
                      className={`absolute right-8 top-1/2 -translate-y-1/2 ${
                        konfirmasiCocok ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {konfirmasiCocok ? <Check size={14} /> : <X size={14} />}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setTampilkanKonfirmasi((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
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
              <p className="text-xs text-rose-400 font-mono">
                {errors.password[0]}
              </p>
            )}

            {error && (
              <p className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-zinc-100 text-zinc-950 font-semibold py-3 text-sm hover:bg-white active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5 mt-3"
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

            <p className="text-center text-xs text-zinc-400 pt-3 border-t border-zinc-900">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-zinc-200 hover:text-white font-medium hover:underline"
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
