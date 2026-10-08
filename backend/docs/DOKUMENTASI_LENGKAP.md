# Dokumentasi Lengkap Aplikasi Parkir UKK

## 1. Ringkasan Proyek

**Aplikasi Parkir UKK** adalah sistem manajemen parkir berbasis web yang mendigitalisasi pencatatan kendaraan masuk/keluar, booking slot parkir online, manajemen area dan tarif, perhitungan biaya serta denda, dan pencatatan pembayaran QRIS.

Arsitektur:
```
Browser → React 19 SPA → Axios HTTP → Laravel 12 REST API → Eloquent ORM → MySQL/SQLite
```

Laravel juga menyajikan hasil build React. Semua URL non-API (seperti `/admin`, `/petugas/masuk`) diproses oleh `routes/web.php` yang menampilkan shell Blade `app.blade.php`, kemudian React Router memilih halaman. Ini memungkinkan refresh URL tetap berfungsi.

## 2. Teknologi yang Digunakan

| Komponen | Teknologi | Peran |
|----------|-----------|-------|
| Backend | PHP 8.2+, Laravel 12 | REST API, validasi, ORM Eloquent, scheduler job |
| Frontend | React 19, React Router 7 | Single Page Application dengan routing halaman per role |
| Build Tool | Vite 7, Laravel Vite Plugin | Development mode hot-reload dan bundling production |
| Styling | Bootstrap 5, Tailwind CSS 4, Lucide React | Komponen UI, utilitas CSS, ikon vektor |
| API Client | Axios | HTTP request dengan interceptor token otomatis |
| Autentikasi | Laravel Sanctum | Personal access token dan Bearer token |
| Pembayaran | Midtrans Snap, QRIS statis | Gateway pembayaran digital dan QR code statis |
| Media | Cloudinary | Upload/delete foto profil pengguna |
| Fitur tambahan | html5-qrcode, qrcode, recharts | Scan QR, generate QR code, chart interaktif |

## 3. Role Pengguna dan Hak Akses

| Role | Deskripsi | Hak akses utama |
|------|-----------|-----------------|
| `admin` | Pengelola sistem | User, tarif, area parkir, kendaraan, pengaturan denda, komentar, log aktivitas, permintaan aktivasi |
| `petugas` | Operator lapangan | Check-in/out kendaraan, transaksi, pembayaran, booking masuk, kendaraan baru |
| `owner` | Pemilik usaha | Dashboard monitoring, grafik, rekap transaksi per periode |
| `pelanggan` | Pengunjung parkir | Daftar kendaraan pribadi, booking slot, pembatalan, riwayat booking |

Pembatasan akses diterapkan di dua lapisan:
- **Frontend:** `ProtectedRoute.jsx` mencegah navigasi halaman yang tidak diizinkan
- **Backend:** Middleware `CheckRole.php` memvalidasi otorisasi API setiap request

Backend adalah source of truth keamanan yang wajib dipercaya.

## 4. Cara Kerja Sistem

### 4.1 Alur Autentikasi dan Sesi

1. **Registrasi:** User baru mengirim data ke `POST /api/register` (publik, tanpa login)
   - Role selalu dipaksa menjadi `pelanggan` di backend
   - Role admin/owner/petugas hanya bisa dibuat admin melalui halaman User management
   - Backend mengembalikan token Sanctum dan passkey yang dirotasi

2. **Login:** User mengirim username & password ke `POST /api/login`
   - Backend memverifikasi password, cek status akun aktif
   - Mengeluarkan token Sanctum baru dan generate passkey baru
   - Mencatat ke `tb_log_aktivitas`

3. **Sesi Client:** React menyimpan token & data user di `sessionStorage`
   - `sessionStorage` otomatis dihapus saat tab/browser ditutup
   - User wajib login ulang di sesi browser berikutnya

4. **Request API:** `api/axios.js` menambahkan `Authorization: Bearer <token>` otomatis
   - Setiap response dengan status 401 menghapus sesi dan redirect ke `/login`

5. **Passkey Auto-login:** Token passkey dapat dipakai untuk `POST /api/login-passkey`
   - Passkey dirotasi setiap kali digunakan (security best practice)
   - Frontend dapat menyimpan di localStorage untuk auto-login

6. **Profil:** Semua role yang login dapat upload/delete foto profil melalui Cloudinary

### 4.2 Alur Kendaraan Masuk

1. Petugas membuka halaman **Kendaraan Masuk**
2. Mencari kendaraan berdasarkan plat nomor atau menambahkan kendaraan baru
3. Memilih area parkir (backend cek apakah area masih punya slot kosong)
4. Memilih tarif sesuai jenis kendaraan
5. Backend membuat record `tb_transaksi` dengan:
   - Status: `masuk`
   - `waktu_masuk`: waktu sekarang
   - Menambah counter `terisi` pada area
