import type { SignatureOptions } from "../domain/signature.model.ts";
import { DEFAULT_SIGNATURE_OPTIONS } from "../domain/signature.model.ts";
import type { CreateSignaturePort } from "../ports/inbound/create-signature.port.ts";
import type { SaveSignaturePort } from "../ports/inbound/save-signature.port.ts";
import type { FileWriterPort } from "../ports/outbound/file-writer.port.ts";

const EXTENSION_PATTERN = /\.(svg|bmp|png)$/i;

export function withFormatExtension(filepath: string, format: string): string {
  return EXTENSION_PATTERN.test(filepath) ? filepath : `${filepath}.${format}`;
}

export class SaveSignatureService implements SaveSignaturePort {
  private readonly createSignature: CreateSignaturePort;
  private readonly fileWriter: FileWriterPort;

  constructor(createSignature: CreateSignaturePort, fileWriter: FileWriterPort) {
    this.createSignature = createSignature;
    this.fileWriter = fileWriter;
  }

  execute(text: string, filepath: string, options: SignatureOptions = {}): string {
    const data = this.createSignature.execute(text, options);
    const format = options.format ?? DEFAULT_SIGNATURE_OPTIONS.format;
    const target = withFormatExtension(filepath, format);

    this.fileWriter.write(target, data);
    return target;
  }
}
