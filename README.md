# ✍️ SIGNETIX

> Transform text into beautiful handwritten signature images.

**Signetix** is a lightweight JavaScript/TypeScript library that converts a name or text into a realistic signature image using customizable fonts and styles.

---

## 🚀 Features

- Convert text to signature (PNG)
- Custom font support (handwriting fonts recommended)
- Adjustable size, color, and styling
- Simple API & TypeScript support
- Works in Node.js

---

## 📦 Installation

```bash
npm install signetix
```

## Usage

```ts
import { textToSignature } from "signetix";
import fs from "fs";

const buffer = textToSignature("Wahyu Saputra", {
  width: 400,
  height: 150,
  fontSize: 48,
  color: "#000",
  fontPath: "./fonts/GreatVibes-Regular.ttf"
});

fs.writeFileSync("signature.png", buffer);
```