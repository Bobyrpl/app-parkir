<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'tb_user';
protected $primaryKey = 'id_user';
public $timestamps = false;   // <-- TAMBAHKAN BARIS INI
    protected $fillable = [
        'nama_lengkap',
        'username',
        'no_telp',
        'password',
        'passkey_token',
        'role',
        'status_aktif',
        'foto_profil',
        'foto_profil_public_id',
    ];

    // Kolom yang disembunyikan saat model di-convert ke JSON/array
    protected $hidden = [
        'password',
        'passkey_token',
    ];

    protected $casts = [
        'status_aktif' => 'boolean',
        'password'     => 'hashed', // otomatis di-hash saat diisi (Laravel 10+)
    ];

    // Otomatis ikut nempel di setiap response JSON user, walau kolomnya sendiri
    // ('foto_profil') cuma menyimpan path relatif, bukan URL lengkap.
    protected $appends = ['foto_profil_url'];

    /**
     * URL lengkap foto profil (siap dipakai langsung di <img src="">).
     * Kolom foto_profil sekarang langsung menyimpan URL Cloudinary yang
     * sudah lengkap, jadi tinggal dikembalikan apa adanya. Null kalau
     * user belum pernah upload foto.
     */
    public function getFotoProfilUrlAttribute(): ?string
    {
        return $this->foto_profil;
    }

    // Laravel Sanctum pakai kolom "username" bukan "email" untuk login,
    // jadi override getAuthPassword() tidak perlu diubah, hanya field login-nya
    // yang diatur di AuthController nanti (pakai username, bukan email).

    /* ==========================================================
     * RELASI
     * ========================================================== */

    // Satu user (petugas) bisa mendaftarkan banyak kendaraan
    public function kendaraan()
    {
        return $this->hasMany(Kendaraan::class, 'id_user', 'id_user');
    }

    // Satu user (petugas) bisa membuat banyak transaksi
    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'id_user', 'id_user');
    }

    // Satu user punya banyak log aktivitas
    public function logAktivitas()
    {
        return $this->hasMany(LogAktivitas::class, 'id_user', 'id_user');
    }

    // Satu pelanggan bisa membuat banyak booking parkir
    public function booking()
    {
        return $this->hasMany(Booking::class, 'id_user', 'id_user');
    }

    /* ==========================================================
     * HELPER ROLE (buat cek hak akses di controller/middleware)
     * ========================================================== */

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPetugas(): bool
    {
        return $this->role === 'petugas';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isPelanggan(): bool
    {
        return $this->role === 'pelanggan';
    }
}