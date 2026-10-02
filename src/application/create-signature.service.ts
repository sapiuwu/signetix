import { resolveSignatureOptions } from "../domain/signature.model.ts";
import type { SignatureOptions } from "../domain/signature.model.ts";
import type { CreateSignaturePort } from "../ports/inbound/create-signature.port.ts";
import type { SignatureRendererPort } from "../ports/outbound/signature-renderer.port.ts";

export class CreateSignatureService implements CreateSignaturePort {
  private readonly renderer: SignatureRendererPort;

  constructor(renderer: SignatureRendererPort) {
    this.renderer = renderer;
  }

  execute(text: string, options: SignatureOptions = {}): Buffer {
    const signature = resolveSignatureOptions(options);
    return this.renderer.render(text, signature);
  }
}
