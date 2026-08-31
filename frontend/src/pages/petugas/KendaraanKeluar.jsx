import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Card, Table, Button, Badge, Input } from '../../components/ui';
import StrukCard from '../../components/StrukCard';
import { useToast } from '../../context/ToastContext';
import ModalQris from '../../components/ModalQris';
import ModalScanQr from '../../components/ModalScanQr';

// Jumlah baris kendaraan yang ditampilkan per halaman di tabel.
const ITEM_PER_HALAMAN = 10;

// Kendaraan dari booking yang jam_rencana_keluar-nya sudah lewat (tapi masih
// tercatat "masuk" di sini) dianggap overstay - kandidat untuk dikenakan
// denda saat petugas memprosesnya keluar. Dihitung di frontend supaya update
// real-time tanpa perlu refresh (waktu sekarang berjalan terus).
function hitungMenitTerlambat(item) {
    const booking = item.booking;
    if (!booking?.tanggal_rencana || !booking?.jam_rencana_keluar) return null;

    const tanggal = String(booking.tanggal_rencana).slice(0, 10); // ambil YYYY-MM-DD saja
    const rencanaKeluar = new Date(`${tanggal}T${booking.jam_rencana_keluar}`);
    if (Number.isNaN(rencanaKeluar.getTime())) return null;

    const menit = Math.floor((Date.now() - rencanaKeluar.getTime()) / 60000);
    return menit > 0 ? menit : null;
}

// Estimasi denda HANYA untuk ditampilkan sebagai preview ke petugas -
// nominal final & yang benar-benar tersimpan tetap dihitung backend
// (Transaksi::hitungDenda()) saat kendaraan diproses keluar, supaya tidak
// ada celah selisih hitungan/manipulasi dari sisi frontend.
function estimasiDenda(menitTerlambat, pengaturan) {
    if (!pengaturan?.aktif || !pengaturan?.denda_per_jam) return 0;
    const menitBersih = menitTerlambat - (pengaturan.toleransi_menit || 0);
    if (menitBersih <= 0) return 0;
    const jam = Math.ceil(menitBersih / 60);
    return jam * pengaturan.denda_per_jam;
}

function formatDurasiMenit(menit) {
    const jam = Math.floor(menit / 60);
    const sisaMenit = menit % 60;
    if (jam === 0) return `${sisaMenit} menit`;
    return `${jam} jam ${sisaMenit} menit`;
}

