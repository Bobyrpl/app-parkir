import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, Badge, Button, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

const STATUS_TONE = {
    menunggu: 'warning',
    dikonfirmasi: 'success',
    selesai: 'neutral',
    dibatalkan: 'danger',
    kadaluarsa: 'danger',
};

const STATUS_LABEL = {
    menunggu: 'Menunggu',
    dikonfirmasi: 'Dikonfirmasi',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
    kadaluarsa: 'Kadaluarsa',
};

// Hanya booking dengan status ini yang boleh dihapus dari riwayat.
// Booking yang masih aktif (menunggu/dikonfirmasi) diproses lewat konfirmasi/tolak.
const STATUS_RIWAYAT = ['selesai', 'dibatalkan', 'kadaluarsa'];

export default function Booking() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('menunggu');
    const [processingId, setProcessingId] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [confirmMode, setConfirmMode] = useState(null); // 'pilih' | 'semua' | null
    const [deleting, setDeleting] = useState(false);
    const { showSuccess, showError } = useToast();

    async function load(status = filter) {
        setLoading(true);
        try {
            const res = await api.get('/booking', { params: status ? { status } : {} });
            setData(res.data.data ?? res.data);
            setSelected(new Set());
        } catch (err) {
            showError('Gagal memuat data booking.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const bisaDihapus = useMemo(
        () => data.filter((b) => STATUS_RIWAYAT.includes(b.status)),
        [data]
    );
    const semuaTerpilih = bisaDihapus.length > 0 && selected.size === bisaDihapus.length;

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

    async function handleKonfirmasi(id) {
        setProcessingId(id);
        try {
            await api.post(`/booking/${id}/konfirmasi`);
            showSuccess('Booking dikonfirmasi');
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal mengonfirmasi booking.');
        } finally {
            setProcessingId(null);
        }
    }

    async function handleTolak(id) {
        if (!confirm('Yakin ingin menolak booking ini?')) return;
        setProcessingId(id);
        try {
            await api.post(`/booking/${id}/tolak`);
            showSuccess('Booking ditolak');
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menolak booking.');
        } finally {
            setProcessingId(null);
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
            // Menghapus SELURUH riwayat booking (semua pelanggan), tidak hanya
            // yang sedang tampil di filter saat ini.
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
                eyebrow="BOOKING ONLINE"
                title="Booking Masuk"
                description="Kelola booking parkir yang dibuat pelanggan lewat aplikasi."
            />

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex gap-2">
                    {[
                        ['menunggu', 'Menunggu'],
                        ['dikonfirmasi', 'Dikonfirmasi'],
                        ['', 'Semua'],
                    ].map(([value, label]) => (
                        <button
                            key={value || 'semua'}
                            onClick={() => setFilter(value)}
                            className={`rounded-md px-3 py-1.5 text-xs font-mono border ${
                                filter === value
                                    ? 'border-[#F4B400] bg-[#F4B400]/10 text-[#F4B400]'
                                    : 'border-white/10 text-[#C3C9D3] hover:bg-white/5'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {bisaDihapus.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
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
            </div>

            <Table columns={['', 'Kode', 'Pelanggan', 'Kendaraan', 'Area', 'Tanggal & Jam', 'Status', 'Aksi']}>
                {data.map((b) => {
                    const dihapusBisa = STATUS_RIWAYAT.includes(b.status);
                    return (
                        <tr key={b.id_booking}>
                            <td className="px-4 py-3">
                                {dihapusBisa && (
                                    <input
                                        type="checkbox"
                                        checked={selected.has(b.id_booking)}
                                        onChange={() => toggleSatu(b.id_booking)}
                                        className="h-4 w-4 accent-[#F4B400]"
                                    />
                                )}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#F4B400]">{b.kode_booking}</td>
                            <td className="px-4 py-3">
                                <p>{b.user?.nama_lengkap}</p>
                                <p className="text-xs text-[#8B94A3]">{b.user?.no_telp}</p>
                            </td>
                            <td className="px-4 py-3 font-mono uppercase">{b.kendaraan?.plat_nomor}</td>
                            <td className="px-4 py-3">{b.area?.nama_area}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                                {new Date(b.tanggal_rencana).toLocaleDateString('id-ID')} · {b.jam_rencana_masuk?.slice(0, 5)}
                            </td>
                            <td className="px-4 py-3">
                                <Badge tone={STATUS_TONE[b.status] || 'neutral'}>{STATUS_LABEL[b.status] || b.status}</Badge>
                            </td>
                            <td className="px-4 py-3">
                                {b.status === 'menunggu' && (
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleKonfirmasi(b.id_booking)} disabled={processingId === b.id_booking}>
                                            Konfirmasi
                                        </Button>
                                        <Button variant="danger" onClick={() => handleTolak(b.id_booking)} disabled={processingId === b.id_booking}>
                                            Tolak
                                        </Button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {!loading && data.length === 0 && (
                    <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-[#8B94A3] text-sm">
                            Tidak ada booking pada status ini.
                        </td>
                    </tr>
                )}
                {loading && (
                    <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-[#8B94A3] text-sm">
                            Memuat data...
                        </td>
                    </tr>
                )}
            </Table>

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
                message="Yakin ingin menghapus SELURUH riwayat booking dari semua pelanggan (selesai/dibatalkan/kadaluarsa)? Tindakan ini tidak bisa dibatalkan."
                loading={deleting}
                onConfirm={handleHapusSemua}
                onCancel={() => setConfirmMode(null)}
            />

            <footer className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[#8B94A3] text-center sm:text-left">
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