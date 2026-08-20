<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_booking', function (Blueprint $table) {
            $table->id('id_booking');

            // pelanggan yang membuat booking
            $table->foreignId('id_user')->constrained('tb_user', 'id_user')->cascadeOnDelete();
            $table->foreignId('id_kendaraan')->constrained('tb_kendaraan', 'id_kendaraan');
            $table->foreignId('id_area')->constrained('tb_area_parkir', 'id_area');
            $table->foreignId('id_tarif')->constrained('tb_tarif', 'id_tarif');

            $table->date('tanggal_rencana');
            $table->time('jam_rencana_masuk');
            $table->time('jam_rencana_keluar')->nullable();

            // kode unik yang ditunjukkan pelanggan ke petugas saat tiba di lokasi
            $table->string('kode_booking', 20)->unique();

            // menunggu -> dikonfirmasi -> selesai (sudah jadi transaksi nyata)
            //          -> dibatalkan (dibatalkan pelanggan/ditolak petugas)
            //          -> kadaluarsa (lewat batas waktu, otomatis via scheduler)
            $table->enum('status', ['menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan', 'kadaluarsa'])
                ->default('menunggu');

            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_booking');
    }
};
