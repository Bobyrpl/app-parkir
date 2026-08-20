<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            // diisi kalau transaksi ini berasal dari booking online (opsional)
            $table->foreignId('id_booking')
                ->nullable()
                ->after('id_area')
                ->constrained('tb_booking', 'id_booking')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tb_transaksi', function (Blueprint $table) {
            $table->dropConstrainedForeignId('id_booking');
        });
    }
};
