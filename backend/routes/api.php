<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AreaParkirController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\KendaraanController;
use App\Http\Controllers\LogAktivitasController;
use App\Http\Controllers\PermintaanAktivasiController;
use App\Http\Controllers\PengaturanDendaController;
use App\Http\Controllers\TarifController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\KomentarController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\WebhookDanaController;
use App\Http\Controllers\StatistikController;



/*
|--------------------------------------------------------------------------
| ROUTE PUBLIK (tidak perlu login)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/login-passkey', [AuthController::class, 'loginWithPasskey']);

/*
|--------------------------------------------------------------------------
| ROUTE YANG WAJIB LOGIN (semua role: admin, petugas, owner)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Foto profil milik sendiri - boleh dipakai SEMUA role yang login
    // (admin, petugas, owner, pelanggan), beda dengan /users yang khusus admin.
    Route::post('/profile/foto', [AuthController::class, 'updateFoto']);
    Route::delete('/profile/foto', [AuthController::class, 'hapusFoto']);

    /*
    |----------------------------------------------------------------
    | KHUSUS ADMIN
    | CRUD User, Tarif, Area Parkir, Akses Log Aktivitas
    | Kendaraan: index & store dipindah ke grup admin+petugas di bawah,
    | jadi di sini cuma sisa show/update/destroy yang tetap khusus admin.
    |----------------------------------------------------------------
    */
    //
    Route::middleware('role:admin')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('tarif', TarifController::class)->except(['index', 'show']);
    Route::apiResource('area-parkir', AreaParkirController::class)->except(['index', 'show']);
    Route::put('/pengaturan-denda', [PengaturanDendaController::class, 'update']);
    Route::apiResource('kendaraan', KendaraanController::class)->except(['index', 'store']);
    Route::get('/log-aktivitas', [LogAktivitasController::class, 'index']);
    Route::post('/komentar/{id}/balas', [KomentarController::class, 'balas']);
    Route::get('/transaksi/rekap-harian', [TransaksiController::class, 'rekapHarian']); // pindah ke sini

    // Tinjau & proses pengajuan aktivasi ulang akun yang dinonaktifkan
    Route::get('/permintaan-aktivasi', [PermintaanAktivasiController::class, 'index']);
    Route::post('/permintaan-aktivasi/{id}/setujui', [PermintaanAktivasiController::class, 'setujui']);
    Route::post('/permintaan-aktivasi/{id}/tolak', [PermintaanAktivasiController::class, 'tolak']);
});
    /*
    |----------------------------------------------------------------
    | DATA REFERENSI (tarif & area parkir) - boleh dibaca admin & petugas
    | Petugas butuh ini untuk mengisi dropdown saat mencatat transaksi.
    | Create/update/delete tetap khusus admin (lihat grup di atas).
    |----------------------------------------------------------------
    */
    Route::middleware('role:admin,petugas,pelanggan')->group(function () {
        Route::get('/tarif', [TarifController::class, 'index']);
        Route::get('/tarif/{tarif}', [TarifController::class, 'show']);
        Route::get('/area-parkir', [AreaParkirController::class, 'index']);
        Route::get('/area-parkir/{area_parkir}', [AreaParkirController::class, 'show']);
    });

    // Pengaturan denda - GET boleh admin & petugas (petugas butuh ini untuk
    // preview estimasi denda di halaman Kendaraan Keluar). Update tetap
    // khusus admin (lihat grup role:admin di atas).
    Route::middleware('role:admin,petugas')->group(function () {
        Route::get('/pengaturan-denda', [PengaturanDendaController::class, 'show']);
    });

    /*
    |----------------------------------------------------------------
    | DATA KENDARAAN (khusus admin & petugas)
    | Petugas boleh melihat daftar & menambahkan kendaraan baru.
    | Edit & hapus tetap khusus admin (lihat apiResource di grup admin).
    |----------------------------------------------------------------
    */
    Route::middleware('role:admin,petugas')->group(function () {
        Route::get('/kendaraan', [KendaraanController::class, 'index']);
        Route::post('/kendaraan', [KendaraanController::class, 'store']);
        Route::get('/kendaraan/cari/{plat_nomor}', [KendaraanController::class, 'cariByPlat']);
    });

    /*
    |----------------------------------------------------------------
    | KHUSUS PETUGAS
    | Transaksi & Cetak Struk Parkir
    |----------------------------------------------------------------
    */
    //
    Route::middleware('role:petugas')->group(function () {
    Route::post('/transaksi/masuk', [TransaksiController::class, 'kendaraanMasuk']);
    Route::post('/transaksi/{id}/keluar', [TransaksiController::class, 'kendaraanKeluar']);
    Route::get('/transaksi/{id}/struk', [TransaksiController::class, 'cetakStruk']);
    Route::get('/transaksi', [TransaksiController::class, 'index']);
    Route::get('/transaksi/kendaraan-didalam', [TransaksiController::class, 'kendaraanDidalam']);
    Route::get('/transaksi/sedang-parkir', [TransaksiController::class, 'sedangParkir']); // ⬅️ baris baru
    Route::get('/transaksi/cari-booking/{kode_booking}', [TransaksiController::class, 'cariBookingSedangParkir']);
});

    /*
    |----------------------------------------------------------------
    | BOOKING PARKIR ONLINE
    |----------------------------------------------------------------
    */
    // Khusus pelanggan - bikin & kelola booking miliknya sendiri
    Route::middleware('role:pelanggan')->group(function () {
        Route::get('/booking/saya', [BookingController::class, 'bookingSaya']);
        Route::post('/booking', [BookingController::class, 'store']);
        Route::delete('/booking/{id}', [BookingController::class, 'batalkan']);

        // pelanggan daftarkan & lihat kendaraan miliknya sendiri (buat dipilih saat booking)
        Route::get('/kendaraan-saya', [KendaraanController::class, 'kendaraanSaya']);
        Route::post('/kendaraan-saya', [KendaraanController::class, 'store']);
    });

    // Khusus admin/petugas - kelola booking yang masuk
    Route::middleware('role:admin,petugas')->group(function () {
        Route::get('/booking', [BookingController::class, 'index']);
        Route::get('/booking/cari/{kode_booking}', [BookingController::class, 'cariByKode']);
        Route::post('/booking/{id}/konfirmasi', [BookingController::class, 'konfirmasi']);
        Route::post('/booking/{id}/tolak', [BookingController::class, 'tolak']);
    });

    // Hapus riwayat booking (selesai/dibatalkan/kadaluarsa) - bisa semua/pilih.
    // Boleh diakses pelanggan (punya sendiri), admin & petugas (semua data);
    // controller yang membedakan scope berdasarkan role user yang login.
    Route::middleware('role:admin,petugas,pelanggan')->group(function () {
        Route::delete('/booking/riwayat/semua', [BookingController::class, 'hapusSemuaRiwayat']);
        Route::delete('/booking/riwayat/pilih', [BookingController::class, 'hapusRiwayatTerpilih']);
    });

    /*
    |----------------------------------------------------------------
    | KHUSUS OWNER
    | Rekap transaksi sesuai rentang waktu yang diminta
    |----------------------------------------------------------------
    */
    //
    Route::middleware('role:owner')->group(function () {
        Route::get('/rekap-transaksi', [TransaksiController::class, 'rekap']);
    });

    Route::get('/transaksi/rekap-harian', [TransaksiController::class, 'rekapHarian']);

});

