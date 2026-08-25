import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const WHATSAPP_URL = "https://wa.me/6285728035284";
const BRAND_NAME = "Parkir ";
const BRAND_LOCATION = "Pelabuhan Tanjung Perak";

// Nav items dipakai bareng oleh navbar desktop dan sidebar mobile, biar
// keduanya selalu sinkron kalau link berubah.
const NAV_LINKS = [
    { href: "#fitur", label: "Fitur" },
    { href: "#informasi", label: "Informasi" },
    { href: "#testimoni", label: "Testimoni" },
    { href: "#komentar", label: "Komentar" },
];

// Memutar nada notifikasi pendek lewat Web Audio API, tanpa perlu file
// audio eksternal. AudioContext baru dibuat saat dipanggil, jadi selalu
// dipicu oleh interaksi pengguna (klik/submit) sesuai kebijakan autoplay
// browser.
function playNotifSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
            1320,
            ctx.currentTime + 0.12,
        );
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.32);
        osc.onended = () => ctx.close();
    } catch {
        // Audio tidak tersedia (mis. browser lama) — abaikan secara diam-diam.
    }
}

function dashboardPath(role) {
    if (role === "admin") return "/admin";
    if (role === "petugas") return "/petugas";
    return "/owner";
}

const FEATURES = [
    {
        title: "Transaksi Cepat",
        desc: "Catat kendaraan masuk dan keluar dalam hitungan detik, lengkap dengan cetak struk otomatis.",
        icon: (
            <path
                d="M4 12h16M4 12l4-4M4 12l4 4"
                stroke="#C90000"
                strokeWidth="1.75"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        ),
    },
    {
        title: "Multi Level Akses",
        desc: "Admin, Petugas, dan Owner masing-masing punya portal dan hak akses sendiri.",
        icon: (
            <path
                d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 3.5-6 8-6s8 2 8 6"
                stroke="#C90000"
                strokeWidth="1.75"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        ),
    },
    {
        title: "Rekap & Laporan",
        desc: "Owner dapat memantau rekap transaksi sesuai rentang waktu yang diinginkan, kapan saja.",
        icon: (
            <path
                d="M5 20V10M12 20V4M19 20v-7"
                stroke="#C90000"
                strokeWidth="1.75"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        ),
    },
];

const ROLES = [
    {
        name: "Admin",
        desc: "Kelola user, tarif, area parkir, kendaraan, dan log aktivitas.",
    },
    {
        name: "Petugas",
        desc: "Input transaksi masuk/keluar dan cetak struk parkir.",
    },
    { name: "Owner", desc: "Pantau rekap transaksi kapan pun dibutuhkan." },
];

const TESTIMONI = [
    {
        nama: "Rina",
        peran: "Pengelola Mall",
        teks: "Antrean di pintu keluar jauh lebih cepat sejak pakai ParkirKu.",
        bintang: 5,
    },
    {
        nama: "Dedi",
        peran: "Petugas Lapangan",
        teks: "Cetak struknya praktis, tidak perlu catat manual lagi.",
        bintang: 5,
    },
    {
        nama: "Sari",
        peran: "Owner Area Parkir",
        teks: "Rekap transaksi bisa saya cek dari mana saja.",
        bintang: 4,
    },
];

const AVATAR_COLORS = ["#C90000", "#5A0000", "#444444"];

// Ditampilkan sesaat sementara komentar asli sedang diambil dari API
// (GET /api/komentar), supaya kolom komentar tidak kosong saat loading.
const KOMENTAR_SEED = [
    {
        id: "seed-1",
        nama: "Budi",
        teks: "Aplikasinya mudah dipahami, semoga makin banyak area parkir yang pakai ParkirKu.",
        rating: 5,
    },
    {
        id: "seed-2",
        nama: "Wulan",
        teks: "Fitur cetak struknya sangat membantu pekerjaan saya sehari-hari.",
        rating: 4,
    },
];

// Fallback saat GET /api/transaksi/rekap-harian-publik gagal diakses
// (mis. server sedang down atau endpoint belum tersedia) — supaya
// grafik tidak kosong sebelum data asli berhasil dimuat.
const GRAFIK_FALLBACK = [
    { label: "Sen", val: 39 },
    { label: "Sel", val: 50 },
    { label: "Rab", val: 48 },
    { label: "Kam", val: 55 },
    { label: "Jum", val: 60 },
    { label: "Sab", val: 65 },
];

// Fallback saat GET /api/statistik/ringkasan gagal diakses publik
// (mis. server sedang down atau endpoint belum tersedia) — supaya
// section Informasi tidak kosong sebelum data asli berhasil dimuat.
const STATISTIK_FALLBACK = {
    kapasitas: 80,
    terisi: 42,
    rating_rata: 4.8,
    jumlah_ulasan: 320,
    transaksi_selesai: 12480,
};

// Alur singkat yang menemani video demo, supaya kolom kedua pada
// section itu tidak kosong dan pengunjung tetap dapat konteks
// walau video belum/tidak dimuat.
const ALUR = [
    {
        no: "01",
        title: "Kendaraan masuk",
        desc: "Petugas mencatat plat dan waktu masuk lewat portal Petugas.",
    },
    {
        no: "02",
        title: "Transaksi berjalan",
        desc: "Tarif dihitung otomatis sesuai durasi dan jenis kendaraan.",
    },
    {
        no: "03",
        title: "Struk tercetak",
        desc: "Struk keluar otomatis saat kendaraan check-out.",
    },
];

