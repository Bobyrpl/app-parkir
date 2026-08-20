<?php
namespace App\Http\Controllers;

use App\Models\AreaParkir;
use App\Models\Booking;
use App\Models\LogAktivitas;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class BookingController extends Controller
{
    /**
     * Booking (menunggu / dikonfirmasi) yang jam rencana masuknya sudah lewat
     * lebih dari batas toleransi ini otomatis ditandai "kadaluarsa".
     * Sama seperti App\Console\Commands\ExpireBookings, tapi dipanggil langsung
     * setiap ada yang membuka daftar/detail booking - jadi tetap up-to-date
     * meskipun scheduler/cron belum atau tidak aktif (mis. saat development lokal).
     */
    private const TOLERANSI_MENIT = 60;

    /**
     * Status yang dianggap "riwayat" (sudah selesai diproses) dan boleh dihapus.
     * Booking yang masih 'menunggu'/'dikonfirmasi' sengaja tidak boleh dihapus
     * lewat endpoint ini - pelanggan pakai /booking/{id} (batalkan), petugas
     * pakai /booking/{id}/konfirmasi atau /booking/{id}/tolak.
     */
    private const STATUS_RIWAYAT = ['selesai', 'dibatalkan', 'kadaluarsa'];

    private function expireBookingKadaluarsa(): void
    {
        $batas = Carbon::now()->subMinutes(self::TOLERANSI_MENIT);

        $booking = Booking::whereIn('status', ['menunggu', 'dikonfirmasi'])
            ->whereNotNull('tanggal_rencana')
            ->whereNotNull('jam_rencana_masuk')
            ->get()
            ->filter(function (Booking $b) use ($batas) {
                try {
                    $waktuRencana = Carbon::parse(
                        $b->tanggal_rencana->format('Y-m-d') . ' ' . $b->jam_rencana_masuk
                    );
                    return $waktuRencana->lt($batas);
                } catch (\Throwable $e) {
                    // Data tanggal/jam tidak valid - lewati baris ini saja,
                    // jangan sampai menghentikan request yang sedang berjalan.
                    return false;
                }
            });

        foreach ($booking as $b) {
            $b->update(['status' => 'kadaluarsa']);

            LogAktivitas::catat(
                null,
                'Booking ' . $b->kode_booking . ' otomatis ditandai kadaluarsa (lewat ' . self::TOLERANSI_MENIT . ' menit tanpa kedatangan)'
            );
        }
    }

    /**
     * GET /api/booking
     * Khusus admin/petugas - lihat semua booking masuk, bisa difilter status.
     */
    public function index(Request $request)
    {
        $this->expireBookingKadaluarsa();

        $query = Booking::with([
            'user:id_user,nama_lengkap,no_telp',
            'kendaraan:id_kendaraan,plat_nomor,jenis_kendaraan',
            'area:id_area,nama_area',
            'tarif:id_tarif,jenis_kendaraan,tarif_per_jam',
        ])->orderBy('tanggal_rencana')->orderBy('jam_rencana_masuk');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(10)->withQueryString());
    }

    /**
     * GET /api/booking/saya
     * Khusus pelanggan - lihat booking miliknya sendiri.
     */
    public function bookingSaya(Request $request)
    {
        $this->expireBookingKadaluarsa();

        $booking = Booking::with([
                'kendaraan:id_kendaraan,plat_nomor,jenis_kendaraan',
                'area:id_area,nama_area',
                'tarif',
                'transaksi:id_parkir,id_booking,status',
            ])
            ->where('id_user', $request->user()->id_user)
            ->orderBy('id_booking', 'desc')
            ->get();

        return response()->json($booking);
    }

    /**
     * POST /api/booking
     * Khusus pelanggan - buat booking baru.
     */
    public function store(Request $request)
    {
        // Middleware `ConvertEmptyStringsToNull` cuma jalan di grup route `web`,
        // bukan `api`. Jadi kalau field time di frontend dikosongkan, yang
        // terkirim ke sini adalah string kosong "" bukan null, dan rule
        // `nullable` tidak menganggapnya kosong sehingga tetap divalidasi
        // date_format/after dan gagal. Normalisasi manual di sini sebelum
        // divalidasi.
        $request->merge([
            'jam_rencana_keluar' => $request->jam_rencana_keluar ?: null,
        ]);

        $validator = Validator::make($request->all(), [
            'id_kendaraan'        => 'required|exists:tb_kendaraan,id_kendaraan',
            'id_area'             => 'required|exists:tb_area_parkir,id_area',
            'id_tarif'            => 'required|exists:tb_tarif,id_tarif',
            'tanggal_rencana'     => 'required|date|after_or_equal:today',
            'jam_rencana_masuk'   => 'required|date_format:H:i',
            'jam_rencana_keluar'  => 'nullable|date_format:H:i|after:jam_rencana_masuk',
            'catatan'             => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Kendaraan yang dipakai booking harus milik pelanggan yang login sendiri
        $kendaraan = \App\Models\Kendaraan::find($request->id_kendaraan);
        if (! $kendaraan || $kendaraan->id_user !== $request->user()->id_user) {
            return response()->json(['message' => 'Kendaraan tidak ditemukan di akun anda'], 403);
        }

        // Kendaraan yang masih tercatat "masuk" (belum keluar dari parkir) tidak
        // boleh dibooking lagi sampai keluar dulu. Dicek di sini juga (bukan cuma
        // di frontend) supaya tidak bisa ditembus lewat request langsung ke API.
        $sedangParkir = Transaksi::where('id_kendaraan', $kendaraan->id_kendaraan)
            ->where('status', 'masuk')
            ->exists();
        if ($sedangParkir) {
            return response()->json([
                'message' => 'Kendaraan ini masih sedang parkir dan belum keluar. Tidak bisa booking lagi sebelum kendaraan ini keluar.',
            ], 422);
        }

        $area = AreaParkir::find($request->id_area);
        if ($area->isPenuh()) {
            return response()->json(['message' => 'Area parkir yang dipilih sedang penuh'], 422);
        }

        $booking = Booking::create([
            'id_user'             => $request->user()->id_user,
            'id_kendaraan'        => $request->id_kendaraan,
            'id_area'             => $request->id_area,
            'id_tarif'            => $request->id_tarif,
            'tanggal_rencana'     => $request->tanggal_rencana,
            'jam_rencana_masuk'   => $request->jam_rencana_masuk,
            'jam_rencana_keluar'  => $request->jam_rencana_keluar,
            'kode_booking'        => Booking::buatKodeBooking(),
            'status'              => 'menunggu',
            'catatan'             => $request->catatan,
        ]);

        LogAktivitas::catat(
            $request->user()->id_user,
            'Membuat booking parkir (kode: ' . $booking->kode_booking . ')'
        );

        return response()->json([
            'message' => 'Booking berhasil dibuat, menunggu konfirmasi petugas',
            'data'    => $booking,
        ], 201);
    }

    /**
     * DELETE /api/booking/{id}
     * Khusus pelanggan - batalkan booking miliknya sendiri.
     */
    public function batalkan(Request $request, $id)
    {
        $booking = Booking::find($id);

        if (! $booking || $booking->id_user !== $request->user()->id_user) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        if (! $booking->isBisaDibatalkan()) {
            return response()->json(['message' => 'Booking ini sudah tidak bisa dibatalkan'], 422);
        }

        $booking->update(['status' => 'dibatalkan']);

        LogAktivitas::catat(
            $request->user()->id_user,
            'Membatalkan booking parkir (kode: ' . $booking->kode_booking . ')'
        );

        return response()->json(['message' => 'Booking berhasil dibatalkan']);
    }

    /**
     * POST /api/booking/{id}/konfirmasi
     * Khusus admin/petugas - konfirmasi booking yang masih "menunggu".
     */
    public function konfirmasi(Request $request, $id)
    {
        $booking = Booking::find($id);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        if ($booking->status !== 'menunggu') {
            return response()->json(['message' => 'Booking ini sudah diproses sebelumnya'], 422);
        }

        $booking->update(['status' => 'dikonfirmasi']);

        LogAktivitas::catat(
            $request->user()->id_user,
            'Mengonfirmasi booking parkir (kode: ' . $booking->kode_booking . ')'
        );

        return response()->json(['message' => 'Booking berhasil dikonfirmasi', 'data' => $booking]);
    }

    /**
     * POST /api/booking/{id}/tolak
     * Khusus admin/petugas - tolak booking yang masih "menunggu".
     */
    public function tolak(Request $request, $id)
    {
        $booking = Booking::find($id);

        if (! $booking) {
            return response()->json(['message' => 'Booking tidak ditemukan'], 404);
        }

        if ($booking->status !== 'menunggu') {
            return response()->json(['message' => 'Booking ini sudah diproses sebelumnya'], 422);
        }

        $booking->update(['status' => 'dibatalkan']);

        LogAktivitas::catat(
            $request->user()->id_user,
            'Menolak booking parkir (kode: ' . $booking->kode_booking . ')'
        );

        return response()->json(['message' => 'Booking berhasil ditolak']);
    }

    /**
     * GET /api/booking/cari/{kode_booking}
     * Khusus admin/petugas - cari booking terkonfirmasi lewat kode,
     * dipakai saat pelanggan datang & mau dicatat sebagai kendaraan masuk.
     */
    public function cariByKode($kode_booking)
    {
        $this->expireBookingKadaluarsa();

        $booking = Booking::with(['kendaraan', 'area', 'tarif'])
            ->where('kode_booking', $kode_booking)
            ->where('status', 'dikonfirmasi')
            ->first();

        if (! $booking) {
            return response()->json(['message' => 'Kode booking tidak ditemukan atau belum dikonfirmasi'], 404);
        }

        return response()->json($booking);
    }

    /**
     * DELETE /api/booking/riwayat/semua
     * Hapus SELURUH riwayat booking yang sudah selesai diproses
     * (status: selesai / dibatalkan / kadaluarsa).
     * - Pelanggan: hanya riwayat miliknya sendiri.
     * - Admin/petugas: seluruh riwayat booking milik semua pelanggan.
     */
    public function hapusSemuaRiwayat(Request $request)
    {
        $this->expireBookingKadaluarsa();

        $query = Booking::whereIn('status', self::STATUS_RIWAYAT);

        if ($request->user()->role === 'pelanggan') {
            $query->where('id_user', $request->user()->id_user);
        }

        $jumlah = $query->count();

        if ($jumlah === 0) {
            return response()->json(['message' => 'Tidak ada riwayat booking untuk dihapus']);
        }

        $query->delete();

        LogAktivitas::catat(
            $request->user()->id_user,
            "Menghapus semua riwayat booking sekaligus ({$jumlah} data)"
        );

        return response()->json(['message' => "Berhasil menghapus {$jumlah} riwayat booking"]);
    }

    /**
     * DELETE /api/booking/riwayat/pilih
     * Hapus booking riwayat yang dipilih satu per satu (checkbox di frontend).
     * Body: { "ids": [1, 2, 3] }
     * - Pelanggan: id yang bukan miliknya, atau yang statusnya masih aktif
     *   (menunggu/dikonfirmasi), otomatis diabaikan (tidak ikut terhapus).
     * - Admin/petugas: sama, hanya status riwayat yang boleh terhapus.
     */
    public function hapusRiwayatTerpilih(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = Booking::whereIn('id_booking', $request->ids)
            ->whereIn('status', self::STATUS_RIWAYAT);

        if ($request->user()->role === 'pelanggan') {
            $query->where('id_user', $request->user()->id_user);
        }

        $idTerhapus = $query->pluck('id_booking');

        if ($idTerhapus->isEmpty()) {
            return response()->json(['message' => 'Tidak ada riwayat booking yang cocok untuk dihapus'], 404);
        }

        Booking::whereIn('id_booking', $idTerhapus)->delete();

        LogAktivitas::catat(
            $request->user()->id_user,
            'Menghapus ' . $idTerhapus->count() . ' riwayat booking terpilih (id: ' . $idTerhapus->implode(', ') . ')'
        );

        return response()->json([
            'message' => 'Berhasil menghapus ' . $idTerhapus->count() . ' riwayat booking',
            'dihapus' => $idTerhapus,
        ]);
    }
}