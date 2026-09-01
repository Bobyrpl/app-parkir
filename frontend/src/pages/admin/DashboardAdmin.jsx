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
                    shading: { fill: '1F1F1F' },
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
                eyebrow="Panel administrator"
                title="Ringkasan Sistem"
                description="Pantau statistik master data, transaksi realtime, dan unduh laporan berkala."
            />

            {/* Baris kartu ringkasan */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Pengguna" value={stats.users} icon={Users} />
                <StatCard label="Jenis Tarif" value={stats.tarif} icon={Ticket} />
                <StatCard label="Area Parkir" value={stats.area} icon={MapPin} />
                <StatCard label="Kendaraan Terdaftar" value={stats.kendaraan} icon={Car} />
            </div>

            {/* Highlight bar periode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 no-print">
                <Card className="p-5 flex items-center gap-4 border border-[var(--color-border)] bg-[var(--color-card)]/80">
                    <span className="w-12 h-12 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0 shadow-inner">
                        <Receipt size={22} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs text-[var(--color-text-secondary)] font-medium">Transaksi periode ini</p>
                        <p className="font-semibold text-2xl sm:text-3xl text-[var(--color-text)] leading-tight truncate">
                            {loadingRekap ? '—' : totalTransaksi.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{periodeLabel}</p>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 border border-[var(--color-border)] bg-[var(--color-card)]/80">
                    <span className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                        <Wallet size={22} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs text-emerald-600 font-medium">Pendapatan periode ini</p>
                        <p className="font-semibold text-2xl sm:text-3xl text-[var(--color-text)] leading-tight truncate">
                            {loadingRekap ? '—' : `Rp ${totalPendapatan.toLocaleString('id-ID')}`}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{periodeLabel}</p>
                    </div>
                </Card>
            </div>

            {/* Grafik Trend */}
            <div className="mb-8 no-print">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--color-border)]">
                        <span className="w-9 h-9 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0">
                            <TrendingUp size={18} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-base text-[var(--color-text)] truncate">
                                Tren Transaksi &amp; Pelanggan Baru
                            </h2>
                            <p className="text-xs text-[var(--color-text-secondary)] truncate">{periodeLabel}</p>
                        </div>
                    </div>
                    {loadingRekap ? (
                        <div className="h-72 flex items-center justify-center text-sm text-[var(--color-text-muted)]">Memuat grafik...</div>
                    ) : rekap.length === 0 ? (
                        <div className="h-72 flex items-center justify-center text-sm text-[var(--color-text-muted)]">Belum ada data transaksi pada rentang ini.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={340}>
                            <LineChart data={rekap}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} />
                                <YAxis
                                    yAxisId="jumlah"
                                    stroke="var(--color-text-muted)"
                                    fontSize={11}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    yAxisId="rupiah"
                                    orientation="right"
                                    stroke="var(--color-text-muted)"
                                    fontSize={11}
                                    tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}rb`}
                                />
                                <Tooltip
                                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}
                                    labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
                                    formatter={(value, name) => {
                                        if (name === 'pendapatan') {
                                            return [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan'];
                                        }
                                        if (name === 'jumlah_user') {
                                            return [value, 'Pelanggan Baru'];
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
                                                ? 'Pelanggan Baru'
                                                : 'Jumlah Transaksi';
                                        return <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginRight: 14 }}>{label}</span>;
                                    }}
                                />
                                <Line yAxisId="jumlah" type="monotone" dataKey="jumlah_transaksi" stroke="#171717" strokeWidth={2.5} dot={{ r: 3.5, fill: '#171717' }} activeDot={{ r: 6 }} />
                                <Line yAxisId="jumlah" type="monotone" dataKey="jumlah_user" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: '#38bdf8' }} />
                                <Line yAxisId="rupiah" type="monotone" dataKey="pendapatan" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3.5, fill: '#10b981' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            {/* Tabel Laporan */}
            <div id="laporan-print-area">
            <Card className="p-6 mb-8">
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0 print:hidden">
                            <FileText size={18} />
                        </span>
                        <div>
                            <h2 className="font-semibold text-lg text-[var(--color-text)] print:text-[var(--color-text)]">
                                Tabel Laporan Harian
                            </h2>
                            <p className="text-xs text-[var(--color-text-secondary)] print:text-[var(--color-text-muted)] mt-0.5">
                                Periode: {periodeLabel}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 no-print">
                        <Button variant="secondary" size="sm" onClick={handleDownloadWord} disabled={downloadingWord || rekap.length === 0} icon={FileDown}>
                            {downloadingWord ? 'Membuat file...' : 'Export Word'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleCetak} disabled={rekap.length === 0} icon={Printer}>
                            Cetak Laporan
                        </Button>
                    </div>
                </div>

                <form
                    onSubmit={handleFilterSubmit}
                    className="no-print flex flex-wrap items-end gap-3 mb-6 pb-6 border-b border-[var(--color-border)]"
                >
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]" htmlFor="dari-date">Dari tanggal</label>
                        <input
                            id="dari-date"
                            type="date"
                            value={dari}
                            max={sampai}
                            onChange={(e) => setDari(e.target.value)}
                            className="bg-[var(--color-section)]/70 border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]" htmlFor="sampai-date">Sampai tanggal</label>
                        <input
                            id="sampai-date"
                            type="date"
                            value={sampai}
                            min={dari}
                            max={toDateInputValue(new Date())}
                            onChange={(e) => setSampai(e.target.value)}
                            className="bg-[var(--color-section)]/70 border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] transition-all"
                        />
                    </div>
                    <Button type="submit" size="md" disabled={loadingRekap} icon={CalendarRange}>
                        {loadingRekap ? 'Memuat...' : 'Terapkan Filter'}
                    </Button>
                    <div className="flex gap-1 sm:ml-auto bg-[var(--color-section)]/80 border border-[var(--color-border)] rounded-full p-1">
                        <button
                            type="button"
                            onClick={() => handlePreset(7)}
                            className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all ${
                                activePreset === 7
                                    ? 'bg-[var(--color-button-bg)] text-[var(--color-button-text)] font-bold shadow'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                            }`}
                        >
                            7 Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePreset(30)}
                            className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all ${
                                activePreset === 30
                                    ? 'bg-[var(--color-button-bg)] text-[var(--color-button-text)] font-bold shadow'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                            }`}
                        >
                            30 Hari
                        </button>
                    </div>
                </form>

                {loadingRekap ? (
                    <div className="py-10 text-center text-sm text-[var(--color-text-muted)] font-mono">Memuat data laporan...</div>
                ) : rekapError ? (
                    <div className="text-sm text-rose-400 flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <span>{rekapError}</span>
                        <Button variant="secondary" size="sm" onClick={() => loadRekap()}>Coba Lagi</Button>
                    </div>
                ) : (
                    <Table columns={['Tanggal', 'Jumlah Transaksi', 'Pendapatan']}>
                        {rekap.map((d) => (
                            <tr
                                key={d.tanggal}
                                className="hover:bg-[var(--color-card)]/60 transition-colors"
                            >
                                <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-text-secondary)]">
                                    {new Date(d.tanggal).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs font-medium text-[var(--color-text)]">{d.jumlah_transaksi}</td>
                                <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-text)]">
                                    <div className="flex items-center gap-3">
                                        <span className="whitespace-nowrap font-medium text-emerald-400">
                                            Rp {Number(d.pendapatan).toLocaleString('id-ID')}
                                        </span>
                                        <span className="hidden sm:block flex-1 h-1.5 rounded-full bg-[var(--color-card)] overflow-hidden min-w-[60px] max-w-[120px] print:hidden">
                                            <span
                                                className="block h-full rounded-full bg-emerald-400"
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
                                <td colSpan={3} className="px-5 py-10 text-center text-[var(--color-text-muted)] text-xs font-mono">
                                    Belum ada data transaksi pada periode ini.
                                </td>
                            </tr>
                        )}
                        {rekap.length > 0 && (
                            <tr className="bg-[var(--color-section)]/80 font-bold border-t border-[var(--color-border)]">
                                <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-text)]">Total</td>
                                <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-text)]">{totalTransaksi}</td>
                                <td className="px-5 py-3.5 font-mono text-xs text-emerald-400">
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
                    <span className="w-8 h-8 rounded-lg bg-[#171717]/10 text-[#171717] flex items-center justify-center shrink-0">
                        <Compass size={16} />
                    </span>
                    <h2 className="font-display text-lg text-[var(--color-text)]">
                        Akses cepat
                    </h2>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Gunakan menu di sidebar untuk mengelola data master dan
                    melihat log aktivitas seluruh pengguna sistem.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Pengguna', icon: Users, accent: '#171717' },
                        { label: 'Tarif', icon: Ticket, accent: '#35C48D' },
                        { label: 'Area Parkir', icon: MapPin, accent: '#171717' },
                        { label: 'Kendaraan', icon: Car, accent: '#171717' },
                    ].map(({ label, icon: Icon, accent }) => (
                        <div
                            key={label}
                            className="flex flex-col items-center text-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-section)] px-3 py-4"
                        >
                            <span
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${accent}1A`, color: accent }}
                            >
                                <Icon size={17} />
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
                        </div>
                    ))}
                </div>
            </Card>
            <footer className="border-t border-[var(--color-border)]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[var(--color-text-secondary)] text-center sm:text-left">
                    <span>
                        © {new Date().getFullYear()} Parkir Pelabuhan Tanjung
                        Perak
                    </span>
                    <span>Sistem manajemen parkir</span>
                </div>
            </footer>
        </div>
    );
}