6. Sistem menampilkan karcis masuk (nama kendaraan, area, jam masuk, plat, dll)
7. Karcis dapat dicetak atau disimpan sebagai bukti

### 4.3 Alur Kendaraan Keluar, Biaya, dan Denda

1. Petugas membuka halaman **Kendaraan Keluar**
2. Mencari transaksi aktif (status `masuk`)
3. Klik tombol "Proses Keluar" pada transaksi yang dipilih
4. Backend menghitung:
   - **Durasi parkir:** `waktu_keluar - waktu_masuk`
   - **Biaya parkir:** tarif per jam × durasi
   - **Denda keterlambatan** (jika ada booking): 
     - Jika durasi > jam rencana keluar, hitung denda per jam sesuai `tb_pengaturan_denda`
   - **Total:** biaya + denda
5. Petugas memilih metode pembayaran: tunai, transfer, atau QRIS
6. Backend:
   - Menyimpan `status_pembayaran`, `metode_bayar`, `denda`, `biaya_total`
   - Mengubah status transaksi menjadi `keluar`
   - Mengurangi counter `terisi` pada area
   - Jika ada booking terkait, mengubah booking status menjadi `selesai`
7. Sistem menampilkan struk (detail transaksi, biaya, denda, total, metode bayar)
8. Struk dapat dicetak atau disimpan

### 4.4 Alur Booking Parkir Online

1. **Pelanggan membuat booking:**
   - Daftar/pilih kendaraan pribadi
   - Pilih area dan tarif
   - Pilih tanggal rencana masuk dan keluar (bisa multi-hari)
   - Atur jam rencana masuk dan jam rencana keluar
   - Backend membuat kode booking unik (contoh: `BKG-7F3K9A`)
   - Status booking: `menunggu`

2. **Admin/Petugas mengelola booking:**
   - Lihat daftar booking masuk dengan filter status
   - Konfirmasi booking → status menjadi `dikonfirmasi`
   - Tolak booking → status menjadi `ditolak` (pelanggan bisa booking ulang)

3. **Saat kendaraan datang:**
   - Petugas cari kode booking di halaman **Kendaraan Masuk**
   - Pilih booking yang sesuai
   - Sistem otomatis hubungkan booking ke transaksi masuk

4. **Pembatalan booking:**
   - Pelanggan dapat membatalkan booking yang statusnya `menunggu`/`dikonfirmasi`
   - HANYA jika kendaraan belum tercatat masuk di area
   - Status menjadi `dibatalkan`

5. **Kadaluarsa booking:**
   - Booking `menunggu`/`dikonfirmasi` yang waktu rencana masuknya sudah lewat lebih dari toleransi (60 menit) otomatis menjadi `kadaluarsa`
   - Pemeriksaan dilakukan:
     - Saat halaman booking dibuka
     - Via command `php artisan booking:expire` setiap 15 menit (perlu scheduler aktif)

6. **Riwayat booking:**
   - Booking `selesai`, `dibatalkan`, dan `kadaluarsa` bisa dihapus oleh pelanggan
   - Dapat dihapus satu per satu atau sekaligus

### 4.5 Alur Pembayaran QRIS

Sistem menyediakan dua mekanisme QRIS:

#### **Mekanisme 1: QRIS Statis (Manual)**
- Frontend menampilkan gambar QRIS statis (`public/qris-statis.jpeg`)
- Pelanggan memindai QRIS menggunakan e-wallet (GCash, Dana, dsb)
- Pembayaran terkirim ke rekening penerima
- Petugas memverifikasi pembayaran telah masuk (cek notifikasi bank/e-wallet)
- Petugas klik tombol "Sudah Dibayar" di modal QRIS
- Endpoint `POST /api/transaksi/{id}/konfirmasi-qris` dijalankan
- Status pembayaran berubah menjadi `lunas` (manual)

#### **Mekanisme 2: Midtrans Snap (Gateway)**
- Untuk transaksi `metode_bayar=qris`, petugas dapat membuat Snap token
- Endpoint `POST /api/transaksi/{id}/generate-midtrans-token` dipanggil
- Backend `MidtransService` membuat Snap Token via Midtrans SDK
- Frontend menampilkan Snap modal
- Pelanggan memilih metode pembayaran (QRIS, DANA, kartu kredit, dsb)
- Setelah transaksi:
  - Midtrans mengirim callback ke endpoint publik `POST /api/transaksi/midtrans-callback`
  - Backend `TransaksiController::midtransCallback` menerima notifikasi
  - Status `settlement` atau `capture` → pembayaran `lunas`
  - Status `pending`, `deny`, `expire`, `cancel` → pembayaran `menunggu`
  - Fraud detection juga ditangani

