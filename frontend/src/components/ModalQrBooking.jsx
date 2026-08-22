import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Modal QR kode booking, dipakai di halaman Riwayat Booking (pelanggan).
 * QR-nya cuma berisi teks kode_booking mentah (mis. "BKG-7F3K9A") - sama
 * persis dengan yang dicari petugas lewat GET /api/booking/cari/{kode_booking}
 * (lihat BookingController::cariByKode & ModalScanQr.jsx di sisi petugas).
 */
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xs rounded-xl bg-[#F1F4FA] border border-black/10 p-6 text-center"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <p className="font-display text-lg text-[#10131A] mb-1">QR Booking</p>
                <p className="text-xs text-[#64708A] mb-4">
                    Tunjukkan QR ini ke petugas saat tiba di lokasi
                </p>

                {qrImage ? (
                    <img
                        src={qrImage}
                        alt={`QR booking ${booking.kode_booking}`}
                        className="w-56 h-56 mx-auto rounded-lg bg-white p-2"
                    />
                ) : (
                    <p className="text-sm text-[#64708A] py-20">Menyiapkan QR...</p>
                )}

                <p className="mt-4 font-mono text-[#1B2A6B] text-sm tracking-wider">
                    {booking.kode_booking}
                </p>
                <p className="text-xs text-[#64708A] mt-1">
                    {booking.kendaraan?.plat_nomor} — {booking.area?.nama_area}
                </p>

                <button
                    onClick={onClose}
                    className="mt-5 w-full rounded-md bg-[#E3E8F0] text-[#10131A] py-2 text-sm hover:bg-[#D6DEEA] transition-colors"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}
