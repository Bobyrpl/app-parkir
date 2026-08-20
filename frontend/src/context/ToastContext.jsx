import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { playSuccessSound, playErrorSound } from '../utils/sound';

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
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="alert"
                        className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg flex items-start gap-3 text-sm animate-[toast-in_0.2s_ease-out] ${
                            t.tone === 'success'
                                ? 'bg-[#1B212B] border-[#35C48D]/30 text-[#EDEFF2]'
                                : 'bg-[#1B212B] border-[#E5484D]/30 text-[#EDEFF2]'
                        }`}
                    >
                        <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                t.tone === 'success' ? 'bg-[#35C48D]/15 text-[#35C48D]' : 'bg-[#E5484D]/15 text-[#E5484D]'
                            }`}
                            aria-hidden="true"
                        >
                            {t.tone === 'success' ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            )}
                        </span>
                        <p className="flex-1 leading-snug">{t.message}</p>
                        <button
                            onClick={() => remove(t.id)}
                            aria-label="Tutup notifikasi"
                            className="text-[#8B94A3] hover:text-[#EDEFF2]"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

// Dipakai di komponen: const { showSuccess, showError } = useToast();
export function useToast() {
    return useContext(ToastContext);
}