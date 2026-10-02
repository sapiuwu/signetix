import type { ImageFormat, ResolvedSignature } from "../../../domain/signature.model.ts";

/**
 * Adapter-internal contract shared by every concrete image encoder.
 * The application layer talks to `SignatureRendererPort` instead; the
 * registry is what binds formats to these encoders.
 */
export interface SignatureImageRenderer {
  readonly format: ImageFormat;
  render(text: string, signature: ResolvedSignature): Buffer;
}
