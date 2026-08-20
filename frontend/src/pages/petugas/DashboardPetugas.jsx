import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { PageHeader, StatCard, Card, Button } from "../../components/ui";

export default function DashboardPetugas() {
    const [hariIni, setHariIni] = useState({ transaksi: "—", pendapatan: "—" });
    const [kendaraanDidalam, setKendaraanDidalam] = useState("—");
    const [bookingMenunggu, setBookingMenunggu] = useState("—");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRekapHariIni() {
            try {
                const res = await api.get("/transaksi/rekap-harian");
                const data = res.data ?? [];
                const terakhir = data[data.length - 1];
                if (terakhir) {
                    setHariIni({
                        transaksi: terakhir.jumlah_transaksi ?? 0,
                        pendapatan: terakhir.pendapatan
                            ? `Rp ${Number(terakhir.pendapatan).toLocaleString("id-ID")}`
                            : "Rp 0",
                    });
                } else {
                    setHariIni({ transaksi: 0, pendapatan: "Rp 0" });
                }
            } catch (e) {
                // biarkan tampil '—' kalau gagal fetch
            } finally {
                setLoading(false);
            }
        }

        async function loadKendaraanDidalam() {
            try {
                const res = await api.get("/transaksi/kendaraan-didalam");
                setKendaraanDidalam(res.data?.jumlah_kendaraan_didalam ?? 0);
            } catch (e) {
                // biarkan tampil '—' kalau gagal fetch
            }
        }

        async function loadBookingMenunggu() {
            try {
                const res = await api.get("/booking", { params: { status: "menunggu" } });
                const data = res.data.data ?? res.data;
                setBookingMenunggu(data.length ?? 0);
            } catch (e) {
                // biarkan tampil '—' kalau gagal fetch
            }
        }

        loadRekapHariIni();
        loadKendaraanDidalam();
        loadBookingMenunggu();
    }, []);

    return (
        <div>
            <PageHeader
                eyebrow="PANEL PETUGAS"
                title="Ringkasan Tugas Hari Ini"
                description="Catat kendaraan masuk/keluar dan pantau transaksi harian dari sini."
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="TRANSAKSI HARI INI"
                    value={loading ? "—" : hariIni.transaksi}
                />
                <StatCard
                    label="PENDAPATAN HARI INI"
                    value={loading ? "—" : hariIni.pendapatan}
                    accent="#35C48D"
                />
                <StatCard
                    label="KENDARAAN DI DALAM"
                    value={kendaraanDidalam}
                    accent="#F4B400"
                />
                <StatCard
                    label="BOOKING MENUNGGU"
                    value={bookingMenunggu}
                    accent="#F4B400"
                />
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card className="p-6 flex flex-col">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-1">
                        Kendaraan Masuk
                    </h2>
                    <p className="text-sm text-[#8B94A3] mb-4 flex-1">
                        Catat kendaraan baru yang masuk area parkir.
                    </p>
                    <Link to="/petugas/masuk">
                        <Button className="w-full">Catat Masuk</Button>
                    </Link>
                </Card>

                <Card className="p-6 flex flex-col">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-1">
                        Kendaraan Keluar
                    </h2>
                    <p className="text-sm text-[#8B94A3] mb-4 flex-1">
                        Proses kendaraan keluar & hitung biaya parkir.
                    </p>
                    <Link to="/petugas/keluar">
                        <Button className="w-full">Proses Keluar</Button>
                    </Link>
                </Card>

                <Card className="p-6 flex flex-col">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-1">
                        Riwayat Transaksi
                    </h2>
                    <p className="text-sm text-[#8B94A3] mb-4 flex-1">
                        Lihat & cetak ulang struk transaksi sebelumnya.
                    </p>
                    <Link to="/petugas/transaksi">
                        <Button variant="ghost" className="w-full">
                            Lihat Riwayat
                        </Button>
                    </Link>
                </Card>

                <Card className="p-6 flex flex-col">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-1">
                        Booking Masuk
                    </h2>
                    <p className="text-sm text-[#8B94A3] mb-4 flex-1">
                        Konfirmasi atau tolak booking parkir online dari pelanggan.
                    </p>
                    <Link to="/petugas/booking">
                        <Button variant="ghost" className="w-full">
                            Kelola Booking
                        </Button>
                    </Link>
                </Card>
            </div>

            <Card className="p-6">
                <h2 className="font-display text-lg text-[#EDEFF2] mb-2">
                    Akses cepat
                </h2>
                <p className="text-sm text-[#8B94A3]">
                    Gunakan menu di sidebar untuk mencatat kendaraan masuk,
                    memproses kendaraan keluar, dan melihat riwayat transaksi
                    yang sudah kamu buat.
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