'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: "Is SVG Crush safe? Do my files leave my computer?",
    a: "No. SVG Crush processes everything in your browser using JavaScript. Your files never leave your device — there's no server, no upload, no tracking.",
  },
  {
    q: "What's the difference between the three presets?",
    a: "Web Optimized balances compression with compatibility (recommended for most uses). Max Compression applies aggressive optimizations for the smallest possible file. Keep Editable only removes metadata, preserving the structure for re-editing in tools like Figma or Illustrator.",
  },
  {
    q: "Can I optimize multiple SVGs at once?",
    a: "Yes. Drag and drop up to 50 SVG files at once. You can download them individually or all together as a ZIP file.",
  },
  {
    q: "What does SVG optimization actually remove?",
    a: "Depending on the preset: editor metadata (Illustrator, Figma, Sketch data), XML comments, empty elements, redundant attributes, unnecessary whitespace, and it simplifies path data and color values.",
  },
  {
    q: "Is SVG Crush really free?",
    a: "Yes, completely free with no limits. No account required, no watermarks, no file size restrictions.",
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section aria-labelledby="faq-heading">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <h2 id="faq-heading" className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Frequently Asked Questions
      </h2>

      <dl
        className="flex flex-col rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {FAQS.map(({ q, a }, i) => {
          const isOpen = openIndex === i;
          const answerId = `faq-answer-${i}`;
          const questionId = `faq-question-${i}`;
          return (
            <div
              key={i}
              style={{
                borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : undefined,
                background: 'var(--bg-secondary)',
              }}
            >
              <dt>
                <button
                  id={questionId}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left
                             text-sm font-medium transition-colors duration-150 cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span>{q}</span>
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className="shrink-0 transition-transform duration-200"
                    style={{
                      color: 'var(--text-muted)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
              </dt>
              <dd
                id={answerId}
                role="region"
                aria-labelledby={questionId}
                className="overflow-hidden transition-all duration-250"
                style={{ maxHeight: isOpen ? '20rem' : '0px', opacity: isOpen ? 1 : 0 }}
                aria-hidden={!isOpen}
              >
                <p className="px-5 pb-5 pt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {a}
                </p>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
