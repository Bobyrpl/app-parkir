<?php

namespace App\Http\Controllers;

use App\Models\User;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    // GET /api/users
    public function index()
    {
        $users = User::select('id_user', 'nama_lengkap', 'username', 'no_telp', 'role', 'status_aktif', 'foto_profil')
            ->orderBy('id_user', 'desc')
            ->paginate(10);

        return response()->json($users);
    }

    // POST /api/users
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_lengkap' => 'required|string|max:50',
            'username'     => 'required|string|max:50|unique:tb_user,username',
            'no_telp'      => 'nullable|string|max:20|unique:tb_user,no_telp',
            'password'     => 'required|string|min:6',
            'role'         => 'required|in:admin,petugas,owner,pelanggan',
            'status_aktif' => 'boolean',
            'foto_profil'  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fotoUrl = null;
        $fotoPublicId = null;
        if ($request->hasFile('foto_profil')) {
            $uploaded = Cloudinary::upload($request->file('foto_profil')->getRealPath(), [
                'folder' => 'foto_profil',
                'transformation' => [
                    'width' => 400, 'height' => 400, 'crop' => 'fill',
                    'gravity' => 'face', 'quality' => 'auto', 'fetch_format' => 'auto',
                ],
            ]);
            $fotoUrl = $uploaded->getSecurePath();
            $fotoPublicId = $uploaded->getPublicId();
        }

        $user = User::create([
            'nama_lengkap' => $request->nama_lengkap,
            'username'     => $request->username,
            'no_telp'      => $request->no_telp,
            'password'     => $request->password,
            'role'         => $request->role,
            'status_aktif' => $request->status_aktif ?? true,
            'foto_profil'  => $fotoUrl,
            'foto_profil_public_id' => $fotoPublicId,
        ]);

        return response()->json([
            'message' => 'User berhasil ditambahkan',
            'data'    => $user,
        ], 201);
    }

    // GET /api/users/{id}
    public function show($id)
    {
        $user = User::select('id_user', 'nama_lengkap', 'username', 'no_telp', 'role', 'status_aktif', 'foto_profil')
            ->find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        return response()->json($user);
    }

    // PUT/PATCH /api/users/{id}
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_lengkap' => 'sometimes|required|string|max:50',
            'username'     => 'sometimes|required|string|max:50|unique:tb_user,username,' . $id . ',id_user',
            'no_telp'      => 'nullable|string|max:20|unique:tb_user,no_telp,' . $id . ',id_user',
            'password'     => 'nullable|string|min:6',
            'role'         => 'sometimes|required|in:admin,petugas,owner,pelanggan',
            'status_aktif' => 'boolean',
            'foto_profil'  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['nama_lengkap', 'username', 'no_telp', 'role', 'status_aktif']);

        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        if ($request->hasFile('foto_profil')) {
            if ($user->foto_profil_public_id) {
                Cloudinary::destroy($user->foto_profil_public_id);
            }
            $uploaded = Cloudinary::upload($request->file('foto_profil')->getRealPath(), [
                'folder' => 'foto_profil',
                'transformation' => [
                    'width' => 400, 'height' => 400, 'crop' => 'fill',
                    'gravity' => 'face', 'quality' => 'auto', 'fetch_format' => 'auto',
                ],
            ]);
            $data['foto_profil'] = $uploaded->getSecurePath();
            $data['foto_profil_public_id'] = $uploaded->getPublicId();
        }

        $user->update($data);

        return response()->json([
            'message' => 'User berhasil diperbarui',
            'data'    => $user,
        ]);
    }

    // DELETE /api/users/{id}
    public function destroy($id)
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        try {
            if ($user->foto_profil_public_id) {
                Cloudinary::destroy($user->foto_profil_public_id);
            }
            $user->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'User tidak dapat dihapus karena masih memiliki data kendaraan/transaksi/log aktivitas yang terkait'
            ], 409);
        }

        return response()->json(['message' => 'User berhasil dihapus']);
    }
}