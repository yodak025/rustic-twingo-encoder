export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  type = 'button',
  className = ''
}) {
  const baseStyles = 'px-4 py-2 font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] border border-[var(--accent)]',
    secondary: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--card-background)] border border-[var(--border)]',
    danger: 'bg-transparent text-[var(--error)] hover:bg-[var(--error)] hover:text-[var(--background)] border border-[var(--error)]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
