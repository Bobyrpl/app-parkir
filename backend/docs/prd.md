# Product Requirements Document (PRD)
## Aplikasi Parkir UKK — Sistem Manajemen Parkir Digital

| | |
|---|---|
| **Nama Produk** | Aplikasi Parkir UKK (app-parkir) |
| **Jenis Dokumen** | Product Requirements Document |
| **Versi** | 1.0 |
| **Status** | Diturunkan dari kode sumber existing (reverse-engineered PRD) |
| **Repositori** | github.com/Bobyrpl/app-parkir |
| **Tanggal** | 14 September 2026 |

---

## 1. Ringkasan Eksekutif

Aplikasi Parkir UKK adalah sistem manajemen parkir digital berbasis web yang dibangun sebagai proyek Uji Kompetensi Keahlian (UKK). Produk ini menggantikan pencatatan parkir manual (buku/kertas) dengan platform digital yang mencakup pencatatan kendaraan masuk/keluar, booking slot parkir online, perhitungan tarif & denda otomatis, pembayaran QRIS, serta pelaporan untuk pemilik usaha.

Sistem dibangun dengan arsitektur **dua layanan independen**:
- **Backend**: Laravel 12 (PHP 8.2+) sebagai REST API, autentikasi Laravel Sanctum (Bearer token), database SQLite (default)/MySQL.
- **Frontend**: React 19 SPA (Vite, React Router, Axios, Tailwind CSS 4).

Kedua layanan berkomunikasi murni lewat HTTP/JSON dan dapat di-deploy terpisah (frontend ke Vercel, backend ke Railway).

---

## 2. Latar Belakang & Masalah yang Dipecahkan

Pengelolaan parkir konvensional umumnya masih manual: karcis kertas, pencatatan buku untuk kendaraan masuk/keluar, dan penghitungan tarif manual yang rawan kesalahan hitung, kehilangan data, dan sulit direkap oleh pemilik usaha. Tidak ada mekanisme booking slot di muka, sehingga pelanggan tidak bisa memastikan ketersediaan tempat sebelum datang.

**Masalah spesifik yang dijawab produk ini:**
1. Pencatatan kendaraan masuk/keluar tidak terstandar dan sulit diaudit.
2. Perhitungan biaya parkir & denda keterlambatan dilakukan manual dan tidak konsisten.
3. Tidak ada visibilitas real-time terhadap kapasitas/slot area parkir.
4. Pelanggan tidak bisa memesan slot parkir terlebih dahulu.
5. Pemilik usaha (owner) tidak punya akses cepat ke rekap pendapatan dan aktivitas operasional.
6. Pembayaran non-tunai (QRIS) belum terintegrasi ke pencatatan transaksi.

---

## 3. Tujuan Produk (Goals)

1. Mendigitalkan seluruh siklus transaksi parkir: masuk → keluar → pembayaran → struk.
2. Menyediakan booking online berbasis slot area & kendaraan dengan status yang jelas dan auto-expire.
3. Menstandarkan perhitungan tarif (per jenis kendaraan, per jam) dan denda keterlambatan booking secara otomatis dan dapat dikonfigurasi oleh admin.
4. Memberi setiap peran (role) antarmuka dan hak akses yang sesuai dengan tanggung jawabnya.
5. Menyediakan rekap dan dashboard untuk owner sebagai dasar pengambilan keputusan bisnis.
6. Mencatat jejak aktivitas (log) untuk akuntabilitas operasional.

**Non-tujuan (Out of Scope) versi ini:**
- Integrasi payment gateway otomatis (QRIS saat ini bersifat statis, konfirmasi manual oleh petugas — bukan webhook Midtrans/DANA otomatis meski terdapat dependency-nya).
- Aplikasi mobile native (produk ini adalah web SPA responsif).
- Multi-tenant (multi-lokasi/cabang dengan pemisahan data organisasi).
- Notifikasi push/SMS/email otomatis ke pelanggan.

