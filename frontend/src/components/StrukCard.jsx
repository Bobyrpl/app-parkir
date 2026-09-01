import { Printer, X } from 'lucide-react';
import { Button } from './ui';

export default function StrukCard({ struk, onClose }) {
    if (!struk) return null;

    const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
    const formatWaktu = (t) => (t ? new Date(t).toLocaleString('id-ID') : '-');
    const adaDenda = Number(struk.denda) > 0;

    function handleCetak() {
        window.print();
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 print:bg-white print:p-0 animate-in fade-in duration-200">
            {/* Saat print: sembunyikan semua elemen lain di halaman, tampilkan hanya #struk-print-area */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #struk-print-area, #struk-print-area * { visibility: visible; }
                    #struk-print-area {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-150">
                <div id="struk-print-area" className="bg-white text-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200">
                    <div
                        className="h-2.5 w-full bg-zinc-950"
                    />
                    <div className="p-6 font-mono text-xs sm:text-sm">
                        <div className="text-center mb-4">
                            <p className="font-semibold text-base text-zinc-900 tracking-tight">
                                Sistem Parkir Pelabuhan
                            </p>
                            <p className="text-xs font-medium text-zinc-500">
                                Tanjung Perak Surabaya
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-1">
                                No. Struk: <span className="font-bold text-zinc-800">{struk.no_struk}</span>
                            </p>
                        </div>

                        <div className="border-t border-dashed border-zinc-300 my-3" />

                        <Row label="Plat Nomor" value={struk.plat_nomor} strong />
                        <Row label="Jenis Kendaraan" value={struk.jenis_kendaraan} />
                        <Row label="Area Parkir" value={struk.area} />
                        <Row label="Waktu Masuk" value={formatWaktu(struk.waktu_masuk)} />
                        <Row label="Waktu Keluar" value={formatWaktu(struk.waktu_keluar)} />
                        <Row label="Durasi Parkir" value={`${struk.durasi_jam} jam`} />
                        <Row label="Tarif / Jam" value={formatRupiah(struk.tarif_per_jam)} />

                        <div className="border-t border-dashed border-zinc-300 my-3" />

                        <Row label="Biaya Parkir" value={formatRupiah(struk.biaya_parkir ?? struk.biaya_total)} />
                        {adaDenda && (
                            <Row label="Denda Keterlambatan" value={formatRupiah(struk.denda)} strong />
                        )}

                        <div className="border-t border-dashed border-zinc-300 my-3" />

                        <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-semibold text-zinc-500">Total Bayar</span>
                            <span className="font-semibold text-xl sm:text-2xl text-zinc-950">{formatRupiah(struk.biaya_total)}</span>
                        </div>

                        <p className="text-center text-[10px] text-zinc-500 mt-5 pt-3 border-t border-zinc-200">
                            Petugas: <span className="font-medium text-zinc-700">{struk.petugas}</span> • Simpan struk ini sebagai bukti pembayaran sah.
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex gap-2.5 no-print">
                    <Button
                        variant="primary"
                        onClick={handleCetak}
                        icon={Printer}
                        className="flex-1 shadow-lg"
                    >
                        Cetak Struk
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        icon={X}
                        className="flex-1"
                    >
                        Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, strong }) {
    return (
        <div className="flex justify-between py-1">
            <span className="text-zinc-600">{label}</span>
            <span className={strong ? 'font-bold text-zinc-950' : 'text-zinc-800'}>{value}</span>
        </div>
    );
}