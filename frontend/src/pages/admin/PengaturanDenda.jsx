import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { PageHeader, Card, Button, Input } from "../../components/ui";
import { AlertTriangle, Wallet, Timer, CheckCircle2, XCircle } from "lucide-react";

export default function PengaturanDenda() {
    const [form, setForm] = useState({
        denda_per_jam: "",
        toleransi_menit: "",
        aktif: true,
    });
    const [loading, setLoading] = useState(false);
    const [menyimpan, setMenyimpan] = useState(false);
    const [error, setError] = useState("");
    const { showSuccess, showError } = useToast();

    async function load() {
        setLoading(true);
        try {
            const res = await api.get("/pengaturan-denda");
            setForm({
                denda_per_jam: res.data.denda_per_jam,
                toleransi_menit: res.data.toleransi_menit,
                aktif: !!res.data.aktif,
            });
        } catch (err) {
            showError("Gagal memuat pengaturan denda.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setMenyimpan(true);
        try {
            const res = await api.put("/pengaturan-denda", form);
            setForm({
                denda_per_jam: res.data.data.denda_per_jam,
                toleransi_menit: res.data.data.toleransi_menit,
                aktif: !!res.data.data.aktif,
            });
            showSuccess("Pengaturan denda berhasil disimpan.");
        } catch (err) {
            const pesan = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(", ")
                : "Gagal menyimpan pengaturan denda";
            setError(pesan);
            showError(pesan);
        } finally {
            setMenyimpan(false);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="DATA MASTER"
                title="Pengaturan Denda"
                description="Atur nominal denda keterlambatan booking. Denda dihitung otomatis oleh sistem saat kendaraan keluar — petugas tidak perlu memasukkan nominal secara manual."
            />

            <Card className="p-5 max-w-lg">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} />
                        </span>
                        <h2 className="font-display text-base text-white">
                            Aturan Denda Keterlambatan
                        </h2>
                    </div>
                    {!loading && (
                        <span
                            className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${
                                form.aktif
                                    ? "bg-[#35C48D]/10 text-[#35C48D]"
                                    : "bg-[#1F1F1F] text-[#8A8A8A]"
                            }`}
                        >
                            {form.aktif ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {form.aktif ? "AKTIF" : "NONAKTIF"}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="h-16 rounded-md bg-[#1F1F1F] animate-pulse" />
                        <div className="h-16 rounded-md bg-[#1F1F1F] animate-pulse" />
                        <div className="h-11 rounded-md bg-[#1F1F1F] animate-pulse w-2/3" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-[#8A8A8A] mb-1.5">
                                <Wallet size={12} />
                                DENDA PER JAM KETERLAMBATAN (Rp)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={form.denda_per_jam}
                                onChange={(e) =>
                                    setForm({ ...form, denda_per_jam: e.target.value })
                                }
                                placeholder="cth. 5000"
                                required
                            />
                            <p className="text-xs text-[#8A8A8A] mt-1.5">
                                Dikenakan per jam (dibulatkan ke atas) setiap kendaraan booking
                                keluar melewati jam rencana keluar.
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-[#8A8A8A] mb-1.5">
                                <Timer size={12} />
                                TOLERANSI KETERLAMBATAN (menit)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={form.toleransi_menit}
                                onChange={(e) =>
                                    setForm({ ...form, toleransi_menit: e.target.value })
                                }
                                placeholder="cth. 15"
                                required
                            />
                            <p className="text-xs text-[#8A8A8A] mt-1.5">
                                Keterlambatan di bawah batas ini tidak dikenakan denda.
                            </p>
                        </div>

                        <label className="flex items-center gap-2.5 text-sm text-white rounded-md border border-[#262626] bg-[#1F1F1F] px-3 py-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.aktif}
                                onChange={(e) =>
                                    setForm({ ...form, aktif: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-[#262626] bg-[#1F1F1F] accent-[#F97316]"
                            />
                            Aktifkan denda keterlambatan booking
                        </label>

                        {error && (
                            <p className="text-sm text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/20 rounded-md px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div className="pt-1">
                            <Button type="submit" disabled={menyimpan}>
                                {menyimpan ? "Menyimpan..." : "Simpan Pengaturan"}
                            </Button>
                        </div>
                    </form>
                )}
            </Card>

            <footer className="border-t border-[#262626] mt-8">
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