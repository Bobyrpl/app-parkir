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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        {/* Panel kiri - identitas / signature visual */}
        <div className="relative hidden md:flex flex-col justify-between bg-[#F1F4FA] p-10 overflow-hidden">
          <div
            className="absolute inset-y-0 -left-6 w-16 opacity-90"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, #1B2A6B 0 18px, #14181F 18px 36px)",
            }}
          />
          <div className="relative pl-10">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1B2A6B]" />
              <span className="font-display text-2xl tracking-tight text-[#10131A]">
                SISTEM PARKIR PELABUHAN TANJUNG PERAK
              </span>
            </div>
            <p className="mt-2 text-sm text-[#64708A] font-mono">
              SISTEM MANAJEMEN PARKIR PELABUHAN TANJUNG PERAK
            </p>
          </div>

          <div className="relative pl-10">
            <p className="text-[#38424F] text-sm leading-relaxed">
              Daftar sebagai pelanggan untuk booking slot parkir online.
              Akun petugas hanya bisa dibuat oleh admin.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-[#64708A]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#1B2A6B]" />
                ADMIN
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserCog size={13} className="text-[#35C48D]" />
                PETUGAS
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Crown size={13} className="text-[#5B8DEF]" />
                OWNER
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#1B2A6B]">
                <UsersIcon size={13} />
                PELANGGAN
              </span>
            </div>
          </div>
        </div>

        {/* Panel kanan - form register */}
        <div className="bg-[#E8ECF5] p-10 flex flex-col justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#64708A] hover:text-[#10131A] mb-6 w-fit"
          >
            <ArrowLeft size={14} />
            Kembali ke beranda
          </Link>

          <h1 className="font-display text-2xl text-[#10131A] mb-1">
            Buat akun baru
          </h1>
          <p className="text-sm text-[#64708A] mb-8">
            Daftar sebagai pelanggan untuk mulai booking slot parkir online.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#64708A] mb-1.5">
                NAMA LENGKAP
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64708A]" />
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-md bg-white border border-black/10 pl-9 pr-3 py-2.5 text-[#10131A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                  placeholder="mis. Budi Santoso"
                />
              </div>
              {errors.nama_lengkap && (
                <p className="mt-1 text-xs text-[#E5484D]">
                  {errors.nama_lengkap[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#64708A] mb-1.5">
                USERNAME
              </label>
              <div className="relative">
                <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64708A]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-md bg-white border border-black/10 pl-9 pr-3 py-2.5 text-[#10131A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                  placeholder="mis. budi.santoso"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-[#E5484D]">
                  {errors.username[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#64708A] mb-1.5">
                NO. TELEPON
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64708A]" />
                <input
                  type="tel"
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value)}
                  required
                  pattern="[0-9]{10,15}"
                  className="w-full rounded-md bg-white border border-black/10 pl-9 pr-3 py-2.5 text-[#10131A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                  placeholder="mis. 081234567890"
                />
              </div>
              {errors.no_telp && (
                <p className="mt-1 text-xs text-[#E5484D]">
                  {errors.no_telp[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#64708A] mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64708A]" />
                <input
                  type={tampilkanPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md bg-white border border-black/10 pl-9 pr-10 py-2.5 text-[#10131A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                  placeholder="minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setTampilkanPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64708A] hover:text-[#10131A] transition-colors"
                  aria-label={tampilkanPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {tampilkanPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[#E5484D]">
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#64708A] mb-1.5">
                KONFIRMASI PASSWORD
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64708A]" />
                <input
                  type={tampilkanKonfirmasi ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full rounded-md bg-white border pl-9 pr-16 py-2.5 text-[#10131A] text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    konfirmasiCocok === false
                      ? "border-[#E5484D]/50 focus:ring-[#E5484D]"
                      : konfirmasiCocok === true
                      ? "border-[#35C48D]/50 focus:ring-[#35C48D]"
                      : "border-black/10 focus:ring-[#1B2A6B]"
                  }`}
                  placeholder="ulangi password"
                />
                {konfirmasiCocok !== null && (
                  <span
                    className={`absolute right-9 top-1/2 -translate-y-1/2 ${
                      konfirmasiCocok ? "text-[#35C48D]" : "text-[#E5484D]"
                    }`}
                  >
                    {konfirmasiCocok ? <Check size={16} /> : <X size={16} />}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setTampilkanKonfirmasi((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64708A] hover:text-[#10131A] transition-colors"
                  aria-label={tampilkanKonfirmasi ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {tampilkanKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {konfirmasiCocok === false && (
                <p className="mt-1 text-xs text-[#E5484D]">
                  Konfirmasi password belum sama.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-[#E5484D] bg-[#E5484D]/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1B2A6B] text-white font-medium py-2.5 text-sm hover:bg-[#111B3E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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

            <p className="text-center text-sm text-[#64708A]">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-[#1B2A6B] hover:underline">
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}