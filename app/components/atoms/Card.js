export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--card-background)] border border-[var(--border)] p-6 ${className}`}>
      {children}
    </div>
  );
}
