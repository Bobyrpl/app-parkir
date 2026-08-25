<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menghapus kolom qris_ref_id, sisa dari integrasi QRIS dinamis (DANA
 * Bisnis) yang sudah tidak dipakai -- sekarang QRIS memakai gambar statis
 * dan status pembayaran dikonfirmasi manual oleh petugas (lihat
 * PembayaranController::konfirmasiQris).
 *
 * metode_bayar & status_pembayaran TETAP dipakai untuk mencatat cara
 * bayar dan status lunas/menunggu.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            if (Schema::hasColumn('tb_transaksi', 'qris_ref_id')) {
                $table->dropColumn('qris_ref_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            $table->string('qris_ref_id')->nullable()->after('status_pembayaran');
        });
    }
};