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
                        <span className="w-8 h-8 rounded-lg bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} />
                        </span>
                        <h2 className="font-display text-base text-[var(--color-text)]">
                            Aturan Denda Keterlambatan
                        </h2>
                    </div>
                    {!loading && (
                        <span
                            className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${
                                form.aktif
                                    ? "bg-[#35C48D]/10 text-[#35C48D]"
                                    : "bg-[var(--color-section)] text-[var(--color-text-secondary)]"
                            }`}
                        >
                            {form.aktif ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {form.aktif ? "AKTIF" : "NONAKTIF"}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="h-16 rounded-md bg-[var(--color-section)] animate-pulse" />
                        <div className="h-16 rounded-md bg-[var(--color-section)] animate-pulse" />
                        <div className="h-11 rounded-md bg-[var(--color-section)] animate-pulse w-2/3" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
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
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                                Dikenakan per jam (dibulatkan ke atas) setiap kendaraan booking
                                keluar melewati jam rencana keluar.
                            </p>
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
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
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                                Keterlambatan di bawah batas ini tidak dikenakan denda.
                            </p>
                        </div>

                        <label className="flex items-center gap-2.5 text-sm text-[var(--color-text)] rounded-md border border-[var(--color-border)] bg-[var(--color-section)] px-3 py-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.aktif}
                                onChange={(e) =>
                                    setForm({ ...form, aktif: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-section)] accent-[#2563eb]"
                            />
                            Aktifkan denda keterlambatan booking
                        </label>

                        {error && (
                            <p className="text-sm text-[#2563eb] bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-md px-3 py-2">
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

            <footer className="border-t border-[var(--color-border)] mt-8">
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