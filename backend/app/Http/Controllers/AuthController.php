<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // POST /api/login
    //  {#bf2,20}
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $credentials['username'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Username atau password salah'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    // POST /api/login-passkey
    // Login alternatif tanpa username/password, memakai passkey_token yang
    // sebelumnya dibuat lewat generatePasskey() (harus sudah login sekali
    // dengan username/password dulu untuk generate passkey-nya).
    //  {#6a0,20}
    public function loginWithPasskey(Request $request)
    {
        $validated = $request->validate([
            'passkey' => 'required|string',
        ]);

        $user = User::where('passkey_token', $validated['passkey'])->first();

        if (!$user) {
            return response()->json(['message' => 'Passkey tidak valid'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    // POST /api/register
    //  {#4ca,24}
    public function register(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|unique:tb_user,username',
            'email' => 'required|email|unique:tb_user,email',
            'password' => 'required|string|min:6',
            'nama_lengkap' => 'required|string',
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'nama_lengkap' => $validated['nama_lengkap'],
            'role' => 'pelanggan',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }

    // GET /api/user
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    // PUT /api/user/update
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama_lengkap' => 'nullable|string',
            'email' => 'nullable|email|unique:tb_user,email,' . $user->id_user . ',id_user',
            'no_telepon' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json($user);
    }

    // PUT /api/user/change-password
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Password saat ini salah'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'Password berhasil diubah']);
    }

    // GET /api/me
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 401);
        }

        return response()->json([
            'id' => $user->id_user,
            'username' => $user->username,
            'email' => $user->email,
            'nama_lengkap' => $user->nama_lengkap,
            'role' => $user->role,
            'created_at' => $user->created_at,
        ]);
    }

    // GET /api/user/dashboard-data
    public function dashboardData(Request $request)
    {
        $user = $request->user();
        $role = $user->role;

        if ($role === 'admin') {
            $totalUsers = User::count();
            $totalTransaksi = Transaksi::count();
            $totalPendapatan = Transaksi::where('status_pembayaran', 'lunas')->sum('biaya_total');
            $totalDenda = Transaksi::sum('denda');

            return response()->json([
                'totalUsers' => $totalUsers,
                'totalTransaksi' => $totalTransaksi,
                'totalPendapatan' => $totalPendapatan,
                'totalDenda' => $totalDenda,
            ]);
        } elseif ($role === 'petugas') {
            $transaksiHariIni = Transaksi::whereDate('waktu_masuk', today())->count();
            $transaksiSelesai = Transaksi::whereDate('waktu_keluar', today())
                ->where('status', 'keluar')
                ->count();
            $pendapatanHariIni = Transaksi::whereDate('waktu_masuk', today())
                ->where('status_pembayaran', 'lunas')
                ->sum('biaya_total');

            return response()->json([
                'transaksiHariIni' => $transaksiHariIni,
                'transaksiSelesai' => $transaksiSelesai,
                'pendapatanHariIni' => $pendapatanHariIni,
            ]);
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
    }

    // POST /api/user/request-activation
    public function requestActivation(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string',
            'role' => 'required|in:admin,petugas,owner',
        ]);

        $existing = User::where('email', $request->email)
            ->orWhere('username', $request->username)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'User sudah terdaftar'], 422);
        }

        \App\Models\PermintaanAktivasi::create([
            'username' => $request->username,
            'email' => $request->email,
            'nama_lengkap' => $request->name,
            'role' => $request->role,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Permintaan aktivasi berhasil dikirim'], 201);
    }

    // POST /api/user/generate-passkey
    public function generatePasskey(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $passkey = Str::random(32);

        $user->passkey_token = $passkey;
        $user->save();

        return $passkey;
    }

    // GET /api/config
    // Endpoint publik untuk config yang aman ditampilkan ke frontend
    public function config()
    {
        return response()->json([
            'midtrans_client_key' => config('midtrans.client_key'),
            'midtrans_snap_url' => config('midtrans.snap_url'),
            'midtrans_is_production' => (bool) config('midtrans.is_production'),
            'app_name' => config('app.name'),
        ]);
    }
}