**Penting untuk Midtrans:**
- Endpoint webhook harus accessible dari internet (HTTPS publik)
- Kredensial Midtrans (server key, client key) di `.env`
- Client key boleh di-build ke frontend (`VITE_MIDTRANS_CLIENT_KEY`)
- Server key **WAJIB** hanya di backend `.env`
- Mode production diatur via `MIDTRANS_IS_PRODUCTION`

### 4.6 Fitur Pendukung

#### **Log Aktivitas**
- Setiap aksi penting dicatat ke `tb_log_aktivitas` via `LogAktivitas::catat($id_user, $deskripsi)`
- Admin dapat melihat daftar audit lengkap

#### **Komentar dan Rating**
- Publik dapat mengirim komentar/rating di halaman landing
- Admin dapat membalas dan menghapus komentar

#### **Aktivasi Ulang Akun**
- Akun nonaktif dapat mengajukan permintaan aktivasi ulang via `POST /api/permintaan-aktivasi` (publik, tanpa login)
- Admin menerima daftar permintaan di halaman **Permintaan Aktivasi**
- Admin dapat menyetujui (akun kembali aktif) atau menolak

## 5. API Endpoints (Ringkasan)

Semua endpoint memiliki prefix `/api`. Endpoint tanpa tanda khusus memerlukan Bearer token.

### Publik (Tanpa Token)
- `POST /register` - Registrasi pelanggan
- `POST /login` - Login semua role
- `POST /login-passkey` - Auto-login dengan passkey
- `GET /config` - Konfigurasi frontend (Midtrans client key, dsb)
- `GET /komentar` - Lihat komentar publik
- `POST /komentar` - Tambah komentar
- `DELETE /komentar/{id}` - Hapus komentar sendiri
- `GET /statistik/ringkasan` - Statistik umum
- `GET /transaksi/rekap-harian-publik` - Rekap transaksi harian publik
- `POST /permintaan-aktivasi` - Ajukan aktivasi ulang
- `POST /transaksi/midtrans-callback` - Webhook Midtrans

### Sesi (Dengan Token)
- `POST /logout` - Logout
- `GET /me` - Data user login saat ini
- `POST /profile/foto` - Upload foto profil
- `DELETE /profile/foto` - Hapus foto profil

### Data Referensi (Admin/Petugas/Pelanggan)
- `GET /tarif` - Lihat daftar tarif
- `GET /tarif/{id}` - Detail tarif
- `GET /area-parkir` - Lihat daftar area
- `GET /area-parkir/{id}` - Detail area
- `GET /pengaturan-denda` - Lihat pengaturan denda

### Kendaraan
- `GET /kendaraan` - Daftar kendaraan (admin/petugas)
- `POST /kendaraan` - Tambah kendaraan (admin/petugas)
- `GET /kendaraan/{id}` - Detail kendaraan
- `PUT /kendaraan/{id}` - Update kendaraan (admin saja)
- `DELETE /kendaraan/{id}` - Hapus kendaraan (admin saja)
- `GET /kendaraan/cari/{plat}` - Cari kendaraan by plat nomor
- `GET /kendaraan-saya` - Kendaraan milik pelanggan
- `POST /kendaraan-saya` - Daftar kendaraan baru (pelanggan)

### Transaksi
- `GET /transaksi` - Daftar transaksi
- `POST /transaksi` - Buat transaksi (kendaraan masuk)
- `GET /transaksi/kendaraan-didalam` - Daftar kendaraan masuk
- `GET /transaksi/sedang-parkir` - Daftar kendaraan sedang parkir
- `PUT /transaksi/{id}` - Update transaksi (kendaraan keluar)
- `GET /transaksi/{id}/cetak-karcis` - Cetak karcis
- `GET /transaksi/{id}/cetak-struk` - Cetak struk
- `GET /transaksi/rekap-harian` - Rekap harian (admin/petugas/owner)
- `GET /transaksi/cari-booking/{kode_booking}` - Cari booking saat check-in
- `POST /transaksi/{id}/konfirmasi-qris` - Konfirmasi QRIS statis
- `POST /transaksi/{id}/generate-midtrans-token` - Buat Snap token
- `GET /rekap-transaksi` - Rekap periode (owner)

### Booking
- `GET /booking/saya` - Booking milik pelanggan login
- `POST /booking` - Buat booking (pelanggan)
- `DELETE /booking/{id}` - Batalkan booking (pelanggan)
- `GET /booking` - Daftar booking semua (admin/petugas)
- `GET /booking/cari/{kode_booking}` - Cari booking by kode
- `POST /booking/{id}/konfirmasi` - Konfirmasi booking
- `POST /booking/{id}/tolak` - Tolak booking
- `DELETE /booking/riwayat/semua` - Hapus seluruh riwayat booking
- `DELETE /booking/riwayat/pilih` - Hapus riwayat terpilih

