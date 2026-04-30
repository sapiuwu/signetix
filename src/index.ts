import { deflateRawSync } from "zlib";

// ============================================================================
// TYPES & OPTIONS
// ============================================================================

export type ImageFormat = "svg" | "bmp" | "png";

export interface SignatureOptions {
  width?: number;
  height?: number;
  fontSize?: number;      // For SVG: CSS pixels; For raster: multiplier of base font
  color?: string;         // Hex color (#RGB or #RRGGBB)
  backgroundColor?: string; // Hex color or 'transparent'
  fontFamily?: "cursive" | "monospace" | "serif"; // SVG only
  fontWeight?: "normal" | "bold"; // SVG only
  format?: ImageFormat;
  letterSpacing?: number; // Extra spacing between characters (raster)
  offsetY?: number;       // Vertical adjustment
}

// ============================================================================
// SIMPLE 8x8 BITMAP FONT (ASCII 32-126)
// Zero-dependency text rendering for raster formats
// ============================================================================

const FONT_8x8: Record<number, number[]> = {
  // Each char is 8 rows of 8 bits (1 = pixel on)
  // Generated from a minimal monospace bitmap font
  32: [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00], // space
  65: [0x3C,0x66,0x66,0x7E,0x66,0x66,0x00,0x00], // A
  66: [0x7C,0x66,0x66,0x7C,0x66,0x66,0x7C,0x00], // B
  67: [0x3C,0x66,0x60,0x60,0x60,0x66,0x3C,0x00], // C
  68: [0x78,0x6C,0x66,0x66,0x66,0x6C,0x78,0x00], // D
  69: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x7E,0x00], // E
  70: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x60,0x00], // F
  71: [0x3C,0x66,0x60,0x6E,0x66,0x66,0x3C,0x00], // G
  72: [0x66,0x66,0x66,0x7E,0x66,0x66,0x66,0x00], // H
  73: [0x3C,0x18,0x18,0x18,0x18,0x18,0x3C,0x00], // I
  74: [0x1E,0x0C,0x0C,0x0C,0x0C,0x6C,0x38,0x00], // J
  75: [0x66,0x6C,0x78,0x70,0x78,0x6C,0x66,0x00], // K
  76: [0x60,0x60,0x60,0x60,0x60,0x60,0x7E,0x00], // L
  77: [0xC3,0xE7,0xFF,0xDB,0xC3,0xC3,0xC3,0x00], // M
  78: [0xC6,0xE6,0xF6,0xDE,0xCE,0xC6,0xC6,0x00], // N
  79: [0x3C,0x66,0x66,0x66,0x66,0x66,0x3C,0x00], // O
  80: [0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0x00], // P
  81: [0x3C,0x66,0x66,0x66,0x6A,0x6C,0x36,0x00], // Q
  82: [0x7C,0x66,0x66,0x7C,0x78,0x6C,0x66,0x00], // R
  83: [0x3C,0x66,0x60,0x3C,0x06,0x66,0x3C,0x00], // S
  84: [0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0x00], // T
  85: [0x66,0x66,0x66,0x66,0x66,0x66,0x3C,0x00], // U
  86: [0xC3,0xC3,0xC3,0xC3,0x66,0x3C,0x18,0x00], // V
  87: [0xC3,0xC3,0xC3,0xDB,0xFF,0xE7,0xC3,0x00], // W
  88: [0xC3,0xC3,0x66,0x3C,0x66,0xC3,0xC3,0x00], // X
  89: [0xC3,0xC3,0x66,0x3C,0x18,0x18,0x18,0x00], // Y
  90: [0x7E,0x06,0x0C,0x18,0x30,0x60,0x7E,0x00], // Z
  97: [0x00,0x00,0x38,0x0C,0x3C,0x6C,0x3E,0x00], // a
  98: [0x60,0x60,0x7C,0x66,0x66,0x66,0x7C,0x00], // b
  99: [0x00,0x00,0x3C,0x60,0x60,0x60,0x3C,0x00], // c
  100: [0x06,0x06,0x3E,0x66,0x66,0x66,0x3E,0x00], // d
  101: [0x00,0x00,0x3C,0x66,0x7E,0x60,0x3C,0x00], // e
  102: [0x1C,0x30,0x30,0x7C,0x30,0x30,0x30,0x00], // f
  103: [0x00,0x00,0x3E,0x66,0x66,0x3E,0x06,0x3C], // g
  104: [0x60,0x60,0x7C,0x66,0x66,0x66,0x66,0x00], // h
  105: [0x18,0x00,0x18,0x18,0x18,0x18,0x3C,0x00], // i
  106: [0x0C,0x00,0x0C,0x0C,0x0C,0x6C,0x6C,0x38], // j
  107: [0x60,0x60,0x66,0x6C,0x78,0x6C,0x66,0x00], // k
  108: [0x18,0x18,0x18,0x18,0x18,0x18,0x3C,0x00], // l
  109: [0x00,0x00,0xFE,0xDB,0xDB,0xDB,0xC3,0x00], // m
  110: [0x00,0x00,0x7C,0x66,0x66,0x66,0x66,0x00], // n
  111: [0x00,0x00,0x3C,0x66,0x66,0x66,0x3C,0x00], // o
  112: [0x00,0x00,0x7C,0x66,0x66,0x7C,0x60,0x60], // p
  113: [0x00,0x00,0x3E,0x66,0x66,0x3E,0x06,0x06], // q
  114: [0x00,0x00,0x6E,0x78,0x60,0x60,0x60,0x00], // r
  115: [0x00,0x00,0x3E,0x60,0x3C,0x06,0x7C,0x00], // s
  116: [0x10,0x10,0x7C,0x10,0x10,0x14,0x08,0x00], // t
  117: [0x00,0x00,0x66,0x66,0x66,0x66,0x3E,0x00], // u
  118: [0x00,0x00,0xC3,0xC3,0x66,0x3C,0x18,0x00], // v
  119: [0x00,0x00,0xC3,0xDB,0xFF,0xE7,0xC3,0x00], // w
  120: [0x00,0x00,0xC3,0x66,0x3C,0x66,0xC3,0x00], // x
  121: [0x00,0x00,0xC3,0xC3,0x66,0x3C,0x18,0x30], // y
  122: [0x00,0x00,0x7E,0x0C,0x18,0x30,0x7E,0x00], // z
  48: [0x3C,0x66,0x6E,0x76,0x66,0x66,0x3C,0x00], // 0
  49: [0x18,0x38,0x18,0x18,0x18,0x18,0x3C,0x00], // 1
  50: [0x3C,0x66,0x06,0x0C,0x18,0x30,0x7E,0x00], // 2
  51: [0x7E,0x06,0x0C,0x18,0x06,0x66,0x3C,0x00], // 3
  52: [0x0C,0x1C,0x3C,0x6C,0x7E,0x0C,0x0C,0x00], // 4
  53: [0x7E,0x60,0x7C,0x06,0x06,0x66,0x3C,0x00], // 5
  54: [0x3C,0x60,0x60,0x7C,0x66,0x66,0x3C,0x00], // 6
  55: [0x7E,0x06,0x0C,0x18,0x30,0x30,0x30,0x00], // 7
  56: [0x3C,0x66,0x66,0x3C,0x66,0x66,0x3C,0x00], // 8
  57: [0x3C,0x66,0x66,0x3E,0x06,0x0C,0x38,0x00], // 9
  33: [0x18,0x18,0x18,0x18,0x18,0x00,0x18,0x00], // !
  63: [0x3C,0x66,0x0C,0x18,0x18,0x00,0x18,0x00], // ?
  46: [0x00,0x00,0x00,0x00,0x00,0x18,0x18,0x00], // .
  44: [0x00,0x00,0x00,0x00,0x18,0x18,0x30,0x00], // ,
  45: [0x00,0x00,0x00,0x7E,0x00,0x00,0x00,0x00], // -
  34: [0x66,0x66,0x24,0x00,0x00,0x00,0x00,0x00], // "
  39: [0x18,0x18,0x30,0x00,0x00,0x00,0x00,0x00], // '
  40: [0x0C,0x18,0x30,0x30,0x30,0x18,0x0C,0x00], // (
  41: [0x30,0x18,0x0C,0x0C,0x0C,0x18,0x30,0x00], // )
  // Add more chars as needed...
};

