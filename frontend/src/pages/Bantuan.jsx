import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Search,
    ChevronDown,
    KeyRound,
    Printer,
    Lock,
    UserX,
    UserCheck,
    BarChart3,
    Mail,
    MessageCircle,
    Clock,
    Copy,
    Check,
    CheckCircle2,
    SearchX,
    ShieldCheck,
} from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const BRAND_NAME = "ParkirKu";
const BRAND_LOCATION = "Pelabuhan Tanjung Perak";

const FAQ = [
    {
        icon: KeyRound,
        q: `Bagaimana cara mulai menggunakan ${BRAND_NAME}?`,
        a: "Hubungi admin area parkir Anda untuk dibuatkan akun, lalu login sesuai peran (Admin/Petugas/Owner). Anda juga bisa mendaftar sendiri sebagai Petugas lewat halaman Daftar.",
    },
    {
        icon: Printer,
        q: "Apakah bisa cetak struk otomatis?",
        a: "Bisa. Petugas dapat mencetak struk langsung dari halaman transaksi setelah kendaraan dicatat keluar.",
    },
    {
        icon: Lock,
        q: "Saya lupa password akun, bagaimana cara reset?",
        a: "Saat ini reset password dilakukan oleh admin. Hubungi admin area parkir Anda melalui kontak di bawah untuk dibantu reset password.",
    },
    {
        icon: UserX,
        q: "Kenapa akun saya tidak bisa login?",
        a: "Kemungkinan akun Anda sedang dinonaktifkan oleh admin, atau username/password yang dimasukkan salah. Kalau akun dinonaktifkan, isi form \"Ajukan Aktivasi Akun\" di bagian bawah halaman ini — admin akan meninjau dan mengaktifkannya kembali.",
    },
    {
        icon: BarChart3,
        q: "Bagaimana cara melihat rekap transaksi?",
        a: "Khusus role Owner, rekap transaksi bisa dilihat di menu Rekap dengan memilih rentang tanggal, lalu bisa diekspor ke CSV atau dicetak.",
    },
];

const KONTAK = [
    {
        icon: Mail,
        label: "Email Support",
        value: "bobyabdullohhh456@gmail.com",
        href: "mailto:bobyabdullohhh456@gmail.com?subject=Bantuan%20ParkirKu",
        action: "Kirim email",
        meta: "Balasan dalam 1×24 jam kerja",
    },
    {
        icon: MessageCircle,
        label: "WhatsApp Admin",
        value: "0857-2803-5284",
        href: "https://wa.me/6285728035284?text=Halo%20Admin%2C%20saya%20butuh%20bantuan%20terkait%20ParkirKu",
        action: "Chat sekarang",
        meta: "Respons tercepat, jam operasional",
    },
    {
        icon: Clock,
        label: "Jam Operasional",
        value: "Senin–Sabtu, 08.00–17.00 WIB",
    },
];