---

## 4. Target Pengguna & Peran (Roles)

Sistem menerapkan **role-based access control** dengan 4 peran, dikontrol lewat middleware `CheckRole` di backend dan `ProtectedRoute` di frontend:

| Role | Deskripsi | Area Akses Utama |
|---|---|---|
| 👑 **Admin** | Mengelola seluruh data master sistem | `/admin/*` — Users, Tarif, Area Parkir, Kendaraan, Pengaturan Denda, Log Aktivitas, Komentar, Permintaan Aktivasi |
| 🧑‍💼 **Owner** | Memantau performa bisnis, tidak terlibat operasional harian | `/owner/*` — Dashboard, Rekap laporan, Grafik ringkasan |
| 🧍 **Petugas** | Operasional lapangan: mencatat kendaraan, transaksi, memproses booking | `/petugas/*` — Kendaraan Masuk/Keluar, Transaksi, Booking masuk, Tambah Kendaraan |
| 🙋 **Pelanggan** | Pengguna akhir yang memesan slot parkir | `/pelanggan/*` — Booking, Riwayat Booking, kendaraan miliknya sendiri |

Otentikasi menggunakan **username + password** (bukan email) via Laravel Sanctum, dengan dukungan tambahan **login passkey**. Akun dapat dinonaktifkan (`status_aktif`), dan pengguna yang dinonaktifkan dapat **mengajukan permintaan aktivasi ulang** tanpa perlu login, yang kemudian ditinjau (disetujui/ditolak) oleh admin.

---

## 5. Arsitektur & Teknologi

```
Browser  →  Frontend (React SPA, Vercel)  →  Axios (HTTP/JSON)  →  Backend (Laravel REST API, Railway)
```

| Kategori | Teknologi |
|---|---|
| Backend | Laravel 12, PHP ^8.2, REST API |
| Autentikasi | Laravel Sanctum (Bearer token) + login passkey |
| Frontend | React 19 (SPA), React Router, Axios |
| Build Tool | Vite |
| Styling | Tailwind CSS 4, Bootstrap (komponen tertentu) |
| Visualisasi Data | Recharts (grafik dashboard owner) |
| QR Code | qrcode / html5-qrcode (generate & scan kode booking) |
| Pembayaran | Midtrans / DANA QRIS (sandbox, konfirmasi manual) |
| Database | SQLite (default) / MySQL |
| State Management | Redux (redux-thunk), React Context (Auth, Theme, Toast) |
| Testing | PHPUnit |
| Deployment | Vercel (frontend) + Railway (backend) |
| CORS/Keamanan | Konfigurasi origin eksplisit via `FRONTEND_URL` & `SANCTUM_STATEFUL_DOMAINS` |

---

## 6. Model Data Utama (Entities)

| Tabel | Entitas | Ringkasan Field Kunci |
|---|---|---|
| `tb_user` | User | id_user, nama_lengkap, username, no_telp, password, passkey_token, role, status_aktif, foto_profil |
| `tb_kendaraan` | Kendaraan | id_kendaraan, plat_nomor, jenis_kendaraan, warna, pemilik, id_user (pemilik akun) |
| `tb_area_parkir` | Area Parkir | id_area, nama_area, kapasitas, terisi |
| `tb_tarif` | Tarif | id_tarif, jenis_kendaraan, tarif_per_jam |
| `tb_transaksi` | Transaksi Parkir | id_parkir, id_kendaraan, waktu_masuk, waktu_keluar, id_tarif, durasi_jam, biaya_total, denda, status, id_user (petugas), id_area, id_booking, metode_bayar, status_pembayaran |
| `tb_booking` | Booking | id_booking, id_user, id_kendaraan, id_area, id_tarif, tanggal_rencana, jam_rencana_masuk, jam_rencana_keluar, kode_booking, status, catatan |
| `tb_pengaturan_denda` | Pengaturan Denda | id_pengaturan (selalu 1 baris), denda_per_jam, toleransi_menit, aktif |
| `tb_log_aktivitas` | Log Aktivitas | id_log, id_user, aktivitas, waktu_aktivitas |
| `tb_permintaan_aktivasi` | Permintaan Aktivasi Akun | id_permintaan, username, id_user, catatan, status, catatan_admin, diproses_oleh, diproses_pada |
| `komentars` | Komentar/Ulasan | nama, teks, rating, balasan, dibalas_pada |

