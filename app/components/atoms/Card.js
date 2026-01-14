export default function Card({ children, className = '', onClick }) {
  return (
    <div 
      className={`bg-[var(--card-background)] border border-[var(--border)] p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
