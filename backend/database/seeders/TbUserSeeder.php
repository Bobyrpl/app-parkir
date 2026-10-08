<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

// Seeder ini menggantikan akun bawaan Laravel (yang salah kolom, tidak
// cocok dengan skema tb_user aplikasi ini). Dipakai kalau kamu migrate
// ke database KOSONG (tanpa import dump db_parkir.sql) dan butuh akun
// buat login pertama kali.
//
// PENTING: ganti/hapus akun ini setelah setup awal kalau project ini
// bakal dipakai beneran (bukan cuma development).
class TbUserSeeder extends Seeder
{
    public function run(): void
    {
        $akun = [
            [
                'nama_lengkap' => 'Administrator',
                'username'     => 'admin',
                'no_telp'      => '081100000001',
                'password'     => 'admin123',
                'role'         => 'admin',
            ],
            [
                'nama_lengkap' => 'Pemilik Usaha',
                'username'     => 'owner',
                'no_telp'      => '081100000002',
                'password'     => 'owner123',
                'role'         => 'owner',
            ],
            [
                'nama_lengkap' => 'Petugas Parkir',
                'username'     => 'petugas',
                'no_telp'      => '081100000003',
                'password'     => 'petugas123',
                'role'         => 'petugas',
            ],
            [
                'nama_lengkap' => 'Pelanggan Contoh',
                'username'     => 'pelanggan',
                'no_telp'      => '081100000004',
                'password'     => 'pelanggan123',
                'role'         => 'pelanggan',
            ],
        ];

        foreach ($akun as $data) {
            User::firstOrCreate(
                ['username' => $data['username']],
                $data + ['status_aktif' => true]
            );
        }
    }
}
