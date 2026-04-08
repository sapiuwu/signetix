// src/index.ts
import { createCanvas, registerFont } from "canvas";
import path from "path";
function textToSignature(name, options = {}) {
  const {
    width = 400,
    height = 150,
    fontSize = 48,
    color = "#fff",
    fontPath,
    fontFamily = "Great Vibes"
  } = options;
  if (fontPath) {
    registerFont(path.resolve(fontPath), { family: fontFamily });
  }
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px "${fontPath ? fontFamily : "cursive"}"`;
  ctx.textBaseline = "middle";
  const textWidth = ctx.measureText(name).width;
  const x = (width - textWidth) / 2;
  const y = height / 2;
  ctx.fillText(name, x, y);
  return canvas.toBuffer("image/png");
}
export {
  textToSignature
};
