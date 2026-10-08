<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Catatan: seeder bawaan Laravel (User::factory()->create([...]))
     * sengaja dihapus, karena kolomnya (name, email) tidak cocok dengan
     * skema tb_user yang dipakai aplikasi ini (nama_lengkap, username,
     * no_telp, role, dst). Dipindah ke TbUserSeeder yang sesuai skema asli.
     */
    public function run(): void
    {
        $this->call(TbUserSeeder::class);
    }
}
