<?php

namespace App\Http\Controllers;

use App\Models\AreaParkir;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AreaParkirController extends Controller
{
    // GET /api/area-parkir
    public function index()
    {
        $area = AreaParkir::orderBy('id_area')->get();
        return response()->json($area);
    }

    // POST /api/area-parkir
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_area' => 'required|string|max:50',
            'kapasitas' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $area = AreaParkir::create([
            'nama_area' => $request->nama_area,
            'kapasitas' => $request->kapasitas,
            'terisi'    => 0,
        ]);

        return response()->json([
            'message' => 'Area parkir berhasil ditambahkan',
            'data'    => $area,
        ], 201);
    }

    // GET /api/area-parkir/{id}
    public function show($id)
    {
        $area = AreaParkir::find($id);

        if (! $area) {
            return response()->json(['message' => 'Area parkir tidak ditemukan'], 404);
        }

        return response()->json($area);
    }

    // PUT/PATCH /api/area-parkir/{id}
    public function update(Request $request, $id)
    {
        $area = AreaParkir::find($id);

        if (! $area) {
            return response()->json(['message' => 'Area parkir tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_area' => 'sometimes|required|string|max:50',
            'kapasitas' => 'sometimes|required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $area->update($request->only('nama_area', 'kapasitas'));

        return response()->json([
            'message' => 'Area parkir berhasil diperbarui',
            'data'    => $area,
        ]);
    }

    // DELETE /api/area-parkir/{id}
    public function destroy($id)
    {
        $area = AreaParkir::find($id);

        if (! $area) {
            return response()->json(['message' => 'Area parkir tidak ditemukan'], 404);
        }

        $area->delete();

        return response()->json(['message' => 'Area parkir berhasil dihapus']);
    }
}
