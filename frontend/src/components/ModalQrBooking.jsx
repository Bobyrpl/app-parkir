import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X } from 'lucide-react';
import { Button } from './ui';

export default function ModalQrBooking({ booking, onClose }) {
    const [qrImage, setQrImage] = useState(null);

    useEffect(() => {
        let cancelled = false;
        QRCode.toDataURL(booking.kode_booking, { margin: 1, width: 280 }).then((url) => {
            if (!cancelled) setQrImage(url);
        });
        return () => {
            cancelled = true;
        };
    }, [booking.kode_booking]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-200">
                        <QrCode size={18} className="text-zinc-400" />
                        <p className="font-display font-bold text-base">QR Tiket Booking</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <p className="text-xs text-zinc-400 mb-4">
                    Tunjukkan QR ini kepada petugas saat tiba di gerbang masuk pelabuhan.
                </p>

                {qrImage ? (
                    <div className="bg-white p-3 rounded-2xl mx-auto w-fit shadow-lg">
                        <img
                            src={qrImage}
                            alt={`QR booking ${booking.kode_booking}`}
                            className="w-52 h-52 object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-52 h-52 mx-auto rounded-2xl bg-zinc-800 animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
                        Menyiapkan QR...
                    </div>
                )}

                <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                    <p className="font-mono text-base font-bold text-zinc-100 tracking-widest">
                        {booking.kode_booking}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 font-medium">
                        {booking.kendaraan?.plat_nomor || '-'} • {booking.area?.nama_area || '-'}
                    </p>
                </div>

                <Button
                    variant="secondary"
                    onClick={onClose}
                    className="mt-5 w-full"
                >
                    Tutup
                </Button>
            </div>
        </div>
    );
}