**Relasi kunci:** Satu User (petugas) memiliki banyak Kendaraan yang didaftarkan & banyak Transaksi. Satu Kendaraan memiliki banyak riwayat Transaksi. Satu Booking terhubung ke satu User (pelanggan), satu Kendaraan, satu Area, satu Tarif, dan opsional satu Transaksi hasil realisasinya.

---

## 7. Alur & Fitur Utama (Functional Requirements)

### 7.1 Autentikasi & Manajemen Akun
- Registrasi & login menggunakan username + password.
- Login alternatif dengan **passkey**.
- Setiap user dapat mengunggah/menghapus foto profil sendiri (disimpan di Cloudinary).
- Role ditentukan saat pembuatan akun oleh admin (untuk admin/petugas/owner) atau melalui registrasi mandiri (pelanggan).
- **Nonaktivasi & aktivasi ulang akun**: akun dengan `status_aktif = false` tidak bisa login; pemilik akun dapat mengajukan **Permintaan Aktivasi** (tanpa login) berisi catatan alasan, yang ditinjau admin (setuju/tolak beserta catatan admin).

### 7.2 Manajemen Data Master (Admin)
- **User Management**: CRUD user lengkap dengan role dan status aktif.
- **Tarif**: CRUD tarif per jenis kendaraan (tarif per jam).
- **Area Parkir**: CRUD area dengan kapasitas dan jumlah slot terisi (read-only untuk petugas/pelanggan sebagai referensi dropdown).
- **Kendaraan**: admin dapat mengedit/menghapus data kendaraan; index & pendaftaran kendaraan baru juga dapat dilakukan petugas.
- **Pengaturan Denda**: admin mengatur `denda_per_jam`, `toleransi_menit` (grace period), dan status `aktif` untuk fitur denda keterlambatan booking. Petugas hanya bisa melihat (untuk estimasi denda saat kendaraan keluar).
- **Log Aktivitas**: admin dapat melihat seluruh rekam jejak aktivitas sistem (login, transaksi, perubahan status booking, dsb).
- **Komentar/Ulasan**: admin dapat membalas komentar publik dari pengunjung/pelanggan di landing page.

### 7.3 Operasional Parkir (Petugas)
- **Kendaraan Masuk**: petugas mencatat kendaraan masuk (plat nomor, jenis, area, tarif), sistem menandai `status = masuk` dan slot area (`terisi`) bertambah.
- **Kendaraan Keluar**: petugas memproses kendaraan keluar; sistem otomatis:
  - Menghitung durasi parkir (dibulatkan ke atas per jam, minimal 1 jam) melalui fungsi database `fn_hitung_biaya_parkir`.
  - Menghitung **denda keterlambatan** bila transaksi berasal dari booking dan waktu keluar aktual melewati `jam_rencana_keluar` + toleransi (dikonfigurasi admin). Jika fitur denda nonaktif atau bukan dari booking, denda = 0.
  - Menandai `status = keluar` pada transaksi dan booking terkait menjadi `selesai`.
