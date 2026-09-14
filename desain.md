# Design Document (desain.md)
## Aplikasi Parkir UKK — Sistem Manajemen Parkir Digital

| | |
|---|---|
| **Nama Produk** | Aplikasi Parkir UKK (app-parkir) |
| **Jenis Dokumen** | Design Document (Arsitektur Teknis & Desain Antarmuka) |
| **Versi** | 1.0 |
| **Status** | Diturunkan dari kode sumber existing (reverse-engineered) |
| **Dokumen Terkait** | `prd.md` (Product Requirements Document) |
| **Tanggal** | 14 September 2026 |

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan **desain teknis** (arsitektur sistem, skema data, alur proses) dan **desain antarmuka** (design system, struktur navigasi, pola komponen) dari Aplikasi Parkir UKK, sebagai referensi bagi pengembang yang melanjutkan, memelihara, atau mengaudit sistem ini. Isinya diambil langsung dari struktur kode yang ada, bukan rancangan baru.

---

## 2. Arsitektur Sistem

### 2.1 Gambaran Umum

Sistem terdiri dari dua aplikasi independen yang berkomunikasi murni lewat HTTP/JSON:

```
┌─────────────────────┐        Axios (HTTP/JSON)        ┌──────────────────────┐
│   Frontend (SPA)     │ ───────────────────────────────▶│   Backend (REST API)  │
│   React 19 + Vite     │◀─────────────────────────────── │   Laravel 12          │
│   Deploy: Vercel      │        Bearer Token (Sanctum)    │   Deploy: Railway      │
└─────────────────────┘                                  └──────────┬───────────┘
                                                                     │
                                                          ┌──────────▼───────────┐
                                                          │  Database              │
                                                          │  SQLite (default) /    │
                                                          │  MySQL (produksi)      │
                                                          └───────────────────────┘
```

- **Tidak ada server-side rendering** — frontend adalah SPA murni yang di-build statis (`npm run build` → `frontend/dist`).
- **Stateless auth**: token Bearer (Laravel Sanctum) disimpan di sisi klien dan dikirim di setiap request; tidak ada sesi server berbasis cookie untuk komunikasi API lintas domain.
- **CORS eksplisit**: backend hanya mengizinkan origin yang terdaftar di `FRONTEND_URL` (`backend/config/cors.php`), dikonfigurasi berbeda untuk development (`localhost:5173`) dan produksi (domain Vercel).
- **Pemrosesan biaya di level database**: perhitungan biaya parkir didelegasikan ke fungsi SQL `fn_hitung_biaya_parkir` (dibuat lewat migration khusus), bukan murni logika PHP — memastikan konsistensi kalkulasi meski diakses dari banyak jalur kode.

### 2.2 Struktur Direktori

```
app-parkir/
├── backend/                  Laravel 12 REST API
│   ├── app/
│   │   ├── Http/Controllers/  13 controller (Auth, Transaksi, Booking, dst.)
│   │   ├── Models/             10 model Eloquent
│   │   └── Console/Commands/   ExpireBookings (scheduled command)
│   ├── database/
│   │   ├── migrations/         20 file migrasi (skema evolutif)
│   │   └── seeders/
│   └── routes/api.php          Definisi seluruh endpoint REST
└── frontend/                 React 19 SPA + Vite
    └── src/
        ├── api/                Wrapper Axios per domain
        ├── components/         Komponen reusable (ui.jsx, Layout.jsx, Modal*)
        ├── context/             AuthContext, ThemeContext, ToastContext
        ├── pages/
        │   ├── admin/           9 halaman
        │   ├── owner/           3 halaman
        │   ├── petugas/         5 halaman
        │   └── pelanggan/       2 halaman
        └── config/              theme.config.js
```

### 2.3 Prinsip Desain Backend

