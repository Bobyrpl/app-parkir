import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Table, Button, Input } from '../../components/ui';

const KOSONG = { plat_nomor: '', jenis_kendaraan: 'motor', warna: '', pemilik: '' };

export default function TambahKendaraan() {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(KOSONG);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showSuccess, showError } = useToast();

    async function load() {
        try {
            const res = await api.get('/kendaraan', { params: { page: 1 } });
            const payload = res.data;
            setData(payload.data ?? payload);
        } catch (err) {
            showError('Gagal memuat data kendaraan.');
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await api.post('/kendaraan', form);
            showSuccess('Kendaraan berhasil ditambahkan.');
            setForm(KOSONG);
            load();
        } catch (err) {
            const pesan = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(', ')
                : 'Gagal menyimpan kendaraan';
            setError(pesan);
            showError(pesan);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="DATA KENDARAAN"
                title="Tambah Kendaraan"
                description="Daftarkan kendaraan baru ke sistem."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="p-4 sm:p-5 md:col-span-1 h-fit">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-4">Tambah Kendaraan</h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">PLAT NOMOR</label>
                            <Input
                                value={form.plat_nomor}
                                onChange={(e) => setForm({ ...form, plat_nomor: e.target.value.toUpperCase() })}
                                required
                                maxLength={15}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">JENIS KENDARAAN</label>
                            <select
                                value={form.jenis_kendaraan}
                                onChange={(e) => setForm({ ...form, jenis_kendaraan: e.target.value })}
                                className="w-full rounded-md bg-[#14181F] border border-white/10 px-3 py-2 text-sm text-[#EDEFF2] focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                            >
                                <option value="motor">Motor</option>
                                <option value="mobil">Mobil</option>
                                <option value="truk">Truk</option>
                                <option value="bus">Bus</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">WARNA</label>
                            <Input value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })} maxLength={20} />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">PEMILIK</label>
                            <Input value={form.pemilik} onChange={(e) => setForm({ ...form, pemilik: e.target.value })} maxLength={100} />
                        </div>

                        {error && <p className="text-sm text-[#E5484D]">{error}</p>}

                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? 'Menyimpan...' : 'Tambah Kendaraan'}
                        </Button>
                    </form>
                </Card>

                <div className="md:col-span-2 -mx-4 sm:mx-0 overflow-x-auto">
                    <div className="min-w-[640px] sm:min-w-0 px-4 sm:px-0">
                        <Table columns={['Plat Nomor', 'Jenis', 'Warna', 'Pemilik']}>
                            {data.map((item) => (
                                <tr key={item.id_kendaraan}>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono whitespace-nowrap">{item.plat_nomor}</td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 capitalize whitespace-nowrap">{item.jenis_kendaraan}</td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">{item.warna || '—'}</td>
                                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">{item.pemilik || '—'}</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-[#8B94A3] text-sm">
                                        Belum ada kendaraan.
                                    </td>
                                </tr>
                            )}
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}