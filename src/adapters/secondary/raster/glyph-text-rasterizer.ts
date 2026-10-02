import { letterJitter, letterScale } from "../../../domain/signature-layout.ts";
import type { RasterImage, ResolvedSignature } from "../../../domain/signature.model.ts";
import type { FontPort } from "../../../ports/outbound/font.port.ts";
import type { TextRasterizerPort } from "../../../ports/outbound/text-rasterizer.port.ts";
import { fillPath } from "./path-fill.ts";

const ITALIC_SLANT_DEGREES = 12;

export class GlyphTextRasterizer implements TextRasterizerPort {
  private readonly fontEngine: FontPort;

  constructor(fontEngine: FontPort) {
    this.fontEngine = fontEngine;
  }

  rasterize(text: string, signature: ResolvedSignature): RasterImage {
    const {
      width,
      height,
      fontSize,
      color,
      letterSpacing,
      offsetY,
      fontPath,
      italic,
      jitter,
      letterVariation,
    } = signature;

    const font = this.fontEngine.load(fontPath);
    const glyphs = Array.from(text);

    const sizes = glyphs.map((_, index) => fontSize * letterScale(index, text, letterVariation));
    const advances = glyphs.map((char, index) => font.advance(char, sizes[index]));
    const spacing = Math.max(0, glyphs.length - 1) * letterSpacing;
    const textWidth = advances.reduce((sum, advance) => sum + advance, 0) + spacing;

    const { unitsPerEm, ascender, descender } = font.metrics;
    const ascent = (ascender * fontSize) / unitsPerEm;
    const descent = (-descender * fontSize) / unitsPerEm;
    const baselineY = (height - (ascent + descent)) / 2 + ascent + offsetY;
    const slant = italic ? Math.tan((ITALIC_SLANT_DEGREES * Math.PI) / 180) : 0;

    const coverage = new Float32Array(width * height);
    let cursorX = (width - textWidth) / 2;

    for (let index = 0; index < glyphs.length; index++) {
      const shiftY = baselineY + letterJitter(index, text, jitter);
      const outline = font.outline(glyphs[index], sizes[index]);

      if (outline.length > 0) {
        fillPath(outline, width, height, coverage, (x, y) => ({
          x: x - y * slant + cursorX,
          y: y + shiftY,
        }));
      }

      cursorX += advances[index] + letterSpacing;
    }

    const pixels = new Uint8Array(width * height * 4);
    for (let index = 0; index < coverage.length; index++) {
      const alpha = Math.min(255, Math.round(coverage[index] * 255));
      if (alpha === 0) continue;

      const offset = index * 4;
      pixels[offset] = color.r;
      pixels[offset + 1] = color.g;
      pixels[offset + 2] = color.b;
      pixels[offset + 3] = alpha;
    }

    return { width, height, pixels };
  }
}