// Wraps the portion of `text` matching `query` in a <mark>.
function highlight(text, query) {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-[#C90000]/25 text-[#C90000] rounded-sm px-0.5">
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export default function Bantuan() {
    const [query, setQuery] = useState("");
    const [openIndex, setOpenIndex] = useState(0);
    const [copied, setCopied] = useState(null);

    // Form "Ajukan Aktivasi Akun" - tertanam langsung di halaman Bantuan.
    const [akUsername, setAkUsername] = useState("");
    const [akCatatan, setAkCatatan] = useState("");
    const [akLoading, setAkLoading] = useState(false);
    const [akError, setAkError] = useState("");
    const [akTerkirim, setAkTerkirim] = useState(false);
    const { showError } = useToast();

    // SPA navigation (React Router) tidak auto-scroll ke #hash seperti navigasi
    // browser biasa, jadi di-handle manual di sini.
    useEffect(() => {
        if (window.location.hash === "#aktivasi-akun") {
            document.getElementById("aktivasi-akun")?.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    const filteredFaq = FAQ.filter(
        (f) =>
            f.q.toLowerCase().includes(query.toLowerCase()) ||
            f.a.toLowerCase().includes(query.toLowerCase()),
    );

    const handleCopy = (value, label) => {
        navigator.clipboard?.writeText(value);
        setCopied(label);
        setTimeout(() => setCopied(null), 1500);
    };

    async function handleAjukanAktivasi(e) {
        e.preventDefault();
        setAkError("");
        setAkLoading(true);
        try {
            await api.post("/permintaan-aktivasi", {
                username: akUsername,
                catatan: akCatatan || undefined,
            });
            setAkTerkirim(true);
        } catch (err) {
            const pesan =
                err.response?.data?.message ||
                err.response?.data?.errors?.username?.[0] ||
                "Gagal mengirim permintaan aktivasi.";
            setAkError(pesan);
            showError(pesan);
        } finally {
            setAkLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col antialiased relative">
            {/* Header navbar */}
            <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
                <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between gap-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Kembali ke Beranda</span>
                    </Link>

                    <Link
                        to="/"
                        className="flex items-center gap-2.5 shrink-0"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Logo ParkirKu"
                            className="h-7 w-7 object-contain rounded"
                        />
                        <span className="font-display font-bold text-sm tracking-tight text-zinc-100">
                            {BRAND_NAME}
                        </span>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative border-b border-zinc-800/80 py-14 sm:py-16 px-4 sm:px-6 md:px-8 text-center overflow-hidden">
                <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                        backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 40%, transparent 100%)',
                    }}
                />
                <div className="relative max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>PUSAT BANTUAN & PANDUAN</span>
                    </div>
                    <h1 className="font-display font-bold text-3xl sm:text-4xl text-zinc-100 tracking-tight mb-3">
                        Bantuan &amp; Dukungan Pengguna
                    </h1>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
                        Temukan petunjuk seputar booking parkir, tarif, cetak struk, dan aktivasi akun {BRAND_NAME}.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-8 pb-16 flex-1">
                <div className="relative mb-8 max-w-md mx-auto md:mx-0">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpenIndex(null);
                        }}
                        placeholder="Cari pertanyaan, mis. 'lupa password'..."
                        className="w-full rounded-2xl bg-zinc-900/80 border border-zinc-800 pl-10 pr-4 py-2.5 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all shadow-inner"
                    />
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                                Pertanyaan Umum (FAQ)
                            </p>
                            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">
                                {filteredFaq.length} dari {FAQ.length}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {filteredFaq.map((f) => {
                                const idx = FAQ.indexOf(f);
                                const isOpen = openIndex === idx;
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.q}
                                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                            isOpen
                                                ? "bg-zinc-900/80 border-zinc-700 shadow-xl shadow-black/40"
                                                : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700"
                                        }`}
                                    >
                                        <button
                                            onClick={() =>
                                                setOpenIndex(
                                                    isOpen ? null : idx,
                                                )
                                            }
                                            aria-expanded={isOpen}
                                            className="w-full flex items-center gap-3.5 text-left px-5 py-4 focus-visible:outline-none"
                                        >
                                            <span
                                                className={`flex-none w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                                    isOpen
                                                        ? "bg-zinc-100 text-zinc-950 font-bold"
                                                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                                                }`}
                                            >
                                                <Icon size={16} />
                                            </span>
                                            <span className="flex-1 text-sm font-semibold text-zinc-200 leading-snug">
                                                {highlight(f.q, query)}
                                            </span>
                                            <ChevronDown
                                                size={16}
                                                className={`flex-none text-zinc-400 transition-transform duration-200 ${
                                                    isOpen ? "rotate-180 text-zinc-100" : ""
                                                }`}
                                            />
                                        </button>
                                        <div
                                            className={`grid transition-all duration-200 ease-out ${
                                                isOpen
                                                    ? "grid-rows-[1fr] opacity-100"
                                                    : "grid-rows-[0fr] opacity-0"
                                            }`}
                                        >
                                            <div className="overflow-hidden">
                                                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed px-5 pb-5 pl-16">
                                                    {highlight(f.a, query)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredFaq.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-5 py-12 flex flex-col items-center text-center gap-2">
                                    <SearchX
                                        size={24}
                                        className="text-zinc-500"
                                    />
                                    <p className="text-sm font-medium text-zinc-300">
                                        Tidak ada pertanyaan yang cocok dengan
                                        &ldquo;{query}&rdquo;.
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        Coba gunakan kata kunci lain, atau hubungi kontak dukungan kami di samping.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="font-display font-bold text-lg text-zinc-100 mb-4 tracking-tight">
                            Kontak Bantuan
                        </p>

                        <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-5 shadow-xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                                    LAYANAN RESPONS
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    ONLINE
                                </span>
                            </div>

                            <div className="space-y-3.5">
                                {KONTAK.map((k) => {
                                    const Icon = k.icon;
                                    return (
                                        <div
                                            key={k.label}
                                            className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60"
                                        >
                                            <span className="flex-none w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                                                <Icon size={15} />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">
                                                    {k.label}
                                                </p>
                                                <p className="text-xs font-semibold text-zinc-200 truncate">
                                                    {k.value}
                                                </p>
                                                {k.meta && (
                                                    <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                                                        {k.meta}
                                                    </p>
                                                )}
                                            </div>
                                            {k.href ? (
                                                <a
                                                    href={k.href}
                                                    target={
                                                        k.href.startsWith(
                                                            "http",
                                                        )
                                                            ? "_blank"
                                                            : undefined
                                                    }
                                                    rel="noreferrer"
                                                    className="flex-none text-xs font-semibold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg self-center transition-colors"
                                                >
                                                    {k.action}
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleCopy(
                                                            k.value,
                                                            k.label,
                                                        )
                                                    }
                                                    className="flex-none self-center text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-colors"
                                                    aria-label={`Salin ${k.label}`}
                                                >
                                                    {copied === k.label ? (
                                                        <Check
                                                            size={14}
                                                            className="text-emerald-400"
                                                        />
                                                    ) : (
                                                        <Copy size={14} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-3 border-t border-zinc-800 space-y-2">
                                <p className="text-xs font-medium text-zinc-300">
                                    Butuh akses akun?
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        to="/register"
                                        className="text-center rounded-xl bg-zinc-100 text-zinc-950 font-semibold py-2 text-xs hover:bg-white transition-colors"
                                    >
                                        Daftar
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="text-center rounded-xl border border-zinc-700 text-zinc-200 font-semibold py-2 text-xs hover:bg-zinc-800 transition-colors"
                                    >
                                        Masuk
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Ajukan Aktivasi Akun */}
                <div id="aktivasi-akun" className="mt-14 scroll-mt-24">
                    <div className="max-w-xl">
                        <h2 className="font-display font-bold text-xl text-zinc-100 mb-1 tracking-tight">Ajukan Aktivasi Akun</h2>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                            Jika akun Anda dinonaktifkan oleh admin dan tidak bisa login, kirimkan permohonan dengan memasukkan username Anda di bawah.
                        </p>
                    </div>

                    <div className="max-w-lg rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-2xl p-6 sm:p-7">
                        {akTerkirim ? (
                            <div className="flex flex-col items-center text-center gap-3 py-4 animate-in fade-in">
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                    <CheckCircle2 size={28} />
                                </span>
                                <h3 className="font-display font-bold text-lg text-zinc-100">
                                    Permintaan Terkirim
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                                    Permintaan aktivasi untuk username{" "}
                                    <span className="text-zinc-100 font-mono font-bold">{akUsername}</span>{" "}
                                    telah masuk ke dashboard admin.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAkTerkirim(false);
                                        setAkUsername("");
                                        setAkCatatan("");
                                    }}
                                    className="mt-2 text-xs font-mono text-zinc-300 hover:text-white underline"
                                >
                                    Ajukan untuk akun lainnya
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAjukanAktivasi} className="space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                                        <UserCheck size={16} />
                                    </span>
                                    <p className="text-xs text-zinc-400 font-medium">
                                        Admin akan meninjau data permohonan Anda.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="ak-username"
                                        className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5"
                                    >
                                        USERNAME TERDAFTAR
                                    </label>
                                    <input
                                        id="ak-username"
                                        type="text"
                                        value={akUsername}
                                        onChange={(e) => setAkUsername(e.target.value)}
                                        required
                                        placeholder="mis. petugas_01"
                                        className="w-full rounded-xl bg-zinc-950/70 border border-zinc-800 px-3.5 py-2.5 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-baseline justify-between mb-1.5">
                                        <label
                                            htmlFor="ak-catatan"
                                            className="block text-xs font-mono text-zinc-400 uppercase tracking-wider"
                                        >
                                            ALASAN / CATATAN{" "}
                                            <span className="text-zinc-600 lowercase font-normal">
                                                (opsional)
                                            </span>
                                        </label>
                                        <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                                            {akCatatan.length}/500
                                        </span>
                                    </div>
                                    <textarea
                                        id="ak-catatan"
                                        value={akCatatan}
                                        onChange={(e) => setAkCatatan(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Tuliskan keterangan permohonan aktivasi..."
                                        className="w-full rounded-xl bg-zinc-950/70 border border-zinc-800 px-3.5 py-2.5 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 resize-none transition-all"
                                    />
                                </div>

                                {akError && (
                                    <p className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
                                        {akError}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={akLoading}
                                    className="w-full rounded-full bg-zinc-100 text-zinc-950 font-semibold py-3 text-sm hover:bg-white active:scale-[0.99] transition-all disabled:opacity-50"
                                >
                                    {akLoading ? "Mengirim Permintaan..." : "Kirim Permintaan Aktivasi"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-zinc-800/80 mt-auto bg-zinc-950/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
                    <p>© {new Date().getFullYear()} {BRAND_NAME} • {BRAND_LOCATION}</p>
                    <p className="text-zinc-600">SISTEM PARKIR ELEKTRONIK TERPADU</p>
                </div>
            </footer>
        </div>
    );
}