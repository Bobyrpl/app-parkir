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
                        <span className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} />
                        </span>
                        <h2 className="font-semibold text-base text-neutral-900">
                            Aturan Denda Keterlambatan
                        </h2>
                    </div>
                    {!loading && (
                        <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                form.aktif
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-neutral-100 text-neutral-500"
                            }`}
                        >
                            {form.aktif ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {form.aktif ? "AKTIF" : "NONAKTIF"}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="h-16 rounded-xl bg-neutral-100 animate-pulse" />
                        <div className="h-16 rounded-xl bg-neutral-100 animate-pulse" />
                        <div className="h-11 rounded-xl bg-neutral-100 animate-pulse w-2/3" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                                <Wallet size={12} />
                                Denda per Jam Keterlambatan (Rp)
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
                            <p className="text-xs text-neutral-500 mt-1.5">
                                Dikenakan per jam (dibulatkan ke atas) setiap kendaraan booking
                                keluar melewati jam rencana keluar.
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                                <Timer size={12} />
                                Toleransi Keterlambatan (menit)
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
                            <p className="text-xs text-neutral-500 mt-1.5">
                                Keterlambatan di bawah batas ini tidak dikenakan denda.
                            </p>
                        </div>

                        <label className="flex items-center gap-2.5 text-sm text-neutral-900 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.aktif}
                                onChange={(e) =>
                                    setForm({ ...form, aktif: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
                            />
                            Aktifkan denda keterlambatan booking
                        </label>

                        {error && (
                            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
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

            <footer className="border-t border-neutral-200 mt-8">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-neutral-400 text-center sm:text-left">
                    <span>
                        © {new Date().getFullYear()} Parkir Pelabuhan Tanjung
                        Perak
                    </span>
                    <span className="uppercase tracking-wide">Sistem Manajemen Parkir</span>
                </div>
            </footer>
        </div>
    );
}