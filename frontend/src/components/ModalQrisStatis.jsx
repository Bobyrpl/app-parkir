import { useState } from 'react';
import api from '../api/axios';
import { QrCode, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { Button } from './ui';

export default function ModalQrisStatis({ transaksiId, onLunas, onBatal }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    async function handleLunas() {
        setLoading(true);
        setErrorMsg('');
        try {
            await api.post(`/transaksi/${transaksiId}/keluar`, { metode_bayar: 'qris' });

            await api.post(`/transaksi/${transaksiId}/konfirmasi-qris`);
            onLunas();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Gagal memproses pembayaran.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 text-center shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
                    <div className="flex items-center gap-2 text-neutral-900">
                        <QrCode size={18} className="text-emerald-500" />
                        <p className="font-semibold text-base">QRIS Statis</p>
                    </div>
                    <button onClick={onBatal} disabled={loading} className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg hover:bg-neutral-100">
                        <X size={16} />
                    </button>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 mb-4">
                    <p className="text-xs text-amber-700 font-semibold">Pembayaran Manual</p>
                    <p className="text-xs text-amber-600 mt-0.5">Minta pengendara scan QRIS di bawah, lalu konfirmasi setelah dana masuk.</p>
                </div>

                <div className="bg-white p-3 rounded-2xl mx-auto w-fit border border-neutral-200 mb-4">
                    <img
                        src="/qris-statis.jpeg"
                        alt="QRIS Statis"
                        className="w-52 h-52 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; setErrorMsg('Gambar QRIS tidak dapat dimuat.'); }}
                    />
                </div>

                {errorMsg && (
                    <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <Button
                        variant="primary"
                        onClick={handleLunas}
                        loading={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                        <CheckCircle2 size={16} className="mr-1.5" />
                        Sudah Dibayar (Lunas)
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBatal}
                        disabled={loading}
                        className="text-neutral-500 hover:text-rose-600 text-xs"
                    >
                        Batalkan Transaksi
                    </Button>
                </div>

                <p className="text-[10px] text-neutral-400 mt-4">
                    Pastikan dana sudah masuk sebelum klik Sudah Dibayar.
                </p>
            </div>
        </div>
    );
}