### Admin Only
- `GET /users` - Daftar user
- `POST /users` - Tambah user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Hapus user
- `GET /tarif` (create/update/delete) - Kelola tarif
- `GET /area-parkir` (create/update/delete) - Kelola area
- `PUT /pengaturan-denda` - Update pengaturan denda
- `GET /log-aktivitas` - Lihat log aktivitas
- `POST /komentar/{id}/balas` - Balas komentar
- `GET /permintaan-aktivasi` - Daftar permintaan
- `POST /permintaan-aktivasi/{id}/setujui` - Setujui aktivasi
- `POST /permintaan-aktivasi/{id}/tolak` - Tolak aktivasi

Untuk daftar endpoint dan middleware yang paling akurat, lihat file `routes/api.php`.

## 6. Database

Tabel bisnis utama memakai prefiks `tb_`. Berikut tabel-tabel kunci:

| Tabel | Fungsi |
|-------|--------|
| `tb_user` | Pengguna aplikasi: nama, username, telepon, password (hash), role, status aktif, foto profil, passkey, waktu dibuat |
| `tb_area_parkir` | Area parkir: nama, kapasitas slot, jumlah slot terisi |
| `tb_kendaraan` | Data kendaraan: plat nomor, jenis, warna, pemilik, user yang memasukkan data |
| `tb_tarif` | Tarif per jenis kendaraan (motor, mobil, etc): nama, jenis, tarif per jam |
| `tb_transaksi` | Pusat catatan parkir: kendaraan, area, tarif, user (petugas), booking (opsional), waktu masuk/keluar, biaya, denda, status pembayaran, metode bayar, data Midtrans |
| `tb_booking` | Rencana parkir: user, kendaraan, area, tarif, kode booking, tanggal rencana masuk/keluar, jam rencana, status, catatan |
| `tb_pengaturan_denda` | Aturan denda: nominal per jam keterlambatan, tipe perhitungan |
| `tb_log_aktivitas` | Audit: user, deskripsi aktivitas, waktu |
| `tb_permintaan_aktivasi` | Permintaan aktivasi ulang: user, alasan, status, waktu |
| `komentars` | Komentar publik: nama, teks, rating, balasan admin, waktu balasan |
| `personal_access_tokens` | Token API Sanctum Laravel |

Tabel bawaan Laravel seperti `users`, `sessions`, `cache`, `jobs` juga ada dari migration standar, tetapi data bisnis aplikasi menggunakan `tb_user` bukan tabel `users`.

## 7. Instalasi dan Menjalankan

### Prasyarat
- PHP 8.2+, Composer
- Node.js 16+, npm
- MySQL 5.7+ / MariaDB atau SQLite
- Akun Midtrans (opsional, untuk Snap)
- Akun Cloudinary (opsional, untuk upload foto)

### Instalasi Lokal

```powershell
# Clone / extract project
cd "app parkir"

# Install dependency
composer install
npm install

# Setup environment
Copy-Item .env.example .env   # hanya jika .env belum ada
php artisan key:generate

# Jalankan migrasi dan seed akun default
php artisan migrate --seed

# Jalankan development server
npm run dev
php artisan serve

# Akses aplikasi di http://localhost:8000
```

**Akun default hasil seed:**

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| owner | owner123 | owner |
| petugas | petugas123 | petugas |
| pelanggan | pelanggan123 | pelanggan |

**Ganti/hapus akun contoh sebelum deployment produksi.**

### Shortcut: Composer Script

```powershell
composer run setup     # Install, key, migrate, build aset
composer run dev       # Jalankan semua service bersamaan (Laravel, queue, logs, Vite)
composer run test      # Jalankan PHPUnit
```

### Memakai Dump Database

```bash
# Import dump ke MySQL
mysql -u root -p database_name < db_parkir.sql

# Update .env dengan koneksi database
# DB_HOST=localhost
# DB_DATABASE=database_name
# DB_USERNAME=root
# DB_PASSWORD=...

# JANGAN jalankan migrate:fresh (akan menghapus semua tabel)
# Hanya jalankan jika ada migration baru yang belum dijalankan:
php artisan migrate
```

### Build untuk Produksi

```powershell
npm run build
php artisan config:cache
php artisan view:cache
php artisan route:cache
```

### Scheduler (Penting untuk Kadaluarsa Booking)

Atur cron job / task scheduler server untuk menjalankan **setiap menit:**

```bash
* * * * * php /path/to/app/artisan schedule:run >> /dev/null 2>&1
```

Laravel akan menjalankan `booking:expire` setiap 15 menit sesuai `routes/console.php`.

## 8. Variabel Environment Penting

Jangan commit atau bagikan `.env` beserta value-nya. Setidaknya periksa:

