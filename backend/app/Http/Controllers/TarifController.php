<?php

namespace App\Http\Controllers;

use App\Models\Tarif;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TarifController extends Controller
{
    // GET /api/tarif
    public function index()
    {
        $tarif = Tarif::orderBy('id_tarif')->get();
        return response()->json($tarif);
    }

    // POST /api/tarif
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'jenis_kendaraan' => 'required|in:motor,mobil,bus,truk,lainnya',
            'tarif_per_jam'   => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tarif = Tarif::create($request->only('jenis_kendaraan', 'tarif_per_jam'));

        return response()->json([
            'message' => 'Tarif berhasil ditambahkan',
            'data'    => $tarif,
        ], 201);
    }

    // GET /api/tarif/{id}
    public function show($id)
    {
        $tarif = Tarif::find($id);

        if (! $tarif) {
            return response()->json(['message' => 'Tarif tidak ditemukan'], 404);
        }

        return response()->json($tarif);
    }

    // PUT/PATCH /api/tarif/{id}
    public function update(Request $request, $id)
    {
        $tarif = Tarif::find($id);

        if (! $tarif) {
            return response()->json(['message' => 'Tarif tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'jenis_kendaraan' => 'sometimes|required|in:motor,mobil,bus,truk,lainnya',
            'tarif_per_jam'   => 'sometimes|required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tarif->update($request->only('jenis_kendaraan', 'tarif_per_jam'));

        return response()->json([
            'message' => 'Tarif berhasil diperbarui',
            'data'    => $tarif,
        ]);
    }

    // DELETE /api/tarif/{id}
    public function destroy($id)
    {
        $tarif = Tarif::find($id);

        if (! $tarif) {
            return response()->json(['message' => 'Tarif tidak ditemukan'], 404);
        }

        $tarif->delete();

        return response()->json(['message' => 'Tarif berhasil dihapus']);
    }
}