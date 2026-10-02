import type { SignatureOptions } from "../../domain/signature.model.ts";

/**
 * Inbound (driving) port: the "create signature" use case.
 */
export interface CreateSignaturePort {
  execute(text: string, options?: SignatureOptions): Buffer;
}