| Variabel | Kegunaan |
|----------|----------|
| `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL` | Konfigurasi inti Laravel |
| `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Koneksi database |
| `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION` | Driver session, cache, queue |
| `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL` | Domain frontend dan CORS |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` | Integrasi Midtrans (server key WAJIB rahasia) |
| `VITE_MIDTRANS_CLIENT_KEY`, `VITE_API_URL` | Konfigurasi build frontend (boleh di-build) |
| `CLOUDINARY_URL` atau `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` | Upload Cloudinary |

## 9. Struktur Proyek - Penjelasan File dan Folder

### Root Directory

| Path | Isi dan Fungsi |
|------|--------|
| `app/` | Kode backend Laravel khusus aplikasi |
| `bootstrap/` | Bootstrap aplikasi, cache discovery Laravel |
| `config/` | Konfigurasi Laravel dan integrasi layanan |
| `database/` | Migration, seeder, factory, file SQLite lokal |
| `docs/` | Dokumentasi proyek |
| `node_modules/` | Dependency npm (jangan diedit manual) |
| `public/` | Web root: entry point, aset statis, build Vite output |
| `resources/` | Source React, Blade template, aset bahan baku |
| `routes/` | Definisi HTTP route dan scheduler/command |
| `scripts/` | Skrip helper (misal verifikasi Midtrans) |
| `storage/` | Log, cache, file runtime Laravel |
| `tests/` | Kerangka test PHPUnit |
| `vendor/` | Dependency Composer (jangan diedit manual) |
| `.env` | Konfigurasi lokal dan rahasia (JANGAN COMMIT) |
| `.editorconfig` | Standar indentasi dan format editor |
| `artisan` | CLI Laravel untuk menjalankan command |
| `composer.json` / `composer.lock` | Manifest dan versi terkunci dependency PHP |
| `package.json` / `package-lock.json` | Manifest dan versi terkunci dependency JavaScript |
| `vite.config.js` | Konfigurasi Vite untuk build React dan Tailwind |
| `phpunit.xml` | Konfigurasi PHPUnit testing |
| `readme.md` | README awal proyek |
| `db_parkir.sql` | Dump database untuk restore |
| File lain (`fix_qris.py`, `ModalQris*.txt`, `patch.txt`) | Artefak bantu implementasi fitur, bukan runtime |

### Folder `app/` - Backend Laravel

| File | Fungsi |
|------|--------|
| `Console/Commands/ExpireBookings.php` | Command `booking:expire` untuk tandai booking kadaluarsa |
| `Http/Controllers/Controller.php` | Base controller Laravel |
| `Http/Controllers/AuthController.php` | Register, login, passkey, logout, profil, konfigurasi |
| `Http/Controllers/AreaParkirController.php` | CRUD area parkir |
| `Http/Controllers/BookingController.php` | Booking, konfirmasi, pembatalan, riwayat, kadaluarsa |
| `Http/Controllers/KendaraanController.php` | CRUD/cari kendaraan, kendaraan pelanggan |
| `Http/Controllers/KomentarController.php` | CRUD komentar, balas, rating |
| `Http/Controllers/LogAktivitasController.php` | Daftar audit aktivitas |
| `Http/Controllers/PembayaranController.php` | Konfirmasi QRIS statis manual |
| `Http/Controllers/PengaturanDendaController.php` | Baca dan update pengaturan denda |
| `Http/Controllers/PermintaanAktivasiController.php` | Kelola permintaan aktivasi akun |
| `Http/Controllers/StatistikController.php` | Statistik ringkas publik |
| `Http/Controllers/TarifController.php` | CRUD tarif parkir |
| `Http/Controllers/TransaksiController.php` | Transaksi masuk/keluar, biaya, denda, karcis, struk, rekap, Midtrans |
| `Http/Controllers/UserController.php` | CRUD user oleh admin |
| `Http/Middleware/CheckRole.php` | Validasi role pada API endpoint |
| `Models/AreaParkir.php` | Model area, relasi, helper slot kosong |
| `Models/Booking.php` | Model booking, relasi, generator kode, aturan pembatalan |
| `Models/Kendaraan.php` | Model kendaraan dan relasi |
| `Models/Komentar.php` | Model komentar/rating |
| `Models/LogAktivitas.php` | Model dan helper log aktivitas |
| `Models/PengaturanDenda.php` | Model pengaturan denda |
| `Models/PermintaanAktivasi.php` | Model permintaan aktivasi |
| `Models/Tarif.php` | Model tarif |
| `Models/Transaksi.php` | Model transaksi, kalkulasi biaya dan denda |
| `Models/User.php` | Model user, token Sanctum, helper role, URL foto profil |
| `Providers/AppServiceProvider.php` | Provider untuk binding/konfigurasi service |
| `Services/MidtransService.php` | Service Midtrans: Snap token, notification handling |

