import { Loader2, Search, X, AlertCircle } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, actions, children }) {
    return (
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                {eyebrow && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-neutral-100 text-neutral-500 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {eyebrow}
                    </div>
                )}
                <h1 className="font-semibold text-2xl sm:text-3xl text-neutral-900 tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
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
        ? 'text-emerald-600 bg-emerald-50'
        : isDown
        ? 'text-rose-600 bg-rose-50'
        : 'text-neutral-500 bg-neutral-100';

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl bg-white border border-neutral-200 p-5 md:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-200/60 ${className}`}
        >
            <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-semibold tracking-wide uppercase text-neutral-500 truncate">
                    {label}
                </p>
                {Icon && (
                    <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-neutral-100 text-neutral-900 group-hover:scale-105 transition-all duration-300">
                        <Icon size={18} strokeWidth={2} />
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
                    {value}
                </p>
            </div>

            {(trend || subtitle) && (
                <div className="mt-3.5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    {trend && (
                        <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px] ${trendColor}`}
                        >
                            {TrendIcon && <TrendIcon size={12} strokeWidth={2.5} />}
                            <span>{trend.label}</span>
                        </div>
                    )}
                    {subtitle && (
                        <span className="text-neutral-400 text-[11px] truncate ml-auto">
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
            className={`rounded-2xl bg-white border border-neutral-200 transition-all duration-300 ${
                noPadding ? '' : 'p-5 md:p-6'
            } ${hoverable ? 'hover:shadow-lg hover:shadow-neutral-200/60' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

export function Badge({ children, tone = 'neutral', className = '', dot = false, size = 'md' }) {
    const tones = {
        neutral: 'bg-neutral-100 text-neutral-600',
        zinc: 'bg-neutral-100 text-neutral-600',
        success: 'bg-emerald-50 text-emerald-700',
        danger: 'bg-rose-50 text-rose-700',
        warning: 'bg-amber-50 text-amber-700',
        info: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
    };

    const dotTones = {
        neutral: 'bg-neutral-400',
        zinc: 'bg-neutral-400',
        success: 'bg-emerald-500',
        danger: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
        purple: 'bg-purple-500',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium ${tones[tone] || tones.neutral} ${
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
        <div className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700">
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
        primary: 'bg-neutral-900 text-white hover:bg-neutral-800 active:opacity-90 font-medium',
        secondary:
            'bg-white border border-neutral-300 text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 font-medium',
        ghost:
            'bg-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 border border-transparent font-medium',
        danger:
            'bg-rose-50 text-rose-600 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 font-medium',
        success:
            'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 font-medium',
        outline:
            'bg-transparent border border-neutral-300 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 font-medium',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-full',
        md: 'px-4 py-2 text-sm gap-2 rounded-full',
        lg: 'px-5 py-2.5 text-base gap-2.5 rounded-full',
    };

    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            className={`inline-flex items-center justify-center transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
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
                        className="absolute left-3.5 text-neutral-400 pointer-events-none"
                    />
                )}
                <input
                    {...props}
                    className={`w-full rounded-xl bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 disabled:opacity-50 disabled:bg-neutral-50 ${
                        Icon ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
                    } ${error ? 'border-rose-400 focus:ring-rose-500/15' : ''} ${className}`}
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
            <Search size={15} className="absolute left-3.5 text-neutral-400 pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-xl bg-white border border-neutral-300 pl-10 pr-8 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-0.5 rounded-md transition-colors"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white border border-neutral-200 p-6 shadow-xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            tone === 'danger'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-neutral-100 text-neutral-500'
                        }`}
                    >
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base text-neutral-900">{title}</h3>
                        <p className="text-xs text-neutral-500">Tindakan ini memerlukan persetujuan.</p>
                    </div>
                </div>

                {message && <p className="text-sm text-neutral-500 leading-relaxed mb-6">{message}</p>}

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
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50">
            {Icon && (
                <div className="h-12 w-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 mb-3">
                    <Icon size={22} strokeWidth={1.5} />
                </div>
            )}
            <p className="font-semibold text-base text-neutral-900">{title}</p>
            {description && (
                <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
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
        <div className={`animate-pulse rounded-xl bg-neutral-100 ${className}`} />
    );
}