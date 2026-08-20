<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            // Denda keterlambatan booking (kendaraan keluar melewati
            // jam_rencana_keluar). Diisi manual oleh petugas saat kendaraan
            // keluar - 0 kalau bukan dari booking / tidak terlambat.
            // Nilai ini SUDAH ikut dijumlahkan ke biaya_total (lihat
            // TransaksiController::kendaraanKeluar), kolom ini disimpan
            // terpisah hanya supaya rinciannya tetap bisa ditampilkan
            // di struk & laporan.
            $table->unsignedBigInteger('denda')->default(0)->after('biaya_total');
        });
    }

    public function down(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            $table->dropColumn('denda');
        });
    }
};
