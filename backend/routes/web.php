<?php

use Illuminate\Support\Facades\Route;

// Backend Laravel dan frontend React sekarang digabung dalam satu project.
// React (SPA) di-build lewat Vite dan di-serve lewat view "app" di bawah.
// Semua endpoint API tetap ada di routes/api.php, diakses lewat /api/...
//
// Catch-all route ini melempar semua request non-API ke React Router,
// supaya routing di sisi frontend (BrowserRouter) tetap berfungsi walau
// user refresh / buka langsung URL seperti /admin atau /petugas/masuk.
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
