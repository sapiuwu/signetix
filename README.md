# ✍️ SIGNETIX

> Transform text into beautiful handwritten signature images.

**Signetix** is a TypeScript library that converts a name or text into a signature image (SVG, BMP, or PNG) using a real handwriting font, with optional signature-style effects (slant, baseline wobble, per-letter size variation). The core is structured with hexagonal architecture (ports & adapters).

---

## 🚀 Features

- Convert text to signature: `svg`, `bmp`, `png`
- Real script font (Great Vibes, SIL OFL 1.1) embedded into every output
- Anti-aliased raster rendering (TrueType outlines, no bitmap font)
- Signature effects: `italic`, `jitter`, `letterVariation`
- Custom font support via `fontPath` (TrueType/OpenType `.ttf`/`.otf`)
- Adjustable size, color, background, letter spacing and vertical offset
- Synchronous `saveSignature()` helper with automatic file extension
- Typed API with explicit, catchable errors
- Swappable infrastructure through ports (renderer, font engine, file writer)

---

## 📦 Installation

```bash
npm install signetix
```

## Usage

```ts
import { textToSignature, saveSignature } from "signetix";

// In-memory buffer (default format: svg)
const svg = textToSignature("Wahyu Saputra", {
  width: 400,
  height: 150,
  fontSize: 48,
  color: "#000",
});

// Write to disk - the extension is added from the format when missing
const path = saveSignature("Wahyu Saputra", "signature", {
  format: "png",
  width: 500,
  height: 200,
  color: "#12355b",
  backgroundColor: "#ffffff",
  jitter: 6,             // baseline wobble in px
  letterVariation: 0.12, // per-letter size variation (0..1)
});
```

### Options

| Option            | Type                                  | Default        | Notes                                        |
| ----------------- | ------------------------------------- | -------------- | -------------------------------------------- |
| `width`           | `number`                              | `400`          | Positive integer, px                         |
| `height`          | `number`                              | `150`          | Positive integer, px                         |
| `fontSize`        | `number`                              | `48`           | px for every format                          |
| `color`           | `string`                              | `"#000000"`    | `#RGB` or `#RRGGBB`                          |
| `backgroundColor` | `string`                              | `"transparent"`| `#RGB`, `#RRGGBB`, or `transparent`/`none`   |
| `fontFamily`      | `"cursive" \| "monospace" \| "serif"` | `"cursive"`    | SVG fallback when the embedded font is off   |
| `fontWeight`      | `"normal" \| "bold"`                  | `"normal"`     | SVG only                                     |
| `format`          | `"svg" \| "bmp" \| "png"`             | `"svg"`        |                                              |
| `letterSpacing`   | `number`                              | `0`            | Extra spacing between characters, px         |
| `offsetY`         | `number`                              | `0`            | Vertical shift, applies to every format      |
| `fontPath`        | `string`                              | bundled font   | Path to a `.ttf`/`.otf` file                 |
| `embedFont`       | `boolean`                             | `true`         | SVG: embed the font as base64 `@font-face`   |
| `italic`          | `boolean`                             | `true`         | Slant the text like handwriting              |
| `jitter`          | `number`                              | `0`            | Baseline wobble amplitude, px                |
| `letterVariation` | `number`                              | `0`            | Per-letter size variation, `0..1`            |

### Errors

```ts
import {
  FontLoadError,
  InvalidColorError,
  InvalidOptionError,
  InvalidSizeError,
  UnsupportedFormatError,
} from "signetix";
```

All library errors extend `SignetixError` and expose a stable `code`.

### Custom infrastructure (ports)

```ts
import {
  createSignetix,
  type FontPort,
  type FileWriterPort,
  type SignatureRendererPort,
} from "signetix";

const app = createSignetix({
  fontEngine: myFontEngine as FontPort,
  renderer: myRenderer as SignatureRendererPort,
  fileWriter: myFileWriter as FileWriterPort,
});
```

---

## 🧱 Architecture

```
src/
├── domain/          # models, color parsing, validation, layout noise, errors
├── ports/           # inbound (use cases) + outbound (font/renderer/file) contracts
├── application/     # CreateSignature / SaveSignature services
└── adapters/
    ├── primary/     # public API (SignatureApi)
    └── secondary/   # SVG/BMP/PNG renderers, TrueType rasterizer, font engine, fs
```

`src/index.ts` is the composition root: it wires the adapters and exports the public API. The application layer only depends on ports, so every adapter (including opentype.js) can be replaced.

---

## 🛠️ Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run demo
```

The signature font is inlined as base64 in `src/adapters/secondary/font/signature.font.base64.ts`; regenerate it with:

```bash
npm run font:embed
```

The font is a subset of [Great Vibes](https://fonts.google.com/specimen/Great+Vibes) (SIL Open Font License 1.1), kept in `assets/signetix-signature.ttf`.
