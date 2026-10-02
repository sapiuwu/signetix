import { UnsupportedFormatError } from "../../../domain/errors.ts";
import type { ImageFormat, ResolvedSignature } from "../../../domain/signature.model.ts";
import type { SignatureRendererPort } from "../../../ports/outbound/signature-renderer.port.ts";
import type { SignatureImageRenderer } from "./signature-image-renderer.ts";

/** Implements the renderer port by dispatching to the encoder for the requested format. */
export class RendererRegistry implements SignatureRendererPort {
  private readonly renderers = new Map<ImageFormat, SignatureImageRenderer>();

  constructor(renderers: readonly SignatureImageRenderer[]) {
    for (const renderer of renderers) {
      this.renderers.set(renderer.format, renderer);
    }
  }

  render(text: string, signature: ResolvedSignature): Buffer {
    const renderer = this.renderers.get(signature.format);
    if (!renderer) {
      throw new UnsupportedFormatError(String(signature.format));
    }
    return renderer.render(text, signature);
  }

  supports(format: ImageFormat): boolean {
    return this.renderers.has(format);
  }
}
