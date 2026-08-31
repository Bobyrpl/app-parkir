import { useEffect, useState } from "react";
import api from "../../api/axios";
import { PageHeader, Card, Button, Input } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import ModalScanQr from "../../components/ModalScanQr";

// Cari tarif yang jenis_kendaraan-nya sama persis dengan kendaraan yang dipilih
function cariTarifOtomatis(tarifList, jenisKendaraan) {
    if (!jenisKendaraan) return null;
    const target = jenisKendaraan.trim().toLowerCase();
    return (
        tarifList.find(
            (t) => t.jenis_kendaraan.trim().toLowerCase() === target,
        ) || null
    );
}

// Cari area yang namanya mengandung jenis kendaraan (mis. "motor" -> "Area A - Motor")
// dan masih ada slot kosong. Kalau tidak ada yang kosong, tetap kembalikan area yang
// namanya cocok (supaya bisa ditampilkan sebagai "penuh"), biar petugas tahu kenapa
// dan bisa pilih area lain secara manual.
function cariAreaOtomatis(areaList, jenisKendaraan) {
    if (!jenisKendaraan) return null;
    const target = jenisKendaraan.trim().toLowerCase();

    const areaCocok = areaList.filter((a) =>
        a.nama_area.toLowerCase().includes(target),
    );
    if (areaCocok.length === 0) return null;

    const adaSlot = areaCocok.find((a) => a.terisi < a.kapasitas);
    return adaSlot || areaCocok[0];
}

