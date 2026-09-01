import { useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Card, Table, Button, Input, StatCard } from '../../components/ui';

export default function Rekap() {
    const today = new Date().toISOString().slice(0, 10);
    const [dari, setDari] = useState(today);
    const [sampai, setSampai] = useState(today);
    const [hasil, setHasil] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.get('/rekap-transaksi', { params: { dari, sampai } });
            setHasil(res.data);
        } catch (err) {
            setError('Gagal mengambil rekap transaksi');
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        setDari(today);
        setSampai(today);
        setHasil(null);
        setError('');
    }

    function escapeCsv(value) {
        const str = String(value ?? '');
        // Bungkus dengan tanda kutip kalau ada koma, kutip, atau baris baru
        if (/[",\n]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    function handleExportCsv() {
        if (!hasil) return;

        const header = ['Plat Nomor', 'Area', 'Waktu Masuk', 'Waktu Keluar', 'Durasi (jam)', 'Biaya (Rp)'];
        const rows = hasil.data.map((item) => [
            item.kendaraan?.plat_nomor ?? '',
            item.area?.nama_area ?? '',
            new Date(item.waktu_masuk).toLocaleString('id-ID'),
            item.waktu_keluar ? new Date(item.waktu_keluar).toLocaleString('id-ID') : '',
            item.durasi_jam ?? 0,
            item.biaya_total ?? 0,
        ]);

        const summaryRows = [
            [],
            ['Periode', hasil.periode],
            ['Total Transaksi', hasil.total_transaksi],
            ['Total Pendapatan (Rp)', hasil.total_pendapatan],
        ];

        const csvLines = [header, ...rows, ...summaryRows]
            .map((row) => row.map(escapeCsv).join(','))
            .join('\r\n');

        // Tambahkan BOM biar Excel baca karakter UTF-8 (mis. simbol Rp) dengan benar
        const blob = new Blob(['\ufeff' + csvLines], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `rekap-transaksi_${dari}_sd_${sampai}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function handleCetak() {
        window.print();
    }

    const rataRataBiaya =
        hasil && hasil.total_transaksi > 0
            ? Math.round(Number(hasil.total_pendapatan) / Number(hasil.total_transaksi))
            : 0;

    const waktuCetak = new Date().toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
    });

    return (
        <div>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #rekap-print-area, #rekap-print-area * { visibility: visible; }
                    #rekap-print-area {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                    .no-print { display: none !important; }
                    @page { margin: 16mm; }
                }
            `}</style>

            <PageHeader
                eyebrow="Laporan"
                title="Rekap Transaksi"
                description="Lihat total transaksi & pendapatan pada rentang waktu tertentu."
            />

            <Card className="p-5 mb-6 max-w-2xl no-print">
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">DARI TANGGAL</label>
                        <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">SAMPAI TANGGAL</label>
                        <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Memuat...' : 'Tampilkan'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleReset} disabled={loading}>
                        Reset
                    </Button>
                </form>
                {error && <p className="text-sm text-[#171717] mt-3">{error}</p>}
            </Card>

            {hasil && (
                <div id="rekap-print-area">
                    {/* Kop laporan, hanya tampil saat dicetak */}
                    <div className="hidden print:block mb-6 pb-4 border-b-2 border-[#080A0D]">
                        <p className="font-display text-xl text-[#080A0D]">Parkir Pelabuhan Tanjung Perak</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Laporan Rekap Transaksi Parkir</p>
                        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] font-mono mt-2">
                            <span>Periode: {hasil.periode}</span>
                            <span>Dicetak: {waktuCetak}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <p className="hidden print:block font-display text-lg text-[#080A0D]">
                            Rekap Transaksi — {hasil.periode}
                        </p>
                        <div className="flex gap-2 no-print ml-auto">
                            <Button variant="ghost" onClick={handleExportCsv}>
                                Export CSV
                            </Button>
                            <Button variant="ghost" onClick={handleCetak}>
                                Cetak
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6 max-w-2xl print:grid-cols-3">
                        <StatCard label="Total Transaksi" value={hasil.total_transaksi} />
                        <StatCard
                            label="Total Pendapatan"
                            value={`Rp ${Number(hasil.total_pendapatan).toLocaleString('id-ID')}`}
                            accent="#35C48D"
                        />
                        <StatCard
                            label="RATA-RATA / TRANSAKSI"
                            value={`Rp ${rataRataBiaya.toLocaleString('id-ID')}`}
                        />
                    </div>

                    <Table columns={['No', 'Plat Nomor', 'Area', 'Masuk', 'Keluar', 'Durasi', 'Biaya']}>
                        {hasil.data.map((item, idx) => (
                            <tr key={item.id_parkir}>
                                <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">{idx + 1}</td>
                                <td className="px-4 py-3 font-mono uppercase">{item.kendaraan?.plat_nomor}</td>
                                <td className="px-4 py-3">{item.area?.nama_area}</td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {new Date(item.waktu_masuk).toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {item.waktu_keluar ? new Date(item.waktu_keluar).toLocaleString('id-ID') : '-'}
                                </td>
                                <td className="px-4 py-3 font-mono">{item.durasi_jam} jam</td>
                                <td className="px-4 py-3 font-mono">
                                    Rp {Number(item.biaya_total).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                        {hasil.data.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-text-secondary)] text-sm">
                                    Tidak ada transaksi pada periode ini.
                                </td>
                            </tr>
                        )}
                    </Table>

                    {/* Tanda tangan, hanya saat cetak */}
                    <div className="hidden print:flex justify-end mt-10 pr-8">
                        <div className="text-center text-sm">
                            <p>Surabaya, {waktuCetak.split(' pukul')[0]}</p>
                            <p className="mt-1">Mengetahui,</p>
                            <div className="h-16" />
                            <p className="border-t border-[#080A0D] pt-1 px-6">Petugas Parkir</p>
                        </div>
                    </div>
                </div>
            )}
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