- **Cari Kendaraan / Booking**: petugas dapat mencari kendaraan sedang parkir berdasarkan plat nomor, atau mencari booking berdasarkan kode booking untuk realisasi kedatangan.
- **Transaksi & Struk**: daftar transaksi, transaksi kendaraan yang sedang di dalam area, dan cetak struk digital per transaksi.
- **Pembayaran QRIS**: petugas menampilkan QRIS statis ke pelanggan lalu **mengonfirmasi manual** setelah memastikan dana diterima (tidak ada webhook otomatis) — status pembayaran berubah menjadi `lunas`.
- **Rekap Harian**: petugas/admin dapat melihat rekap transaksi harian.

### 7.4 Booking Online (Pelanggan)
- Pelanggan mendaftarkan kendaraan miliknya sendiri (`kendaraan-saya`).
- Pelanggan membuat booking: pilih kendaraan, area, tarif, tanggal & jam rencana masuk (wajib), jam rencana keluar (opsional), catatan.
- **Validasi bisnis**:
  - Kendaraan yang dibooking harus milik akun yang login.
  - Kendaraan yang sedang berstatus "masuk" (belum keluar) tidak boleh dibooking ulang.
  - Tanggal rencana tidak boleh di masa lalu; jam keluar (jika diisi) harus setelah jam masuk.
- Sistem menghasilkan **kode booking unik** (format `BKG-XXXXXX`) yang dapat dipindai/dicari petugas saat kedatangan (mendukung scan QR).
- **Status booking**: `menunggu` → `dikonfirmasi` (oleh petugas/admin) atau `ditolak` → `selesai` (setelah kendaraan keluar) / `dibatalkan` (oleh pelanggan) / `kadaluarsa` (otomatis).
- **Auto-expire**: booking berstatus `menunggu`/`dikonfirmasi` yang jam rencana masuknya sudah lewat lebih dari 60 menit tanpa realisasi otomatis ditandai `kadaluarsa`, dijalankan oleh scheduled command `ExpireBookings` (dan juga dicek ulang setiap kali endpoint index/booking-saya diakses, agar tetap akurat meski scheduler tidak aktif).
- Pelanggan dapat **membatalkan** booking selama belum direalisasikan (kendaraan belum tercatat masuk secara aktual).
- Pelanggan (dan admin/petugas untuk cakupan datanya) dapat **menghapus riwayat booking** yang sudah selesai/dibatalkan/kadaluarsa — baik semua sekaligus maupun pilihan tertentu.

### 7.5 Dashboard & Pelaporan (Owner)
- Dashboard ringkasan operasional.
- Rekap transaksi berdasarkan rentang waktu yang diminta.
- Grafik ringkasan (visualisasi pendapatan/volume transaksi menggunakan Recharts).

### 7.6 Halaman Publik
- **Landing Page**: menampilkan ringkasan statistik publik (`/statistik/ringkasan`) dan rekap harian publik.
- **Komentar/Ulasan Publik**: pengunjung dapat mengirim komentar & rating tanpa login; admin membalas.
- **Bantuan**: halaman panduan/FAQ.

---

## 8. Aturan Bisnis Kunci

1. **Perhitungan Biaya Parkir**: durasi dihitung dalam jam, dibulatkan ke atas (`ceil`), minimum 1 jam meski durasi aktual kurang dari 1 jam. Biaya = fungsi `fn_hitung_biaya_parkir(waktu_masuk, waktu_keluar, tarif_per_jam)` di level database.
2. **Perhitungan Denda Keterlambatan Booking**:
   - Hanya berlaku untuk transaksi yang berasal dari booking dengan `jam_rencana_keluar` terisi.
   - Tidak berlaku jika pengaturan denda dinonaktifkan admin atau `denda_per_jam` ≤ 0.
   - Keterlambatan = (waktu keluar aktual − rencana keluar) − toleransi menit.
   - Jika hasil ≤ 0 → denda 0. Jika > 0, dibulatkan ke atas per jam, dikalikan `denda_per_jam`.
