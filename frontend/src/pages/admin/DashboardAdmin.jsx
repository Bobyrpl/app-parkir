import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, StatCard, Card, Table, Button } from '../../components/ui';
import {
    Legend, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell,
    TextRun, HeadingLevel, WidthType, AlignmentType,
} from 'docx';
import {
    Users, Ticket, MapPin, Car,
    TrendingUp, FileText, FileDown, Printer, CalendarRange, Compass,
    Wallet, Receipt,
} from 'lucide-react';

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

    const { totalTransaksi, totalPendapatan } = useMemo(() => {
        return {
            totalTransaksi: rekap.reduce((sum, d) => sum + (d.jumlah_transaksi || 0), 0),
            totalPendapatan: rekap.reduce((sum, d) => sum + (d.pendapatan || 0), 0),
        };
    }, [rekap]);

    // Nilai pendapatan tertinggi dalam rentang yang sedang ditampilkan,
    // dipakai murni untuk menskalakan bar indikator di tabel (tampilan saja,
    // tidak memengaruhi data/logika apa pun).
    const maxPendapatanHarian = useMemo(() => {
        return rekap.reduce((max, d) => Math.max(max, d.pendapatan || 0), 0) || 1;
    }, [rekap]);

    // Menandai preset 7/30 hari mana yang sedang aktif, murni untuk
    // memberi highlight visual pada tombol preset yang sesuai.
    const activePreset = useMemo(() => {
        const end = toDateInputValue(new Date());
        const start7 = toDateInputValue(new Date(new Date().setDate(new Date().getDate() - 6)));
        const start30 = toDateInputValue(new Date(new Date().setDate(new Date().getDate() - 29)));
        if (dari === start7 && sampai === end) return 7;
        if (dari === start30 && sampai === end) return 30;
        return null;
    }, [dari, sampai]);

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

            {/* Baris kartu ringkasan gaya CoreUI: badge ikon berwarna,
                angka besar di atas, label kecil huruf kapital di bawah. */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="TOTAL PENGGUNA" value={stats.users} icon={Users} />
                <StatCard label="JENIS TARIF" value={stats.tarif} accent="#35C48D" icon={Ticket} />
                <StatCard label="AREA PARKIR" value={stats.area} accent="#5B8DEF" icon={MapPin} />
                <StatCard label="KENDARAAN TERDAFTAR" value={stats.kendaraan} accent="#E5484D" icon={Car} />
            </div>

            {/* Strip ringkasan periode berjalan — angka yang sama dengan
                totalTransaksi/totalPendapatan yang sudah dihitung di atas,
                cuma ditonjolkan di sini seperti "highlight bar" ala CoreUI. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 no-print">
                <Card className="p-5 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#5B8DEF' }}>
                    <span className="w-11 h-11 rounded-xl bg-[#5B8DEF]/10 text-[#5B8DEF] flex items-center justify-center shrink-0">
                        <Receipt size={20} />
                    </span>
                    <div className="min-w-0">
                        <p className="font-mono text-[11px] tracking-widest text-[#8B94A3]">TRANSAKSI PERIODE INI</p>
                        <p className="font-display text-2xl text-[#EDEFF2] leading-tight truncate">
                            {loadingRekap ? '—' : totalTransaksi.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-[#8B94A3] mt-0.5 truncate">{periodeLabel}</p>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 border-l-4" style={{ borderLeftColor: '#35C48D' }}>
                    <span className="w-11 h-11 rounded-xl bg-[#35C48D]/10 text-[#35C48D] flex items-center justify-center shrink-0">
                        <Wallet size={20} />
                    </span>
                    <div className="min-w-0">
                        <p className="font-mono text-[11px] tracking-widest text-[#8B94A3]">PENDAPATAN PERIODE INI</p>
                        <p className="font-display text-2xl text-[#EDEFF2] leading-tight truncate">
                            {loadingRekap ? '—' : `Rp ${totalPendapatan.toLocaleString('id-ID')}`}
                        </p>
                        <p className="text-xs text-[#8B94A3] mt-0.5 truncate">{periodeLabel}</p>
                    </div>
                </Card>
            </div>

            <div className="mb-8 no-print">
                <Card className="p-6">
                    <div className="flex items-center gap-2.5 mb-4">
                        <span className="w-8 h-8 rounded-lg bg-[#5B8DEF]/10 text-[#5B8DEF] flex items-center justify-center shrink-0">
                            <TrendingUp size={16} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="font-display text-base text-[#EDEFF2] truncate">
                                Tren Transaksi &amp; Registrasi
                            </h2>
                            <p className="text-xs text-[#8B94A3] truncate">{periodeLabel}</p>
                        </div>
                    </div>
                    {loadingRekap ? (
                        <p className="text-sm text-[#8B94A3]">Memuat data...</p>
                    ) : rekap.length === 0 ? (
                        <p className="text-sm text-[#8B94A3]">Belum ada data transaksi.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={340}>
                            <LineChart data={rekap}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A303C" />
                                <XAxis dataKey="label" stroke="#8B94A3" fontSize={11} />
                                {/* Sumbu kiri: jumlah transaksi & registrasi pelanggan (skala kecil, satuan orang/transaksi) */}
                                <YAxis
                                    yAxisId="jumlah"
                                    stroke="#8B94A3"
                                    fontSize={12}
                                    allowDecimals={false}
                                />
                                {/* Sumbu kanan: pendapatan (skala rupiah, jauh lebih besar) -
                                    dipisah supaya garis jumlah transaksi/registrasi tidak
                                    kelihatan datar/gepeng tertindih skala rupiah. */}
                                <YAxis
                                    yAxisId="rupiah"
                                    orientation="right"
                                    stroke="#8B94A3"
                                    fontSize={12}
                                    tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}rb`}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#1F2530', border: '1px solid #2A303C', borderRadius: 8 }}
                                    labelStyle={{ color: '#EDEFF2' }}
                                    formatter={(value, name) => {
                                        if (name === 'pendapatan') {
                                            return [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan'];
                                        }
                                        if (name === 'jumlah_user') {
                                            return [value, 'Registrasi Pelanggan'];
                                        }
                                        return [value, 'Jumlah Transaksi'];
                                    }}
                                />
                                <Legend
                                    formatter={(value) => {
                                        const label =
                                            value === 'pendapatan'
                                                ? 'Pendapatan'
                                                : value === 'jumlah_user'
                                                ? 'Registrasi Pelanggan'
                                                : 'Jumlah Transaksi';
                                        return <span style={{ color: '#C3C9D3', fontSize: 12 }}>{label}</span>;
                                    }}
                                />
                                <Line yAxisId="jumlah" type="monotone" dataKey="jumlah_transaksi" stroke="#5B8DEF" strokeWidth={2} dot={{ r: 3 }} />
                                <Line yAxisId="jumlah" type="monotone" dataKey="jumlah_user" stroke="#F4B400" strokeWidth={2} dot={{ r: 3 }} />
                                <Line yAxisId="rupiah" type="monotone" dataKey="pendapatan" stroke="#35C48D" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            <div id="laporan-print-area">
            <Card className="p-6 mb-8">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-start gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-[#F4B400]/10 text-[#F4B400] flex items-center justify-center shrink-0 print:hidden">
                            <FileText size={16} />
                        </span>
                        <div>
                            <h2 className="font-display text-lg text-[#EDEFF2] print:text-[#14181F]">
                                Tabel Laporan Transaksi
                            </h2>
                            <p className="text-xs text-[#8B94A3] print:text-[#6B7280] mt-1">
                                Periode: {periodeLabel}
                            </p>
                            <p className="hidden print:block text-xs text-[#6B7280] mt-1">
                                Dicetak pada {new Date().toLocaleString('id-ID')}
                            </p>
                        </div>
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
                            className="bg-[#1F2530] border border-[#2A303C] rounded-md px-3 py-2 text-sm text-[#EDEFF2] focus:outline-none focus:ring-2 focus:ring-[#F4B400] transition-shadow"
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
                            className="bg-[#1F2530] border border-[#2A303C] rounded-md px-3 py-2 text-sm text-[#EDEFF2] focus:outline-none focus:ring-2 focus:ring-[#F4B400] transition-shadow"
                        />
                    </div>
                    <Button type="submit" disabled={loadingRekap}>
                        <span className="flex items-center gap-1.5">
                            <CalendarRange size={15} />
                            {loadingRekap ? 'Memuat...' : 'Terapkan'}
                        </span>
                    </Button>
                    <div className="flex gap-1 ml-auto bg-[#14181F] border border-white/10 rounded-full p-1">
                        <button
                            type="button"
                            onClick={() => handlePreset(7)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                activePreset === 7
                                    ? 'bg-[#F4B400] text-[#14181F]'
                                    : 'text-[#8B94A3] hover:text-[#EDEFF2]'
                            }`}
                        >
                            7 Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePreset(30)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                activePreset === 30
                                    ? 'bg-[#F4B400] text-[#14181F]'
                                    : 'text-[#8B94A3] hover:text-[#EDEFF2]'
                            }`}
                        >
                            30 Hari
                        </button>
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
                        {rekap.map((d, idx) => (
                            <tr
                                key={d.tanggal}
                                className={idx % 2 === 1 ? 'bg-white/[0.015]' : undefined}
                            >
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
                                    <div className="flex items-center gap-2.5">
                                        <span className="whitespace-nowrap">
                                            Rp {Number(d.pendapatan).toLocaleString('id-ID')}
                                        </span>
                                        {/* Bar visual proporsional terhadap pendapatan tertinggi
                                            pada rentang yang sama — murni dekoratif, dihitung dari
                                            data yang sudah ada, tidak mengubah data itu sendiri. */}
                                        <span className="hidden sm:block flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden min-w-[60px] max-w-[120px] print:hidden">
                                            <span
                                                className="block h-full rounded-full bg-[#35C48D]"
                                                style={{
                                                    width: `${Math.max(6, Math.round((d.pendapatan / maxPendapatanHarian) * 100))}%`,
                                                }}
                                            />
                                        </span>
                                    </div>
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
                <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-[#F4B400]/10 text-[#F4B400] flex items-center justify-center shrink-0">
                        <Compass size={16} />
                    </span>
                    <h2 className="font-display text-lg text-[#EDEFF2]">
                        Akses cepat
                    </h2>
                </div>
                <p className="text-sm text-[#8B94A3] mb-4">
                    Gunakan menu di sidebar untuk mengelola data master dan
                    melihat log aktivitas seluruh pengguna sistem.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Pengguna', icon: Users, accent: '#F4B400' },
                        { label: 'Tarif', icon: Ticket, accent: '#35C48D' },
                        { label: 'Area Parkir', icon: MapPin, accent: '#5B8DEF' },
                        { label: 'Kendaraan', icon: Car, accent: '#E5484D' },
                    ].map(({ label, icon: Icon, accent }) => (
                        <div
                            key={label}
                            className="flex flex-col items-center text-center gap-2 rounded-xl border border-white/5 bg-[#14181F] px-3 py-4"
                        >
                            <span
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${accent}1A`, color: accent }}
                            >
                                <Icon size={17} />
                            </span>
                            <span className="text-xs text-[#C3C9D3]">{label}</span>
                        </div>
                    ))}
                </div>
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