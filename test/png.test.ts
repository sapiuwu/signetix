import assert from "node:assert/strict";
import { test } from "node:test";
import { inflateSync } from "zlib";
import { crc32 } from "../src/adapters/secondary/codec/crc32.ts";
import { textToSignature } from "../src/index.ts";

interface PngChunk {
  type: string;
  data: Buffer;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readChunks(png: Buffer): PngChunk[] {
  const chunks: PngChunk[] = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = png.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
    assert.equal(expectedCrc, actualCrc, `${type} chunk CRC`);
    chunks.push({ type, data: Buffer.from(data) });
    offset += 12 + length;
  }
  return chunks;
}

function decodePng(png: Buffer): { width: number; height: number; pixels: Buffer } {
  const chunks = readChunks(png);
  const ihdr = chunks.find((chunk) => chunk.type === "IHDR");
  const idat = chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data);

  assert.ok(ihdr, "IHDR chunk exists");
  assert.ok(chunks.some((chunk) => chunk.type === "IEND"), "IEND chunk exists");
  assert.equal(png.subarray(0, 8).compare(PNG_SIGNATURE), 0, "PNG signature");

  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  assert.equal(ihdr.data[8], 8, "bit depth");
  assert.equal(ihdr.data[9], 6, "color type RGBA");

  // IDAT must be a zlib stream (RFC 1950) - inflateSync fails on raw deflate.
  const raw = inflateSync(Buffer.concat(idat));
  const rowLength = width * 4 + 1;
  assert.equal(raw.length, rowLength * height, "decompressed scanline size");

  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * rowLength];
    assert.equal(filter, 0, `row ${y} uses filter None`);
    raw.copy(pixels, y * width * 4, y * rowLength + 1, (y + 1) * rowLength);
  }

  return { width, height, pixels };
}

function pixelAt(decoded: { width: number; pixels: Buffer }, x: number, y: number): number[] {
  const index = (y * decoded.width + x) * 4;
  return [decoded.pixels[index], decoded.pixels[index + 1], decoded.pixels[index + 2], decoded.pixels[index + 3]];
}

test("generates a structurally valid PNG", () => {
  const png = textToSignature("Alice", {
    format: "png",
    width: 500,
    height: 200,
    fontSize: 64,
    color: "#ffffff",
    backgroundColor: "transparent",
  });

  const decoded = decodePng(png);
  assert.equal(decoded.width, 500);
  assert.equal(decoded.height, 200);
});

test("keeps pixels transparent when no background is set", () => {
  const png = textToSignature("", { format: "png", width: 8, height: 4 });
  const decoded = decodePng(png);

  for (let x = 0; x < decoded.width; x++) {
    for (let y = 0; y < decoded.height; y++) {
      assert.deepEqual(pixelAt(decoded, x, y), [0, 0, 0, 0]);
    }
  }
});

test("flattens the text over the background color", () => {
  const png = textToSignature("", {
    format: "png",
    width: 8,
    height: 4,
    backgroundColor: "#00ff00",
  });
  const decoded = decodePng(png);

  assert.deepEqual(pixelAt(decoded, 0, 0), [0, 255, 0, 255]);
  assert.deepEqual(pixelAt(decoded, 7, 3), [0, 255, 0, 255]);
});

test("draws the text in the requested color", () => {
  const png = textToSignature("I", {
    format: "png",
    width: 32,
    height: 16,
    fontSize: 8,
    color: "#ff0000",
    backgroundColor: "transparent",
  });
  const decoded = decodePng(png);

  let redPixels = 0;
  for (let i = 0; i < decoded.pixels.length; i += 4) {
    if (decoded.pixels[i] === 255 && decoded.pixels[i + 3] > 0) redPixels++;
  }
  assert.ok(redPixels > 0, "expected at least one text pixel");
});

test("offsetY moves the rasterized text downwards", () => {
  const inkRows = (offsetY: number): number[] => {
    const png = textToSignature("I", {
      format: "png",
      width: 32,
      height: 32,
      fontSize: 8,
      offsetY,
    });
    const decoded = decodePng(png);
    const rows: number[] = [];
    for (let y = 0; y < decoded.height; y++) {
      for (let x = 0; x < decoded.width; x++) {
        if (decoded.pixels[(y * decoded.width + x) * 4 + 3] > 0) {
          rows.push(y);
          break;
        }
      }
    }
    return rows;
  };

  const baseline = inkRows(0);
  const shifted = inkRows(6);

  assert.ok(baseline.length > 0, "text is visible without offset");
  assert.ok(Math.min(...shifted) > Math.min(...baseline), "offsetY shifts text down");
});
