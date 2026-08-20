<div align="center">

# 🅿️ Aplikasi Parkir — Backend API

### REST API Laravel untuk Sistem Manajemen Parkir Digital

Melayani autentikasi, data master, transaksi, booking online, pembayaran QRIS, hingga statistik — dikonsumsi oleh [frontend React terpisah](https://github.com/Bobyrpl/Frontend-apk-parkir).

[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-%5E8.2-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net)
[![Sanctum](https://img.shields.io/badge/Auth-Sanctum-3178C6?style=for-the-badge)](https://laravel.com/docs/sanctum)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![GitHub Repo](https://img.shields.io/badge/Repository-Bobyrpl%2Fbackend--apk--parkir-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Bobyrpl/backend-apk-parkir)
[![Stars](https://img.shields.io/github/stars/Bobyrpl/backend-apk-parkir?style=for-the-badge&color=yellow)](https://github.com/Bobyrpl/backend-apk-parkir/stargazers)
[![Issues](https://img.shields.io/github/issues/Bobyrpl/backend-apk-parkir?style=for-the-badge&color=orange)](https://github.com/Bobyrpl/backend-apk-parkir/issues)
[![Last Commit](https://img.shields.io/github/last-commit/Bobyrpl/backend-apk-parkir?style=for-the-badge&color=success)](https://github.com/Bobyrpl/backend-apk-parkir/commits/main)

[Fitur](#-fitur) • [Teknologi](#️-teknologi-yang-digunakan) • [Instalasi](#-instalasi) • [Environment](#-environment-variables-penting) • [Endpoint](#-ringkasan-endpoint-api) • [Struktur](#-struktur-proyek)

</div>

---

## 📋 Tentang Proyek

Repo ini adalah **backend REST API** untuk Aplikasi Parkir, dipisah dari frontend sejak proyek ini di-split menjadi dua repository:

- 🔧 **Backend (repo ini):** [Bobyrpl/backend-apk-parkir](https://github.com/Bobyrpl/backend-apk-parkir) — Laravel 12, murni REST API, di-deploy ke **Railway**.
- 🎨 **Frontend:** [Bobyrpl/Frontend-apk-parkir](https://github.com/Bobyrpl/Frontend-apk-parkir) — React SPA (Vite), di-deploy ke **Vercel**, mengonsumsi API ini lewat `axios`.

Backend tidak lagi menyajikan halaman/shell apa pun (tidak ada Blade/Inertia untuk frontend) — seluruhnya berupa endpoint JSON di bawah `routes/api.php`, diamankan dengan **Laravel Sanctum** (Bearer token) dan middleware role kustom `CheckRole`.

> 🌐 **API production:** `https://backend-apk-parkir-production-ec0c.up.railway.app/api`

### 👥 Role Pengguna

<table>
<tr>
<td align="center" width="20%">

**👑 Admin**

Kelola user, tarif, area parkir, kendaraan, pengaturan denda, dan log aktivitas

</td>
<td align="center" width="20%">

**🧑‍💼 Owner**

Lihat rekap transaksi sesuai rentang waktu

</td>
<td align="center" width="20%">

**🧍 Petugas**

Catat kendaraan masuk/keluar, kelola booking masuk, transaksi & cetak struk

</td>
<td align="center" width="20%">

**🙋 Pelanggan**

Booking slot parkir online, daftarkan kendaraan sendiri, riwayat booking

</td>
<td align="center" width="20%">

**🌐 Publik**

Statistik ringkasan, rekap harian publik, kirim/lihat komentar, ajukan aktivasi ulang akun

</td>
</tr>
</table>

## ✨ Fitur

|     | Fitur                        | Deskripsi                                                                                          |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| 🔐  | **Autentikasi**               | Register, login (password & passkey), logout, profil — via Laravel Sanctum + middleware `CheckRole` |
| 🅿️  | **Area Parkir & Tarif**       | CRUD area/slot parkir dan tarif (khusus admin, dibaca admin/petugas/pelanggan)                       |
| 🚗  | **Kendaraan**                 | Pencatatan kendaraan, pencarian by plat nomor, kendaraan milik pelanggan sendiri                     |
| 📅  | **Booking Online**            | Pelanggan booking slot, admin/petugas konfirmasi/tolak, auto-expire via scheduled command             |
| 💳  | **Transaksi & Struk**         | Kendaraan masuk/keluar, hitung tarif & denda otomatis, cetak struk digital                            |
| 💰  | **Pembayaran QRIS (DANA)**    | Generate QRIS lewat DANA Bisnis, cek status bayar, webhook notifikasi pembayaran                     |
| ⚖️  | **Pengaturan Denda**          | Admin atur aturan denda keterlambatan, petugas bisa preview estimasi                                  |
| 🖼️  | **Upload Foto (Cloudinary)**  | Foto profil user tersimpan di Cloudinary, bukan storage lokal                                        |
| 👥  | **User Management**           | CRUD user & hak akses, permintaan aktivasi ulang akun nonaktif                                        |
| 📝  | **Log Aktivitas**             | Rekam jejak aktivitas pengguna (khusus admin)                                                         |
| 💬  | **Komentar Publik**           | Publik bisa kirim & lihat komentar, admin bisa membalas                                              |
| 📊  | **Statistik & Rekap**         | Statistik ringkasan publik, rekap harian publik, rekap transaksi khusus owner                        |

## 🛠️ Teknologi yang Digunakan

<div align="center">

|    Kategori     | Teknologi                                   |
| :--------------: | :------------------------------------------- |
|   **Framework**  | Laravel 12 (PHP ^8.2) — REST API murni       |
|     **Auth**      | Laravel Sanctum (Bearer token, tanpa cookie) |
| **Pembayaran**    | DANA Bisnis QRIS (MPM Acquirer) + webhook    |
| **Media Storage** | Cloudinary (`cloudinary-labs/cloudinary-laravel`) |
|   **Database**    | SQLite _(default/dev)_ / MySQL _(production)_ |
|   **Deployment**  | Railway                                      |
|    **Testing**    | PHPUnit                                      |

</div>

## 📦 Instalasi

> **Prasyarat:** PHP `>= 8.2`, Composer, Node.js & NPM (untuk asset build bawaan Laravel)

**1. Clone repository**

```bash
git clone https://github.com/Bobyrpl/backend-apk-parkir.git
cd backend-apk-parkir
```

**2. Install dependency PHP**

```bash
composer install
```

**3. Salin file environment**

```bash
cp .env.example .env
```

**4. Generate application key**

```bash
php artisan key:generate
```

**5. Konfigurasi database**

Secara default proyek ini memakai **SQLite** (`database/database.sqlite`), langsung jalan tanpa setup tambahan. Untuk MySQL, ubah `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_parkir
DB_USERNAME=root
DB_PASSWORD=
```

**6. Jalankan migrasi**

```bash
php artisan migrate
```

Jika tersedia data awal (seeder):

```bash
php artisan db:seed
```

## 🚀 Menjalankan Aplikasi

**Cara cepat** — server, queue worker, log viewer, sekaligus:

```bash
composer run dev
```

**Atau minimal** cukup server API-nya saja:

```bash
php artisan serve
```

API dapat diakses melalui:

```
http://127.0.0.1:8000/api
```

> Frontend (Vite dev server) secara default jalan di `http://localhost:5173` dan sudah diizinkan lewat `config/cors.php`.

### ⏰ Scheduler (Auto-Expire Booking)

Booking yang tidak dikonfirmasi akan kedaluwarsa otomatis lewat `ExpireBookings`. Untuk development, jalankan scheduler:

```bash
php artisan schedule:work
```

## 🔑 Environment Variables Penting

Selain koneksi database standar Laravel, ada beberapa variabel khusus di `.env`:

| Variabel | Kegunaan |
| --- | --- |
| `FRONTEND_URL` | Origin frontend yang diizinkan CORS (`config/cors.php`), default `https://app-parkir.vercel.app` di production |
| `SANCTUM_STATEFUL_DOMAINS` | Domain frontend untuk skenario Sanctum berbasis cookie (opsional, API ini terutama pakai Bearer token) |
| `DANA_BASE_URL`, `DANA_PARTNER_ID`, `DANA_CLIENT_ID`, `DANA_CLIENT_SECRET`, `DANA_CHANNEL_ID`, `DANA_MERCHANT_ID`, `DANA_PRIVATE_KEY_PATH`, `DANA_PUBLIC_KEY_PATH` | Kredensial integrasi QRIS DANA Bisnis (sandbox: `DANA_IS_PRODUCTION=false`) |
| `CLOUDINARY_URL` / kredensial Cloudinary lain | Upload & simpan foto profil user |

## 🔌 Ringkasan Endpoint API

Semua endpoint diprefix `/api` dan didefinisikan di `routes/api.php`.

<details>
<summary><strong>Lihat ringkasan endpoint</strong></summary>

| Method | Endpoint | Akses |
| --- | --- | --- |
| POST | `/register`, `/login`, `/login-passkey` | Publik |
| GET/POST | `/me`, `/logout`, `/profile/foto` | Login (semua role) |
| CRUD | `/users`, `/tarif`, `/area-parkir`, `/kendaraan` (edit/hapus) | Admin |
| GET | `/tarif`, `/area-parkir` | Admin, Petugas, Pelanggan |
| GET/POST | `/kendaraan`, `/kendaraan/cari/{plat}` | Admin, Petugas |
| POST | `/transaksi/masuk`, `/transaksi/{id}/keluar`, `/transaksi/{id}/struk` | Petugas |
| GET/POST/DELETE | `/booking`, `/booking/saya`, `/booking/{id}` | Pelanggan (miliknya) / Admin, Petugas |
| POST | `/transaksi/{id}/bayar-qris`, `/transaksi/{id}/status-bayar` | Login |
| POST | `/webhook/dana` | Webhook DANA (server-to-server) |
| GET | `/rekap-transaksi` | Owner |
| GET | `/statistik/ringkasan`, `/transaksi/rekap-harian-publik` | Publik |
| GET/POST/DELETE | `/komentar`, `/komentar/{id}/balas` (admin) | Publik / Admin |
| GET/POST | `/permintaan-aktivasi`, `/permintaan-aktivasi/{id}/setujui`, `/tolak` | Publik (ajukan) / Admin (proses) |

</details>

## 📁 Struktur Proyek

```
backend-apk-parkir/
├── app
│   ├── Console/Commands/ExpireBookings.php   # Auto-expire booking terjadwal
│   ├── Http
│   │   ├── Controllers/    # AreaParkir, Auth, Booking, Kendaraan, Komentar,
│   │   │                   # LogAktivitas, Pembayaran, PengaturanDenda,
│   │   │                   # PermintaanAktivasi, Statistik, Tarif, Transaksi,
│   │   │                   # User, WebhookDana
│   │   └── Middleware/CheckRole.php          # Role-based access control
│   ├── Models/              # AreaParkir, Booking, Kendaraan, Komentar,
│   │                         # LogAktivitas, PengaturanDenda,
│   │                         # PermintaanAktivasi, Tarif, Transaksi, User
│   ├── Services/DanaService.php              # Integrasi QRIS DANA Bisnis
│   └── Providers/AppServiceProvider.php
├── config/
│   ├── cors.php            # Origin frontend yang diizinkan (dev + Vercel)
│   ├── cloudinary.php      # Konfigurasi upload media
│   └── sanctum.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── database.sqlite
├── routes/
│   ├── api.php       # Seluruh endpoint REST API (dikonsumsi frontend React)
│   ├── web.php
│   └── console.php   # Scheduled commands (mis. ExpireBookings)
├── artisan
├── composer.json
└── phpunit.xml
```

## 🧪 Menjalankan Test

```bash
php artisan test
```

## 🔗 Repo Terkait

- 🎨 Frontend (React SPA): [github.com/Bobyrpl/Frontend-apk-parkir](https://github.com/Bobyrpl/Frontend-apk-parkir)

## 🤝 Kontribusi

Proyek ini dibuat untuk keperluan Uji Kompetensi Keahlian (UKK). Saran dan masukan tetap terbuka melalui [issue](https://github.com/Bobyrpl/backend-apk-parkir/issues) atau [pull request](https://github.com/Bobyrpl/backend-apk-parkir/pulls).

## 📄 Lisensi

Proyek ini dibuat untuk tujuan pembelajaran/tugas sekolah — silakan sesuaikan lisensi (mis. [MIT](https://opensource.org/licenses/MIT)) sesuai kebutuhan.

---

<div align="center">

## 👤 Penulis

**Bobyrpl**

[![GitHub](https://img.shields.io/badge/GitHub-Bobyrpl-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Bobyrpl)
[![Repo](https://img.shields.io/badge/⭐_Star_this_repo-backend--apk--parkir-yellow?style=for-the-badge&logo=github)](https://github.com/Bobyrpl/backend-apk-parkir)

<sub>Dibuat dengan ❤️ untuk Uji Kompetensi Keahlian (UKK)</sub>

</div>