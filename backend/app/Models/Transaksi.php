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
        'midtrans_order_id',
        'midtrans_payment_type',
        'midtrans_status',
        'midtrans_snap_token',
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

    //
    //  {#300,17}
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

        $tanggalKeluar = $booking->tanggal_rencana_keluar ?? $booking->tanggal_rencana;
        $rencanaKeluar = Carbon::parse($tanggalKeluar->format('Y-m-d') . ' ' . $booking->jam_rencana_keluar);
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
