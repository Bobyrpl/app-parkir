export default function StrukCard({ struk, onClose }) {
    if (!struk) return null;

    const formatRupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
    const formatWaktu = (t) => (t ? new Date(t).toLocaleString('id-ID') : '-');
    const adaDenda = Number(struk.denda) > 0;

    function handleCetak() {
        window.print();
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50 print:bg-white print:p-0">
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

            <div className="relative w-full max-w-sm">
                {/* notch kiri-kanan meniru sobekan tiket */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#14181F] no-print" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#14181F] no-print" />

                <div id="struk-print-area" className="bg-[#F7F7F5] text-[#14181F] rounded-lg overflow-hidden">
                    <div
                        className="h-2 w-full"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(45deg, #F4B400 0 10px, #14181F 10px 20px)',
                        }}
                    />
                    <div className="p-6 font-mono text-sm">
                        <p className="text-center font-display text-lg tracking-tight mb-1">
                            PARKIR PELABUHAN TANJUNG PERAK
                        </p>
                        <p className="text-center text-xs text-[#6B7280] mb-4">
                            STRUK PARKIR — {struk.no_struk}
                        </p>

                        <div className="border-t border-dashed border-[#C3C9D3] my-3" />

                        <Row label="Plat Nomor" value={struk.plat_nomor} strong />
                        <Row label="Jenis" value={struk.jenis_kendaraan} />
                        <Row label="Area" value={struk.area} />
                        <Row label="Masuk" value={formatWaktu(struk.waktu_masuk)} />
                        <Row label="Keluar" value={formatWaktu(struk.waktu_keluar)} />
                        <Row label="Durasi" value={`${struk.durasi_jam} jam`} />
                        <Row label="Tarif/Jam" value={formatRupiah(struk.tarif_per_jam)} />

                        <div className="border-t border-dashed border-[#C3C9D3] my-3" />

                        <Row label="Biaya Parkir" value={formatRupiah(struk.biaya_parkir ?? struk.biaya_total)} />
                        {adaDenda && (
                            <Row label="Denda Keterlambatan" value={formatRupiah(struk.denda)} strong />
                        )}

                        <div className="border-t border-dashed border-[#C3C9D3] my-3" />

                        <div className="flex justify-between items-baseline">
                            <span className="text-xs text-[#6B7280]">TOTAL BAYAR</span>
                            <span className="font-display text-2xl">{formatRupiah(struk.biaya_total)}</span>
                        </div>

                        <p className="text-center text-[10px] text-[#9AA1AC] mt-4">
                            Dilayani oleh {struk.petugas} · Terima kasih
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex gap-2 no-print">
                    <button
                        onClick={handleCetak}
                        className="flex-1 rounded-md bg-[#F4B400] text-[#14181F] py-2.5 text-sm font-semibold hover:bg-[#F4B400]/90 transition-colors"
                    >
                        Cetak Struk
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md bg-[#1B212B] text-[#EDEFF2] py-2.5 text-sm hover:bg-[#262E3A] transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, strong }) {
    return (
        <div className="flex justify-between py-0.5">
            <span className="text-[#6B7280]">{label}</span>
            <span className={strong ? 'font-semibold' : ''}>{value}</span>
        </div>
    );
}