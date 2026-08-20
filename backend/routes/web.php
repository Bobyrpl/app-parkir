<?php

use Illuminate\Support\Facades\Route;

// Backend ini murni REST API. Frontend React (SPA) jalan terpisah
// di project "frontend/" (dev server Vite, port 5173).
// Semua endpoint API ada di routes/api.php, diakses lewat /api/...

Route::get('/', function () {
    return response()->json([
        'message' => 'Aplikasi Parkir UKK API is running.',
    ]);
});
