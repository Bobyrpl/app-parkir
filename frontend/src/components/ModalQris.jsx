import { useState } from 'react';
import api from '../api/axios'; // sesuaikan path relatif kalau lokasi axios.js berbeda

/**
 * Modal QRIS untuk halaman Kendaraan Keluar (petugas).
 *
 * QRIS di sini adalah GAMBAR STATIS (mis. hasil download dari
 * DANA/OVO/Gopay/QRIS bank), BUKAN QR dinamis hasil generate dari payment
 * gateway. Taruh file gambarnya di folder `public/` frontend, lalu ganti
 * nilai QRIS_IMAGE_SRC di bawah sesuai nama filenya, contoh:
 *   public/qris-statis.jpg  ->  QRIS_IMAGE_SRC = '/qris-statis.jpg'
 *
 * Karena gambarnya statis, sistem tidak bisa tahu otomatis kapan
 * pembayaran masuk -- petugas WAJIB mengecek sendiri (mis. notifikasi
 * di HP/aplikasi penerima) lalu menekan tombol "Sudah Dibayar" untuk
 * menandai transaksi lunas.
 */
const QRIS_IMAGE_SRC = '/qris-statis.jpeg';

export default function ModalQris({ transaksiId, onLunas, onBatal }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    async function handleSudahDibayar() {
        setLoading(true);
        setErrorMsg('');
        try {
            await api.post(`/transaksi/${transaksiId}/konfirmasi-qris`);
            onLunas();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Gagal menandai pembayaran lunas.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-80 rounded-xl bg-[#080A0D] border border-[#444444] p-6 text-center">
                <p className="font-display text-lg mb-4">Pembayaran QRIS</p>

                <img
                    src={QRIS_IMAGE_SRC}
                    alt="QRIS Pembayaran"
                    className="w-56 h-56 mx-auto rounded-lg bg-white p-2 object-contain"
                />
                <p className="text-sm text-white/70 mt-3">
                    Minta pelanggan memindai QRIS di atas, lalu tekan tombol di bawah
                    setelah pembayaran dipastikan masuk.
                </p>

                {errorMsg && <p className="text-xs text-[#C90000] mt-2">{errorMsg}</p>}

                <div className="flex flex-col gap-2 mt-4">
                    <button
                        onClick={handleSudahDibayar}
                        disabled={loading}
                        className="text-sm rounded-md bg-[#5DCAA5] text-black font-medium py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : 'Sudah Dibayar'}
                    </button>
                    <button onClick={onBatal} disabled={loading} className="text-xs text-[#C90000] hover:underline">
                        Batalkan
                    </button>
                </div>
            </div>
        </div>
    );
}