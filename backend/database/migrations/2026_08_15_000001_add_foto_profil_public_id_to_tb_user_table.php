<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_user', function (Blueprint $table) {
            // ID unik file di Cloudinary, dipakai buat hapus foto lama
            // saat user ganti foto (biar tidak menumpuk sampah di akun Cloudinary).
            $table->string('foto_profil_public_id')->nullable()->after('foto_profil');
        });
    }

    public function down(): void
    {
        Schema::table('tb_user', function (Blueprint $table) {
            $table->dropColumn('foto_profil_public_id');
        });
    }
};
