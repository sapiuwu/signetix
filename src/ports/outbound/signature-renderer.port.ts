import type { ResolvedSignature } from "../../domain/signature.model.ts";

/**
 * Outbound (driven) port: turns a text plus resolved signature options into
 * encoded image bytes for a specific format.
 */
export interface SignatureRendererPort {
  render(text: string, signature: ResolvedSignature): Buffer;
}
