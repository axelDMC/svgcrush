export interface SVGFile {
  id: string;
  name: string;
  originalContent: string;
  optimizedContent: string;
  originalSize: number;
  optimizedSize: number;
  reduction: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

export type PresetName = 'web' | 'max' | 'editable';

export interface OptimizationResult {
  optimized: string;
  originalSize: number;
  optimizedSize: number;
  reduction: number;
}
