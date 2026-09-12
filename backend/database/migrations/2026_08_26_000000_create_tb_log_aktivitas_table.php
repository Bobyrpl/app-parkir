<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_log_aktivitas', function (Blueprint $table) {
            $table->id('id_log');
            $table->unsignedBigInteger('id_user')->nullable();
            $table->string('aktivitas');
            $table->dateTime('waktu_aktivitas');

            $table->foreign('id_user')->references('id_user')->on('tb_user')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_log_aktivitas');
    }
};
