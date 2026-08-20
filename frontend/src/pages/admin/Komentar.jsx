import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Button, ConfirmDialog } from '../../components/ui';

function Bintang({ jumlah }) {
    return (
        <div className="flex gap-0.5" aria-label={`${jumlah} dari 5 bintang`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                        d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6L10 1z"
                        fill={i <= jumlah ? '#F4B400' : '#3A3F49'}
                    />
                </svg>
            ))}
        </div>
    );
}

function KomentarItem({ komentar, onSaved, onHapus }) {
    const [balasan, setBalasan] = useState(komentar.balasan ?? '');
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError } = useToast();

    const sudahDibalas = Boolean(komentar.balasan);
    const berubah = balasan.trim() !== (komentar.balasan ?? '').trim();

    async function kirimBalasan() {
        setSaving(true);
        try {
            const res = await api.post(`/komentar/${komentar.id}/balas`, {
                balasan: balasan.trim(),
            });
            onSaved(res.data);
            showSuccess(
                balasan.trim() ? 'Balasan berhasil dikirim.' : 'Balasan berhasil dihapus.'
            );
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menyimpan balasan.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-[#EDEFF2] font-medium">{komentar.nama}</p>
                        <Bintang jumlah={komentar.rating ?? 5} />
                    </div>
                    <p className="text-xs text-[#8B94A3] mt-0.5 font-mono">
                        {new Date(komentar.created_at).toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge tone={sudahDibalas ? 'success' : 'warning'}>
                        {sudahDibalas ? 'Sudah dibalas' : 'Belum dibalas'}
                    </Badge>
                    <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => onHapus(komentar)}>
                        Hapus
                    </Button>
                </div>
            </div>

            <p className="text-sm text-[#C3C9D3] leading-relaxed mt-3">{komentar.teks}</p>

            <div className="mt-4">
                <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">
                    BALASAN ADMIN
                </label>
                <textarea
                    value={balasan}
                    onChange={(e) => setBalasan(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Tulis balasan untuk komentar ini..."
                    className="w-full rounded-md bg-[#14181F] border border-white/10 px-3 py-2 text-sm text-[#EDEFF2] focus:outline-none focus:ring-2 focus:ring-[#F4B400] focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                    {sudahDibalas && balasan.trim() === '' && (
                        <span className="text-xs text-[#E5484D] mr-auto">
                            Kosongkan lalu kirim untuk menghapus balasan.
                        </span>
                    )}
                    <Button
                        variant="primary"
                        onClick={kirimBalasan}
                        disabled={saving || !berubah}
                    >
                        {saving
                            ? 'Menyimpan...'
                            : sudahDibalas
                            ? 'Perbarui Balasan'
                            : 'Kirim Balasan'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export default function Komentar() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('semua'); // semua | belum | sudah
    const [filterRating, setFilterRating] = useState('semua'); // semua | 1 | 2 | 3 | 4 | 5
    const [hapusTarget, setHapusTarget] = useState(null);
    const [menghapus, setMenghapus] = useState(false);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        async function load() {
            try {
                const res = await api.get('/komentar');
                setData(res.data);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    function handleSaved(updated) {
        setData((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
    }

    async function konfirmasiHapus() {
        if (!hapusTarget) return;
        setMenghapus(true);
        try {
            await api.delete(`/komentar/${hapusTarget.id}`);
            setData((prev) => prev.filter((k) => k.id !== hapusTarget.id));
            showSuccess('Komentar berhasil dihapus.');
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menghapus komentar.');
        } finally {
            setMenghapus(false);
            setHapusTarget(null);
        }
    }

    const filtered = data.filter((k) => {
        if (filter === 'belum' && k.balasan) return false;
        if (filter === 'sudah' && !k.balasan) return false;
        if (filterRating !== 'semua' && (k.rating ?? 5) !== Number(filterRating)) return false;
        return true;
    });

    // Jumlah komentar per rating, dipakai untuk badge angka di tombol filter.
    const jumlahPerRating = [1, 2, 3, 4, 5].reduce((acc, r) => {
        acc[r] = data.filter((k) => (k.rating ?? 5) === r).length;
        return acc;
    }, {});

    return (
        <div>
            <PageHeader
                eyebrow="LANDING PAGE"
                title="Komentar Pengunjung"
                description="Lihat dan balas komentar yang dikirim pengunjung lewat landing page."
            />

            <div className="flex gap-2 mb-3 flex-wrap">
                {[
                    { key: 'semua', label: 'Semua' },
                    { key: 'belum', label: 'Belum dibalas' },
                    { key: 'sudah', label: 'Sudah dibalas' },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`rounded-md px-3 py-1.5 text-xs font-mono transition-colors ${
                            filter === f.key
                                ? 'bg-[#F4B400] text-[#14181F]'
                                : 'bg-white/5 text-[#8B94A3] hover:bg-white/10'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="text-xs font-mono text-[#8B94A3]">RATING:</span>
                <button
                    onClick={() => setFilterRating('semua')}
                    className={`rounded-md px-3 py-1.5 text-xs font-mono transition-colors ${
                        filterRating === 'semua'
                            ? 'bg-[#F4B400] text-[#14181F]'
                            : 'bg-white/5 text-[#8B94A3] hover:bg-white/10'
                    }`}
                >
                    Semua
                </button>
                {[5, 4, 3, 2, 1].map((r) => (
                    <button
                        key={r}
                        onClick={() => setFilterRating(String(r))}
                        className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-mono transition-colors ${
                            filterRating === String(r)
                                ? 'bg-[#F4B400] text-[#14181F]'
                                : 'bg-white/5 text-[#8B94A3] hover:bg-white/10'
                        }`}
                    >
                        <Bintang jumlah={r} />
                        <span>({jumlahPerRating[r] ?? 0})</span>
                    </button>
                ))}
            </div>

            {loading && (
                <p className="text-sm text-[#8B94A3]">Memuat komentar...</p>
            )}

            {!loading && filtered.length === 0 && (
                <Card className="p-6 text-center text-sm text-[#8B94A3]">
                    Tidak ada komentar untuk ditampilkan.
                </Card>
            )}

            <div className="space-y-4">
                {filtered.map((k) => (
                    <KomentarItem
                        key={k.id}
                        komentar={k}
                        onSaved={handleSaved}
                        onHapus={setHapusTarget}
                    />
                ))}
            </div>

            <ConfirmDialog
                open={!!hapusTarget}
                title="Hapus Komentar"
                message={
                    hapusTarget
                        ? `Yakin ingin menghapus komentar dari "${hapusTarget.nama}"? Komentar akan langsung hilang dari landing page dan tidak dapat dikembalikan.`
                        : ''
                }
                confirmLabel="Hapus"
                loading={menghapus}
                onConfirm={konfirmasiHapus}
                onCancel={() => setHapusTarget(null)}
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