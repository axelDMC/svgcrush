import { ExternalLink, Zap } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="px-4 py-10 mt-auto" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        {/* Brand */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Zap size={12} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>SVG Crush</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Free SVG Optimizer &amp; Compressor</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-5">
          {[{ label: 'GitHub', href: 'https://github.com/axelDMC' }, { label: 'Twitter', href: 'https://x.com/Axel1863670' }].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors duration-150"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <ExternalLink size={13} />
              {label}
            </a>
          ))}
        </div>

        {/* Credit */}
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Built with <span style={{ color: '#f87171' }}>♥</span> &copy; {year}
        </span>
      </div>
    </footer>
  );
}
