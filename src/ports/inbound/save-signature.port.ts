import type { SignatureOptions } from "../../domain/signature.model.ts";

/**
 * Inbound (driving) port: the "save signature to disk" use case.
 * Returns the final file path that was written.
 */
export interface SaveSignaturePort {
  execute(text: string, filepath: string, options?: SignatureOptions): string;
}
