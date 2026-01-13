'use client';

import { useState, useEffect } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    const root = document.documentElement;
    const initialDark = root.classList.contains('dark');
    setIsDark(initialDark);
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="px-3 py-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors font-mono text-sm"
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
}
