import { deflateSync } from "zlib";
import type { ImageFormat, ResolvedSignature } from "../../../domain/signature.model.ts";
import type { TextRasterizerPort } from "../../../ports/outbound/text-rasterizer.port.ts";
import { crc32 } from "../codec/crc32.ts";
import { writeUInt32BE } from "../codec/bytes.ts";
import { flattenRgba } from "./flatten.ts";
import type { SignatureImageRenderer } from "./signature-image-renderer.ts";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const COLOR_TYPE_RGBA = 6;
const BYTES_PER_PIXEL = 4;
const FILTER_NONE = 0;

function makeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  writeUInt32BE(length, data.length, 0);

  const typeBuffer = Buffer.from(type, "ascii");
  const crcBuffer = Buffer.alloc(4);
  writeUInt32BE(crcBuffer, crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/** 8-bit RGBA PNG encoder (zlib compressed, non-interlaced). */
export class PngRenderer implements SignatureImageRenderer {
  readonly format: ImageFormat = "png";
  private readonly rasterizer: TextRasterizerPort;

  constructor(rasterizer: TextRasterizerPort) {
    this.rasterizer = rasterizer;
  }

  render(text: string, signature: ResolvedSignature): Buffer {
    const { width, height } = signature;

    const ihdr = Buffer.alloc(13);
    writeUInt32BE(ihdr, width, 0);
    writeUInt32BE(ihdr, height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = COLOR_TYPE_RGBA;
    ihdr[10] = 0; // deflate
    ihdr[11] = 0; // adaptive filtering
    ihdr[12] = 0; // no interlace

    const raster = this.rasterizer.rasterize(text, signature);
    const pixels = flattenRgba(raster.pixels, signature.backgroundColor);

    const rowLength = width * BYTES_PER_PIXEL;
    const raw = Buffer.alloc((rowLength + 1) * height);
    for (let y = 0; y < height; y++) {
      const rowStart = y * (rowLength + 1);
      raw[rowStart] = FILTER_NONE;
      Buffer.from(pixels.buffer, pixels.byteOffset + y * rowLength, rowLength).copy(
        raw,
        rowStart + 1
      );
    }

    // PNG requires a zlib stream (RFC 1950), not a raw deflate stream.
    const idat = deflateSync(raw);

    return Buffer.concat([
      PNG_SIGNATURE,
      makeChunk("IHDR", ihdr),
      makeChunk("IDAT", idat),
      makeChunk("IEND", Buffer.alloc(0)),
    ]);
  }
}
