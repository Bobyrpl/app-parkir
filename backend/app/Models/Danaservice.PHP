<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Integrasi DANA Bisnis - QRIS MPM (Acquirer), mengikuti standar SNAP
 * (Standar Nasional Open API Pembayaran Bank Indonesia) yang dipakai DANA.
 *
 * Alur singkat:
 *  1. getAccessToken()  -> minta B2B access token, request ditandatangani
 *                          pakai RSA-SHA256 (asymmetric signature) dengan
 *                          private key merchant.
 *  2. generateQris()    -> panggil endpoint Generate QR MPM, request
 *                          ditandatangani pakai HMAC-SHA512 (symmetric
 *                          signature) yang melibatkan access token di atas.
 *  3. verifyCallbackSignature() -> dipanggil dari webhook untuk memastikan
 *                          notifikasi pembayaran benar-benar dari DANA.
 *
 * PENTING: nama field, path endpoint, dan urutan komponen signature di
 * bawah ini mengikuti dokumentasi resmi DANA Business (SNAP) per Rilis
 * terakhir yang diketahui. Sebelum dipakai ke production, cocokkan lagi
 * dengan dokumentasi & Postman collection yang diberikan DANA saat akun
 * merchant kamu disetujui -- beberapa detail (mis. urutan header) bisa
 * berbeda antar versi.
 */
class DanaService
{
    private string $baseUrl;
    private bool $isProduction;
    private string $partnerId;
    private string $clientId;
    private string $clientSecret;
    private string $channelId;
    private string $merchantId;
    private string $origin;

    public function __construct()
    {
        $config = config('services.dana');

        $this->baseUrl = rtrim($config['base_url'], '/');
        $this->isProduction = (bool) $config['is_production'];
        $this->partnerId = (string) $config['partner_id'];
        $this->clientId = (string) $config['client_id'];
        $this->clientSecret = (string) $config['client_secret'];
        $this->channelId = (string) $config['channel_id'];
        $this->merchantId = (string) $config['merchant_id'];
        $this->origin = (string) $config['origin'];
    }

