<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Membuat object database (FUNCTION, TRIGGER, STORED PROCEDURE)
     * yang dipakai untuk transaksi parkir:
     *
     * - fn_hitung_biaya_parkir     : FUNCTION hitung biaya (dipanggil dari
     *                                Transaksi::hitungBiayaKeluar())
     * - trg_transaksi_masuk_update_area  : TRIGGER, nambah slot terisi
     *                                      saat kendaraan masuk
     * - trg_transaksi_keluar_update_area : TRIGGER, kurangi slot terisi
     *                                      saat kendaraan keluar
     * - sp_rekap_periode           : STORED PROCEDURE, rincian harian
     *                                (dipanggil dari TransaksiController::rekap)
     */
    public function up(): void
    {
        // -----------------------------------------------------
        // FUNCTION: fn_hitung_biaya_parkir
        // Hitung biaya = jam (dibulatkan ke atas, minimal 1) x tarif/jam
        // -----------------------------------------------------
        DB::unprepared('DROP FUNCTION IF EXISTS fn_hitung_biaya_parkir');
        DB::unprepared('
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

                SET v_menit = TIMESTAMPDIFF(MINUTE, p_waktu_masuk, p_waktu_keluar);
                SET v_jam = CEIL(v_menit / 60);

                IF v_jam < 1 THEN
                    SET v_jam = 1;
                END IF;

                RETURN v_jam * p_tarif_per_jam;
            END
        ');

        // -----------------------------------------------------
        // TRIGGER: update kapasitas (terisi) di tb_area_parkir
        // otomatis setiap ada transaksi masuk / keluar
        // -----------------------------------------------------
        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_masuk_update_area');
        DB::unprepared('
            CREATE TRIGGER trg_transaksi_masuk_update_area
            AFTER INSERT ON tb_transaksi
            FOR EACH ROW
            BEGIN
                IF NEW.status = "masuk" THEN
                    UPDATE tb_area_parkir
                    SET terisi = terisi + 1
                    WHERE id_area = NEW.id_area;
                END IF;
            END
        ');

        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_keluar_update_area');
        DB::unprepared('
            CREATE TRIGGER trg_transaksi_keluar_update_area
            AFTER UPDATE ON tb_transaksi
            FOR EACH ROW
            BEGIN
                IF OLD.status = "masuk" AND NEW.status = "keluar" THEN
                    UPDATE tb_area_parkir
                    SET terisi = terisi - 1
                    WHERE id_area = NEW.id_area;
                END IF;
            END
        ');

        // -----------------------------------------------------
        // STORED PROCEDURE: sp_rekap_periode
        // Rincian transaksi per hari dalam rentang tanggal tertentu
        // (dipakai owner untuk lihat rekap harian)
        // -----------------------------------------------------
        DB::unprepared('DROP PROCEDURE IF EXISTS sp_rekap_periode');
        DB::unprepared('
            CREATE PROCEDURE sp_rekap_periode(
                IN p_dari DATE,
                IN p_sampai DATE
            )
            BEGIN
                SELECT
                    DATE(waktu_masuk)    AS tanggal,
                    DAYNAME(waktu_masuk) AS hari,
                    COUNT(*)             AS jumlah_transaksi,
                    SUM(biaya_total)     AS total_pendapatan
                FROM tb_transaksi
                WHERE status = "keluar"
                  AND waktu_masuk BETWEEN CONCAT(p_dari, " 00:00:00") AND CONCAT(p_sampai, " 23:59:59")
                GROUP BY DATE(waktu_masuk), DAYNAME(waktu_masuk)
                ORDER BY tanggal;
            END
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP PROCEDURE IF EXISTS sp_rekap_periode');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_keluar_update_area');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_transaksi_masuk_update_area');
        DB::unprepared('DROP FUNCTION IF EXISTS fn_hitung_biaya_parkir');
    }
};
