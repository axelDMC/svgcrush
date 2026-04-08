'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  AlertCircle,
  Check,
  Code,
  Download,
  Gauge,
  MonitorCheck,
  Package,
  RotateCcw,
  Shield,
  Zap,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FAQSection from '@/components/FAQSection';
import SVGDropzone from '@/components/SVGDropzone';
import SVGPreview from '@/components/SVGPreview';
import OptimizationControls from '@/components/OptimizationControls';
import BatchPanel from '@/components/BatchPanel';

import { optimizeSVG } from '@/lib/optimizer';
import { generateId, getFileName, validateFile, validateSVGContent } from '@/lib/utils';
import type { PresetName, SVGFile } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyResult(file: SVGFile, preset: PresetName): SVGFile {
  if (file.status === 'error') return file;

  // Guard: empty content shouldn't reach here, but double-check
  if (!file.originalContent.trim()) {
    return { ...file, status: 'error', error: 'This SVG file is empty.' };
  }

  try {
    const r = optimizeSVG(file.originalContent, preset);

    // Already optimized — reduction is 0 or negative
    const note =
      r.reduction <= 0
        ? 'Already optimized — no further compression possible.'
        : undefined;

    return {
      ...file,
      optimizedContent: r.optimized,
      optimizedSize: r.optimizedSize,
      reduction: Math.max(0, r.reduction), // clamp to 0 minimum for display
      status: 'done',
      // Overwrite any prior error; store "already optimized" in error slot as info
      error: note,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'This SVG could not be processed. It may be corrupted or use unsupported features.';
    return { ...file, status: 'error', error: msg };
  }
}

function FileErrorCard({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-5 py-4 text-sm animate-fade-in"
      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--error)' }}
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

// ── SEO sections ──────────────────────────────────────────────────────────────

function WhySection() {
  const cards = [
    { Icon: Gauge, title: 'Faster Load Times', body: 'Smaller SVGs mean faster page loads, better Core Web Vitals scores, and improved SEO rankings. Every kilobyte counts.' },
    { Icon: Code, title: 'Cleaner Code', body: 'Remove editor metadata, comments, and redundant attributes automatically. Export from Figma or Illustrator with confidence.' },
    { Icon: MonitorCheck, title: 'Better Compatibility', body: 'Strip problematic elements that cause rendering issues across browsers. Get consistent SVGs everywhere.' },
  ];
  return (
    <section aria-labelledby="why-heading">
      <h2 id="why-heading" className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Why optimize your SVGs?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl p-5 flex flex-col gap-3 transition-colors duration-150"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-glow)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Icon size={17} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: '1', label: 'Upload', desc: 'Drop your SVG files or paste code directly' },
    { n: '2', label: 'Optimize', desc: 'Choose a preset and see results instantly' },
    { n: '3', label: 'Download', desc: 'Get your optimized files individually or as a ZIP' },
  ];
  return (
    <section aria-labelledby="how-heading">
      <h2 id="how-heading" className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        How It Works
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {steps.map(({ n, label, desc }) => (
          <div key={n} className="flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-glow)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{n}</span>
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Download button with checkmark feedback ───────────────────────────────────

function DownloadButton({
  onClick,
  disabled,
  children,
  fullWidth = false,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (disabled) return;
    onClick();
    setDone(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1800);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                  transition-all duration-150 active:scale-[0.98]
                  ${fullWidth ? 'w-full sm:w-auto' : ''}`}
      style={
        !disabled
          ? { background: done ? 'var(--bg-tertiary)' : 'var(--accent)', color: done ? 'var(--accent)' : '#fff', cursor: 'pointer', border: done ? '1px solid var(--accent)' : '1px solid transparent' }
          : { background: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'not-allowed', border: '1px solid transparent' }
      }
      onMouseEnter={(e) => {
        if (!disabled && !done) e.currentTarget.style.background = 'var(--accent-hover)';
      }}
      onMouseLeave={(e) => {
        if (!disabled && !done) e.currentTarget.style.background = 'var(--accent)';
      }}
    >
      {done ? <><Check size={14} /> Done!</> : children}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [files, setFiles] = useState<SVGFile[]>([]);
  const [preset, setPreset] = useState<PresetName>('web');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const presetRef = useRef(preset);
  presetRef.current = preset;

  // Apply theme class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') html.classList.add('light');
    else html.classList.remove('light');
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd+S — download
      if (mod && e.key === 's') {
        e.preventDefault();
        const doneFiles = files.filter((f) => f.status === 'done');
        if (!doneFiles.length || isProcessing) return;
        if (files.length > 1) {
          const zip = new JSZip();
          for (const f of doneFiles) zip.file(getFileName(f.name, '.min'), f.optimizedContent);
          zip.generateAsync({ type: 'blob' }).then((blob) => saveAs(blob, 'svgcrush-optimized.zip'));
        } else {
          const f = doneFiles[0];
          saveAs(new Blob([f.optimizedContent], { type: 'image/svg+xml' }), getFileName(f.name, '.min'));
        }
        return;
      }

      // Escape — close code panel or deselect file
      if (e.key === 'Escape') {
        if (showCode) { setShowCode(false); return; }
        if (activeId && files.length > 1) setActiveId(null);
        return;
      }

      // Delete / Backspace — remove selected file (batch only)
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeId && files.length > 1) {
        const target = document.activeElement;
        // Don't intercept when user is typing in an input/textarea
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
        const file = files.find((f) => f.id === activeId);
        if (!file) return;
        if (window.confirm(`Remove "${file.name}" from the list?`)) {
          setFiles((prev) => prev.filter((f) => f.id !== activeId));
          setActiveId((prev) => {
            const remaining = files.filter((f) => f.id !== prev);
            return remaining[0]?.id ?? null;
          });
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [files, activeId, showCode, isProcessing]);

  // Process pending files sequentially
  const processFiles = useCallback(async (pending: SVGFile[]) => {
    setIsProcessing(true);
    for (const file of pending) {
      if (file.status === 'error') continue;
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' } : f)));
      await new Promise<void>((r) => setTimeout(r, 0));
      const result = applyResult(file, presetRef.current);
      setFiles((prev) => prev.map((f) => (f.id === file.id ? result : f)));
    }
    setIsProcessing(false);
  }, []);

  const handleFilesAdded = useCallback(
    (incoming: SVGFile[]) => {
      setFiles((prev) => {
        const ids = new Set(prev.map((f) => f.id));
        return [...prev, ...incoming.filter((f) => !ids.has(f.id))];
      });
      setActiveId((prev) => prev ?? incoming[0]?.id ?? null);
      processFiles(incoming.filter((f) => f.status !== 'error'));
    },
    [processFiles],
  );

  const handlePresetChange = useCallback(
    async (next: PresetName) => {
      setPreset(next);
      presetRef.current = next;
      if (files.length === 0) return;
      setIsProcessing(true);
      setFiles((prev) => prev.map((f) => (f.status !== 'error' ? { ...f, status: 'processing' } : f)));
      await new Promise<void>((r) => setTimeout(r, 16));
      setFiles((prev) => prev.map((f) => (f.status === 'error' ? f : applyResult(f, next))));
      setIsProcessing(false);
    },
    [files.length],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setActiveId((prev) => {
        if (prev !== id) return prev;
        const remaining = files.filter((f) => f.id !== id);
        return remaining[0]?.id ?? null;
      });
    },
    [files],
  );

  const downloadSingle = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file || file.status !== 'done') return;
      saveAs(new Blob([file.optimizedContent], { type: 'image/svg+xml' }), getFileName(file.name, '.min'));
    },
    [files],
  );

  const downloadZip = useCallback(async () => {
    const done = files.filter((f) => f.status === 'done');
    if (!done.length) return;
    const zip = new JSZip();
    for (const f of done) zip.file(getFileName(f.name, '.min'), f.optimizedContent);
    saveAs(await zip.generateAsync({ type: 'blob' }), 'svgcrush-optimized.zip');
  }, [files]);

  const clearAll = useCallback(() => { setFiles([]); setActiveId(null); setIsProcessing(false); }, []);

  // Derived
  const hasFiles = files.length > 0;
  const isBatch = files.length > 1;
  const activeFile = files.find((f) => f.id === activeId) ?? files[0] ?? null;
  const doneFiles = files.filter((f) => f.status === 'done');
  const canDownload = activeFile?.status === 'done';

  useEffect(() => {
    if (!activeId && files.length > 0) setActiveId(files[0].id);
  }, [activeId, files]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header theme={theme} onThemeToggle={toggleTheme} />

      <main className="flex-1 w-full flex flex-col">
        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto w-full px-4 pt-10 sm:pt-14 pb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 leading-tight">
            SVG Optimizer Online —{' '}
            <span style={{ color: 'var(--accent)' }}>Free &amp; Private</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-7 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Compress and clean SVG files instantly in your browser.{' '}
            <span style={{ color: 'var(--text-primary)' }}>No server uploads.</span>{' '}
            No file size limits.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[
              { Icon: Shield, label: '100% Private' },
              { Icon: Zap, label: 'Instant Results' },
              { Icon: Package, label: 'Batch Support' },
            ].map(({ Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Icon size={12} style={{ color: 'var(--accent)' }} />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* ── Tool ── */}
        <section className="max-w-5xl mx-auto w-full px-4 pb-10 flex flex-col gap-5">
          <OptimizationControls selected={preset} onChange={handlePresetChange} />

          {!hasFiles ? (
            <SVGDropzone onFilesAdded={handleFilesAdded} isProcessing={isProcessing} />
          ) : (
            <div className="flex flex-col gap-5 animate-fade-up">
              {/* Action bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 text-sm transition-colors duration-150 cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <RotateCcw size={13} />
                  Start Over
                </button>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Add more */}
                  <label
                    className="text-sm transition-colors duration-150 cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                  >
                    + Add more
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const fileList = Array.from(e.target.files ?? []);
                        e.target.value = '';
                        if (!fileList.length) return;
                        Promise.all(
                          fileList.map((f) =>
                            new Promise<SVGFile>((resolve) => {
                              const preCheck = validateFile(f);
                              if (!preCheck.ok) {
                                resolve({ id: generateId(), name: f.name, originalContent: '', optimizedContent: '', originalSize: 0, optimizedSize: 0, reduction: 0, status: 'error', error: preCheck.error });
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                const content = reader.result as string;
                                const contentErr = validateSVGContent(content, f.name);
                                resolve({
                                  id: generateId(), name: f.name,
                                  originalContent: content, optimizedContent: '',
                                  originalSize: new TextEncoder().encode(content).length,
                                  optimizedSize: 0, reduction: 0,
                                  status: contentErr ? 'error' : 'pending',
                                  error: contentErr ?? undefined,
                                });
                              };
                              reader.onerror = () => resolve({ id: generateId(), name: f.name, originalContent: '', optimizedContent: '', originalSize: 0, optimizedSize: 0, reduction: 0, status: 'error', error: `Could not read "${f.name}"` });
                              reader.readAsText(f);
                            }),
                          ),
                        ).then(handleFilesAdded);
                      }}
                    />
                  </label>

                  {isBatch ? (
                    <DownloadButton onClick={downloadZip} disabled={doneFiles.length === 0 || isProcessing} fullWidth>
                      <Download size={14} />
                      Download All as ZIP
                      {doneFiles.length > 0 && <span className="opacity-60 text-xs">({doneFiles.length})</span>}
                    </DownloadButton>
                  ) : (
                    <DownloadButton
                      onClick={() => activeFile && downloadSingle(activeFile.id)}
                      disabled={!canDownload || isProcessing}
                      fullWidth
                    >
                      <Download size={14} />
                      Download Optimized SVG
                    </DownloadButton>
                  )}
                </div>
              </div>

              {isBatch && (
                <BatchPanel
                  files={files}
                  selectedFileId={activeId}
                  onSelectFile={setActiveId}
                  onRemoveFile={removeFile}
                  onClearAll={clearAll}
                  onDownloadAll={downloadZip}
                  onDownloadSingle={downloadSingle}
                />
              )}

              {activeFile?.status === 'done' && (
                <SVGPreview
                  original={activeFile.originalContent}
                  optimized={activeFile.optimizedContent}
                  originalSize={activeFile.originalSize}
                  optimizedSize={activeFile.optimizedSize}
                  reduction={activeFile.reduction}
                  note={activeFile.error} // "Already optimized" info note
                  showCode={showCode}
                  onShowCodeChange={setShowCode}
                />
              )}

              {activeFile?.status === 'processing' && (
                <div className="flex items-center justify-center py-16 gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  Optimizing…
                </div>
              )}

              {activeFile?.status === 'pending' && !isProcessing && (
                <div className="flex items-center justify-center py-16 gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Queued for optimization…
                </div>
              )}

              {activeFile?.status === 'error' && (
                <FileErrorCard message={activeFile.error ?? 'An error occurred processing this file.'} />
              )}
            </div>
          )}
        </section>

        {/* ── SEO sections ── */}
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
          <div className="max-w-5xl mx-auto w-full px-4 py-16 flex flex-col gap-16">
            <WhySection />
            <HowItWorksSection />
            <FAQSection />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
