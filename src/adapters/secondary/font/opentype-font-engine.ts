import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import type { Font as OpenTypeFont } from "opentype.js";
import { FontLoadError } from "../../../domain/errors.ts";
import type {
  FontMetrics,
  FontPort,
  PathCommand,
  SignatureFont,
} from "../../../ports/outbound/font.port.ts";
import { SIGNATURE_FONT_BASE64, SIGNATURE_FONT_FAMILY } from "./signature.font.base64.ts";

const BUNDLED_FONT_KEY = "<bundled>";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

class OpenTypeSignatureFont implements SignatureFont {
  readonly family: string;
  readonly data: Buffer;
  readonly metrics: FontMetrics;
  private readonly font: OpenTypeFont;

  constructor(font: OpenTypeFont, data: Buffer, fallbackFamily: string) {
    this.font = font;
    this.data = data;
    this.family = readFamilyName(font) ?? fallbackFamily;
    this.metrics = {
      unitsPerEm: font.unitsPerEm,
      ascender: font.ascender,
      descender: font.descender,
    };
  }

  hasGlyph(char: string): boolean {
    return this.font.charToGlyphIndex(char) > 0;
  }

  advance(char: string, fontSize: number): number {
    const glyph = this.font.charToGlyph(char);
    const advanceWidth = glyph.advanceWidth ?? 0;
    return (advanceWidth * fontSize) / this.font.unitsPerEm;
  }

  outline(char: string, fontSize: number): PathCommand[] {
    const glyph = this.font.charToGlyph(char);
    const path = glyph.getPath(0, 0, fontSize);
    const commands: PathCommand[] = [];

    for (const command of path.commands) {
      switch (command.type) {
        case "M":
        case "L":
          commands.push({ type: command.type, x: command.x, y: command.y });
          break;
        case "Q":
          commands.push({ type: "Q", x: command.x, y: command.y, cx: command.x1, cy: command.y1 });
          break;
        case "C":
          commands.push({
            type: "C",
            x: command.x,
            y: command.y,
            c1x: command.x1,
            c1y: command.y1,
            c2x: command.x2,
            c2y: command.y2,
          });
          break;
        case "Z":
          commands.push({ type: "Z" });
          break;
        default:
          break;
      }
    }

    return commands;
  }
}

function readFamilyName(font: OpenTypeFont): string | undefined {
  const names = font.names as unknown as Record<string, unknown> | undefined;
  const localized = (key: string): string | undefined => {
    const entry = names?.[key];
    if (entry && typeof entry === "object") {
      const values = entry as Record<string, unknown>;
      const first = values["en"] ?? Object.values(values)[0];
      if (typeof first === "string" && first.trim() !== "") {
        return first;
      }
    }
    return undefined;
  };

  return localized("fontFamily") ?? localized("fullName");
}

/**
 * Loads fonts through opentype.js and caches them per source, so repeated
 * signatures do not re-parse the same file. Falls back to the bundled
 * signature font when no `fontPath` is given.
 */
export class OpenTypeFontEngine implements FontPort {
  private readonly cache = new Map<string, SignatureFont>();

  load(fontPath?: string | null): SignatureFont {
    const key = fontPath ?? BUNDLED_FONT_KEY;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const font = fontPath ? this.loadFromFile(fontPath) : this.loadBundled();
    this.cache.set(key, font);
    return font;
  }

  private loadBundled(): SignatureFont {
    const data = Buffer.from(SIGNATURE_FONT_BASE64, "base64");
    return this.parse(data, "bundled signature font", SIGNATURE_FONT_FAMILY);
  }

  private loadFromFile(fontPath: string): SignatureFont {
    let data: Buffer;
    try {
      data = readFileSync(fontPath);
    } catch (error) {
      throw new FontLoadError(fontPath, toErrorMessage(error));
    }
    return this.parse(data, fontPath, "SignetixSignature");
  }

  private parse(data: Buffer, source: string, fallbackFamily: string): SignatureFont {
    try {
      const font = opentype.parse(toArrayBuffer(data));
      return new OpenTypeSignatureFont(font, data, fallbackFamily);
    } catch (error) {
      throw new FontLoadError(source, toErrorMessage(error));
    }
  }
}
