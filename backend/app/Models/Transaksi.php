<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'tb_transaksi';
    protected $primaryKey = 'id_parkir';

    public $timestamps = false;

    protected $fillable = [
        'id_kendaraan',
        'waktu_masuk',
        'waktu_keluar',
        'id_tarif',
        'durasi_jam',
        'biaya_total',
        'denda',
        'status',
        'id_user',
        'id_area',
        'id_booking',
        'metode_bayar',
        'status_pembayaran',
        'qris_ref_id',
    ];

    protected $casts = [
        'waktu_masuk'  => 'datetime',
        'waktu_keluar' => 'datetime',
        'biaya_total'  => 'decimal:0',
        'denda'        => 'decimal:0',
    ];

    /* ==========================================================
     * RELASI
     * ========================================================== */

    public function kendaraan()
    {
        return $this->belongsTo(Kendaraan::class, 'id_kendaraan', 'id_kendaraan');
    }

    public function tarif()
    {
        return $this->belongsTo(Tarif::class, 'id_tarif', 'id_tarif');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function area()
    {
        return $this->belongsTo(AreaParkir::class, 'id_area', 'id_area');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'id_booking', 'id_booking');
    }

    /* ==========================================================
     * HELPER PROSES TRANSAKSI
     * ========================================================== */

    // Hitung durasi (jam, dibulatkan ke atas) & biaya saat kendaraan keluar
    // Perhitungan biaya didelegasikan ke FUNCTION MySQL fn_hitung_biaya_parkir
    // (lihat migration 2026_07_23_010000_add_db_objects_untuk_parkir.php)
    //
    // CATATAN: method ini HANYA menghitung biaya parkir murni (tarif x jam).
    // Denda (kalau ada) ditambahkan terpisah oleh controller setelah method
    // ini dipanggil, supaya logika tarif dan logika denda tidak bercampur
    // di satu tempat.
    public function hitungBiayaKeluar(): void
    {
        $masuk  = $this->waktu_masuk;
        $keluar = $this->waktu_keluar ?? now();

        $jam = (int) ceil($masuk->diffInMinutes($keluar) / 60);
        $jam = max(1, $jam); // minimal dihitung 1 jam

        $biaya = DB::selectOne(
            'SELECT fn_hitung_biaya_parkir(?, ?, ?) AS biaya',
            [$masuk, $keluar, $this->tarif->tarif_per_jam]
        );

        $this->durasi_jam  = $jam;
        $this->biaya_total = $biaya->biaya;
        $this->status      = 'keluar';
    }

    // Hitung denda keterlambatan booking SECARA OTOMATIS berdasarkan
    // pengaturan denda yang diatur admin (tb_pengaturan_denda), tanpa
    // input manual dari petugas.
    //
    // Aturan:
    // - Cuma berlaku untuk transaksi yang berasal dari booking
    //   (id_booking terisi) dan booking-nya punya jam_rencana_keluar.
    // - Kalau fitur denda dimatikan admin (aktif = false), selalu 0.
    // - Waktu keluar aktual dibandingkan dengan rencana keluar booking;
    //   selisih dikurangi dulu dengan toleransi_menit sebelum dihitung.
    // - Jam keterlambatan dibulatkan ke atas (telat 1 menit tetap kena
    //   1 jam denda), dikalikan denda_per_jam dari pengaturan.
    // - Tidak terlambat (atau bukan dari booking) -> 0.
    public function hitungDenda(): int
    {
        if (! $this->id_booking || ! $this->booking) {
            return 0;
        }

        $booking = $this->booking;

        if (! $booking->tanggal_rencana || ! $booking->jam_rencana_keluar) {
            return 0;
        }

        $pengaturan = PengaturanDenda::ambil();

        if (! $pengaturan->aktif || $pengaturan->denda_per_jam <= 0) {
            return 0;
        }

        $tanggal = $booking->tanggal_rencana->format('Y-m-d');
        $rencanaKeluar = Carbon::parse($tanggal . ' ' . $booking->jam_rencana_keluar);
        $aktualKeluar  = $this->waktu_keluar ?? now();

        $menitTerlambat = $rencanaKeluar->diffInMinutes($aktualKeluar, false);
        $menitTerlambat -= $pengaturan->toleransi_menit;

        if ($menitTerlambat <= 0) {
            return 0;
        }

        $jamTerlambat = (int) ceil($menitTerlambat / 60);

        return $jamTerlambat * $pengaturan->denda_per_jam;
    }
}