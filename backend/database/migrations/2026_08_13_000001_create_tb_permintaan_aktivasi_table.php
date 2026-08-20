<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel permintaan aktivasi ulang akun yang statusnya dinonaktifkan admin.
 * Diisi lewat halaman publik "Ajukan Aktivasi Akun" (lihat PermintaanAktivasiController),
 * lalu ditinjau admin di menu Permintaan Aktivasi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_permintaan_aktivasi', function (Blueprint $table) {
            $table->id('id_permintaan');

            // Username persis seperti yang diketik user saat mengajukan.
            $table->string('username', 50);

            // Relasi ke akun yang dimaksud (kalau usernamenya valid & ditemukan).
            // nullOnDelete supaya riwayat pengajuan tetap ada walau akunnya
            // suatu saat benar-benar dihapus permanen.
            $table->foreignId('id_user')->nullable()
                ->constrained('tb_user', 'id_user')->nullOnDelete();

            // Pesan/alasan tambahan dari pemohon, opsional.
            $table->text('catatan')->nullable();

            // menunggu -> disetujui (akun diaktifkan lagi) / ditolak
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])->default('menunggu');

            // Catatan balasan admin saat menyetujui/menolak, opsional.
            $table->text('catatan_admin')->nullable();

            $table->foreignId('diproses_oleh')->nullable()
                ->constrained('tb_user', 'id_user')->nullOnDelete();
            $table->timestamp('diproses_pada')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_permintaan_aktivasi');
    }
};
