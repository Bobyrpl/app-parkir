<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_user', function (Blueprint $table) {
            $table->id('id_user');
            $table->string('nama_lengkap', 50);
            $table->string('username', 50);
            $table->string('no_telp', 20);
            $table->string('password');
            $table->string('passkey_token')->nullable();
            $table->enum('role', ['admin', 'owner', 'petugas', 'pelanggan'])->default('pelanggan');
            $table->string('foto_profil')->nullable();
            $table->string('foto_profil_public_id')->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_user');
    }
};
