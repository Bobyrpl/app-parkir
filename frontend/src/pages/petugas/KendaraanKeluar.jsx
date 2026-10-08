import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Card, Table, Button, Badge, Input } from '../../components/ui';
import StrukCard from '../../components/StrukCard';
import { useToast } from '../../context/ToastContext';
import ModalQris from '../../components/ModalQris';
import ModalScanQr from '../../components/ModalScanQr';

const ITEM_PER_HALAMAN = 10;

function hitungMenitTerlambat(item) {
    const booking = item.booking;
    if (!booking?.tanggal_rencana || !booking?.jam_rencana_keluar) return null;

    const tanggal = String(
        booking.tanggal_rencana_keluar || booking.tanggal_rencana,
    ).slice(0, 10);
    const rencanaKeluar = new Date(`${tanggal}T${booking.jam_rencana_keluar}`);
    if (Number.isNaN(rencanaKeluar.getTime())) return null;

    const menit = Math.floor((Date.now() - rencanaKeluar.getTime()) / 60000);
    return menit > 0 ? menit : null;
}

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
    const [rawData, setRawData] = useState([]);
    const [areaList, setAreaList] = useState([]);
    const [cari, setCari] = useState('');
    const [filterArea, setFilterArea] = useState('semua');
    const [hanyaTerlambat, setHanyaTerlambat] = useState(false);
    const [halaman, setHalaman] = useState(1);
    const [pengaturanDenda, setPengaturanDenda] = useState(null);
    const [struk, setStruk] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const [qrisId, setQrisId] = useState(null);
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

    const data = useMemo(() => {
        const keyword = cari.trim().toLowerCase();
        return rawDataDenganStatus.filter((item) => {
            const cocokPlat = !keyword || item.kendaraan?.plat_nomor?.toLowerCase().includes(keyword);
            const cocokArea = filterArea === 'semua' || item.area?.id_area === Number(filterArea);
            const cocokTerlambat = !hanyaTerlambat || item.menitTerlambat !== null;
            return cocokPlat && cocokArea && cocokTerlambat;
        });
    }, [rawDataDenganStatus, cari, filterArea, hanyaTerlambat]);

    useEffect(() => {
        setHalaman(1);
    }, [cari, filterArea, hanyaTerlambat]);

    const totalHalaman = Math.max(1, Math.ceil(data.length / ITEM_PER_HALAMAN));

    const dataHalamanIni = useMemo(() => {
        const mulai = (halaman - 1) * ITEM_PER_HALAMAN;
        return data.slice(mulai, mulai + ITEM_PER_HALAMAN);
    }, [data, halaman]);

    async function cariBooking(kode) {
        if (!kode.trim()) return;
        setCariBookingLoading(true);
        try {
            const res = await api.get(`/transaksi/cari-booking/${kode.trim()}`);
            const t = res.data;
            setCari(t.kendaraan?.plat_nomor || '');
            setFilterArea('semua');
            setHanyaTerlambat(false);
            showSuccess(`Booking ditemukan: ${t.kendaraan?.plat_nomor} Ã¢â‚¬â€œ ${t.area?.nama_area}`);
        } catch (err) {
            showError(
                err.response?.data?.message ||
                    'Kendaraan dengan kode booking ini tidak ditemukan di area parkir.'
            );
        } finally {
            setCariBookingLoading(false);
        }
    }

    function handleScanDetected(kode) {
        setScanOpen(false);
        if (/^\d+$/.test(kode.trim())) {
            const idParkir = parseInt(kode.trim());
            const vehicle = rawData.find(v => v.id_parkir === idParkir);
            if (vehicle) {
                showSuccess(`Karcis terdeteksi: ${vehicle.kendaraan?.plat_nomor}`);
            } else {
                showError(`Karcis #${idParkir} tidak ditemukan. Mungkin sudah keluar atau ID salah.`);
            }
        } else {
            setKodeBooking(kode);
            cariBooking(kode);
        }
    }

    async function ambilStrukDanTutup(id) {
        const res = await api.get(`/transaksi/${id}/struk`);
        setStruk(res.data);
        showSuccess(`Kendaraan ${res.data.plat_nomor} berhasil dicatat keluar.`);
        load();
    }

    // PERBAIKAN: Untuk Cash - langsung POST keluar
    async function handleKeluarCash(id) {
        setLoadingId(id);
        try {
            await api.post(`/transaksi/${id}/keluar`, { metode_bayar: 'cash' });
            await ambilStrukDanTutup(id);
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal memproses kendaraan keluar, silakan coba lagi.');
        } finally {
            setLoadingId(null);
        }
    }

    // Untuk QRIS: buka modal dulu. Kendaraan dicatat keluar hanya setelah pembayaran lunas.
    function handleKeluarQris(id) {
        setLoadingId(id);
        setQrisId(id);
    }

    // PERBAIKAN: Baru POST setelah user confirm pembayaran
    async function handleQrisLunas() {
        const id = qrisId;
        setQrisId(null);
        try {
            // ModalQris sudah memproses keluar dan konfirmasi pembayaran.
            await ambilStrukDanTutup(id);
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal mengambil struk kendaraan.');
        } finally {
            setLoadingId(null);
        }
    }

    // PERBAIKAN: Batalkan - langsung tutup modal, jangan load ulang
    function handleQrisBatal() {
        setQrisId(null);
        setLoadingId(null);
        showError('Pembayaran dibatalkan. Kendaraan masih tercatat sedang parkir.');
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Kendaraan Keluar" desc="Proses checkout kendaraan yang sedang parkir" />

            {/* Ringkasan kapasitas per area */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ringkasanPerArea.map((area) => (
                    <Card key={area.id_area} className="p-4">
                        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-tight">
                            {area.nama_area}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-[#171717]">
                            {area.jumlahDidalam}/{area.kapasitas}
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)]">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${(area.jumlahDidalam / area.kapasitas) * 100}%` }}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filter & Pencarian */}
            <Card className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Input
                        placeholder="Cari plat nomor..."
                        value={cari}
                        onChange={(e) => setCari(e.target.value)}
                    />
                    <select
                        value={filterArea}
                        onChange={(e) => setFilterArea(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400"
                    >
                        <option value="semua">Semua Area</option>
                        {areaList.map((area) => (
                            <option key={area.id_area} value={area.id_area}>
                                {area.nama_area}
                            </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
                        <input
                            type="checkbox"
                            checked={hanyaTerlambat}
                            onChange={(e) => setHanyaTerlambat(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <span className="text-sm text-neutral-700">Hanya yang Terlambat</span>
                        {jumlahTerlambat > 0 && (
                            <Badge tone="warning" className="ml-auto text-xs">
                                {jumlahTerlambat}
                            </Badge>
                        )}
                    </label>
                </div>

                {/* Cari Booking */}
                <div className="border-t border-neutral-200 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-tight text-neutral-600">
                        Cari Booking
                    </p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ketik atau scan kode booking..."
                            value={kodeBooking}
                            onChange={(e) => setKodeBooking(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    cariBooking(kodeBooking);
                                    setKodeBooking('');
                                }
                            }}
                        />
                        <Button
                            variant="outline"
                            onClick={() => setScanOpen(true)}
                            disabled={cariBookingLoading}
                        >
                            Scan Qr
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                cariBooking(kodeBooking);
                                setKodeBooking('');
                            }}
                            disabled={cariBookingLoading}
                        >
                            {cariBookingLoading ? 'Mencari...' : 'Cari'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Tabel Kendaraan */}
            <Card>
                <Table>
                    <thead className="bg-[var(--color-bg-secondary)]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                                Plat Nomor
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                                Jenis
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                                Area
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                                Durasi
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                                Booking
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {dataHalamanIni.map((item) => {
                            const terlambat = item.menitTerlambat !== null;
                            return (
                                <tr key={item.id_parkir} className={terlambat ? 'bg-amber-50' : ''}>
                                    <td className="px-4 py-3 font-semibold text-neutral-900">
                                        {item.kendaraan?.plat_nomor}
                                    </td>
                                    <td className="px-4 py-3 text-xs capitalize text-neutral-600">
                                        {item.kendaraan?.jenis_kendaraan}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-neutral-600">
                                        {item.area?.nama_area}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-xs text-neutral-900 font-mono">
                                            {new Date(item.waktu_masuk).toLocaleTimeString('id-ID')}
                                        </p>
                                        <p className="text-[10px] text-neutral-500 font-mono">
                                            ~
                                            {((Date.now() - new Date(item.waktu_masuk).getTime()) / (1000 * 60 * 60)).toFixed(1)}{' '}
                                            jam
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.booking ? (
                                            terlambat ? (
                                                <div className="text-xs">
                                                    <Badge tone="warning">{item.booking.kode_booking}</Badge>
                                                    <p className="text-xs text-[#171717] font-mono mt-1">
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
                                                    <span className="text-[#171717]">
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
                                                    onClick={() => handleKeluarCash(item.id_parkir)}
                                                    disabled={loadingId === item.id_parkir}
                                                >
                                                    {loadingId === item.id_parkir ? 'Memproses...' : 'Cash'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleKeluarQris(item.id_parkir)}
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
                    </tbody>
                </Table>

                {data.length > 0 && totalHalaman > 1 && (
                    <div className="flex items-center justify-between border-t border-neutral-200 p-4 text-sm">
                        <p className="text-[var(--color-text-secondary)] font-mono text-xs">
                            Menampilkan {(halaman - 1) * ITEM_PER_HALAMAN + 1}Ã¢â‚¬â€œ
                            {Math.min(halaman * ITEM_PER_HALAMAN, data.length)} dari {data.length} kendaraan
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                                disabled={halaman === 1}
                            >
                                Ã¢â€ Â Sebelumnya
                            </Button>
                            <span className="text-xs font-mono text-neutral-600">
                                {halaman} / {totalHalaman}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                                disabled={halaman === totalHalaman}
                            >
                                Selanjutnya Ã¢â€ â€™
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modals */}
            <StrukCard struk={struk} onClose={() => setStruk(null)} />

            {qrisId && (
                <ModalQris
                    transaksiId={qrisId}
                    onLunas={handleQrisLunas}
                    onBatal={handleQrisBatal}
                />
            )}

            {scanOpen && <ModalScanQr onDetected={handleScanDetected} onClose={() => setScanOpen(false)} />}
        </div>
    );
}
