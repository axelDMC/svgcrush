import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE_URL = "https://svgcrush.shop";

export const metadata: Metadata = {
  title: "SVG Crush — Free SVG Optimizer & Compressor Online",
  description:
    "Optimize and compress SVG files instantly in your browser. No server uploads, no file size limits. Batch processing, three presets, 100% private. Free forever.",
  keywords:
    "svg optimizer, svg compressor, svg minifier, optimize svg online, compress svg, svg cleaner, reduce svg size, svgo online",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "SVG Crush — Free SVG Optimizer & Compressor Online",
    description:
      "Optimize and compress SVG files instantly in your browser. No server uploads, no file size limits. Free forever.",
    type: "website",
    url: SITE_URL,
    siteName: "SVG Crush",
  },
  twitter: {
    card: "summary_large_image",
    title: "SVG Crush — Free SVG Optimizer & Compressor Online",
    description:
      "Optimize and compress SVG files instantly in your browser. No server uploads, no file size limits. Free forever.",
  },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SVG Crush",
  url: SITE_URL,
  description: "Free online SVG optimizer and compressor. Runs entirely in your browser.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
