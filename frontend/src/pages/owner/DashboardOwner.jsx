import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Button, StatCard } from '../../components/ui';
import GrafikRingkasan from './GrafikRingkasan';
import {
    Receipt, Wallet, TrendingUp, TrendingDown, Minus,
    Activity, LayoutGrid, ArrowRight, RefreshCw, FileBarChart,
    LineChart,
} from 'lucide-react';

function toDateInputValue(date) {
    return date.toISOString().slice(0, 10);
}

function sapaanWaktu() {
    const jam = new Date().getHours();
    if (jam < 10) return 'Selamat pagi';
    if (jam < 15) return 'Selamat siang';
    if (jam < 18) return 'Selamat sore';
    return 'Selamat malam';
}

// Bandingkan angka hari ini vs kemarin, hasilkan badge tren kecil
// (naik/turun/sama) buat ditempel di StatCard.
function buatTrend(sekarang, sebelumnya) {
    if (sebelumnya == null || sekarang == null) return null;

    if (sebelumnya === 0) {
        if (sekarang === 0) return { tone: 'neutral', icon: Minus, label: 'Sama seperti kemarin' };
        return { tone: 'up', icon: TrendingUp, label: 'Naik dari kemarin' };
    }

    const persen = ((sekarang - sebelumnya) / sebelumnya) * 100;
    if (Math.abs(persen) < 1) return { tone: 'neutral', icon: Minus, label: 'Sama seperti kemarin' };
    if (persen > 0) return { tone: 'up', icon: TrendingUp, label: `${persen.toFixed(0)}% dari kemarin` };
    return { tone: 'down', icon: TrendingDown, label: `${Math.abs(persen).toFixed(0)}% dari kemarin` };
}

