<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_kendaraan', function (Blueprint $table) {
            $table->id('id_kendaraan');
            $table->string('plat_nomor', 20);
            $table->string('jenis_kendaraan', 30);
            $table->string('warna', 30)->nullable();
            $table->string('pemilik', 50)->nullable();
            $table->foreignId('id_user')
                ->nullable()
                ->constrained('tb_user', 'id_user')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_kendaraan');
    }
};
