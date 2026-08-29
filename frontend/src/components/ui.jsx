import { Loader2, Search, X, AlertCircle } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, actions, children }) {
    return (
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                {eyebrow && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {eyebrow}
                    </div>
                )}
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--color-text)] tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl leading-relaxed">
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
        : 'text-[var(--color-text-secondary)] bg-[var(--color-card)] border-[var(--color-border)]';

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl bg-[var(--color-card)]/90 border border-[var(--color-border)] p-5 md:p-6 transition-all duration-300 hover:border-[var(--color-border)] hover:shadow-xl hover:shadow-black/30 ${className}`}
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-mono tracking-wider uppercase text-[var(--color-text-secondary)] font-medium truncate">
                    {label}
                </p>
                {Icon && (
                    <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] group-hover:scale-105 group-hover:border-[var(--color-text-secondary)] transition-all duration-300 shadow-inner">
                        <Icon size={18} strokeWidth={2} />
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text)]">
                    {value}
                </p>
            </div>

            {(trend || subtitle) && (
                <div className="mt-3.5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
                    {trend && (
                        <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] border ${trendColor}`}
                        >
                            {TrendIcon && <TrendIcon size={12} strokeWidth={2.5} />}
                            <span>{trend.label}</span>
                        </div>
                    )}
                    {subtitle && (
                        <span className="text-[var(--color-text-muted)] text-[11px] truncate font-mono ml-auto">
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
            className={`rounded-2xl bg-[var(--color-card)]/80 border border-[var(--color-border)] backdrop-blur-sm transition-all duration-300 ${
                noPadding ? '' : 'p-5 md:p-6'
            } ${hoverable ? 'hover:border-[var(--color-border)] hover:shadow-xl hover:shadow-black/20' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

export function Badge({ children, tone = 'neutral', className = '', dot = false, size = 'md' }) {
    const tones = {
        neutral: 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
        zinc: 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        danger: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        purple: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    };

    const dotTones = {
        neutral: 'bg-[var(--color-text-muted)]',
        zinc: 'bg-[var(--color-text-muted)]',
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
        <div className={`overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/60 ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-section)]/70">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-5 py-3.5 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-secondary)]">
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
            'bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:opacity-90 active:opacity-80 font-semibold shadow-sm border border-[var(--color-border)]',
        secondary:
            'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] active:bg-[var(--color-border)] font-medium shadow-sm',
        ghost:
            'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)] active:bg-[var(--color-card)] border border-transparent font-medium',
        danger:
            'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 active:bg-rose-500/30 border border-rose-500/30 font-medium',
        success:
            'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 active:bg-emerald-500/30 border border-emerald-500/30 font-medium',
        outline:
            'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium',
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
            className={`inline-flex items-center justify-center transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-text)_50%,transparent)] ${
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
                        className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none"
                    />
                )}
                <input
                    {...props}
                    className={`w-full rounded-xl bg-[var(--color-section)]/80 border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] focus:border-[var(--color-text-secondary)] disabled:opacity-50 disabled:bg-[var(--color-card)] ${
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
            <Search size={15} className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-xl bg-[var(--color-section)]/80 border border-[var(--color-border)] pl-10 pr-8 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-text)_30%,transparent)] focus:border-[var(--color-text-secondary)] transition-all"
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-0.5 rounded-md transition-colors"
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
                className="w-full max-w-sm rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            tone === 'danger'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                        }`}
                    >
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-base text-[var(--color-text)]">{title}</h3>
                        <p className="text-xs text-[var(--color-text-secondary)] font-mono">Tindakan ini memerlukan persetujuan.</p>
                    </div>
                </div>

                {message && <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">{message}</p>}

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
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-section)]/60">
            {Icon && (
                <div className="h-12 w-12 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3 shadow-inner">
                    <Icon size={22} strokeWidth={1.5} />
                </div>
            )}
            <p className="font-display font-semibold text-base text-[var(--color-text)]">{title}</p>
            {description && (
                <p className="text-xs text-[var(--color-text-muted)] max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
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
        <div className={`animate-pulse rounded-xl bg-[var(--color-card)] ${className}`} />
    );
}