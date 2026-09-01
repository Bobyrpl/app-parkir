import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, User, Lock, Eye, EyeOff, LogIn, Loader2, ShieldCheck, UserCog, Crown } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tampilkanPassword, setTampilkanPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(username, password);
            showSuccess(`Login berhasil, selamat datang ${user.nama_lengkap}!`);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'petugas') navigate('/petugas');
            else if (user.role === 'owner') navigate('/owner');
            else navigate('/pelanggan');
        } catch (err) {
            const pesan = err.response?.data?.message || 'Username atau password salah';
            setError(pesan);
            showError(pesan);
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
                        Portal Terpadu
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug mb-3">
                        Sistem Parkir Modern
                        <br />
                        <span className="text-neutral-400">Pelabuhan Tanjung Perak</span>
                    </h2>
                    <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto mb-8">
                        Kelola area, tarif, dan transaksi parkir dalam satu portal — dari pintu masuk hingga cetak struk dan rekap akurat.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-neutral-300">
                            <ShieldCheck size={13} />
                            Admin
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-neutral-300">
                            <UserCog size={13} />
                            Petugas
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-neutral-300">
                            <Crown size={13} />
                            Owner
                        </span>
                    </div>
                </div>

                {/* Panel kanan - form login, gaya bersih seperti section landing page */}
                <div className="p-6 sm:p-10 flex flex-col justify-center bg-white">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8 w-fit group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        Kembali ke beranda
                    </Link>

                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 mb-1">
                        Masuk ke Akun
                    </h1>
                    <p className="text-sm text-neutral-500 mb-8">
                        Gunakan username dan password yang telah terdaftar.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full rounded-xl bg-white border border-neutral-300 pl-10 pr-3.5 py-2.5 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                                    placeholder="mis. admin / petugas"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                <input
                                    type={tampilkanPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-xl bg-white border border-neutral-300 pl-10 pr-10 py-2.5 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all placeholder:text-neutral-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setTampilkanPassword((v) => !v)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded"
                                    aria-label={tampilkanPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {tampilkanPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 text-sm active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <LogIn size={16} />
                                    Masuk ke Portal
                                </>
                            )}
                        </button>

                        <div className="pt-4 border-t border-neutral-200 space-y-2 text-center text-sm">
                            <p className="text-neutral-500">
                                Belum punya akun pelanggan?{' '}
                                <Link to="/register" className="text-neutral-900 hover:underline font-medium">
                                    Daftar di sini
                                </Link>
                            </p>
                            <p className="text-neutral-400 text-xs">
                                Akun dinonaktifkan?{' '}
                                <Link to="/bantuan#aktivasi-akun" className="text-neutral-500 hover:text-neutral-900 hover:underline">
                                    Ajukan aktivasi ulang
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}