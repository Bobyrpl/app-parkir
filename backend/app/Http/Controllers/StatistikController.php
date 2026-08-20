<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatistikController extends Controller
{
    // GET /statistik/ringkasan — dipakai landing page (publik, tanpa login)
    public function ringkasan(): JsonResponse
    {
        $kapasitas = (int) DB::table('tb_area_parkir')->sum('kapasitas');
        $terisi    = (int) DB::table('tb_transaksi')->where('status', 'masuk')->count();

        $jumlahUlasan = DB::table('komentars')->count();
        $ratingRata   = $jumlahUlasan > 0
            ? round((float) DB::table('komentars')->avg('rating'), 1)
            : 0;

        $transaksiSelesai = DB::table('tb_transaksi')->where('status', 'keluar')->count();

        return response()->json([
            'kapasitas'         => $kapasitas,
            'terisi'            => $terisi,
            'rating_rata'       => $ratingRata,
            'jumlah_ulasan'     => $jumlahUlasan,
            'transaksi_selesai' => $transaksiSelesai,
        ]);
    }
}