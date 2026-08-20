<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cek tiap 15 menit: booking yang lewat waktu tanpa kedatangan -> kadaluarsa.
// Catatan: scheduler Laravel butuh cron job di server yang manggil
// `php artisan schedule:run` tiap menit supaya jadwal ini benar-benar jalan.
Schedule::command('booking:expire')->everyFifteenMinutes();
