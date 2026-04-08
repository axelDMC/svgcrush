import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, 'og-image.svg');
const outPath = join(__dirname, '..', 'public', 'og-image.png');

const svg = readFileSync(svgPath);

await sharp(svg)
  .png({ quality: 95, compressionLevel: 9 })
  .toFile(outPath);

console.log('✓ og-image.png generated at public/og-image.png');
