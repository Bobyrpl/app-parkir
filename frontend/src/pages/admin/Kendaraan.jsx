import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, Button, Input, Badge, ConfirmDialog } from '../../components/ui';

const KOSONG = { plat_nomor: '', jenis_kendaraan: 'motor', warna: '', pemilik: '' };

export default function Kendaraan() {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(KOSONG);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [hapusId, setHapusId] = useState(null);
    const [menghapus, setMenghapus] = useState(false);
    const [showForm, setShowForm] = useState(false); // form disembunyikan by default

    // pencarian plat nomor (pakai endpoint /kendaraan/cari/{plat_nomor})
    const [cariKata, setCariKata] = useState('');
    const [mencari, setMencari] = useState(false);
    const [modePencarian, setModePencarian] = useState(false);

    // pagination (index kendaraan dipaginasi 10/halaman di backend)
    const [halaman, setHalaman] = useState(1);
    const [halamanTerakhir, setHalamanTerakhir] = useState(1);
    const [total, setTotal] = useState(0);

    const { showSuccess, showError } = useToast();

    async function load(page = 1) {
        try {
            const res = await api.get('/kendaraan', { params: { page } });
            const payload = res.data;
            setData(payload.data ?? payload);
            setHalaman(payload.current_page ?? 1);
            setHalamanTerakhir(payload.last_page ?? 1);
            setTotal(payload.total ?? (payload.data ?? payload).length);
        } catch (err) {
            showError('Gagal memuat data kendaraan.');
        }
    }

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // debounce pencarian plat nomor
    useEffect(() => {
        const kata = cariKata.trim();
        if (!kata) {
            setModePencarian(false);
            load(1);
            return;
        }
        setMencari(true);
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/kendaraan/cari/${encodeURIComponent(kata)}`);
                setModePencarian(true);
                setData(res.data.data ?? res.data);
            } catch (err) {
                showError('Gagal mencari kendaraan.');
            } finally {
                setMencari(false);
            }
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cariKata]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            if (editId) {
                await api.put(`/kendaraan/${editId}`, form);
                showSuccess('Kendaraan berhasil diperbarui.');
            } else {
                await api.post('/kendaraan', form);
                showSuccess('Kendaraan berhasil ditambahkan.');
            }
            setForm(KOSONG);
            setEditId(null);
            setShowForm(false); // tutup form setelah berhasil simpan
            if (modePencarian) {
                setCariKata('');
            } else {
                load(halaman);
            }
        } catch (err) {
            const pesan = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(', ')
                : 'Gagal menyimpan kendaraan';
            setError(pesan);
            showError(pesan);
        }
    }

    function handleTambahBaru() {
        setEditId(null);
        setForm(KOSONG);
        setError('');
        setShowForm(true);
    }

    function handleEdit(item) {
        setEditId(item.id_kendaraan);
        setForm({
            plat_nomor: item.plat_nomor,
            jenis_kendaraan: item.jenis_kendaraan,
            warna: item.warna ?? '',
            pemilik: item.pemilik ?? '',
        });
        setError('');
        setShowForm(true); // munculkan form saat tombol Edit ditekan
    }

    function handleBatal() {
        setEditId(null);
        setForm(KOSONG);
        setError('');
        setShowForm(false);
    }

    function mintaHapus(id) {
        setHapusId(id);
    }

    async function konfirmasiHapus() {
        if (!hapusId) return;
        setMenghapus(true);
        try {
            await api.delete(`/kendaraan/${hapusId}`);
            showSuccess('Kendaraan berhasil dihapus.');
            if (modePencarian) {
                setData((prev) => prev.filter((k) => k.id_kendaraan !== hapusId));
            } else {
                load(halaman);
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menghapus kendaraan.');
        } finally {
            setMenghapus(false);
            setHapusId(null);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="DATA MASTER"
                title="Kendaraan"
                description="Kelola data kendaraan yang terdaftar di sistem."
            />

            {!showForm && (
                <div className="mb-4 flex justify-end">
                    <Button onClick={handleTambahBaru}>+ Tambah Kendaraan</Button>
                </div>
            )}

            <div className={showForm ? 'grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6' : ''}>
                {showForm && (
                    <Card className="p-4 sm:p-5 md:col-span-1 h-fit">
                        <h2 className="font-display text-base text-[var(--color-text)] mb-4">
                            {editId ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">PLAT NOMOR</label>
                                <Input
                                    value={form.plat_nomor}
                                    onChange={(e) => setForm({ ...form, plat_nomor: e.target.value.toUpperCase() })}
                                    required
                                    maxLength={15}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">JENIS KENDARAAN</label>
                                <select
                                    value={form.jenis_kendaraan}
                                    onChange={(e) => setForm({ ...form, jenis_kendaraan: e.target.value })}
                                    className="w-full rounded-md bg-[var(--color-section)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                                >
                                    <option value="motor">Motor</option>
                                    <option value="mobil">Mobil</option>
                                    <option value="truk">Truk</option>
                                    <option value="bus">Bus</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">WARNA</label>
                                <Input value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })} maxLength={20} />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">PEMILIK</label>
                                <Input value={form.pemilik} onChange={(e) => setForm({ ...form, pemilik: e.target.value })} maxLength={100} />
                            </div>

                            {error && <p className="text-sm text-[#2563eb]">{error}</p>}

                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button type="submit" className="flex-1 sm:flex-none">{editId ? 'Simpan' : 'Tambah'}</Button>
                                <Button type="button" variant="ghost" className="flex-1 sm:flex-none" onClick={handleBatal}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <div className={`${showForm ? 'md:col-span-2' : ''} -mx-4 sm:mx-0 overflow-x-auto`}>
                    <div className="px-4 sm:px-0 mb-3 flex items-center gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Cari plat nomor..."
                                value={cariKata}
                                onChange={(e) => setCariKata(e.target.value.toUpperCase())}
                            />
                        </div>
                        {mencari && <span className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-nowrap">Mencari...</span>}
                        {!mencari && modePencarian && (
                            <span className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-nowrap">{data.length} hasil</span>
                        )}
                    </div>
                    <div className="min-w-[820px] sm:min-w-0 px-4 sm:px-0">
                        <Table columns={['Plat Nomor', 'Jenis', 'Warna', 'Pemilik', 'Dicatat Oleh', 'Aksi']}>
                            {data.map((item) => (
                                <tr key={item.id_kendaraan}>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono whitespace-nowrap">
                                        {item.plat_nomor}
                                        {modePencarian && item.sedang_parkir && (
                                            <Badge tone="success" className="ml-2">Sedang Parkir</Badge>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 capitalize whitespace-nowrap">{item.jenis_kendaraan}</td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">{item.warna || '—'}</td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">{item.pemilik || '—'}</td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">{item.user?.nama_lengkap || '—'}</td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                        <div className="flex gap-1.5 sm:gap-2 whitespace-nowrap">
                                            <Button variant="ghost" onClick={() => handleEdit(item)}>Edit</Button>
                                            <Button variant="danger" onClick={() => mintaHapus(item.id_kendaraan)}>Hapus</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-text-secondary)] text-sm">
                                        {modePencarian ? 'Tidak ada kendaraan yang cocok dengan pencarian.' : 'Belum ada kendaraan.'}
                                    </td>
                                </tr>
                            )}
                        </Table>
                    </div>

                    {!modePencarian && halamanTerakhir > 1 && (
                        <div className="px-4 sm:px-0 mt-3 flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)]">
                            <span>Total {total} kendaraan</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    disabled={halaman <= 1}
                                    onClick={() => load(halaman - 1)}
                                >
                                    Sebelumnya
                                </Button>
                                <span>Hal {halaman} / {halamanTerakhir}</span>
                                <Button
                                    variant="ghost"
                                    disabled={halaman >= halamanTerakhir}
                                    onClick={() => load(halaman + 1)}
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!hapusId}
                title="Hapus Kendaraan"
                message="Yakin ingin menghapus kendaraan ini? Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Hapus"
                loading={menghapus}
                onConfirm={konfirmasiHapus}
                onCancel={() => setHapusId(null)}
            />

            <footer className="border-t border-[var(--color-border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[var(--color-text-secondary)] text-center sm:text-left">
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