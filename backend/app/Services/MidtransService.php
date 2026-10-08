<?php

namespace App\Services;

use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized = (bool) config('midtrans.is_sanitized');
        Config::$is3ds = (bool) config('midtrans.is_3ds');
    }

    //  {#42b,44}
    public function createSnapToken($transaksi, $biayaTotal)
    {
        // Generate unique order ID with random suffix to prevent duplicates
        $orderId = 'PARKIR-' . $transaksi->id_parkir . '-' . time() . '-' . Str::upper(Str::random(6));

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $biayaTotal,
            ],
            'customer_details' => [
                'first_name' => $transaksi->kendaraan->plat_nomor,
                'email' => 'customertes@example.com',
            ],
            'item_details' => [
                [
                    'id' => 'PARKIR',
                    'price' => $biayaTotal,
                    'quantity' => 1,
                    'name' => 'Biaya Parkir ' . $transaksi->kendaraan->plat_nomor,
                ]
            ],
            'enabled_payments' => ['qris','dana','gopay'],
        ];

        try {
            $snapToken = Snap::getSnapToken($params);

            // Simpan order ID ke transaksi
            $transaksi->update([
                'midtrans_order_id' => $orderId,
                'midtrans_snap_token' => $snapToken
            ]);

            return [
                'token' => $snapToken,
                'order_id' => $orderId
            ];
        } catch (\Exception $e) {
            \Log::error('Midtrans Snap Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function handleNotification()
    {
        try {
            $notif = new Notification();

            $transaction = $notif->transaction_status;
            $type = $notif->payment_type;
            $order_id = $notif->order_id;
            $fraud = $notif->fraud_status;

            return [
                'order_id' => $order_id,
                'status' => $transaction,
                'type' => $type,
                'fraud' => $fraud
            ];
        } catch (\Exception $e) {
            \Log::error('Midtrans Notification Error: ' . $e->getMessage());
            throw $e;
        }
    }
}
