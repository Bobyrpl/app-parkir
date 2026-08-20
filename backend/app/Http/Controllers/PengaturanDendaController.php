<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use App\Models\PengaturanDenda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PengaturanDendaController extends Controller
{
    // GET /api/pengaturan-denda
    // Dibaca admin (halaman pengaturan) & petugas (buat preview estimasi
    // denda di halaman Kendaraan Keluar sebelum kendaraan benar-benar
    // diproses keluar - perhitungan final tetap di backend).
    public function show()
    {
        return response()->json(PengaturanDenda::ambil());
    }

    // PUT /api/pengaturan-denda
    // Khusus admin. Body: { denda_per_jam, toleransi_menit, aktif }
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'denda_per_jam'   => 'required|numeric|min:0',
            'toleransi_menit' => 'required|integer|min:0',
            'aktif'           => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pengaturan = PengaturanDenda::ambil();
        $pengaturan->update($request->only('denda_per_jam', 'toleransi_menit', 'aktif'));

        LogAktivitas::catat(
            $request->user()->id_user,
            'Mengubah pengaturan denda booking (denda/jam: Rp'
                . number_format($pengaturan->denda_per_jam, 0, ',', '.')
                . ', toleransi: ' . $pengaturan->toleransi_menit . ' menit'
                . ', status: ' . ($pengaturan->aktif ? 'aktif' : 'nonaktif') . ')'
        );

        return response()->json([
            'message' => 'Pengaturan denda berhasil diperbarui',
            'data'    => $pengaturan,
        ]);
    }
}