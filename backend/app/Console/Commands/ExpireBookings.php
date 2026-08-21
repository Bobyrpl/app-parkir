<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\LogAktivitas;
use App\Models\Transaksi;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ExpireBookings extends Command
{
    /**
     * Booking yang sudah "dikonfirmasi" tapi kendaraannya tidak kunjung
     * masuk ke area parkir dalam sekian hari SETELAH tanggal_rencana,
     * otomatis ditandai "kadaluarsa".
     *
     * Contoh: tanggal_rencana = 1 Agustus, toleransi = 2 hari ->
     * kalau sampai 3 Agustus kendaraan belum tercatat masuk, booking
     * ditandai kadaluarsa.
     */
    private const TOLERANSI_HARI = 2;

    protected $signature = 'booking:expire';

    protected $description = 'Tandai booking parkir yang sudah dikonfirmasi tapi kendaraan tidak kunjung masuk sebagai kadaluarsa';

    public function handle(): int
    {
        // Batas: tanggal_rencana + toleransi hari harus sudah lewat dari hari ini.
        $batasTanggal = Carbon::today()->subDays(self::TOLERANSI_HARI);

        // Kendaraan yang SEDANG di area parkir sekarang, dicek lewat id_kendaraan -
        // BUKAN lewat relasi booking->transaksi. Ini sengaja, karena kendaraan
        // bisa saja sudah dicatat masuk oleh petugas TANPA di-link ke booking-nya
        // (mis. petugas lupa/tidak sempat cari kode booking saat check-in).
        // Kalau kita cuma cek booking->transaksi, kasus itu akan salah dianggap
        // "belum masuk" dan booking-nya ke-expire padahal kendaraannya sudah
        // fisik ada di dalam - akibatnya nanti tidak ketemu saat petugas coba
        // proses keluar lewat cari kode booking.
        $idKendaraanSedangParkir = Transaksi::where('status', 'masuk')
            ->pluck('id_kendaraan')
            ->all();

        $booking = Booking::where('status', 'dikonfirmasi')
            ->whereNotNull('tanggal_rencana')
            ->whereDate('tanggal_rencana', '<=', $batasTanggal)
            ->get()
            ->filter(function (Booking $b) use ($idKendaraanSedangParkir) {
                // Kalau kendaraannya sedang parkir (siapa pun yang mencatatnya
                // masuk, terhubung ke booking ini atau tidak), jangan diexpire -
                // biarkan alurnya lanjut sampai selesai (lihat TransaksiController).
                return ! in_array($b->id_kendaraan, $idKendaraanSedangParkir, true);
            });

        foreach ($booking as $b) {
            $kodeBooking = $b->kode_booking;
            $tanggalRencana = $b->tanggal_rencana->format('d-m-Y');
            $b->update(['status' => 'kadaluarsa']);

            // PENTING: cek dulu apakah LogAktivitas::catat() menerima id_user = null.
            // Command ini jalan otomatis lewat scheduler, jadi tidak ada user yang login.
            // Kalau method itu mewajibkan id_user (mis. buat foreign key NOT NULL),
            // hapus/comment 3 baris LogAktivitas ini supaya command tidak error.
            LogAktivitas::catat(
                null,
                "Booking {$kodeBooking} otomatis ditandai kadaluarsa (kendaraan tidak masuk dalam " . self::TOLERANSI_HARI . " hari setelah tanggal rencana {$tanggalRencana})"
            );
        }

        $jumlah = $booking->count();
        $this->info("Booking ditandai kadaluarsa: {$jumlah}");

        return self::SUCCESS;
    }
}