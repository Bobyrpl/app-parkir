import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, User, Lock, Eye, EyeOff, LogIn, Loader2, ShieldCheck, UserCog, Crown, Sparkles } from 'lucide-react';

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
        <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6 antialiased relative overflow-hidden">
            {/* Ambient background glow & dot grid */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 40%, transparent 100%)',
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
                            <span>PORTAL TERPADU</span>
                        </div>
                        <h2 className="font-display font-bold text-2xl text-zinc-100 leading-snug mb-3">
                            Sistem Parkir Modern
                            <br />
                            <span className="text-zinc-400">Pelabuhan Tanjung Perak</span>
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto mb-8">
                            Kelola area, tarif, dan transaksi parkir dalam satu portal — dari pintu masuk hingga cetak struk dan rekap akurat.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                                <ShieldCheck size={13} className="text-emerald-400" />
                                Admin
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                                <UserCog size={13} className="text-blue-400" />
                                Petugas
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                                <Crown size={13} className="text-amber-400" />
                                Owner
                            </span>
                        </div>
                    </div>
                </div>

                {/* Panel kanan - form login */}
                <div className="p-6 sm:p-10 flex flex-col justify-center bg-zinc-950/40">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 mb-8 w-fit transition-colors group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        Kembali ke beranda
                    </Link>

                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-100 mb-1 tracking-tight">
                        Masuk ke Akun
                    </h1>
                    <p className="text-sm text-zinc-400 mb-8">
                        Gunakan username dan password yang telah terdaftar.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                                USERNAME
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 pl-10 pr-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all placeholder:text-zinc-600"
                                    placeholder="mis. admin / petugas"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                                PASSWORD
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                <input
                                    type={tampilkanPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 pl-10 pr-10 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all placeholder:text-zinc-600"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setTampilkanPassword((v) => !v)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded"
                                    aria-label={tampilkanPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {tampilkanPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5 animate-in fade-in">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-zinc-100 text-zinc-950 font-semibold py-3 text-sm hover:bg-white active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-white/5 mt-2"
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

                        <div className="pt-4 border-t border-zinc-900 space-y-2 text-center text-xs">
                            <p className="text-zinc-400">
                                Belum punya akun pelanggan?{' '}
                                <Link to="/register" className="text-zinc-200 hover:text-white font-medium hover:underline">
                                    Daftar di sini
                                </Link>
                            </p>
                 a           <p className="text-zinc-500">
                                Akun dinonaktifkan?{' '}
                                <Link to="/bantuan#aktivasi-akun" className="text-zinc-400 hover:text-zinc-200 hover:underline">
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