3. **Kapasitas Area Parkir**: area dianggap penuh jika `terisi >= kapasitas`; sisa slot = `max(0, kapasitas - terisi)`.
4. **Pembatalan Booking**: hanya diizinkan bila status masih `menunggu`/`dikonfirmasi` **dan** kendaraan belum benar-benar tercatat masuk ke area (status transaksi terkait bukan `masuk`).
5. **Pemisahan Tanggung Jawab Data**: petugas dapat melihat & menambah kendaraan tapi tidak dapat mengubah/menghapus (khusus admin); tarif & area parkir hanya dapat diubah admin, meski dapat dibaca petugas/pelanggan.
6. **Autentikasi berbasis Bearer Token** (Sanctum) untuk seluruh endpoint privat; endpoint publik (login, register, komentar publik, statistik publik, permintaan aktivasi) tidak memerlukan token.

---

## 9. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Keamanan** | Autentikasi token (Sanctum), password di-hash otomatis, role-based access control di level middleware backend & route guard frontend, validasi kepemilikan data (mis. kendaraan/booking milik user sendiri) dilakukan di server, bukan hanya UI. |
| **CORS** | Origin frontend diizinkan secara eksplisit lewat `FRONTEND_URL` dan `SANCTUM_STATEFUL_DOMAINS`, dikonfigurasi terpisah untuk environment development & production. |
| **Ketersediaan Data** | Auto-expire booking berjalan baik lewat scheduler (`schedule:work`/cron) maupun fallback pengecekan on-demand saat endpoint diakses, agar konsisten meski scheduler tidak aktif (mis. pada lingkungan development). |
| **Auditability** | Seluruh aktivitas penting (login, transaksi, perubahan status booking, aksi admin) dicatat di `tb_log_aktivitas`. |
| **Skalabilitas Database** | Mendukung SQLite (default, cocok untuk demo/skala kecil) dan MySQL (untuk produksi berskala lebih besar) tanpa perubahan kode aplikasi. |
| **Deployment** | Frontend & backend independen dan dapat di-deploy/scale terpisah (Vercel + Railway), berkomunikasi lewat REST API murni. |
| **Testing** | Backend dilengkapi PHPUnit untuk pengujian unit/feature. |

---

## 10. Ruang Lingkup Endpoint API (Ringkasan)

| Kategori | Endpoint Kunci | Role |
|---|---|---|
| Auth | `POST /register`, `POST /login`, `POST /login-passkey`, `POST /logout`, `GET /me` | Publik / Semua login |
| Profil | `POST /profile/foto`, `DELETE /profile/foto` | Semua login |
| User | `apiResource /users` | Admin |
| Tarif | `GET /tarif`, `apiResource /tarif` (create/update/delete) | Admin, Petugas, Pelanggan (read) / Admin (write) |
| Area Parkir | `GET /area-parkir`, `apiResource /area-parkir` (write) | Admin (write), Admin/Petugas/Pelanggan (read) |
| Kendaraan | `GET/POST /kendaraan`, `GET /kendaraan/cari/{plat}`, `apiResource` (update/delete) | Admin, Petugas |
| Kendaraan Pelanggan | `GET/POST /kendaraan-saya` | Pelanggan |
| Transaksi | `POST /transaksi/masuk`, `POST /transaksi/{id}/keluar`, `GET /transaksi/{id}/struk`, `GET /transaksi`, `GET /transaksi/sedang-parkir`, `GET /transaksi/cari-booking/{kode}` | Petugas |
| Pembayaran | `POST /transaksi/{id}/konfirmasi-qris` | Petugas |
| Rekap | `GET /transaksi/rekap-harian`, `GET /rekap-transaksi` | Admin / Owner |
| Booking | `GET/POST /booking`, `DELETE /booking/{id}`, `POST /booking/{id}/konfirmasi`, `POST /booking/{id}/tolak`, `GET /booking/saya`, `GET /booking/cari/{kode}` | Pelanggan / Admin+Petugas |
| Riwayat Booking | `DELETE /booking/riwayat/semua`, `DELETE /booking/riwayat/pilih` | Semua login (scoped) |
| Pengaturan Denda | `GET/PUT /pengaturan-denda` | Admin (write), Petugas (read) |
| Log Aktivitas | `GET /log-aktivitas` | Admin |
| Permintaan Aktivasi | `POST /permintaan-aktivasi` (publik), `GET`, `POST /{id}/setujui`, `POST /{id}/tolak` | Publik (create) / Admin (kelola) |
| Komentar | `GET/POST /komentar`, `POST /komentar/{id}/balas`, `DELETE /komentar/{id}` | Publik (create/read), Admin (balas/hapus) |
| Statistik Publik | `GET /statistik/ringkasan`, `GET /transaksi/rekap-harian-publik` | Publik |

