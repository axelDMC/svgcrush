'use client';

import { Moon, Sun, Zap } from 'lucide-react';

interface Props {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export default function Header({ theme, onThemeToggle }: Props) {
  return (
    <header
      className="border-b px-4 py-3.5 sticky top-0 z-20 backdrop-blur-md"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: `color-mix(in srgb, var(--bg-primary) 85%, transparent)`,
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'var(--accent-glow)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <Zap size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            SVGCrush
          </span>
          <span className="hidden sm:block text-sm" style={{ color: 'var(--text-muted)' }}>
            · Free SVG optimizer
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer"
          style={{ border: '1px solid var(--border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {theme === 'dark'
            ? <Sun size={15} style={{ color: 'var(--text-secondary)' }} />
            : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
          }
        </button>
      </div>
    </header>
  );
}
