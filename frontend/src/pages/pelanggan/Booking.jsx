import { useEffect, useState } from "react";
import api from "../../api/axios";
import { PageHeader, Card, Button, Input } from "../../components/ui";
import { useToast } from "../../context/ToastContext";

// Cari tarif yang jenis_kendaraan-nya sama persis dengan kendaraan yang dipilih
function cariTarifOtomatis(tarifList, jenisKendaraan) {
  if (!jenisKendaraan) return null;
  const target = jenisKendaraan.trim().toLowerCase();
  return (
    tarifList.find((t) => t.jenis_kendaraan.trim().toLowerCase() === target) ||
    null
  );
}

// Cari area yang namanya mengandung jenis kendaraan (mis. "motor" -> "Area A - Motor")
// dan masih ada slot kosong. Kalau tidak ada yang kosong, tetap kembalikan area yang
// namanya cocok (supaya bisa ditampilkan sebagai "penuh"), biar pesannya jelas.
function cariAreaOtomatis(areaList, jenisKendaraan) {
  if (!jenisKendaraan) return { area: null, alasanTidakAda: null };
  const target = jenisKendaraan.trim().toLowerCase();

  const areaCocok = areaList.filter((a) =>
    a.nama_area.toLowerCase().includes(target),
  );

  if (areaCocok.length === 0) {
    return { area: null, alasanTidakAda: "notfound" };
  }

  const adaSlot = areaCocok.find((a) => a.terisi < a.kapasitas);
  if (adaSlot) return { area: adaSlot, alasanTidakAda: null };

  // semua area yang cocok penuh -> tetap tunjukkan salah satunya biar pesannya jelas
  return { area: areaCocok[0], alasanTidakAda: "penuh" };
}

