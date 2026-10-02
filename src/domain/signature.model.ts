import { parseBackgroundColor, parseHexColor, type RgbColor } from "./color.ts";
import { InvalidOptionError, InvalidSizeError, UnsupportedFormatError } from "./errors.ts";

export type ImageFormat = "svg" | "bmp" | "png";
export type SvgFontFamily = "cursive" | "monospace" | "serif";
export type SvgFontWeight = "normal" | "bold";

export const IMAGE_FORMATS: readonly ImageFormat[] = ["svg", "bmp", "png"];

export interface SignatureOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontFamily?: SvgFontFamily;
  fontWeight?: SvgFontWeight;
  format?: ImageFormat;
  letterSpacing?: number;
  offsetY?: number;
  /** Path to a TrueType/OpenType font file. Defaults to the bundled signature font. */
  fontPath?: string;
  /** SVG only: embed the font as a base64 `@font-face` so the file is self-contained. */
  embedFont?: boolean;
  /** Slant the text like handwriting. */
  italic?: boolean;
  /** Baseline wobble amplitude in px (0 = perfectly straight). */
  jitter?: number;
  /** Per-letter size variation, 0..1 (0 = every letter the same size). */
  letterVariation?: number;
}

/** Fully validated options, ready to be consumed by an adapter. */
export interface ResolvedSignature {
  readonly format: ImageFormat;
  readonly width: number;
  readonly height: number;
  readonly fontSize: number;
  readonly color: RgbColor;
  readonly backgroundColor: RgbColor | null;
  readonly fontFamily: SvgFontFamily;
  readonly fontWeight: SvgFontWeight;
  readonly letterSpacing: number;
  readonly offsetY: number;
  readonly fontPath: string | null;
  readonly embedFont: boolean;
  readonly italic: boolean;
  readonly jitter: number;
  readonly letterVariation: number;
}

/** RGBA bitmap produced by a rasterizer port. */
export interface RasterImage {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

export interface SignatureDefaults extends Required<Omit<SignatureOptions, "fontPath">> {
  readonly fontPath: string | null;
}

export const DEFAULT_SIGNATURE_OPTIONS: SignatureDefaults = {
  width: 400,
  height: 150,
  fontSize: 48,
  color: "#000000",
  backgroundColor: "transparent",
  fontFamily: "cursive",
  fontWeight: "normal",
  format: "svg",
  letterSpacing: 0,
  offsetY: 0,
  fontPath: null,
  embedFont: true,
  italic: true,
  jitter: 0,
  letterVariation: 0,
};

function positiveInteger(option: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new InvalidSizeError(option, Number(value), "a positive integer");
  }
  return value;
}

function positiveNumber(option: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new InvalidSizeError(option, Number(value), "a positive number");
  }
  return value;
}

function finiteNumber(option: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new InvalidSizeError(option, Number(value), "a finite number");
  }
  return value;
}

function nonNegativeNumber(option: string, value: unknown): number {
  const number = finiteNumber(option, value);
  if (number < 0) {
    throw new InvalidSizeError(option, number, "a non-negative number");
  }
  return number;
}

function ratioNumber(option: string, value: unknown): number {
  const number = finiteNumber(option, value);
  if (number < 0 || number > 1) {
    throw new InvalidSizeError(option, number, "a number between 0 and 1");
  }
  return number;
}

function booleanOption(option: string, value: unknown, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "boolean") {
    throw new InvalidOptionError(option, "a boolean");
  }
  return value;
}

function fontPathOption(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidOptionError("fontPath", "a non-empty file path");
  }
  return value;
}

export function isImageFormat(value: unknown): value is ImageFormat {
  return IMAGE_FORMATS.includes(value as ImageFormat);
}

export function resolveSignatureOptions(options: SignatureOptions = {}): ResolvedSignature {
  const defaults = DEFAULT_SIGNATURE_OPTIONS;
  const format = options.format ?? defaults.format;

  if (!isImageFormat(format)) {
    throw new UnsupportedFormatError(String(format));
  }

  return {
    format,
    width: positiveInteger("width", options.width ?? defaults.width),
    height: positiveInteger("height", options.height ?? defaults.height),
    fontSize: positiveNumber("fontSize", options.fontSize ?? defaults.fontSize),
    color: parseHexColor(options.color ?? defaults.color),
    backgroundColor: parseBackgroundColor(options.backgroundColor ?? defaults.backgroundColor),
    fontFamily: options.fontFamily ?? defaults.fontFamily,
    fontWeight: options.fontWeight ?? defaults.fontWeight,
    letterSpacing: finiteNumber("letterSpacing", options.letterSpacing ?? defaults.letterSpacing),
    offsetY: finiteNumber("offsetY", options.offsetY ?? defaults.offsetY),
    fontPath: fontPathOption(options.fontPath),
    embedFont: booleanOption("embedFont", options.embedFont, defaults.embedFont),
    italic: booleanOption("italic", options.italic, defaults.italic),
    jitter: nonNegativeNumber("jitter", options.jitter ?? defaults.jitter),
    letterVariation: ratioNumber("letterVariation", options.letterVariation ?? defaults.letterVariation),
  };
}
