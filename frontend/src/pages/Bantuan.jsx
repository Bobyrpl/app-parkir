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
            <mark className="bg-[#078DE9]/25 text-[#078DE9] rounded-sm px-0.5">
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
        <div className="min-h-screen bg-[#080F28] text-white flex flex-col antialiased">
            {/* signature: parking-barrier stripe */}
            <div
                className="h-1.5 w-full shrink-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(-45deg, #078DE9 0 14px, #0B1638 14px 28px)",
                }}
                aria-hidden="true"
            />

            <header className="sticky top-0 z-10 border-b border-white/10 bg-[#080F28]/85 backdrop-blur-md">
                <div className="max-w-4xl mx-auto w-full px-6 md:px-12 py-5 flex items-center justify-between gap-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8B96C4] hover:text-white transition-colors w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] rounded-sm"
                    >
                        <ArrowLeft size={14} strokeWidth={2} />
                        Kembali ke beranda
                    </Link>

                    <Link
                        to="/"
                        className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] rounded-sm"
                    >
                        <span className="h-2 w-2 rounded-full bg-[#078DE9]" />
                        <span className="font-display text-sm tracking-tight">
                            {BRAND_NAME}
                        </span>
                    </Link>
                </div>
            </header>

            <section className="relative bg-gradient-to-br from-[#0B1638] to-[#080F28] py-16 px-6 md:px-12 text-center overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(-45deg, #FFFFFF 0 18px, transparent 18px 36px)",
                    }}
                    aria-hidden="true"
                />
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    <span className="absolute h-1.5 w-1.5 rounded-full bg-[#078DE9] top-[20%] left-[15%]" />
                    <span className="absolute h-1.5 w-1.5 rounded-full bg-[#F0C268] top-[30%] right-[18%]" />
                    <span className="absolute h-1.5 w-1.5 rounded-full bg-[#57B393] top-[70%] left-[22%]" />
                    <span className="absolute h-1.5 w-1.5 rounded-full bg-[#935AB3] top-[75%] right-[25%]" />
                </div>
                <div className="relative max-w-2xl mx-auto">
                    <p className="text-xs font-mono text-white/70 tracking-[0.15em] mb-3">
                        PUSAT BANTUAN
                    </p>
                    <h1 className="font-serif font-bold text-3xl md:text-4xl text-white tracking-tight mb-3">
                        Bantuan &amp; Dukungan Akun
                    </h1>
                    <p className="text-sm text-white/70 leading-relaxed max-w-xl mx-auto">
                        Temukan jawaban seputar akun, login, dan penggunaan{" "}
                        {BRAND_NAME}. Tidak menemukan yang Anda cari? Hubungi
                        tim support kami.
                    </p>
                </div>
            </section>

            <section className="max-w-4xl mx-auto w-full px-6 md:px-12 pt-10 pb-16 flex-1">
                <div className="relative mb-9 max-w-md mx-auto md:mx-0">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B96C4]"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpenIndex(null);
                        }}
                        placeholder="Cari pertanyaan, mis. 'lupa password'"
                        className="w-full rounded-lg bg-white/[0.04] border border-white/10 pl-9 pr-3 py-2.5 text-white text-sm placeholder:text-[#8B96C4]/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#078DE9] focus:border-transparent transition-shadow"
                    />
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-display text-lg tracking-tight">
                                Pertanyaan umum
                            </p>
                            <span className="text-[11px] font-mono text-[#8B96C4]/80 tabular-nums">
                                {filteredFaq.length} dari {FAQ.length}
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            {filteredFaq.map((f) => {
                                const idx = FAQ.indexOf(f);
                                const isOpen = openIndex === idx;
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.q}
                                        className={`rounded-xl bg-white/[0.04] border overflow-hidden transition-all duration-200 ${
                                            isOpen
                                                ? "border-[#078DE9]/25 shadow-[0_2px_14px_-4px_rgba(0,0,0,0.4)]"
                                                : "border-white/[0.06] hover:border-white/[0.12]"
                                        }`}
                                    >
                                        <button
                                            onClick={() =>
                                                setOpenIndex(
                                                    isOpen ? null : idx,
                                                )
                                            }
                                            aria-expanded={isOpen}
                                            className="w-full flex items-center gap-3 text-left px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] focus-visible:ring-inset"
                                        >
                                            <span
                                                className={`flex-none w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                                                    isOpen
                                                        ? "bg-[#078DE9] text-white"
                                                        : "bg-[#078DE9]/10 text-[#078DE9]"
                                                }`}
                                            >
                                                <Icon size={16} />
                                            </span>
                                            <span className="flex-1 text-sm font-medium leading-snug">
                                                {highlight(f.q, query)}
                                            </span>
                                            <ChevronDown
                                                size={16}
                                                className={`flex-none text-[#8B96C4] transition-transform duration-200 ${
                                                    isOpen ? "rotate-180 text-[#078DE9]" : ""
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
                                                <p className="text-sm text-[#8B96C4] leading-relaxed px-5 pb-4 pl-16">
                                                    {highlight(f.a, query)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredFaq.length === 0 && (
                                <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 flex flex-col items-center text-center gap-2">
                                    <SearchX
                                        size={20}
                                        className="text-[#8B96C4]"
                                    />
                                    <p className="text-sm text-[#8B96C4]">
                                        Tidak ada pertanyaan yang cocok dengan
                                        &ldquo;{query}&rdquo;.
                                    </p>
                                    <p className="text-xs text-[#8B96C4]/70">
                                        Coba kata kunci lain, atau hubungi tim
                                        support kami.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="font-display text-lg mb-4 tracking-tight">
                            Hubungi kami
                        </p>

                        {/* ticket-stub style contact card */}
                        <div className="relative rounded-xl bg-white/[0.04] border border-white/[0.06] shadow-[0_4px_20px_-6px_rgba(0,0,0,0.45)]">
                            <div className="flex items-center justify-between px-5 pt-4 pb-1">
                                <span className="text-[10px] font-mono text-[#8B96C4] tracking-[0.15em]">
                                    KONTAK SUPPORT
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#57B393]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#57B393]" />
                                    ONLINE
                                </span>
                            </div>
                            <div className="space-y-4 p-5 pt-3">
                                {KONTAK.map((k) => {
                                    const Icon = k.icon;
                                    return (
                                        <div
                                            key={k.label}
                                            className="flex items-start gap-3"
                                        >
                                            <span className="flex-none w-8 h-8 rounded-md bg-white/5 text-[#8B96C4] flex items-center justify-center">
                                                <Icon size={15} />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-mono text-[#8B96C4] tracking-wider mb-0.5">
                                                    {k.label.toUpperCase()}
                                                </p>
                                                <p className="text-sm text-white truncate">
                                                    {k.value}
                                                </p>
                                                {k.meta && (
                                                    <p className="text-[11px] text-[#8B96C4]/70 mt-0.5">
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
                                                    className="flex-none text-[10px] font-mono text-[#078DE9] hover:underline self-center"
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
                                                    className="flex-none self-center text-[#8B96C4] hover:text-white transition-colors"
                                                    aria-label={`Salin ${k.label}`}
                                                >
                                                    {copied === k.label ? (
                                                        <Check
                                                            size={14}
                                                            className="text-[#078DE9]"
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

                            {/* perforation */}
                            <div className="relative flex items-center px-5">
                                <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-white ring-1 ring-white/[0.04]" />
                                <div className="flex-1 border-t border-dashed border-white/15" />
                                <span className="absolute -right-[9px] w-4 h-4 rounded-full bg-white ring-1 ring-white/[0.04]" />
                            </div>

                            <div className="p-5">
                                <p className="text-sm font-medium mb-1">
                                    Butuh akses akun?
                                </p>
                                <p className="text-xs text-[#8B96C4] leading-relaxed mb-3">
                                    Daftar mandiri sebagai petugas, atau masuk
                                    kalau sudah punya akun.
                                </p>
                                <div className="flex gap-2">
                                    <Link
                                        to="/register"
                                        className="flex-1 text-center rounded-full bg-[#078DE9] text-white font-medium px-3 py-2 text-xs shadow-[0_2px_8px_-2px_rgba(27,42,107,0.5)] hover:bg-[#0670C0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080F28]"
                                    >
                                        Daftar
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="flex-1 text-center rounded-md border border-white/10 text-white font-medium px-3 py-2 text-xs hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080F28]"
                                    >
                                        Masuk
                                    </Link>
                                </div>
                                <a
                                    href="#aktivasi-akun"
                                    className="mt-2 block text-center rounded-md border border-dashed border-white/10 text-[#8B96C4] font-medium px-3 py-2 text-xs hover:bg-white/5 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080F28]"
                                >
                                    Akun dinonaktifkan? Ajukan aktivasi ulang
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Ajukan Aktivasi Akun - untuk akun yang dinonaktifkan admin
                    dan karenanya tidak bisa login sendiri buat request ini. */}
                <div id="aktivasi-akun" className="mt-14 scroll-mt-24">
                    <p className="font-display text-lg mb-1 tracking-tight">Ajukan Aktivasi Akun</p>
                    <p className="text-sm text-[#8B96C4] leading-relaxed mb-4 max-w-xl">
                        Kalau akun Anda dinonaktifkan admin dan tidak bisa login, isi
                        username Anda di bawah ini. Admin akan meninjau dan
                        mengaktifkan kembali akun Anda.
                    </p>

                    <div className="max-w-md rounded-xl bg-white/[0.04] border border-white/[0.06] shadow-[0_4px_20px_-6px_rgba(0,0,0,0.45)] p-6">
                        {akTerkirim ? (
                            <div className="flex flex-col items-center text-center gap-3 py-2 animate-[fadeIn_0.3s_ease-out]">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#57B393]/15 text-[#57B393]">
                                    <CheckCircle2 size={24} />
                                </span>
                                <h3 className="font-display text-base text-white">
                                    Permintaan Terkirim
                                </h3>
                                <p className="text-sm text-[#8B96C4] leading-relaxed">
                                    Permintaan aktivasi untuk username{" "}
                                    <span className="text-white font-mono">{akUsername}</span>{" "}
                                    sudah kami terima. Admin akan meninjau dan
                                    mengaktifkan akun Anda secepatnya.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAkTerkirim(false);
                                        setAkUsername("");
                                        setAkCatatan("");
                                    }}
                                    className="mt-1 text-xs font-mono text-[#078DE9] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] rounded-sm"
                                >
                                    Ajukan lagi untuk akun lain
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAjukanAktivasi} className="space-y-4">
                                <div className="flex items-center gap-3 mb-1 pb-4 border-b border-white/[0.06]">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#078DE9]/10 text-[#078DE9]">
                                        <UserCheck size={16} />
                                    </span>
                                    <p className="text-sm text-[#C9D3EA] leading-snug">
                                        Isi data di bawah untuk mengajukan aktivasi.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="ak-username"
                                        className="block text-xs font-mono text-[#8B96C4] tracking-wide mb-1.5"
                                    >
                                        USERNAME
                                    </label>
                                    <input
                                        id="ak-username"
                                        type="text"
                                        value={akUsername}
                                        onChange={(e) => setAkUsername(e.target.value)}
                                        required
                                        placeholder="Username akun yang dinonaktifkan"
                                        className="w-full rounded-md bg-white/[0.05] border border-white/15 px-3 py-2.5 text-white text-sm placeholder:text-[#8B96C4]/50 focus:outline-none focus:ring-2 focus:ring-[#078DE9] focus:border-transparent transition-shadow"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-baseline justify-between mb-1.5">
                                        <label
                                            htmlFor="ak-catatan"
                                            className="block text-xs font-mono text-[#8B96C4] tracking-wide"
                                        >
                                            CATATAN{" "}
                                            <span className="normal-case text-[#8B96C4]/70">
                                                (opsional)
                                            </span>
                                        </label>
                                        <span className="text-[10px] font-mono text-[#8B96C4]/60 tabular-nums">
                                            {akCatatan.length}/500
                                        </span>
                                    </div>
                                    <textarea
                                        id="ak-catatan"
                                        value={akCatatan}
                                        onChange={(e) => setAkCatatan(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Alasan atau info tambahan untuk admin..."
                                        className="w-full rounded-md bg-white/[0.05] border border-white/15 px-3 py-2.5 text-white text-sm placeholder:text-[#8B96C4]/50 focus:outline-none focus:ring-2 focus:ring-[#078DE9] focus:border-transparent resize-none transition-shadow"
                                    />
                                </div>

                                {akError && (
                                    <p className="text-sm text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/20 rounded-md px-3 py-2">
                                        {akError}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={akLoading}
                                    className="w-full rounded-full bg-[#078DE9] text-white font-medium py-2.5 text-sm shadow-[0_2px_10px_-2px_rgba(27,42,107,0.45)] hover:bg-[#0670C0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078DE9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080F28]"
                                >
                                    {akLoading ? "Mengirim..." : "Kirim Permintaan Aktivasi"}
                                </button>

                                <p className="flex items-start gap-1.5 text-[11px] text-[#8B96C4]/70 leading-relaxed pt-1">
                                    <ShieldCheck size={13} className="flex-none mt-0.5" />
                                    Data yang Anda kirim hanya digunakan admin untuk
                                    memverifikasi dan mengaktifkan akun.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/[0.06] mt-auto">
                <div className="max-w-4xl mx-auto px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-4 justify-between text-center sm:text-left">
                    <div className="flex items-center gap-3">
                        <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#078DE9] text-white font-display text-sm"
                            aria-hidden="true"
                        >
                            P
                        </span>
                        <span className="hidden sm:block h-7 w-px bg-white/10" />
                        <img
                            src="/images/logo-smkn1sanden.png"
                            alt="Logo SMK Negeri 1 Sanden"
                            className="h-8 w-8 shrink-0 object-contain"
                        />
                        <div className="leading-tight text-left">
                            <p className="text-xs text-white">
                                {BRAND_NAME} — {BRAND_LOCATION}
                            </p>
                            <p className="text-[11px] text-[#8B96C4]">
                                © {new Date().getFullYear()} Seluruh hak
                                cipta dilindungi.
                            </p>
                        </div>
                    </div>
                    <span className="font-mono text-[11px] text-[#8B96C4] tracking-wider">
                        PUSAT BANTUAN
                    </span>
                </div>
            </footer>
        </div>
    );
}