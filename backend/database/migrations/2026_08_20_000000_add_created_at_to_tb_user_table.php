<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Tambah kolom created_at ke tb_user supaya tanggal registrasi user bisa
// dilacak (dipakai untuk grafik "user baru per hari" di dashboard owner).
// Tidak menambah updated_at karena tidak dibutuhkan di mana pun saat ini.
//
// CATATAN: user yang SUDAH ADA sebelum migration ini dijalankan akan
// otomatis diisi created_at = waktu migration dijalankan (bukan tanggal
// registrasi aslinya, karena data itu tidak pernah tercatat).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_user', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable()->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::table('tb_user', function (Blueprint $table) {
            $table->dropColumn('created_at');
        });
    }
};
