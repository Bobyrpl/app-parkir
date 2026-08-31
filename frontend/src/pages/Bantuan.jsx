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
            <mark className="bg-[#C90000]/10 text-[#C90000] rounded-sm px-0.5">
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
        <div className="min-h-screen bg-white text-neutral-900 flex flex-col antialiased">
            {/* Header navbar */}
            <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
                <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between gap-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Kembali ke Beranda</span>
                    </Link>

                    <Link to="/" className="flex items-center gap-2.5 shrink-0">
                        <img
                            src="/images/logo.png"
                            alt="Logo ParkirKu"
                            className="h-7 w-7 object-contain rounded"
                        />
                        <span className="font-semibold text-sm tracking-tight text-neutral-900">
                            {BRAND_NAME}
                        </span>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="border-b border-neutral-200 py-16 sm:py-20 px-4 sm:px-6 md:px-8 text-center">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight mb-4">
                        Bantuan &amp; dukungan pengguna
                    </h1>
                    <p className="text-neutral-500 leading-relaxed max-w-xl mx-auto">
                        Temukan petunjuk seputar transaksi parkir, tarif, cetak struk, dan
                        aktivasi akun {BRAND_NAME}.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-12 pb-20 flex-1">
                <div className="relative mb-10 max-w-md mx-auto md:mx-0">
                    <Search
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpenIndex(null);
                        }}
                        placeholder="Cari pertanyaan, mis. 'lupa password'..."
                        className="w-full rounded-full bg-white border border-neutral-200 pl-11 pr-4 py-3 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                    />
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-lg font-semibold text-neutral-900 tracking-tight">
                                Pertanyaan umum (FAQ)
                            </p>
                            <span className="text-xs text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
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
                                        className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
                                            isOpen
                                                ? "border-neutral-900 bg-white"
                                                : "border-neutral-200 bg-white hover:border-neutral-300"
                                        }`}
                                    >
                                        <button
                                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                                            aria-expanded={isOpen}
                                            className="w-full flex items-center gap-4 text-left px-5 py-4 focus-visible:outline-none"
                                        >
                                            <span
                                                className={`flex-none w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                                    isOpen
                                                        ? "bg-neutral-900 text-white"
                                                        : "bg-neutral-100 text-neutral-500"
                                                }`}
                                            >
                                                <Icon size={16} />
                                            </span>
                                            <span className="flex-1 text-sm font-medium text-neutral-900 leading-snug">
                                                {highlight(f.q, query)}
                                            </span>
                                            <ChevronDown
                                                size={16}
                                                className={`flex-none text-neutral-400 transition-transform duration-200 ${
                                                    isOpen ? "rotate-180 text-neutral-900" : ""
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
                                                <p className="text-sm text-neutral-500 leading-relaxed px-5 pb-5 pl-[4.25rem]">
                                                    {highlight(f.a, query)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredFaq.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-12 flex flex-col items-center text-center gap-2">
                                    <SearchX size={24} className="text-neutral-400" />
                                    <p className="text-sm font-medium text-neutral-700">
                                        Tidak ada pertanyaan yang cocok dengan &ldquo;{query}&rdquo;.
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        Coba gunakan kata kunci lain, atau hubungi kontak dukungan kami di samping.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-lg font-semibold text-neutral-900 mb-6 tracking-tight">
                            Kontak bantuan
                        </p>

                        <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-5 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                                <span className="text-xs text-neutral-500 uppercase tracking-wide">
                                    Layanan respons
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Online
                                </span>
                            </div>

                            <div className="space-y-3">
                                {KONTAK.map((k) => {
                                    const Icon = k.icon;
                                    return (
                                        <div
                                            key={k.label}
                                            className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-neutral-200"
                                        >
                                            <span className="flex-none w-9 h-9 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
                                                <Icon size={15} />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-0.5">
                                                    {k.label}
                                                </p>
                                                <p className="text-xs font-semibold text-neutral-900 truncate">
                                                    {k.value}
                                                </p>
                                                {k.meta && (
                                                    <p className="text-[11px] text-neutral-400 mt-0.5">{k.meta}</p>
                                                )}
                                            </div>
                                            {k.href ? (
                                                <a
                                                    href={k.href}
                                                    target={k.href.startsWith("http") ? "_blank" : undefined}
                                                    rel="noreferrer"
                                                    className="flex-none text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-full self-center transition-colors"
                                                >
                                                    {k.action}
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => handleCopy(k.value, k.label)}
                                                    className="flex-none self-center text-neutral-400 hover:text-neutral-900 p-1 rounded-full transition-colors"
                                                    aria-label={`Salin ${k.label}`}
                                                >
                                                    {copied === k.label ? (
                                                        <Check size={14} className="text-emerald-600" />
                                                    ) : (
                                                        <Copy size={14} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-3 border-t border-neutral-200 space-y-2">
                                <p className="text-xs font-medium text-neutral-700">Butuh akses akun?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        to="/register"
                                        className="text-center rounded-full bg-neutral-900 text-white font-medium py-2 text-xs hover:bg-neutral-800 transition-colors"
                                    >
                                        Daftar
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="text-center rounded-full border border-neutral-300 text-neutral-700 font-medium py-2 text-xs hover:bg-neutral-100 transition-colors"
                                    >
                                        Masuk
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Ajukan Aktivasi Akun */}
                <div id="aktivasi-akun" className="mt-20 scroll-mt-24">
                    <div className="max-w-xl">
                        <h2 className="text-xl font-semibold text-neutral-900 mb-1 tracking-tight">
                            Ajukan aktivasi akun
                        </h2>
                        <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                            Jika akun Anda dinonaktifkan oleh admin dan tidak bisa login, kirimkan
                            permohonan dengan memasukkan username Anda di bawah.
                        </p>
                    </div>

                    <div className="max-w-lg rounded-3xl bg-white border border-neutral-200 p-6 sm:p-8">
                        {akTerkirim ? (
                            <div className="flex flex-col items-center text-center gap-3 py-4">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    <CheckCircle2 size={28} />
                                </span>
                                <h3 className="text-lg font-semibold text-neutral-900">
                                    Permintaan terkirim
                                </h3>
                                <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">
                                    Permintaan aktivasi untuk username{" "}
                                    <span className="text-neutral-900 font-semibold">{akUsername}</span>{" "}
                                    telah masuk ke dashboard admin.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAkTerkirim(false);
                                        setAkUsername("");
                                        setAkCatatan("");
                                    }}
                                    className="mt-2 text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-2"
                                >
                                    Ajukan untuk akun lainnya
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAjukanAktivasi} className="space-y-5">
                                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                                        <UserCheck size={16} />
                                    </span>
                                    <p className="text-xs text-neutral-500">
                                        Admin akan meninjau data permohonan Anda.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="ak-username"
                                        className="block text-xs text-neutral-500 mb-1.5"
                                    >
                                        Username terdaftar
                                    </label>
                                    <input
                                        id="ak-username"
                                        type="text"
                                        value={akUsername}
                                        onChange={(e) => setAkUsername(e.target.value)}
                                        required
                                        placeholder="mis. petugas_01"
                                        className="w-full rounded-xl bg-white border border-neutral-200 px-3.5 py-2.5 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-baseline justify-between mb-1.5">
                                        <label
                                            htmlFor="ak-catatan"
                                            className="block text-xs text-neutral-500"
                                        >
                                            Alasan / catatan{" "}
                                            <span className="text-neutral-400 font-normal">(opsional)</span>
                                        </label>
                                        <span className="text-[10px] text-neutral-400">
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
                                        className="w-full rounded-xl bg-white border border-neutral-200 px-3.5 py-2.5 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none transition-shadow"
                                    />
                                </div>

                                {akError && (
                                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                                        {akError}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={akLoading}
                                    className="w-full rounded-full bg-neutral-900 text-white font-medium py-3 text-sm hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50"
                                >
                                    {akLoading ? "Mengirim permintaan..." : "Kirim permintaan aktivasi"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-neutral-200 mt-auto">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
                    <p>
                        © {new Date().getFullYear()} {BRAND_NAME} • {BRAND_LOCATION}
                    </p>
                    <p className="text-neutral-400">Sistem parkir elektronik terpadu</p>
                </div>
            </footer>
        </div>
    );
}