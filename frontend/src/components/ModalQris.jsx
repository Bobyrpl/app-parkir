import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import api from '../api/axios'; // sesuaikan path relatif kalau lokasi axios.js berbeda

/**
 * Modal QRIS untuk halaman Kendaraan Keluar (petugas).
 *
 * Berbeda dari Midtrans (yang mengembalikan URL gambar QR siap pakai),
 * DANA Bisnis mengembalikan string QRIS mentah (qr_content). String ini
 * dirender jadi gambar QR di sisi frontend memakai library `qrcode`.
 *
 * PENTING: semua request pakai instance `api` (axios), bukan fetch() polos --
 * supaya token autentikasi (Authorization header) ikut terkirim otomatis
 * lewat interceptor axios. Tanpa ini, request dianggap belum login dan
 * middleware auth:sanctum di backend akan gagal ("Route [login] not defined").
 */
export default function ModalQris({ transaksiId, onLunas, onBatal, demoMode = false }) {
    const [qrImage, setQrImage] = useState(null);
    const [status, setStatus] = useState('memuat'); // memuat | menunggu | lunas | gagal
    const [errorMsg, setErrorMsg] = useState('');
    const pollRef = useRef(null);
    const lunasCalledRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        api.post(`/transaksi/${transaksiId}/bayar-qris`)
            .then(async (res) => {
                if (cancelled) return;
                const dataUrl = await QRCode.toDataURL(res.data.qr_content, { margin: 1, width: 320 });
                if (cancelled) return;
                setQrImage(dataUrl);
                setStatus('menunggu');
            })
            .catch((err) => {
                if (cancelled) return;
                setErrorMsg(err.response?.data?.message || 'Gagal membuat QR pembayaran.');
                setStatus('gagal');
            });

        return () => {
            cancelled = true;
        };
    }, [transaksiId]);

    useEffect(() => {
        if (status !== 'menunggu') return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/transaksi/${transaksiId}/status-bayar`);
                if (res.data.status_pembayaran === 'lunas' && !lunasCalledRef.current) {
                    lunasCalledRef.current = true;
                    clearInterval(pollRef.current);
                    setStatus('lunas');
                    onLunas();
                }
            } catch {
                // koneksi sempat gagal -- diamkan, coba lagi di interval berikutnya
            }
        }, 3000);

        return () => clearInterval(pollRef.current);
    }, [status, transaksiId, onLunas]);

    async function handleTandaiLunasManual() {
        try {
            await api.post(`/transaksi/${transaksiId}/tandai-lunas-manual`);
        } catch {
            setErrorMsg('Gagal menandai lunas secara manual.');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-80 rounded-xl bg-[#080A0D] border border-[#444444] p-6 text-center">
                <p className="font-display text-lg mb-4">Pembayaran QRIS (DANA)</p>

                {status === 'memuat' && <p className="text-sm text-white/70">Menyiapkan QR code...</p>}

                {status === 'menunggu' && (
                    <>
                        <img src={qrImage} alt="QRIS Pembayaran" className="w-56 h-56 mx-auto rounded-lg bg-white p-2" />
                        <p className="text-sm text-white/70 mt-3 animate-pulse">Menunggu pembayaran...</p>
                        <div className="flex flex-col gap-2 mt-4">
                            <button onClick={onBatal} className="text-xs text-[#C90000] hover:underline">
                                Batalkan
                            </button>
                            {demoMode && (
                                <button
                                    onClick={handleTandaiLunasManual}
                                    className="text-xs text-[#C90000] border border-[#C90000]/40 rounded-md py-1.5 hover:bg-[#C90000]/10 transition-colors"
                                >
                                    Tandai Lunas (Demo)
                                </button>
                            )}
                        </div>
                    </>
                )}

                {status === 'lunas' && (
                    <p className="text-sm text-[#5DCAA5]">Pembayaran diterima. Mencetak struk...</p>
                )}

                {status === 'gagal' && (
                    <>
                        <p className="text-sm text-[#C90000]">{errorMsg}</p>
                        <button onClick={onBatal} className="text-xs text-white/70 mt-3 hover:underline">
                            Tutup
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}