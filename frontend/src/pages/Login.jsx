import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme, BRAND_ACCENT } from '../context/ThemeContext';
import { THEME_LABELS } from '../config/theme.config';
import { ArrowLeft, User, Lock, Eye, EyeOff, LogIn, Loader2, ShieldCheck, UserCog, Crown, Sparkles, Sun, Moon } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tampilkanPassword, setTampilkanPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const { themeVars, isDark, toggleTheme } = useTheme();

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
        <div
            style={themeVars}
            className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-4 sm:p-6 antialiased relative overflow-hidden transition-colors duration-300"
        >
            {/* Ambient background glow & dot grid */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: `radial-gradient(var(--color-border) 1.25px, transparent 1.25px)`,
                    backgroundSize: '24px 24px',
                    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 40%, transparent 100%)',
                }}
            />

            {/* Tombol ganti tema */}
            <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? THEME_LABELS.dark.title : THEME_LABELS.light.title}
                aria-label={isDark ? THEME_LABELS.dark.ariaLabel : THEME_LABELS.light.ariaLabel}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 h-9 w-9 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{ '--tw-ring-color': BRAND_ACCENT }}
            >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="relative w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-xl shadow-2xl shadow-black/40">
                {/* Panel kiri - identitas sistem */}
                <div className="relative hidden md:flex flex-col items-center justify-center text-center bg-[var(--color-section)] border-r border-[var(--color-border)] p-10">
                    <div className="relative flex flex-col items-center">
                        <img
                            src="/images/logo.png"
                            alt="Logo ParkirKu"
                            className="h-16 w-16 object-contain rounded-2xl mb-6 shadow-xl border border-[var(--color-border)]"
                        />
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-4 shadow-sm">
                            <Sparkles size={12} />
                            <span>PORTAL TERPADU</span>
                        </div>
                        <h2 className="font-display font-bold text-2xl text-[var(--color-text)] leading-snug mb-3">
                            Sistem Parkir Modern
                            <br />
                            <span className="text-[var(--color-text-secondary)]">Pelabuhan Tanjung Perak</span>
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xs mx-auto mb-8">
                            Kelola area, tarif, dan transaksi parkir dalam satu portal — dari pintu masuk hingga cetak struk dan rekap akurat.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                <ShieldCheck size={13} className="text-emerald-500" />
                                Admin
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                <UserCog size={13} className="text-blue-500" />
                                Petugas
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                <Crown size={13} className="text-amber-500" />
                                Owner
                            </span>
                        </div>
                    </div>
                </div>

                {/* Panel kanan - form login */}
                <div className="p-6 sm:p-10 flex flex-col justify-center bg-[var(--color-bg)]">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-8 w-fit transition-colors group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        Kembali ke beranda
                    </Link>

                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--color-text)] mb-1 tracking-tight">
                        Masuk ke Akun
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                        Gunakan username dan password yang telah terdaftar.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                                USERNAME
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] pl-10 pr-3.5 py-2.5 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--color-text-muted)]"
                                    style={{ '--tw-ring-color': `${BRAND_ACCENT}55` }}
                                    placeholder="mis. admin / petugas"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                                PASSWORD
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                                <input
                                    type={tampilkanPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] pl-10 pr-10 py-2.5 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--color-text-muted)]"
                                    style={{ '--tw-ring-color': `${BRAND_ACCENT}55` }}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setTampilkanPassword((v) => !v)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors p-1 rounded"
                                    aria-label={tampilkanPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {tampilkanPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs font-mono text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5 animate-in fade-in">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-[var(--color-button-bg)] text-[var(--color-button-text)] font-semibold py-3 text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-2"
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

                        <div className="pt-4 border-t border-[var(--color-border)] space-y-2 text-center text-xs">
                            <p className="text-[var(--color-text-secondary)]">
                                Belum punya akun pelanggan?{' '}
                                <Link to="/register" className="text-[var(--color-text)] hover:underline font-medium">
                                    Daftar di sini
                                </Link>
                            </p>
                            <p className="text-[var(--color-text-muted)]">
                                Akun dinonaktifkan?{' '}
                                <Link to="/bantuan#aktivasi-akun" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:underline">
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
