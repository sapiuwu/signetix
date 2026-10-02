import type { RgbColor } from "../../../domain/color.ts";

/**
 * Resolves anti-aliased text pixels over an optional background:
 * - with a background: blends the glyph color over it and returns opaque pixels;
 * - without a background: keeps straight (non-premultiplied) alpha so PNG keeps
 *   soft edges.
 */
export function flattenRgba(pixels: Uint8Array, background: RgbColor | null): Uint8Array {
  const output = new Uint8Array(pixels.length);

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];

    if (background) {
      const ratio = alpha / 255;
      output[i] = Math.round(background.r + (pixels[i] - background.r) * ratio);
      output[i + 1] = Math.round(background.g + (pixels[i + 1] - background.g) * ratio);
      output[i + 2] = Math.round(background.b + (pixels[i + 2] - background.b) * ratio);
      output[i + 3] = 255;
    } else if (alpha > 0) {
      output[i] = pixels[i];
      output[i + 1] = pixels[i + 1];
      output[i + 2] = pixels[i + 2];
      output[i + 3] = alpha;
    }
  }

  return output;
}
