import { InvalidColorError } from "./errors.ts";

export interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const HEX_COLOR_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const TRANSPARENT_KEYWORDS = new Set(["transparent", "none", ""]);

export function isTransparentColor(value: string): boolean {
  return TRANSPARENT_KEYWORDS.has(value.trim().toLowerCase());
}

export function parseHexColor(value: unknown): RgbColor {
  if (typeof value !== "string") {
    throw new InvalidColorError(String(value));
  }

  const match = HEX_COLOR_PATTERN.exec(value.trim());
  if (!match) {
    throw new InvalidColorError(value);
  }

  const hex = match[1];
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

export function parseBackgroundColor(value: unknown): RgbColor | null {
  if (typeof value === "string" && isTransparentColor(value)) {
    return null;
  }
  return parseHexColor(value);
}

export function colorToHex(color: RgbColor): string {
  const toHex = (channel: number): string =>
    Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0");

  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
