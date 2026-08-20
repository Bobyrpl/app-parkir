<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Services\DanaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookDanaController extends Controller
{
    public function __construct(private DanaService $dana)
    {
    }

    /**
     * Endpoint publik yang didaftarkan sebagai "Payment Notification URL"
     * di DANA Business Dashboard (sandbox maupun production).
     *
     * PENTING: endpoint ini bisa diakses siapa saja di internet, jadi
     * signature WAJIB diverifikasi sebelum mempercayai isi notifikasi.
     * Jangan pernah update status_pembayaran tanpa lolos cek signature.
     */
    public function handle(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $timestamp = $request->header('X-TIMESTAMP', '');
        $signature = $request->header('X-SIGNATURE', '');

        $signatureValid = $this->dana->verifyCallbackSignature(
            'POST',
            '/api/webhook/dana',
            $rawBody,
            $timestamp,
            $signature
        );

        if (!$signatureValid) {
            Log::warning('Webhook DANA ditolak: signature tidak valid');
            return response()->json(['responseCode' => '4004701', 'responseMessage' => 'Invalid signature'], 403);
        }

        $orderId = $request->input('originalPartnerReferenceNo') ?? $request->input('partnerReferenceNo');
        $latestTransactionStatus = $request->input('latestTransactionStatus'); // "00" = sukses (lihat kode status DANA)

        // orderId dibuat dengan format PARKIR-{id_transaksi}-{timestamp}
        // saat generateQris(), jadi id transaksi bisa diambil dari situ.
        $idTransaksi = $orderId ? (int) (explode('-', $orderId)[1] ?? 0) : null;
        $transaksi = $idTransaksi ? Transaksi::find($idTransaksi) : null;

        if (!$transaksi) {
            Log::warning('Webhook DANA: transaksi tidak ditemukan', ['order_id' => $orderId]);
            return response()->json(['responseCode' => '4044701', 'responseMessage' => 'Transaksi tidak ditemukan'], 404);
        }

        if ($latestTransactionStatus === '00') {
            $transaksi->update(['status_pembayaran' => 'lunas']);
            Log::info('Pembayaran QRIS DANA lunas', ['transaksi_id' => $transaksi->id]);
        } elseif (in_array($latestTransactionStatus, ['06', '07'], true)) {
            // 06/07 = gagal/expired sesuai kode status DANA -- status_pembayaran
            // tetap 'menunggu', biarkan petugas memilih ulang metode bayar
            // (cash atau generate QR baru) dari frontend.
            Log::info('Pembayaran QRIS DANA gagal/kedaluwarsa', [
                'transaksi_id' => $transaksi->id,
                'status' => $latestTransactionStatus,
            ]);
        }

        return response()->json(['responseCode' => '2004700', 'responseMessage' => 'Successful']);
    }
}