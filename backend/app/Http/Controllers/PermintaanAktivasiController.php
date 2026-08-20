<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use App\Models\PermintaanAktivasi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PermintaanAktivasiController extends Controller
{
    /**
     * POST /api/permintaan-aktivasi
     * PUBLIK - dipakai lewat halaman "Ajukan Aktivasi Akun".
     * User yang akunnya dinonaktifkan (status_aktif = false) tidak bisa
     * login sendiri, jadi ini satu-satunya jalan buat minta diaktifkan
     * lagi tanpa harus login dulu.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:50',
            'catatan'  => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('username', $request->username)->first();

        if (! $user) {
            return response()->json(['message' => 'Username tidak ditemukan'], 404);
        }

        if ($user->status_aktif) {
            return response()->json(['message' => 'Akun ini masih aktif, tidak perlu mengajukan aktivasi'], 422);
        }

        // Cegah spam pengajuan berulang selagi pengajuan sebelumnya belum diproses admin.
        $sudahAda = PermintaanAktivasi::where('id_user', $user->id_user)
            ->where('status', 'menunggu')
            ->exists();

        if ($sudahAda) {
            return response()->json([
                'message' => 'Permintaan aktivasi untuk akun ini sudah diajukan sebelumnya, mohon tunggu diproses admin',
            ], 422);
        }

        $permintaan = PermintaanAktivasi::create([
            'username' => $request->username,
            'id_user'  => $user->id_user,
            'catatan'  => $request->catatan,
            'status'   => 'menunggu',
        ]);

        return response()->json([
            'message' => 'Permintaan aktivasi berhasil dikirim, admin akan meninjau akun anda',
            'data'    => $permintaan,
        ], 201);
    }

    /**
     * GET /api/permintaan-aktivasi
     * Khusus admin - lihat semua pengajuan, bisa difilter status.
     */
    public function index(Request $request)
    {
        $query = PermintaanAktivasi::with([
            'user:id_user,nama_lengkap,username,role,status_aktif',
            'diprosesOleh:id_user,nama_lengkap',
        ])->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(10)->withQueryString());
    }

    /**
     * POST /api/permintaan-aktivasi/{id}/setujui
     * Khusus admin - setujui pengajuan: akun diaktifkan lagi (status_aktif = true).
     */
    public function setujui(Request $request, $id)
    {
        $permintaan = PermintaanAktivasi::find($id);

        if (! $permintaan) {
            return response()->json(['message' => 'Permintaan tidak ditemukan'], 404);
        }

        if ($permintaan->status !== 'menunggu') {
            return response()->json(['message' => 'Permintaan ini sudah diproses sebelumnya'], 422);
        }

        if (! $permintaan->id_user || ! $permintaan->user) {
            return response()->json(['message' => 'Akun terkait permintaan ini sudah tidak ada'], 422);
        }

        $permintaan->user->update(['status_aktif' => true]);

        $permintaan->update([
            'status'         => 'disetujui',
            'diproses_oleh'  => $request->user()->id_user,
            'diproses_pada'  => now(),
        ]);

        LogAktivitas::catat(
            $request->user()->id_user,
            'Menyetujui permintaan aktivasi akun ' . $permintaan->username
        );

        return response()->json([
            'message' => 'Permintaan disetujui, akun berhasil diaktifkan kembali',
            'data'    => $permintaan->fresh(['user', 'diprosesOleh']),
        ]);
    }

    /**
     * POST /api/permintaan-aktivasi/{id}/tolak
     * Khusus admin - tolak pengajuan (akun tetap nonaktif).
     */
    public function tolak(Request $request, $id)
    {
        $permintaan = PermintaanAktivasi::find($id);

        if (! $permintaan) {
            return response()->json(['message' => 'Permintaan tidak ditemukan'], 404);
        }

        if ($permintaan->status !== 'menunggu') {
            return response()->json(['message' => 'Permintaan ini sudah diproses sebelumnya'], 422);
        }

        $validator = Validator::make($request->all(), [
            'catatan_admin' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $permintaan->update([
            'status'         => 'ditolak',
            'catatan_admin'  => $request->catatan_admin,
            'diproses_oleh'  => $request->user()->id_user,
            'diproses_pada'  => now(),
        ]);

        LogAktivitas::catat(
            $request->user()->id_user,
            'Menolak permintaan aktivasi akun ' . $permintaan->username
        );

        return response()->json([
            'message' => 'Permintaan aktivasi ditolak',
            'data'    => $permintaan->fresh(['user', 'diprosesOleh']),
        ]);
    }
}