export default function Booking() {
  const [kendaraanList, setKendaraanList] = useState([]);
  const [tarifList, setTarifList] = useState([]);
  const [areaList, setAreaList] = useState([]);

  const [tambahKendaraan, setTambahKendaraan] = useState(false);
  const [formKendaraan, setFormKendaraan] = useState({
    plat_nomor: "",
    jenis_kendaraan: "",
    warna: "",
  });
  const [savingKendaraan, setSavingKendaraan] = useState(false);

  const [form, setForm] = useState({
    id_kendaraan: "",
    tanggal_rencana: "",
    jam_rencana_masuk: "",
    jam_rencana_keluar: "",
    catatan: "",
  });

  // Tarif & area yang dipilih sistem secara otomatis (bukan pilihan pelanggan lagi)
  const [tarifOtomatis, setTarifOtomatis] = useState(null);
  const [areaOtomatis, setAreaOtomatis] = useState(null);
  const [areaAlasanTidakAda, setAreaAlasanTidakAda] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [kodeSukses, setKodeSukses] = useState(null);
  const { showSuccess, showError } = useToast();

  async function loadSemua() {
    try {
      const [kendaraan, tarif, area] = await Promise.all([
        api.get("/kendaraan-saya"),
        api.get("/tarif"),
        api.get("/area-parkir"),
      ]);
      setKendaraanList(kendaraan.data);
      setTarifList(tarif.data);
      setAreaList(area.data);
    } catch (err) {
      showError("Gagal memuat data. Coba muat ulang halaman.");
    }
  }

  useEffect(() => {
    loadSemua();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setiap kendaraan yang dipilih berubah (atau data tarif/area baru selesai dimuat),
  // hitung ulang tarif & area otomatisnya.
  useEffect(() => {
    const kendaraan = kendaraanList.find(
      (k) => k.id_kendaraan === form.id_kendaraan,
    );
    if (!kendaraan) {
      setTarifOtomatis(null);
      setAreaOtomatis(null);
      setAreaAlasanTidakAda(null);
      return;
    }

    setTarifOtomatis(cariTarifOtomatis(tarifList, kendaraan.jenis_kendaraan));

    const { area, alasanTidakAda } = cariAreaOtomatis(
      areaList,
      kendaraan.jenis_kendaraan,
    );
    setAreaOtomatis(area);
    setAreaAlasanTidakAda(alasanTidakAda);
  }, [form.id_kendaraan, kendaraanList, tarifList, areaList]);

  async function handleTambahKendaraan(e) {
    e.preventDefault();
    setSavingKendaraan(true);
    try {
      const res = await api.post("/kendaraan-saya", formKendaraan);
      showSuccess("Kendaraan berhasil ditambahkan");
      setKendaraanList((prev) => [res.data.data, ...prev]);
      setForm((f) => ({ ...f, id_kendaraan: res.data.data.id_kendaraan }));
      setFormKendaraan({ plat_nomor: "", jenis_kendaraan: "", warna: "" });
      setTambahKendaraan(false);
    } catch (err) {
      showError(err.response?.data?.message || "Gagal menambahkan kendaraan.");
    } finally {
      setSavingKendaraan(false);
    }
  }

  // Pilih kendaraan untuk di-booking - kendaraan yang masih sedang_parkir (belum
  // tercatat keluar) tidak boleh dipilih untuk booking baru sampai keluar dulu.
  function handlePilihKendaraan(k) {
    if (k.sedang_parkir) {
      showError(
        `Kendaraan ${k.plat_nomor} masih sedang parkir dan belum keluar. Tidak bisa booking lagi sebelum kendaraan ini keluar.`,
      );
      return;
    }
    setForm({ ...form, id_kendaraan: k.id_kendaraan });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tarifOtomatis || !areaOtomatis) return;

    // Guard tambahan di submit - jangan andalkan disabled tombol saja, karena
    // data kendaraanList bisa saja stale/berubah di antara render (mis. kendaraan
    // baru saja tercatat masuk lewat sisi petugas sebelum tombol ini ditekan).
    if (kendaraanTerpilih?.sedang_parkir) {
      showError(
        `Kendaraan ${kendaraanTerpilih.plat_nomor} masih sedang parkir dan belum keluar. Tidak bisa booking lagi sebelum kendaraan ini keluar.`,
      );
      return;
    }

    setSubmitting(true);
    setKodeSukses(null);
    try {
      const res = await api.post("/booking", {
        id_kendaraan: form.id_kendaraan,
        id_tarif: tarifOtomatis.id_tarif,
        id_area: areaOtomatis.id_area,
        tanggal_rencana: form.tanggal_rencana,
        jam_rencana_masuk: form.jam_rencana_masuk,
        jam_rencana_keluar: form.jam_rencana_keluar,
        catatan: form.catatan,
      });
      setKodeSukses(res.data.data.kode_booking);
      showSuccess(
        "Booking berhasil dibuat! Tunjukkan kode booking ke petugas saat tiba.",
      );
      setForm({
        id_kendaraan: "",
        tanggal_rencana: "",
        jam_rencana_masuk: "",
        jam_rencana_keluar: "",
        catatan: "",
      });
    } catch (err) {
      // Laravel mengirim error validasi lewat `errors` (bukan `message`).
      // Tampilkan pesan spesifik dari field pertama yang gagal, supaya
      // tidak cuma muncul pesan generik "Gagal membuat booking."
      const errors = err.response?.data?.errors;
      if (errors) {
        const pesanPertama = Object.values(errors)[0]?.[0];
        showError(
          pesanPertama || "Data booking tidak valid, periksa kembali form.",
        );
        console.error("Detail error validasi booking:", errors);
      } else {
        showError(err.response?.data?.message || "Gagal membuat booking.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const kendaraanTerpilih = kendaraanList.find(
    (k) => k.id_kendaraan === form.id_kendaraan,
  );

  // Pesan kenapa booking belum bisa disubmit, biar jelas dan bukan tombol mati tanpa alasan
  let alasanTidakBisaSubmit = null;
  if (!form.id_kendaraan) {
    alasanTidakBisaSubmit = "Pilih kendaraan terlebih dahulu di atas.";
  } else if (kendaraanTerpilih?.sedang_parkir) {
    alasanTidakBisaSubmit = `Kendaraan ${kendaraanTerpilih.plat_nomor} masih sedang parkir. Tunggu sampai keluar dulu untuk bisa booking lagi.`;
  } else if (!tarifOtomatis) {
    alasanTidakBisaSubmit = `Tarif untuk jenis kendaraan "${kendaraanTerpilih?.jenis_kendaraan}" belum diatur. Hubungi admin.`;
  } else if (!areaOtomatis) {
    alasanTidakBisaSubmit =
      areaAlasanTidakAda === "penuh"
        ? `Area parkir untuk kendaraan jenis "${kendaraanTerpilih?.jenis_kendaraan}" sedang penuh.`
        : `Belum ada area parkir untuk jenis kendaraan "${kendaraanTerpilih?.jenis_kendaraan}".`;
  }

  return (
    <div>
      <PageHeader
        eyebrow="BOOKING ONLINE"
        title="Booking Parkir"
        description="Pesan slot parkir sebelum tiba di pelabuhan. Kendaraan yang dipilih tetap perlu dicek petugas saat datang."
      />

      {kodeSukses && (
        <Card className="p-5 mb-6 border-[#C90000]/40">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">
            KODE BOOKING ANDA
          </p>
          <p className="font-display text-3xl text-[#C90000] tracking-widest">
            {kodeSukses}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            Simpan kode ini. Tunjukkan ke petugas saat tiba di area parkir,
            setelah booking dikonfirmasi.
          </p>
        </Card>
      )}

      <div className="max-w-xl space-y-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base text-[var(--color-text)]">Kendaraan</h2>
            <button
              type="button"
              onClick={() => setTambahKendaraan((v) => !v)}
              className="text-xs font-mono text-[#C90000] hover:underline"
            >
              {tambahKendaraan ? "Batal" : "+ Tambah Kendaraan"}
            </button>
          </div>

          {tambahKendaraan && (
            <form
              onSubmit={handleTambahKendaraan}
              className="space-y-2 mb-4 border border-[var(--color-border)] rounded-md p-3"
            >
              <Input
                placeholder="Plat nomor, mis. AD 1234 XY"
                className="font-mono uppercase"
                value={formKendaraan.plat_nomor}
                onChange={(e) =>
                  setFormKendaraan({
                    ...formKendaraan,
                    plat_nomor: e.target.value,
                  })
                }
                required
              />
              <select
                value={formKendaraan.jenis_kendaraan}
                onChange={(e) =>
                  setFormKendaraan({
                    ...formKendaraan,
                    jenis_kendaraan: e.target.value,
                  })
                }
                required
                className="w-full rounded-md bg-[var(--color-section)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#C90000]"
              >
                <option value="">Pilih jenis kendaraan</option>
                {tarifList.map((t) => (
                  <option key={t.id_tarif} value={t.jenis_kendaraan}>
                    {t.jenis_kendaraan.charAt(0).toUpperCase() +
                      t.jenis_kendaraan.slice(1)}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Warna (opsional)"
                value={formKendaraan.warna}
                onChange={(e) =>
                  setFormKendaraan({ ...formKendaraan, warna: e.target.value })
                }
              />
              <Button type="submit" disabled={savingKendaraan}>
                {savingKendaraan ? "Menyimpan..." : "Simpan Kendaraan"}
              </Button>
            </form>
          )}

          {kendaraanList.length === 0 && !tambahKendaraan && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Belum ada kendaraan terdaftar. Klik "+ Tambah Kendaraan" dulu.
            </p>
          )}

          <div className="space-y-1">
            {kendaraanList.map((k) => (
              <button
                key={k.id_kendaraan}
                type="button"
                disabled={k.sedang_parkir}
                onClick={() => handlePilihKendaraan(k)}
                className={`w-full flex items-center justify-between gap-2 text-left rounded-md px-3 py-2 text-sm font-mono border transition ${
                  k.sedang_parkir
                    ? "border-[var(--color-border)] bg-[var(--color-section)] text-[var(--color-text-secondary)] cursor-not-allowed"
                    : form.id_kendaraan === k.id_kendaraan
                      ? "border-[#C90000] bg-[#C90000]/10 text-[#C90000]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-section)]"
                }`}
              >
                <span className="truncate">
                  {k.plat_nomor} — {k.jenis_kendaraan}
                </span>
                {k.sedang_parkir && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C90000]/15 text-[#C90000] shrink-0">
                    SEDANG PARKIR
                  </span>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base text-[var(--color-text)] mb-3">
            Rencana Parkir
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Tarif & area sekarang otomatis, bukan pilihan manual lagi */}
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-section)] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                  TARIF (OTOMATIS)
                </span>
                <span className="text-sm text-[var(--color-text)]">
                  {tarifOtomatis
                    ? `${tarifOtomatis.jenis_kendaraan} — Rp ${Number(tarifOtomatis.tarif_per_jam).toLocaleString("id-ID")}/jam`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                  AREA (OTOMATIS)
                </span>
                <span className="text-sm text-[var(--color-text)]">
                  {areaOtomatis
                    ? `${areaOtomatis.nama_area} (${areaOtomatis.terisi}/${areaOtomatis.kapasitas})`
                    : "—"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
                TANGGAL RENCANA
              </label>
              <Input
                type="date"
                min={today}
                value={form.tanggal_rencana}
                onChange={(e) =>
                  setForm({ ...form, tanggal_rencana: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
                  JAM MASUK
                </label>
                <Input
                  type="time"
                  value={form.jam_rencana_masuk}
                  onChange={(e) =>
                    setForm({ ...form, jam_rencana_masuk: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
                  JAM KELUAR (OPSIONAL)
                </label>
                <Input
                  type="time"
                  value={form.jam_rencana_keluar}
                  onChange={(e) =>
                    setForm({ ...form, jam_rencana_keluar: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1.5">
                CATATAN (OPSIONAL)
              </label>
              <Input
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder="mis. Bawa barang besar"
              />
            </div>

            {alasanTidakBisaSubmit && (
              <p className="text-xs text-[var(--color-text-secondary)]">{alasanTidakBisaSubmit}</p>
            )}

            <Button
              type="submit"
              disabled={!!alasanTidakBisaSubmit || submitting}
            >
              {submitting ? "Memproses..." : "Buat Booking"}
            </Button>
          </form>
        </Card>
      </div>
      <footer className="border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[var(--color-text-secondary)] text-center sm:text-left">
          <span>
            © {new Date().getFullYear()} Parkir Pelabuhan Tanjung Perak
          </span>
          <span className="font-mono">SISTEM MANAJEMEN PARKIR</span>
        </div>
      </footer>
    </div>
  );
}
