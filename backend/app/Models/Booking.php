<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory;

    protected $table = 'tb_booking';
    protected $primaryKey = 'id_booking';

    protected $fillable = [
        'id_user',
        'id_kendaraan',
        'id_area',
        'id_tarif',
        'tanggal_rencana',
        'jam_rencana_masuk',
        'jam_rencana_keluar',
        'kode_booking',
        'status',
        'catatan',
    ];

    protected $casts = [
        'tanggal_rencana' => 'date',
    ];

    /* ==========================================================
     * RELASI
     * ========================================================== */

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function kendaraan()
    {
        return $this->belongsTo(Kendaraan::class, 'id_kendaraan', 'id_kendaraan');
    }

    public function area()
    {
        return $this->belongsTo(AreaParkir::class, 'id_area', 'id_area');
    }

    public function tarif()
    {
        return $this->belongsTo(Tarif::class, 'id_tarif', 'id_tarif');
    }

    public function transaksi()
    {
        return $this->hasOne(Transaksi::class, 'id_booking', 'id_booking');
    }

    /* ==========================================================
     * HELPER
     * ========================================================== */

    // Kode booking unik, contoh: BKG-7F3K9A
    public static function buatKodeBooking(): string
    {
        do {
            $kode = 'BKG-' . strtoupper(Str::random(6));
        } while (self::where('kode_booking', $kode)->exists());

        return $kode;
    }

    // Booking masih boleh dibatalkan selama statusnya menunggu/dikonfirmasi
    // DAN kendaraannya belum benar-benar masuk ke area parkir. Begitu
    // kendaraan sudah dicatat masuk (Transaksi status 'masuk'), booking
    // tidak boleh dibatalkan lagi meskipun status booking masih
    // 'dikonfirmasi' (statusnya baru berubah jadi 'selesai' saat kendaraan
    // keluar - lihat TransaksiController::kendaraanKeluar).
    public function isBisaDibatalkan(): bool
    {
        if (! in_array($this->status, ['menunggu', 'dikonfirmasi'])) {
            return false;
        }

        return $this->transaksi?->status !== 'masuk';
    }
}