// Fallback for missing characters
const FONT_FALLBACK = Array(8).fill(0x00);

// ============================================================================
// UTILITIES
// ============================================================================

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function crc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[i] = crc >>> 0;
  }
  return table;
}

const CRC_TABLE = crc32Table();

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeUInt32BE(buf: Buffer, value: number, offset: number): void {
  buf[offset] = (value >>> 24) & 0xFF;
  buf[offset + 1] = (value >>> 16) & 0xFF;
  buf[offset + 2] = (value >>> 8) & 0xFF;
  buf[offset + 3] = value & 0xFF;
}

function writeUInt32LE(buf: Buffer, value: number, offset: number): void {
  buf[offset] = value & 0xFF;
  buf[offset + 1] = (value >>> 8) & 0xFF;
  buf[offset + 2] = (value >>> 16) & 0xFF;
  buf[offset + 3] = (value >>> 24) & 0xFF;
}

// ============================================================================
// TEXT RASTERIZATION (for BMP/PNG)
// ============================================================================

function renderTextToBitmap(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  color: { r: number; g: number; b: number },
  letterSpacing: number = 0
): Uint8Array {
  // RGBA buffer (4 bytes per pixel)
  const buffer = new Uint8Array(width * height * 4);
  const baseFontW = 8;
  const baseFontH = 8;
  const scale = Math.max(1, Math.floor(fontSize / baseFontH));
  const charWidth = baseFontW * scale + letterSpacing * scale;

  let cursorX = Math.max(0, Math.floor((width - text.length * charWidth) / 2));
  const cursorY = Math.max(0, Math.floor((height - baseFontH * scale) / 2));

  for (const char of text) {
    const code = char.charCodeAt(0);
    const glyph = FONT_8x8[code] || FONT_FALLBACK;

    for (let row = 0; row < baseFontH; row++) {
      const bits = glyph[row];
      for (let col = 0; col < baseFontW; col++) {
        if (bits & (0x80 >>> col)) {
          // Draw scaled pixel
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = cursorX + col * scale + sx;
              const py = cursorY + row * scale + sy;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                buffer[idx] = color.r;
                buffer[idx + 1] = color.g;
                buffer[idx + 2] = color.b;
                buffer[idx + 3] = 255; // alpha
              }
            }
          }
        }
      }
    }
    cursorX += charWidth;
  }

  return buffer;
}

