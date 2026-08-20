import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, StatCard, Card, Table, Button } from '../../components/ui';
import {
    PieChart, Pie, Cell, Legend, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell,
    TextRun, HeadingLevel, WidthType, AlignmentType,
} from 'docx';
import {
    Users, Ticket, MapPin, Car, PieChart as PieChartIcon,
    TrendingUp, FileText, FileDown, Printer, CalendarRange, Compass,
} from 'lucide-react';

// Warna tiap kategori disamakan dengan accent warna StatCard di atasnya,
// supaya pie chart dan kartu ringkasan terasa satu bahasa visual.
const RINGKASAN_COLORS = {
    Pengguna: '#F4B400',
    Tarif: '#35C48D',
    Area: '#5B8DEF',
    Kendaraan: '#E5484D',
};

function toDateInputValue(date) {
    return date.toISOString().slice(0, 10);
}

export default function DashboardAdmin() {
    const [stats, setStats] = useState({ users: '—', tarif: '—', area: '—', kendaraan: '—' });
    const [rekap, setRekap] = useState([]);
    const [loadingRekap, setLoadingRekap] = useState(true);
    const [rekapError, setRekapError] = useState(null);
    const [downloadingWord, setDownloadingWord] = useState(false);

    // Default: 7 hari terakhir
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const [dari, setDari] = useState(toDateInputValue(sevenDaysAgo));
    const [sampai, setSampai] = useState(toDateInputValue(today));

    useEffect(() => {
        async function load() {
            try {
                const [users, tarif, area, kendaraan] = await Promise.all([
                    api.get('/users?page=1'),
                    api.get('/tarif'),
                    api.get('/area-parkir'),
                    api.get('/kendaraan?page=1'),
                ]);
                setStats({
                    users: users.data.total ?? users.data.length,
                    tarif: tarif.data.length,
                    area: area.data.length,
                    kendaraan: kendaraan.data.total ?? kendaraan.data.length,
                });
            } catch (e) {
                // biarkan tampil '—' kalau gagal fetch
            }
        }
        load();
    }, []);

    async function loadRekap(dariParam = dari, sampaiParam = sampai) {
        setLoadingRekap(true);
        setRekapError(null);
        try {
            const res = await api.get('/transaksi/rekap-harian', {
                params: { dari: dariParam, sampai: sampaiParam },
            });
            const formatted = res.data.map((d) => ({
                ...d,
                label: new Date(d.tanggal).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                }),
            }));
            setRekap(formatted);
        } catch (e) {
            setRekap([]);
            if (e?.response?.status === 422) {
                setRekapError('Rentang tanggal tidak valid.');
            } else {
                setRekapError('Gagal memuat data laporan. Coba muat ulang.');
            }
        } finally {
            setLoadingRekap(false);
        }
    }

    useEffect(() => {
        loadRekap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleFilterSubmit(e) {
        e.preventDefault();
        if (new Date(dari) > new Date(sampai)) {
            alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
            return;
        }
        loadRekap(dari, sampai);
    }

    function handlePreset(days) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        const d = toDateInputValue(start);
        const s = toDateInputValue(end);
        setDari(d);
        setSampai(s);
        loadRekap(d, s);
    }

    const dataRingkasan = [
        { nama: 'Pengguna', jumlah: Number(stats.users) || 0 },
        { nama: 'Tarif', jumlah: Number(stats.tarif) || 0 },
        { nama: 'Area', jumlah: Number(stats.area) || 0 },
        { nama: 'Kendaraan', jumlah: Number(stats.kendaraan) || 0 },
    ];

    // Pie chart tidak enak menampilkan slice bernilai 0 (bikin label
    // menumpuk di titik yang sama), jadi disaring dulu di sini.
    const dataRingkasanPie = dataRingkasan.filter((d) => d.jumlah > 0);

    const { totalTransaksi, totalPendapatan } = useMemo(() => {
        return {
            totalTransaksi: rekap.reduce((sum, d) => sum + (d.jumlah_transaksi || 0), 0),
            totalPendapatan: rekap.reduce((sum, d) => sum + (d.pendapatan || 0), 0),
        };
    }, [rekap]);

    const periodeLabel = useMemo(() => {
        if (!dari || !sampai) return '';
        const fmt = (d) =>
            new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        return dari === sampai ? fmt(dari) : `${fmt(dari)} — ${fmt(sampai)}`;
    }, [dari, sampai]);

    function handleCetak() {
        window.print();
    }

    async function handleDownloadWord() {
        if (rekap.length === 0) {
            alert('Belum ada data transaksi untuk diunduh.');
            return;
        }

        setDownloadingWord(true);
        try {
            const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

            const headerCell = (text) =>
                new TableCell({
                    shading: { fill: '1F2530' },
                    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })],
                });

            const bodyCell = (text, alignment = AlignmentType.LEFT) =>
                new TableCell({ children: [new Paragraph({ text, alignment })] });

            const rows = [
                new TableRow({
                    children: [
                        headerCell('Hari'),
                        headerCell('Tanggal'),
                        headerCell('Jumlah Kendaraan'),
                        headerCell('Pendapatan'),
                    ],
                }),
                ...rekap.map((d) => {
                    const date = new Date(d.tanggal);
                    const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
                    const tanggal = date.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    });
                    return new TableRow({
                        children: [
                            bodyCell(hari),
                            bodyCell(tanggal),
                            bodyCell(String(d.jumlah_transaksi), AlignmentType.CENTER),
                            bodyCell(formatRupiah(d.pendapatan), AlignmentType.RIGHT),
                        ],
                    });
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            columnSpan: 2,
                            children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true })] })],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: String(totalTransaksi), bold: true })],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: formatRupiah(totalPendapatan), bold: true })],
                                    alignment: AlignmentType.RIGHT,
                                }),
                            ],
                        }),
                    ],
                }),
            ];

            const doc = new Document({
                sections: [
                    {
                        children: [
                            new Paragraph({ heading: HeadingLevel.HEADING_1, text: 'Laporan Transaksi Parkir' }),
                            new Paragraph({ text: `Periode: ${periodeLabel}`, spacing: { after: 200 } }),
                            new DocxTable({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
                            new Paragraph({ text: '', spacing: { before: 200 } }),
                            new Paragraph({ text: `Dicetak pada: ${new Date().toLocaleString('id-ID')}` }),
                        ],
                    },
                ],
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `laporan-transaksi-${dari}_${sampai}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Gagal membuat file Word. Silakan coba lagi.');
        } finally {
            setDownloadingWord(false);
        }
    }

    return (
        <div>
            <style>{`
                /* Menghilangkan kotak yang muncul saat pie chart disentuh/
                   diklik. Ada dua penyebab berbeda, jadi dua fix berbeda:
                   1) outline fokus bawaan browser saat elemen SVG (sector)
                      menerima focus setelah diklik/tap — dimatikan lewat
                      outline: none di semua elemen turunannya.
                   2) tap-highlight bawaan browser mobile (kotak abu-abu
                      transparan yang muncul sesaat saat disentuh di layar
                      sentuh) — dimatikan lewat -webkit-tap-highlight-color.
                   Diberi !important karena Recharts kadang menyisipkan
                   style inline pada elemen SVG-nya sendiri. */
                #perbandingan-data-master-chart,
                #perbandingan-data-master-chart * {
                    outline: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                #perbandingan-data-master-chart svg,
                #perbandingan-data-master-chart path,
                #perbandingan-data-master-chart g {
                    outline: none !important;
                }

                @media print {
                    @page {
                        margin: 12mm;
                    }
                    /* Cegah area cetak terpotong oleh container scroll/overflow
                       dari layout sidebar (mis. main content dengan h-screen +
                       overflow-y-auto). Tanpa ini, tabel bisa tampak kosong
                       saat dicetak walau datanya ada. */
                    * {
                        overflow: visible !important;
                        max-height: none !important;
                    }
                    html, body {
                        height: auto !important;
                        position: static !important;
                    }
                    body *, #laporan-print-area { visibility: hidden; }
                    #laporan-print-area, #laporan-print-area * { visibility: visible !important; }
                    #laporan-print-area {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>

            <PageHeader
                eyebrow="PANEL ADMIN"
                title="Ringkasan Sistem"
                description="Pantau data master aplikasi parkir dari sini."
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="TOTAL PENGGUNA" value={stats.users} icon={Users} />
                <StatCard label="JENIS TARIF" value={stats.tarif} accent="#35C48D" icon={Ticket} />
                <StatCard label="AREA PARKIR" value={stats.area} accent="#5B8DEF" icon={MapPin} />
                <StatCard label="KENDARAAN TERDAFTAR" value={stats.kendaraan} accent="#E5484D" icon={Car} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8 no-print">
                <Card className="p-6">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-4 flex items-center gap-2">
                        <PieChartIcon size={17} className="text-[#F4B400]" />
                        Perbandingan Data Master
                    </h2>
                    {dataRingkasanPie.length === 0 ? (
                        <p className="text-sm text-[#8B94A3]">Belum ada data untuk ditampilkan.</p>
                    ) : (
                        <div id="perbandingan-data-master-chart">
                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >
                            <PieChart margin={{ top: 24, right: 16, bottom: 8, left: 16 }}>
                                <Pie
                                    data={dataRingkasanPie}
                                    dataKey="jumlah"
                                    nameKey="nama"
                                    cx="50%"
                                    cy="48%"
                                    innerRadius={50}
                                    outerRadius={78}
                                    paddingAngle={2}
                                    label={({ nama, percent }) => `${nama} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {dataRingkasanPie.map((d) => (
                                        <Cell key={d.nama} fill={RINGKASAN_COLORS[d.nama] || '#8B94A3'} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1F2530', border: '1px solid #2A303C', borderRadius: 8 }}
                                    labelStyle={{ color: '#EDEFF2' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={32}
                                    formatter={(value) => (
                                        <span style={{ color: '#C3C9D3', fontSize: 12 }}>{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-4 flex items-center gap-2">
                        <TrendingUp size={17} className="text-[#5B8DEF]" />
                        Tren Transaksi ({periodeLabel})
                    </h2>
                    {loadingRekap ? (
                        <p className="text-sm text-[#8B94A3]">Memuat data...</p>
                    ) : rekap.length === 0 ? (
                        <p className="text-sm text-[#8B94A3]">Belum ada data transaksi.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={rekap}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A303C" />
                                <XAxis dataKey="label" stroke="#8B94A3" fontSize={11} />
                                <YAxis stroke="#8B94A3" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1F2530', border: '1px solid #2A303C', borderRadius: 8 }}
                                    labelStyle={{ color: '#EDEFF2' }}
                                    formatter={(value, name) =>
                                        name === 'pendapatan'
                                            ? [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']
                                            : [value, 'Jumlah Transaksi']
                                    }
                                />
                                <Line type="monotone" dataKey="jumlah_transaksi" stroke="#5B8DEF" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="pendapatan" stroke="#35C48D" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            <div id="laporan-print-area">
            <Card className="p-6 mb-8">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                    <div>
                        <h2 className="font-display text-lg text-[#EDEFF2] print:text-[#14181F] flex items-center gap-2">
                            <FileText size={18} className="text-[#F4B400] print:hidden" />
                            Tabel Laporan Transaksi
                        </h2>
                        <p className="text-xs text-[#8B94A3] print:text-[#6B7280] mt-1">
                            Periode: {periodeLabel}
                        </p>
                        <p className="hidden print:block text-xs text-[#6B7280] mt-1">
                            Dicetak pada {new Date().toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="flex gap-2 no-print">
                        <Button variant="ghost" onClick={handleDownloadWord} disabled={downloadingWord || rekap.length === 0}>
                            <span className="flex items-center gap-1.5">
                                <FileDown size={15} />
                                {downloadingWord ? 'Membuat file...' : 'Download Word'}
                            </span>
                        </Button>
                        <Button variant="ghost" onClick={handleCetak} disabled={rekap.length === 0}>
                            <span className="flex items-center gap-1.5">
                                <Printer size={15} />
                                Cetak
                            </span>
                        </Button>
                    </div>
                </div>

                <form
                    onSubmit={handleFilterSubmit}
                    className="no-print flex flex-wrap items-end gap-3 mb-5 pb-5 border-b border-white/5"
                >
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#8B94A3]" htmlFor="dari-date">Dari tanggal</label>
                        <input
                            id="dari-date"
                            type="date"
                            value={dari}
                            max={sampai}
                            onChange={(e) => setDari(e.target.value)}
                            className="bg-[#1F2530] border border-[#2A303C] rounded px-3 py-2 text-sm text-[#EDEFF2]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#8B94A3]" htmlFor="sampai-date">Sampai tanggal</label>
                        <input
                            id="sampai-date"
                            type="date"
                            value={sampai}
                            min={dari}
                            max={toDateInputValue(new Date())}
                            onChange={(e) => setSampai(e.target.value)}
                            className="bg-[#1F2530] border border-[#2A303C] rounded px-3 py-2 text-sm text-[#EDEFF2]"
                        />
                    </div>
                    <Button type="submit" disabled={loadingRekap}>
                        <span className="flex items-center gap-1.5">
                            <CalendarRange size={15} />
                            {loadingRekap ? 'Memuat...' : 'Terapkan'}
                        </span>
                    </Button>
                    <div className="flex gap-2 ml-auto">
                        <Button type="button" variant="ghost" onClick={() => handlePreset(7)}>7 Hari</Button>
                        <Button type="button" variant="ghost" onClick={() => handlePreset(30)}>30 Hari</Button>
                    </div>
                </form>

                {loadingRekap ? (
                    <p className="text-sm text-[#8B94A3]">Memuat data...</p>
                ) : rekapError ? (
                    <div className="text-sm text-[#E5484D] flex items-center gap-3">
                        <span>{rekapError}</span>
                        <Button variant="ghost" onClick={() => loadRekap()}>Coba Lagi</Button>
                    </div>
                ) : (
                    <Table columns={['Tanggal', 'Jumlah Transaksi', 'Pendapatan']}>
                        {rekap.map((d) => (
                            <tr key={d.tanggal}>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {new Date(d.tanggal).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </td>
                                <td className="px-4 py-3 font-mono">{d.jumlah_transaksi}</td>
                                <td className="px-4 py-3 font-mono">
                                    Rp {Number(d.pendapatan).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                        {rekap.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-[#8B94A3] text-sm">
                                    Belum ada data transaksi pada periode ini.
                                </td>
                            </tr>
                        )}
                        {rekap.length > 0 && (
                            <tr className="bg-[#1F2530] font-semibold">
                                <td className="px-4 py-3 font-mono text-xs">TOTAL</td>
                                <td className="px-4 py-3 font-mono">{totalTransaksi}</td>
                                <td className="px-4 py-3 font-mono">
                                    Rp {Number(totalPendapatan).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        )}
                    </Table>
                )}
            </Card>
            </div>

            <Card className="p-6 no-print">
                <h2 className="font-display text-lg text-[#EDEFF2] mb-2 flex items-center gap-2">
                    <Compass size={18} className="text-[#F4B400]" />
                    Akses cepat
                </h2>
                <p className="text-sm text-[#8B94A3]">
                    Gunakan menu di sidebar untuk mengelola pengguna, tarif,
                    area parkir, data kendaraan, dan melihat log aktivitas
                    seluruh pengguna sistem.
                </p>
            </Card>
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