export function PageHeader({ eyebrow, title, description }) {
    return (
        <div className="mb-8">
            {eyebrow && (
                <p className="text-xs font-mono text-[#1B2A6B] mb-1 tracking-wider">
                    {eyebrow}
                </p>
            )}
            <h1 className="font-display text-2xl text-[#10131A]">{title}</h1>
            {description && (
                <p className="text-sm text-[#64708A] mt-1">{description}</p>
            )}
        </div>
    );
}

export function StatCard({ label, value, accent = '#1B2A6B', icon: Icon, trend }) {
    const TrendIcon = trend?.icon;
    const trendColor = trend?.tone === 'up' ? '#35C48D' : trend?.tone === 'down' ? '#E5484D' : '#64708A';

    return (
        <div className="rounded-xl bg-[#F1F4FA] border border-black/5 p-5">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono text-[#64708A]">{label}</p>
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
        <div className={`rounded-xl bg-[#F1F4FA] border border-black/5 ${className}`}>
            {children}
        </div>
    );
}

export function Badge({ children, tone = 'neutral' }) {
    const tones = {
        neutral: 'bg-black/10 text-[#38424F]',
        success: 'bg-[#35C48D]/15 text-[#35C48D]',
        danger: 'bg-[#E5484D]/15 text-[#E5484D]',
        warning: 'bg-[#1B2A6B]/15 text-[#1B2A6B]',
    };
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-mono ${tones[tone]}`}>
            {children}
        </span>
    );
}

export function Table({ columns, children }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-black/5">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[#E8ECF5] text-left">
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="px-4 py-3 text-xs font-mono text-[#64708A] tracking-wider"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5">{children}</tbody>
            </table>
        </div>
    );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'bg-[#1B2A6B] text-white hover:bg-[#111B3E]',
        ghost: 'bg-transparent text-[#38424F] hover:bg-black/5 border border-black/10',
        danger: 'bg-[#E5484D]/15 text-[#E5484D] hover:bg-[#E5484D]/25',
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
                className="w-full max-w-sm rounded-xl bg-[#F1F4FA] border border-black/10 p-6"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
            >
                <h3 className="font-display text-base text-[#10131A] mb-2">{title}</h3>
                {message && <p className="text-sm text-[#64708A] mb-6">{message}</p>}
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
            className={`w-full rounded-md bg-white border border-black/10 px-3 py-2 text-sm text-[#10131A] focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent ${props.className || ''}`}
        />
    );
}