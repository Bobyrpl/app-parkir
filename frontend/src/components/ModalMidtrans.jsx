import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import {
    QrCode,
    CheckCircle2,
    X,
    AlertCircle,
    Loader,
    Clock,
} from "lucide-react";
import { Button } from "./ui";

export default function ModalMidtrans({
    transaksiId,
    onLunas,
    onTimeout,
    onBatal,
}) {
    const [snapToken, setSnapToken] = useState(null);
    const [snapLoaded, setSnapLoaded] = useState(false);
    const [generating, setGenerating] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [timeLeft, setTimeLeft] = useState(120);
    const timerRef = useRef(null);

    const clientKey =
        window.MIDTRANS_CLIENT_KEY || import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    const snapUrl =
        window.MIDTRANS_SNAP_URL ||
        "https://app.sandbox.midtrans.com/snap/snap.js";

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    if (window.snap && typeof window.snap.hide === "function")
                        window.snap.hide();
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (!clientKey) {
            onTimeout();
            return;
        }
        const script = document.createElement("script");
        script.src = snapUrl;
        script.setAttribute("data-client-key", clientKey);
        script.onload = () => setSnapLoaded(true);
        script.onerror = () => onTimeout();
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (snapLoaded && !snapToken && generating) generateToken();
    }, [snapLoaded]);

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await api.get(`/transaksi/${transaksiId}/struk`);
                if (
                    res.data &&
                    (res.data.midtrans_status === "settlement" ||
                        res.data.midtrans_status === "capture")
                ) {
                    clearInterval(poll);
                    clearInterval(timerRef.current);
                    onLunas();
                }
            } catch {}
        }, 3000);
        return () => clearInterval(poll);
    }, [transaksiId]);

    async function generateToken() {
        try {
            const res = await api.post(
                `/transaksi/${transaksiId}/generate-midtrans-token`,
                {},
                { timeout: 20000 },
            );
            const token = res.data.token;
            setSnapToken(token);
            setGenerating(false);
            if (window.snap) setTimeout(() => pay(token), 400);
        } catch (err) {
            setErrorMsg(
                err.response?.data?.message || "Gagal menghubungi Midtrans",
            );
            setGenerating(false);
            setTimeout(() => onTimeout(), 2000);
        }
    }

    function pay(token) {
        if (!token || !window.snap) return;
        window.snap.pay(token, {
            onSuccess: async () => {
                clearInterval(timerRef.current);
                try {
                    await api.post(`/transaksi/${transaksiId}/keluar`, {
                        metode_bayar: "qris",
                    });
                    await api.post(`/transaksi/${transaksiId}/konfirmasi-qris`);
                    onLunas();
                } catch (err) {
                    setErrorMsg(
                        err.response?.data?.message ||
                            "Pembayaran berhasil, tetapi kendaraan gagal diproses keluar.",
                    );
                }
            },
            onPending: () => setErrorMsg("Pembayaran sedang diproses..."),
            onError: () => onTimeout(),
            onClose: () => setErrorMsg("From pembayaran ditutup. Menunggu respon..."),
        });
    }

    const mm = Math.floor(timeLeft / 60);
    const ss = String(timeLeft % 60).padStart(2, "0");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-6 text-center shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
                    <div className="flex items-center gap-2 text-neutral-900">
                        <QrCode size={18} className="text-blue-500" />
                        <p className="font-semibold text-base">
                            Midtrans Payment
                        </p>
                    </div>
                    <button
                        onClick={onBatal}
                        className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg hover:bg-neutral-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {generating && (
                    <div className="py-8 flex flex-col items-center gap-3">
                        <Loader
                            size={28}
                            className="animate-spin text-blue-500"
                        />
                        <p className="text-sm text-neutral-600">
                            Loading.....
                        </p>
                    </div>
                )}

                {!generating && snapToken && (
                    <div className="py-4">
                        <Button
                            variant="primary"
                            onClick={() => pay(snapToken)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                        >
                            <CheckCircle2 size={16} className="mr-1.5" />
                            Bayar sekarang
                        </Button>
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <Clock
                        size={14}
                        className={
                            timeLeft <= 30 ? "text-rose-600" : "text-blue-600"
                        }
                    />
                    <p
                        className={`font-mono font-bold text-lg ${timeLeft <= 30 ? "text-rose-600" : "text-blue-600"}`}
                    >
                        {mm}:{ss}
                    </p>
                </div>
                <p className="text-[10px] text-neutral-500 mt-2">
                    Jika waktu habis, otomatis beralih ke QRIS statis.
                </p>

                {errorMsg && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <p>{errorMsg}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
