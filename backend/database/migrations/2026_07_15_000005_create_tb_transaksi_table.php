<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Skema dasar tb_transaksi saat pertama kali dibuat. Kolom-kolom lain
// (metode_bayar, status_pembayaran, id_booking, denda) ditambahkan belakangan
// lewat migration terpisah (lihat file dengan tanggal setelah ini), jadi
// sengaja TIDAK dimasukkan di sini supaya urutan migration tetap konsisten
// dengan riwayat aslinya.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_transaksi', function (Blueprint $table) {
            $table->id('id_parkir');
            $table->foreignId('id_kendaraan')->constrained('tb_kendaraan', 'id_kendaraan');
            $table->dateTime('waktu_masuk');
            $table->dateTime('waktu_keluar')->nullable();
            $table->foreignId('id_tarif')->constrained('tb_tarif', 'id_tarif');
            $table->unsignedInteger('durasi_jam')->default(0);
            $table->decimal('biaya_total', 10, 0)->default(0);
            $table->enum('status', ['masuk', 'keluar'])->default('masuk');
            $table->foreignId('id_user')->constrained('tb_user', 'id_user');
            $table->foreignId('id_area')->constrained('tb_area_parkir', 'id_area');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_transaksi');
    }
};
