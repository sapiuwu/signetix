import { saveSignature, textToSignature } from "./src/index.ts";

// 1. Generate SVG (font is embedded, structure printed without the base64 blob)
const svg = textToSignature("John Doe", { format: "svg", fontSize: 56, jitter: 4 });
const printable = svg.toString("utf-8").replace(/base64,[A-Za-z0-9+/=]+/, "base64,<omitted>");
console.log(printable.slice(0, 800));

// 2. Generate PNG & save to disk (extension is appended automatically)
const path = saveSignature("Alice", "alice", {
  format: "png",
  width: 500,
  height: 200,
  fontSize: 64,
  color: "#12355b",
  backgroundColor: "transparent",
  jitter: 5,
  letterVariation: 0.1,
});

console.log(`Saved ${path}`);
