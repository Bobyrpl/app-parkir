import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, Badge, Button } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

const STATUS_TONE = {
    menunggu: 'warning',
    disetujui: 'success',
    ditolak: 'danger',
};

const STATUS_LABEL = {
    menunggu: 'Menunggu',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
};

export default function PermintaanAktivasi() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('menunggu');
    const [processingId, setProcessingId] = useState(null);
    const [tolakTarget, setTolakTarget] = useState(null);
    const [catatanTolak, setCatatanTolak] = useState('');
    const { showSuccess, showError } = useToast();

    async function load(status = filter) {
        setLoading(true);
        try {
            const res = await api.get('/permintaan-aktivasi', { params: status ? { status } : {} });
            setData(res.data.data ?? res.data);
        } catch (err) {
            showError('Gagal memuat data permintaan aktivasi.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    async function handleSetujui(id) {
        setProcessingId(id);
        try {
            const res = await api.post(`/permintaan-aktivasi/${id}/setujui`);
            showSuccess(res.data.message || 'Permintaan disetujui, akun diaktifkan kembali');
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menyetujui permintaan.');
        } finally {
            setProcessingId(null);
        }
    }

    function mintaTolak(id) {
        setTolakTarget(id);
        setCatatanTolak('');
    }

    async function konfirmasiTolak() {
        if (!tolakTarget) return;
        setProcessingId(tolakTarget);
        try {
            const res = await api.post(`/permintaan-aktivasi/${tolakTarget}/tolak`, {
                catatan_admin: catatanTolak || undefined,
            });
            showSuccess(res.data.message || 'Permintaan ditolak');
            setTolakTarget(null);
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menolak permintaan.');
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="AKUN"
                title="Permintaan Aktivasi"
                description="Pengajuan aktivasi ulang dari akun yang dinonaktifkan, dikirim lewat halaman Ajukan Aktivasi Akun."
            />

            <div className="flex gap-2 mb-4">
                {[
                    ['menunggu', 'Menunggu'],
                    ['disetujui', 'Disetujui'],
                    ['ditolak', 'Ditolak'],
                    ['', 'Semua'],
                ].map(([value, label]) => (
                    <button
                        key={value || 'semua'}
                        onClick={() => setFilter(value)}
                        className={`rounded-md px-3 py-1.5 text-xs font-mono border ${
                            filter === value
                                ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                                : 'border-[#262626] text-[#A0A0A0] hover:bg-[#1F1F1F]'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <Table columns={['Username', 'Nama Akun', 'Catatan Pemohon', 'Diajukan', 'Status', 'Aksi']}>
                {data.map((p) => (
                    <tr key={p.id_permintaan}>
                        <td className="px-4 py-3 font-mono text-[#F97316]">{p.username}</td>
                        <td className="px-4 py-3">
                            {p.user ? (
                                <>
                                    <p>{p.user.nama_lengkap}</p>
                                    <p className="text-xs text-[#8A8A8A] capitalize">{p.user.role}</p>
                                </>
                            ) : (
                                <span className="text-xs text-[#8A8A8A]">Akun tidak ditemukan</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#A0A0A0] max-w-xs">
                            {p.catatan || <span className="text-[#8A8A8A]">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                            {new Date(p.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                            <Badge tone={STATUS_TONE[p.status] || 'neutral'}>{STATUS_LABEL[p.status] || p.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                            {p.status === 'menunggu' && (
                                <div className="flex gap-2">
                                    <Button onClick={() => handleSetujui(p.id_permintaan)} disabled={processingId === p.id_permintaan}>
                                        Setujui
                                    </Button>
                                    <Button variant="danger" onClick={() => mintaTolak(p.id_permintaan)} disabled={processingId === p.id_permintaan}>
                                        Tolak
                                    </Button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
                {!loading && data.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[#8A8A8A] text-sm">
                            Tidak ada permintaan aktivasi pada status ini.
                        </td>
                    </tr>
                )}
                {loading && (
                    <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[#8A8A8A] text-sm">
                            Memuat data...
                        </td>
                    </tr>
                )}
            </Table>

            {/* Modal tolak dengan catatan opsional - custom (bukan ConfirmDialog bawaan,
                karena perlu textarea catatan_admin) */}
            {!!tolakTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
                    onClick={() => setTolakTarget(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-xl bg-[#161616] border border-[#262626] p-6"
                        onClick={(e) => e.stopPropagation()}
                        role="alertdialog"
                        aria-modal="true"
                    >
                        <h3 className="font-display text-base text-white mb-2">Tolak Permintaan Aktivasi</h3>
                        <p className="text-sm text-[#8A8A8A] mb-4">
                            Yakin ingin menolak permintaan ini? Akun akan tetap nonaktif.
                        </p>
                        <label className="block text-xs font-mono text-[#8A8A8A] mb-1.5">
                            CATATAN UNTUK PEMOHON <span className="normal-case">(opsional)</span>
                        </label>
                        <textarea
                            value={catatanTolak}
                            onChange={(e) => setCatatanTolak(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Alasan penolakan..."
                            className="w-full rounded-md bg-[#1F1F1F] border border-[#262626] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent resize-none mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setTolakTarget(null)} disabled={processingId === tolakTarget}>
                                Batal
                            </Button>
                            <Button variant="danger" onClick={konfirmasiTolak} disabled={processingId === tolakTarget}>
                                {processingId === tolakTarget ? 'Memproses...' : 'Tolak'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="border-t border-[#262626]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[#8A8A8A] text-center sm:text-left">
                    <span>© {new Date().getFullYear()} Parkir Pelabuhan Tanjung Perak</span>
                    <span className="font-mono">SISTEM MANAJEMEN PARKIR</span>
                </div>
            </footer>
        </div>
    );
}