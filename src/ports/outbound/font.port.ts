/**
 * Outbound (driven) port: provides font metrics, glyph advances and glyph
 * outlines for the requested font (bundled signature font by default).
 */
export type PathCommand =
  | { type: "M"; x: number; y: number }
  | { type: "L"; x: number; y: number }
  | { type: "Q"; x: number; y: number; cx: number; cy: number }
  | { type: "C"; x: number; y: number; c1x: number; c1y: number; c2x: number; c2y: number }
  | { type: "Z" };

export interface FontMetrics {
  readonly unitsPerEm: number;
  readonly ascender: number;
  readonly descender: number;
}

export interface SignatureFont {
  readonly family: string;
  /** Raw font bytes, used by the SVG renderer to embed the font. */
  readonly data: Buffer;
  readonly metrics: FontMetrics;
  hasGlyph(char: string): boolean;
  /** Horizontal advance in px for a single character at `fontSize`. */
  advance(char: string, fontSize: number): number;
  /**
   * Glyph outline in px with the origin on the baseline and y growing
   * downwards (screen coordinates).
   */
  outline(char: string, fontSize: number): PathCommand[];
}

export interface FontPort {
  load(fontPath?: string | null): SignatureFont;
}
