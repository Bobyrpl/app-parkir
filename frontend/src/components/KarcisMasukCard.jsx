import { useEffect, useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from './ui';
import QRCode from 'qrcode';

function QrImage({ value, size = 120 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            QRCode.toCanvas(canvasRef.current, String(value), {
                width: size,
                margin: 2,
                color: { dark: '#171717', light: '#ffffff' },
            });
        }
    }, [value, size]);

    return <canvas ref={canvasRef} />;
}

export default function KarcisMasukCard({ karcis, onClose }) {
    if (!karcis) return null;

    const formatWaktu = (t) => (t ? new Date(t).toLocaleString('id-ID') : '-');
    const formatTanggal = (t) => (t ? new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-');
    const formatJam = (t) => (t ? new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-');

    function handleCetak() {
        window.print();
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50 print:bg-white print:p-0 animate-in fade-in duration-200">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #karcis-print-area, #karcis-print-area * { visibility: visible; }
                    #karcis-print-area {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; }
                }
            `}</style>

            <div className="relative w-full max-w-xs sm:max-w-sm animate-in zoom-in-95 duration-150">
                <div id="karcis-print-area" className="bg-white text-neutral-900 rounded-3xl overflow-hidden shadow-xl border border-neutral-200">
                    <div className="h-2 w-full bg-neutral-900" />
                    <div className="p-4 sm:p-5 font-mono text-[11px] sm:text-xs leading-tight">
                        
                        <div className="text-center mb-3">
                            <p className="font-bold text-sm tracking-wider">KARCIS PARKIR</p>
                            <p className="text-[9px] font-semibold text-neutral-600 uppercase">Tanjung Perak Surabaya</p>
                        </div>

                        <div className="border-t border-dashed border-neutral-300 my-2" />

                        <div className="flex justify-center my-3">
                            <div className="bg-white p-1.5 rounded-lg border border-neutral-200">
                                <QrImage value={karcis.id_parkir} size={120} />
                            </div>
                        </div>

                        <p className="text-center text-[10px] text-neutral-500 mb-2">
                            <span className="font-bold text-neutral-800">#{karcis.id_parkir}</span>
                        </p>

                        <div className="border-t border-dashed border-neutral-300 my-2" />

                        <div className="space-y-1">
                            <Row label="Plat" value={karcis.plat_nomor} strong />
                            <Row label="Jenis" value={karcis.jenis_kendaraan} />
                            <Row label="Area" value={karcis.nama_area} />
                            <Row label="Tarif" value={karcis.tarif_per_jam ? `Rp ${Number(karcis.tarif_per_jam).toLocaleString('id-ID')}` : '-'} />
                            <Row label="Tgl Masuk" value={formatTanggal(karcis.waktu_masuk)} />
                            <Row label="Jam Masuk" value={formatJam(karcis.waktu_masuk)} />
                        </div>

                        <div className="border-t border-dashed border-neutral-300 my-2" />

                        <p className="text-center text-[9px] text-neutral-500 leading-tight">
                            Tunjukkan karcis saat keluar
                        </p>

                        <p className="text-center text-[8px] text-neutral-400 mt-2 pt-2 border-t border-neutral-200">
                            Petugas: <span className="font-semibold">{karcis.petugas}</span>
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex gap-2.5 no-print">
                    <Button variant="primary" onClick={handleCetak} icon={Printer} className="flex-1 text-sm">
                        Cetak Karcis
                    </Button>
                    <Button variant="secondary" onClick={onClose} icon={X} className="flex-1 text-sm">
                        Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, strong }) {
    return (
        <div className="flex justify-between gap-2 py-0.5">
            <span className="text-neutral-500 flex-shrink-0">{label}:</span>
            <span className={`text-right ${strong ? 'font-bold text-neutral-900' : 'text-neutral-700'}`}>{value}</span>
        </div>
    );
}
