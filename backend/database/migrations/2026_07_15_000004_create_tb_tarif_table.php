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
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_tarif');
    }
};
