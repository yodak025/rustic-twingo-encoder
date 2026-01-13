'use client';

export default function SelectedDirectoryChip({ name, onRemove }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--accent)] bg-opacity-10 border border-[var(--accent)] text-[var(--accent)] font-mono text-sm">
      <span>{name}</span>
      <button
        onClick={onRemove}
        className="hover:text-[var(--accent-hover)] transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