// ============================================================================
// SVG GENERATOR
// ============================================================================

function generateSVG(
  name: string,
  options: Required<Omit<SignatureOptions, "format">>
): Buffer {
  const { width, height, fontSize, color, backgroundColor, fontFamily, fontWeight, letterSpacing, offsetY } = options;
  
  const escapedName = name.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  }[c] || c));

  const bg = backgroundColor === "transparent" 
    ? "" 
    : `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;

  // SVG text positioning (approximate centering)
  const x = width / 2;
  const y = height / 2 + fontSize * 0.35 + (offsetY || 0);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  ${bg}
  <text
    x="${x}"
    y="${y}"
    font-family="${fontFamily}"
    font-size="${fontSize}"
    font-weight="${fontWeight}"
    fill="${color}"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="${letterSpacing || 0}"
  >${escapedName}</text>
</svg>`;

  return Buffer.from(svg, "utf-8");
}

// ============================================================================
// BMP GENERATOR (24-bit, uncompressed)
// ============================================================================

function generateBMP(
  name: string,
  options: Required<Omit<SignatureOptions, "format" | "fontFamily" | "fontWeight">>
): Buffer {
  const { width, height, fontSize, color, backgroundColor, letterSpacing, offsetY } = options;
  
  const rowBytes = Math.ceil((width * 3) / 4) * 4; // BMP rows are 4-byte aligned
  const pixelDataSize = rowBytes * height;
  const fileSize = 54 + pixelDataSize; // 54-byte header

  const buffer = Buffer.alloc(fileSize);
  
  // BMP File Header (14 bytes)
  buffer.write("BM", 0);
  writeUInt32LE(buffer, fileSize, 2);
  writeUInt32LE(buffer, 54, 10); // pixel data offset

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  writeUInt32LE(buffer, 40, 14); // header size
  writeUInt32LE(buffer, width, 18);
  writeUInt32LE(buffer, -height, 22); // negative = top-down DIB
  writeUInt32LE(buffer, 1, 26); // planes
  writeUInt32LE(buffer, 24, 28); // bits per pixel
  writeUInt32LE(buffer, 0, 30); // no compression
  writeUInt32LE(buffer, pixelDataSize, 34);
  writeUInt32LE(buffer, 2835, 38); // ~72 DPI X
  writeUInt32LE(buffer, 2835, 42); // ~72 DPI Y
  writeUInt32LE(buffer, 0, 46); // no palette
  writeUInt32LE(buffer, 0, 50); // no important colors

  // Render text to RGBA bitmap
  const rgba = renderTextToBitmap(name, width, height, fontSize, parseHexColor(color), letterSpacing);
  
  // Parse background
  const bg = backgroundColor === "transparent" ? null : parseHexColor(backgroundColor);

  // Write pixel data (BGR order, top-down)
  let pixelOffset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];
      const a = rgba[idx + 3];

      if (a === 255) {
        buffer[pixelOffset++] = b;
        buffer[pixelOffset++] = g;
        buffer[pixelOffset++] = r;
      } else if (bg) {
        buffer[pixelOffset++] = bg.b;
        buffer[pixelOffset++] = bg.g;
        buffer[pixelOffset++] = bg.r;
      } else {
        // transparent -> black for BMP (no alpha support)
        buffer[pixelOffset++] = 0;
        buffer[pixelOffset++] = 0;
        buffer[pixelOffset++] = 0;
      }
    }
    // Row padding
    while (pixelOffset % 4 !== 0) {
      buffer[pixelOffset++] = 0;
    }
  }

  return buffer;
}