export default function DashboardOwner() {
    const { user } = useAuth();
    const today = useMemo(() => toDateInputValue(new Date()), []);
    const kemarin = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return toDateInputValue(d);
    }, []);

    const [ringkasan, setRingkasan] = useState(null);
    const [ringkasanKemarin, setRingkasanKemarin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dataGrafik, setDataGrafik] = useState([]);
    const [loadingGrafik, setLoadingGrafik] = useState(true);
    const [errorGrafik, setErrorGrafik] = useState('');

    // Endpoint ini tanpa parameter dari/sampai defaultnya sudah 7 hari
    // terakhir (lihat TransaksiController::rekapHarian di backend).
    async function ambilDataGrafik() {
        setLoadingGrafik(true);
        setErrorGrafik('');
        try {
            const res = await api.get('/transaksi/rekap-harian');
            setDataGrafik(res.data);
        } catch (err) {
            setErrorGrafik('Gagal memuat data grafik');
        } finally {
            setLoadingGrafik(false);
        }
    }

    async function ambilRingkasanHariIni() {
        setLoading(true);
        setError('');
        try {
            // Ditarik paralel: data hari ini buat ditampilkan, data kemarin
            // cuma buat pembanding tren (badge naik/turun di StatCard).
            const [hariIni, hariSebelumnya] = await Promise.all([
                api.get('/rekap-transaksi', { params: { dari: today, sampai: today } }),
                api.get('/rekap-transaksi', { params: { dari: kemarin, sampai: kemarin } }),
            ]);
            setRingkasan(hariIni.data);
            setRingkasanKemarin(hariSebelumnya.data);
        } catch (err) {
            setError('Gagal memuat ringkasan hari ini');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        ambilRingkasanHariIni();
        ambilDataGrafik();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [today, kemarin]);

    const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const rataRataPendapatan = useMemo(() => {
        if (!ringkasan || !ringkasan.total_transaksi) return 0;
        return ringkasan.total_pendapatan / ringkasan.total_transaksi;
    }, [ringkasan]);

    const trendTransaksi = useMemo(
        () => (ringkasan && ringkasanKemarin ? buatTrend(ringkasan.total_transaksi, ringkasanKemarin.total_transaksi) : null),
        [ringkasan, ringkasanKemarin]
    );
    const trendPendapatan = useMemo(
        () => (ringkasan && ringkasanKemarin ? buatTrend(ringkasan.total_pendapatan, ringkasanKemarin.total_pendapatan) : null),
        [ringkasan, ringkasanKemarin]
    );

    const namaDepan = user?.nama_lengkap?.split(' ')[0];

    return (
        <div>
            <PageHeader
                eyebrow="PANEL OWNER"
                title="Ringkasan Usaha"
                description="Lihat performa pendapatan parkir kapan saja."
            />

            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                    <p className="text-sm text-[#EDEFF2]">
                        {sapaanWaktu()}{namaDepan ? `, ${namaDepan}` : ''}.
                    </p>
                    <p className="text-xs text-[#8B94A3] font-mono mt-0.5">{tanggalHariIni}</p>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => {
                        ambilRingkasanHariIni();
                        ambilDataGrafik();
                    }}
                    disabled={loading || loadingGrafik}
                >
                    <span className="flex items-center gap-1.5">
                        <RefreshCw size={14} className={(loading || loadingGrafik) ? 'animate-spin' : ''} />
                        Segarkan
                    </span>
                </Button>
            </div>

            {/* Statistik hari ini */}
            <div className="mb-8">
                <h2 className="font-display text-base text-[#EDEFF2] mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-[#F4B400]" />
                    Aktivitas Hari Ini
                </h2>

                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                        <Card className="p-5 animate-pulse h-24" />
                        <Card className="p-5 animate-pulse h-24" />
                        <Card className="p-5 animate-pulse h-24" />
                    </div>
                )}

                {!loading && error && (
                    <Card className="p-5 max-w-xl">
                        <p className="text-sm text-[#E5484D] mb-3">{error}</p>
                        <Button variant="ghost" onClick={ambilRingkasanHariIni}>Coba Lagi</Button>
                    </Card>
                )}

                {!loading && !error && ringkasan && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                            <StatCard
                                label="TRANSAKSI HARI INI"
                                value={ringkasan.total_transaksi}
                                icon={Receipt}
                                trend={trendTransaksi}
                            />
                            <StatCard
                                label="PENDAPATAN HARI INI"
                                value={`Rp ${Number(ringkasan.total_pendapatan).toLocaleString('id-ID')}`}
                                accent="#35C48D"
                                icon={Wallet}
                                trend={trendPendapatan}
                            />
                            <StatCard
                                label="RATA-RATA / TRANSAKSI"
                                value={`Rp ${Math.round(rataRataPendapatan).toLocaleString('id-ID')}`}
                                accent="#5B8DEF"
                                icon={TrendingUp}
                            />
                        </div>

                        {ringkasan.total_transaksi === 0 && (
                            <p className="text-xs text-[#8B94A3] mt-3">
                                Belum ada transaksi yang tercatat hari ini.
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* Grafik gabungan 7 hari terakhir */}
            <div className="mb-8">
                <h2 className="font-display text-base text-[#EDEFF2] mb-3 flex items-center gap-2">
                    <LineChart size={16} className="text-[#F4B400]" />
                    Tren 7 Hari Terakhir
                </h2>

                <Card className="p-5">
                    {loadingGrafik && (
                        <div className="h-80 flex items-center justify-center text-sm text-[#8B94A3]">
                            Memuat grafik...
                        </div>
                    )}

                    {!loadingGrafik && errorGrafik && (
                        <div className="h-80 flex flex-col items-center justify-center gap-3">
                            <p className="text-sm text-[#E5484D]">{errorGrafik}</p>
                            <Button variant="ghost" onClick={ambilDataGrafik}>Coba Lagi</Button>
                        </div>
                    )}

                    {!loadingGrafik && !errorGrafik && (
                        <GrafikRingkasan data={dataGrafik} />
                    )}
                </Card>
            </div>

            {/* Menu utama */}
            <div>
                <h2 className="font-display text-base text-[#EDEFF2] mb-3 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-[#F4B400]" />
                    Menu
                </h2>
                <Link to="/owner/rekap" className="group block max-w-md">
                    <Card className="p-6 flex flex-col justify-between h-full transition-colors duration-200 hover:border-[#F4B400]/30">
                        <div>
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#35C48D]/10 text-[#35C48D] mb-3">
                                <FileBarChart size={18} />
                            </span>
                            <h3 className="font-display text-lg text-[#EDEFF2] mb-2">Rekap Transaksi</h3>
                            <p className="text-sm text-[#8B94A3] mb-4">
                                Pilih rentang tanggal untuk melihat jumlah transaksi dan
                                total pendapatan pada periode tertentu, lalu ekspor atau cetak laporannya.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#F4B400] font-medium">
                            Buka Rekap Transaksi
                            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                    </Card>
                </Link>
            </div>

            <footer className="border-t border-white/5 mt-10">
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