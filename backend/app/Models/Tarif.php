<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarif extends Model
{
    use HasFactory;

    protected $table = 'tb_tarif';
    protected $primaryKey = 'id_tarif';

    // Tabel ini tidak punya created_at/updated_at
    public $timestamps = false;

    protected $fillable = [
        'jenis_kendaraan',
        'tarif_per_jam',
    ];

    protected $casts = [
        'tarif_per_jam' => 'decimal:0',
    ];

    /* ==========================================================
     * RELASI
     * ========================================================== */

    // Satu tarif dipakai di banyak transaksi
    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'id_tarif', 'id_tarif');
    }
}
