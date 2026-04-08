'use client';

import { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Clock,
  Download,
  FileCode,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import type { SVGFile } from '@/types';

interface Props {
  files: SVGFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onDownloadAll: () => Promise<void>;
  onDownloadSingle: (id: string) => void;
}

function StatusIcon({ status }: { status: SVGFile['status'] }) {
  switch (status) {
    case 'done':
      return (
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
          style={{ background: 'var(--accent-glow)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <Check size={11} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />
        </span>
      );
    case 'processing':
      return <Loader2 size={15} className="animate-spin shrink-0" style={{ color: 'var(--accent)' }} />;
    case 'error':
      return <AlertCircle size={15} className="shrink-0" style={{ color: 'var(--error)' }} />;
    default:
      return <Clock size={15} className="shrink-0" style={{ color: 'var(--border-hover)' }} />;
  }
}

function ReductionBadge({ reduction }: { reduction: number }) {
  const color =
    reduction > 50 ? 'var(--accent)' : reduction >= 20 ? '#fbbf24' : 'var(--text-muted)';
  return (
    <span
      className="text-xs font-semibold tabular-nums shrink-0 w-14 text-right"
      style={{ color }}
    >
      −{reduction.toFixed(1)}%
    </span>
  );
}

function TotalStats({ files }: { files: SVGFile[] }) {
  const done = files.filter((f) => f.status === 'done');
  const pending = files.filter((f) => f.status === 'pending' || f.status === 'processing').length;
  const errors = files.filter((f) => f.status === 'error').length;
  if (pending > 0 || done.length === 0) return null;

  const totalOrig = done.reduce((s, f) => s + f.originalSize, 0);
  const totalOpt = done.reduce((s, f) => s + f.optimizedSize, 0);
  const totalRed = totalOrig > 0 ? ((totalOrig - totalOpt) / totalOrig) * 100 : 0;
  const redColor = totalRed > 50 ? 'var(--accent)' : totalRed >= 20 ? '#fbbf24' : 'var(--text-muted)';

  return (
    <div
      className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 animate-fade-in"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}
    >
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {formatBytes(totalOrig)}
        <span className="mx-1.5" style={{ color: 'var(--text-muted)' }}>→</span>
        {formatBytes(totalOpt)}
      </span>
      <span className="text-sm font-bold tabular-nums" style={{ color: redColor }}>
        {totalRed.toFixed(1)}% smaller
      </span>
      {errors > 0 && (
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {errors} skipped
        </span>
      )}
    </div>
  );
}

export default function BatchPanel({
  files,
  selectedFileId,
  onSelectFile,
  onRemoveFile,
  onClearAll,
  onDownloadAll,
  onDownloadSingle,
}: Props) {
  const [isZipping, setIsZipping] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const doneCount = files.filter((f) => f.status === 'done').length;

  const handleDownloadAll = async () => {
    if (isZipping || doneCount === 0) return;
    setIsZipping(true);
    try { await onDownloadAll(); }
    finally { setIsZipping(false); }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <FileCode size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
          <span style={{ color: 'var(--border-hover)' }}>·</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {doneCount} optimized
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 text-xs transition-colors duration-150 cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Trash2 size={12} />
          Clear all
        </button>
      </div>

      <TotalStats files={files} />

      {/* File list */}
      <ul className="overflow-y-auto" style={{ maxHeight: '22rem' }}>
        {files.map((file, index) => {
          const isNew = !seenIdsRef.current.has(file.id);
          if (isNew) seenIdsRef.current.add(file.id);
          const isSelected = file.id === selectedFileId;
          // 50ms stagger, capped at 500ms
          const delay = isNew ? Math.min(index * 50, 500) : 0;

          return (
            <li
              key={file.id}
              style={{
                borderBottom: '1px solid var(--border)',
                ...(isNew
                  ? { animation: `row-enter 0.24s cubic-bezier(0.16,1,0.3,1) forwards`, animationDelay: `${delay}ms`, opacity: 0 }
                  : undefined),
              }}
            >
              <div
                className="flex items-center gap-2 pr-2 transition-all duration-150"
                style={{
                  borderLeft: `2px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                  background: isSelected ? 'var(--accent-glow)' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '';
                }}
              >
                <button
                  onClick={() => onSelectFile(file.id)}
                  title={file.name}
                  className="flex flex-1 items-center gap-3 pl-3 py-3 text-left cursor-pointer min-w-0"
                >
                  <StatusIcon status={file.status} />

                  <span
                    className="flex-1 text-sm truncate min-w-0"
                    style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {file.name}
                  </span>

                  {file.status === 'done' && (
                    <span
                      className="text-xs tabular-nums shrink-0 hidden sm:block"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatBytes(file.originalSize)}
                      <span className="mx-1" style={{ color: 'var(--border-hover)' }}>→</span>
                      {formatBytes(file.optimizedSize)}
                    </span>
                  )}
                  {file.status === 'done' && file.reduction > 0 && <ReductionBadge reduction={file.reduction} />}
                  {file.status === 'error' && (
                    <span
                      className="text-xs shrink-0 truncate max-w-[140px]"
                      title={file.error}
                      style={{ color: 'var(--error)' }}
                    >
                      {file.error}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                  {file.status === 'done' && (
                    <button
                      onClick={() => onDownloadSingle(file.id)}
                      title={`Download ${file.name}`}
                      aria-label={`Download ${file.name}`}
                      className="p-1.5 rounded-md transition-colors duration-150 cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = '';
                      }}
                    >
                      <Download size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    title={`Remove ${file.name}`}
                    aria-label={`Remove ${file.name}`}
                    className="p-1.5 rounded-md transition-colors duration-150 cursor-pointer"
                    style={{ color: 'var(--border-hover)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--error)';
                      e.currentTarget.style.background = 'rgba(248,113,113,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--border-hover)';
                      e.currentTarget.style.background = '';
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleDownloadAll}
          disabled={doneCount === 0 || isZipping}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                     text-sm font-semibold transition-all duration-150 active:scale-[0.99]"
          style={
            doneCount > 0 && !isZipping
              ? { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
              : { background: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'not-allowed' }
          }
          onMouseEnter={(e) => {
            if (doneCount > 0 && !isZipping) e.currentTarget.style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            if (doneCount > 0 && !isZipping) e.currentTarget.style.background = 'var(--accent)';
          }}
        >
          {isZipping ? (
            <><Loader2 size={14} className="animate-spin" /> Creating ZIP…</>
          ) : (
            <>
              <Download size={14} />
              Download All as ZIP
              {doneCount > 0 && <span className="opacity-60 text-xs">({doneCount})</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
