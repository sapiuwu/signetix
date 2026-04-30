import { textToSignature } from './src/index.ts';
import { writeFileSync } from 'node:fs';              // ✅ ESM import

// 1. Generate SVG (prints to console)
const svg = textToSignature("John Doe", { format: "svg", fontSize: 56 });
console.log(svg.toString());

// 2. Generate PNG & save to disk
const png = textToSignature("Alice", {
  format: "png",
  width: 500,
  height: 200,
  fontSize: 64,
  color: "#fff",
  backgroundColor: "transparent"
});

writeFileSync("alice.png", png); // ✅ ESM-compatible file save
console.log("✅ Saved alice.png");