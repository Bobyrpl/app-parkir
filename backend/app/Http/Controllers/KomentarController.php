<?php

namespace App\Http\Controllers;

use App\Models\Komentar;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class KomentarController extends Controller
{
    /**
     * Daftar komentar terbaru untuk ditampilkan di landing page.
     * Ikut menyertakan balasan admin (kalau ada) supaya pengunjung
     * bisa melihat tanggapannya langsung di bawah komentar.
     */
    public function index(): JsonResponse
    {
        $komentar = Komentar::latest()->take(50)->get([
            'id', 'nama', 'teks', 'rating', 'balasan', 'dibalas_pada', 'created_at',
        ]);

        return response()->json($komentar);
    }

    /**
     * Simpan komentar baru dari pengunjung.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'teks' => ['required', 'string', 'max:1000'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $komentar = Komentar::create([
            'nama' => strip_tags($validated['nama']),
            'teks' => strip_tags($validated['teks']),
            'rating' => $validated['rating'],
        ]);

        return response()->json($komentar, 201);
    }

    /**
     * POST /api/komentar/{id}/balas
     * Khusus admin (lihat routes/api.php, dibungkus middleware
     * role:admin). Menyimpan/menimpa balasan admin untuk satu
     * komentar. Kirim balasan kosong ("") untuk menghapus balasan
     * yang sudah ada.
     */
    public function balas(Request $request, string $id): JsonResponse
    {
        $komentar = Komentar::find($id);

        if (! $komentar) {
            return response()->json(['message' => 'Komentar tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'balasan' => ['nullable', 'string', 'max:1000'],
        ]);

        $teksBalasan = trim($validated['balasan'] ?? '');

        $komentar->balasan = $teksBalasan !== '' ? strip_tags($teksBalasan) : null;
        $komentar->dibalas_pada = $teksBalasan !== '' ? now() : null;
        $komentar->save();

        LogAktivitas::catat(
            $request->user()->id_user,
            $teksBalasan !== ''
                ? 'Membalas komentar dari ' . $komentar->nama
                : 'Menghapus balasan komentar dari ' . $komentar->nama
        );

        return response()->json($komentar);
    }

    /**
     * DELETE /api/komentar/{id}
     * Khusus admin (lihat routes/api.php, dibungkus middleware
     * role:admin). Menghapus komentar pengunjung secara permanen
     * dari database, sehingga otomatis hilang dari landing page.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $komentar = Komentar::find($id);

        if (! $komentar) {
            return response()->json(['message' => 'Komentar tidak ditemukan'], 404);
        }

        $nama = $komentar->nama;
        $komentar->delete();

        // Pencatatan log dibungkus try/catch supaya kalau ada masalah di
        // sini (mis. tabel log belum ada / kolom beda), proses hapus
        // komentar tetap dianggap berhasil dan tidak melempar 500 ke
        // frontend padahal datanya sudah kehapus.
        try {
            LogAktivitas::catat(
                $request->user()->id_user,
                'Menghapus komentar dari ' . $nama
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => 'Komentar berhasil dihapus']);
    }
}