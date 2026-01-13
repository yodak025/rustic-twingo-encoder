'use client';

import { useState, useEffect } from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Spinner from '../atoms/Spinner';

export default function DirectoryBrowser({ 
  mode = 'restricted', // 'restricted' or 'free'
  onSelect,
  initialPath = '/'
}) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [directories, setDirectories] = useState([]);
  const [expandedDirs, setExpandedDirs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDirectories(currentPath);
  }, [currentPath]);

  const loadDirectories = async (path) => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = mode === 'restricted' ? '/api/directories' : '/api/browse';
      const queryPath = mode === 'restricted' ? path : path || '/';
      const response = await fetch(`${endpoint}?path=${encodeURIComponent(queryPath)}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setDirectories([]);
      } else {
        setDirectories(data.directories || []);
      }
    } catch (err) {
      setError('Failed to load directories');
      setDirectories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (dirName) => {
    const newPath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`;
    setCurrentPath(newPath);
  };

  const handleNavigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length ? `/${parts.join('/')}` : '/');
  };

  const handleSelect = (dirName) => {
    const fullPath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`;
    if (onSelect) {
      onSelect(fullPath);
    }
  };

  const renderBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    
    return (
      <div className="flex items-center gap-2 text-sm font-mono mb-4 pb-4 border-b border-[var(--border)]">
        <button
          onClick={() => setCurrentPath('/')}
          className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          /
        </button>
        {parts.map((part, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[var(--muted)]">→</span>
            <button
              onClick={() => {
                const newPath = '/' + parts.slice(0, idx + 1).join('/');
                setCurrentPath(newPath);
              }}
              className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {part}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-mono">Browse Directories</h3>
        {currentPath !== '/' && (
          <Button variant="secondary" onClick={handleNavigateUp}>
            ← Back
          </Button>
        )}
      </div>

      {renderBreadcrumbs()}

      {error && (
        <div className="p-4 mb-4 bg-[var(--error)] bg-opacity-10 border border-[var(--error)] text-[var(--error)] font-mono text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : directories.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted)] font-mono text-sm">
          No directories found
        </div>
      ) : (
        <div className="border border-[var(--border)] max-h-96 overflow-y-auto">
          {directories.map((dir, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 hover:bg-[var(--card-background)] border-b border-[var(--border)] last:border-b-0 transition-colors"
            >
              <button
                onClick={() => handleNavigate(dir)}
                className="flex-1 text-left font-mono text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
              >
                📁 {dir}
              </button>
              {mode === 'restricted' && (
                <Button
                  variant="secondary"
                  onClick={() => handleSelect(dir)}
                  className="px-2 py-1 text-xs ml-2"
                >
                  Select
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {mode === 'free' && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <Button
            variant="primary"
            onClick={() => onSelect && onSelect(currentPath)}
            className="w-full"
          >
            Use This Directory
          </Button>
        </div>
      )}
    </Card>
  );
}
