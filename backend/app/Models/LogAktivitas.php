<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogAktivitas extends Model
{
    use HasFactory;

    protected $table = 'tb_log_aktivitas';
    protected $primaryKey = 'id_log';

    public $timestamps = false;

    protected $fillable = [
        'id_user',
        'aktivitas',
        'waktu_aktivitas',
    ];

    protected $casts = [
        'waktu_aktivitas' => 'datetime',
    ];

    /* ==========================================================
     * RELASI
     * ========================================================== */

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    /* ==========================================================
     * HELPER
     * ========================================================== */

    // Shortcut untuk mencatat log baru dari mana saja
    // Contoh: LogAktivitas::catat(auth()->id(), 'Login sebagai admin');
    public static function catat(int $idUser, string $aktivitas): self
    {
        return self::create([
            'id_user'         => $idUser,
            'aktivitas'       => $aktivitas,
            'waktu_aktivitas' => now(),
        ]);
    }
}