- **Konvensi penamaan Indonesia**: tabel (`tb_user`, `tb_kendaraan`), kolom (`waktu_masuk`, `biaya_total`), dan pesan API seluruhnya berbahasa Indonesia — konsisten dengan domain bisnis lokal (UKK SMK).
- **Primary key kustom per tabel** (bukan `id` default Laravel): `id_user`, `id_kendaraan`, `id_parkir`, dsb. — mencerminkan skema database yang dirancang independen dari konvensi framework.
- **Middleware `CheckRole`** sebagai satu-satunya gerbang otorisasi granular; route digrupkan per kombinasi role yang diizinkan (`role:admin`, `role:admin,petugas`, dst.) langsung di `routes/api.php`.
- **Helper model statis** untuk logika yang dipakai lintas controller, contoh: `PengaturanDenda::ambil()` (selalu mengembalikan satu baris pengaturan, auto-create jika belum ada), `Booking::buatKodeBooking()` (generator kode unik `BKG-XXXXXX`), `LogAktivitas::catat()` (pencatatan log satu baris).
- **Pemisahan logika biaya vs denda**: `Transaksi::hitungBiayaKeluar()` (tarif × durasi) dan `Transaksi::hitungDenda()` (keterlambatan booking) sengaja dipisah menjadi dua method agar tidak saling bercampur, dipanggil berurutan oleh controller.
- **Self-healing expiry**: status booking kedaluwarsa dihitung ulang baik oleh scheduled command (`ExpireBookings`, untuk produksi dengan cron aktif) maupun dicek ulang on-demand setiap endpoint booking diakses (fallback bila scheduler tidak berjalan, umum terjadi di lingkungan development lokal).

---

## 3. Desain Basis Data (Skema Konseptual)

```
tb_user ──┬──< tb_kendaraan ──┬──< tb_transaksi >──┐
          │                    │                    │
          ├──< tb_booking >────┴────────────────────┤
          │        │                                 │
          │        ├──> tb_area_parkir <─────────────┤
          │        └──> tb_tarif <────────────────────┘
          │
          ├──< tb_log_aktivitas
          └──< tb_permintaan_aktivasi

tb_pengaturan_denda   (singleton — selalu 1 baris, id_pengaturan = 1)
komentars              (independen, tidak berelasi ke user — komentar publik)
```

**Status enum penting:**
- `tb_transaksi.status`: `masuk` → `keluar`
- `tb_transaksi.status_pembayaran`: `belum_bayar`(implisit) → `lunas`
- `tb_booking.status`: `menunggu` → `dikonfirmasi` → `selesai` | `ditolak` | `dibatalkan` | `kadaluarsa`
- `tb_permintaan_aktivasi.status`: `menunggu` → `disetujui` | `ditolak`
- `tb_user.status_aktif`: boolean (aktif/nonaktif)

**Evolusi skema** terlihat dari 20 file migrasi yang bertambah incremental (mis. `add_denda_to_tb_transaksi`, `add_foto_profil_to_tb_user`, `drop_qris_ref_id_from_tb_transaksi`) — menunjukkan skema tumbuh mengikuti kebutuhan fitur baru tanpa migrasi ulang skema dasar.

---

## 4. Desain Alur Proses (Sequence Utama)

### 4.1 Alur Booking → Realisasi → Pembayaran

```
Pelanggan          Sistem                      Petugas
   │                  │                            │
   │ 1. Buat booking  │                            │
   │─────────────────▶│                            │
   │                  │ validasi: kendaraan milik   │
   │                  │ sendiri, tidak sedang parkir │
   │                  │ generate kode_booking        │
   │◀─────────────────│ status = menunggu            │
   │                  │                            │
   │                  │◀── 2. Cari kode booking ────│
   │                  │ atau scan QR                │
   │                  │──── data booking ───────────▶│
   │                  │                            │
   │                  │◀── 3. Konfirmasi/Tolak ─────│
   │                  │ status = dikonfirmasi        │
   │                  │                            │
   │                  │◀── 4. Kendaraan masuk ──────│
   │                  │ tb_transaksi.status = masuk   │
   │                  │ terisi (area) += 1            │
   │                  │                            │
   │                  │◀── 5. Kendaraan keluar ─────│
   │                  │ hitung biaya (fn SQL)         │
   │                  │ hitung denda (jika telat)     │
   │                  │ booking.status = selesai      │
   │                  │                            │
   │                  │◀── 6. Tampilkan QRIS statis ─│
   │                  │                            │
   │                  │◀── 7. Konfirmasi lunas ──────│
   │                  │ status_pembayaran = lunas     │
   │                  │──── 8. Cetak struk ──────────▶│
```

