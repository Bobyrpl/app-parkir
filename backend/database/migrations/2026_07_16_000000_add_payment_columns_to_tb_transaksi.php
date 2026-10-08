<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom untuk mendukung metode pembayaran cash & QRIS
     * pada tabel tb_transaksi.
     *
     * - metode_bayar     : cash atau qris, diisi saat petugas memproses kendaraan keluar
     * - status_pembayaran: default 'lunas' supaya transaksi cash (dan data lama) tidak
     *                      perlu migrasi manual. Untuk QRIS, controller akan mengubahnya
     *                      jadi 'menunggu' sampai webhook DANA konfirmasi sukses.
     * - qris_ref_id      : referenceNo dari DANA, dipakai untuk pencocokan saat
     *                      webhook masuk dan untuk audit/troubleshooting.
     */
    public function up(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            $table->enum('metode_bayar', ['cash', 'qris'])->nullable()->after('biaya_total');
            $table->enum('status_pembayaran', ['menunggu', 'lunas'])->default('lunas')->after('metode_bayar');
            $table->string('qris_ref_id')->nullable()->after('status_pembayaran');
        });
    }

    public function down(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            $table->dropColumn(['metode_bayar', 'status_pembayaran', 'qris_ref_id']);
        });
    }
};
