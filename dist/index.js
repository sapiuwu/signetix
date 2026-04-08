"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  textToSignature: () => textToSignature
});
module.exports = __toCommonJS(index_exports);
var import_canvas = require("canvas");
var import_path = __toESM(require("path"));
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
    (0, import_canvas.registerFont)(import_path.default.resolve(fontPath), { family: fontFamily });
  }
  const canvas = (0, import_canvas.createCanvas)(width, height);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  textToSignature
});