### Folder `database/` - Migration dan Seed

| File | Fungsi |
|------|--------|
| `database.sqlite` | File database SQLite lokal (jika digunakan) |
| `factories/UserFactory.php` | Factory untuk generate data test user |
| `seeders/DatabaseSeeder.php` | Entry point seeding |
| `seeders/TbUserSeeder.php` | Membuat 4 akun contoh (admin/owner/petugas/pelanggan) |
| `migrations/0001_01_01_000000_create_users_table.php` | Tabel users, password_reset_tokens, sessions (bawaan Laravel) |
| `migrations/0001_01_01_000001_create_cache_table.php` | Cache dan cache_locks |
| `migrations/0001_01_01_000002_create_jobs_table.php` | Jobs, job_batches, failed_jobs |
| `migrations/2026_07_15_000001_create_tb_user_table.php` | Tabel tb_user aplikasi |
| `migrations/2026_07_15_000002_create_tb_area_parkir_table.php` | Tabel tb_area_parkir |
| `migrations/2026_07_15_000003_create_tb_kendaraan_table.php` | Tabel tb_kendaraan |
| `migrations/2026_07_15_000004_create_tb_tarif_table.php` | Tabel tb_tarif |
| `migrations/2026_07_15_000005_create_tb_transaksi_table.php` | Tabel tb_transaksi |
| `migrations/2026_07_16_000000_add_payment_columns_to_tb_transaksi.php` | Kolom metode dan status pembayaran |
| `migrations/2026_07_20_025603_create_personal_access_tokens_table.php` | Token Sanctum |
| `migrations/2026_07_23_010000_add_db_objects_untuk_parkir.php` | Tambahan objek DB parkir |
| `migrations/2026_07_24_000001_create_tb_booking_table.php` | Tabel tb_booking |
| `migrations/2026_07_24_000002_add_id_booking_to_tb_transaksi_table.php` | Relasi booking ke transaksi |
| `migrations/2026_07_26_120000_create_komentars_table.php` | Tabel komentars |
| `migrations/2026_08_05_010000_add_rating_to_komentars_table.php` | Kolom rating komentar |
| `migrations/2026_08_05_020000_add_balasan_to_komentars_table.php` | Kolom balasan admin |
| `migrations/2026_08_13_000001_create_tb_permintaan_aktivasi_table.php` | Tabel permintaan aktivasi |
| `migrations/2026_08_15_000000_add_foto_profil_to_tb_user_table.php` | Kolom foto profil |
| `migrations/2026_08_15_000001_add_foto_profil_public_id_to_tb_user_table.php` | Public ID Cloudinary |
| `migrations/2026_08_18_000000_add_denda_to_tb_transaksi_table.php` | Kolom denda transaksi |
| `migrations/2026_08_19_001907_create_tb_pengaturan_denda_table.php` | Tabel pengaturan denda |
| `migrations/2026_08_20_000000_add_created_at_to_tb_user_table.php` | Waktu dibuat user |
| `migrations/2026_08_25_000000_drop_qris_ref_id_from_tb_transaksi.php` | Hapus kolom lama QRIS |
| `migrations/2026_08_26_000000_create_tb_log_aktivitas_table.php` | Tabel log aktivitas |
| `migrations/2026_08_27_000000_add_tanggal_rencana_keluar_to_tb_booking.php` | Tanggal keluar booking |
| `migrations/2026_09_18_021136_add_midtrans_fields_to_tb_transaksi.php` | Kolom Midtrans order/token/status |

### Folder `resources/js/` - Frontend React

