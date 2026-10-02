import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InvalidColorError,
  InvalidSizeError,
  UnsupportedFormatError,
  resolveSignatureOptions,
  textToSignature,
} from "../src/index.ts";

test("defaults to an SVG signature", () => {
  const svg = textToSignature("John Doe").toString("utf-8");

  assert.match(svg, /^<\?xml version="1\.0"/);
  assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="400" height="150">/);
  assert.match(svg, />John Doe<\/text>/);
  assert.match(svg, /fill="#000000"/);
});

test("escapes XML metacharacters in the text", () => {
  const svg = textToSignature('A&B <"C">').toString("utf-8");

  assert.ok(!svg.includes('A&B <"C">'));
  assert.match(svg, /A&amp;B &lt;&quot;C&quot;&gt;/);
});

test("adds a background rect only when a background color is set", () => {
  const transparent = textToSignature("A", { format: "svg" }).toString("utf-8");
  const colored = textToSignature("A", { format: "svg", backgroundColor: "#123456" }).toString("utf-8");

  assert.ok(!transparent.includes("<rect"));
  assert.match(colored, /<rect width="100%" height="100%" fill="#123456"\/>/);
});

test("normalizes short hex colors", () => {
  const svg = textToSignature("A", { color: "#f0a" }).toString("utf-8");

  assert.match(svg, /fill="#ff00aa"/);
});

test("rejects invalid colors", () => {
  assert.throws(() => textToSignature("A", { color: "red" }), InvalidColorError);
  assert.throws(() => resolveSignatureOptions({ backgroundColor: "bluish" }), InvalidColorError);
});

test("rejects invalid sizes", () => {
  assert.throws(() => resolveSignatureOptions({ width: 0 }), InvalidSizeError);
  assert.throws(() => resolveSignatureOptions({ height: -10 }), InvalidSizeError);
  assert.throws(() => resolveSignatureOptions({ fontSize: Number.NaN }), InvalidSizeError);
  assert.throws(() => resolveSignatureOptions({ offsetY: Number.POSITIVE_INFINITY }), InvalidSizeError);
});

test("rejects unsupported formats", () => {
  const options = { format: "gif" } as unknown as Parameters<typeof textToSignature>[1];
  assert.throws(() => textToSignature("A", options), UnsupportedFormatError);
});

test("resolveSignatureOptions resolves defaults and explicit values", () => {
  const resolved = resolveSignatureOptions({ width: 320, color: "#abcdef", backgroundColor: "transparent" });

  assert.equal(resolved.format, "svg");
  assert.equal(resolved.width, 320);
  assert.equal(resolved.height, 150);
  assert.deepEqual(resolved.color, { r: 0xab, g: 0xcd, b: 0xef });
  assert.equal(resolved.backgroundColor, null);
  assert.equal(resolved.fontFamily, "cursive");
});

test("applies offsetY to the SVG baseline", () => {
  const baseline = textToSignature("A", { width: 400, height: 150, fontSize: 48 }).toString("utf-8");
  const shifted = textToSignature("A", { width: 400, height: 150, fontSize: 48, offsetY: 5 }).toString("utf-8");

  assert.match(baseline, /\sy="91\.8"/);
  assert.match(shifted, /\sy="96\.8"/);
});

test("supports custom SVG font settings", () => {
  const svg = textToSignature("A", {
    fontFamily: "monospace",
    fontWeight: "bold",
    embedFont: false,
    italic: false,
  }).toString("utf-8");

  assert.ok(!svg.includes("@font-face"));
  assert.match(svg, /font-family="monospace"/);
  assert.match(svg, /font-weight="bold"/);
  assert.ok(!svg.includes('font-style="italic"'));
});
