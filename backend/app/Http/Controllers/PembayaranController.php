<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Services\DanaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class PembayaranController extends Controller
{
    public function __construct(private DanaService $dana)
    {
    }

    /**
     * Generate QR code QRIS (lewat DANA Bisnis) untuk sebuah transaksi
     * kendaraan keluar. Dipanggil saat petugas memilih metode bayar "QRIS".
     *
     * Berbeda dari Midtrans, DANA tidak mengembalikan URL gambar QR --
     * yang dikembalikan adalah string mentah QRIS (qr_content). Frontend
     * yang merender string ini jadi gambar QR (lihat ModalQris.jsx).
     */
    public function generateQris(int $id): JsonResponse
    {
        $transaksi = Transaksi::findOrFail($id);

        if ($transaksi->status_pembayaran === 'lunas') {
            return response()->json(['message' => 'Transaksi sudah lunas.'], 422);
        }

        // partnerReferenceNo harus unik per percobaan pembayaran, jadi
        // disisipkan timestamp. Format ini juga dipakai webhook untuk
        // mencocokkan notifikasi dengan transaksi terkait.
        $orderId = 'PARKIR-' . $transaksi->id_parkir . '-' . time();

        try {
            $hasil = $this->dana->generateQris($orderId, (int) $transaksi->biaya_total);
        } catch (Throwable $e) {
            Log::error('DANA generate QRIS gagal: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal membuat QR pembayaran. Coba lagi.'], 502);
        }

        $transaksi->update([
            'metode_bayar' => 'qris',
            'status_pembayaran' => 'menunggu',
            'qris_ref_id' => $hasil['reference_no'],
        ]);

        return response()->json([
            'qr_content' => $hasil['qr_content'],
            'order_id' => $orderId,
        ]);
    }

    /**
     * Dipanggil frontend secara berkala (polling) untuk membaca status
     * pembayaran TERKINI DARI DATABASE. Endpoint ini tidak menghubungi
     * DANA langsung -- status diperbarui oleh webhook (lihat
     * WebhookDanaController), sehingga endpoint ini ringan dan aman
     * untuk dipanggil tiap beberapa detik.
     */
    public function cekStatus(int $id): JsonResponse
    {
        $transaksi = Transaksi::findOrFail($id);

        return response()->json([
            'status_pembayaran' => $transaksi->status_pembayaran,
            'metode_bayar' => $transaksi->metode_bayar,
        ]);
    }

    /**
     * Tombol darurat khusus untuk demo/testing saat koneksi ke DANA
     * atau webhook bermasalah (mis. saat sidang UKK tanpa internet stabil).
     * SEBAIKNYA disembunyikan di balik flag env APP_DEMO_MODE dan/atau
     * middleware role admin, JANGAN dibiarkan aktif di production nyata.
     */
    public function tandaiLunasManual(int $id): JsonResponse
    {
        if (!config('app.demo_mode', false)) {
            return response()->json(['message' => 'Fitur ini hanya aktif dalam mode demo.'], 403);
        }

        $transaksi = Transaksi::findOrFail($id);
        $transaksi->update(['status_pembayaran' => 'lunas']);

        return response()->json(['message' => 'Ditandai lunas secara manual (mode demo).']);
    }
}