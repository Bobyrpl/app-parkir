import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Modal scan QR kode booking pakai kamera perangkat petugas.
 * Dipakai di halaman Kendaraan Masuk sebagai alternatif ketik manual -
 * begitu QR pelanggan (dari ModalQrBooking.jsx) berhasil dibaca, teksnya
 * (kode_booking mentah, mis. "BKG-7F3K9A") dikirim lewat onDetected.
 *
 * CATATAN: butuh akses kamera (HTTPS atau localhost). Kalau gagal /
 * ditolak, tampilkan pesan dan biarkan petugas tetap bisa ketik manual
 * di form yang sudah ada.
 */
const REGION_ID = 'qr-scanner-region';

export default function ModalScanQr({ onDetected, onClose }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const scanner = new Html5Qrcode(REGION_ID);
        scannerRef.current = scanner;
        let selesai = false;
        let sudahDihentikan = false; // penanda: scanner sudah di-stop lewat handler onDetected

        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: 220 },
                (decodedText) => {
                    if (selesai) return;
                    selesai = true;
                    scanner
                        .stop()
                        .catch(() => {})
                        .finally(() => {
                            sudahDihentikan = true;
                            onDetected(decodedText.trim());
                        });
                },
                () => {
                    // dipanggil terus tiap frame yang belum ketemu QR-nya -
                    // ini normal, bukan error, jadi sengaja diabaikan.
                }
            )
            .catch(() => {
                setError(
                    'Tidak bisa mengakses kamera. Pastikan izin kamera diizinkan (dan situs diakses lewat HTTPS), atau masukkan kode booking secara manual.'
                );
            });

        return () => {
            selesai = true;
            // Kalau sudah di-stop lewat handler onDetected di atas, jangan stop lagi -
            // stop()/clear() dobel inilah yang sering bikin exception tidak tertangkap
            // dan bikin seluruh app crash jadi layar putih.
            if (sudahDihentikan) return;
            scanner
                .stop()
                .catch(() => {})
                .then(() => scanner.clear())
                .catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-sm rounded-xl bg-[#080A0D] border border-[#444444] p-6">
                <h3 className="font-display text-base text-white mb-3">Scan QR Booking</h3>

                {error ? (
                    <p className="text-sm text-[#C90000] mb-2">{error}</p>
                ) : (
                    <div id={REGION_ID} className="rounded-lg overflow-hidden bg-black" />
                )}

                {!error && (
                    <p className="text-xs text-white/70 mt-3">
                        Arahkan kamera ke QR kode booking milik pelanggan.
                    </p>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 w-full rounded-md bg-[#444444] text-white py-2 text-sm hover:bg-[#444444] transition-colors"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}