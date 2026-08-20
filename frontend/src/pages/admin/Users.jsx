import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, Button, Input, Badge, ConfirmDialog, StatCard } from '../../components/ui';

const KOSONG = { nama_lengkap: '', username: '', no_telp: '', password: '', role: 'petugas', status_aktif: true };

const ROLE_LABEL = { admin: 'Admin', petugas: 'Petugas', owner: 'Owner' };
const ROLE_BADGE_TONE = { admin: 'warning', petugas: 'info', owner: 'success' };

export default function Users() {
    const [data, setData] = useState([]);
    const [ringkasan, setRingkasan] = useState({ admin: 0, petugas: 0, pelanggan: 0, total: 0 });
    const [ringkasanLoading, setRingkasanLoading] = useState(true);
    const [form, setForm] = useState(KOSONG);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [hapusId, setHapusId] = useState(null);
    const [menghapus, setMenghapus] = useState(false);
    const [cariKata, setCariKata] = useState('');
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useToast();

    // pagination (index users dipaginasi di backend, mengikuti pola /kendaraan)
    const [halaman, setHalaman] = useState(1);
    const [halamanTerakhir, setHalamanTerakhir] = useState(1);
    const [total, setTotal] = useState(0);

    const sedangMencari = cariKata.trim().length > 0;

    async function load(page = 1) {
        setLoading(true);
        try {
            const res = await api.get('/users', { params: { page } });
            const payload = res.data;
            const list = payload.data ?? payload;
            setData(list);
            setHalaman(payload.current_page ?? 1);
            setHalamanTerakhir(payload.last_page ?? 1);
            setTotal(payload.total ?? list.length);
        } catch (err) {
            showError('Gagal memuat data pengguna.');
        } finally {
            setLoading(false);
        }
    }

    async function loadRingkasan() {
        setRingkasanLoading(true);
        try {
            // Endpoint /users dipaginasi 10/halaman di backend, jadi supaya
            // rekapnya akurat (bukan cuma halaman yang lagi ditampilkan),
            // kita tarik semua halaman lalu hitung per role di sini.
            const halamanPertama = await api.get('/users', { params: { page: 1 } });
            const payloadPertama = halamanPertama.data;
            let semuaUser = payloadPertama.data ?? [];
            const totalHalaman = payloadPertama.last_page ?? 1;

            if (totalHalaman > 1) {
                const sisaHalaman = [];
                for (let h = 2; h <= totalHalaman; h++) {
                    sisaHalaman.push(api.get('/users', { params: { page: h } }));
                }
                const hasilSisa = await Promise.all(sisaHalaman);
                hasilSisa.forEach((res) => {
                    semuaUser = semuaUser.concat(res.data.data ?? []);
                });
            }

            const hitung = { admin: 0, petugas: 0, pelanggan: 0 };
            semuaUser.forEach((u) => {
                if (hitung[u.role] !== undefined) hitung[u.role] += 1;
            });

            setRingkasan({
                admin: hitung.admin,
                petugas: hitung.petugas,
                pelanggan: hitung.pelanggan,
                total: semuaUser.length,
            });
        } catch (err) {
            setRingkasan({ admin: 0, petugas: 0, pelanggan: 0, total: 0 });
        } finally {
            setRingkasanLoading(false);
        }
    }

    useEffect(() => {
        load(1);
        loadRingkasan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            const payload = { ...form };
            if (editId && !payload.password) delete payload.password;

            if (editId) {
                await api.put(`/users/${editId}`, payload);
                showSuccess('Pengguna berhasil diperbarui.');
            } else {
                await api.post('/users', payload);
                showSuccess('Pengguna berhasil ditambahkan.');
            }
            setForm(KOSONG);
            setEditId(null);
            load(editId ? halaman : 1);
            loadRingkasan();
        } catch (err) {
            const pesan = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(', ')
                : 'Gagal menyimpan pengguna';
            setError(pesan);
            showError(pesan);
        }
    }

    function handleEdit(item) {
        setEditId(item.id_user);
        setForm({
            nama_lengkap: item.nama_lengkap,
            username: item.username,
            no_telp: item.no_telp ?? '',
            password: '',
            role: item.role,
            status_aktif: !!item.status_aktif,
        });
    }

    function mintaHapus(item) {
        setHapusId(item.id_user);
    }

    async function konfirmasiHapus() {
        if (!hapusId) return;
        setMenghapus(true);
        try {
            await api.delete(`/users/${hapusId}`);
            showSuccess('Pengguna berhasil dihapus.');
            load(halaman);
            loadRingkasan();
        } catch (err) {
            showError(err.response?.data?.message || 'Gagal menghapus pengguna.');
        } finally {
            setMenghapus(false);
            setHapusId(null);
        }
    }

    const dataTersaring = data.filter((item) => {
        const kata = cariKata.trim().toLowerCase();
        if (!kata) return true;
        return (
            item.nama_lengkap?.toLowerCase().includes(kata) ||
            item.username?.toLowerCase().includes(kata) ||
            item.no_telp?.toLowerCase().includes(kata) ||
            item.role?.toLowerCase().includes(kata)
        );
    });

    function inisial(nama) {
        if (!nama) return '?';
        const kata = nama.trim().split(/\s+/);
        const huruf = kata.length > 1 ? kata[0][0] + kata[1][0] : kata[0][0];
        return huruf.toUpperCase();
    }

    return (
        <div>
            <PageHeader
                eyebrow="DATA MASTER"
                title="Pengguna"
                description="Kelola akun admin, petugas, dan owner."
            />

            {/* Ringkasan jumlah user per role */}
            <div className="mb-6">
                {ringkasanLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
                        <Card className="p-5 animate-pulse h-20" />
                        <Card className="p-5 animate-pulse h-20" />
                        <Card className="p-5 animate-pulse h-20" />
                        <Card className="p-5 animate-pulse h-20" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
                        <StatCard label="TOTAL ADMIN" value={ringkasan.admin} accent="#F4B400" />
                        <StatCard label="TOTAL PETUGAS" value={ringkasan.petugas} accent="#35C48D" />
                        <StatCard label="TOTAL PELANGGAN" value={ringkasan.pelanggan} accent="#5B8DEF" />
                        <StatCard label="TOTAL SELURUH USER" value={ringkasan.total} accent="#EDEFF2" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="p-4 sm:p-5 md:col-span-1 h-fit">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-4">
                        {editId ? 'Edit Pengguna' : 'Tambah Pengguna'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">NAMA LENGKAP</label>
                            <Input value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">USERNAME</label>
                            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">NO. TELEPON</label>
                            <Input value={form.no_telp} onChange={(e) => setForm({ ...form, no_telp: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">
                                PASSWORD {editId && <span className="normal-case">(kosongkan jika tidak diubah)</span>}
                            </label>
                            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">ROLE</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full rounded-md bg-[#14181F] border border-white/10 px-3 py-2 text-sm text-[#EDEFF2] focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                            >
                                <option value="petugas">Petugas</option>
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-[#C3C9D3]">
                            <input
                                type="checkbox"
                                checked={form.status_aktif}
                                onChange={(e) => setForm({ ...form, status_aktif: e.target.checked })}
                            />
                            Akun aktif
                        </label>

                        {error && <p className="text-sm text-[#E5484D]">{error}</p>}

                        <div className="flex flex-wrap gap-2 pt-2">
                            <Button type="submit" className="flex-1 sm:flex-none">{editId ? 'Simpan' : 'Tambah'}</Button>
                            {editId && (
                                <Button type="button" variant="ghost" className="flex-1 sm:flex-none" onClick={() => { setEditId(null); setForm(KOSONG); }}>
                                    Batal
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                <div className="md:col-span-2 -mx-4 sm:mx-0 overflow-x-auto">
                    <div className="px-4 sm:px-0 mb-3 flex items-center gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Cari nama, username, no. telepon, atau role..."
                                value={cariKata}
                                onChange={(e) => setCariKata(e.target.value)}
                            />
                        </div>
                        <span className="text-xs font-mono text-[#8B94A3] whitespace-nowrap">
                            {loading
                                ? 'Memuat...'
                                : sedangMencari
                                ? `${dataTersaring.length} hasil di halaman ini`
                                : `${data.length} dari ${total} pengguna`}
                        </span>
                    </div>
                    <div className="min-w-[720px] sm:min-w-0 px-4 sm:px-0">
                        <Table columns={['Pengguna', 'Username', 'No. Telepon', 'Role', 'Status', 'Aksi']}>
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-[#8B94A3] text-sm">
                                        Memuat data pengguna...
                                    </td>
                                </tr>
                            )}
                            {!loading && dataTersaring.map((item) => {
                                return (
                                    <tr key={item.id_user}>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-8 h-8 rounded-full bg-[#F4B400]/10 text-[#F4B400] font-mono text-xs flex items-center justify-center shrink-0">
                                                    {inisial(item.nama_lengkap)}
                                                </span>
                                                <span>{item.nama_lengkap}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono whitespace-nowrap">{item.username}</td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono whitespace-nowrap">{item.no_telp || '—'}</td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                                            <Badge tone={ROLE_BADGE_TONE[item.role] ?? 'info'}>
                                                {ROLE_LABEL[item.role] ?? item.role}
                                            </Badge>
                                        </td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                                            {item.status_aktif ? <Badge tone="success">Aktif</Badge> : <Badge tone="danger">Nonaktif</Badge>}
                                        </td>
                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                                                <Button variant="ghost" onClick={() => handleEdit(item)}>Edit</Button>
                                                <Button variant="danger" onClick={() => mintaHapus(item)}>Hapus</Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && dataTersaring.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-[#8B94A3] text-sm">
                                        {cariKata ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna.'}
                                    </td>
                                </tr>
                            )}
                        </Table>
                    </div>

                    {!loading && !sedangMencari && halamanTerakhir > 1 && (
                        <div className="px-4 sm:px-0 mt-3 flex items-center justify-between text-xs font-mono text-[#8B94A3]">
                            <span>Total {total} pengguna</span>
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
                title="Hapus Pengguna"
                message="Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Hapus"
                loading={menghapus}
                onConfirm={konfirmasiHapus}
                onCancel={() => setHapusId(null)}
            />

            <footer className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[#8B94A3] text-center sm:text-left">
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