---

## 11. Peta Halaman Frontend

| Path | Role | Deskripsi |
|---|---|---|
| `/` | Publik | Landing page |
| `/login`, `/register` | Publik | Autentikasi |
| `/bantuan` | Publik | Bantuan/FAQ |
| `/admin`, `/admin/users`, `/admin/tarif`, `/admin/pengaturan-denda`, `/admin/area`, `/admin/kendaraan`, `/admin/log`, `/admin/komentar`, `/admin/permintaan-aktivasi` | Admin | Dashboard & manajemen data master |
| `/petugas`, `/petugas/kendaraan`, `/petugas/masuk`, `/petugas/keluar`, `/petugas/transaksi`, `/petugas/booking` | Petugas (booking juga Admin) | Operasional lapangan |
| `/pelanggan`, `/pelanggan/riwayat` | Pelanggan | Booking & riwayat |
| `/owner`, `/owner/rekap` | Owner | Dashboard & rekap |

---

## 12. Asumsi & Batasan yang Teridentifikasi dari Kode

- Pembayaran QRIS bersifat **statis** (gambar QR tetap, bukan generate dinamis dari payment gateway), sehingga pelunasan bergantung pada **konfirmasi manual petugas** — bukan notifikasi otomatis real-time dari Midtrans/DANA meskipun dependency library tersedia.
- Kredensial sandbox Midtrans/DANA (`DANA_*`) ada di environment tapi flow produksi (webhook, verifikasi tanda tangan) belum diimplementasikan di controller yang ditemukan.
- Sistem satu lokasi (single-tenant) — tidak ada struktur data untuk multi-cabang/multi-pemilik usaha.
- Toleransi auto-expire booking (60 menit) di-hardcode di `BookingController`, terpisah dari `toleransi_menit` pada Pengaturan Denda (yang khusus untuk denda keterlambatan **keluar**, bukan keterlambatan **kedatangan**).

---

## 13. Lampiran: Daftar Fitur Ringkas (dari README Proyek)

| Fitur | Deskripsi |
|---|---|
| 🔐 Autentikasi | Login & Register dengan Laravel Sanctum, role-based access via middleware `CheckRole` |
| 🅿️ Area Parkir | Manajemen lengkap area & slot parkir |
| 🚗 Kendaraan | Pencatatan data kendaraan masuk & keluar |
| 📅 Booking | Booking slot parkir untuk pelanggan dengan auto-expire (`ExpireBookings`) |
| 💳 Transaksi | Transaksi parkir & struk digital |
| 💰 Pembayaran QRIS | Pembayaran via DANA/Midtrans (sandbox), konfirmasi manual |
| 💵 Tarif | Manajemen tarif parkir |
| 👥 User Management | Manajemen user & hak akses |
| 📝 Log Aktivitas | Rekam jejak aktivitas pengguna |
| 📊 Dashboard & Rekap | Laporan khusus untuk Owner |

---

*Dokumen ini disusun berdasarkan analisis langsung terhadap kode sumber (model, migrasi, controller, rute API, dan struktur halaman frontend) pada arsip proyek yang diunggah, dilengkapi konteks dari `readme.md` proyek.*