| File | Fungsi |
|------|--------|
| `app.jsx` | Entry React: mount ke elemen #app, error boundary |
| `AppRoot.jsx` | Definisi route React, semua halaman, provider konteks, layout |
| `bootstrap.js` | Bootstrap JS Laravel |
| `api/axios.js` | Axios instance, baseURL, interceptor token, handler 401 |
| `components/Layout.jsx` | Layout utama: navbar, sidebar, breadcrumb sesuai user |
| `components/ProtectedRoute.jsx` | Guard halaman berdasarkan login status dan role |
| `components/KarcisMasukCard.jsx` | Tampilan karcis masuk untuk cetak |
| `components/StrukCard.jsx` | Tampilan struk keluar untuk cetak |
| `components/ModalQrBooking.jsx` | Modal QR kode booking |
| `components/ModalQris.jsx` | Modal QRIS pembayaran |
| `components/ModalScanQr.jsx` | Modal kamera scan QR |
| `components/ui.jsx` | Komponen UI reusable (button, modal, dsb) |
| `config/theme.config.js` | Token/warna tema aplikasi |
| `context/AuthContext.jsx` | State login, token, user, fungsi login/logout/profil |
| `context/ThemeContext.jsx` | State tema gelap/terang |
| `context/ToastContext.jsx` | Toast notifikasi global |
| `pages/Landing.jsx` | Halaman publik beranda/pengenalan |
| `pages/Bantuan.jsx` | Halaman bantuan/panduan pengguna |
| `pages/Login.jsx` | Form login |
| `pages/Register.jsx` | Form registrasi pelanggan |
| `pages/admin/DashboardAdmin.jsx` | Dashboard admin dengan KPI |
| `pages/admin/AreaParkir.jsx` | Kelola area parkir |
| `pages/admin/Kendaraan.jsx` | Kelola kendaraan |
| `pages/admin/Komentar.jsx` | Moderasi komentar |
| `pages/admin/LogAktivitas.jsx` | Lihat log audit aktivitas |
| `pages/admin/PengaturanDenda.jsx` | Form pengaturan denda |
| `pages/admin/PermintaanAktivasi.jsx` | Proses permintaan aktivasi |
| `pages/admin/Tarif.jsx` | Kelola tarif |
| `pages/admin/Users.jsx` | Kelola user |
| `pages/owner/DashboardOwner.jsx` | Dashboard owner dengan KPI |
| `pages/owner/GrafikRingkasan.jsx` | Komponen grafik ringkasan |
| `pages/owner/Rekap.jsx` | Rekap transaksi per periode |
| `pages/pelanggan/Booking.jsx` | Kelola booking pelanggan |
| `pages/pelanggan/RiwayatBooking.jsx` | Riwayat booking dengan aksi |
| `pages/petugas/DashboardPetugas.jsx` | Dashboard petugas |
| `pages/petugas/TambahKendaraan.jsx` | Form tambah kendaraan |
| `pages/petugas/KendaraanMasuk.jsx` | Proses check-in dan karcis |
| `pages/petugas/KendaraanKeluar.jsx` | Proses check-out, biaya, pembayaran, struk |
| `pages/petugas/Transaksi.jsx` | Daftar riwayat transaksi |
| `pages/petugas/Booking.jsx` | Kelola booking masuk |
| `utils/sound.js` | Utility suara umpan balik UI |

### Folder `config/` - Konfigurasi Backend

| File | Fungsi |
|------|--------|
| `app.php` | Konfigurasi inti Laravel (nama, timezone, locale, provider) |
| `auth.php` | Guard dan provider autentikasi |
| `cache.php` | Driver cache |
| `cloudinary.php` | Konfigurasi package Cloudinary |
| `cors.php` | Setting CORS: origin, method, header |
| `database.php` | Koneksi database dan migration repository |
| `filesystems.php` | Disk penyimpanan file |
| `logging.php` | Channel dan level logging |
| `mail.php` | Konfigurasi email |
| `midtrans.php` | Server key, client key, production mode Midtrans |
| `queue.php` | Driver antrian |
| `sanctum.php` | Konfigurasi token SPA Sanctum |
| `services.php` | Kredensial layanan pihak ketiga |
| `session.php` | Driver dan lifetime session |

### Folder `routes/` - Routing

| File | Fungsi |
|------|--------|
| `api.php` | Definisi semua endpoint REST API dengan middleware role |
| `web.php` | Fallback SPA: route non-API ke view React |
| `console.php` | Command CLI dan jadwal scheduler (booking:expire) |

### Folder `public/` - Web Root

| File/Folder | Fungsi |
|------|--------|
| `index.php` | Front controller Laravel |
| `.htaccess` | Rewrite rule Apache ke index.php |
| `build/` | Output hasil `npm run build` (JS/CSS bundle, manifest.json) |
| `images/` | Gambar logo, ilustrasi landing page |
| `favicon.svg`, `icons.svg` | Ikon aplikasi |
| `parkir_pelabuhan_tanjung_perak.png`, `video.mp4` | Aset visual landing page |
| `qris-statis.jpeg` | Gambar QRIS statis untuk pembayaran manual |
| `robots.txt` | Arahan web crawler |

### Folder `docs/` - Dokumentasi

| File | Fungsi |
|------|--------|
| `DOKUMENTASI_LENGKAP.md` | Dokumentasi utama ini |
| `desain.md`, `prd.md` | Referensi desain dan product requirements |
| `KARCIS_*.md`, `KARCIS_SUMMARY.txt` | Catatan implementasi dan status fitur karcis |
| `LANDING_UPDATE_SUMMARY.md` | Ringkasan perubahan landing page |
| `QRIS_*.md`, `ModalQris*.txt` | Catatan implementasi, fallback, polling, perbaikan QRIS |
| `midtrans/` | Dokumentasi Midtrans: QUICK_START.md, IMPLEMENTATION.md, SETUP_CHECKLIST.md, FLOW_DIAGRAMS.md, DELIVERY_REPORT.txt, dsb |