function Bintang({ jumlah }) {
    return (
        <div className="flex gap-0.5" aria-label={`${jumlah} dari 5 bintang`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <svg
                    key={i}
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                >
                    <path
                        d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6L10 1z"
                        fill={i <= jumlah ? "#FACC15" : "#444444"}
                    />
                </svg>
            ))}
        </div>
    );
}

// Bintang yang bisa diklik untuk mengisi rating di form komentar.
function RatingInput({ value, onChange }) {
    const [hover, setHover] = useState(0);
    const shown = hover || value;
    return (
        <div className="flex items-center gap-2">
            <div
                className="flex gap-1"
                role="radiogroup"
                aria-label="Rating bintang"
            >
                {[1, 2, 3, 4, 5].map((i) => (
                    <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={value === i}
                        aria-label={`${i} bintang`}
                        onClick={() => onChange(i)}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(0)}
                        className="p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] rounded-sm"
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path
                                d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6L10 1z"
                                fill={i <= shown ? "#FACC15" : "#444444"}
                            />
                        </svg>
                    </button>
                ))}
            </div>
            <span className="text-xs text-white/70">
                {value > 0 ? `${value}/5` : "Pilih rating"}
            </span>
        </div>
    );
}

function Avatar({ nama, index, size = "h-9 w-9 text-sm" }) {
    const initial = nama.trim().charAt(0).toUpperCase();
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return (
        <span
            className={`shrink-0 rounded-full flex items-center justify-center font-display ${size}`}
            style={{
                backgroundColor: `${color}1f`,
                color,
            }}
            aria-hidden="true"
        >
            {initial}
        </span>
    );
}

// Melacak posisi scroll halaman dengan throttling via requestAnimationFrame
// (bukan setState di tiap event scroll mentah) supaya tetap ringan dan
// tidak menyebabkan re-render berlebihan. Dipakai untuk efek parallax
// yang merespons langsung ke gerakan scroll pengguna.
function useScrollY() {
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        let ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                setScrollY(window.scrollY);
                ticking = false;
            });
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return scrollY;
}

// Mendeteksi preferensi prefers-reduced-motion sekali di awal dan tetap
// sinkron kalau pengguna mengubahnya lewat pengaturan OS saat halaman
// masih terbuka.
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(mq.matches);
        const handler = (e) => setReduced(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return reduced;
}

// Angka yang menghitung naik dari 0 ke nilai aslinya begitu elemen masuk
// area layar (IntersectionObserver), memberi kesan section "hidup" saat
// discroll alih-alih statis. format() mengatur bagaimana angka tampil
// di tiap frame (mis. pembulatan, pemisah ribuan, satu desimal).
function AnimatedCounter({ value, duration = 1200, format = (n) => Math.round(n) }) {
    const ref = useRef(null);
    const [display, setDisplay] = useState(0);
    const [started, setStarted] = useState(false);
    const prefersReducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStarted(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        if (prefersReducedMotion) {
            setDisplay(value);
            return;
        }
        let rafId;
        let startTime = null;
        function step(ts) {
            if (startTime === null) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(value * eased);
            if (progress < 1) rafId = window.requestAnimationFrame(step);
        }
        rafId = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(rafId);
    }, [started, value, duration, prefersReducedMotion]);

    return <span ref={ref}>{format(display)}</span>;
}

// hoverable adds a quiet, consistent hover state (border + lift) used on
// cards the user can meaningfully interact with or that benefit from a
// touch of affordance. Off by default so it stays a deliberate choice.
function SectionCard({ children, className = "", hoverable = false }) {
    return (
        <div
            className={`rounded-xl bg-[#080A0D] border border-[#444444] p-6 ${
                hoverable
                    ? "transition-colors duration-200 hover:border-[#444444]"
                    : ""
            } ${className}`}
        >
            {children}
        </div>
    );
}

// Label kecil bergaya "eyebrow" di atas judul section — dipakai untuk
// menandai bagian halaman secara konsisten.
function SectionEyebrow({ children }) {
    return (
        <p className="text-xs font-mono tracking-[0.14em] text-[#C90000] mb-3">
            {children}
        </p>
    );
}

