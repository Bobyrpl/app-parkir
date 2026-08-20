<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Tabel pengaturan denda keterlambatan booking. Sengaja dibuat sebagai
    // tabel "single row config" (selalu cuma 1 baris, id_pengaturan = 1)
    // supaya gampang dibaca/diupdate lewat 1 endpoint, sama seperti pola
    // pengaturan aplikasi pada umumnya - bukan daftar/CRUD banyak baris.
    //
    // Dengan tabel ini, denda booking TIDAK LAGI diinput manual oleh
    // petugas di halaman Kendaraan Keluar. Backend yang hitung otomatis:
    // (jam keterlambatan setelah dikurangi toleransi) x denda_per_jam.
    // Lihat Transaksi::hitungDenda() & TransaksiController::kendaraanKeluar().
    public function up(): void
    {
        Schema::create('tb_pengaturan_denda', function (Blueprint $table) {
            $table->id('id_pengaturan');
            $table->unsignedBigInteger('denda_per_jam')->default(0);
            $table->unsignedInteger('toleransi_menit')->default(15);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // Seed 1 baris default supaya aplikasi tetap jalan tanpa admin harus
        // buka halaman pengaturan dulu (denda_per_jam 0 = tidak ada denda
        // sampai admin mengatur nominalnya).
        DB::table('tb_pengaturan_denda')->insert([
            'id_pengaturan'   => 1,
            'denda_per_jam'   => 0,
            'toleransi_menit' => 15,
            'aktif'           => true,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_pengaturan_denda');
    }
};
