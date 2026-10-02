import type { ImageFormat, ResolvedSignature } from "../../../domain/signature.model.ts";
import type { TextRasterizerPort } from "../../../ports/outbound/text-rasterizer.port.ts";
import { writeInt32LE, writeUInt32LE } from "../codec/bytes.ts";
import { flattenRgba } from "./flatten.ts";
import type { SignatureImageRenderer } from "./signature-image-renderer.ts";

const HEADER_SIZE = 54; // 14-byte file header + 40-byte BITMAPINFOHEADER
const BITS_PER_PIXEL = 24;

/** 24-bit uncompressed, top-down BMP encoder. */
export class BmpRenderer implements SignatureImageRenderer {
  readonly format: ImageFormat = "bmp";
  private readonly rasterizer: TextRasterizerPort;

  constructor(rasterizer: TextRasterizerPort) {
    this.rasterizer = rasterizer;
  }

  render(text: string, signature: ResolvedSignature): Buffer {
    const { width, height } = signature;

    // BMP rows are padded to a 4-byte boundary relative to the pixel data,
    // NOT relative to the start of the file.
    const rowBytes = Math.ceil((width * 3) / 4) * 4;
    const pixelDataSize = rowBytes * height;
    const fileSize = HEADER_SIZE + pixelDataSize;

    const buffer = Buffer.alloc(fileSize);

    // File header (14 bytes)
    buffer.write("BM", 0, "ascii");
    writeUInt32LE(buffer, fileSize, 2);
    writeUInt32LE(buffer, HEADER_SIZE, 10);

    // DIB header: BITMAPINFOHEADER (40 bytes)
    writeUInt32LE(buffer, 40, 14);
    writeUInt32LE(buffer, width, 18);
    writeInt32LE(buffer, -height, 22); // negative height = top-down bitmap
    writeUInt32LE(buffer, 1, 26); // planes
    writeUInt32LE(buffer, BITS_PER_PIXEL, 28);
    writeUInt32LE(buffer, 0, 30); // BI_RGB (no compression)
    writeUInt32LE(buffer, pixelDataSize, 34);
    writeUInt32LE(buffer, 2835, 38); // ~72 DPI
    writeUInt32LE(buffer, 2835, 42);
    writeUInt32LE(buffer, 0, 46); // no palette
    writeUInt32LE(buffer, 0, 50); // no important colors

    const raster = this.rasterizer.rasterize(text, signature);
    // BMP has no alpha channel: composite over the background, or over black.
    const background = signature.backgroundColor ?? { r: 0, g: 0, b: 0 };
    const pixels = flattenRgba(raster.pixels, background);

    for (let y = 0; y < height; y++) {
      const rowStart = HEADER_SIZE + y * rowBytes;
      for (let x = 0; x < width; x++) {
        const source = (y * width + x) * 4;
        const target = rowStart + x * 3;
        buffer[target] = pixels[source + 2]; // B
        buffer[target + 1] = pixels[source + 1]; // G
        buffer[target + 2] = pixels[source]; // R
      }
      // Row padding bytes stay zero thanks to Buffer.alloc.
    }

    return buffer;
  }
}
