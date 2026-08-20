<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AreaParkir extends Model
{
    use HasFactory;

    protected $table = 'tb_area_parkir';
    protected $primaryKey = 'id_area';

    public $timestamps = false;

    protected $fillable = [
        'nama_area',
        'kapasitas',
        'terisi',
    ];

    /* ==========================================================
     * RELASI
     * ========================================================== */

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'id_area', 'id_area');
    }

    /* ==========================================================
     * HELPER
     * ========================================================== */

    // Cek apakah area masih ada slot kosong
    public function isPenuh(): bool
    {
        return $this->terisi >= $this->kapasitas;
    }

    // Sisa slot kosong di area ini
    public function getSisaSlotAttribute(): int
    {
        return max(0, $this->kapasitas - $this->terisi);
    }
}