// Fades + slides content in once it scrolls into view. Respects
// prefers-reduced-motion by skipping the transform/opacity animation.
function Reveal({ children, delay = 0, className = "" }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
            } ${className}`}
        >
            {children}
        </div>
    );
}

// Kartu placeholder berkedip pelan, dipakai saat komentar asli masih
// diambil dari API supaya kolom komentar terasa "hidup", bukan cuma
// teks "Memuat...".
function KomentarSkeleton() {
    return (
        <div className="rounded-xl bg-[#080A0D] border border-[#444444] p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-[#444444]" />
                <div className="space-y-1.5">
                    <div className="h-2.5 w-24 rounded bg-[#444444]" />
                    <div className="h-2 w-16 rounded bg-[#444444]" />
                </div>
            </div>
            <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded bg-[#444444]" />
                <div className="h-2.5 w-4/5 rounded bg-[#444444]" />
            </div>
        </div>
    );
}

export default function Landing() {
    const { user } = useAuth();
    const navPath = user ? dashboardPath(user.role) : "/login";
    const navLabel = user ? "Ke Dashboard" : "Masuk";
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [heroTextBgError, setHeroTextBgError] = useState(false);
    const scrollY = useScrollY();
    const prefersReducedMotion = usePrefersReducedMotion();

    // Intro splash: tampilkan logo dulu, baru landing page terlihat.
    const [showIntro, setShowIntro] = useState(!prefersReducedMotion);
    const [introExiting, setIntroExiting] = useState(false);
    const [logoIn, setLogoIn] = useState(false);

    useEffect(() => {
        if (prefersReducedMotion) {
            setShowIntro(false);
            return;
        }
        const popTimer = requestAnimationFrame(() => setLogoIn(true));
        const exitTimer = setTimeout(() => setIntroExiting(true), 1100);
        const hideTimer = setTimeout(() => setShowIntro(false), 1650);
        return () => {
            cancelAnimationFrame(popTimer);
            clearTimeout(exitTimer);
            clearTimeout(hideTimer);
        };
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (showIntro) {
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [showIntro]);

    // Efek parallax hero: foto latar bergerak lebih lambat dari scroll
    // (kesan kedalaman), sementara teks di atasnya bergerak sedikit lebih
    // cepat dan memudar seiring pengguna scroll melewati hero. Dimatikan
    // total kalau pengguna memilih prefers-reduced-motion.
    const heroImgOffset = prefersReducedMotion ? 0 : scrollY * 0.28;
    const heroContentOffset = prefersReducedMotion ? 0 : scrollY * 0.12;
    const heroContentOpacity = prefersReducedMotion
        ? 1
        : Math.max(1 - scrollY / 420, 0);
    const [comments, setComments] = useState(KOMENTAR_SEED);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [commentName, setCommentName] = useState("");
    const [commentText, setCommentText] = useState("");
    const [commentRating, setCommentRating] = useState(0);
    const [commentError, setCommentError] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    const KOMENTAR_MAX_LEN = 300;

    const [grafikData, setGrafikData] = useState(GRAFIK_FALLBACK);
    const [grafikLoading, setGrafikLoading] = useState(true);
    const [grafikIlustrasi, setGrafikIlustrasi] = useState(true);

    const [statistik, setStatistik] = useState(STATISTIK_FALLBACK);
    const [statistikIlustrasi, setStatistikIlustrasi] = useState(true);

    // Ambil rekap transaksi harian PUBLIK (GET /api/transaksi/rekap-harian-publik)
    // untuk grafik di landing page. Beda dari endpoint yang dipakai Dashboard
    // Admin (/api/transaksi/rekap-harian) yang butuh login dan menyertakan
    // data pendapatan — endpoint publik ini cuma mengembalikan jumlah_transaksi,
    // aman diakses tanpa autentikasi. Kalau endpoint gagal diakses (server
    // bermasalah), diam-diam fallback ke GRAFIK_FALLBACK supaya section
    // ini tidak pernah kosong/error.
    useEffect(() => {
        let cancelled = false;
        fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/transaksi/rekap-harian-publik`,
        )
            .then((res) => {
                if (!res.ok) throw new Error("Gagal memuat rekap transaksi");
                return res.json();
            })
            .then((data) => {
                if (cancelled) return;
                const formatted = data.map((d) => ({
                    label: new Date(d.tanggal).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                    }),
                    val: d.jumlah_transaksi || 0,
                }));
                setGrafikData(formatted);
                setGrafikIlustrasi(false);
            })
            .catch(() => {
                // biarkan GRAFIK_FALLBACK tetap tampil
            })
            .finally(() => {
                if (!cancelled) setGrafikLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Ambil ringkasan statistik (slot tersedia, rating rata-rata, total
    // transaksi selesai) dari GET /api/statistik/ringkasan — endpoint
    // publik, tidak butuh login. Kalau gagal diakses (server down,
    // endpoint belum di-deploy, dsb), diam-diam fallback ke
    // STATISTIK_FALLBACK supaya section Informasi tidak pernah
    // kosong/error.
    useEffect(() => {
        let cancelled = false;
        fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/statistik/ringkasan`,
        )
            .then((res) => {
                if (!res.ok) throw new Error("Gagal memuat statistik");
                return res.json();
            })
            .then((data) => {
                if (cancelled) return;
                setStatistik(data);
                setStatistikIlustrasi(false);
            })
            .catch(() => {
                // biarkan STATISTIK_FALLBACK tetap tampil
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Ambil komentar sungguhan dari backend saat halaman dimuat. Kalau
    // request gagal (mis. endpoint belum ada / server mati), tetap
    // tampilkan data contoh di atas supaya UI tidak kosong.
    useEffect(() => {
        let cancelled = false;
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/komentar`)
            .then((res) => {
                if (!res.ok) throw new Error("Gagal memuat komentar");
                return res.json();
            })
            .then((data) => {
                if (!cancelled) setComments(data);
            })
            .catch(() => {
                // biarkan KOMENTAR_SEED tetap tampil
            })
            .finally(() => {
                if (!cancelled) setCommentsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    async function handleCommentSubmit(e) {
        e.preventDefault();
        if (!commentName.trim() || !commentText.trim()) {
            setCommentError("Nama dan komentar wajib diisi.");
            return;
        }
        if (!commentRating) {
            setCommentError("Silakan pilih rating bintang terlebih dahulu.");
            return;
        }
        setCommentSubmitting(true);
        setCommentError("");
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/komentar`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        nama: commentName.trim(),
                        teks: commentText.trim(),
                        rating: commentRating,
                    }),
                },
            );
            if (!res.ok) throw new Error("Gagal mengirim komentar");
            const saved = await res.json();
            setComments((prev) => [saved, ...prev]);
            setCommentName("");
            setCommentText("");
            setCommentRating(0);
            playNotifSound();
        } catch {
            setCommentError(
                "Komentar gagal terkirim. Coba lagi beberapa saat lagi.",
            );
        } finally {
            setCommentSubmitting(false);
        }
    }

    const hamburgerBtnRef = useRef(null);
    const closeBtnRef = useRef(null);
    const sidebarPanelRef = useRef(null);

    // Accessibility: focus the close button when the mobile sidebar opens,
    // trap Tab inside it, close on Escape, and return focus to the
    // hamburger button when it closes.
    useEffect(() => {
        if (!sidebarOpen) return;
        closeBtnRef.current?.focus();

        function onKeyDown(e) {
            if (e.key === "Escape") {
                setSidebarOpen(false);
                return;
            }
            if (e.key !== "Tab") return;
            const panel = sidebarPanelRef.current;
            if (!panel) return;
            const focusables = panel.querySelectorAll(
                "a[href], button:not([disabled])",
            );
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            hamburgerBtnRef.current?.focus();
        };
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen bg-[#050608] text-white relative">
            {/* ================= Intro splash ================= */}
            {/* Logo tampil dan sedikit membesar (pop-in), lalu seluruh
                overlay fade-out untuk menyingkap landing page yang sudah
                dirender di baliknya. Total durasi ~1.65s, dilewati kalau
                pengguna memilih prefers-reduced-motion. */}
            {showIntro && (
                <div
                    className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white transition-opacity duration-500 ease-in ${
                        introExiting
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                    }`}
                    aria-hidden="true"
                >
                    <img
                        src="/images/logo.png"
                        alt=""
                        className={`w-24 sm:w-32 md:w-36 transition-all duration-700 ease-out ${
                            logoIn
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-75"
                        }`}
                    />
                    <p
                        className={`text-xs sm:text-sm font-mono tracking-[0.14em] text-white/70 transition-all duration-700 ease-out delay-150 ${
                            logoIn
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-1"
                        }`}
                    >
                        by Abdulloh Mahbuby
                    </p>
                </div>
            )}

            {/* ================= Mobile sidebar ================= */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex">
                    <div
                        className="fixed inset-0 bg-[#444444]"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div
                        ref={sidebarPanelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu navigasi"
                        className="relative w-72 max-w-[85vw] bg-[#080A0D] h-full p-6 flex flex-col gap-1 z-50 shadow-2xl shadow-black/50"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2.5">
                                
                                <span className="font-display text-base">
                                    {BRAND_NAME}
                                </span>
                            </div>
                            <button
                                ref={closeBtnRef}
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Tutup menu"
                                className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-[#444444] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000]"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M6 6l12 12M18 6L6 18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                        <nav className="flex flex-col">
                            {NAV_LINKS.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className="text-sm text-white/80 hover:text-white hover:bg-[#444444] px-3 py-3 rounded-lg border-b border-[#444444] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000]"
                                >
                                    {item.label}
                                </a>
                            ))}
                            <Link
                                to="/bantuan"
                                onClick={() => setSidebarOpen(false)}
                                className="text-sm text-white/80 hover:text-white hover:bg-[#444444] px-3 py-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000]"
                            >
                                Bantuan
                            </Link>
                        </nav>
                        <Link
                            to={navPath}
                            onClick={() => setSidebarOpen(false)}
                            className="mt-4 rounded-md bg-[#C90000] text-white font-medium px-4 py-2.5 text-sm text-center hover:bg-[#5A0000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
                        >
                            {navLabel}
                        </Link>
                    </div>
                </div>
            )}

            {/* ================= Header ================= */}
            <header className="sticky top-0 z-30 bg-[#050608]/95 backdrop-blur-md border-b border-[#444444]">
                <div className="flex items-center justify-between gap-4 px-4 sm:px-6 md:px-12 h-16 md:h-[72px] max-w-7xl mx-auto">
                    {/* Logo + mobile trigger */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            ref={hamburgerBtnRef}
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Buka menu"
                            className="lg:hidden shrink-0 -ml-1.5 h-9 w-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-[#444444] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000]"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M3 6h18M3 12h18M3 18h18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>

                        <Link
                            to="/"
                            className="flex items-center gap-2 sm:gap-2.5 min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000]"
                        >
                            <div className="min-w-0 leading-tight">
                                <p className="font-display text-base md:text-lg tracking-tight truncate">
                                    {BRAND_NAME}
                                </p>
                                <p className="hidden sm:block text-[11px] font-mono text-white/70 tracking-wide truncate">
                                    {BRAND_LOCATION}
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop nav — muncul dari lg ke atas supaya tidak
                        bertabrakan dengan logo/lokasi di layar medium (md). */}
                    <nav className="hidden lg:flex items-center gap-1 shrink-0">
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className="group relative px-3 py-2 text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] rounded-md"
                            >
                                {item.label}
                                <span className="pointer-events-none absolute left-3 right-3 -bottom-px h-px bg-[#C90000] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200" />
                            </a>
                        ))}
                        <Link
                            to="/bantuan"
                            className="group relative px-3 py-2 text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] rounded-md"
                        >
                            Bantuan
                            <span className="pointer-events-none absolute left-3 right-3 -bottom-px h-px bg-[#C90000] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200" />
                        </Link>
                    </nav>

                    {/* CTA — label disingkat di layar sempit supaya tidak
                        pernah membungkus baris atau mendorong logo. */}
                    <Link
                        to={navPath}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-[#C90000] text-white font-medium px-3 sm:px-4 py-2 text-sm hover:bg-[#5A0000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
                    >
                        <span className="hidden sm:inline">{navLabel}</span>
                        <span className="sm:hidden">
                            {user ? "Dashboard" : "Masuk"}
                        </span>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="hidden sm:block"
                            aria-hidden="true"
                        >
                            <path
                                d="M5 12h14M13 6l6 6-6 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </Link>
                </div>
            </header>

            {/* ================= Hero ================= */}
            {/* Foto latar penuh selebar layar, dengan tulisan langsung di
                atasnya (bukan kartu kecil terpisah). Taruh foto Anda di
                public/images/gambar.jpg. Kalau file belum ada / gagal
                dimuat, otomatis fallback ke gradasi polos supaya layout
                tetap aman. */}
            <section className="relative w-full h-[500px] sm:h-[560px] md:h-[620px] overflow-hidden">
                {!heroTextBgError ? (
                    <img
                        src="/images/gambar.jpg"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-[130%] object-cover will-change-transform"
                        style={{
                            transform: `translate3d(0, ${heroImgOffset}px, 0)`,
                        }}
                        onError={() => setHeroTextBgError(true)}
                    />
                ) : (
                    <div
                        className="absolute inset-0 h-[130%] bg-gradient-to-br from-[#080A0D] via-[#080A0D] to-[#050608] will-change-transform"
                        style={{
                            transform: `translate3d(0, ${heroImgOffset}px, 0)`,
                        }}
                        aria-hidden="true"
                    />
                )}
                {/* Scrim navy gelap di tengah supaya teks putih tetap kontras
                    di atas foto, memudar ke tepi supaya fotonya tetap terlihat. */}
                <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(8,15,40,0.92)_25%,rgba(8,15,40,0.75)_55%,rgba(8,15,40,0.3)_100%)]"
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050608] to-transparent"
                    aria-hidden="true"
                />

                {/* Konten teks bergerak berlawanan arah dengan foto latar
                    (parallax) dan memudar begitu pengguna mulai scroll,
                    supaya hero terasa merespons langsung gerakan scroll
                    alih-alih diam total. */}
                <div
                    className="relative h-full max-w-3xl mx-auto px-6 md:px-12 flex flex-col items-center justify-center text-center will-change-transform"
                    style={{
                        transform: `translate3d(0, ${heroContentOffset}px, 0)`,
                        opacity: heroContentOpacity,
                    }}
                >
                    
                    <h1 className="font-medium text-4xl sm:text-5xl md:text-6xl leading-[1.08] mb-5">
                        Kelola parkir sekarang ,{" "}
                        <span className="text-[#C90000]">
                            lebih mudah 
                        </span>
                    </h1>
                    <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-md">
                        {BRAND_NAME} menyatukan transaksi, tarif, area, dan
                        laporan parkir dalam satu portal — dengan akses
                        berbeda untuk Admin, Petugas, dan Owner.
                    </p>
                    <div className="flex flex-col items-center gap-6">
                        <Link
                            to={navPath}
                            className="rounded-md bg-[#C90000] text-white font-medium px-8 py-3.5 text-sm hover:bg-[#5A0000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
                        >
                            {user ? "Ke Dashboard" : "Masuk ke Portal"}
                        </Link>
                        <div className="flex items-center gap-2 text-xs font-mono text-white/70 tracking-wide">
                            <span>Admin</span>
                            <span className="text-[#444444]">/</span>
                            <span>Petugas</span>
                            <span className="text-[#444444]">/</span>
                            <span>Owner</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Kartu peran, mengambang menimpa tepi bawah foto hero untuk
                menautkan hero dan section berikutnya secara visual. */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 -mt-10 md:-mt-14 relative z-10 pb-16 md:pb-24">
                <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
                    {ROLES.map((r, i) => (
                        <Reveal key={r.name} delay={i * 80}>
                            <SectionCard
                                hoverable
                                className="h-full shadow-xl shadow-black/30"
                            >
                                <p className="font-display text-sm text-[#C90000] mb-1.5">
                                    {r.name}
                                </p>
                                <p className="text-sm text-white/80 leading-relaxed">
                                    {r.desc}
                                </p>
                            </SectionCard>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ================= Fitur ================= */}
            <section
                id="fitur"
                className="scroll-mt-24 max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24"
            >
                <Reveal>
                    <div className="text-center mb-10">
                        <SectionEyebrow>Keunggulan</SectionEyebrow>
                        <p className="font-medium text-2xl md:text-3xl">
                            Kenapa pakai {BRAND_NAME}
                        </p>
                    </div>
                </Reveal>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.title} delay={i * 80}>
                            <SectionCard hoverable className="h-full text-center flex flex-col items-center">
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="mb-4"
                                    aria-hidden="true"
                                >
                                    {f.icon}
                                </svg>
                                <h3 className="font-display font-semibold text-base mb-2">
                                    {f.title}
                                </h3>
                                <p className="text-sm text-white/70 leading-relaxed">
                                    {f.desc}
                                </p>
                            </SectionCard>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ================= Grafik transaksi ================= */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24">
                <Reveal>
                    <SectionCard>
                        <p className="font-display text-lg mb-1">
                             transaksi 7 hari terakhir
                        </p>
                        <p className="text-sm text-white/70 mb-6">
                            {grafikIlustrasi
                                ? "Ilustrasi jumlah transaksi per hari"
                                : "Jumlah transaksi per hari, 7 hari terakhir"}
                        </p>

                        {grafikLoading ? (
                            <p className="text-sm text-white/70">
                                Memuat data...
                            </p>
                        ) : grafikData.length === 0 ? (
                            <p className="text-sm text-white/70">
                                Belum ada data transaksi.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={grafikData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#444444"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        stroke="#B5B5B5"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={{ stroke: "#444444" }}
                                    />
                                    <YAxis
                                        stroke="#B5B5B5"
                                        fontSize={12}
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#080A0D",
                                            border: "1px solid #444444",
                                            borderRadius: 8,
                                        }}
                                        labelStyle={{ color: "#FFFFFF" }}
                                        formatter={(value) => [
                                            value,
                                            "Jumlah Transaksi",
                                        ]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="val"
                                        stroke="#C90000"
                                        strokeWidth={2}
                                        dot={{
                                            r: 3,
                                            fill: "#C90000",
                                            strokeWidth: 0,
                                        }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </SectionCard>
                </Reveal>
            </section>

            {/* ================= Cara kerja / demo ================= */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24 grid md:grid-cols-2 gap-5 items-stretch">
                <Reveal>
                    <SectionCard className="h-full">
                        <p className="font-display text-lg mb-2">
                            Cara kerja {BRAND_NAME}
                        </p>
                        <p className="text-sm text-white/70 mb-4">
                            Video singkat alur transaksi masuk sampai cetak
                            struk.
                        </p>
                        <video
                            controls
                            className="w-full rounded-lg bg-black"
                            poster="/gambar.jpg"
                            src="/video.mp4"
                        >
                            Browser Anda tidak mendukung pemutaran video.
                        </video>
                    </SectionCard>
                </Reveal>

                <Reveal delay={100}>
                    <SectionCard className="h-full flex flex-col justify-center">
                        <p className="font-display text-lg mb-5">
                            Tiga langkah singkat
                        </p>
                        <div className="space-y-5">
                            {ALUR.map((a, i) => (
                                <div key={a.no} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C90000]/15 font-mono text-xs text-[#C90000]">
                                            {a.no}
                                        </span>
                                        {i < ALUR.length - 1 && (
                                            <span
                                                className="w-px flex-1 bg-[#444444] mt-1"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </div>
                                    <div className="pb-1">
                                        <p className="text-sm font-medium text-white mb-0.5">
                                            {a.title}
                                        </p>
                                        <p className="text-sm text-white/70 leading-relaxed">
                                            {a.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </Reveal>
            </section>

            {/* ================= Informasi ================= */}
            <section
                id="informasi"
                className="scroll-mt-24 max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24"
            >
                <Reveal>
                    <SectionEyebrow>Informasi</SectionEyebrow>
                    <p className="font-medium text-2xl md:text-3xl mb-10 max-w-lg">
                        Sekilas kondisi layanan
                    </p>
                </Reveal>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <Reveal delay={0}>
                        <SectionCard className="h-full">
                            <p className="text-xs font-mono text-white/70 mb-3 tracking-wider">
                                Slot tersedia
                            </p>
                            <div className="flex items-end gap-2 mb-3">
                                <p className="font-display text-3xl text-[#f7f7f7]">
                                    <AnimatedCounter
                                        value={Math.max(
                                            0,
                                            statistik.kapasitas -
                                                statistik.terisi,
                                        )}
                                    />
                                </p>
                                <p className="text-sm text-white/70 mb-1">
                                    / {statistik.kapasitas} slot
                                </p>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#444444] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[#C90000]"
                                    style={{
                                        width: `${
                                            statistik.kapasitas > 0
                                                ? Math.min(
                                                      100,
                                                      (statistik.terisi /
                                                          statistik.kapasitas) *
                                                          100,
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </SectionCard>
                    </Reveal>
                    <Reveal delay={80}>
                        <SectionCard className="h-full">
                            <p className="text-xs font-mono text-white/70 mb-3 tracking-wider">
                                Kualitas layanan
                            </p>
                            <div className="flex items-center gap-2">
                                <p className="font-display text-3xl text-[#ffc402]">
                                    <AnimatedCounter
                                        value={Number(statistik.rating_rata)}
                                        format={(n) => n.toFixed(1)}
                                    />
                                </p>
                                <Bintang
                                    jumlah={Math.round(statistik.rating_rata)}
                                />
                            </div>
                            <p className="text-sm text-white/70 mt-1">
                                Dari {statistik.jumlah_ulasan}+ ulasan
                                pengguna
                            </p>
                        </SectionCard>
                    </Reveal>
                    <Reveal
                        delay={160}
                        className="sm:col-span-2 md:col-span-1"
                    >
                        <SectionCard className="h-full">
                            <p className="text-xs font-mono text-white/70 mb-3 tracking-wider">
                                Transaksi selesai
                            </p>
                            <p className="font-display text-3xl text-white">
                                <AnimatedCounter
                                    value={statistik.transaksi_selesai}
                                    duration={1600}
                                    format={(n) =>
                                        Math.round(n).toLocaleString("id-ID")
                                    }
                                />
                                +
                            </p>
                            <p className="text-sm text-white/70 mt-1">
                                Diproses sejak {BRAND_NAME} digunakan
                            </p>
                        </SectionCard>
                    </Reveal>
                </div>
                {statistikIlustrasi && (
                    <p className="text-xs text-white/50 italic mt-4">
                        *Angka di atas adalah contoh tampilan dan akan
                        otomatis mengikuti data asli saat sistem berjalan.
                    </p>
                )}
            </section>

            {/* ================= Testimoni ================= */}
            <section
                id="testimoni"
                className="scroll-mt-24 max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24"
            >
                <Reveal>
                    <SectionEyebrow>Testimoni</SectionEyebrow>
                    <p className="font-medium text-2xl md:text-3xl mb-10 max-w-lg">
                        Apa kata pengguna
                    </p>
                </Reveal>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {TESTIMONI.map((t, i) => (
                        <Reveal key={t.nama} delay={i * 80}>
                            <SectionCard hoverable className="h-full">
                                <Bintang jumlah={t.bintang} />
                                <p className="text-sm text-white/80 mt-3 mb-5 leading-relaxed">
                                    {t.teks}
                                </p>
                                <div className="flex items-center gap-3">
                                    <Avatar nama={t.nama} index={i} />
                                    <div className="min-w-0">
                                        <p className="text-sm text-white truncate">
                                            {t.nama}
                                        </p>
                                        <p className="text-xs font-mono text-white/70 truncate">
                                            {t.peran}
                                        </p>
                                    </div>
                                </div>
                            </SectionCard>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ================= Komentar ================= */}
            <section
                id="komentar"
                className="scroll-mt-24 max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24"
            >
                <Reveal>
                    <SectionEyebrow>Diskusi</SectionEyebrow>
                    <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium text-2xl md:text-3xl">
                            Komentar pengguna
                        </p>
                        <span className="rounded-full bg-[#C90000]/15 text-[#C90000] text-xs font-mono px-2 py-0.5">
                            {comments.length}
                        </span>
                    </div>
                    <p className="text-sm text-white/70 mb-10">
                        Pengalaman langsung dari pengguna {BRAND_NAME}.
                    </p>

                    <div className="space-y-5">
                        {/* -------- Form komentar -------- */}
                        <SectionCard>
                            <p className="text-sm font-medium mb-1">
                                Tinggalkan komentar Anda
                            </p>
                            <p className="text-xs text-white/70 mb-5">
                                Bagikan pengalaman Anda memakai {BRAND_NAME}{" "}
                                di sini.
                            </p>
                            <form
                                onSubmit={handleCommentSubmit}
                                className="space-y-4"
                                noValidate
                            >
                                <div className="rounded-lg bg-[#080A0D] border border-[#444444] px-3 py-3">
                                    <p className="text-xs text-white/70 mb-2">
                                        Rating Anda
                                    </p>
                                    <RatingInput
                                        value={commentRating}
                                        onChange={setCommentRating}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="comment-name"
                                        className="block text-xs text-white/70 mb-1.5"
                                    >
                                        Nama
                                    </label>
                                    <input
                                        id="comment-name"
                                        type="text"
                                        value={commentName}
                                        onChange={(e) =>
                                            setCommentName(e.target.value)
                                        }
                                        placeholder="Nama Anda"
                                        className="w-full rounded-md bg-[#080A0D] border border-[#444444] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C90000] focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label
                                            htmlFor="comment-text"
                                            className="text-xs text-white/70"
                                        >
                                            Komentar
                                        </label>
                                        <span
                                            className={`text-[10px] font-mono ${
                                                commentText.length >
                                                KOMENTAR_MAX_LEN
                                                    ? "text-[#C90000]"
                                                    : "text-white/50"
                                            }`}
                                        >
                                            {commentText.length}/
                                            {KOMENTAR_MAX_LEN}
                                        </span>
                                    </div>
                                    <textarea
                                        id="comment-text"
                                        value={commentText}
                                        onChange={(e) =>
                                            setCommentText(
                                                e.target.value.slice(
                                                    0,
                                                    KOMENTAR_MAX_LEN,
                                                ),
                                            )
                                        }
                                        placeholder="Tulis komentar Anda..."
                                        rows={4}
                                        className="w-full rounded-md bg-[#080A0D] border border-[#444444] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C90000] focus:border-transparent resize-none transition-shadow"
                                    />
                                </div>
                                {commentError && (
                                    <p
                                        className="flex items-center gap-1.5 text-xs text-[#C90000]"
                                        role="alert"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="shrink-0"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                            <path
                                                d="M12 8v5M12 16h.01"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        {commentError}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={commentSubmitting}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-[#C90000] text-white font-medium px-4 py-2.5 text-sm hover:bg-[#5A0000] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
                                >
                                    {commentSubmitting ? (
                                        <>
                                            <svg
                                                className="animate-spin h-3.5 w-3.5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                aria-hidden="true"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="9"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    opacity="0.25"
                                                />
                                                <path
                                                    d="M21 12a9 9 0 00-9-9"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M4 20l16-8L4 4l2 8-2 8z"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            Kirim Komentar
                                        </>
                                    )}
                                </button>
                            </form>
                        </SectionCard>

                        {/* -------- Daftar komentar (geser kanan/kiri) -------- */}
                        {/* min-w-0 wajib di sini: item grid secara default tidak
                            mau menyusut, jadi tanpa ini overflow-x pada anaknya
                            malah mendorong lebar grid, bukan memicu scrollbar
                            horizontal. */}
                        <div className="min-w-0">
                            <div
                                className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[#444444] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                                aria-busy={commentsLoading}
                            >
                                {commentsLoading && (
                                    <>
                                        <div className="shrink-0 w-72 snap-start">
                                            <KomentarSkeleton />
                                        </div>
                                        <div className="shrink-0 w-72 snap-start">
                                            <KomentarSkeleton />
                                        </div>
                                    </>
                                )}

                                {!commentsLoading &&
                                    comments.length === 0 && (
                                        <SectionCard className="shrink-0 w-full text-center py-10">
                                            <svg
                                                width="28"
                                                height="28"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                className="mx-auto mb-3 text-white/70"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M21 12a8 8 0 11-3.6-6.7L21 4l-1 3.6A7.96 7.96 0 0121 12z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.6"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <p className="text-sm text-white/80">
                                                Belum ada komentar.
                                            </p>
                                            <p className="text-xs text-white/70 mt-1">
                                                Jadilah yang pertama berbagi
                                                pengalaman Anda.
                                            </p>
                                        </SectionCard>
                                    )}

                                {comments.map((c, i) => (
                                    <SectionCard
                                        key={c.id}
                                        hoverable
                                        className="p-4 shrink-0 w-72 snap-start"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar
                                                    nama={c.nama}
                                                    index={i}
                                                />
                                                <p className="text-sm text-white truncate">
                                                    {c.nama}
                                                </p>
                                            </div>
                                            <Bintang
                                                jumlah={c.rating ?? 5}
                                            />
                                        </div>
                                        <p className="text-sm text-white/70 leading-relaxed">
                                            {c.teks}
                                        </p>

                                        {c.balasan && (
                                            <div className="mt-3 pl-3 border-l-2 border-[#C90000]/40 bg-[#C90000]/5 rounded-r-md py-2 pr-2">
                                                <p className="flex items-center gap-1.5 text-xs font-mono text-[#C90000] mb-1">
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 3.5-6 8-6s8 2 8 6"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                    Balasan Admin
                                                </p>
                                                <p className="text-sm text-white/80 leading-relaxed">
                                                    {c.balasan}
                                                </p>
                                            </div>
                                        )}
                                    </SectionCard>
                                ))}
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ================= Bantuan (CTA) ================= */}
            <section
                id="bantuan"
                className="scroll-mt-24 max-w-7xl mx-auto px-6 md:px-12 pb-24"
            >
                <Reveal>
                    <SectionCard className="flex flex-col md:flex-row items-center justify-between gap-4 p-8">
                        <div>
                            <p className="font-display text-lg mb-1">
                                Butuh bantuan?
                            </p>
                            <p className="text-sm text-white/70">
                                Lihat pertanyaan umum seputar akun dan cara
                                pakai {BRAND_NAME} di halaman Bantuan.
                            </p>
                        </div>
                        <Link
                            to="/bantuan"
                            className="shrink-0 rounded-md bg-[#C90000] text-white font-medium px-5 py-2.5 text-sm hover:bg-[#5A0000] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
                        >
                            Buka Halaman Bantuan
                        </Link>
                    </SectionCard>
                </Reveal>
            </section>

            {/* ================= Floating quick-help button ================= */}
            {/* Beda fungsi dari CTA "Bantuan" di atas: ini untuk aksi cepat
                (langsung chat admin), bukan menuju halaman FAQ lengkap. */}
            <div className="fixed bottom-6 right-6 z-50">
                {helpOpen && (
                    <div className="mb-3 w-64 rounded-xl bg-[#080A0D] border border-[#444444] p-4 shadow-xl">
                        <p className="text-sm font-medium mb-1">
                            Bantuan cepat
                        </p>
                        <p className="text-xs text-white/70 mb-3">
                            Chat langsung dengan admin, atau buka daftar
                            pertanyaan umum.
                        </p>
                        <div className="flex flex-col gap-2">
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 rounded-md bg-[#C90000] text-white font-medium px-3 py-2 text-xs hover:bg-[#5A0000] transition-colors"
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M4 20l1.4-4.2A8 8 0 1112 20a8 8 0 01-4.6-1.4L4 20z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                Chat WhatsApp Admin
                            </a>
                            <Link
                                to="/bantuan"
                                onClick={() => setHelpOpen(false)}
                                className="text-center text-xs text-[#C90000] hover:underline py-1"
                            >
                                Lihat halaman Bantuan →
                            </Link>
                        </div>
                    </div>
                )}
                <button
                    onClick={() =>
                        setHelpOpen((v) => {
                            const next = !v;
                            if (next) playNotifSound();
                            return next;
                        })
                    }
                    aria-label="Bantuan cepat"
                    aria-expanded={helpOpen}
                    className="h-12 w-12 rounded-full bg-[#C90000] text-white flex items-center justify-center shadow-lg hover:bg-[#5A0000] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C90000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                        <path
                            d="M9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 1.5-2.5 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <circle cx="12" cy="17" r="1" fill="currentColor" />
                    </svg>
                </button>
            </div>

            {/* ================= Footer ================= */}
            <footer className="border-t border-[#444444]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-4 justify-between text-center sm:text-left">
                    <div className="flex flex-col items-center sm:items-start gap-4">
                        <div className="flex items-center gap-2.5">
                            
                            <div className="leading-tight text-left">
                                <p className="font-display text-base tracking-tight">
                                    {BRAND_NAME}
                                </p>
                                <p className="text-[11px] font-mono text-white/70 tracking-wide">
                                    {BRAND_LOCATION}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pl-0.5">
                            <span className="hidden sm:block h-8 w-px bg-[#444444]" />
                            <img
                                src="/images/logo-smkn1sanden.png"
                                alt="Logo SMK Negeri 1 Sanden"
                                className="h-10 w-10 shrink-0 object-contain"
                            />
                            <div className="leading-tight text-left">
                                <p className="text-xs text-white/80">
                                    Dikembangkan oleh siswa
                                </p>
                                <p className="text-xs font-medium text-white">
                                    SMK Negeri 1 Sanden, Bantul
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-white/70">
                            © {new Date().getFullYear()} {BRAND_NAME}. Seluruh
                            hak cipta dilindungi.
                        </p>
                    </div>

                    <div className="flex flex-col items-center sm:items-end gap-2">
                        <span className="font-mono text-[11px] text-white/70 tracking-wider">
                            Sistem manajemen parkir
                        </span>
                        <div className="flex items-center gap-4 text-xs text-white/70">
                            <a
                                href="#fitur"
                                className="hover:text-white transition-colors"
                            >
                                Fitur
                            </a>
                            <a
                                href="#testimoni"
                                className="hover:text-white transition-colors"
                            >
                                Testimoni
                            </a>
                            <Link
                                to="/bantuan"
                                className="hover:text-white transition-colors"
                            >
                                Bantuan
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}