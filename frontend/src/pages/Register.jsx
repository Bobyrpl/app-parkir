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
  Users as UsersIcon,
  Check,
  X,
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
    <div className="min-h-screen bg-white text-neutral-900 font-sans antialiased flex items-center justify-center p-4 sm:p-6 selection:bg-neutral-900 selection:text-white">
      <div className="relative w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden border border-neutral-200 shadow-xl shadow-neutral-200/60">

        {/* Panel kiri - identitas sistem, gaya gelap seperti footer landing page */}
        <div className="relative hidden md:flex flex-col items-center justify-center text-center bg-neutral-900 text-white p-10">
          <img
            src="/images/logo.png"
            alt="Logo ParkirKu"
            className="h-16 w-16 object-contain rounded-2xl mb-6 border border-white/10"
          />
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase bg-white/10 text-neutral-300 mb-5">
            Registrasi Pelanggan
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug mb-3">
            Buat Akun Pelanggan
            <br />
            <span className="text-neutral-400">Booking Parkir Online</span>
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto mb-8">
            Daftar sebagai pelanggan untuk pesan slot parkir lebih awal, bayar
            non-tunai via QRIS, dan akses tiket barcode instan.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-neutral-300">
              <UsersIcon size={13} />
              Akses Pelanggan
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-neutral-300">
              <ShieldCheck size={13} />
              Slot Terjamin
            </span>
          </div>
        </div>

        {/* Panel kanan - form register, gaya bersih seperti section landing page */}
        <div className="p-6 sm:p-10 flex flex-col justify-center bg-white">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6 w-fit group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Kembali ke beranda
          </Link>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 mb-1">
            Daftar Akun Baru
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            Lengkapi data untuk membuat akun pelanggan baru.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-xl bg-white border border-neutral-300 pl-10 pr-3.5 py-2 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                  placeholder="mis. Budi Santoso"
                />
              </div>
              {errors.nama_lengkap && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.nama_lengkap[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                Username
              </label>
              <div className="relative">
                <AtSign
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white border border-neutral-300 pl-10 pr-3.5 py-2 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                  placeholder="mis. budi.santoso"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.username[0]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                No. Telepon
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input
                  type="tel"
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value)}
                  required
                  pattern="[0-9]{10,15}"
                  className="w-full rounded-xl bg-white border border-neutral-300 pl-10 pr-3.5 py-2 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                  placeholder="mis. 081234567890"
                />
              </div>
              {errors.no_telp && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.no_telp[0]}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                  <input
                    type={tampilkanPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-white border border-neutral-300 pl-10 pr-9 py-2 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                    placeholder="min. 6 char"
                  />
                  <button
                    type="button"
                    onClick={() => setTampilkanPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
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
                <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
                  Konfirmasi
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  />
                  <input
                    type={tampilkanKonfirmasi ? "text" : "password"}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full rounded-xl bg-white border pl-10 pr-14 py-2 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:border-neutral-900 transition-all placeholder:text-neutral-400 ${
                      konfirmasiCocok === false
                        ? "border-rose-400 focus:ring-rose-500/15"
                        : konfirmasiCocok === true
                          ? "border-emerald-400 focus:ring-emerald-500/15"
                          : "border-neutral-300 focus:ring-neutral-900/10"
                    }`}
                    placeholder="ulangi"
                  />
                  {konfirmasiCocok !== null && (
                    <span
                      className={`absolute right-8 top-1/2 -translate-y-1/2 ${
                        konfirmasiCocok ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {konfirmasiCocok ? <Check size={14} /> : <X size={14} />}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setTampilkanKonfirmasi((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
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
              <p className="text-xs text-rose-600 font-medium">
                {errors.password[0]}
              </p>
            )}

            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 text-sm active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
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

            <p className="text-center text-sm text-neutral-500 pt-3 border-t border-neutral-200">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-neutral-900 font-medium hover:underline"
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