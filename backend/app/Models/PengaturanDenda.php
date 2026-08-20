<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengaturanDenda extends Model
{
    protected $table = 'tb_pengaturan_denda';
    protected $primaryKey = 'id_pengaturan';

    protected $fillable = [
        'denda_per_jam',
        'toleransi_menit',
        'aktif',
    ];

    protected $casts = [
        'denda_per_jam'   => 'integer',
        'toleransi_menit' => 'integer',
        'aktif'           => 'boolean',
    ];

    // Selalu ada (dan cuma ada) 1 baris pengaturan, id_pengaturan = 1.
    // Helper ini yang dipakai di seluruh aplikasi supaya tidak ada tempat
    // lain yang perlu tahu/asumsi soal id-nya - kalau baris itu somehow
    // belum ada (migration lama/database fresh tanpa seed), otomatis
    // dibuatkan dengan nilai default (tidak ada denda) daripada error.
    public static function ambil(): self
    {
        return self::firstOrCreate(
            ['id_pengaturan' => 1],
            ['denda_per_jam' => 0, 'toleransi_menit' => 15, 'aktif' => true]
        );
    }
}