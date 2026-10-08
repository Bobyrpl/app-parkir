<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Sekarang React di-serve langsung dari project Laravel yang sama
    | (satu domain, satu port), jadi CORS sebenarnya sudah tidak wajib lagi.
    | Konfigurasi ini dibiarkan aktif untuk jaga-jaga kalau suatu saat ada
    | client lain (mobile app, domain terpisah, dsb) yang perlu akses API.
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
    ],

    'allowed_methods' => ['*'],

    // link fronend kalau sudah di hosting di ganti nama domain.com/app{#510,3}
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:8000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
