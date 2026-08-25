<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use Illuminate\Http\JsonResponse;

class PembayaranController extends Controller
{
    /**
     * Dipanggil petugas dari ModalQris.jsx saat menekan tombol
     * "Sudah Dibayar" setelah pelanggan memindai QRIS STATIS yang
     * ditampilkan (bukan QR dinamis dari payment gateway).
     *
     * Karena QRIS-nya statis (gambar tetap, bukan hasil generate API),
     * sistem TIDAK BISA tahu otomatis kapan pembayaran masuk -- makanya
     * status "lunas" ditentukan dari konfirmasi manual petugas setelah
     * memastikan pembayaran diterima (mis. cek mutasi/notifikasi di
     * HP/aplikasi bank atau e-wallet penerima).
     */
    public function konfirmasiQris(int $id): JsonResponse
    {
        $transaksi = Transaksi::findOrFail($id);

        if ($transaksi->status_pembayaran === 'lunas') {
            return response()->json(['message' => 'Transaksi sudah lunas.'], 422);
        }

        $transaksi->update([
            'metode_bayar' => 'qris',
            'status_pembayaran' => 'lunas',
        ]);

        return response()->json(['message' => 'Pembayaran QRIS dikonfirmasi lunas.']);
    }
}