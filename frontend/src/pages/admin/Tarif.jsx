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

const KOSONG = { jenis_kendaraan: "motor", tarif_per_jam: "" };

export default function Tarif() {
    const [data, setData] = useState([]);
    const [form, setForm] = useState(KOSONG);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [hapusId, setHapusId] = useState(null);
    const [menghapus, setMenghapus] = useState(false);
    const { showSuccess, showError } = useToast();

    async function load() {
        try {
            const res = await api.get("/tarif");
            setData(res.data);
        } catch (err) {
            showError("Gagal memuat data tarif.");
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
        setEditId(null);
        setForm(KOSONG);
    }

    return (
        <div>
            <PageHeader
                eyebrow="DATA MASTER"
                title="Tarif Parkir"
                description="Atur tarif per jam untuk setiap jenis kendaraan."
            />

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-5 md:col-span-1 h-fit">
                    <h2 className="font-display text-base text-[#EDEFF2] mb-4">
                        {editId ? "Edit Tarif" : "Tambah Tarif"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">
                                JENIS KENDARAAN
                            </label>
                            <select
                                value={form.jenis_kendaraan}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        jenis_kendaraan: e.target.value,
                                    })
                                }
                                className="w-full rounded-md bg-[#14181F] border border-white/10 px-3 py-2 text-sm text-[#EDEFF2] focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                            >
                                <option value="motor">Motor</option>
                                <option value="mobil">Mobil</option>
                                <option value="bus">Bus</option>
                                <option value="truk">Truk</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#8B94A3] mb-1.5">
                                TARIF PER JAM (Rp)
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
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-[#E5484D]">{error}</p>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={loading}>
                                {editId ? "Simpan Perubahan" : "Tambah Tarif"}
                            </Button>
                            {editId && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleCancel}
                                >
                                    Batal
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                <div className="md:col-span-2">
                    <Table columns={["Jenis Kendaraan", "Tarif/Jam", "Aksi"]}>
                        {data.map((item) => (
                            <tr key={item.id_tarif}>
                                <td className="px-4 py-3 capitalize">
                                    <Badge tone="neutral">
                                        {item.jenis_kendaraan}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 font-mono">
                                    Rp{" "}
                                    {Number(item.tarif_per_jam).toLocaleString(
                                        "id-ID",
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleEdit(item)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() =>
                                                mintaHapus(item.id_tarif)
                                            }
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-4 py-6 text-center text-[#8B94A3] text-sm"
                                >
                                    Belum ada data tarif.
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