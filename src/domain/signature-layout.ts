/**
 * Deterministic layout noise shared by the SVG and raster adapters, so that
 * both formats wobble the text in exactly the same way and repeated calls
 * always produce identical output.
 */

function valueNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function textSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Per-letter scale multiplier around 1, scaled by `variation` (0..1). */
export function letterScale(index: number, text: string, variation: number): number {
  if (variation <= 0) {
    return 1;
  }
  return 1 + variation * (valueNoise(textSeed(text) + index * 17.13) * 2 - 1);
}

/** Per-letter vertical offset (px) around the baseline. */
export function letterJitter(index: number, text: string, jitter: number): number {
  if (jitter <= 0) {
    return 0;
  }
  return (valueNoise(textSeed(text) + index * 31.7 + 5.77) * 2 - 1) * jitter;
}
