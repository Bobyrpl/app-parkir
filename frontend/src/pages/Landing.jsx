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
const BRAND_NAME = "Abdulloh Mahbuby, XII RPL I";
const BRAND_LOCATION = "Pelabuhan Tanjung Perak";
// TODO: ganti dengan alamat lengkap yang sebenarnya.
const BRAND_ADDRESS = 
  "Jl. Perak Timur, Pelabuhan Tanjung Perak, Surabaya, Jawa Timur";

// Nav items dipakai bareng oleh navbar desktop dan sidebar mobile, biar
// keduanya selalu sinkron kalau link berubah.
const NAV_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#informasi", label: "Informasi" },
  { href: "#testimoni", label: "Testimoni" },
  { href: "#komentar", label: "Komentar" },
];

// Bentuk bintang tunggal dipakai ulang di beberapa tempat (rating tampilan,
// input rating, testimoni) supaya konsisten satu sama lain.
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z";

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
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
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
        stroke="currentColor"
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
        stroke="currentColor"
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
        stroke="currentColor"
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
    peran: "Pengelola parkir",
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

const AVATAR_COLORS = ["#C90000", "#525252", "#171717"];

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
// section stat tidak kosong sebelum data asli berhasil dimuat.
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
    <div className="flex gap-1" aria-label={`${jumlah} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i <= jumlah ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          className={i <= jumlah ? "text-neutral-900" : "text-neutral-300"}
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
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
    <div className="flex items-center gap-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Rating bintang">
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
            className="p-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={i <= shown ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              className={i <= shown ? "text-neutral-900" : "text-neutral-300"}
              aria-hidden="true"
            >
              <path d={STAR_PATH} />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-xs text-neutral-500">
        {value > 0 ? `${value}/5` : "Pilih rating"}
      </span>
    </div>
  );
}

function Avatar({ nama, index, size = "h-11 w-11 text-sm" }) {
  const initial = nama.trim().charAt(0).toUpperCase();
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <span
      className={`shrink-0 rounded-full flex items-center justify-center font-semibold ${size}`}
      style={{ backgroundColor: `${color}14`, color }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

// Kartu netral standar dipakai di banyak section: border tipis, sudut besar,
// tanpa bayangan berat — konsisten dengan gaya referensi.
function Card({ children, className = "", hoverable = false }) {
  return (
    <div
      className={`rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 transition-colors duration-300 ${
        hoverable ? "hover:border-neutral-900" : ""
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-neutral-100" />
        <div className="space-y-1.5">
          <div className="h-2.5 w-24 rounded bg-neutral-100" />
          <div className="h-2 w-16 rounded bg-neutral-100" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-full rounded bg-neutral-100" />
        <div className="h-2.5 w-4/5 rounded bg-neutral-100" />
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
  const [heroImgError, setHeroImgError] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Nav transparan di atas hero, berubah jadi putih solid begitu pengguna
  // scroll melewati hero — pola yang sama dipakai referensi (nav putih di
  // atas foto gelap, lalu tetap terbaca begitu masuk ke konten putih).
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
  // STATISTIK_FALLBACK supaya section statistik tidak pernah kosong/error.
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
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/komentar`,
    )
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
      setCommentError("Komentar gagal terkirim. Coba lagi beberapa saat lagi.");
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

  const slotTersedia = Math.max(0, statistik.kapasitas - statistik.terisi);
  const STATS = [
    {
      value: `${slotTersedia}`,
      label: `Slot parkir tersedia dari ${statistik.kapasitas} slot`,
    },
    {
      value: Number(statistik.rating_rata).toFixed(1),
      label: `Rating rata-rata dari ${statistik.jumlah_ulasan}+ ulasan pengguna`,
    },
    {
      value: `${Math.round(statistik.transaksi_selesai).toLocaleString("id-ID")}+`,
      label: "Total transaksi yang sudah diproses sistem",
    },
    {
      value: "3",
      label: "Level akses: Admin, Petugas, dan Owner",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
      {/* ================= Mobile sidebar ================= */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-neutral-900/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            ref={sidebarPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="relative w-72 max-w-[85vw] bg-white h-full p-6 flex flex-col gap-1 z-50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-semibold tracking-tight">
                Pelabuhan <span className="text-[#C90000]">Tanjung </span> perak
              </span>
              <button
                ref={closeBtnRef}
                onClick={() => setSidebarOpen(false)}
                aria-label="Tutup menu"
                className="h-9 w-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                  className="text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 px-3 py-3 rounded-lg border-b border-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/bantuan"
                onClick={() => setSidebarOpen(false)}
                className="text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 px-3 py-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                Bantuan
              </Link>
            </nav>
            <Link
              to={navPath}
              onClick={() => setSidebarOpen(false)}
              className="mt-4 rounded-full bg-neutral-900 text-white font-medium px-4 py-3 text-sm text-center hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              {navLabel}
            </Link>
          </div>
        </div>
      )}

      {/* ================= Header ================= */}
      <header
        className={`fixed top-0 inset-x-0 z-30 transition-colors duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur border-b border-neutral-200"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              ref={hamburgerBtnRef}
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
              className={`lg:hidden -ml-1.5 h-9 w-9 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                scrolled
                  ? "text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-900"
                  : "text-white hover:bg-white/10 focus-visible:ring-white"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <Link
              to="/"
              className={`flex items-center gap-2.5 min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 ${
                scrolled ? "focus-visible:ring-neutral-900" : "focus-visible:ring-white"
              }`}
            >
              <div className="min-w-0 leading-tight">
                <p
                  className={`text-base font-semibold tracking-tight truncate transition-colors duration-300 ${
                    scrolled ? "text-neutral-900" : "text-white"
                  }`}
                >
                 Pelabuhan <span className="text-[#C90000]">Tanjung </span> perak
                </p>
                <p
                  className={`hidden sm:block text-[11px] tracking-wide truncate transition-colors duration-300 ${
                    scrolled ? "text-neutral-500" : "text-white/70"
                  }`}
                >
                  {BRAND_ADDRESS}
                </p>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors focus-visible:outline-none ${
                  scrolled
                    ? "text-neutral-600 hover:text-neutral-900"
                    : "text-white/85 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/bantuan"
              className={`text-sm font-medium transition-colors focus-visible:outline-none ${
                scrolled
                  ? "text-neutral-600 hover:text-neutral-900"
                  : "text-white/85 hover:text-white"
              }`}
            >
              Bantuan
            </Link>
          </nav>

          <Link
            to={navPath}
            className={`inline-flex items-center rounded-full font-medium px-5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 ${
              scrolled
                ? "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900"
                : "bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:ring-white"
            }`}
          >
            {navLabel}
          </Link>
        </div>
      </header>

      {/* ================= Hero ================= */}
      <section className="relative w-full h-screen min-h-[600px]">
        <div className="absolute inset-0 bg-neutral-900/45 z-10 pointer-events-none" />
        {!heroImgError ? (
          <img
            src="/images/gambar.jpg"
            alt="Area Parkir Pelabuhan Tanjung Perak"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={() => setHeroImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}

        <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight text-white mb-6">
            Kelola System Parkir <br className="hidden md:block" />  <span className="text-[#C90000]">Lebih </span> cepat & rapi
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mb-10 leading-relaxed font-light">
            Sistem manajemen parkir terpadu untuk Admin, Petugas, dan Owner —
            transaksi instan, tarif otomatis, dan rekap data real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={navPath}
              className="inline-flex items-center justify-center gap-2 bg-white text-neutral-900 hover:bg-neutral-100 px-8 py-4 rounded-full font-medium transition-colors active:scale-95"
            >
              {user ? "Ke Dashboard" : "Masuk ke Portal"}
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center justify-center gap-2 border border-white/40 text-white hover:bg-white/10 px-8 py-4 rounded-full font-medium transition-colors active:scale-95"
            >
              Lihat fitur
            </a>
          </div>
        </div>
      </section>

      {/* ================= Tentang & Statistik ================= */}
      <section
        id="informasi"
        className="scroll-mt-20 max-w-7xl mx-auto px-6 md:px-12 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24"
      >
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              Tentang <span className="text-[#C90000]">Parkir </span>
            </h2>
            <p className="text-neutral-500 leading-relaxed max-w-md mb-8">
              Parkir ini  menyatukan pencatatan transaksi, tarif otomatis, dan
              pelaporan dalam satu sistem, sehingga petugas di lapangan dan
              owner di kantor melihat data yang sama secara real-time.
            </p>
            <div className="space-y-5 max-w-md">
              {ROLES.map((r) => (
                <div key={r.name} className="flex gap-4">
                  <span className="shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{r.name}</p>
                    <p className="text-sm text-neutral-500 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-12">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-5xl md:text-6xl font-medium tracking-tight mb-2 tabular-nums">
                  {s.value}
                </div>
                <div className="text-sm text-neutral-500 max-w-[180px]">{s.label}</div>
              </div>
            ))}
          </div>
          {statistikIlustrasi && (
            <p className="text-xs text-neutral-400 italic mt-8">
              *Angka di atas adalah contoh tampilan dan akan otomatis mengikuti
              data asli saat sistem berjalan.
            </p>
          )}
        </div>
      </section>

      {/* ================= Fitur ================= */}
      <section id="fitur" className="scroll-mt-20 max-w-7xl mx-auto px-6 md:px-12 py-24 lg:py-32">
        <div className="mb-12 max-w-lg">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Kenapa <span className="text-[#C90000]">Pakai </span> Parkir ini?
          </h2>
          <p className="text-neutral-500 leading-relaxed">
            Dirancang untuk kecepatan transaksi di lapangan hingga laporan
            data akurat bagi owner.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} hoverable className="h-full">
              <div className="h-11 w-11 rounded-full bg-neutral-100 flex items-center justify-center mb-6 text-neutral-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ================= Showcase portal (bento) ================= */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 lg:py-32">
        <div className="mb-12 max-w-lg">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Tampilan <span className="text-[#C90000]">Area  </span>Parkir
          </h2>
          <p className="text-neutral-500 leading-relaxed">
            Antarmuka terintegrasi mulai dari lokasi operasional hingga
            identitas resmi portal parkir.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-100">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
            <img
              src="/images/gambar.jpg"
              alt="Area Parkir Pelabuhan Tanjung Perak"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <p className="text-white font-semibold text-lg">Pelabuhan Tanjung Perak</p>
              <p className="text-white/70 text-sm">
                Gerbang & cetak struk otomatis, aktif realtime
              </p>
            </div>
          </div>
          <div className="group relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-50 border border-neutral-200 flex items-center justify-center p-10">
            <img
              src="/parkir_pelabuhan_tanjung_perak.png"
              alt="Emblem Parkir Pelabuhan Tanjung Perak"
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900">
                Identitas Resmi Portal
              </span>
              <span className="text-xs font-medium text-neutral-500 bg-white border border-neutral-200 px-3 py-1 rounded-full">
                3 Level Akses
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Grafik transaksi ================= */}
      <section className="bg-neutral-50 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              <span className="text-[#C90000]">Transaksi  </span> 7 hari terakhir
            </h2>
            <p className="text-neutral-500 leading-relaxed">
              {grafikIlustrasi
                ? "Ilustrasi jumlah transaksi per hari."
                : "Jumlah transaksi per hari, 7 hari terakhir."}
            </p>
          </div>
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-8">
            {grafikLoading ? (
              <p className="text-sm text-neutral-500">Memuat data...</p>
            ) : grafikData.length === 0 ? (
              <p className="text-sm text-neutral-500">Belum ada data transaksi.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={grafikData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#737373"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e5e5" }}
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={12}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e5e5e5",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: "#171717" }}
                    formatter={(value) => [value, "Jumlah Transaksi"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke="#171717"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#171717", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ================= Cara kerja / demo ================= */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 lg:py-32 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            <span className="text-[#C90000]">Cara Kerja </span> sistem ini
          </h2>
          <p className="text-neutral-500 leading-relaxed mb-6">
            Video singkat alur transaksi masuk sampai cetak struk.
          </p>
          <video
            controls
            className="w-full rounded-3xl bg-neutral-900 aspect-video object-cover"
            poster="/images/gambar.jpg"
            src="/video.mp4"
          >
            Browser Anda tidak mendukung pemutaran video.
          </video>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-8">Tiga langkah singkat</h3>
          <div className="space-y-8">
            {ALUR.map((a, i) => (
              <div key={a.no} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-medium">
                    {i + 1}
                  </span>
                  {i < ALUR.length - 1 && (
                    <span className="w-px flex-1 bg-neutral-200 mt-2" aria-hidden="true" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-sm font-semibold text-neutral-900 mb-1">{a.title}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Testimoni ================= */}
      <section id="testimoni" className="scroll-mt-20 bg-neutral-50 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Kata mereka <span className="text-[#C90000]">Tentang  </span>Parkir ini 
            </h2>
            <p className="text-neutral-500 leading-relaxed">
              Pengalaman langsung dari admin, petugas, dan owner yang memakai
              Parkir ini  setiap hari.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONI.map((t, i) => (
              <div
                key={t.nama}
                className="bg-white rounded-3xl p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6">
                    <Bintang jumlah={t.bintang} />
                  </div>
                  <p className="text-neutral-700 leading-relaxed mb-8">"{t.teks}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar nama={t.nama} index={i} />
                  <div>
                    <div className="font-semibold text-sm">{t.nama}</div>
                    <div className="text-sm text-neutral-500">{t.peran}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Komentar ================= */}
      <section id="komentar" className="scroll-mt-20 max-w-7xl mx-auto px-6 md:px-12 py-24 lg:py-32">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Komentar pengguna
          </h2>
          <span className="rounded-full bg-neutral-100 text-neutral-900 text-xs font-medium px-2.5 py-0.5">
            {comments.length}
          </span>
        </div>
        <p className="text-neutral-500 leading-relaxed mb-12">
          Pengalaman langsung dari pengguna.
        </p>

        <div className="space-y-6">
          {/* -------- Form komentar -------- */}
          <Card>
            <p className="text-sm font-semibold text-neutral-900 mb-1">
              Tinggalkan komentar Anda
            </p>
            <p className="text-xs text-neutral-500 mb-6">
              Bagikan pengalaman Anda memakai ParkirKu di sini.
            </p>
            <form onSubmit={handleCommentSubmit} className="space-y-4" noValidate>
              <div className="rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                <p className="text-xs text-neutral-500 mb-2">Rating Anda</p>
                <RatingInput value={commentRating} onChange={setCommentRating} />
              </div>
              <div>
                <label htmlFor="comment-name" className="block text-xs text-neutral-500 mb-1.5">
                  Nama
                </label>
                <input
                  id="comment-name"
                  type="text"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full rounded-xl bg-white border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="comment-text" className="text-xs text-neutral-500">
                    Komentar
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    {commentText.length}/{KOMENTAR_MAX_LEN}
                  </span>
                </div>
                <textarea
                  id="comment-text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, KOMENTAR_MAX_LEN))}
                  placeholder="Tulis komentar Anda..."
                  rows={4}
                  className="w-full rounded-xl bg-white border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none transition-shadow"
                />
              </div>
              {commentError && (
                <p className="flex items-center gap-1.5 text-xs text-rose-600" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {commentError}
                </p>
              )}
              <button
                type="submit"
                disabled={commentSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white font-medium px-6 py-3 text-sm hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                {commentSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  "Kirim Komentar"
                )}
              </button>
            </form>
          </Card>

          {/* -------- Daftar komentar (geser kanan/kiri) -------- */}
          <div className="min-w-0">
            <div
              className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
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

              {!commentsLoading && comments.length === 0 && (
                <Card className="shrink-0 w-full text-center py-10">
                  <p className="text-sm text-neutral-500">Belum ada komentar.</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Jadilah yang pertama berbagi pengalaman Anda.
                  </p>
                </Card>
              )}

              {comments.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shrink-0 w-72 snap-start hover:border-neutral-900 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar nama={c.nama} index={i} size="h-9 w-9 text-sm" />
                      <p className="text-sm font-medium text-neutral-900 truncate">{c.nama}</p>
                    </div>
                    <Bintang jumlah={c.rating ?? 5} />
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">{c.teks}</p>

                  {c.balasan && (
                    <div className="mt-3 pl-3 border-l-2 border-neutral-200 bg-neutral-50 rounded-r-md py-2 pr-2">
                      <p className="text-xs font-semibold text-neutral-900 mb-1">
                        Balasan Admin
                      </p>
                      <p className="text-sm text-neutral-500 leading-relaxed">{c.balasan}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Bantuan (CTA) ================= */}
      <section id="bantuan" className="scroll-mt-20 max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <div className="bg-neutral-50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-semibold text-neutral-900 mb-1">Butuh bantuan?</p>
            <p className="text-sm text-neutral-500">
              Lihat pertanyaan umum seputar akun dan cara pakai di halaman Bantuan.
            </p>
          </div>
          <Link
            to="/bantuan"
            className="shrink-0 rounded-full bg-neutral-900 text-white font-medium px-6 py-3 text-sm hover:bg-neutral-800 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            Buka Halaman Bantuan
          </Link>
        </div>
      </section>

      {/* ================= Floating quick-help button ================= */}
      <div className="fixed bottom-6 right-6 z-50">
        {helpOpen && (
          <div className="mb-3 w-64 rounded-2xl bg-white border border-neutral-200 p-4 shadow-2xl">
            <p className="text-sm font-semibold text-neutral-900 mb-1">Bantuan cepat</p>
            <p className="text-xs text-neutral-500 mb-3">
              Chat langsung dengan admin, atau buka daftar pertanyaan umum.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white font-medium px-3 py-2.5 text-xs hover:bg-emerald-500 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                className="text-center text-xs text-neutral-500 hover:text-neutral-900 hover:underline py-1"
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
          className="h-12 w-12 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-2xl hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M9.5 9a2.5 2.5 0 115 .5c0 1.5-2.5 1.5-2.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* ================= Footer ================= */}
      <footer className="bg-neutral-900 text-white pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Top: CTA strip */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-16 border-b border-white/10">
            <div className="max-w-lg">
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                Siap mengelola parkir lebih rapi?
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                Masuk ke portal Admin, Petugas, atau Owner dan mulai pantau
                transaksi hari ini.
              </p>
            </div>
            <Link
              to={navPath}
              className="shrink-0 bg-white text-neutral-900 hover:bg-neutral-200 px-8 py-4 rounded-full font-medium transition-colors active:scale-95"
            >
              {navLabel}
            </Link>
          </div>

          {/* Middle: Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-16">
            <div className="col-span-2 md:col-span-2">
              <div className="text-2xl font-semibold tracking-tight mb-4">
                Pelabuhan <span className="text-[#C90000]">Tanjung </span> perak
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mb-6">
                Sistem manajemen parkir terpadu untuk Admin, Petugas, dan Owner.
              </p>
              <div className="flex items-start gap-2 max-w-xs mb-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5 text-[#C90000]" aria-hidden="true">
                  <path
                    d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
                </svg>
                <p className="text-xs text-neutral-400 leading-relaxed">{BRAND_ADDRESS}</p>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo-smkn1sanden.png"
                  alt="Logo SMK Negeri 1 Sanden"
                  className="h-9 w-9 shrink-0 object-contain"
                />
                <div className="leading-tight">
                  <p className="text-xs text-neutral-400">Dikembangkan oleh siswa</p>
                  <p className="text-xs font-medium text-white">SMK Negeri 1 Sanden, Bantul</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Halaman</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>
                  <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
                </li>
                <li>
                  <a href="#informasi" className="hover:text-white transition-colors">Informasi</a>
                </li>
                <li>
                  <a href="#testimoni" className="hover:text-white transition-colors">Testimoni</a>
                </li>
                <li>
                  <a href="#komentar" className="hover:text-white transition-colors">Komentar</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Portal</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>
                  <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
                </li>
                <li>
                  <Link to="/petugas" className="hover:text-white transition-colors">Petugas</Link>
                </li>
                <li>
                  <Link to="/owner" className="hover:text-white transition-colors">Owner</Link>
                </li>
                <li>
                  <Link to="/bantuan" className="hover:text-white transition-colors">Bantuan</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Kontak</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    WhatsApp Admin
                  </a>
                </li>
                <li>{BRAND_LOCATION}</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10 text-sm text-neutral-500">
            <p>© {new Date().getFullYear()} ParkirKu. Seluruh hak cipta dilindungi.</p>
            <p className="text-xs text-neutral-500">Dibuat oleh {BRAND_NAME}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}