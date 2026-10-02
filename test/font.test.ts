import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FontLoadError,
  InvalidOptionError,
  InvalidSizeError,
  resolveSignatureOptions,
  textToSignature,
} from "../src/index.ts";

const BUNDLED_FONT_PATH = "assets/signetix-signature.ttf";

test("embeds the bundled signature font as a base64 @font-face", () => {
  const svg = textToSignature("Jane Doe").toString("utf-8");

  assert.match(svg, /<style type="text\/css">@font-face\{font-family:"Great Vibes"/);
  assert.match(svg, /src:url\(data:font\/ttf;base64,[A-Za-z0-9+/=]+\) format\("truetype"\)/);
  assert.match(svg, /font-family="Great Vibes, cursive"/);
  assert.match(svg, /font-style="italic"/);
});

test("disables kerning and ligatures so SVG matches the raster layout", () => {
  const svg = textToSignature("AV wave").toString("utf-8");

  assert.match(svg, /font-kerning="none"/);
  assert.match(svg, /font-variant-ligatures="none"/);
});

test("loads a custom font from fontPath", () => {
  const svg = textToSignature("Jane Doe", { fontPath: BUNDLED_FONT_PATH }).toString("utf-8");

  assert.match(svg, /@font-face\{font-family:"Great Vibes"/);
  assert.match(svg, /font-family="Great Vibes, cursive"/);
});

test("raises FontLoadError for a missing font file", () => {
  assert.throws(
    () => textToSignature("Jane", { fontPath: "./does-not-exist.ttf" }),
    FontLoadError
  );
});

test("raises FontLoadError for a file that is not a font", () => {
  assert.throws(() => textToSignature("Jane", { fontPath: "alice.png" }), FontLoadError);
});

test("italic can be turned off", () => {
  const italic = textToSignature("Jane", { italic: true }).toString("utf-8");
  const upright = textToSignature("Jane", { italic: false }).toString("utf-8");

  assert.match(italic, /font-style="italic"/);
  assert.ok(!upright.includes('font-style="italic"'));
});

test("jitter splits the text into wobbling tspans", () => {
  const straight = textToSignature("Jane", { jitter: 0 }).toString("utf-8");
  const wobbly = textToSignature("Jane", { jitter: 4 }).toString("utf-8");

  assert.ok(!straight.includes("<tspan"));
  assert.match(wobbly, /<tspan dy="[-0-9.]+">/);
  assert.match(wobbly, /<tspan dy="[-0-9.]+">J<\/tspan><tspan dy="[-0-9.]+">a<\/tspan>/);
});

test("letterVariation gives every letter its own size", () => {
  const flat = textToSignature("Wave", { letterVariation: 0 }).toString("utf-8");
  const varied = textToSignature("Wave", { letterVariation: 0.25 }).toString("utf-8");

  assert.ok(!flat.includes("<tspan"));
  const sizes = [...varied.matchAll(/<tspan[^>]*font-size="([0-9.]+)"/g)].map((match) => match[1]);
  assert.ok(sizes.length >= 4, "every letter carries a font-size");
  assert.ok(new Set(sizes).size > 1, "letter sizes vary");
});

test("jitter changes the rasterized output deterministically", () => {
  const options = { format: "png" as const, width: 120, height: 60, fontSize: 32 };
  const straight = textToSignature("Wave", options);
  const wobbly = textToSignature("Wave", { ...options, jitter: 5 });
  const wobblyAgain = textToSignature("Wave", { ...options, jitter: 5 });

  assert.notDeepEqual(straight, wobbly, "jitter visibly moves pixels");
  assert.deepEqual(wobbly, wobblyAgain, "output stays reproducible");
});

test("validates the new style options", () => {
  assert.throws(() => resolveSignatureOptions({ fontPath: "" }), InvalidOptionError);
  assert.throws(() => resolveSignatureOptions({ embedFont: "yes" as never }), InvalidOptionError);
  assert.throws(() => resolveSignatureOptions({ italic: 1 as never }), InvalidOptionError);
  assert.throws(() => resolveSignatureOptions({ jitter: -1 }), InvalidSizeError);
  assert.throws(() => resolveSignatureOptions({ letterVariation: 1.5 }), InvalidSizeError);

  const resolved = resolveSignatureOptions();
  assert.equal(resolved.fontPath, null);
  assert.equal(resolved.embedFont, true);
  assert.equal(resolved.italic, true);
  assert.equal(resolved.jitter, 0);
  assert.equal(resolved.letterVariation, 0);
});