    /**
     * Ambil B2B access token, di-cache sedikit di bawah masa berlakunya
     * (umumnya 900 detik / 15 menit) supaya tidak minta token baru di
     * setiap request generate QR.
     */
    public function getAccessToken(): string
    {
        return Cache::remember('dana_b2b_access_token', 800, function () {
            $timestamp = $this->timestamp();
            $stringToSign = "{$this->clientId}|{$timestamp}";
            $signature = $this->signAsymmetric($stringToSign);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-TIMESTAMP' => $timestamp,
                'X-SIGNATURE' => $signature,
                'X-CLIENT-KEY' => $this->clientId,
            ])->post("{$this->baseUrl}/v1.0/access-token/b2b.htm", [
                'grantType' => 'client_credentials',
                'additionalInfo' => (object) [],
            ]);

            if (!$response->successful() || !$response->json('accessToken')) {
                Log::error('DANA: gagal mengambil access token', ['response' => $response->json()]);
                throw new RuntimeException('Gagal mengambil access token DANA.');
            }

            return $response->json('accessToken');
        });
    }

    /**
     * Panggil endpoint Generate QR MPM. Mengembalikan array berisi
     * 'qr_content' (string QRIS mentah, dirender jadi gambar QR di
     * frontend) dan 'reference_no' (dipakai DANA sebagai id transaksi).
     */
    public function generateQris(string $partnerReferenceNo, int $amount): array
    {
        $accessToken = $this->getAccessToken();

        $body = [
            'merchantId' => $this->merchantId,
            'partnerReferenceNo' => $partnerReferenceNo,
            'amount' => [
                'value' => number_format($amount, 2, '.', ''),
                'currency' => 'IDR',
            ],
            'validityPeriod' => now()->addMinutes(15)->format('Y-m-d\TH:i:sP'),
            'additionalInfo' => (object) [
                'terminalSource' => 'MER',
            ],
        ];

        $response = $this->postSigned('/v1.0/qr/qr-mpm-generate.htm', $body, $accessToken);

        if (($response->json('responseCode') ?? '') !== '2004700' || !$response->json('qrContent')) {
            Log::error('DANA: generate QRIS gagal', ['response' => $response->json()]);
            throw new RuntimeException($response->json('responseMessage') ?? 'Gagal membuat QRIS dari DANA.');
        }

        return [
            'qr_content' => $response->json('qrContent'),
            'reference_no' => $response->json('referenceNo'),
        ];
    }

    /**
     * Cek status transaksi langsung ke DANA (dipakai sebagai fallback kalau
     * webhook belum masuk, misalnya lewat tombol "cek status manual").
     */
    public function inquiryStatus(string $partnerReferenceNo, ?string $referenceNo = null): array
    {
        $accessToken = $this->getAccessToken();

        $body = array_filter([
            'merchantId' => $this->merchantId,
            'originalPartnerReferenceNo' => $partnerReferenceNo,
            'originalReferenceNo' => $referenceNo,
            'serviceCode' => '47', // kode layanan QRIS MPM sesuai SNAP
        ]);

        $response = $this->postSigned('/v1.0/qr/qr-mpm-query.htm', $body, $accessToken);

        return $response->json() ?? [];
    }

    /**
     * Verifikasi signature pada payload callback/notifikasi pembayaran dari
     * DANA. WAJIB dipanggil sebelum mempercayai isi callback apa pun.
     */
    public function verifyCallbackSignature(string $httpMethod, string $relativeUrl, string $rawBody, string $timestamp, string $receivedSignature): bool
    {
        $expected = $this->buildSymmetricSignature($httpMethod, $relativeUrl, $rawBody, $timestamp, null);

        return hash_equals($expected, $receivedSignature);
    }

    private function postSigned(string $relativePath, array $body, string $accessToken)
    {
        $timestamp = $this->timestamp();
        $jsonBody = json_encode($body, JSON_UNESCAPED_SLASHES);
        $signature = $this->buildSymmetricSignature('POST', $relativePath, $jsonBody, $timestamp, $accessToken);

        return Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => "Bearer {$accessToken}",
            'X-TIMESTAMP' => $timestamp,
            'X-SIGNATURE' => $signature,
            'X-PARTNER-ID' => $this->partnerId,
            'X-EXTERNAL-ID' => (string) now()->timestamp . random_int(1000, 9999),
            'CHANNEL-ID' => $this->channelId,
            'ORIGIN' => $this->origin,
        ])->withBody($jsonBody, 'application/json')->post("{$this->baseUrl}{$relativePath}");
    }

    /**
     * Signature simetris standar SNAP:
     * HMAC-SHA512( HTTPMethod + ":" + relativeUrl + ":" + accessToken + ":"
     *              + lowercase(hex(sha256(minifiedBody))) + ":" + timestamp,
     *              clientSecret ), di-encode Base64.
     * Untuk callback dari DANA, accessToken tidak dipakai (null).
     */
    private function buildSymmetricSignature(string $httpMethod, string $relativeUrl, string $body, string $timestamp, ?string $accessToken): string
    {
        $bodyHash = strtolower(hash('sha256', $body));
        $tokenPart = $accessToken ?? '';
        $stringToSign = "{$httpMethod}:{$relativeUrl}:{$tokenPart}:{$bodyHash}:{$timestamp}";

        return base64_encode(hash_hmac('sha512', $stringToSign, $this->clientSecret, true));
    }

    /**
     * Signature asimetris (RSA-SHA256) khusus untuk permintaan access token,
     * ditandatangani pakai private key merchant.
     */
    private function signAsymmetric(string $stringToSign): string
    {
        $privateKeyPath = config('services.dana.private_key_path');

        if (!is_readable($privateKeyPath)) {
            throw new RuntimeException("Private key DANA tidak ditemukan di: {$privateKeyPath}");
        }

        $privateKey = openssl_pkey_get_private(file_get_contents($privateKeyPath));

        if (!$privateKey) {
            throw new RuntimeException('Private key DANA tidak valid.');
        }

        openssl_sign($stringToSign, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        return base64_encode($signature);
    }

    private function timestamp(): string
    {
        return now()->format('Y-m-d\TH:i:sP');
    }
}