import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import {
    PageHeader,
    Card,
    Table,
    Button,
    Input,
    Badge,
    ConfirmDialog,
} from "../../components/ui";
import {
    Ticket,
    Pencil,
    Trash2,
    X,
    Inbox,
    Bike,
    Car,
    Bus,
    Truck,
    HelpCircle,
} from "lucide-react";

const KOSONG = { jenis_kendaraan: "motor", tarif_per_jam: "" };

const JENIS_BADGE_TONE = {
    motor: "info",
    mobil: "success",
    bus: "warning",
    truk: "danger",
    lainnya: "neutral",
};

const JENIS_ICON = {
    motor: Bike,
    mobil: Car,
    bus: Bus,
    truk: Truck,
    lainnya: HelpCircle,
};

export default function Tarif() {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(KOSONG);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [hapusId, setHapusId] = useState(null);
    const [menghapus, setMenghapus] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const { showSuccess, showError } = useToast();

    async function load() {
        setLoadingData(true);
        try {
            const res = await api.get("/tarif");
            setData(res.data);
        } catch (err) {
            showError("Gagal memuat data tarif.");
        } finally {
            setLoadingData(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (editId) {
                await api.put(`/tarif/${editId}`, form);
                showSuccess("Tarif berhasil diperbarui.");
            } else {
                await api.post("/tarif", form);
                showSuccess("Tarif berhasil ditambahkan.");
            }
            setForm(KOSONG);
            setEditId(null);
            setShowForm(false);
            load();
        } catch (err) {
            const pesan = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(", ")
                : "Gagal menyimpan tarif";
            setError(pesan);
            showError(pesan);
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(item) {
        setEditId(item.id_tarif);
        setForm({
            jenis_kendaraan: item.jenis_kendaraan,
            tarif_per_jam: item.tarif_per_jam,
        });
        setShowForm(true);
    }

    function handleTambahBaru() {
        setEditId(null);
        setForm(KOSONG);
        setError("");
        setShowForm(true);
    }

    function mintaHapus(id) {
        setHapusId(id);
    }

    async function konfirmasiHapus() {
        if (!hapusId) return;
        setMenghapus(true);
        try {
            await api.delete(`/tarif/${hapusId}`);
            showSuccess("Tarif berhasil dihapus.");
            load();
        } catch (err) {
            showError(err.response?.data?.message || "Gagal menghapus tarif.");
        } finally {
            setMenghapus(false);
            setHapusId(null);
        }
    }

    function handleCancel() {
        setShowForm(false);
        setEditId(null);
        setForm(KOSONG);
        setError("");
    }

    return (
        <div>
            <PageHeader
                eyebrow="DATA MASTER"
                title="Tarif Parkir"
                description="Atur tarif per jam untuk setiap jenis kendaraan."
            />

            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-base text-neutral-900">
                    Daftar Tarif
                </h2>
                {!showForm && (
                    <Button
                        onClick={handleTambahBaru}
                        className="inline-flex items-center gap-1.5"
                    >
                        <Ticket size={15} />
                        Tambah Tarif
                    </Button>
                )}
            </div>

            <div
                className={`grid grid-cols-1 gap-4 md:gap-6 ${
                    showForm ? "md:grid-cols-3" : ""
                }`}
            >
                {showForm && (
                    <Card className="p-5 md:col-span-1 h-fit md:sticky md:top-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0">
                                    {editId ? <Pencil size={15} /> : <Ticket size={15} />}
                                </span>
                                <h2 className="font-semibold text-base text-neutral-900">
                                    {editId ? "Edit Tarif" : "Tambah Tarif"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0"
                                aria-label="Tutup form"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                                    Jenis Kendaraan
                                </label>
                                <select
                                    value={form.jenis_kendaraan}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            jenis_kendaraan: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-xl bg-white border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                                >
                                    <option value="motor">Motor</option>
                                    <option value="mobil">Mobil</option>
                                    <option value="bus">Bus</option>
                                    <option value="truk">Truk</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                                    Tarif per Jam (Rp)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.tarif_per_jam}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tarif_per_jam: e.target.value,
                                        })
                                    }
                                    placeholder="cth. 3000"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                                <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                                    {loading
                                        ? "Menyimpan..."
                                        : editId
                                        ? "Simpan Perubahan"
                                        : "Tambah Tarif"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1 sm:flex-none"
                                    onClick={handleCancel}
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <div className={showForm ? "md:col-span-2" : ""}>
                    <Table columns={["Jenis Kendaraan", "Tarif/Jam", "Aksi"]}>
                        {loadingData &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3" colSpan={3}>
                                        <div className="h-9 rounded-xl bg-neutral-100 animate-pulse" />
                                    </td>
                                </tr>
                            ))}

                        {!loadingData &&
                            data.map((item) => {
                                const Icon = JENIS_ICON[item.jenis_kendaraan] ?? HelpCircle;
                                return (
                                    <tr
                                        key={item.id_tarif}
                                        className="transition-colors hover:bg-neutral-50"
                                    >
                                        <td className="px-4 py-3 capitalize">
                                            <Badge
                                                tone={
                                                    JENIS_BADGE_TONE[item.jenis_kendaraan] ??
                                                    "neutral"
                                                }
                                            >
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Icon size={12} />
                                                    {item.jenis_kendaraan}
                                                </span>
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-900">
                                            Rp{" "}
                                            {Number(
                                                item.tarif_per_jam,
                                            ).toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleEdit(item)}
                                                    className="inline-flex items-center gap-1.5"
                                                >
                                                    <Pencil size={13} />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    onClick={() =>
                                                        mintaHapus(item.id_tarif)
                                                    }
                                                    className="inline-flex items-center gap-1.5"
                                                >
                                                    <Trash2 size={13} />
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                        {!loadingData && data.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-14 text-center">
                                    <div className="flex flex-col items-center gap-2.5 text-neutral-500">
                                        <span className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center">
                                            <Inbox size={18} />
                                        </span>
                                        <p className="text-sm">
                                            Belum ada data tarif.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </div>

            <ConfirmDialog
                open={!!hapusId}
                title="Hapus Tarif"
                message="Yakin ingin menghapus tarif ini? Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Hapus"
                loading={menghapus}
                onConfirm={konfirmasiHapus}
                onCancel={() => setHapusId(null)}
            />

            <footer className="border-t border-neutral-200">
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