import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, X, AlertCircle } from 'lucide-react';
import { Button } from './ui';

const REGION_ID = 'qr-scanner-region';

export default function ModalScanQr({ onDetected, onClose }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const scanner = new Html5Qrcode(REGION_ID);
        scannerRef.current = scanner;
        let selesai = false;
        let sudahDihentikan = false;

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
                () => {}
            )
            .catch(() => {
                setError(
                    'Tidak bisa mengakses kamera. Pastikan izin kamera telah diberikan di browser, atau masukkan kode booking secara manual.'
                );
            });

        return () => {
            selesai = true;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-100">
                        <ScanLine size={18} className="text-zinc-400" />
                        <h3 className="font-display font-bold text-base">Pindai QR Booking</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {error ? (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                        <p className="leading-relaxed">{error}</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-inner">
                        <div id={REGION_ID} className="w-full aspect-square" />
                    </div>
                )}

                {!error && (
                    <p className="text-xs text-zinc-400 text-center mt-3 font-mono">
                        Arahkan kamera ke tiket QR milik pelanggan.
                    </p>
                )}

                <Button
                    variant="secondary"
                    onClick={onClose}
                    className="mt-4 w-full"
                >
                    Tutup Pemindai
                </Button>
            </div>
        </div>
    );
}