export default function KendaraanKeluar() {
    // Data mentah lengkap (semua kendaraan yang masih status 'masuk'),
    // pencarian & filter area dikerjakan di frontend supaya instan.
    const [rawData, setRawData] = useState([]);
    const [areaList, setAreaList] = useState([]);
    const [cari, setCari] = useState('');
    const [filterArea, setFilterArea] = useState('semua');
    const [hanyaTerlambat, setHanyaTerlambat] = useState(false);

    // Halaman aktif untuk tabel (pagination di frontend, 10 baris/halaman).
    const [halaman, setHalaman] = useState(1);

    // Pengaturan denda dari admin (denda_per_jam, toleransi_menit, aktif),
    // dipakai untuk MENAMPILKAN ESTIMASI saja. Nilai final tetap dihitung
    // & disimpan otomatis oleh backend saat request keluar dikirim.
    const [pengaturanDenda, setPengaturanDenda] = useState(null);

    const [struk, setStruk] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const [qrisId, setQrisId] = useState(null);

    // Cari kendaraan booking yang sedang parkir lewat kode booking (ketik
    // manual atau scan QR pelanggan) - begitu ketemu, hasilnya dipakai untuk
    // memfilter tabel di bawah supaya baris kendaraannya langsung terlihat.
    const [kodeBooking, setKodeBooking] = useState('');
    const [cariBookingLoading, setCariBookingLoading] = useState(false);
    const [scanOpen, setScanOpen] = useState(false);

    const { showSuccess, showError } = useToast();

    async function load() {
        try {
            const [transaksi, area, pengaturan] = await Promise.all([
                api.get('/transaksi/sedang-parkir'),
                api.get('/area-parkir'),
                api.get('/pengaturan-denda'),
            ]);
            setRawData(Array.isArray(transaksi.data) ? transaksi.data : []);
            setAreaList(Array.isArray(area.data) ? area.data : []);
            setPengaturanDenda(pengaturan.data);
        } catch (err) {
            setRawData([]);
            showError('Gagal memuat daftar kendaraan di area parkir.');
        }
    }

    useEffect(() => {
        load();
    }, []);

    // Tambahkan info keterlambatan booking ke setiap baris data mentah,
    // dihitung ulang di render supaya nilainya tetap akurat.
    const rawDataDenganStatus = useMemo(() => {
        return rawData.map((item) => ({
            ...item,
            menitTerlambat: hitungMenitTerlambat(item),
        }));
    }, [rawData]);

    const jumlahTerlambat = useMemo(
        () => rawDataDenganStatus.filter((item) => item.menitTerlambat !== null).length,
        [rawDataDenganStatus]
    );

    // Hitung jumlah kendaraan yang sedang di dalam, per area, dari rawData
    // (bukan dari data yang sudah difilter pencarian, biar ringkasannya tetap
    // menunjukkan kondisi keseluruhan meski sedang mencari plat tertentu).
    const ringkasanPerArea = useMemo(() => {
        return areaList.map((a) => {
            const jumlahDidalam = rawData.filter((item) => item.area?.id_area === a.id_area).length;
            return {
                id_area: a.id_area,
                nama_area: a.nama_area,
                kapasitas: a.kapasitas,
                jumlahDidalam,
            };
        });
    }, [areaList, rawData]);

    // Data yang ditampilkan di tabel: gabungan filter pencarian plat nomor +
    // filter area + filter "hanya booking terlambat"
    const data = useMemo(() => {
        const keyword = cari.trim().toLowerCase();
        return rawDataDenganStatus.filter((item) => {
            const cocokPlat = !keyword || item.kendaraan?.plat_nomor?.toLowerCase().includes(keyword);
            const cocokArea = filterArea === 'semua' || item.area?.id_area === Number(filterArea);
            const cocokTerlambat = !hanyaTerlambat || item.menitTerlambat !== null;
            return cocokPlat && cocokArea && cocokTerlambat;
        });
    }, [rawDataDenganStatus, cari, filterArea, hanyaTerlambat]);

    // Balik ke halaman 1 setiap kali hasil filter/pencarian berubah, supaya
    // tidak "nyangkut" di halaman kosong saat hasil filter jadi lebih sedikit.
    useEffect(() => {
        setHalaman(1);
    }, [cari, filterArea, hanyaTerlambat]);

    const totalHalaman = Math.max(1, Math.ceil(data.length / ITEM_PER_HALAMAN));

    // Potongan data untuk halaman yang sedang aktif saja.
    const dataHalamanIni = useMemo(() => {
        const mulai = (halaman - 1) * ITEM_PER_HALAMAN;
        return data.slice(mulai, mulai + ITEM_PER_HALAMAN);
    }, [data, halaman]);

    // Dipakai baik oleh submit form kode booking manual maupun hasil scan QR.
    // Begitu ketemu, isi kolom pencarian plat nomor dengan plat kendaraan
    // hasil booking - tabel di bawah otomatis kefilter ke baris itu saja
    // (memakai mekanisme filter `cari` yang sudah ada), lalu balik ke
    // halaman 1 supaya baris kendaraannya pasti kelihatan.
    async function cariBooking(kode) {
        if (!kode.trim()) return;
        setCariBookingLoading(true);
        try {
            const res = await api.get(`/transaksi/cari-booking/${kode.trim()}`);
            const t = res.data;
            setCari(t.kendaraan?.plat_nomor || '');
            setFilterArea('semua');
            setHanyaTerlambat(false);
            showSuccess(`Booking ditemukan: ${t.kendaraan?.plat_nomor} — ${t.area?.nama_area}`);
        } catch (err) {
            showError(
                err.response?.data?.message ||
                    'Kendaraan dengan kode booking ini tidak ditemukan di area parkir.'
            );
        } finally {
            setCariBookingLoading(false);
        }
    }

    function handleCariBookingSubmit(e) {
        e.preventDefault();
        cariBooking(kodeBooking);
    }

    function handleScanDetected(kode) {
        setScanOpen(false);
        setKodeBooking(kode);
        cariBooking(kode);
    }

    async function ambilStrukDanTutup(id) {
        const res = await api.get(`/transaksi/${id}/struk`);
        setStruk(res.data);
        showSuccess(`Kendaraan ${res.data.plat_nomor} berhasil dicatat keluar.`);
        load();
    }

    async function handleKeluar(id, metode) {
        setLoadingId(id);
        try {
            // Denda tidak dikirim dari sini - backend yang menghitung otomatis.
            await api.post(`/transaksi/${id}/keluar`, { metode_bayar: metode });

            if (metode === 'cash') {
                await ambilStrukDanTutup(id);
            } else {
                setQrisId(id);
                load();
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal memproses kendaraan keluar, silakan coba lagi.');
        } finally {
            setLoadingId(null);
        }
    }

    async function handleQrisLunas() {
        const id = qrisId;
        setQrisId(null);
        try {
            await ambilStrukDanTutup(id);
        } catch {
            showError('Pembayaran diterima, tapi gagal mengambil data struk. Coba buka ulang dari Riwayat Transaksi.');
        }
    }

    function handleQrisBatal() {
        setQrisId(null);
        load();
    }

    return (
        <div>
            <PageHeader
                eyebrow="TRANSAKSI"
                title="Kendaraan Keluar"
                description="Daftar kendaraan yang masih berada di area parkir."
            />

            {/* Cari kendaraan booking yang mau keluar - ketik kode manual atau scan QR pelanggan */}
            <Card className="p-5 mb-6">
                <h2 className="font-display text-base text-[var(--color-text)] mb-3">
                    Kendaraan Booking Mau Keluar?
                </h2>
                <form onSubmit={handleCariBookingSubmit} className="flex gap-2">
                    <Input
                        className="font-mono uppercase"
                        value={kodeBooking}
                        onChange={(e) => setKodeBooking(e.target.value)}
                        placeholder="mis. BKG-7F3K9A"
                    />
                    <Button type="submit" disabled={cariBookingLoading}>
                        {cariBookingLoading ? 'Mencari...' : 'Cari'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setScanOpen(true)}>
                        Scan QR
                    </Button>
                </form>
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                    Ketik atau scan kode booking pelanggan - tabel di bawah otomatis menampilkan
                    kendaraannya supaya tinggal diproses keluar.
                </p>
            </Card>

            {/* Ringkasan jumlah kendaraan di dalam, per area */}
            {ringkasanPerArea.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                    {ringkasanPerArea.map((a) => (
                        <button
                            key={a.id_area}
                            type="button"
                            onClick={() =>
                                setFilterArea((prev) => (prev === String(a.id_area) ? 'semua' : String(a.id_area)))
                            }
                            className={`text-left rounded-lg border p-3 transition ${
                                filterArea === String(a.id_area)
                                    ? 'border-[#C90000] bg-[#C90000]/10'
                                    : 'border-[var(--color-border)] bg-[var(--color-section)] hover:bg-[var(--color-section)]'
                            }`}
                        >
                            <p className="text-xs font-mono text-[var(--color-text-secondary)] truncate">{a.nama_area}</p>
                            <p className="text-2xl font-display text-[var(--color-text)] mt-1">
                                {a.jumlahDidalam}
                                <span className="text-xs text-[var(--color-text-secondary)] font-mono ml-1">
                                    / {a.kapasitas} terisi
                                </span>
                            </p>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                    className="font-mono uppercase sm:max-w-xs"
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    placeholder="Cari plat nomor..."
                />
                <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="rounded-md bg-[var(--color-section)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#C90000] sm:max-w-xs"
                >
                    <option value="semua">Semua area</option>
                    {areaList.map((a) => (
                        <option key={a.id_area} value={a.id_area}>
                            {a.nama_area}
                        </option>
                    ))}
                </select>

                {/* Filter cepat: kendaraan booking yang sudah lewat jam rencana
                    keluar, supaya gampang dicari untuk dikenakan denda. */}
                <button
                    type="button"
                    onClick={() => setHanyaTerlambat((prev) => !prev)}
                    className={`rounded-md px-3 py-2 text-sm font-mono border whitespace-nowrap ${
                        hanyaTerlambat
                            ? 'border-[#C90000] bg-[#C90000]/15 text-[#C90000]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-section)]'
                    }`}
                >
                    Booking Terlambat{jumlahTerlambat > 0 ? ` (${jumlahTerlambat})` : ''}
                </button>

                {(cari || filterArea !== 'semua' || hanyaTerlambat) && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setCari('');
                            setFilterArea('semua');
                            setHanyaTerlambat(false);
                        }}
                    >
                        Reset
                    </Button>
                )}
            </div>

            <Table columns={['Plat Nomor', 'Jenis', 'Area', 'Waktu Masuk', 'Booking', 'Aksi']}>
                {dataHalamanIni.map((item) => {
                    const terlambat = item.menitTerlambat !== null;
                    return (
                        <tr key={item.id_parkir}>
                            <td className="px-4 py-3 font-mono uppercase">{item.kendaraan?.plat_nomor}</td>
                            <td className="px-4 py-3 capitalize">{item.kendaraan?.jenis_kendaraan}</td>
                            <td className="px-4 py-3">{item.area?.nama_area}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                                {new Date(item.waktu_masuk).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3">
                                {item.booking ? (
                                    terlambat ? (
                                        <div>
                                            <Badge tone="danger">Terlambat</Badge>
                                            <p className="text-xs text-[#C90000] font-mono mt-1">
                                                +{formatDurasiMenit(item.menitTerlambat)}
                                            </p>
                                        </div>
                                    ) : (
                                        <Badge tone="neutral">{item.booking.kode_booking}</Badge>
                                    )
                                ) : (
                                    <span className="text-xs text-[var(--color-text-secondary)]">-</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex flex-col gap-2">
                                    {terlambat && (
                                        <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                                            Est. denda:{' '}
                                            <span className="text-[#C90000]">
                                                Rp{' '}
                                                {estimasiDenda(
                                                    item.menitTerlambat,
                                                    pengaturanDenda
                                                ).toLocaleString('id-ID')}
                                            </span>
                                            <span className="block text-[10px] text-[var(--color-text-secondary)]">
                                                (dihitung otomatis saat kendaraan keluar)
                                            </span>
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleKeluar(item.id_parkir, 'cash')}
                                            disabled={loadingId === item.id_parkir}
                                        >
                                            {loadingId === item.id_parkir ? 'Memproses...' : 'Cash'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleKeluar(item.id_parkir, 'qris')}
                                            disabled={loadingId === item.id_parkir}
                                        >
                                            {loadingId === item.id_parkir ? 'Memproses...' : 'QRIS'}
                                        </Button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                {data.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-text-secondary)] text-sm">
                            {cari || filterArea !== 'semua' || hanyaTerlambat
                                ? 'Tidak ada kendaraan yang cocok dengan pencarian/filter ini.'
                                : 'Tidak ada kendaraan di dalam area parkir.'}
                        </td>
                    </tr>
                )}
            </Table>

            {/* Kontrol pagination - hanya tampil kalau datanya lebih dari 1 halaman */}
            {data.length > 0 && totalHalaman > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                    <p className="text-[var(--color-text-secondary)] font-mono text-xs">
                        Menampilkan {(halaman - 1) * ITEM_PER_HALAMAN + 1}
                        {'–'}
                        {Math.min(halaman * ITEM_PER_HALAMAN, data.length)} dari {data.length} kendaraan
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                            disabled={halaman === 1}
                        >
                            Sebelumnya
                        </Button>
                        <span className="font-mono text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                            Hal. {halaman} / {totalHalaman}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                            disabled={halaman === totalHalaman}
                        >
                            Selanjutnya
                        </Button>
                    </div>
                </div>
            )}

            <StrukCard struk={struk} onClose={() => setStruk(null)} />

            {qrisId && (
                <ModalQris
                    transaksiId={qrisId}
                    onLunas={handleQrisLunas}
                    onBatal={handleQrisBatal}
                />
            )}

            {scanOpen && (
                <ModalScanQr onDetected={handleScanDetected} onClose={() => setScanOpen(false)} />
            )}

            <footer className="border-t border-[var(--color-border)]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[var(--color-text-secondary)] text-center sm:text-left">
                    <span>
                        © {new Date().getFullYear()} Parkir Pelabuhan Tanjung
                        Perak
                    </span>
                    <span className="font-mono">SISTEM MANAJEMEN PARKIR</span>
                </div>
            </footer>
        </div>
    );
}