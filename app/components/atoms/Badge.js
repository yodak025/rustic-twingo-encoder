export default function Badge({ children, variant = 'default', className = '' }) {
  const variantStyles = {
    default: {
      className: 'bg-[var(--card-background)] text-[var(--foreground)] border-[var(--border)]',
    },
    success: {
      className: 'text-[var(--success)] border-[var(--success)]',
      style: { backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    },
    error: {
      className: 'text-[var(--error)] border-[var(--error)]',
      style: { backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)' },
    },
    warning: {
      className: 'text-[var(--accent)] border-[var(--accent)]',
      style: { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' },
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <span 
      className={`inline-block px-2 py-1 text-xs font-mono border ${currentVariant.className} ${className}`}
      style={currentVariant.style}
    >
      {children}
    </span>
  );
}
