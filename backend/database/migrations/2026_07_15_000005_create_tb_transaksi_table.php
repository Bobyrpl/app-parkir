<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_transaksi', function (Blueprint $table) {
            $table->id('id_parkir');
            $table->unsignedBigInteger('id_kendaraan');
            $table->dateTime('waktu_masuk');
            $table->dateTime('waktu_keluar')->nullable();
            $table->unsignedBigInteger('id_tarif');
            $table->unsignedInteger('durasi_jam')->default(0);
            $table->decimal('biaya_total', 10, 0)->default(0);
            $table->enum('status', ['masuk', 'keluar'])->default('masuk');
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_area');

            $table->foreign('id_kendaraan')->references('id_kendaraan')->on('tb_kendaraan');
            $table->foreign('id_tarif')->references('id_tarif')->on('tb_tarif');
            $table->foreign('id_user')->references('id_user')->on('tb_user');
            $table->foreign('id_area')->references('id_area')->on('tb_area_parkir');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_transaksi');
    }
};
