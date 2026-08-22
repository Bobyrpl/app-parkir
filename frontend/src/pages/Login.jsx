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
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
                {/* Panel kiri - identitas / signature visual */}
                <div className="relative hidden md:flex flex-col justify-between bg-[#F1F4FA] p-10 overflow-hidden">
                    <div
                        className="absolute inset-y-0 -left-6 w-16 opacity-90"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(-45deg, #1B2A6B 0 18px, #14181F 18px 36px)',
                        }}
                    />
                    <div className="relative pl-10">
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#1B2A6B]" />
                            <span className="font-display text-2xl tracking-tight text-[#10131A]">
                                SISTEM  PARKIR PELABUHAN TANJUNG PERAK
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-[#64708A] font-mono">
                            SISTEM MANAJEMEN PARKIR PELABUHAN TANJUNG PERAK
                        </p>
                    </div>

                    <div className="relative pl-10">
                        <p className="text-[#38424F] text-sm leading-relaxed">
                            Kelola area, tarif, dan transaksi parkir dalam satu
                            portal — dari pintu masuk sampai cetak struk.
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
                        </div>
                    </div>
                </div>

                {/* Panel kanan - form login */}
                <div className="bg-[#E8ECF5] p-10 flex flex-col justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#64708A] hover:text-[#10131A] mb-6 w-fit"
                    >
                        <ArrowLeft size={14} />
                        Kembali ke beranda
                    </Link>

                    <h1 className="font-display text-2xl text-[#10131A] mb-1">
                        Masuk ke akun
                    </h1>
                    <p className="text-sm text-[#64708A] mb-8">
                        Gunakan username dan password yang terdaftar.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-[#64708A] mb-1.5">
                                USERNAME
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64708A]" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full rounded-md bg-white border border-black/10 pl-9 pr-3 py-2.5 text-[#10131A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                                    placeholder="mis. admin"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-[#64708A] mb-1.5">
                                PASSWORD
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64708A]" />
                                <input
                                    type={tampilkanPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-md bg-white border border-black/10 pl-9 pr-10 py-2.5 text-[#10131A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setTampilkanPassword((v) => !v)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64708A] hover:text-[#10131A] transition-colors"
                                    aria-label={tampilkanPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {tampilkanPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
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
                                    <LogIn size={16} />
                                    Masuk
                                </>
                            )}
                        </button>

                        <p className="text-center text-sm text-[#64708A]">
                            Belum punya akun?{' '}
                            <Link to="/register" className="text-[#1B2A6B] hover:underline">
                                Daftar di sini
                            </Link>
                        </p>
                        <p className="text-center text-xs text-[#64708A]">
                            Akun dinonaktifkan admin?{' '}
                            <Link to="/bantuan#aktivasi-akun" className="text-[#1B2A6B] hover:underline">
                                Ajukan aktivasi ulang
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}