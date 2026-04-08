'use client';

import { formatBytes } from '@/lib/utils';

interface Props {
  originalSize: number;
  optimizedSize: number;
  reduction: number;
}

export default function FileStats({ originalSize, optimizedSize, reduction }: Props) {
  const color =
    reduction > 50 ? 'var(--accent)' : reduction >= 20 ? '#fbbf24' : 'var(--text-muted)';

  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <span style={{ color: 'var(--text-muted)' }}>{formatBytes(originalSize)}</span>
      <span style={{ color: 'var(--border-hover)' }}>→</span>
      <span style={{ color: 'var(--text-secondary)' }}>{formatBytes(optimizedSize)}</span>
      <span className="font-semibold tabular-nums" style={{ color }}>
        −{reduction.toFixed(1)}%
      </span>
    </div>
  );
}
