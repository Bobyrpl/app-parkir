import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, User, AtSign, Phone, Lock, Eye, EyeOff,
  UserPlus, Loader2, ShieldCheck, UserCog, Crown, Users as UsersIcon,
  Check, X,
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
      await register(namaLengkap, username, noTelp, password, passwordConfirmation);
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
    <div className="min-h-screen bg-[#050608] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        {/* Panel kiri - identitas sistem */}
        <div className="relative hidden md:flex flex-col items-center justify-center text-center bg-[#080A0D] border-r border-[#444444] p-10">
          <div className="relative">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C90000] mb-5" />
            <h2 className="font-medium text-2xl text-white leading-snug mb-3">
              Sistem parkir
              <br />
              Pelabuhan Tanjung Perak
            </h2>
            <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto mb-8">
              Daftar sebagai pelanggan untuk booking slot parkir online.
              Akun petugas hanya bisa dibuat oleh admin.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#C90000]" />
                Admin
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserCog size={13} className="text-[#C90000]" />
                Petugas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Crown size={13} className="text-[#C90000]" />
                Owner
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon size={13} className="text-[#C90000]" />
                Pelanggan
              </span>
            </div>
          </div>
        </div>

        {/* Panel kanan - form register */}
        <div className="bg-[#080A0D] p-10 flex flex-col justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-white/70 hover:text-white mb-6 w-fit"
          >
            <ArrowLeft size={14} />
            Kembali ke beranda
          </Link>

          <h1 className="font-medium text-2xl text-white mb-1">
            Buat akun baru
          </h1>
          <p className="text-sm text-white/70 mb-8">
            Daftar sebagai pelanggan untuk mulai booking slot parkir online.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5">
                NAMA LENGKAP
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-md bg-[#080A0D] border border-[#444444] pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C90000] focus:border-transparent"
                  placeholder="mis. Budi Santoso"
                />
              </div>
              {errors.nama_lengkap && (
                <p className="mt-1 text-xs text-[#C90000]">
                  {errors.nama_lengkap[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5">
                USERNAME
              </label>
              <div className="relative">
                <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-md bg-[#080A0D] border border-[#444444] pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C90000] focus:border-transparent"
                  placeholder="mis. budi.santoso"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-[#C90000]">
                  {errors.username[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5">
                NO. TELEPON
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="tel"
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value)}
                  required
                  pattern="[0-9]{10,15}"
                  className="w-full rounded-md bg-[#080A0D] border border-[#444444] pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C90000] focus:border-transparent"
                  placeholder="mis. 081234567890"
                />
              </div>
              {errors.no_telp && (
                <p className="mt-1 text-xs text-[#C90000]">
                  {errors.no_telp[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type={tampilkanPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md bg-[#080A0D] border border-[#444444] pl-9 pr-10 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C90000] focus:border-transparent"
                  placeholder="minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setTampilkanPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  aria-label={tampilkanPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {tampilkanPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[#C90000]">
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5">
                KONFIRMASI PASSWORD
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type={tampilkanKonfirmasi ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full rounded-md bg-[#080A0D] border pl-9 pr-16 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    konfirmasiCocok === false
                      ? "border-[#C90000]/50 focus:ring-[#C90000]"
                      : konfirmasiCocok === true
                      ? "border-[#C90000]/50 focus:ring-[#C90000]"
                      : "border-[#444444] focus:ring-[#C90000]"
                  }`}
                  placeholder="ulangi password"
                />
                {konfirmasiCocok !== null && (
                  <span
                    className={`absolute right-9 top-1/2 -translate-y-1/2 ${
                      konfirmasiCocok ? "text-[#C90000]" : "text-[#C90000]"
                    }`}
                  >
                    {konfirmasiCocok ? <Check size={16} /> : <X size={16} />}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setTampilkanKonfirmasi((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  aria-label={tampilkanKonfirmasi ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {tampilkanKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {konfirmasiCocok === false && (
                <p className="mt-1 text-xs text-[#C90000]">
                  Konfirmasi password belum sama.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-[#C90000] bg-[#C90000]/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#C90000] text-white font-medium py-2.5 text-sm hover:bg-[#5A0000] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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

            <p className="text-center text-sm text-white/70">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-[#C90000] hover:underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}