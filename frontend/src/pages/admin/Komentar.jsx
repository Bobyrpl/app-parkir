import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Button, ConfirmDialog } from '../../components/ui';

const ITEM_PER_HALAMAN = 5;

function Bintang({ jumlah }) {
    return (
        <div className="flex gap-0.5" aria-label={`${jumlah} dari 5 bintang`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                        d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6L10 1z"
                        fill={i <= jumlah ? '#FACC15' : '#E5E5E5'}
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
                        <p className="text-sm text-neutral-900 font-medium">{komentar.nama}</p>
                        <Bintang jumlah={komentar.rating ?? 5} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(komentar.created_at).toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge tone={sudahDibalas ? 'success' : 'warning'}>
                        {sudahDibalas ? 'Sudah dibalas' : 'Belum dibalas'}
                    </Badge>
                    <Button variant="danger" size="sm" onClick={() => onHapus(komentar)}>
                        Hapus
                    </Button>
                </div>
            </div>

            <p className="text-sm text-neutral-500 leading-relaxed mt-3">{komentar.teks}</p>

            <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                    Balasan Admin
                </label>
                <textarea
                    value={balasan}
                    onChange={(e) => setBalasan(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Tulis balasan untuk komentar ini..."
                    className="w-full rounded-xl bg-white border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 resize-none transition-all"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                    {sudahDibalas && balasan.trim() === '' && (
                        <span className="text-xs text-rose-600 mr-auto">
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

function FilterButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
        >
            {children}
        </button>
    );
}

function Pagination({ halaman, totalHalaman, onGanti }) {
    if (totalHalaman <= 1) return null;

    // Susun nomor halaman ringkas: selalu tampilkan halaman pertama, terakhir,
    // halaman saat ini, dan satu tetangga di kiri-kanannya. Sisanya diwakili "...".
    const nomor = [];
    for (let i = 1; i <= totalHalaman; i++) {
        const dekatDenganAktif = Math.abs(i - halaman) <= 1;
        if (i === 1 || i === totalHalaman || dekatDenganAktif) {
            nomor.push(i);
        } else if (nomor[nomor.length - 1] !== '...') {
            nomor.push('...');
        }
    }

    return (
        <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
                onClick={() => onGanti(halaman - 1)}
                disabled={halaman === 1}
                className="rounded-full px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-500 hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-100 transition-colors"
            >
                Sebelumnya
            </button>

            {nomor.map((n, idx) =>
                n === '...' ? (
                    <span key={`dots-${idx}`} className="px-1.5 text-xs text-neutral-400">
                        …
                    </span>
                ) : (
                    <button
                        key={n}
                        onClick={() => onGanti(n)}
                        className={`min-w-[32px] rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            n === halaman
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                    >
                        {n}
                    </button>
                )
            )}

            <button
                onClick={() => onGanti(halaman + 1)}
                disabled={halaman === totalHalaman}
                className="rounded-full px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-500 hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-100 transition-colors"
            >
                Berikutnya
            </button>
        </div>
    );
}

export default function Komentar() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('semua'); // semua | belum | sudah
    const [filterRating, setFilterRating] = useState('semua'); // semua | 1 | 2 | 3 | 4 | 5
    const [halaman, setHalaman] = useState(1);
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

    // Ganti filter (status / rating) sekaligus reset ke halaman 1, supaya
    // tidak nyangkut di halaman yang mungkin sudah kosong setelah difilter.
    function gantiFilter(nilai) {
        setFilter(nilai);
        setHalaman(1);
    }

    function gantiFilterRating(nilai) {
        setFilterRating(nilai);
        setHalaman(1);
    }

    const filtered = useMemo(() => {
        return data.filter((k) => {
            if (filter === 'belum' && k.balasan) return false;
            if (filter === 'sudah' && !k.balasan) return false;
            if (filterRating !== 'semua' && (k.rating ?? 5) !== Number(filterRating)) return false;
            return true;
        });
    }, [data, filter, filterRating]);

    // Jumlah komentar per rating, dipakai untuk badge angka di tombol filter.
    const jumlahPerRating = useMemo(
        () =>
            [1, 2, 3, 4, 5].reduce((acc, r) => {
                acc[r] = data.filter((k) => (k.rating ?? 5) === r).length;
                return acc;
            }, {}),
        [data]
    );

    const totalHalaman = Math.max(1, Math.ceil(filtered.length / ITEM_PER_HALAMAN));
    const halamanAman = Math.min(halaman, totalHalaman);
    const ditampilkan = filtered.slice(
        (halamanAman - 1) * ITEM_PER_HALAMAN,
        halamanAman * ITEM_PER_HALAMAN
    );

    function gantiHalaman(n) {
        setHalaman(Math.min(Math.max(n, 1), totalHalaman));
        // Scroll ke atas daftar komentar biar user langsung lihat halaman baru,
        // bukan tetap di posisi scroll lama yang mungkin sudah di bawah.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div>
            <PageHeader
                eyebrow="LANDING PAGE"
                title="Komentar Pengunjung"
                description="Lihat dan balas komentar yang dikirim pengunjung lewat landing page."
            />

            <div className="flex gap-2 mb-3 flex-wrap">
                <FilterButton active={filter === 'semua'} onClick={() => gantiFilter('semua')}>
                    Semua
                </FilterButton>
                <FilterButton active={filter === 'belum'} onClick={() => gantiFilter('belum')}>
                    Belum dibalas
                </FilterButton>
                <FilterButton active={filter === 'sudah'} onClick={() => gantiFilter('sudah')}>
                    Sudah dibalas
                </FilterButton>
            </div>

            <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Rating:</span>
                <FilterButton active={filterRating === 'semua'} onClick={() => gantiFilterRating('semua')}>
                    Semua
                </FilterButton>
                {[5, 4, 3, 2, 1].map((r) => (
                    <FilterButton
                        key={r}
                        active={filterRating === String(r)}
                        onClick={() => gantiFilterRating(String(r))}
                    >
                        <span className="flex items-center gap-1">
                            <Bintang jumlah={r} />
                            <span>({jumlahPerRating[r] ?? 0})</span>
                        </span>
                    </FilterButton>
                ))}
            </div>

            {loading && <p className="text-sm text-neutral-500">Memuat komentar...</p>}

            {!loading && filtered.length === 0 && (
                <Card className="p-6 text-center text-sm text-neutral-500">
                    Tidak ada komentar untuk ditampilkan.
                </Card>
            )}

            {!loading && filtered.length > 0 && (
                <>
                    <p className="text-xs text-neutral-400 mb-3">
                        Menampilkan {ditampilkan.length} dari {filtered.length} komentar
                        {totalHalaman > 1 && ` — halaman ${halamanAman} dari ${totalHalaman}`}
                    </p>

                    <div className="space-y-4">
                        {ditampilkan.map((k) => (
                            <KomentarItem
                                key={k.id}
                                komentar={k}
                                onSaved={handleSaved}
                                onHapus={setHapusTarget}
                            />
                        ))}
                    </div>

                    <Pagination halaman={halamanAman} totalHalaman={totalHalaman} onGanti={gantiHalaman} />
                </>
            )}

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

            <footer className="border-t border-neutral-200">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-neutral-400 text-center sm:text-left">
                    <span>© {new Date().getFullYear()} Parkir Pelabuhan Tanjung Perak</span>
                    <span className="uppercase tracking-wide">Sistem Manajemen Parkir</span>
                </div>
            </footer>
        </div>
    );
}