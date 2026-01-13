'use client';

import Button from '../atoms/Button';

export default function DirectoryItem({ name, onSelect, onExpand, hasChildren = true, isExpanded = false }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 hover:bg-[var(--card-background)] border-b border-[var(--border)] transition-colors">
      {hasChildren && (
        <button
          onClick={onExpand}
          className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors w-4 text-left"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      )}
      {!hasChildren && <span className="w-4" />}
      
      <span className="flex-1 font-mono text-sm text-[var(--foreground)]">
        {name}
      </span>
      
      <Button
        variant="secondary"
        onClick={onSelect}
        className="px-2 py-1 text-xs"
      >
        Select
      </Button>
    </div>
  );
}
