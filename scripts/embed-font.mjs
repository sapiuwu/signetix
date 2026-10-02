import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Regenerates the inlined font module from the subsetted TrueType font.
// The subset step (requires fonttools) is optional and only needed when the
// glyph coverage has to change:
//   python -m fontTools.subset GreatVibes-Regular.ttf \
//     --output-file=assets/signetix-signature.ttf \
//     --unicodes="U+0020-00FF,U+0100-017F,U+2013-2014,U+2018-201D,U+2026,U+20AC,U+2122" \
//     --no-hinting

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "assets", "signetix-signature.ttf");
const target = join(root, "src", "adapters", "secondary", "font", "signature.font.base64.ts");
const family = "Great Vibes";

const base64 = readFileSync(source).toString("base64");
const content = `// Generated from assets/signetix-signature.ttf (Great Vibes, SIL OFL 1.1).
// Do not edit by hand: run \`npm run font:embed\` to regenerate.
export const SIGNATURE_FONT_FAMILY = "${family}";
export const SIGNATURE_FONT_BASE64 = "${base64}";
`;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, content);
console.log(`Embedded ${base64.length} base64 chars from ${source}`);