export default function KendaraanMasuk() {
    const [kendaraanList, setKendaraanList] = useState([]);
    const [tarifList, setTarifList] = useState([]);
    const [areaList, setAreaList] = useState([]);
    const [cari, setCari] = useState("");
    const [form, setForm] = useState({
        id_kendaraan: "",
        id_tarif: "",
        id_area: "",
        id_booking: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [kodeBooking, setKodeBooking] = useState("");
    const [bookingInfo, setBookingInfo] = useState(null);
    const [cariBookingLoading, setCariBookingLoading] = useState(false);
    const [scanOpen, setScanOpen] = useState(false);

    // Menandai apakah id_tarif / id_area saat ini adalah hasil pengisian otomatis,
    // supaya bisa dikasih label "otomatis" di UI. Begitu petugas mengubahnya sendiri
    // lewat dropdown, tandanya lepas dan dianggap pilihan manual.
    const [tarifOtomatis, setTarifOtomatis] = useState(false);
    const [areaOtomatis, setAreaOtomatis] = useState(false);

    const { showSuccess, showError } = useToast();

    // Dipakai baik oleh submit form pencarian kode manual maupun hasil scan QR,
    // supaya keduanya berbagi satu logika yang sama (dan tidak bergantung pada
    // state kodeBooking yang belum tentu ter-update duluan sebelum dipakai).
    async function cariBooking(kode) {
        if (!kode.trim()) return;
        setCariBookingLoading(true);
        try {
            const res = await api.get(`/booking/cari/${kode.trim()}`);
            const b = res.data;
            setBookingInfo(b);
            setForm({
                id_kendaraan: b.id_kendaraan,
                id_tarif: b.id_tarif,
                id_area: b.id_area,
                id_booking: b.id_booking,
            });
            // Tarif & area sudah ditentukan sejak booking dibuat, jadi bukan hasil
            // auto-fill di halaman ini — tampilkan sebagai pilihan tetap (bisa diubah manual bila perlu).
            setTarifOtomatis(false);
            setAreaOtomatis(false);
            showSuccess(`Booking ditemukan: ${b.kendaraan?.plat_nomor}`);
        } catch (err) {
            setBookingInfo(null);
            showError(
                err.response?.data?.message || "Kode booking tidak ditemukan.",
            );
        } finally {
            setCariBookingLoading(false);
        }
    }

    async function handleCariBooking(e) {
        e.preventDefault();
        cariBooking(kodeBooking);
    }

    // Hasil scan kamera (ModalScanQr) - QR pelanggan cuma berisi teks kode_booking
    // mentah (lihat components/ModalQrBooking.jsx di sisi pelanggan), jadi tinggal
    // dipakai sebagai kode dan dicari lewat endpoint yang sama seperti input manual.
    function handleScanDetected(kode) {
        setScanOpen(false);
        setKodeBooking(kode);
        cariBooking(kode);
    }

    async function loadTarifDanArea() {
        try {
            const [tarif, area] = await Promise.all([
                api.get("/tarif"),
                api.get("/area-parkir"),
            ]);
            setTarifList(tarif.data);
            setAreaList(area.data);
        } catch (err) {
            showError("Gagal memuat data tarif/area parkir.");
        }
    }

    useEffect(() => {
        loadTarifDanArea();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleCari(e) {
        e.preventDefault();
        if (!cari.trim()) return;
        try {
            const res = await api.get(`/kendaraan/cari/${cari}`);
            setKendaraanList(res.data);
            if (res.data.length === 0) {
                showError(`Tidak ada kendaraan dengan plat nomor "${cari}".`);
            }
        } catch (err) {
            showError(
                err.response?.data?.message || "Gagal mencari kendaraan.",
            );
        }
    }

    // Saat petugas memilih salah satu kendaraan hasil pencarian, coba isi otomatis
    // tarif & area berdasarkan jenis kendaraannya. Kalau tidak ketemu (tarif belum
    // diatur, atau area jenis itu penuh/tidak ada), field dikosongkan dan petugas
    // tinggal pilih manual dari dropdown seperti biasa.
    //
    // Guard tambahan: kalau kendaraan ini sedang_parkir (masih di dalam, belum
    // tercatat keluar), tolak pemilihan sejak di sini juga — jangan andalkan
    // disabled di tombol saja, karena data bisa saja stale/berubah di antara
    // render. Backend (/transaksi/masuk) sudah menolak kasus ini juga, tapi
    // memberi tahu petugas lebih awal di sini jauh lebih jelas UX-nya.
    function handlePilihKendaraan(k) {
        if (k.sedang_parkir) {
            showError(
                `Kendaraan ${k.plat_nomor} sudah tercatat sedang parkir dan belum keluar.`,
            );
            return;
        }

        const tarif = cariTarifOtomatis(tarifList, k.jenis_kendaraan);
        const area = cariAreaOtomatis(areaList, k.jenis_kendaraan);

        setForm({
            ...form,
            id_kendaraan: k.id_kendaraan,
            id_booking: "",
            id_tarif: tarif ? tarif.id_tarif : "",
            id_area: area && area.terisi < area.kapasitas ? area.id_area : "",
        });
        setTarifOtomatis(!!tarif);
        setAreaOtomatis(!!(area && area.terisi < area.kapasitas));
        setBookingInfo(null);

        if (!tarif) {
            showError(
                `Tarif untuk jenis kendaraan "${k.jenis_kendaraan}" belum diatur. Pilih tarif secara manual.`,
            );
        } else if (!area) {
            showError(
                `Belum ada area parkir untuk jenis kendaraan "${k.jenis_kendaraan}". Pilih area secara manual.`,
            );
        } else if (area.terisi >= area.kapasitas) {
            showError(
                `Area parkir untuk jenis "${k.jenis_kendaraan}" sedang penuh. Pilih area lain secara manual.`,
            );
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post("/transaksi/masuk", form);
            showSuccess(
                `Kendaraan berhasil dicatat masuk. ID transaksi: ${res.data.data.id_parkir}`,
            );
            setForm({
                id_kendaraan: "",
                id_tarif: "",
                id_area: "",
                id_booking: "",
            });
            setKendaraanList([]);
            setCari("");
            setKodeBooking("");
            setBookingInfo(null);
            setTarifOtomatis(false);
            setAreaOtomatis(false);
            // Refresh daftar area supaya angka "terisi" langsung ter-update,
            // tidak perlu reload halaman manual.
            loadTarifDanArea();
        } catch (err) {
            showError(
                err.response?.data?.message ||
                    "Gagal mencatat kendaraan masuk.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="TRANSAKSI"
                title="Kendaraan Masuk"
                description="Cari kendaraan lalu catat waktu masuk & area parkirnya."
            />

            <div className="max-w-xl space-y-6">
                <Card className="p-5">
                    <h2 className="font-display text-base text-[var(--color-text)] mb-3">
                        Punya Kode Booking?
                    </h2>
                    <form onSubmit={handleCariBooking} className="flex gap-2">
                        <Input
                            className="font-mono uppercase"
                            value={kodeBooking}
                            onChange={(e) => setKodeBooking(e.target.value)}
                            placeholder="mis. BKG-7F3K9A"
                        />
                        <Button type="submit" disabled={cariBookingLoading}>
                            {cariBookingLoading ? "Mencari..." : "Cari"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setScanOpen(true)}
                        >
                            Scan QR
                        </Button>
                    </form>
                    {bookingInfo && (
                        <p className="mt-3 text-xs text-[#35C48D]">
                            Booking dipakai: {bookingInfo.kendaraan?.plat_nomor}{" "}
                            — {bookingInfo.area?.nama_area}. Form di bawah
                            otomatis terisi.
                        </p>
                    )}
                </Card>

                <Card className="p-5">
                    <h2 className="font-display text-base text-[var(--color-text)] mb-3">
                        atau Cari Kendaraan (plat nomor)
                    </h2>
                    <form onSubmit={handleCari} className="flex gap-2">
                        <Input
                            className="font-mono uppercase"
                            value={cari}
                            onChange={(e) => setCari(e.target.value)}
                            placeholder="mis. AD 1234"
                        />
                        <Button type="submit">Cari</Button>
                    </form>

                    {kendaraanList.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {kendaraanList.map((k) => (
                                <button
                                    key={k.id_kendaraan}
                                    type="button"
                                    disabled={k.sedang_parkir}
                                    onClick={() => handlePilihKendaraan(k)}
                                    className={`w-full flex items-center justify-between gap-2 text-left rounded-md px-3 py-2 text-sm font-mono border transition ${
                                        k.sedang_parkir
                                            ? "border-[var(--color-border)] bg-[var(--color-section)] text-[var(--color-text-secondary)] cursor-not-allowed"
                                            : form.id_kendaraan ===
                                                k.id_kendaraan
                                              ? "border-[#C90000] bg-[#C90000]/10 text-[#C90000]"
                                              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-section)]"
                                    }`}
                                >
                                    <span className="truncate">
                                        {k.plat_nomor} — {k.jenis_kendaraan}
                                    </span>
                                    {k.sedang_parkir && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C90000]/15 text-[#C90000] shrink-0">
                                            SUDAH PARKIR
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="p-5">
                    <h2 className="font-display text-base text-[var(--color-text)] mb-3">
                        Detail Parkir
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)]">
                                    TARIF
                                </label>
                                {tarifOtomatis && form.id_tarif && (
                                    <span className="text-[10px] font-mono text-[#35C48D]">
                                        terisi otomatis
                                    </span>
                                )}
                            </div>
                            <select
                                value={form.id_tarif}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        id_tarif: e.target.value,
                                    });
                                    setTarifOtomatis(false);
                                }}
                                required
                                className="w-full rounded-md bg-[var(--color-section)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#C90000]"
                            >
                                <option value="">Pilih tarif</option>
                                {tarifList.map((t) => (
                                    <option key={t.id_tarif} value={t.id_tarif}>
                                        {t.jenis_kendaraan} — Rp{" "}
                                        {Number(t.tarif_per_jam).toLocaleString(
                                            "id-ID",
                                        )}
                                        /jam
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-mono text-[var(--color-text-secondary)]">
                                    AREA PARKIR
                                </label>
                                {areaOtomatis && form.id_area && (
                                    <span className="text-[10px] font-mono text-[#35C48D]">
                                        terisi otomatis
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                {areaList.map((a) => {
                                    const penuh = a.terisi >= a.kapasitas;
                                    const persen =
                                        a.kapasitas > 0
                                            ? a.terisi / a.kapasitas
                                            : 0;
                                    const hampirPenuh =
                                        !penuh && persen >= 0.8;
                                    const dipilih =
                                        String(form.id_area) ===
                                        String(a.id_area);

                                    return (
                                        <button
                                            key={a.id_area}
                                            type="button"
                                            disabled={penuh}
                                            onClick={() => {
                                                setForm({
                                                    ...form,
                                                    id_area: a.id_area,
                                                });
                                                setAreaOtomatis(false);
                                            }}
                                            className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm border transition ${
                                                penuh
                                                    ? "border-[var(--color-border)] bg-[var(--color-section)] text-[var(--color-text-secondary)] cursor-not-allowed"
                                                    : dipilih
                                                      ? "border-[#C90000] bg-[#C90000]/10 text-[#C90000]"
                                                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-section)]"
                                            }`}
                                        >
                                            <span className="font-mono truncate">
                                                {a.nama_area}
                                            </span>
                                            <span className="flex items-center gap-2 shrink-0">
                                                <span className="font-mono text-xs">
                                                    {a.terisi}/{a.kapasitas}
                                                </span>
                                                {penuh ? (
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C90000]/15 text-[#C90000]">
                                                        PENUH
                                                    </span>
                                                ) : hampirPenuh ? (
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C90000]/15 text-[#C90000]">
                                                        HAMPIR PENUH
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#35C48D]/15 text-[#35C48D]">
                                                        TERSEDIA
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                                {areaList.length === 0 && (
                                    <p className="text-xs text-[var(--color-text-secondary)]">
                                        Belum ada data area parkir.
                                    </p>
                                )}
                            </div>
                        </div>

                        {!form.id_kendaraan && (
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                Cari &amp; pilih kendaraan terlebih dahulu di
                                atas.
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={
                                !form.id_kendaraan ||
                                !form.id_area ||
                                submitting
                            }
                        >
                            {submitting
                                ? "Memproses..."
                                : "Catat Kendaraan Masuk"}
                        </Button>
                    </form>
                </Card>
            </div>

            {scanOpen && (
                <ModalScanQr
                    onDetected={handleScanDetected}
                    onClose={() => setScanOpen(false)}
                />
            )}

            <footer className="border-t border-[var(--color-border)]">
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