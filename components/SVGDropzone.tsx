'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Upload, X } from 'lucide-react';
import {
  checkBrowserAPIs,
  generateId,
  validateFile,
  validatePastedSVG,
  validateSVGContent,
} from '@/lib/utils';
import type { SVGFile } from '@/types';

type InputMode = 'upload' | 'paste';
type DropState = 'idle' | 'dragover';
type NotifType = 'error' | 'warning';

interface Notif {
  id: string;
  msg: string;
  type: NotifType;
}

interface Props {
  onFilesAdded: (files: SVGFile[]) => void;
  isProcessing: boolean;
  maxFiles?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read "${file.name}"`));
      reader.readAsText(file);
    } catch (err) {
      reject(err);
    }
  });
}

function makeSVGFile(
  name: string,
  content: string,
  errorMsg?: string,
): SVGFile {
  return {
    id: generateId(),
    name,
    originalContent: content,
    optimizedContent: '',
    originalSize: new TextEncoder().encode(content).length,
    optimizedSize: 0,
    reduction: 0,
    status: errorMsg ? 'error' : 'pending',
    error: errorMsg,
  };
}

// ── Notification strip ─────────────────────────────────────────────────────────

function NotifStrip({ notifs, onDismiss }: { notifs: Notif[]; onDismiss: (id: string) => void }) {
  if (!notifs.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {notifs.map(({ id, msg, type }) => (
        <div
          key={id}
          className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg text-sm animate-fade-in"
          style={
            type === 'error'
              ? { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--error)' }
              : { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }
          }
        >
          {type === 'error'
            ? <AlertCircle size={15} className="shrink-0 mt-0.5" />
            : <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          }
          <span className="flex-1 leading-snug">{msg}</span>
          <button
            onClick={() => onDismiss(id)}
            className="shrink-0 p-0.5 rounded cursor-pointer transition-opacity duration-150 opacity-60 hover:opacity-100"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Shortcut hint ─────────────────────────────────────────────────────────────

function ShortcutHint() {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);
  const mod = mac ? '⌘' : 'Ctrl';
  return (
    <p className="text-center text-xs select-none" style={{ color: 'var(--text-muted)' }}>
      {mod}V to paste &middot; {mod}S to download
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SVGDropzone({ onFilesAdded, isProcessing, maxFiles = 50 }: Props) {
  const [mode, setMode] = useState<InputMode>('upload');
  const [dropState, setDropState] = useState<DropState>('idle');
  const [pasteCode, setPasteCode] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [iconBounce, setIconBounce] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [browserError, setBrowserError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Check browser API support on mount
  useEffect(() => {
    const err = checkBrowserAPIs();
    if (err) setBrowserError(err);
  }, []);

  const addNotif = useCallback((msg: string, type: NotifType = 'error') => {
    const id = generateId();
    setNotifs((prev) => [...prev.slice(-4), { id, msg, type }]); // cap at 5
    // Auto-dismiss warnings after 6s
    if (type === 'warning') {
      setTimeout(() => dismissNotif(id), 6000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissNotif = useCallback((id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ── File processing pipeline ─────────────────────────────────────────────────

  const processFiles = useCallback(
    async (fileList: File[], currentCount = 0) => {
      if (!fileList.length) return;

      const results: SVGFile[] = [];
      const warnings: string[] = [];

      // Enforce max-files limit on SVG-only count
      const svgFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.svg'));
      const nonSvg = fileList.filter((f) => !f.name.toLowerCase().endsWith('.svg'));

      // Reject non-SVG files immediately with individual messages
      for (const f of nonSvg) {
        const ext = f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.')).toUpperCase() : 'unknown';
        results.push(makeSVGFile(f.name, '', `Not an SVG file (${ext}). Only .svg files are supported.`));
      }

      if (svgFiles.length === 0 && nonSvg.length > 0) {
        // All files were wrong type — show a compact banner too
        addNotif(
          nonSvg.length === 1
            ? `"${nonSvg[0].name}" is not an SVG. Only .svg files are supported.`
            : `${nonSvg.length} files were skipped — only .svg files are supported.`,
        );
      }

      if (currentCount + svgFiles.length > maxFiles) {
        addNotif(`Maximum ${maxFiles} files at once. Remove some files first.`);
        // Still process what fits
        svgFiles.splice(maxFiles - currentCount);
        if (svgFiles.length === 0) {
          if (results.length) onFilesAdded(results);
          return;
        }
      }

      // Read and validate each SVG
      for (const file of svgFiles) {
        // Pre-read validation
        const validation = validateFile(file);
        if (!validation.ok) {
          results.push(makeSVGFile(file.name, '', validation.error));
          continue;
        }
        if (validation.warning) warnings.push(validation.warning);

        // Read content
        let content: string;
        try {
          content = await readFileAsText(file);
        } catch {
          results.push(makeSVGFile(file.name, '', `Could not read "${file.name}". The file may be unreadable.`));
          continue;
        }

        // Post-read content validation
        const contentError = validateSVGContent(content, file.name);
        if (contentError) {
          results.push(makeSVGFile(file.name, content, contentError));
          continue;
        }

        results.push(makeSVGFile(file.name, content));
      }

      // Surface warnings as dismissible banners (non-blocking)
      for (const w of warnings) addNotif(w, 'warning');

      if (results.length) onFilesAdded(results);
    },
    [maxFiles, onFilesAdded, addNotif],
  );

  // ── Global paste handler ─────────────────────────────────────────────────────

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLInputElement
      ) return;

      try {
        const items = Array.from(e.clipboardData?.items ?? []);

        // File items
        const svgFileItems = items.filter((i) => i.kind === 'file' && i.type === 'image/svg+xml');
        if (svgFileItems.length > 0) {
          const files = svgFileItems.map((i) => i.getAsFile()).filter((f): f is File => f !== null);
          processFiles(files);
          return;
        }

        // Text items
        const textItem = items.find((i) => i.kind === 'string' && i.type === 'text/plain');
        if (!textItem) return;

        textItem.getAsString((text) => {
          const err = validatePastedSVG(text);
          if (err) {
            addNotif(err);
            return;
          }
          onFilesAdded([makeSVGFile('pasted.svg', text.trim())]);
        });
      } catch {
        addNotif('Could not read clipboard contents. Try using the Paste Code tab instead.');
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles, onFilesAdded, addNotif]);

  // ── Drag handlers ────────────────────────────────────────────────────────────

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setDropState('dragover');
      setIconBounce(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setDropState('idle');
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setDropState('idle');
      setIconBounce(false);
      processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles],
  );

  const onZoneClick = useCallback(() => {
    if (!isProcessing && !browserError) fileInputRef.current?.click();
  }, [isProcessing, browserError]);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(Array.from(e.target.files ?? []));
      e.target.value = '';
    },
    [processFiles],
  );

  // ── Paste Code submit ────────────────────────────────────────────────────────

  const onOptimizePasteCode = useCallback(() => {
    const content = pasteCode.trim();
    const err = validatePastedSVG(content);
    if (err) { setPasteError(err); return; }
    setPasteError('');
    onFilesAdded([makeSVGFile('pasted.svg', content)]);
    setPasteCode('');
  }, [pasteCode, onFilesAdded]);

  const isDragover = dropState === 'dragover';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Browser compatibility hard error */}
      {browserError && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--error)' }}
        >
          <AlertCircle size={16} className="shrink-0" />
          {browserError}
        </div>
      )}

      {/* Tab toggle */}
      <div
        className="relative flex p-1 rounded-xl w-fit self-center"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-lg transition-transform duration-200"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-hover)',
            transform: mode === 'paste' ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
          }}
        />
        {(['upload', 'paste'] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="relative z-10 px-5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer"
            style={{ color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {m === 'upload' ? 'Upload Files' : 'Paste Code'}
          </button>
        ))}
      </div>

      {/* Notification stack (dismissible) */}
      <NotifStrip notifs={notifs} onDismiss={dismissNotif} />

      {mode === 'upload' ? (
        <>
          <div
            role="button"
            tabIndex={browserError ? -1 : 0}
            aria-label="Drop SVG files here or click to browse"
            onClick={onZoneClick}
            onKeyDown={(e) => e.key === 'Enter' && onZoneClick()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={[
              'dot-grid relative flex flex-col items-center justify-center gap-5',
              'min-h-[200px] sm:min-h-[280px] rounded-xl border-2 border-dashed',
              'transition-all duration-200 select-none overflow-hidden',
              isProcessing || browserError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
            style={
              isDragover
                ? { borderColor: 'var(--accent)', background: 'var(--accent-glow)', boxShadow: '0 0 0 1px var(--accent), 0 0 32px 4px var(--accent-glow)' }
                : { borderColor: 'var(--border)', background: 'var(--bg-secondary)' }
            }
            onMouseEnter={(e) => { if (!isDragover && !isProcessing) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
            onMouseLeave={(e) => { if (!isDragover) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {isDragover && (
              <div className="absolute inset-0 rounded-xl opacity-20 animate-ping pointer-events-none" style={{ border: '2px solid var(--accent)' }} />
            )}

            <Upload
              size={44}
              strokeWidth={1.4}
              className={iconBounce ? 'bounce-upload' : ''}
              style={{ color: isDragover ? 'var(--accent)' : 'var(--text-muted)' }}
              onAnimationEnd={() => setIconBounce(false)}
            />

            <div className="flex flex-col items-center gap-1.5 text-center px-6">
              <p className="text-base sm:text-lg font-semibold" style={{ color: isDragover ? 'var(--accent)' : 'var(--text-primary)' }}>
                {isDragover ? 'Release to upload' : 'Drop your SVGs here'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                or <span style={{ color: 'var(--text-secondary)' }}>click to browse</span> · paste SVG code · batch upload
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--border-hover)' }}>
                Up to {maxFiles} files · .svg only
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            multiple
            className="hidden"
            onChange={onFileInputChange}
          />

          <ShortcutHint />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={pasteCode}
            onChange={(e) => { setPasteCode(e.target.value); if (pasteError) setPasteError(''); }}
            placeholder="Paste your SVG code here..."
            spellCheck={false}
            className="w-full min-h-[200px] sm:min-h-[280px] rounded-xl border-2 border-dashed
                       p-4 text-sm resize-y outline-none transition-all duration-200"
            style={{
              fontFamily: 'var(--font-code), monospace',
              borderColor: pasteError ? 'rgba(248,113,113,0.5)' : 'var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = pasteError ? 'rgba(248,113,113,0.7)' : 'var(--accent)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = pasteError ? 'rgba(248,113,113,0.5)' : 'var(--border)'; }}
          />

          {/* Inline paste validation error */}
          {pasteError && (
            <div className="flex items-start gap-2 text-sm animate-fade-in" style={{ color: 'var(--error)' }}>
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{pasteError}</span>
            </div>
          )}

          <button
            onClick={onOptimizePasteCode}
            disabled={!pasteCode.trim() || isProcessing}
            className="self-end px-6 py-2 rounded-lg text-sm font-semibold
                       transition-all duration-150 active:scale-[0.98]"
            style={
              pasteCode.trim() && !isProcessing
                ? { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
                : { background: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'not-allowed' }
            }
            onMouseEnter={(e) => { if (pasteCode.trim() && !isProcessing) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { if (pasteCode.trim() && !isProcessing) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Optimize
          </button>
        </div>
      )}
    </div>
  );
}
