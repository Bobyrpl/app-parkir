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
  StatCard,
} from "../../components/ui";
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Inbox,
  X,
} from "lucide-react";

const KOSONG = {
  nama_lengkap: "",
  username: "",
  no_telp: "",
  password: "",
  role: "petugas",
  status_aktif: true,
};

const ROLE_LABEL = { admin: "Admin", petugas: "Petugas", owner: "Owner" };
const ROLE_BADGE_TONE = { admin: "warning", petugas: "info", owner: "success" };

function warnaAvatar() {
  // Avatar dibuat satu gaya netral saja, konsisten dengan palet monokrom
  // landing page — tidak lagi dirotasi per warna.
  return { bg: "bg-neutral-100", text: "text-neutral-700" };
}

export default function Users() {
  const [data, setData] = useState([]);
  const [ringkasan, setRingkasan] = useState({
    admin: 0,
    petugas: 0,
    pelanggan: 0,
    total: 0,
    aktif: 0,
    nonaktif: 0,
  });
  const [ringkasanLoading, setRingkasanLoading] = useState(true);
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [hapusId, setHapusId] = useState(null);
  const [menghapus, setMenghapus] = useState(false);
  const [cariKata, setCariKata] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showSuccess, showError } = useToast();

  // pagination (index users dipaginasi di backend, mengikuti pola /kendaraan)
  const [halaman, setHalaman] = useState(1);
  const [halamanTerakhir, setHalamanTerakhir] = useState(1);
  const [total, setTotal] = useState(0);

  const sedangMencari = cariKata.trim().length > 0;

  async function load(page = 1) {
    setLoading(true);
    try {
      const res = await api.get("/users", { params: { page } });
      const payload = res.data;
      const list = payload.data ?? payload;
      setData(list);
      setHalaman(payload.current_page ?? 1);
      setHalamanTerakhir(payload.last_page ?? 1);
      setTotal(payload.total ?? list.length);
    } catch (err) {
      showError("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRingkasan() {
    setRingkasanLoading(true);
    try {
      // Endpoint /users dipaginasi 10/halaman di backend, jadi supaya
      // rekapnya akurat (bukan cuma halaman yang lagi ditampilkan),
      // kita tarik semua halaman lalu hitung per role di sini.
      const halamanPertama = await api.get("/users", { params: { page: 1 } });
      const payloadPertama = halamanPertama.data;
      let semuaUser = payloadPertama.data ?? [];
      const totalHalaman = payloadPertama.last_page ?? 1;

      if (totalHalaman > 1) {
        const sisaHalaman = [];
        for (let h = 2; h <= totalHalaman; h++) {
          sisaHalaman.push(api.get("/users", { params: { page: h } }));
        }
        const hasilSisa = await Promise.all(sisaHalaman);
        hasilSisa.forEach((res) => {
          semuaUser = semuaUser.concat(res.data.data ?? []);
        });
      }

      const hitung = { admin: 0, petugas: 0, pelanggan: 0 };
      let aktif = 0;
      let nonaktif = 0;
      semuaUser.forEach((u) => {
        if (hitung[u.role] !== undefined) hitung[u.role] += 1;
        if (u.status_aktif) {
          aktif += 1;
        } else {
          nonaktif += 1;
        }
      });

      setRingkasan({
        admin: hitung.admin,
        petugas: hitung.petugas,
        pelanggan: hitung.pelanggan,
        total: semuaUser.length,
        aktif,
        nonaktif,
      });
    } catch (err) {
      setRingkasan({
        admin: 0,
        petugas: 0,
        pelanggan: 0,
        total: 0,
        aktif: 0,
        nonaktif: 0,
      });
    } finally {
      setRingkasanLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    loadRingkasan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form };
      if (editId && !payload.password) delete payload.password;

      if (editId) {
        await api.put(`/users/${editId}`, payload);
        showSuccess("Pengguna berhasil diperbarui.");
      } else {
        await api.post("/users", payload);
        showSuccess("Pengguna berhasil ditambahkan.");
      }
      setForm(KOSONG);
      setEditId(null);
      setShowForm(false);
      load(editId ? halaman : 1);
      loadRingkasan();
    } catch (err) {
      const pesan = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(", ")
        : "Gagal menyimpan pengguna";
      setError(pesan);
      showError(pesan);
    }
  }

  function handleEdit(item) {
    setEditId(item.id_user);
    setForm({
      nama_lengkap: item.nama_lengkap,
      username: item.username,
      no_telp: item.no_telp ?? "",
      password: "",
      role: item.role,
      status_aktif: !!item.status_aktif,
    });
    setShowForm(true);
  }

  function handleTambahBaru() {
    setEditId(null);
    setForm(KOSONG);
    setError("");
    setShowForm(true);
  }

  function handleTutupForm() {
    setShowForm(false);
    setEditId(null);
    setForm(KOSONG);
    setError("");
  }

  function mintaHapus(item) {
    setHapusId(item.id_user);
  }

  async function konfirmasiHapus() {
    if (!hapusId) return;
    setMenghapus(true);
    try {
      await api.delete(`/users/${hapusId}`);
      showSuccess("Pengguna berhasil dihapus.");
      load(halaman);
      loadRingkasan();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal menghapus pengguna.");
    } finally {
      setMenghapus(false);
      setHapusId(null);
    }
  }

  const dataTersaring = data.filter((item) => {
    const kata = cariKata.trim().toLowerCase();
    if (!kata) return true;
    return (
      item.nama_lengkap?.toLowerCase().includes(kata) ||
      item.username?.toLowerCase().includes(kata) ||
      item.no_telp?.toLowerCase().includes(kata) ||
      item.role?.toLowerCase().includes(kata)
    );
  });

  function inisial(nama) {
    if (!nama) return "?";
    const kata = nama.trim().split(/\s+/);
    const huruf = kata.length > 1 ? kata[0][0] + kata[1][0] : kata[0][0];
    return huruf.toUpperCase();
  }

  return (
    <div>
      <PageHeader
        eyebrow="DATA MASTER"
        title="Pengguna"
        description="Kelola akun admin, petugas, dan owner."
      />

      {/* Ringkasan */}
      <div className="mb-8">
        <h2 className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">
          Ringkasan Pengguna
        </h2>
        {ringkasanLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard label="ADMIN" value={ringkasan.admin} />
            <StatCard label="PETUGAS" value={ringkasan.petugas} />
            <StatCard label="PELANGGAN" value={ringkasan.pelanggan} />
            <StatCard label="TOTAL USER" value={ringkasan.total} />
            <StatCard label="AKTIF" value={ringkasan.aktif} />
            <StatCard label="TIDAK AKTIF" value={ringkasan.nonaktif} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base text-neutral-900">
          Daftar Pengguna
        </h2>
        {!showForm && (
          <Button
            onClick={handleTambahBaru}
            className="inline-flex items-center gap-1.5"
          >
            <UserPlus size={15} />
            Tambah Pengguna
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
                {editId ? <Pencil size={15} /> : <UserPlus size={15} />}
              </span>
              <h2 className="font-semibold text-base text-neutral-900">
                {editId ? "Edit Pengguna" : "Tambah Pengguna"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleTutupForm}
              className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0"
              aria-label="Tutup form"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                Nama Lengkap
              </label>
              <Input
                value={form.nama_lengkap}
                onChange={(e) =>
                  setForm({ ...form, nama_lengkap: e.target.value })
                }
                placeholder="cth. Budi Santoso"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                Username
              </label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="cth. budi.santoso"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                No. Telepon
              </label>
              <Input
                value={form.no_telp}
                onChange={(e) => setForm({ ...form, no_telp: e.target.value })}
                placeholder="cth. 0812xxxxxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                Password
                {editId && (
                  <span className="normal-case text-neutral-400">
                    {" "}
                    · kosongkan jika tidak diubah
                  </span>
                )}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editId ? "••••••••" : "Minimal 8 karakter"}
                required={!editId}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl bg-white border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              >
                <option value="petugas">Petugas</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-neutral-500 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.status_aktif}
                onChange={(e) =>
                  setForm({ ...form, status_aktif: e.target.checked })
                }
                className="accent-neutral-900"
              />
              Akun aktif
            </label>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" className="flex-1 sm:flex-none">
                {editId ? "Simpan Perubahan" : "Tambah Pengguna"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 sm:flex-none"
                onClick={handleTutupForm}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
        )}

        <div
          className={`${
            showForm ? "md:col-span-2" : ""
          } -mx-4 sm:mx-0 overflow-x-auto`}
        >
          <div className="px-4 sm:px-0 mb-3 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
            <div className="flex-1 relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <Input
                className="pl-9"
                placeholder="Cari nama, username, no. telepon, atau role..."
                value={cariKata}
                onChange={(e) => setCariKata(e.target.value)}
              />
            </div>
            <span className="text-xs text-neutral-500 whitespace-nowrap shrink-0">
              {loading
                ? "Memuat..."
                : sedangMencari
                  ? `${dataTersaring.length} hasil di halaman ini`
                  : `${data.length} dari ${total} pengguna`}
            </span>
          </div>

          <div className="min-w-[720px] sm:min-w-0 px-4 sm:px-0">
            <Table
              columns={[
                "Pengguna",
                "Username",
                "No. Telepon",
                "Role",
                "Status",
                "Aksi",
              ]}
            >
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 sm:px-4 py-3" colSpan={6}>
                      <div className="h-9 rounded-xl bg-neutral-100 animate-pulse" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                dataTersaring.map((item) => {
                  const avatar = warnaAvatar();
                  return (
                    <tr
                      key={item.id_user}
                      className="transition-colors hover:bg-neutral-50"
                    >
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-8 h-8 rounded-full ${avatar.bg} ${avatar.text} text-xs font-semibold flex items-center justify-center shrink-0`}
                          >
                            {inisial(item.nama_lengkap)}
                          </span>
                          <span className="text-neutral-900">
                            {item.nama_lengkap}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-neutral-500 whitespace-nowrap">
                        {item.username}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-neutral-500 whitespace-nowrap">
                        {item.no_telp ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={12} className="text-neutral-400" />
                            {item.no_telp}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                        <Badge tone={ROLE_BADGE_TONE[item.role] ?? "info"}>
                          {ROLE_LABEL[item.role] ?? item.role}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                        {item.status_aktif ? (
                          <Badge tone="success">Aktif</Badge>
                        ) : (
                          <Badge tone="danger">Nonaktif</Badge>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
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
                            onClick={() => mintaHapus(item)}
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

              {!loading && dataTersaring.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2.5 text-neutral-500">
                      <span className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Inbox size={18} />
                      </span>
                      <p className="text-sm">
                        {cariKata
                          ? "Tidak ada pengguna yang cocok dengan pencarian."
                          : "Belum ada pengguna."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </Table>
          </div>

          {!loading && !sedangMencari && halamanTerakhir > 1 && (
            <div className="px-4 sm:px-0 mt-4 flex items-center justify-between text-xs text-neutral-500">
              <span>Total {total} pengguna</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  disabled={halaman <= 1}
                  onClick={() => load(halaman - 1)}
                  className="inline-flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  Sebelumnya
                </Button>
                <span className="px-2 text-neutral-500">
                  Hal {halaman} / {halamanTerakhir}
                </span>
                <Button
                  variant="ghost"
                  disabled={halaman >= halamanTerakhir}
                  onClick={() => load(halaman + 1)}
                  className="inline-flex items-center gap-1"
                >
                  Berikutnya
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!hapusId}
        title="Hapus Pengguna"
        message="Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        loading={menghapus}
        onConfirm={konfirmasiHapus}
        onCancel={() => setHapusId(null)}
      />

      <footer className="border-t border-neutral-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-neutral-400 text-center sm:text-left">
          <span>
            © {new Date().getFullYear()} Parkir Pelabuhan Tanjung Perak
          </span>
          <span className="uppercase tracking-wide">Sistem Manajemen Parkir</span>
        </div>
      </footer>
    </div>
  );
}