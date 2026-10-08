<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// File ini sebelumnya KOSONG (0 byte) di repo asli GitHub - migration hilang
// isinya, cuma nama filenya saja yang ke-commit. Direkonstruksi berdasarkan
// pemakaian kolom 'balasan' & 'dibalas_pada' di KomentarController dan
// struktur tabel 'komentars' pada dump database production.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('komentars', function (Blueprint $table) {
            // Balasan admin untuk komentar pengunjung (nullable, dihapus
            // dengan cara diisi null lagi lewat KomentarController).
            $table->text('balasan')->nullable()->after('rating');
            $table->timestamp('dibalas_pada')->nullable()->after('balasan');
        });
    }

    public function down(): void
    {
        Schema::table('komentars', function (Blueprint $table) {
            $table->dropColumn(['balasan', 'dibalas_pada']);
        });
    }
};
