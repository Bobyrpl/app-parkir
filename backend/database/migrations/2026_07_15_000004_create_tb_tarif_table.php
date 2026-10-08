<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_tarif', function (Blueprint $table) {
            $table->id('id_tarif');
            $table->string('jenis_kendaraan', 30);
            $table->decimal('tarif_per_jam', 10, 0);
        });

        // Data awal tarif (sesuai data production).
        \Illuminate\Support\Facades\DB::table('tb_tarif')->insert([
            ['jenis_kendaraan' => 'motor', 'tarif_per_jam' => 2000],
            ['jenis_kendaraan' => 'mobil', 'tarif_per_jam' => 5000],
            ['jenis_kendaraan' => 'bus', 'tarif_per_jam' => 10000],
            ['jenis_kendaraan' => 'truk', 'tarif_per_jam' => 10000],
            ['jenis_kendaraan' => 'lainnya', 'tarif_per_jam' => 3000],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_tarif');
    }
};
