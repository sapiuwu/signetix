import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { saveSignature, textToSignature, withFormatExtension } from "../src/index.ts";

const tempDirectory = mkdtempSync(join(tmpdir(), "signetix-"));

after(() => {
  rmSync(tempDirectory, { recursive: true, force: true });
});

test("appends the format extension when missing", () => {
  assert.equal(withFormatExtension("signature", "png"), "signature.png");
  assert.equal(withFormatExtension("signature.bmp", "png"), "signature.bmp");
  assert.equal(withFormatExtension("out/name.PNG", "svg"), "out/name.PNG");
});

test("writes the signature synchronously and returns the final path", () => {
  const target = join(tempDirectory, "alice");
  const path = saveSignature("Alice", target, { format: "png", width: 64, height: 32 });

  assert.equal(path, `${target}.png`);
  assert.ok(existsSync(path), "file must exist right after the call");

  const written = readFileSync(path);
  assert.deepEqual(written, textToSignature("Alice", { format: "png", width: 64, height: 32 }));
});

test("keeps an explicit extension", () => {
  const target = join(tempDirectory, "bob.svg");
  const path = saveSignature("Bob", target);

  assert.equal(path, target);
  assert.match(readFileSync(path, "utf-8"), /Bob/);
});
