<div align="center">

# Aplikasi Parkir UKK

### Sistem Manajemen Parkir Digital Berbasis Web

Mencatat kendaraan masuk/keluar, booking slot parkir, dan transaksi pembayaran QRIS — semuanya dalam satu platform modern yang menggantikan pencatatan manual.

[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PHP](https://img.shields.io/badge/PHP-%5E8.2-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Sanctum](https://img.shields.io/badge/Auth-Sanctum-3178C6?style=for-the-badge)](https://laravel.com/docs/sanctum)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![GitHub Repo](https://img.shields.io/badge/Repository-Bobyrpl%2FAplikasi--Parkir--UKK-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK)
[![Stars](https://img.shields.io/github/stars/Bobyrpl/Aplikasi-Parkir-UKK?style=for-the-badge&color=yellow)](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK/stargazers)
[![Forks](https://img.shields.io/github/forks/Bobyrpl/Aplikasi-Parkir-UKK?style=for-the-badge&color=blue)](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK/network/members)
[![Issues](https://img.shields.io/github/issues/Bobyrpl/Aplikasi-Parkir-UKK?style=for-the-badge&color=orange)](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK/issues)
[![Last Commit](https://img.shields.io/github/last-commit/Bobyrpl/Aplikasi-Parkir-UKK?style=for-the-badge&color=success)](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK/commits/main)

[Fitur](#-fitur) • [Teknologi](#️-teknologi-yang-digunakan) • [Instalasi](#-instalasi) • [Menjalankan](#-menjalankan-aplikasi) • [Environment](#-environment-variables-penting) • [Struktur](#-struktur-proyek) • [Troubleshooting](#-troubleshooting) • [Repository ↗](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK)

</div>

---

## 📋 Tentang Proyek

**Aplikasi Parkir UKK** adalah aplikasi manajemen parkir berbasis web yang dibangun sebagai proyek **Uji Kompetensi Keahlian (UKK)**. Aplikasi ini digunakan untuk mencatat dan mengelola data kendaraan yang masuk dan keluar area parkir, booking slot parkir, hingga transaksi pembayaran QRIS secara digital.

Dibangun dengan arsitektur **Laravel sebagai REST API (backend)** dan **React sebagai Single Page Application (frontend)**, dua project yang berjalan **independen** dan hanya saling terhubung lewat HTTP — bukan pola Laravel + Inertia yang menyatu dalam satu proses:

```
Browser  →  frontend (React, :5173)  →  axios  →  backend (Laravel API, :8000)
```

Autentikasi memakai **Laravel Sanctum** (Bearer token), dan komunikasi dua arah diamankan lewat konfigurasi **CORS** (`backend/config/cors.php`) yang mengizinkan origin frontend secara eksplisit.

**🔗 Repository:** [github.com/Bobyrpl/Aplikasi-Parkir-UKK](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK)

### 👥 Role Pengguna

<table>
<tr>
<td align="center" width="25%">

**👑 Admin**

Mengelola data master: area parkir, kendaraan, tarif, user, dan log aktivitas

</td>
<td align="center" width="25%">

**🧑‍💼 Owner**

Memantau dashboard & rekap laporan

</td>
<td align="center" width="25%">

**🧍 Petugas**

Mencatat kendaraan masuk/keluar, booking, dan transaksi di lapangan

</td>
<td align="center" width="25%">

**🙋 Pelanggan**

Melakukan booking slot parkir & melihat riwayat booking

</td>
</tr>
</table>

## ✨ Fitur

|     | Fitur                 | Deskripsi                                                                                   |
| --- | --------------------- | ------------------------------------------------------------------------------------------- |
| 🔐  | **Autentikasi**       | Login & Register dengan Laravel Sanctum, role-based access via middleware `CheckRole`       |
| 🅿️  | **Area Parkir**       | Manajemen lengkap area & slot parkir                                                        |
| 🚗  | **Kendaraan**         | Pencatatan data kendaraan masuk & keluar                                                    |
| 📅  | **Booking**           | Booking slot parkir untuk pelanggan dengan auto-expire (`ExpireBookings` scheduled command) |
| 💳  | **Transaksi**         | Transaksi parkir & struk digital                                                            |
| 💰  | **Pembayaran QRIS**   | Pembayaran via DANA/Midtrans (sandbox) langsung dari transaksi kendaraan keluar             |
| 💵  | **Tarif**             | Manajemen tarif parkir                                                                      |
| 👥  | **User Management**   | Manajemen user & hak akses                                                                  |
| 📝  | **Log Aktivitas**     | Rekam jejak aktivitas pengguna                                                              |
| 📊  | **Dashboard & Rekap** | Laporan khusus untuk Owner                                                                  |

## 🛠️ Teknologi yang Digunakan

<div align="center">

|    Kategori    | Teknologi                                     |
| :------------: | :-------------------------------------------- |
|  **Backend**   | Laravel 12 (PHP ^8.2) — REST API              |
|    **Auth**    | Laravel Sanctum (Bearer token)                |
|  **Frontend**  | React 19 (SPA), React Router, Axios           |
| **Build Tool** | Vite                                          |
|  **Styling**   | Tailwind CSS 4, Bootstrap (komponen tertentu) |
|  **Payment**   | Midtrans / DANA QRIS _(sandbox)_              |
|  **Database**  | SQLite _(default)_ / MySQL                    |
|  **Testing**   | PHPUnit                                       |

</div>

## 📦 Instalasi

> **Prasyarat:** PHP `>= 8.2`, Composer, Node.js `>= 18` & NPM, ekstensi PHP `sqlite3` (kalau pakai SQLite)

**1. Clone repository**

```bash
git clone https://github.com/Bobyrpl/Aplikasi-Parkir-UKK.git
cd Aplikasi-Parkir-UKK
```

Struktur repo terdiri dari dua project independen:

```
apk-parkir-ukk/
├── backend/     Laravel 12 REST API (port 8000)
└── frontend/    React SPA + Vite (port 5173)
```

### Setup Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Cek `backend/.env`, khususnya:

- `DB_CONNECTION=sqlite` (default) — database sudah tersedia di `database/database.sqlite`, langsung jalan tanpa setup tambahan.
- `FRONTEND_URL=http://localhost:5173` — dipakai `config/cors.php` untuk mengizinkan request dari frontend.
- `SANCTUM_STATEFUL_DOMAINS` — daftar domain frontend yang diizinkan.
- `DANA_*` — kredensial sandbox untuk fitur pembayaran QRIS. **Jangan commit nilai asli ke git publik.**

Untuk MySQL, ubah bagian koneksi database di `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=parkir_ukk
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migrasi (dan seeder jika tersedia data awal):

```bash
php artisan migrate --seed
```

### Setup Frontend

```bash
cd frontend
npm install
```

Buat/cek file `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Sesuaikan kalau backend jalan di port/host lain.

## 🚀 Menjalankan Aplikasi

**Cara cepat** — backend & frontend sekaligus (dari dalam folder `backend/`):

```bash
composer run dev
```

**Atau secara terpisah**, perlu dua terminal terbuka bersamaan:

```bash
# Terminal 1
cd backend
php artisan serve
```

```bash
# Terminal 2
cd frontend
npm run dev
```

Buka browser ke:

```
http://localhost:5173
```

Backend API akan tersedia di `http://localhost:8000/api`.

### ⏰ Scheduler (Auto-Expire Booking)

Fitur booking otomatis kedaluwarsa (`ExpireBookings`) memerlukan Laravel Scheduler. Untuk development:

```bash
php artisan schedule:work
```

### 🏗️ Build untuk Production

```bash
cd frontend
npm run build
```

Hasil build statis ada di `frontend/dist/` — bisa di-deploy ke hosting statis (Nginx, Vercel, Netlify, dll) terpisah dari backend. Backend Laravel di-deploy seperti biasa (Nginx/Apache + PHP-FPM); pastikan `FRONTEND_URL` dan `SANCTUM_STATEFUL_DOMAINS` di `.env` production diarahkan ke domain frontend yang sebenarnya.

## 🔑 Environment Variables Penting

| Variabel                             | Lokasi          | Kegunaan                                                |
| ------------------------------------ | --------------- | ------------------------------------------------------- |
| `DB_CONNECTION`, `DB_DATABASE`, dst. | `backend/.env`  | Konfigurasi koneksi database (SQLite default / MySQL)   |
| `FRONTEND_URL`                       | `backend/.env`  | Origin frontend yang diizinkan CORS (`config/cors.php`) |
| `SANCTUM_STATEFUL_DOMAINS`           | `backend/.env`  | Domain frontend untuk skenario Sanctum berbasis cookie  |
| `DANA_*`                             | `backend/.env`  | Kredensial sandbox integrasi pembayaran QRIS            |
| `VITE_API_URL`                       | `frontend/.env` | URL base API Laravel yang dikonsumsi frontend           |

## 📁 Struktur Proyek

```
apk-parkir-ukk/
├── backend/
│   ├── app
│   │   ├── Console/Commands/ExpireBookings.php   # Auto-expire booking terjadwal
│   │   ├── Http
│   │   │   ├── Controllers/    # AreaParkir, Auth, Booking, Kendaraan,
│   │   │   │                   # LogAktivitas, Pembayaran, Tarif, Transaksi, User
│   │   │   └── Middleware/CheckRole.php          # Role-based access control
│   │   └── Models/              # AreaParkir, Booking, Kendaraan,
│   │                             # LogAktivitas, Tarif, Transaksi, User
│   ├── config/cors.php           # Origin frontend yang diizinkan
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── database.sqlite
│   ├── routes/
│   │   ├── api.php       # Endpoint REST API (dikonsumsi React)
│   │   ├── web.php
│   │   └── console.php   # Scheduled commands
│   ├── artisan
│   └── composer.json
└── frontend/
    ├── public/
    │   ├── images/gambar.jpg
    │   └── parkir_pelabuhan_tanjung_perak.png   # Logo aplikasi
    ├── src/
    │   ├── api/axios.js         # Konfigurasi HTTP client ke Laravel API
    │   ├── components/          # Layout, ProtectedRoute, StrukCard, ui
    │   ├── context/              # AuthContext, ToastContext
    │   ├── pages/
    │   │   ├── admin/            # AreaParkir, Dashboard, Kendaraan, LogAktivitas, Tarif, Users
    │   │   ├── owner/            # Dashboard, Rekap
    │   │   ├── pelanggan/        # Booking, RiwayatBooking
    │   │   ├── petugas/          # Booking, Dashboard, KendaraanKeluar/Masuk, Transaksi
    │   │   └── Landing.jsx, Login.jsx, Register.jsx, Bantuan.jsx
    │   ├── app.jsx / main.jsx    # Entry point React
    │   └── bootstrap.js
    ├── package.json
    └── vite.config.js
```

## 🧪 Menjalankan Test

```bash
cd backend
php artisan test
```

## 🛠️ Troubleshooting

**CORS error di browser console**
Pastikan `backend/config/cors.php` → `allowed_origins` sudah mencantumkan origin frontend (`http://localhost:5173`), lalu jalankan `php artisan config:clear`.

**Request ke API gagal / 404**
Pastikan `VITE_API_URL` di `frontend/.env` mengarah ke `http://localhost:8000/api` dan backend sedang jalan (`php artisan serve`).

**PowerShell: script execution disabled**
Kalau `npm` gagal jalan di PowerShell dengan error execution policy, jalankan sebagai Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Database kosong / error 500 saat login**
Jalankan migrasi ulang (⚠️ ini menghapus semua data):

```bash
php artisan migrate:fresh --seed
```

## 🤝 Kontribusi

Proyek ini dibuat untuk keperluan Uji Kompetensi Keahlian (UKK). Saran dan masukan tetap terbuka melalui [issue](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK/issues) atau [pull request](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK/pulls).

## 📄 Lisensi

Proyek ini dibuat untuk tujuan pembelajaran/tugas sekolah — silakan sesuaikan lisensi (mis. [MIT](https://opensource.org/licenses/MIT)) sesuai kebutuhan.

---

<div align="center">

## 👤 Penulis

**Bobyrpl**

[![GitHub](https://img.shields.io/badge/GitHub-Bobyrpl-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Bobyrpl)
[![Repo](https://img.shields.io/badge/⭐_Star_this_repo-Aplikasi--Parkir--UKK-yellow?style=for-the-badge&logo=github)](https://github.com/Bobyrpl/Aplikasi-Parkir-UKK)

<a href="https://canva.link/7riihmdsitd9uju"> link </a>

<sub>Dibuat untuk Uji Kompetensi Keahlian (UKK)</sub>

</div>
# app-parkir