## 10. Keamanan dan Best Practice

1. **Environment Variables:**
   - Jangan commit `.env` ke repository
   - Gunakan `.env.example` sebagai template
   - Berikan nilai production di server secara terpisah

2. **Production Configuration:**
   - `APP_DEBUG=false` pada production
   - `APP_ENV=production`
   - Batasi `FRONTEND_URL` ke domain yang tepat
   - Gunakan HTTPS untuk semua URL

3. **Database & Backup:**
   - Regular backup database production
   - Monitor disk space untuk logs

4. **Akun Default:**
   - Ganti password akun seed sebelum deployment
   - Atau hapus akun seed sama sekali setelah setup

5. **Migration & Schema:**
   - Selalu gunakan migration baru untuk perubahan database
   - Jangan modify database production tanpa migration

6. **Midtrans & Webhook:**
   - Endpoint webhook harus accessible publik HTTPS
   - Server key WAJIB tetap di `.env` backend, jangan di frontend
   - Test callback mechanism sebelum go live

7. **Cloudinary:**
   - Proteksi upload preset jika diperlukan
   - Monitor storage usage

8. **Scheduler:**
   - Pastikan cron job `/php artisan schedule:run` berjalan setiap menit
   - Monitor saat booking kadaluarsa diproses

## 11. Perintah Berguna

```powershell
# Development
php artisan serve                    # Jalankan Laravel server di port 8000
npm run dev                          # Jalankan Vite dev server
composer run dev                     # Jalankan semua service (server, queue, logs, Vite)

# Database
php artisan migrate                  # Jalankan migration
php artisan migrate --seed           # Migrate dan seed akun default
php artisan migrate:fresh --seed     # HATI-HATI: hapus semua tabel, lalu migrate dan seed
php artisan db:seed                  # Hanya jalankan seeder
php artisan db:seed --class=TbUserSeeder  # Jalankan seeder tertentu

# Cache & Config
php artisan config:cache             # Cache konfigurasi (production)
php artisan view:cache               # Cache view
php artisan route:cache              # Cache route

# Command & Scheduler
php artisan booking:expire           # Cek dan tandai booking kadaluarsa
php artisan schedule:run             # Jalankan scheduler sekali (untuk test)
php artisan queue:listen             # Jalankan queue listener

# Build & Aset
npm run build                        # Build React/Vite untuk production
npm run preview                      # Preview hasil build lokal

# Testing
php artisan test                     # Jalankan PHPUnit test
php artisan test --filter=NamaTest   # Test tertentu

# Maintenance
php artisan down                     # Aplikasi offline
php artisan up                       # Aplikasi online
php artisan tinker                   # Interactive shell Laravel

# Log & Debug
php artisan pail                     # Monitor log real-time
php artisan pail --timeout=0         # Monitor log tanpa timeout
```

## 12. Troubleshooting

**"Database tidak ditemukan"**
- Pastikan koneksi database di `.env` benar
- Jalankan `php artisan migrate --seed`

**"Token 401 Unauthorized"**
- Pastikan token disimpan dan dikirim di header Authorization
- Token mungkin expired; login ulang

**"CORS Error pada produksi"**
- Pastikan `FRONTEND_URL` di `.env` sesuai domain production
- Restart server setelah update `.env`

**"Booking tidak kadaluarsa"**
- Pastikan scheduler berjalan: `php artisan schedule:run` setiap menit
- Atau test manual: `php artisan booking:expire`

**"Midtrans callback tidak terima"**
- Pastikan URL webhook accessible publik (bukan localhost)
- Gunakan HTTPS
- Test mode Midtrans harus cocok dengan `MIDTRANS_IS_PRODUCTION`

**"Foto profil tidak terupload ke Cloudinary"**
- Pastikan kredensial Cloudinary di `.env` benar
- Check `CLOUDINARY_UPLOAD_PRESET` ada di dashboard Cloudinary

## 13. Batasan Dokumentasi

Dokumen ini menjelaskan semua folder dan file sumber/konfigurasi yang relevan untuk memahami dan mengembangkan aplikasi. Folder `vendor/`, `node_modules/`, `storage/`, dan file di `public/build/` berisi banyak file dari pihak ketiga atau hasil terhasilkan oleh framework, sehingga dijelaskan pada level folder dan tidak dirinci file per file.

**Source of truth perilaku sistem** tetap ada di:
- Route definitions (`routes/api.php`, `routes/web.php`)
- Controller logic (`app/Http/Controllers/`)
- Model relationships dan business logic (`app/Models/`)
- Migration schema (`database/migrations/`)
- React components dan pages (`resources/js/`)
- Configuration files (`config/`)

Bacalah kode sumber tersebut untuk memahami detail implementasi.

---

**Semua fitur dan alur dijelaskan di atas. Selamat mengembangkan!**