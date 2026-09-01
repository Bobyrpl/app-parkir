import { Fragment, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, Badge, Button, Input } from '../../components/ui';
import StrukCard from '../../components/StrukCard';
import { useToast } from '../../context/ToastContext';

function tanggalKey(waktu) {
    // ambil bagian tanggal saja (YYYY-MM-DD) dari waktu_masuk, tanpa terpengaruh jam
    return waktu ? waktu.slice(0, 10) : 'tidak-diketahui';
}

function labelGrup(dateKey) {
    if (dateKey === 'tidak-diketahui') return 'Tanggal Tidak Diketahui';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [y, m, d] = dateKey.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);

    if (target.getTime() === today.getTime()) return 'Hari Ini';
    if (target.getTime() === yesterday.getTime()) return 'Kemarin';

    return target.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function Transaksi() {
    const [data, setData] = useState([]);
    const [struk, setStruk] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showError } = useToast();

    // filter rentang tanggal, contoh: dari 2026-01-08 sampai 2026-09-02
    const [dari, setDari] = useState('');
    const [sampai, setSampai] = useState('');

    async function load(params = {}) {
        setLoading(true);
        try {
            const res = await api.get('/transaksi', { params });
            setData(res.data.data ?? res.data);
        } catch (err) {
            showError('Gagal memuat data transaksi.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function handleFilter(e) {
        e.preventDefault();
        load({ dari: dari || undefined, sampai: sampai || undefined });
    }

    function handleReset() {
        setDari('');
        setSampai('');
        load();
    }

    async function handleCetakUlang(id) {
        setLoadingId(id);
        try {
            const res = await api.get(`/transaksi/${id}/struk`);
            setStruk(res.data);
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal memuat struk transaksi ini.');
        } finally {
            setLoadingId(null);
        }
    }

    // Kelompokkan transaksi berdasarkan tanggal waktu_masuk, urut dari yang terbaru
    const grup = useMemo(() => {
        const map = {};
        data.forEach((item) => {
            const key = tanggalKey(item.waktu_masuk);
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });
        return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
    }, [data]);

    return (
        <div>
            <PageHeader
                eyebrow="Riwayat"
                title="Semua Transaksi"
                description="Daftar seluruh transaksi parkir yang tercatat, dikelompokkan per hari."
            />

            <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 mb-4">
                <div>
                    <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">DARI TANGGAL</label>
                    <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">SAMPAI TANGGAL</label>
                    <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <Button type="submit">Terapkan</Button>
                    {(dari || sampai) && (
                        <Button type="button" variant="ghost" onClick={handleReset}>
                            Reset
                        </Button>
                    )}
                </div>
            </form>

            <Table columns={['Plat Nomor', 'Area', 'Masuk', 'Keluar', 'Biaya', 'Status', 'Aksi']}>
                {grup.map(([dateKey, items]) => (
                    <Fragment key={dateKey}>
                        <tr className="bg-[var(--color-section)]">
                            <td
                                colSpan={7}
                                className="px-4 py-2 text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-wide"
                            >
                                {labelGrup(dateKey)} · {items.length} transaksi
                            </td>
                        </tr>
                        {items.map((item) => (
                            <tr key={item.id_parkir}>
                                <td className="px-4 py-3 font-mono uppercase">{item.kendaraan?.plat_nomor}</td>
                                <td className="px-4 py-3">{item.area?.nama_area}</td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {new Date(item.waktu_masuk).toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {item.waktu_keluar ? new Date(item.waktu_keluar).toLocaleString('id-ID') : '-'}
                                </td>
                                <td className="px-4 py-3 font-mono">
                                    {item.biaya_total ? `Rp ${Number(item.biaya_total).toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td className="px-4 py-3">
                                    {item.status === 'masuk' ? (
                                        <Badge tone="warning">Di dalam</Badge>
                                    ) : (
                                        <Badge tone="success">Selesai</Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {item.status === 'keluar' && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleCetakUlang(item.id_parkir)}
                                            disabled={loadingId === item.id_parkir}
                                        >
                                            {loadingId === item.id_parkir ? 'Memuat...' : 'Cetak Ulang'}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </Fragment>
                ))}
                {!loading && data.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-text-secondary)] text-sm">
                            Belum ada transaksi{(dari || sampai) ? ' pada rentang tanggal ini' : ''}.
                        </td>
                    </tr>
                )}
                {loading && (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-text-secondary)] text-sm">
                            Memuat data...
                        </td>
                    </tr>
                )}
            </Table>

            <StrukCard struk={struk} onClose={() => setStruk(null)} />
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