export function PageHeader({ eyebrow, title, description }) {
    return (
        <div className="mb-8">
            {eyebrow && (
                <p className="text-xs font-mono text-[#C90000] mb-1 tracking-wider">
                    {eyebrow}
                </p>
            )}
            <h1 className="font-display text-2xl text-white">{title}</h1>
            {description && (
                <p className="text-sm text-white/70 mt-1">{description}</p>
            )}
        </div>
    );
}

export function StatCard({ label, value, accent = '#C90000', icon: Icon, trend }) {
    const TrendIcon = trend?.icon;
    const trendColor = trend?.tone === 'up' ? '#35C48D' : trend?.tone === 'down' ? '#C90000' : '#B5B5B5';

    return (
        <div className="rounded-xl bg-[#080A0D] border border-[#444444] p-5">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono text-white/70">{label}</p>
                {Icon && (
                    <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${accent}1A`, color: accent }}
                    >
                        <Icon size={16} strokeWidth={2} />
                    </span>
                )}
            </div>
            <p
                className="font-display text-3xl"
                style={{ color: accent }}
            >
                {value}
            </p>
            {trend && (
                <div
                    className="mt-2 inline-flex items-center gap-1 text-xs font-mono"
                    style={{ color: trendColor }}
                >
                    {TrendIcon && <TrendIcon size={12} strokeWidth={2.5} />}
                    <span>{trend.label}</span>
                </div>
            )}
        </div>
    );
}

export function Card({ children, className = '' }) {
    return (
        <div className={`rounded-xl bg-[#080A0D] border border-[#444444] ${className}`}>
            {children}
        </div>
    );
}

export function Badge({ children, tone = 'neutral' }) {
    const tones = {
        neutral: 'bg-[#444444] text-white/80',
        success: 'bg-[#35C48D]/15 text-[#35C48D]',
        danger: 'bg-[#C90000]/15 text-[#C90000]',
        warning: 'bg-[#5A0000]/25 text-white',
    };
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-mono ${tones[tone]}`}>
            {children}
        </span>
    );
}

export function Table({ columns, children }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-[#444444]">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[#444444] text-left">
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="px-4 py-3 text-xs font-mono text-white/70 tracking-wider"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#444444]">{children}</tbody>
            </table>
        </div>
    );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'bg-[#C90000] text-white hover:bg-[#5A0000]',
        ghost: 'bg-transparent text-white/80 hover:bg-[#444444] border border-[#444444]',
        danger: 'bg-[#C90000]/15 text-[#C90000] hover:bg-[#C90000]/25',
    };
    return (
        <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

// Dialog konfirmasi custom, pengganti window.confirm() bawaan browser.
// Pakai: <ConfirmDialog open={!!targetId} title="..." message="..." loading={...} onConfirm={...} onCancel={...} />
export function ConfirmDialog({
    open,
    title = 'Konfirmasi',
    message,
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
    tone = 'danger',
    loading = false,
    onConfirm,
    onCancel,
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm rounded-xl bg-[#080A0D] border border-[#444444] p-6"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
            >
                <h3 className="font-display text-base text-white mb-2">{title}</h3>
                {message && <p className="text-sm text-white/70 mb-6">{message}</p>}
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={tone} onClick={onConfirm} disabled={loading}>
                        {loading ? 'Memproses...' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function Input(props) {
    return (
        <input
            {...props}
            className={`w-full rounded-md bg-[#444444] border border-[#444444] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C90000] focus:border-transparent ${props.className || ''}`}
        />
    );
}