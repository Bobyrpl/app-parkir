<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCspHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set(
            'Content-Security-Policy',
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 http://127.0.0.1:5173 https://snap-assets.midtrans.com https://app.sandbox.midtrans.com https://app.midtrans.com https://api.midtrans.com https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://www.googletagmanager.com https://o.alicdn.com https://g.alicdn.com; frame-src 'self' https://snap-assets.midtrans.com https://app.sandbox.midtrans.com https://app.midtrans.com; connect-src 'self' http://localhost:5173 http://127.0.0.1:5173 ws://localhost:5173 ws://127.0.0.1:5173 https://*.midtrans.com; style-src 'self' 'unsafe-inline' http://localhost:5173 http://127.0.0.1:5173 https://snap-assets.midtrans.com;"
        );

        return $response;
    }
}

