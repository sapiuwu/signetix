import assert from "node:assert/strict";
import { test } from "node:test";
import { textToSignature } from "../src/index.ts";

const HEADER_SIZE = 54;

function rowStride(width: number): number {
  return Math.ceil((width * 3) / 4) * 4;
}

test("writes a valid 24-bit BMP header", () => {
  const width = 13;
  const height = 7;
  const bmp = textToSignature("A", { format: "bmp", width, height, fontSize: 8 });

  assert.equal(bmp.toString("ascii", 0, 2), "BM");
  assert.equal(bmp.readUInt32LE(2), HEADER_SIZE + rowStride(width) * height, "file size");
  assert.equal(bmp.readUInt32LE(10), HEADER_SIZE, "pixel data offset");
  assert.equal(bmp.readUInt32LE(14), 40, "DIB header size");
  assert.equal(bmp.readInt32LE(18), width, "width");
  assert.equal(bmp.readInt32LE(22), -height, "negative height = top-down");
  assert.equal(bmp.readUInt16LE(26), 1, "planes");
  assert.equal(bmp.readUInt16LE(28), 24, "bits per pixel");
  assert.equal(bmp.readUInt32LE(30), 0, "BI_RGB");
  assert.equal(bmp.readUInt32LE(34), rowStride(width) * height, "image size");
  assert.equal(bmp.length, HEADER_SIZE + rowStride(width) * height, "buffer length");
});

test("keeps rows 4-byte aligned relative to the pixel data", () => {
  // 2 px * 3 bytes = 6 bytes, so each row needs 2 padding bytes.
  const bmp = textToSignature("", {
    format: "bmp",
    width: 2,
    height: 2,
    backgroundColor: "#00ff00",
  });

  const greenPixel = [0, 255, 0]; // BGR
  const row0 = HEADER_SIZE;
  const row1 = HEADER_SIZE + rowStride(2);

  assert.deepEqual([...bmp.subarray(row0, row0 + 6)], [...greenPixel, ...greenPixel]);
  assert.deepEqual([...bmp.subarray(row0 + 6, row0 + 8)], [0, 0], "row 0 padding");
  assert.deepEqual([...bmp.subarray(row1, row1 + 6)], [...greenPixel, ...greenPixel], "row 1 stays aligned");
});

test("renders transparent pixels as black when BMP has no background", () => {
  const bmp = textToSignature("", { format: "bmp", width: 4, height: 3 });
  const pixels = bmp.subarray(HEADER_SIZE);

  assert.deepEqual([...pixels], [...pixels].map(() => 0));
});

test("draws the text over the background color", () => {
  const bmp = textToSignature("I", {
    format: "bmp",
    width: 300,
    height: 160,
    fontSize: 96,
    color: "#ff0000",
    backgroundColor: "#00ff00",
    italic: false,
  });

  // Blended over green: red dominates once glyph coverage passes 50%.
  let redPixels = 0;
  for (let offset = HEADER_SIZE; offset + 2 < bmp.length; offset += 3) {
    const b = bmp[offset];
    const g = bmp[offset + 1];
    const r = bmp[offset + 2];
    if (r > 128 && g < 128 && b < 64) redPixels++;
  }

  assert.ok(redPixels > 0, "expected at least one red text pixel");
});
