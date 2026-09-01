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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 text-center shadow-xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
                    <div className="flex items-center gap-2 text-neutral-900">
                        <QrCode size={18} className="text-neutral-400" />
                        <p className="font-semibold text-base">QR Tiket Booking</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <p className="text-xs text-neutral-500 mb-4">
                    Tunjukkan QR ini kepada petugas saat tiba di gerbang masuk pelabuhan.
                </p>

                {qrImage ? (
                    <div className="bg-white p-3 rounded-2xl mx-auto w-fit border border-neutral-200">
                        <img
                            src={qrImage}
                            alt={`QR booking ${booking.kode_booking}`}
                            className="w-52 h-52 object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-52 h-52 mx-auto rounded-2xl bg-neutral-100 animate-pulse flex items-center justify-center text-neutral-400 text-xs">
                        Menyiapkan QR...
                    </div>
                )}

                <div className="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                    <p className="text-base font-bold text-neutral-900 tracking-widest">
                        {booking.kode_booking}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 font-medium">
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