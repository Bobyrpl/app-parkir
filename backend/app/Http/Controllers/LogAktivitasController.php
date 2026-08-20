<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use Illuminate\Http\Request;

class LogAktivitasController extends Controller
{
    // GET /api/log-aktivitas
    public function index(Request $request)
    {
        $log = LogAktivitas::with('user:id_user,nama_lengkap,role')
            ->orderBy('waktu_aktivitas', 'desc')
            ->paginate(15); // limit biar tetap cepat walau log sudah banyak

        return response()->json($log);
    }
}
