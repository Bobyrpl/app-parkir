<?php

namespace App\Http\Controllers;

use App\Models\Kendaraan;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class KendaraanController extends Controller
{
    // GET /api/kendaraan
    public function index(Request $request)
    {
        // limit + pagination biar query tetap efisien walau data besar
        $kendaraan = Kendaraan::with('user:id_user,nama_lengkap')
            ->orderBy('id_kendaraan', 'desc')
            ->paginate(10);

        return response()->json($kendaraan);
    }

    // POST /api/kendaraan
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'plat_nomor'      => 'required|string|max:15',
            'jenis_kendaraan' => 'required|string|max:20',
            'warna'           => 'nullable|string|max:20',
            'pemilik'         => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $kendaraan = Kendaraan::create([
            'plat_nomor'      => $request->plat_nomor,
            'jenis_kendaraan' => $request->jenis_kendaraan,
            'warna'           => $request->warna,
            'pemilik'         => $request->pemilik,
            'id_user'         => $request->user()->id_user, // dicatat siapa yang input
        ]);

        return response()->json([
            'message' => 'Kendaraan berhasil ditambahkan',
            'data'    => $kendaraan,
        ], 201);
    }

    // GET /api/kendaraan/{id}
    public function show($id)
    {
        $kendaraan = Kendaraan::with('user:id_user,nama_lengkap')->find($id);

        if (! $kendaraan) {
            return response()->json(['message' => 'Kendaraan tidak ditemukan'], 404);
        }

        return response()->json($kendaraan);
    }

    // PUT/PATCH /api/kendaraan/{id}
    public function update(Request $request, $id)
    {
        $kendaraan = Kendaraan::find($id);

        if (! $kendaraan) {
            return response()->json(['message' => 'Kendaraan tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'plat_nomor'      => 'sometimes|required|string|max:15',
            'jenis_kendaraan' => 'sometimes|required|string|max:20',
            'warna'           => 'nullable|string|max:20',
            'pemilik'         => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $kendaraan->update($request->only('plat_nomor', 'jenis_kendaraan', 'warna', 'pemilik'));

        return response()->json([
            'message' => 'Kendaraan berhasil diperbarui',
            'data'    => $kendaraan,
        ]);
    }

    // DELETE /api/kendaraan/{id}
    public function destroy($id)
    {
        $kendaraan = Kendaraan::find($id);

        if (! $kendaraan) {
            return response()->json(['message' => 'Kendaraan tidak ditemukan'], 404);
        }

        // Cek dulu apakah kendaraan ini punya riwayat transaksi parkir
        $punyaTransaksi = Transaksi::where('id_kendaraan', $id)->exists();
        if ($punyaTransaksi) {
            return response()->json([
                'message' => 'Kendaraan tidak bisa dihapus karena masih memiliki riwayat transaksi parkir.',
            ], 409);
        }

        try {
            $kendaraan->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            // Jaga-jaga kalau ada FK lain (mis. booking) yang belum dicek manual di atas
            return response()->json([
                'message' => 'Kendaraan tidak bisa dihapus karena masih terkait data lain (booking/transaksi).',
            ], 409);
        }

        return response()->json(['message' => 'Kendaraan berhasil dihapus']);
    }

    // GET /api/kendaraan/cari/{plat_nomor}
    // Dipakai admin & petugas, misal saat kendaraan mau masuk parkir
    public function cariByPlat($plat_nomor)
    {
        $kendaraan = Kendaraan::where('plat_nomor', 'like', "%{$plat_nomor}%")->get();

        // Ambil daftar id_kendaraan yang saat ini masih tercatat "masuk" (belum keluar)
        $sedangParkirIds = Transaksi::where('status', 'masuk')
            ->pluck('id_kendaraan')
            ->toArray();

        $kendaraan = $kendaraan->map(function ($k) use ($sedangParkirIds) {
            $k->sedang_parkir = in_array($k->id_kendaraan, $sedangParkirIds);
            return $k;
        });

        return response()->json($kendaraan);
    }

    // GET /api/kendaraan-saya
    // Khusus pelanggan - daftar kendaraan miliknya sendiri (dipakai saat booking)
    public function kendaraanSaya(Request $request)
    {
        $kendaraan = Kendaraan::where('id_user', $request->user()->id_user)
            ->orderBy('id_kendaraan', 'desc')
            ->get();

        // Tandai kendaraan yang saat ini masih tercatat "masuk" (belum keluar) -
        // dipakai frontend untuk menolak booking baru pada kendaraan yang masih
        // sedang parkir, sama seperti logic di cariByPlat() di atas.
        $sedangParkirIds = Transaksi::where('status', 'masuk')
            ->whereIn('id_kendaraan', $kendaraan->pluck('id_kendaraan'))
            ->pluck('id_kendaraan')
            ->toArray();

        $kendaraan = $kendaraan->map(function ($k) use ($sedangParkirIds) {
            $k->sedang_parkir = in_array($k->id_kendaraan, $sedangParkirIds);
            return $k;
        });

        return response()->json($kendaraan);
    }
}