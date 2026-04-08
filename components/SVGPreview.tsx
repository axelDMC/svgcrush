'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface Props {
  original: string;
  optimized: string;
  originalSize: number;
  optimizedSize: number;
  reduction: number;
  note?: string;
  // Lifted state so parent can control code panel via keyboard (Escape)
  showCode?: boolean;
  onShowCodeChange?: (v: boolean) => void;
}

const CHECKER_BG = {
  backgroundImage:
    'linear-gradient(45deg, #222 25%, transparent 25%),' +
    'linear-gradient(-45deg, #222 25%, transparent 25%),' +
    'linear-gradient(45deg, transparent 75%, #222 75%),' +
    'linear-gradient(-45deg, transparent 75%, #222 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  backgroundColor: '#181818',
} as React.CSSProperties;

function normaliseSVG(svg: string): string {
  // Target only the <svg> root element's attributes, never child elements
  return svg.replace(/(<svg\b[^>]*>)/i, (svgTag) =>
    svgTag
      .replace(/\s+width=("[^"]*"|'[^']*')/gi, '')
      .replace(/\s+height=("[^"]*"|'[^']*')/gi, '')
      .replace(/(<svg\b)/i, '$1 width="100%" height="100%"')
  );
}

// 400ms ease-out count-up
function useCountUp(target: number, duration = 400): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setValue(0);

    const step = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const progress = Math.min((now - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// Clipboard toast
function Toast({ visible }: { visible: boolean }) {
  return (
    <div
      className={visible ? 'toast-enter' : 'toast-exit'}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 50,
        display: visible ? 'flex' : 'none',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.813rem',
        fontWeight: 500,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-hover)',
        color: 'var(--text-primary)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    >
      <Check size={14} style={{ color: 'var(--accent)' }} />
      Copied to clipboard!
    </div>
  );
}

function SVGPane({
  label,
  svgContent,
  size,
  accent,
}: {
  label: string;
  svgContent: string;
  size: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <div
        style={CHECKER_BG}
        className="rounded-xl overflow-hidden"
        aria-label={`${label} SVG preview`}
        role="img"
      >
        <div
          className="w-full p-4 flex items-center justify-center"
          style={{ height: '220px' }}
          aria-hidden="true"
          // Safe: user's own SVG files, never from external sources
          dangerouslySetInnerHTML={{ __html: normaliseSVG(svgContent) }}
        />
      </div>
      <span
        className="text-sm font-medium tabular-nums"
        style={{ color: accent ? 'var(--accent)' : 'var(--text-secondary)' }}
      >
        {formatBytes(size)}
      </span>
    </div>
  );
}

function CodePanel({ code, onCopy }: { code: string; onCopy: () => void }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Optimized SVG
        </span>
        <button
          onClick={onCopy}
          aria-label="Copy optimized SVG code to clipboard"
          className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-md
                     transition-colors duration-150 active:scale-[0.97] cursor-pointer"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <Copy size={11} />
          Copy
        </button>
      </div>
      <pre
        className="overflow-x-auto p-4 text-xs leading-relaxed max-h-64"
        style={{ fontFamily: 'var(--font-code), monospace', color: 'var(--text-secondary)' }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SVGPreview({
  original,
  optimized,
  originalSize,
  optimizedSize,
  reduction,
  note,
  showCode: externalShowCode,
  onShowCodeChange,
}: Props) {
  const [internalShowCode, setInternalShowCode] = useState(false);
  // Use external state if provided (lifted for keyboard shortcut), else internal
  const showCode = externalShowCode !== undefined ? externalShowCode : internalShowCode;
  const setShowCode = (v: boolean) => {
    onShowCodeChange ? onShowCodeChange(v) : setInternalShowCode(v);
  };
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alreadyOptimized = reduction <= 0;
  const animatedReduction = useCountUp(alreadyOptimized ? 0 : Math.round(reduction));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(optimized);
      setToastVisible(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
    } catch {
      // Clipboard API not available — silently fail, user can select text manually
    }
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  return (
    <>
      <Toast visible={toastVisible} />

      <div
        className="flex flex-col gap-5 rounded-xl animate-fade-up"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: '1.25rem',
        }}
      >
        {/* Reduction badge — neutral if already optimized */}
        <div className="flex items-center justify-center">
          {alreadyOptimized ? (
            <span
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-base"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-hover)',
                color: 'var(--text-secondary)',
              }}
            >
              ✓ Already optimized — no further compression possible
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-2xl tabular-nums"
              style={{
                background: 'var(--accent-glow)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: 'var(--accent)',
              }}
            >
              ↓ {animatedReduction}%
              <span className="text-sm font-normal opacity-60">smaller</span>
            </span>
          )}
        </div>

        {/* Info note (e.g. already optimized message) */}
        {note && !alreadyOptimized && (
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{note}</p>
        )}

        {/* Previews */}
        <div className="flex flex-col sm:flex-row gap-4">
          <SVGPane label="Original" svgContent={original} size={originalSize} />
          <div
            className="hidden sm:flex flex-col items-center justify-center text-xl select-none"
            style={{ color: 'var(--border-hover)' }}
          >
            →
          </div>
          <div
            className="sm:hidden flex items-center justify-center text-xl select-none"
            style={{ color: 'var(--border-hover)' }}
          >
            ↓
          </div>
          <SVGPane label="Optimized" svgContent={optimized} size={optimizedSize} accent />
        </div>

        {/* View Code — animated height */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1.5 self-start text-sm transition-colors duration-150 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ChevronDown
              size={15}
              className="transition-transform duration-200"
              style={{ transform: showCode ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
            {showCode ? 'Hide Code' : 'View Code'}
          </button>

          {/* Animated height wrapper */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: showCode ? '600px' : '0px', opacity: showCode ? 1 : 0 }}
          >
            <CodePanel code={optimized} onCopy={handleCopy} />
          </div>
        </div>
      </div>
    </>
  );
}
