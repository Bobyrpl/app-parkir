import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, Badge, Button, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import ModalQrBooking from '../../components/ModalQrBooking';

const STATUS_TONE = {
    menunggu: 'warning',
    dikonfirmasi: 'success',
    selesai: 'neutral',
    dibatalkan: 'danger',
    kadaluarsa: 'danger',
};

const STATUS_LABEL = {
    menunggu: 'Menunggu Konfirmasi',
    dikonfirmasi: 'Dikonfirmasi',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
    kadaluarsa: 'Kadaluarsa',
};

// Hanya booking dengan status ini yang boleh dihapus dari riwayat.
// Booking yang masih aktif (menunggu/dikonfirmasi) dibatalkan lewat tombol "Batalkan".
const STATUS_RIWAYAT = ['selesai', 'dibatalkan', 'kadaluarsa'];

export default function RiwayatBooking() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [confirmMode, setConfirmMode] = useState(null); // 'batalkan' | 'pilih' | 'semua' | null
    const [deleting, setDeleting] = useState(false);
    const [qrBooking, setQrBooking] = useState(null); // booking yang QR-nya sedang ditampilkan
    const [bookingDibatalkan, setBookingDibatalkan] = useState(null); // booking yang mau dibatalkan (untuk ConfirmDialog)
    const { showSuccess, showError } = useToast();

    async function load() {
        setLoading(true);
        try {
            const res = await api.get('/booking/saya');
            setData(res.data);
            setSelected(new Set());
        } catch (err) {
            showError('Gagal memuat riwayat booking.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const bisaDihapus = useMemo(
        () => data.filter((b) => STATUS_RIWAYAT.includes(b.status)),
        [data]
    );
    const semuaTerpilih = bisaDihapus.length > 0 && selected.size === bisaDihapus.length;

    // Booking masih boleh dibatalkan selama statusnya menunggu/dikonfirmasi
    // DAN kendaraannya belum tercatat masuk ke area parkir (lihat
    // Booking::isBisaDibatalkan() di backend - logika ini harus sama persis).
    function bisaDibatalkan(b) {
        if (!['menunggu', 'dikonfirmasi'].includes(b.status)) return false;
        return b.transaksi?.status !== 'masuk';
    }

    function toggleSatu(id) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleSemua() {
        setSelected(semuaTerpilih ? new Set() : new Set(bisaDihapus.map((b) => b.id_booking)));
    }

    // Dipanggil setelah dikonfirmasi lewat ConfirmDialog (bukan langsung dari
    // tombol) - id booking-nya disimpan dulu di state bookingDibatalkan.
    async function handleBatalkan() {
        const id = bookingDibatalkan?.id_booking;
        if (!id) return;
        setCancellingId(id);
        try {
            await api.delete(`/booking/${id}`);
            showSuccess('Booking berhasil dibatalkan');
            setBookingDibatalkan(null);
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal membatalkan booking.');
        } finally {
            setCancellingId(null);
        }
    }

    async function handleHapusTerpilih() {
        setDeleting(true);
        try {
            const res = await api.delete('/booking/riwayat/pilih', {
                data: { ids: Array.from(selected) },
            });
            showSuccess(res.data.message || 'Riwayat terpilih berhasil dihapus');
            setConfirmMode(null);
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menghapus riwayat terpilih.');
        } finally {
            setDeleting(false);
        }
    }

    async function handleHapusSemua() {
        setDeleting(true);
        try {
            const res = await api.delete('/booking/riwayat/semua');
            showSuccess(res.data.message || 'Semua riwayat berhasil dihapus');
            setConfirmMode(null);
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menghapus semua riwayat.');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="RIWAYAT"
                title="Booking Saya"
                description="Daftar seluruh booking parkir yang pernah anda buat."
            />

            {bisaDihapus.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Button variant="ghost" onClick={toggleSemua}>
                        {semuaTerpilih ? 'Batalkan Pilih' : 'Pilih Semua Riwayat'}
                    </Button>
                    <Button
                        variant="danger"
                        disabled={selected.size === 0}
                        onClick={() => setConfirmMode('pilih')}
                    >
                        Hapus Terpilih {selected.size > 0 ? `(${selected.size})` : ''}
                    </Button>
                    <Button variant="danger" onClick={() => setConfirmMode('semua')}>
                        Hapus Semua Riwayat
                    </Button>
                </div>
            )}

            <Table columns={['', 'Kode', 'Kendaraan', 'Area', 'Tanggal & Jam', 'Status', 'Aksi']}>
                {data.map((b) => {
                    const dihapusBisa = STATUS_RIWAYAT.includes(b.status);
                    // QR cuma berguna kalau booking-nya sudah dikonfirmasi -
                    // itu satu-satunya status yang diterima BookingController::cariByKode
                    // di sisi petugas.
                    const bisaTampilkanQr = b.status === 'dikonfirmasi';
                    return (
                        <tr key={b.id_booking}>
                            <td className="px-4 py-3">
                                {dihapusBisa && (
                                    <input
                                        type="checkbox"
                                        checked={selected.has(b.id_booking)}
                                        onChange={() => toggleSatu(b.id_booking)}
                                        className="h-4 w-4 accent-[#F97316]"
                                    />
                                )}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#F97316]">{b.kode_booking}</td>
                            <td className="px-4 py-3 font-mono uppercase">{b.kendaraan?.plat_nomor}</td>
                            <td className="px-4 py-3">{b.area?.nama_area}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                                {new Date(b.tanggal_rencana).toLocaleDateString('id-ID')} · {b.jam_rencana_masuk?.slice(0, 5)}
                            </td>
                            <td className="px-4 py-3">
                                <Badge tone={STATUS_TONE[b.status] || 'neutral'}>{STATUS_LABEL[b.status] || b.status}</Badge>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    {bisaTampilkanQr && (
                                        <Button variant="ghost" onClick={() => setQrBooking(b)}>
                                            Lihat QR
                                        </Button>
                                    )}
                                    {bisaDibatalkan(b) ? (
                                        <Button
                                            variant="danger"
                                            onClick={() => setBookingDibatalkan(b)}
                                            disabled={cancellingId === b.id_booking}
                                        >
                                            {cancellingId === b.id_booking ? 'Memproses...' : 'Batalkan'}
                                        </Button>
                                    ) : (
                                        b.status === 'dikonfirmasi' &&
                                        b.transaksi?.status === 'masuk' && (
                                            <span className="text-xs text-[#8A8A8A]">
                                                Kendaraan sudah masuk area parkir
                                            </span>
                                        )
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
                {!loading && data.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-[#8A8A8A] text-sm">
                            Belum ada booking. Buat booking baru lewat menu "Booking Parkir".
                        </td>
                    </tr>
                )}
                {loading && (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-[#8A8A8A] text-sm">
                            Memuat data...
                        </td>
                    </tr>
                )}
            </Table>

            {qrBooking && <ModalQrBooking booking={qrBooking} onClose={() => setQrBooking(null)} />}

            <ConfirmDialog
                open={!!bookingDibatalkan}
                title="Batalkan Booking"
                message={`Yakin ingin membatalkan booking ${bookingDibatalkan?.kode_booking || ''}? Tindakan ini tidak bisa dibatalkan.`}
                confirmLabel="Batalkan"
                loading={cancellingId === bookingDibatalkan?.id_booking}
                onConfirm={handleBatalkan}
                onCancel={() => setBookingDibatalkan(null)}
            />
            <ConfirmDialog
                open={confirmMode === 'pilih'}
                title="Hapus Riwayat Terpilih"
                message={`Yakin ingin menghapus ${selected.size} riwayat booking yang dipilih? Tindakan ini tidak bisa dibatalkan.`}
                loading={deleting}
                onConfirm={handleHapusTerpilih}
                onCancel={() => setConfirmMode(null)}
            />
            <ConfirmDialog
                open={confirmMode === 'semua'}
                title="Hapus Semua Riwayat"
                message={`Yakin ingin menghapus seluruh riwayat booking anda (${bisaDihapus.length} data)? Tindakan ini tidak bisa dibatalkan.`}
                loading={deleting}
                onConfirm={handleHapusSemua}
                onCancel={() => setConfirmMode(null)}
            />

            <footer className="border-t border-[#262626]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[#8A8A8A] text-center sm:text-left">
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