### 4.2 Alur Auto-Expire Booking

```
Trigger: (a) Scheduled command `ExpireBookings` (cron/schedule:work), atau
         (b) Endpoint GET /booking atau /booking/saya diakses

  → Ambil semua booking dengan status IN (menunggu, dikonfirmasi)
  → Untuk setiap booking:
      jika (tanggal_rencana + jam_rencana_masuk) < (sekarang - 60 menit):
          status = kadaluarsa
          catat log aktivitas
```

### 4.3 Alur Perhitungan Denda Keterlambatan

```
Input: transaksi hasil booking dengan jam_rencana_keluar

1. Ambil pengaturan denda (PengaturanDenda::ambil())
2. Jika !aktif atau denda_per_jam <= 0 → denda = 0, selesai
3. rencanaKeluar = tanggal_rencana + jam_rencana_keluar
4. menitTerlambat = (waktu_keluar_aktual - rencanaKeluar) - toleransi_menit
5. Jika menitTerlambat <= 0 → denda = 0, selesai
6. jamTerlambat = ceil(menitTerlambat / 60)
7. denda = jamTerlambat * denda_per_jam
```

---

## 5. Desain Otorisasi (Access Control Matrix)

| Resource | Admin | Petugas | Owner | Pelanggan | Publik |
|---|:---:|:---:|:---:|:---:|:---:|
| User (CRUD) | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| Tarif (read) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Tarif (write) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Area Parkir (read) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Area Parkir (write) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kendaraan (index/store) | ✅ | ✅ | ❌ | ❌ (via kendaraan-saya) | ❌ |
| Kendaraan (update/delete) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kendaraan milik sendiri | ❌ | ❌ | ❌ | ✅ | ❌ |
| Transaksi masuk/keluar | ❌ | ✅ | ❌ | ❌ | ❌ |
| Konfirmasi QRIS | ❌ | ✅ | ❌ | ❌ | ❌ |
| Pengaturan Denda (read) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Pengaturan Denda (write) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Booking (buat/batalkan) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Booking (konfirmasi/tolak) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rekap transaksi | ❌ | ❌ | ✅ | ❌ | ❌ |
| Rekap harian (internal) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Log Aktivitas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Permintaan Aktivasi (ajukan) | — | — | — | — | ✅ |
| Permintaan Aktivasi (proses) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Komentar (kirim) | — | — | — | — | ✅ |
| Komentar (balas/hapus) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Statistik publik | — | — | — | — | ✅ |

Otorisasi ditegakkan **di backend** (middleware `role:...`), bukan hanya disembunyikan di UI — validasi kepemilikan data (mis. kendaraan/booking milik user login) juga dicek ulang di controller, bukan hanya diasumsikan dari state frontend.

---

## 6. Desain Antarmuka (UI/UX)

### 6.1 Filosofi Desain

Antarmuka mengikuti gaya **minimalis neutral** (mirip pola desain "shadcn/linear-like"): palet warna netral (`neutral-*`) sebagai basis, aksen warna semantik terbatas (emerald untuk sukses, rose untuk bahaya, amber untuk peringatan, blue untuk info), radius besar (`rounded-2xl`/`rounded-xl`) pada kartu dan tombol, dan banyak whitespace. Tipografi tunggal **Inter** dipakai konsisten di seluruh aplikasi (landing, auth, dan semua dashboard role) untuk menjaga identitas visual seragam.

Sistem mendukung **mode gelap/terang** (`ThemeContext` + `theme.config.js`), dengan label tombol toggle menampilkan tujuan klik ("Ganti ke mode gelap"), bukan status tema saat ini.

### 6.2 Design System — Komponen Reusable (`components/ui.jsx`)

