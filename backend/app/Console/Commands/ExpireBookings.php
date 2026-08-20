<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\LogAktivitas;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ExpireBookings extends Command
{
    /**
     * Booking (menunggu / dikonfirmasi) yang jam rencana masuknya sudah
     * lewat lebih dari batas toleransi ini otomatis ditandai "kadaluarsa".
     */
    private const TOLERANSI_MENIT = 60;

    protected $signature = 'booking:expire';

    protected $description = 'Tandai booking parkir yang sudah lewat waktu tanpa kedatangan sebagai kadaluarsa';

    public function handle(): int
    {
        $batas = Carbon::now()->subMinutes(self::TOLERANSI_MENIT);

        $booking = Booking::whereIn('status', ['menunggu', 'dikonfirmasi'])
            ->whereNotNull('tanggal_rencana')
            ->whereNotNull('jam_rencana_masuk')
            ->get()
            ->filter(function (Booking $b) use ($batas) {
                try {
                    $waktuRencana = Carbon::parse(
                        $b->tanggal_rencana->format('Y-m-d') . ' ' . $b->jam_rencana_masuk
                    );
                    return $waktuRencana->lt($batas);
                } catch (\Throwable $e) {
                    // Data tanggal/jam tidak valid - lewati baris ini saja,
                    // jangan sampai menghentikan seluruh proses expire.
                    $this->warn("Booking #{$b->id_booking} dilewati: format tanggal/jam tidak valid.");
                    return false;
                }
            });

        foreach ($booking as $b) {
            $kodeBooking = $b->kode_booking;
            $b->update(['status' => 'kadaluarsa']);

            // PENTING: cek dulu apakah LogAktivitas::catat() menerima id_user = null.
            // Command ini jalan otomatis lewat scheduler, jadi tidak ada user yang login.
            // Kalau method itu mewajibkan id_user (mis. buat foreign key NOT NULL),
            // hapus/comment 3 baris LogAktivitas ini supaya command tidak error.
            LogAktivitas::catat(
                null,
                "Booking {$kodeBooking} otomatis ditandai kadaluarsa (lewat " . self::TOLERANSI_MENIT . " menit tanpa kedatangan)"
            );
        }

        $jumlah = $booking->count();
        $this->info("Booking ditandai kadaluarsa: {$jumlah}");

        return self::SUCCESS;
    }
}