//
//  {#d1c,15}
Route::get('/komentar', [KomentarController::class, 'index']);
Route::post('/komentar', [KomentarController::class, 'store']);

// PUBLIK - ajukan aktivasi ulang akun yang dinonaktifkan (tidak perlu login,
// karena akun yang statusnya nonaktif memang tidak bisa login).
Route::post('/permintaan-aktivasi', [PermintaanAktivasiController::class, 'store']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/transaksi/{id}/bayar-qris', [PembayaranController::class, 'generateQris']);
    Route::get('/transaksi/{id}/status-bayar', [PembayaranController::class, 'cekStatus']);

    // hanya aktif kalau APP_DEMO_MODE=true di .env -- lihat catatan di controller
    Route::post('/transaksi/{id}/tandai-lunas-manual', [PembayaranController::class, 'tandaiLunasManual']);
});
Route::post('/webhook/dana', [WebhookDanaController::class, 'handle']);

Route::get('/komentar', [KomentarController::class, 'index']);
Route::post('/komentar', [KomentarController::class, 'store']);
Route::get('/statistik/ringkasan', [StatistikController::class, 'ringkasan']);
Route::get('/transaksi/rekap-harian-publik', [TransaksiController::class, 'rekapHarianPublik']);
Route::delete('/komentar/{id}', [KomentarController::class, 'destroy']);