| Komponen | Fungsi | Varian |
|---|---|---|
| `PageHeader` | Header halaman standar: eyebrow badge, judul, deskripsi, area aksi | — |
| `StatCard` | Kartu metrik dashboard dengan ikon, nilai besar, indikator tren naik/turun | trend up/down/neutral |
| `Card` | Kontainer konten umum, radius besar, border tipis | hoverable, noPadding |
| `Badge` | Label status kecil | neutral, success, danger, warning, info, purple |
| `Table` | Tabel data dengan header sticky-style, hover row | — |
| `Button` | Tombol aksi | primary, secondary, ghost, danger, success, outline × sm/md/lg |
| `Input` | Input teks dengan ikon opsional & pesan error | — |
| `SearchInput` | Input pencarian dengan ikon kaca pembesar & tombol clear | — |
| `ConfirmDialog` | Modal konfirmasi aksi destruktif (mis. hapus data) | tone danger/neutral |
| `EmptyState` | Placeholder saat data kosong, dengan CTA opsional | — |
| `Skeleton` | Loading placeholder animasi | — |

Semua komponen dibangun di atas **Tailwind CSS 4 utility classes** murni (tanpa CSS module terpisah), memastikan konsistensi visual tanpa duplikasi definisi gaya.

### 6.3 Struktur Navigasi per Role

Navigasi sisi (`Layout.jsx`) menampilkan menu berbeda sesuai role yang login, masing-masing dengan ikon SVG garis tipis (stroke-based, 24×24) unik per item menu:

| Role | Label Peran | Menu Navigasi |
|---|---|---|
| **admin** | Administrator | Ringkasan, Pengguna, Tarif Parkir, Pengaturan Denda, Area Parkir, Kendaraan, Komentar, Permintaan Aktivasi, Log Aktivitas |
| **petugas** | Petugas Lapangan | Ringkasan, Tambah Kendaraan, Kendaraan Masuk, Kendaraan Keluar, Riwayat Transaksi, Booking Masuk |
| **owner** | Pemilik Usaha | Ringkasan, Rekap Transaksi |
| **pelanggan** | Pelanggan | Booking Parkir, Booking Saya |

Layout menyertakan **avatar profil** dengan fallback ke inisial nama (2 huruf) bila foto belum diunggah, dan mendukung unggah foto langsung dari sidebar (klik avatar → file picker → validasi tipe gambar & ukuran maks 2MB → upload ke Cloudinary).

### 6.4 Peta Halaman & Tujuan Desain

| Halaman | Tujuan UX |
|---|---|
| `Landing.jsx` | Kesan pertama publik: highlight fitur, statistik ringkasan real-time, komentar/ulasan pengguna |
| `Login.jsx` / `Register.jsx` | Form autentikasi minimal, dukungan login passkey sebagai alternatif cepat |
| `Bantuan.jsx` | Halaman FAQ/panduan statis |
| `admin/DashboardAdmin.jsx` | Ringkasan metrik operasional untuk admin (StatCard grid) |
| `admin/Users.jsx`, `Tarif.jsx`, `AreaParkir.jsx`, `Kendaraan.jsx` | Pola CRUD standar: Table + modal form + ConfirmDialog untuk hapus |
| `admin/PengaturanDenda.jsx` | Form pengaturan tunggal (bukan CRUD list) — toggle aktif, input denda/jam & toleransi menit |
| `admin/PermintaanAktivasi.jsx` | Antrian moderasi: daftar pengajuan + aksi setujui/tolak dengan catatan |
| `admin/LogAktivitas.jsx` | Tabel log read-only, kemungkinan dengan filter waktu/user |
| `admin/Komentar.jsx` | Moderasi komentar publik + form balasan |
| `petugas/KendaraanMasuk.jsx` / `KendaraanKeluar.jsx` | Form input cepat berorientasi kecepatan kerja lapangan; termasuk pencarian booking via kode/QR scan (`ModalScanQr.jsx`) |
| `petugas/Transaksi.jsx` | Riwayat transaksi + cetak struk (`StrukCard.jsx`) |
| `petugas/Booking.jsx` | Antrian booking masuk untuk dikonfirmasi/ditolak |
| `pelanggan/Booking.jsx` | Form booking: pilih kendaraan, area, tarif, tanggal/jam; menampilkan kode booking via QR (`ModalQrBooking.jsx`) setelah submit |
| `pelanggan/RiwayatBooking.jsx` | Daftar riwayat booking milik sendiri + aksi hapus riwayat |
| `owner/DashboardOwner.jsx` | Ringkasan metrik bisnis level tinggi |
| `owner/Rekap.jsx` / `GrafikRingkasan.jsx` | Rekap transaksi berdasarkan rentang tanggal, divisualisasikan dengan grafik (Recharts) |

