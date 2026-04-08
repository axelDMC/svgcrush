import { optimize } from 'svgo/browser';
import type { Config } from 'svgo';
import type { OptimizationResult, PresetName } from '@/types';

const PRESETS: Record<PresetName, Config> = {
  web: {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupNumericValues: { floatPrecision: 3 },
            convertColors: { shorthex: true, shortname: true },
          },
        },
      },
    ],
  },

  max: {
    multipass: true,
    floatPrecision: 1,
    plugins: [
      {
        name: 'preset-default',
        params: {
          floatPrecision: 1,
          overrides: {
            cleanupNumericValues: { floatPrecision: 1 },
            convertColors: { shorthex: true, shortname: true },
            convertPathData: {
              floatPrecision: 1,
              transformPrecision: 1,
              applyTransforms: true,
              applyTransformsStroked: true,
              straightCurves: true,
              lineShorthands: true,
              curveSmoothShorthands: true,
              removeUseless: true,
              collapseRepeated: true,
              utilizeAbsolute: true,
              leadingZero: true,
              negativeExtraSpace: true,
            },
          },
        },
      },
      'removeDimensions',
    ],
  },

  editable: {
    multipass: false,
    plugins: [
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeEditorsNSData',
      'cleanupAttrs',
      'removeEmptyAttrs',
      'removeEmptyContainers',
    ],
  },
};

export function optimizeSVG(svgString: string, preset: PresetName): OptimizationResult {
  const originalSize = new TextEncoder().encode(svgString).length;

  let result: ReturnType<typeof optimize>;
  try {
    result = optimize(svgString, PRESETS[preset]);
  } catch (err: unknown) {
    const detail =
      err instanceof Error
        ? err.message.split('\n')[0].slice(0, 120)
        : 'Unknown error';
    throw new Error(`SVGO could not parse this SVG: ${detail}`);
  }

  if (!result.data) {
    throw new Error('SVGO returned empty output — the SVG may be corrupted.');
  }

  const optimizedSize = new TextEncoder().encode(result.data).length;
  const reduction =
    originalSize > 0
      ? Math.round(((originalSize - optimizedSize) / originalSize) * 1000) / 10
      : 0;

  return {
    optimized: result.data,
    originalSize,
    optimizedSize,
    reduction,
  };
}
