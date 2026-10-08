<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Migration ini sebelumnya hilang dari repo (tabel dipakai oleh
// App\Models\LogAktivitas tapi tidak pernah punya migration-nya sendiri).
// Direkonstruksi dari struktur yang dipakai model tersebut supaya
// `php artisan migrate` bisa jalan dari database kosong.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_log_aktivitas', function (Blueprint $table) {
            $table->id('id_log');
            $table->foreignId('id_user')->constrained('tb_user', 'id_user')->cascadeOnDelete();
            $table->string('aktivitas');
            $table->timestamp('waktu_aktivitas')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_log_aktivitas');
    }
};
