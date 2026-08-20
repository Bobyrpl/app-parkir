<?php

namespace App\Http\Controllers;

use App\Models\AreaParkir;
use App\Models\Booking;
use App\Models\LogAktivitas;
use App\Models\Tarif;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TransaksiController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dari'   => 'nullable|date',
            'sampai' => 'nullable|date|after_or_equal:dari',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = Transaksi::with(['kendaraan:id_kendaraan,plat_nomor,jenis_kendaraan', 'area:id_area,nama_area'])
            ->orderBy('id_parkir', 'desc');

        if ($request->filled('dari')) {
            $query->whereDate('waktu_masuk', '>=', $request->dari);
        }

        if ($request->filled('sampai')) {
            $query->whereDate('waktu_masuk', '<=', $request->sampai);
        }

        $transaksi = $query->paginate(10)->withQueryString();

        return response()->json($transaksi);
    }

    public function kendaraanMasuk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_kendaraan' => 'required|exists:tb_kendaraan,id_kendaraan',
            'id_tarif'     => 'required|exists:tb_tarif,id_tarif',
            'id_area'      => 'required|exists:tb_area_parkir,id_area',
            'id_booking'   => 'nullable|exists:tb_booking,id_booking',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Cegah kendaraan yang sama dicatat masuk dua kali sebelum keluar
        $sedangParkir = Transaksi::where('id_kendaraan', $request->id_kendaraan)
            ->where('status', 'masuk')
            ->exists();

        if ($sedangParkir) {
            return response()->json([
                'message' => 'Kendaraan ini sudah tercatat sedang parkir dan belum keluar.',
            ], 422);
        }

        $area = AreaParkir::find($request->id_area);

        if ($area->isPenuh()) {
            return response()->json(['message' => 'Area parkir sudah penuh'], 422);
        }

        $booking = null;
        if ($request->filled('id_booking')) {
            $booking = Booking::find($request->id_booking);
            if (! $booking || $booking->status !== 'dikonfirmasi') {
                return response()->json(['message' => 'Booking tidak valid atau belum dikonfirmasi'], 422);
            }
        }

        try {
            $transaksi = DB::transaction(function () use ($request, $booking) {
                $transaksi = Transaksi::create([
                    'id_kendaraan' => $request->id_kendaraan,
                    'waktu_masuk'  => now(),
                    'id_tarif'     => $request->id_tarif,
                    'durasi_jam'   => 0,
                    'biaya_total'  => 0,
                    'status'       => 'masuk',
                    'id_user'      => $request->user()->id_user,
                    'id_area'      => $request->id_area,
                    'id_booking'   => $booking?->id_booking,
                ]);

                // Booking SENGAJA tidak ditandai 'selesai' di sini. Statusnya
                // tetap 'dikonfirmasi' sampai kendaraan benar-benar dicatat
                // keluar (lihat kendaraanKeluar()) - supaya QR booking milik
                // pelanggan (RiwayatBooking.jsx: bisaTampilkanQr) tetap
                // tampil selama kendaraan masih di dalam area parkir, dan
                // baru hilang setelah petugas memproses kendaraan keluar.

                LogAktivitas::catat(
                    $request->user()->id_user,
                    'Mencatat kendaraan masuk parkir (id_parkir: ' . $transaksi->id_parkir . ')'
                        . ($booking ? ' dari booking ' . $booking->kode_booking : '')
                );

                return $transaksi;
            });
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal mencatat kendaraan masuk, silakan coba lagi'], 500);
        }

        return response()->json([
            'message' => 'Kendaraan berhasil dicatat masuk',
            'data'    => $transaksi,
        ], 201);
    }

    // POST /api/transaksi/{id}/keluar
    // Body opsional: { "metode_bayar": "cash" | "qris" }
    //
    // Denda TIDAK LAGI diinput manual oleh petugas. Kalau transaksi berasal
    // dari booking dan kendaraan keluar melewati jam_rencana_keluar
    // (overstay), nominalnya dihitung otomatis oleh Transaksi::hitungDenda()
    // berdasarkan pengaturan denda yang diatur admin di menu Pengaturan
    // Denda (tarif per jam + toleransi menit - lihat PengaturanDendaController).
    // Nilainya langsung dijumlahkan ke biaya_total supaya ikut tertagih baik
    // lewat cash maupun QRIS (lihat PembayaranController::generateQris yang
    // memakai biaya_total sebagai nominal QR).
    public function kendaraanKeluar(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'metode_bayar' => 'nullable|in:cash,qris',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $transaksi = Transaksi::with(['tarif', 'booking'])->find($id);

        if (! $transaksi) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        }

        if ($transaksi->status === 'keluar') {
            return response()->json(['message' => 'Transaksi ini sudah selesai (kendaraan sudah keluar)'], 422);
        }

        $metode = $request->input('metode_bayar', 'cash');

        try {
            DB::transaction(function () use ($request, $transaksi, $metode) {
                $transaksi->waktu_keluar = now();
                $transaksi->hitungBiayaKeluar();

                // Dihitung otomatis, bukan dari input petugas.
                $denda = $transaksi->hitungDenda();

                $transaksi->denda       = $denda;
                $transaksi->biaya_total = $transaksi->biaya_total + $denda;

                $transaksi->metode_bayar = $metode;
                $transaksi->status_pembayaran = $metode === 'qris' ? 'menunggu' : 'lunas';

                $transaksi->save();

                // Kalau transaksi ini berasal dari booking, baru sekarang
                // (kendaraan benar-benar keluar) booking ditandai 'selesai' -
                // ini yang membuat QR booking di sisi pelanggan hilang
                // (lihat RiwayatBooking.jsx: bisaTampilkanQr).
                $transaksi->booking?->update(['status' => 'selesai']);

                LogAktivitas::catat(
                    $request->user()->id_user,
                    'Mencatat kendaraan keluar parkir (id_parkir: ' . $transaksi->id_parkir . ')'
                        . ' - metode bayar: ' . $metode
                        . ($denda > 0 ? ' - denda keterlambatan booking (otomatis): Rp' . number_format($denda, 0, ',', '.') : '')
                );
            });
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal mencatat kendaraan keluar, silakan coba lagi'], 500);
        }

        return response()->json([
            'message' => 'Kendaraan berhasil dicatat keluar',
            'data'    => $transaksi,
        ]);
    }

    public function cetakStruk($id)
    {
        $transaksi = Transaksi::with(['kendaraan', 'tarif', 'area', 'user:id_user,nama_lengkap'])->find($id);

        if (! $transaksi) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        }

        return response()->json([
            'no_struk'       => 'STR-' . str_pad($transaksi->id_parkir, 6, '0', STR_PAD_LEFT),
            'plat_nomor'     => $transaksi->kendaraan->plat_nomor,
            'jenis_kendaraan' => $transaksi->kendaraan->jenis_kendaraan,
            'area'           => $transaksi->area->nama_area,
            'waktu_masuk'    => $transaksi->waktu_masuk,
            'waktu_keluar'   => $transaksi->waktu_keluar,
            'durasi_jam'     => $transaksi->durasi_jam,
            'tarif_per_jam'  => $transaksi->tarif->tarif_per_jam,
            // biaya_total sudah termasuk denda - biaya_parkir dikirim terpisah
            // supaya struk bisa menampilkan rinciannya (parkir + denda).
            'biaya_parkir'   => $transaksi->biaya_total - $transaksi->denda,
            'denda'          => $transaksi->denda,
            'biaya_total'    => $transaksi->biaya_total,
            'metode_bayar'   => $transaksi->metode_bayar,
            'status_pembayaran' => $transaksi->status_pembayaran,
            'petugas'        => $transaksi->user->nama_lengkap,
        ]);
    }

    public function rekap(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dari'   => 'required|date',
            'sampai' => 'required|date|after_or_equal:dari',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $transaksi = Transaksi::with(['kendaraan:id_kendaraan,plat_nomor,jenis_kendaraan', 'area:id_area,nama_area'])
            ->whereBetween('waktu_masuk', [$request->dari . ' 00:00:00', $request->sampai . ' 23:59:59'])
            ->where('status', 'keluar')
            ->orderBy('waktu_masuk')
            ->get();

        $totalPendapatan = $transaksi->sum('biaya_total');
        $totalTransaksi  = $transaksi->count();

        $rincianHarian = DB::select('CALL sp_rekap_periode(?, ?)', [$request->dari, $request->sampai]);

        return response()->json([
            'periode'          => $request->dari . ' s/d ' . $request->sampai,
            'total_transaksi'  => $totalTransaksi,
            'total_pendapatan' => $totalPendapatan,
            'rincian_harian'   => $rincianHarian,
            'data'             => $transaksi,
        ]);
    }

    public function kendaraanDidalam()
    {
        $jumlah = Transaksi::where('status', 'masuk')->count();

        return response()->json([
            'jumlah_kendaraan_didalam' => $jumlah,
        ]);
    }

    // GET /api/transaksi/sedang-parkir?cari=AD1234
    // Daftar LENGKAP kendaraan yang masih di area parkir (tanpa pagination),
    // dipakai halaman Kendaraan Keluar. Bisa difilter dengan plat nomor lewat ?cari=.
    //
    // Relasi 'booking' (khususnya tanggal_rencana & jam_rencana_keluar) ikut
    // di-load supaya frontend bisa mendeteksi kendaraan booking yang sudah
    // melewati jam rencana keluarnya (overstay) tanpa perlu request tambahan,
    // dan menampilkannya sebagai kandidat denda.
    public function sedangParkir(Request $request)
    {
        $query = Transaksi::with([
                'kendaraan:id_kendaraan,plat_nomor,jenis_kendaraan',
                'area:id_area,nama_area',
                'booking:id_booking,kode_booking,tanggal_rencana,jam_rencana_keluar',
            ])
            ->where('status', 'masuk')
            ->orderBy('waktu_masuk', 'asc');

        if ($request->filled('cari')) {
            $cari = $request->input('cari');
            $query->whereHas('kendaraan', function ($q) use ($cari) {
                $q->where('plat_nomor', 'like', "%{$cari}%");
            });
        }

        return response()->json($query->get());
    }

    // GET /api/transaksi/cari-booking/{kode_booking}
    // Dipakai halaman Kendaraan Keluar untuk mencari kendaraan yang SEDANG
    // PARKIR berdasarkan kode booking-nya (input manual maupun hasil scan QR
    // lewat ModalScanQr) - beda dengan BookingController::cariByKode yang
    // dipakai di Kendaraan Masuk (itu mencari booking yang BELUM check-in).
    public function cariBookingSedangParkir($kode_booking)
    {
        $transaksi = Transaksi::with([
                'kendaraan:id_kendaraan,plat_nomor,jenis_kendaraan',
                'area:id_area,nama_area',
                'booking:id_booking,kode_booking,tanggal_rencana,jam_rencana_keluar',
            ])
            ->where('status', 'masuk')
            ->whereHas('booking', function ($q) use ($kode_booking) {
                $q->where('kode_booking', $kode_booking);
            })
            ->first();

        if (! $transaksi) {
            return response()->json([
                'message' => 'Tidak ditemukan kendaraan yang sedang parkir dengan kode booking ini. Pastikan kendaraan sudah dicatat masuk dan belum diproses keluar.',
            ], 404);
        }

        return response()->json($transaksi);
    }

    // GET /api/transaksi/rekap-harian
    // GET /api/transaksi/rekap-harian?dari=2026-08-01&sampai=2026-08-10
    //
    // Rekap transaksi per hari, dihitung dari kendaraan yang SUDAH keluar
    // (biaya_total baru terisi final saat status = 'keluar').
    // Kalau dari/sampai tidak dikirim, default-nya 7 hari terakhir
    // (perilaku lama tetap jalan, jadi tidak breaking untuk pemanggil lama).
    public function rekapHarian(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dari'   => 'nullable|date',
            'sampai' => 'nullable|date|after_or_equal:dari',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->filled('dari') && $request->filled('sampai')) {
            $mulai   = Carbon::parse($request->dari)->startOfDay();
            $selesai = Carbon::parse($request->sampai)->endOfDay();
        } else {
            $mulai   = now()->subDays(6)->startOfDay();
            $selesai = now()->endOfDay();
        }

        // Batasi rentang maksimum 90 hari supaya query & payload tetap wajar
        if ($mulai->diffInDays($selesai) > 90) {
            return response()->json([
                'message' => 'Rentang tanggal maksimum adalah 90 hari',
            ], 422);
        }

        $rekap = Transaksi::where('status', 'keluar')
            ->whereBetween('waktu_keluar', [$mulai, $selesai])
            ->selectRaw('DATE(waktu_keluar) as tanggal, COUNT(*) as jumlah_transaksi, SUM(biaya_total) as pendapatan')
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        $jumlahHari = (int) $mulai->diffInDays($selesai);

        $hasil = collect(range(0, $jumlahHari))->map(function ($i) use ($rekap, $mulai) {
            $tanggal = $mulai->copy()->addDays($i)->format('Y-m-d');
            $data = $rekap->firstWhere('tanggal', $tanggal);

            return [
                'tanggal' => $tanggal,
                'jumlah_transaksi' => $data->jumlah_transaksi ?? 0,
                'pendapatan' => (int) ($data->pendapatan ?? 0),
            ];
        });

        return response()->json($hasil);
    }
    // GET /api/transaksi/rekap-harian-publik
    // PUBLIK - dipakai landing page untuk menampilkan grafik tren transaksi.
    // Selalu 7 hari terakhir (tidak menerima parameter dari luar) dan TIDAK
    // menyertakan field pendapatan, supaya data finansial tetap hanya bisa
    // diakses lewat endpoint admin yang butuh login (rekapHarian di atas).
    public function rekapHarianPublik()
    {
        $mulai   = now()->subDays(6)->startOfDay();
        $selesai = now()->endOfDay();

        $rekap = Transaksi::where('status', 'keluar')
            ->whereBetween('waktu_keluar', [$mulai, $selesai])
            ->selectRaw('DATE(waktu_keluar) as tanggal, COUNT(*) as jumlah_transaksi')
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        $hasil = collect(range(0, 6))->map(function ($i) use ($rekap, $mulai) {
            $tanggal = $mulai->copy()->addDays($i)->format('Y-m-d');
            $data = $rekap->firstWhere('tanggal', $tanggal);

            return [
                'tanggal' => $tanggal,
                'jumlah_transaksi' => $data->jumlah_transaksi ?? 0,
            ];
        });

        return response()->json($hasil);
    }
}