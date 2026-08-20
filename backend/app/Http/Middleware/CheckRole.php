<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Batasi akses route berdasarkan role user yang sedang login.
     *
     * Cara pakai di routes/api.php:
     *   Route::middleware(['auth:sanctum', 'role:admin'])->group(...)
     *   Route::middleware(['auth:sanctum', 'role:admin,petugas'])->group(...)
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Anda tidak punya akses ke fitur ini',
            ], 403);
        }

        return $next($request);
    }
}
