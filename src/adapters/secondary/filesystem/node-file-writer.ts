import { writeFileSync } from "node:fs";
import type { FileWriterPort } from "../../../ports/outbound/file-writer.port.ts";

/** Synchronous file writer backed by Node's `fs` module. */
export class NodeFileWriter implements FileWriterPort {
  write(filepath: string, data: Buffer): void {
    writeFileSync(filepath, data);
  }
}
