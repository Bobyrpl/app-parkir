import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { playSuccessSound, playErrorSound } from '../utils/sound';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        clearTimeout(timers.current[id]);
        delete timers.current[id];
    }, []);

    const push = useCallback((message, tone = 'success', duration = 4000) => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, tone }]);
        timers.current[id] = setTimeout(() => remove(id), duration);

        // Mainkan suara sesuai jenis notifikasi
        if (tone === 'success') {
            playSuccessSound();
        } else if (tone === 'error') {
            playErrorSound();
        }

        return id;
    }, [remove]);

    const showSuccess = useCallback((message, duration) => push(message, 'success', duration), [push]);
    const showError = useCallback((message, duration) => push(message, 'error', duration), [push]);

    return (
        <ToastContext.Provider value={{ showSuccess, showError }}>
            {children}

            {/* Stack notifikasi, pojok kanan atas */}
            <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="alert"
                        className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3 text-sm animate-in slide-in-from-top-3 fade-in duration-200 ${
                            t.tone === 'success'
                                ? 'bg-zinc-950/90 border-emerald-500/30 text-zinc-100 shadow-emerald-950/20'
                                : 'bg-zinc-950/90 border-rose-500/30 text-zinc-100 shadow-rose-950/20'
                        }`}
                    >
                        <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl ${
                                t.tone === 'success'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            }`}
                            aria-hidden="true"
                        >
                            {t.tone === 'success' ? (
                                <CheckCircle2 size={15} strokeWidth={2.5} />
                            ) : (
                                <AlertCircle size={15} strokeWidth={2.5} />
                            )}
                        </span>
                        <p className="flex-1 text-xs sm:text-sm leading-snug text-zinc-200 mt-0.5 font-medium">{t.message}</p>
                        <button
                            onClick={() => remove(t.id)}
                            aria-label="Tutup notifikasi"
                            className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5 rounded-lg"
                        >
                            <X size={15} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// Dipakai di komponen: const { showSuccess, showError } = useToast();
export function useToast() {
    return useContext(ToastContext);
}