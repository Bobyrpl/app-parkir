import { Loader2, Search, X, AlertCircle } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, actions, children }) {
    return (
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                {eyebrow && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {eyebrow}
                    </div>
                )}
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-zinc-100 tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {(actions || children) && (
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {actions}
                    {children}
                </div>
            )}
        </div>
    );
}

export function StatCard({
    label,
    value,
    accent = '#ffffff',
    icon: Icon,
    trend,
    subtitle,
    className = '',
}) {
    const TrendIcon = trend?.icon;
    const isUp = trend?.tone === 'up';
    const isDown = trend?.tone === 'down';
    const trendColor = isUp
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : isDown
        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        : 'text-zinc-400 bg-zinc-800/60 border-zinc-700/40';

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 md:p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/30 ${className}`}
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-mono tracking-wider uppercase text-zinc-400 font-medium truncate">
                    {label}
                </p>
                {Icon && (
                    <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 group-hover:scale-105 group-hover:border-zinc-500 transition-all duration-300 shadow-inner">
                        <Icon size={18} strokeWidth={2} />
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100">
                    {value}
                </p>
            </div>

            {(trend || subtitle) && (
                <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                    {trend && (
                        <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] border ${trendColor}`}
                        >
                            {TrendIcon && <TrendIcon size={12} strokeWidth={2.5} />}
                            <span>{trend.label}</span>
                        </div>
                    )}
                    {subtitle && (
                        <span className="text-zinc-500 text-[11px] truncate font-mono ml-auto">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export function Card({ children, className = '', hoverable = false, noPadding = false }) {
    return (
        <div
            className={`rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm transition-all duration-300 ${
                noPadding ? '' : 'p-5 md:p-6'
            } ${hoverable ? 'hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

export function Badge({ children, tone = 'neutral', className = '', dot = false, size = 'md' }) {
    const tones = {
        neutral: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
        zinc: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        danger: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        purple: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    };

    const dotTones = {
        neutral: 'bg-zinc-400',
        zinc: 'bg-zinc-400',
        success: 'bg-emerald-400 animate-pulse',
        danger: 'bg-rose-400',
        warning: 'bg-amber-400',
        info: 'bg-blue-400',
        purple: 'bg-purple-400',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium border ${tones[tone] || tones.neutral} ${
                sizeClasses[size] || sizeClasses.md
            } ${className}`}
        >
            {dot && (
                <span
                    className={`h-1.5 w-1.5 rounded-full ${dotTones[tone] || dotTones.neutral}`}
                />
            )}
            {children}
        </span>
    );
}

export function Table({ columns = [], children, className = '' }) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/60">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-5 py-3.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled = false,
    icon: Icon,
    ...props
}) {
    const variants = {
        primary:
            'bg-zinc-100 text-zinc-950 hover:bg-white active:bg-zinc-200 font-semibold shadow-sm border border-white/20',
        secondary:
            'bg-zinc-900 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-800 hover:text-white active:bg-zinc-700/70 font-medium shadow-sm',
        ghost:
            'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 active:bg-zinc-800 border border-transparent font-medium',
        danger:
            'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 active:bg-rose-500/30 border border-rose-500/30 font-medium',
        success:
            'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 active:bg-emerald-500/30 border border-emerald-500/30 font-medium',
        outline:
            'bg-transparent border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white font-medium',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
        md: 'px-4 py-2 text-sm gap-2 rounded-xl',
        lg: 'px-5 py-2.5 text-base gap-2.5 rounded-xl',
    };

    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            className={`inline-flex items-center justify-center transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 ${
                sizes[size] || sizes.md
            } ${variants[variant] || variants.primary} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin shrink-0" />
            ) : Icon ? (
                <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />
            ) : null}
            {children}
        </button>
    );
}

export function Input({ icon: Icon, error, className = '', ...props }) {
    return (
        <div className="w-full">
            <div className="relative flex items-center">
                {Icon && (
                    <Icon
                        size={16}
                        className="absolute left-3.5 text-zinc-500 pointer-events-none"
                    />
                )}
                <input
                    {...props}
                    className={`w-full rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-zinc-100 placeholder:text-zinc-500 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 disabled:opacity-50 disabled:bg-zinc-900 ${
                        Icon ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
                    } ${error ? 'border-rose-500 focus:ring-rose-500/30' : ''} ${className}`}
                />
            </div>
            {error && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
                    <AlertCircle size={12} />
                    {error}
                </p>
            )}
        </div>
    );
}

export function SearchInput({ value, onChange, placeholder = 'Cari...', onClear, className = '' }) {
    return (
        <div className={`relative flex items-center ${className}`}>
            <Search size={15} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-xl bg-zinc-950/70 border border-zinc-800/80 pl-10 pr-8 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-500 transition-all"
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 p-0.5 rounded-md transition-colors"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            tone === 'danger'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                    >
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-base text-zinc-100">{title}</h3>
                        <p className="text-xs text-zinc-400 font-mono">Tindakan ini memerlukan persetujuan.</p>
                    </div>
                </div>

                {message && <p className="text-sm text-zinc-300 leading-relaxed mb-6">{message}</p>}

                <div className="flex justify-end gap-2.5">
                    <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={tone} size="sm" onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function EmptyState({ icon: Icon, title = 'Tidak ada data', description, action, actionLabel, onAction }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40">
            {Icon && (
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
                    <Icon size={22} strokeWidth={1.5} />
                </div>
            )}
            <p className="font-display font-semibold text-base text-zinc-200">{title}</p>
            {description && (
                <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
            )}
            {action || (actionLabel && onAction && (
                <Button size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            ))}
        </div>
    );
}

export function Skeleton({ className = '' }) {
    return (
        <div className={`animate-pulse rounded-xl bg-zinc-800/60 ${className}`} />
    );
}