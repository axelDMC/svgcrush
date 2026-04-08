'use client';

import { Globe, Minimize2, PenTool } from 'lucide-react';
import type { PresetName } from '@/types';

interface Props {
  selected: PresetName;
  onChange: (preset: PresetName) => void;
}

const PRESETS: { id: PresetName; label: string; tooltip: string; Icon: React.ElementType }[] = [
  { id: 'web',      label: 'Web Optimized',   tooltip: 'Balance between compression and compatibility', Icon: Globe },
  { id: 'max',      label: 'Max Compression', tooltip: 'Aggressive optimization for smallest file size', Icon: Minimize2 },
  { id: 'editable', label: 'Keep Editable',   tooltip: 'Safe cleanup, preserves structure for re-editing', Icon: PenTool },
];

export default function OptimizationControls({ selected, onChange }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent, id: PresetName) => {
    // Arrow key navigation within the radiogroup
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = PRESETS.findIndex((p) => p.id === selected);
      onChange(PRESETS[(idx + 1) % PRESETS.length].id);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = PRESETS.findIndex((p) => p.id === selected);
      onChange(PRESETS[(idx - 1 + PRESETS.length) % PRESETS.length].id);
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(id);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Optimization preset"
      className="flex flex-wrap gap-2 justify-center"
    >
      {PRESETS.map(({ id, label, tooltip, Icon }) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${label}: ${tooltip}`}
            title={tooltip}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                       transition-all duration-150 active:scale-[0.97] cursor-pointer"
            style={
              isSelected
                ? { background: 'var(--accent-glow)', border: '1px solid rgba(16,185,129,0.35)', color: 'var(--accent)' }
                : { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
            }
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
          >
            <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
