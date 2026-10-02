import type { RasterImage, ResolvedSignature } from "../../domain/signature.model.ts";

/**
 * Outbound (driven) port: rasterizes text into an RGBA bitmap.
 * Used by the raster based renderers (BMP/PNG).
 */
export interface TextRasterizerPort {
  rasterize(text: string, signature: ResolvedSignature): RasterImage;
}
