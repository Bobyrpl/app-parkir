<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Midtrans Configuration
    |--------------------------------------------------------------------------
    |
    | Configure Midtrans payment gateway settings
    |
    */

    'server_key' => env('MIDTRANS_SERVER_KEY'),
    'client_key' => env('MIDTRANS_CLIENT_KEY'),
    'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
    
    'snap_url' => env(
        'MIDTRANS_SNAP_URL',
        env('MIDTRANS_IS_PRODUCTION', false)
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'
    ),
    
    // Sanitize response untuk keamanan
    'is_sanitized' => true,
    
    // Enable 3D Secure untuk kartu kredit
    'is_3ds' => true,
];
