export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-[var(--card-background)] text-[var(--foreground)] border-[var(--border)]',
    success: 'bg-[var(--success)] bg-opacity-10 text-[var(--success)] border-[var(--success)]',
    error: 'bg-[var(--error)] bg-opacity-10 text-[var(--error)] border-[var(--error)]',
    warning: 'bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] border-[var(--accent)]',
  };

  return (
    <span className={`inline-block px-2 py-1 text-xs font-mono border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