### 6.5 Komponen Modal Khusus Domain

| Modal | Fungsi |
|---|---|
| `ModalQrBooking.jsx` | Menampilkan kode booking pelanggan dalam bentuk QR code yang bisa dipindai petugas saat kedatangan |
| `ModalScanQr.jsx` | Kamera scan QR (petugas) untuk membaca kode booking pelanggan secara cepat, alternatif dari input manual |
| `ModalQris.jsx` | Menampilkan QRIS statis untuk pembayaran, dengan tombol "Sudah Dibayar" yang memicu konfirmasi manual petugas |

### 6.6 Pola Interaksi & Feedback

- **Toast notification** (`ToastContext`) untuk feedback aksi non-blocking (sukses/gagal), menggantikan `alert()` browser bawaan.
- **Loading state**: tombol memiliki prop `loading` bawaan (`Button` menampilkan spinner `Loader2`), menghindari double-submit.
- **Konfirmasi destruktif**: setiap aksi hapus/tolak melalui `ConfirmDialog` modal, bukan browser `confirm()` — konsisten secara visual dan dapat menampilkan pesan kontekstual.
- **Protected Route**: `ProtectedRoute.jsx` mengarahkan pengguna yang belum login atau salah role ke halaman yang sesuai (login/`403`), mencegah akses UI role lain meski URL diketik manual.
- **Error Boundary global** (`main.jsx`): menangkap crash React tak terduga dan menampilkan halaman error ramah pengguna dengan tombol "Muat Ulang Halaman", alih-alih layar putih kosong.
- **Reduced motion**: animasi dihormati sesuai preferensi aksesibilitas sistem operasi pengguna (`prefers-reduced-motion`).

---

## 7. Desain Keamanan

| Lapisan | Implementasi |
|---|---|
| Autentikasi | Laravel Sanctum (Bearer token) + opsi login passkey |
| Otorisasi | Middleware `CheckRole` per grup route di backend; `ProtectedRoute` di frontend (lapisan UX, bukan satu-satunya proteksi) |
| Password | Hash otomatis via cast `'password' => 'hashed'` pada model `User` |
| Data sensitif | Kolom `password` dan `passkey_token` disembunyikan (`$hidden`) dari seluruh response JSON |
| Kepemilikan data | Validasi server-side eksplisit (mis. kendaraan/booking hanya bisa diakses/diubah oleh `id_user` pemiliknya) — tidak mengandalkan input klien |
| CORS | Whitelist origin eksplisit per environment, bukan wildcard |
| Rahasia environment | Kredensial sandbox pembayaran (`DANA_*`) disimpan di `.env`, tidak di-commit ke repo publik |

---

## 8. Batasan Desain yang Perlu Diperhatikan Pengembang Lanjutan

1. **Pembayaran QRIS statis**: tidak ada verifikasi otomatis (webhook/signature) dari payment gateway — status lunas sepenuhnya bergantung pada input manual petugas. Pengembangan lanjutan yang ingin payment gateway penuh perlu menambahkan endpoint webhook dan verifikasi tanda tangan pembayaran.
2. **Single-tenant**: skema data tidak memiliki kolom pemisah organisasi/cabang; ekspansi ke multi-lokasi memerlukan perubahan skema signifikan (mis. `id_cabang` di hampir semua tabel).
3. **Dua definisi "toleransi" yang independen**: toleransi kedatangan booking (60 menit, hardcoded di `BookingController`) dan toleransi keterlambatan keluar untuk denda (`toleransi_menit`, dikonfigurasi admin) adalah dua mekanisme terpisah — perlu didokumentasikan dengan jelas agar tidak tertukar saat maintenance.
4. **Fungsi SQL kustom** (`fn_hitung_biaya_parkir`): logika kalkulasi biaya ada di level database, bukan PHP — migrasi/porting ke DBMS lain (mis. dari MySQL ke PostgreSQL) memerlukan penulisan ulang fungsi ini dalam dialek SQL yang sesuai.

---

*Dokumen ini disusun berdasarkan analisis langsung terhadap kode sumber (struktur direktori, model, migrasi, controller, rute API, komponen React, dan design system frontend) pada arsip proyek yang diunggah.*
