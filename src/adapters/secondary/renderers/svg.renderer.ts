import { colorToHex } from "../../../domain/color.ts";
import { letterJitter, letterScale } from "../../../domain/signature-layout.ts";
import type { ImageFormat, ResolvedSignature } from "../../../domain/signature.model.ts";
import type { FontPort, SignatureFont } from "../../../ports/outbound/font.port.ts";
import type { SignatureImageRenderer } from "./signature-image-renderer.ts";

const XML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => XML_ESCAPES[char] ?? char);
}

function escapeCssString(value: string): string {
  return value.replace(/["\\]/g, (char) => `\\${char}`);
}

/** Quotes a CSS family name only when it cannot be written as a plain identifier list. */
function cssFamilyName(name: string): string {
  return /^[\w\- ]+$/.test(name) ? name : `"${escapeCssString(name)}"`;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export class SvgRenderer implements SignatureImageRenderer {
  readonly format: ImageFormat = "svg";
  private readonly fontEngine: FontPort;

  constructor(fontEngine: FontPort) {
    this.fontEngine = fontEngine;
  }

  render(text: string, signature: ResolvedSignature): Buffer {
    const {
      width,
      height,
      fontSize,
      color,
      backgroundColor,
      fontFamily,
      fontWeight,
      letterSpacing,
      offsetY,
      fontPath,
      embedFont,
      italic,
    } = signature;

    const font = this.fontEngine.load(fontPath);
    const background =
      backgroundColor === null
        ? ""
        : `  <rect width="100%" height="100%" fill="${colorToHex(backgroundColor)}"/>\n`;

    const x = width / 2;
    const y = height / 2 + fontSize * 0.35 + offsetY;
    const family = embedFont ? `${cssFamilyName(font.family)}, ${fontFamily}` : fontFamily;

    const attributes = [
      `x="${x}"`,
      `y="${y}"`,
      `font-family="${escapeXml(family)}"`,
      `font-size="${fontSize}"`,
      italic ? `font-style="italic"` : "",
      `font-weight="${fontWeight}"`,
      `font-kerning="none"`,
      `font-variant-ligatures="none"`,
      `fill="${colorToHex(color)}"`,
      `text-anchor="middle"`,
      `dominant-baseline="middle"`,
      `letter-spacing="${letterSpacing}"`,
    ]
      .filter((attribute) => attribute !== "")
      .map((attribute, index) => (index === 0 ? attribute : `    ${attribute}`))
      .join("\n");

    const body = this.textBody(text, signature);
    const style = embedFont ? this.fontFaceStyle(font) : "";

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
${style}${background}  <text
    ${attributes}
  >${body}</text>
</svg>`;

    return Buffer.from(svg, "utf-8");
  }

  private fontFaceStyle(font: SignatureFont): string {
    const base64 = font.data.toString("base64");
    return `  <style type="text/css">@font-face{font-family:"${escapeCssString(font.family)}";font-style:normal;font-weight:normal;src:url(data:font/ttf;base64,${base64}) format("truetype");}</style>\n`;
  }

  private textBody(text: string, signature: ResolvedSignature): string {
    const { jitter, letterVariation, fontSize } = signature;
    if (jitter <= 0 && letterVariation <= 0) {
      return escapeXml(text);
    }

    const glyphs = Array.from(text);
    const parts: string[] = [];
    let previousOffset = 0;

    for (let index = 0; index < glyphs.length; index++) {
      const offset = letterJitter(index, text, jitter);
      const dy = offset - previousOffset;
      previousOffset = offset;

      const attributes: string[] = [];
      if (dy !== 0) {
        attributes.push(`dy="${formatNumber(dy)}"`);
      }
      if (letterVariation > 0) {
        const scale = letterScale(index, text, letterVariation);
        attributes.push(`font-size="${formatNumber(fontSize * scale)}"`);
      }

      const open = attributes.length > 0 ? `<tspan ${attributes.join(" ")}>` : "<tspan>";
      parts.push(`${open}${escapeXml(glyphs[index])}</tspan>`);
    }

    return parts.join("");
  }
}
