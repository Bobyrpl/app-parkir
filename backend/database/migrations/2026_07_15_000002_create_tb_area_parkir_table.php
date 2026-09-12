<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_area_parkir', function (Blueprint $table) {
            $table->id('id_area');
            $table->string('nama_area', 50);
            $table->unsignedInteger('kapasitas');
            $table->unsignedInteger('terisi')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_area_parkir');
    }
};
