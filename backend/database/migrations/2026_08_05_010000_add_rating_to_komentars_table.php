<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('komentars', function (Blueprint $table) {
            // Rating bintang 1-5 yang diisi pengguna saat mengirim komentar.
            // Default 5 supaya data lama (sebelum kolom ini ada) tetap valid.
            $table->unsignedTinyInteger('rating')->default(5)->after('teks');
        });
    }

    public function down(): void
    {
        Schema::table('komentars', function (Blueprint $table) {
            $table->dropColumn('rating');
        });
    }
};
