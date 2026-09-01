import { Loader2, Search, X, AlertCircle } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, actions, children }) {
    return (
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                {eyebrow && (
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1.5">
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-semibold text-2xl sm:text-3xl text-[var(--color-text)] tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
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
    icon: Icon,
    trend,
    subtitle,
    className = '',
}) {
    const TrendIcon = trend?.icon;
    const isUp = trend?.tone === 'up';
    const isDown = trend?.tone === 'down';
    const trendColor = isUp
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : isDown
        ? 'text-rose-700 bg-rose-50 border-rose-200'
        : 'text-[var(--color-text-secondary)] bg-[var(--color-section)] border-[var(--color-border)]';

    return (
        <div
            className={`rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-5 md:p-6 transition-colors duration-300 ${className}`}
        >
            <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-xs text-[var(--color-text-secondary)] font-medium truncate">
                    {label}
                </p>
                {Icon && (
                    <span className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-section)] border border-[var(--color-border)] text-[var(--color-text)]">
                        <Icon size={17} strokeWidth={1.75} />
                    </span>
                )}
            </div>

            <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-text)] tabular-nums">
                {value}
            </p>

            {(trend || subtitle) && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
                    {trend && (
                        <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${trendColor}`}
                        >
                            {TrendIcon && <TrendIcon size={12} strokeWidth={2.5} />}
                            <span>{trend.label}</span>
                        </div>
                    )}
                    {subtitle && (
                        <span className="text-[var(--color-text-muted)] text-[11px] truncate ml-auto">
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
            className={`rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] transition-colors duration-300 ${
                noPadding ? '' : 'p-5 md:p-6'
            } ${hoverable ? 'hover:border-[var(--color-text-muted)]' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

export function Badge({ children, tone = 'neutral', className = '', dot = false, size = 'md' }) {
    const tones = {
        neutral: 'bg-[var(--color-section)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
        zinc: 'bg-[var(--color-section)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        info: 'bg-sky-50 text-sky-700 border-sky-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const dotTones = {
        neutral: 'bg-[var(--color-text-muted)]',
        zinc: 'bg-[var(--color-text-muted)]',
        success: 'bg-emerald-500',
        danger: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-sky-500',
        purple: 'bg-purple-500',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${tones[tone] || tones.neutral} ${
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
        <div className={`overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-section)]">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-5 py-3.5 text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap"
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
            'bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:opacity-90 active:opacity-80 font-medium',
        secondary:
            'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-section)] font-medium',
        ghost:
            'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-section)] border border-transparent font-medium',
        danger:
            'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium',
        success:
            'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium',
        outline:
            'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)] font-medium',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-full',
        md: 'px-4 py-2.5 text-sm gap-2 rounded-full',
        lg: 'px-5 py-3 text-base gap-2.5 rounded-full',
    };

    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            className={`inline-flex items-center justify-center transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)] ${
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
                    className={`w-full rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--color-text)] disabled:opacity-50 ${
                        Icon ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
                    } ${error ? 'border-rose-400 focus:ring-rose-400' : ''} ${className}`}
                />
            </div>
            {error && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
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
                className="w-full rounded-full bg-[var(--color-card)] border border-[var(--color-border)] pl-10 pr-8 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text)] transition-shadow"
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-0.5 rounded-full transition-colors"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm px-4"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                            tone === 'danger'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-[var(--color-section)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                        }`}
                    >
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base text-[var(--color-text)]">{title}</h3>
                        <p className="text-xs text-[var(--color-text-secondary)]">Tindakan ini memerlukan persetujuan.</p>
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
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-section)]">
            {Icon && (
                <div className="h-12 w-12 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
                    <Icon size={22} strokeWidth={1.5} />
                </div>
            )}
            <p className="font-semibold text-base text-[var(--color-text)]">{title}</p>
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
        <div className={`animate-pulse rounded-xl bg-[var(--color-section)] ${className}`} />
    );
}
