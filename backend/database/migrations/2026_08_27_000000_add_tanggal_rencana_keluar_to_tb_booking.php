<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Sebelumnya booking cuma punya SATU tanggal (tanggal_rencana) + jam masuk/keluar,
// jadi booking multi-hari (mis. masuk tgl 1, keluar tgl 8) tidak bisa
// direpresentasikan dengan benar - jam_rencana_keluar selalu dianggap di
// HARI YANG SAMA dengan tanggal_rencana. Kolom ini menambahkan tanggal keluar
// yang terpisah, supaya durasi booking multi-hari dihitung dengan benar
// (lihat Transaksi::hitungDenda()).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_booking', function (Blueprint $table) {
            $table->date('tanggal_rencana_keluar')->nullable()->after('tanggal_rencana');
        });
    }

    public function down(): void
    {
        Schema::table('tb_booking', function (Blueprint $table) {
            $table->dropColumn('tanggal_rencana_keluar');
        });
    }
};
