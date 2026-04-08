export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isValidSVG(content: string): boolean {
  return content.trimStart().includes('<svg');
}

export function getFileName(name: string, suffix: string): string {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return `${name}${suffix}`;
  return `${name.slice(0, dot)}${suffix}${name.slice(dot)}`;
}

// ── Rich file validation ──────────────────────────────────────────────────────

const SVG_EXTENSIONS = new Set(['.svg']);
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10 MB

export type ValidationResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string };

/** Validate a raw File object before reading. Returns error/warning text. */
export function validateFile(file: File): ValidationResult {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!SVG_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `"${file.name}" is not an SVG. Only .svg files are supported.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: `"${file.name}" is empty.` };
  }
  if (file.size > LARGE_FILE_THRESHOLD) {
    return {
      ok: true,
      warning: `"${file.name}" is ${formatBytes(file.size)} — processing may take a moment.`,
    };
  }
  return { ok: true };
}

/** Validate SVG string content after reading. */
export function validateSVGContent(content: string, fileName = 'file'): string | null {
  if (!content.trim()) return `"${fileName}" is empty.`;
  if (!isValidSVG(content)) {
    return `"${fileName}" does not appear to be valid SVG. SVG files must contain an <svg element.`;
  }
  return null;
}

/** Check if pasted text looks like SVG code. */
export function validatePastedSVG(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return 'Nothing to optimize — paste your SVG code first.';
  if (!isValidSVG(trimmed)) {
    return "This doesn't look like valid SVG code. SVG should start with <svg or contain an <svg element.";
  }
  return null;
}

/** Check browser API availability. */
export function checkBrowserAPIs(): string | null {
  if (typeof FileReader === 'undefined') {
    return 'Your browser does not support the File API needed to read SVG files.';
  }
  return null;
}
