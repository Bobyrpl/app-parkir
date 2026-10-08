<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Models\LogAktivitas;
use App\Services\MidtransService;
use Illuminate\Http\Request;

class MidtransController extends Controller
{
    public function generateToken(Request $request, $id)
    {
        $transaksi = Transaksi::with(['kendaraan', 'tarif'])->find($id);

        if (!$transaksi) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        }

        if ($transaksi->midtrans_snap_token) {
            return response()->json([
                'token' => $transaksi->midtrans_snap_token,
                'order_id' => $transaksi->midtrans_order_id,
            ]);
        }

        try {
            $biayaTotal = (int) $transaksi->biaya_total;

            if ($transaksi->status !== 'keluar') {
                $attributesAwal = $transaksi->getAttributes();
                $transaksi->waktu_keluar = now();
                $transaksi->hitungBiayaKeluar();
                $biayaTotal = (int) $transaksi->biaya_total + (int) $transaksi->hitungDenda();
                $transaksi->setRawAttributes($attributesAwal, true);
            }

            if ($biayaTotal < 1) {
                return response()->json(['message' => 'Nominal parkir belum valid'], 422);
            }

            $result = (new MidtransService())->createSnapToken($transaksi, $biayaTotal);
            return response()->json($result, 201);
        } catch (\Throwable $e) {
            \Log::error('Generate Midtrans Token Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal generate token Midtrans'], 500);
        }
    }

    public function callback(Request $request)
    {
        try {
            $notification = (new MidtransService())->handleNotification();
            $orderId = $notification['order_id'];
            $parts = explode('-', $orderId);

            if (count($parts) < 2) {
                return response()->json(['message' => 'Invalid order ID format'], 400);
            }

            $transaksi = Transaksi::find((int) $parts[1]);
            if (!$transaksi) {
                return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
            }

            $status = $notification['status'];
            if ($status === 'settlement' || $status === 'capture') {
                $transaksi->update([
                    'status_pembayaran' => 'lunas',
                    'midtrans_status' => $status,
                    'midtrans_payment_type' => $notification['type'],
                ]);
                LogAktivitas::catat(0, 'Pembayaran Midtrans lunas (id_parkir: ' . $transaksi->id_parkir . ')');
            } elseif ($status === 'pending') {
                $transaksi->update(['midtrans_status' => $status]);
            } elseif (in_array($status, ['deny', 'expire', 'cancel'], true)) {
                $transaksi->update([
                    'status_pembayaran' => 'menunggu',
                    'midtrans_status' => $status,
                ]);
            }

            return response()->json(['status' => 'ok']);
        } catch (\Throwable $e) {
            \Log::error('Midtrans Callback Error: ' . $e->getMessage());
            return response()->json(['message' => 'Callback processing failed'], 500);
        }
    }
}
