import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, Button, Input, Badge, ConfirmDialog } from '../../components/ui';

const KOSONG = { nama_area: '', kapasitas: '' };

export default function AreaParkir() {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(KOSONG);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [hapusId, setHapusId] = useState(null);
    const [menghapus, setMenghapus] = useState(false);
    const [showForm, setShowForm] = useState(false); // form disembunyikan by default
    const { showSuccess, showError } = useToast();

    async function load() {
        try {
            const res = await api.get('/area-parkir');
            setData(res.data);
        } catch (err) {
            showError('Gagal memuat data area parkir.');
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            if (editId) {
                await api.put(`/area-parkir/${editId}`, form);
                showSuccess('Area parkir berhasil diperbarui.');
            } else {
                await api.post('/area-parkir', form);
                showSuccess('Area parkir berhasil ditambahkan.');
            }
            setForm(KOSONG);
            setEditId(null);
            setShowForm(false); // tutup form setelah berhasil simpan
            load();
        } catch (err) {
            const pesan = 'Gagal menyimpan area parkir';
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
        setEditId(item.id_area);
        setForm({ nama_area: item.nama_area, kapasitas: item.kapasitas });
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
            await api.delete(`/area-parkir/${hapusId}`);
            showSuccess('Area parkir berhasil dihapus.');
            load();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menghapus area parkir.');
        } finally {
            setMenghapus(false);
            setHapusId(null);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="DATA MASTER"
                title="Area Parkir"
                description="Kelola zona parkir beserta kapasitasnya."
            />

            {!showForm && (
                <div className="mb-4 flex justify-end">
                    <Button onClick={handleTambahBaru}>+ Tambah Area</Button>
                </div>
            )}

            <div className={showForm ? 'grid md:grid-cols-3 gap-6' : ''}>
                {showForm && (
                    <Card className="p-5 md:col-span-1 h-fit">
                        <h2 className="font-display text-base text-[var(--color-text)] mb-4">
                            {editId ? 'Edit Area' : 'Tambah Area'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
                                    NAMA AREA
                                </label>
                                <Input
                                    value={form.nama_area}
                                    onChange={(e) => setForm({ ...form, nama_area: e.target.value })}
                                    placeholder="mis. Area A - Motor"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
                                    KAPASITAS
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.kapasitas}
                                    onChange={(e) => setForm({ ...form, kapasitas: e.target.value })}
                                    required
                                />
                            </div>

                            {error && <p className="text-sm text-[#2563eb]">{error}</p>}

                            <div className="flex gap-2 pt-2">
                                <Button type="submit">{editId ? 'Simpan' : 'Tambah'}</Button>
                                <Button type="button" variant="ghost" onClick={handleBatal}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <div className={showForm ? 'md:col-span-2' : ''}>
                    <Table columns={['Nama Area', 'Kapasitas', 'Terisi', 'Status', 'Aksi']}>
                        {data.map((item) => (
                            <tr key={item.id_area}>
                                <td className="px-4 py-3">{item.nama_area}</td>
                                <td className="px-4 py-3 font-mono">{item.kapasitas}</td>
                                <td className="px-4 py-3 font-mono">{item.terisi}</td>
                                <td className="px-4 py-3">
                                    {item.terisi >= item.kapasitas ? (
                                        <Badge tone="danger">Penuh</Badge>
                                    ) : (
                                        <Badge tone="success">Tersedia</Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => handleEdit(item)}>Edit</Button>
                                        <Button variant="danger" onClick={() => mintaHapus(item.id_area)}>Hapus</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-text-secondary)] text-sm">
                                    Belum ada area parkir.
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </div>

            <ConfirmDialog
                open={!!hapusId}
                title="Hapus Area Parkir"
                message="Yakin ingin menghapus area parkir ini? Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Hapus"
                loading={menghapus}
                onConfirm={konfirmasiHapus}
                onCancel={() => setHapusId(null)}
            />

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