// ============================================================================
// PNG GENERATOR (8-bit RGBA, Deflate compressed)
// Uses Node.js built-in zlib
// ============================================================================

function generatePNG(
  name: string,
  options: Required<Omit<SignatureOptions, "format" | "fontFamily" | "fontWeight">>
): Buffer {
  const { width, height, fontSize, color, backgroundColor, letterSpacing, offsetY } = options;
  
  const chunks: Buffer[] = [];

  // PNG Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  writeUInt32BE(ihdrData, width, 0);
  writeUInt32BE(ihdrData, height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: 6 = RGBA
  ihdrData[10] = 0; // compression: deflate
  ihdrData[11] = 0; // filter: adaptive
  ihdrData[12] = 0; // interlace: none
  chunks.push(makeChunk("IHDR", ihdrData));

  // Render text to RGBA bitmap
  const rgba = renderTextToBitmap(name, width, height, fontSize, parseHexColor(color), letterSpacing);
  const bg = backgroundColor === "transparent" ? null : parseHexColor(backgroundColor);

  // Prepare raw pixel data with filter bytes (one per row)
  const rawRows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(width * 4 + 1);
    row[0] = 0; // filter type: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];
      const a = rgba[idx + 3];

      const offset = 1 + x * 4;
      if (a === 255) {
        row[offset] = r;
        row[offset + 1] = g;
        row[offset + 2] = b;
        row[offset + 3] = a;
      } else if (bg) {
        row[offset] = bg.r;
        row[offset + 1] = bg.g;
        row[offset + 2] = bg.b;
        row[offset + 3] = 255;
      } else {
        // transparent pixel
        row[offset] = 0;
        row[offset + 1] = 0;
        row[offset + 2] = 0;
        row[offset + 3] = 0;
      }
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);
  const compressed = deflateRawSync(rawData);
  chunks.push(makeChunk("IDAT", compressed));

  // IEND Chunk
  chunks.push(makeChunk("IEND", Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function makeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  writeUInt32BE(length, data.length, 0);
  
  const typeBuf = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  writeUInt32BE(crc, crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuf, data, crc]);
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function textToSignature(
  name: string,
  options: SignatureOptions = {}
): Buffer {
  const {
    width = 400,
    height = 150,
    fontSize = 48,
    color = "#000000",
    backgroundColor = "transparent",
    fontFamily = "cursive",
    fontWeight = "normal",
    format = "svg",
    letterSpacing = 0,
    offsetY = 0
  } = options;

  const resolvedOptions = {
    width, height, fontSize, color, backgroundColor,
    fontFamily, fontWeight, letterSpacing, offsetY
  };

  switch (format) {
    case "svg":
      return generateSVG(name, resolvedOptions as any);
    case "bmp":
      return generateBMP(name, resolvedOptions as any);
    case "png":
      return generatePNG(name, resolvedOptions as any);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// ============================================================================
// HELPER: Write to file (Node.js)
// ============================================================================

export function saveSignature(
  name: string,
  filepath: string,
  options: SignatureOptions = {}
): void {
  const { format = "svg" } = options;
  const buffer = textToSignature(name, options);
  
  // Auto-append extension if missing
  const finalPath = filepath.match(/\.(svg|bmp|png)$/i) 
    ? filepath 
    : `${filepath}.${format}`;
  
  import("fs").then(({ writeFileSync }) => {
    writeFileSync(finalPath, buffer);
  }).catch(err => {
    // Fallback for sync usage
    require("fs").writeFileSync(finalPath, buffer);
  });
}