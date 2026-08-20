<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Backend ini diakses oleh frontend React yang jalan di origin/port
    | berbeda:
    |   - Development : http://localhost:5173 (Vite dev server)
    |   - Production   : https://app-parkir.vercel.app (Vercel)
    |
    */

    // Path mana saja yang kena middleware CORS.
    // '/login' ditambahkan karena route ini dipanggil langsung
    // dari frontend (bukan lewat prefix /api).
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
    ],

    'allowed_methods' => ['*'],

    // Bisa lebih dari satu origin sekaligus: dev + production.
    // FRONTEND_URL di-set lewat env var Railway untuk production.
    'allowed_origins' => [
        'http://localhost:5173',
        env('FRONTEND_URL', 'https://app-parkir.vercel.app'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Bearer token (Sanctum) tidak butuh cookie, tapi biarkan true
    // supaya aman kalau nanti ada bagian yang pakai cookie/session.
    'supports_credentials' => true,

];