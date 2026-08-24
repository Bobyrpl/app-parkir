import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Button } from '../../components/ui';
import GrafikRingkasan from './GrafikRingkasan';
import {
    LayoutGrid, ArrowRight, RefreshCw, FileBarChart, LineChart,
} from 'lucide-react';

function sapaanWaktu() {
    const jam = new Date().getHours();
    if (jam < 10) return 'Selamat pagi';
    if (jam < 15) return 'Selamat siang';
    if (jam < 18) return 'Selamat sore';
    return 'Selamat malam';
}

export default function DashboardOwner() {
    const { user } = useAuth();

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

    useEffect(() => {
        ambilDataGrafik();
    }, []);

    const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

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
                    <p className="text-sm text-white">
                        {sapaanWaktu()}{namaDepan ? `, ${namaDepan}` : ''}.
                    </p>
                    <p className="text-xs text-[#8A8A8A] font-mono mt-0.5">{tanggalHariIni}</p>
                </div>
                <Button variant="ghost" onClick={ambilDataGrafik} disabled={loadingGrafik}>
                    <span className="flex items-center gap-1.5">
                        <RefreshCw size={14} className={loadingGrafik ? 'animate-spin' : ''} />
                        Segarkan
                    </span>
                </Button>
            </div>

            {/* Grafik gabungan 7 hari terakhir */}
            <div className="mb-8">
                <h2 className="font-display text-base text-white mb-3 flex items-center gap-2">
                    <LineChart size={16} className="text-[#DC2626]" />
                    Tren 7 Hari Terakhir
                </h2>

                <Card className="p-5">
                    {loadingGrafik && (
                        <div className="h-80 flex items-center justify-center text-sm text-[#8A8A8A]">
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
                <h2 className="font-display text-base text-white mb-3 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-[#DC2626]" />
                    Menu
                </h2>
                <Link to="/owner/rekap" className="group block max-w-md">
                    <Card className="p-6 flex flex-col justify-between h-full transition-colors duration-200 hover:border-[#DC2626]/30">
                        <div>
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#35C48D]/10 text-[#35C48D] mb-3">
                                <FileBarChart size={18} />
                            </span>
                            <h3 className="font-display text-lg text-white mb-2">Rekap Transaksi</h3>
                            <p className="text-sm text-[#8A8A8A] mb-4">
                                Pilih rentang tanggal untuk melihat jumlah transaksi dan
                                total pendapatan pada periode tertentu, lalu ekspor atau cetak laporannya.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#DC2626] font-medium">
                            Buka Rekap Transaksi
                            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                    </Card>
                </Link>
            </div>

            <footer className="border-t border-[#262626] mt-10">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[#8A8A8A] text-center sm:text-left">
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