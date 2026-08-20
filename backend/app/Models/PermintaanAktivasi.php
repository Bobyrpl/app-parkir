<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermintaanAktivasi extends Model
{
    use HasFactory;

    protected $table = 'tb_permintaan_aktivasi';
    protected $primaryKey = 'id_permintaan';

    protected $fillable = [
        'username',
        'id_user',
        'catatan',
        'status',
        'catatan_admin',
        'diproses_oleh',
        'diproses_pada',
    ];

    protected $casts = [
        'diproses_pada' => 'datetime',
    ];

    /* ==========================================================
     * RELASI
     * ========================================================== */

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function diprosesOleh()
    {
        return $this->belongsTo(User::class, 'diproses_oleh', 'id_user');
    }
}