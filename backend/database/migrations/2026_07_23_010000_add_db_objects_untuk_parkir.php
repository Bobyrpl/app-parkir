<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Menambahkan objek-objek database tingkat lanjut untuk Aplikasi Parkir:
 * - FUNCTION  fn_hitung_biaya_parkir  : hitung biaya parkir berdasar durasi & tarif
 * - TRIGGER   trg_transaksi_masuk_update_area  : otomatis tambah slot terisi saat kendaraan masuk
 * - TRIGGER   trg_transaksi_keluar_update_area : otomatis kurangi slot terisi saat kendaraan keluar
 * - PROCEDURE sp_rekap_periode : rekap transaksi per hari untuk rentang tanggal tertentu
 */
return new class extends Migration
{
    public function up(): void
    {
        // ---------------------------------------------------------
        // FUNCTION: fn_hitung_biaya_parkir
        // ---------------------------------------------------------
        DB::unprepared('DROP FUNCTION IF EXISTS fn_hitung_biaya_parkir');
        DB::unprepared("
            CREATE FUNCTION fn_hitung_biaya_parkir(
                p_waktu_masuk DATETIME,
                p_waktu_keluar DATETIME,
                p_tarif_per_jam DECIMAL(10,0)
            )
            RETURNS DECIMAL(10,0)
            DETERMINISTIC
            BEGIN
                DECLARE v_menit INT;
                DECLARE v_jam INT;
                DECLARE v_biaya DECIMAL(10,0);

                SET v_menit = TIMESTAMPDIFF(MINUTE, p_waktu_masuk, p_waktu_keluar);
                IF v_menit < 0 THEN
                    SET v_menit = 0;
                END IF;

                -- Dibulatkan ke atas per jam, minimal 1 jam
                SET v_jam = CEIL(v_menit / 60);
                IF v_jam < 1 THEN
                    SET v_jam = 1;
                END IF;

                SET v_biaya = v_jam * p_tarif_per_jam;
                RETURN v_biaya;
            END
        ");

        // ---------------------------------------------------------
        // TRIGGER: tambah slot terisi otomatis saat kendaraan masuk
        // ---------------------------------------------------------
        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_masuk_update_area');
        DB::unprepared("
            CREATE TRIGGER trg_transaksi_masuk_update_area
            AFTER INSERT ON tb_transaksi
            FOR EACH ROW
            BEGIN
                IF NEW.status = 'masuk' THEN
                    UPDATE tb_area_parkir
                    SET terisi = terisi + 1
                    WHERE id_area = NEW.id_area;
                END IF;
            END
        ");

        // ---------------------------------------------------------
        // TRIGGER: kurangi slot terisi otomatis saat kendaraan keluar
        // ---------------------------------------------------------
        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_keluar_update_area');
        DB::unprepared("
            CREATE TRIGGER trg_transaksi_keluar_update_area
            AFTER UPDATE ON tb_transaksi
            FOR EACH ROW
            BEGIN
                IF OLD.status = 'masuk' AND NEW.status = 'keluar' THEN
                    UPDATE tb_area_parkir
                    SET terisi = GREATEST(terisi - 1, 0)
                    WHERE id_area = NEW.id_area;
                END IF;
            END
        ");

        // ---------------------------------------------------------
        // PROCEDURE: rekap transaksi harian untuk rentang tanggal
        // ---------------------------------------------------------
        DB::unprepared('DROP PROCEDURE IF EXISTS sp_rekap_periode');
        DB::unprepared("
            CREATE PROCEDURE sp_rekap_periode(
                IN p_dari DATE,
                IN p_sampai DATE
            )
            BEGIN
                SELECT
                    DATE(waktu_keluar) AS tanggal,
                    COUNT(*) AS jumlah_transaksi,
                    SUM(biaya_total) AS pendapatan
                FROM tb_transaksi
                WHERE status = 'keluar'
                    AND DATE(waktu_keluar) BETWEEN p_dari AND p_sampai
                GROUP BY DATE(waktu_keluar)
                ORDER BY tanggal;
            END
        ");
    }

    public function down(): void
    {
        DB::unprepared('DROP PROCEDURE IF EXISTS sp_rekap_periode');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_keluar_update_area');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_masuk_update_area');
        DB::unprepared('DROP FUNCTION IF EXISTS fn_hitung_biaya_parkir');
    }
};
