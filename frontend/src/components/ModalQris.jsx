import { useState } from 'react';
import api from '../api/axios';
import { QrCode, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { Button } from './ui';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 text-center shadow-xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
                    <div className="flex items-center gap-2 text-neutral-900">
                        <QrCode size={18} className="text-neutral-400" />
                        <p className="font-semibold text-base">Pembayaran QRIS</p>
                    </div>
                    <button
                        onClick={onBatal}
                        disabled={loading}
                        className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="bg-white p-3 rounded-2xl mx-auto w-fit border border-neutral-200 mb-3">
                    <img
                        src={QRIS_IMAGE_SRC}
                        alt="QRIS Pembayaran"
                        className="w-52 h-52 object-contain"
                    />
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                    Minta pengendara memindai kode QRIS di atas. Pastikan dana telah masuk sebelum mengonfirmasi.
                </p>

                {errorMsg && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 text-left">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <div className="flex flex-col gap-2 mt-5">
                    <Button
                        variant="primary"
                        onClick={handleSudahDibayar}
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
            </div>
        </div>
    );
}