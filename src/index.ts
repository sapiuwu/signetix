// ============================================================================
// SIGNETIX - composition root
//
// Hexagonal architecture wiring:
//   domain      -> pure models, value parsing and validation
//   ports       -> inbound (use case) + outbound (infrastructure) contracts
//   application -> use case services depending only on ports
//   adapters    -> primary (public API) and secondary (font/renderers/fs) implementations
// ============================================================================

import { SignatureApi } from "./adapters/primary/signature-api.ts";
import { NodeFileWriter } from "./adapters/secondary/filesystem/node-file-writer.ts";
import { OpenTypeFontEngine } from "./adapters/secondary/font/opentype-font-engine.ts";
import { GlyphTextRasterizer } from "./adapters/secondary/raster/glyph-text-rasterizer.ts";
import { BmpRenderer } from "./adapters/secondary/renderers/bmp.renderer.ts";
import { PngRenderer } from "./adapters/secondary/renderers/png.renderer.ts";
import { RendererRegistry } from "./adapters/secondary/renderers/renderer-registry.ts";
import { SvgRenderer } from "./adapters/secondary/renderers/svg.renderer.ts";
import { CreateSignatureService } from "./application/create-signature.service.ts";
import { SaveSignatureService } from "./application/save-signature.service.ts";
import type { SignatureOptions } from "./domain/signature.model.ts";
import type { FontPort } from "./ports/outbound/font.port.ts";
import type { FileWriterPort } from "./ports/outbound/file-writer.port.ts";
import type { SignatureRendererPort } from "./ports/outbound/signature-renderer.port.ts";

export type {
  ImageFormat,
  RasterImage,
  ResolvedSignature,
  SignatureDefaults,
  SignatureOptions,
  SvgFontFamily,
  SvgFontWeight,
} from "./domain/signature.model.ts";
export { DEFAULT_SIGNATURE_OPTIONS, IMAGE_FORMATS, resolveSignatureOptions } from "./domain/signature.model.ts";
export { letterJitter, letterScale } from "./domain/signature-layout.ts";
export type { RgbColor } from "./domain/color.ts";
export { colorToHex, parseBackgroundColor, parseHexColor } from "./domain/color.ts";
export {
  FontLoadError,
  InvalidColorError,
  InvalidOptionError,
  InvalidSizeError,
  SignetixError,
  UnsupportedFormatError,
} from "./domain/errors.ts";

export type { CreateSignaturePort } from "./ports/inbound/create-signature.port.ts";
export type { SaveSignaturePort } from "./ports/inbound/save-signature.port.ts";
export type { FontMetrics, FontPort, PathCommand, SignatureFont } from "./ports/outbound/font.port.ts";
export type { FileWriterPort } from "./ports/outbound/file-writer.port.ts";
export type { SignatureRendererPort } from "./ports/outbound/signature-renderer.port.ts";
export type { TextRasterizerPort } from "./ports/outbound/text-rasterizer.port.ts";

export { CreateSignatureService } from "./application/create-signature.service.ts";
export { SaveSignatureService, withFormatExtension } from "./application/save-signature.service.ts";
export { SignatureApi } from "./adapters/primary/signature-api.ts";
export { NodeFileWriter } from "./adapters/secondary/filesystem/node-file-writer.ts";
export { OpenTypeFontEngine } from "./adapters/secondary/font/opentype-font-engine.ts";
export { GlyphTextRasterizer } from "./adapters/secondary/raster/glyph-text-rasterizer.ts";
export { BmpRenderer } from "./adapters/secondary/renderers/bmp.renderer.ts";
export { PngRenderer } from "./adapters/secondary/renderers/png.renderer.ts";
export { RendererRegistry } from "./adapters/secondary/renderers/renderer-registry.ts";
export { SvgRenderer } from "./adapters/secondary/renderers/svg.renderer.ts";

export interface SignetixDependencies {
  /** Outbound port that encodes signatures; overrides the default renderers. */
  renderer?: SignatureRendererPort;
  /** Outbound port used by `saveSignature`; defaults to Node's `fs`. */
  fileWriter?: FileWriterPort;
  /** Outbound port that loads fonts; defaults to opentype.js with a bundled font. */
  fontEngine?: FontPort;
}

/**
 * Builds a fully wired application. Every dependency can be replaced with a
 * custom port implementation (dependency injection / test doubles).
 */
export function createSignetix(dependencies: SignetixDependencies = {}): SignatureApi {
  const fontEngine = dependencies.fontEngine ?? new OpenTypeFontEngine();
  const renderer =
    dependencies.renderer ??
    (() => {
      const rasterizer = new GlyphTextRasterizer(fontEngine);
      return new RendererRegistry([
        new SvgRenderer(fontEngine),
        new BmpRenderer(rasterizer),
        new PngRenderer(rasterizer),
      ]);
    })();

  const fileWriter = dependencies.fileWriter ?? new NodeFileWriter();
  const createSignature = new CreateSignatureService(renderer);
  const saveSignature = new SaveSignatureService(createSignature, fileWriter);

  return new SignatureApi({ createSignature, saveSignature });
}

const defaultApi = createSignetix();

export function textToSignature(name: string, options?: SignatureOptions): Buffer {
  return defaultApi.textToSignature(name, options);
}

export function saveSignature(name: string, filepath: string, options?: SignatureOptions): string {
  return defaultApi.saveSignature(name, filepath, options);
}
