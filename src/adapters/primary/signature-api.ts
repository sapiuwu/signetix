import type { SignatureOptions } from "../../domain/signature.model.ts";
import type { CreateSignaturePort } from "../../ports/inbound/create-signature.port.ts";
import type { SaveSignaturePort } from "../../ports/inbound/save-signature.port.ts";

export interface SignatureApiDependencies {
  createSignature: CreateSignaturePort;
  saveSignature: SaveSignaturePort;
}

/**
 * Primary (driving) adapter: exposes the use cases through the library's
 * public programmatic API.
 */
export class SignatureApi {
  private readonly createSignaturePort: CreateSignaturePort;
  private readonly saveSignaturePort: SaveSignaturePort;

  constructor(dependencies: SignatureApiDependencies) {
    this.createSignaturePort = dependencies.createSignature;
    this.saveSignaturePort = dependencies.saveSignature;
  }

  textToSignature(name: string, options: SignatureOptions = {}): Buffer {
    return this.createSignaturePort.execute(name, options);
  }

  saveSignature(name: string, filepath: string, options: SignatureOptions = {}): string {
    return this.saveSignaturePort.execute(name, filepath, options);
  }
}
