export default function Input({ 
  label, 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text',
  error = '',
  disabled = false,
  className = ''
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-mono text-[var(--foreground)]">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {error && (
        <span className="text-xs font-mono text-[var(--error)]">
          {error}
        </span>
      )}
    </div>
  );
}
