/**
 * Outbound (driven) port: persists encoded signature bytes.
 */
export interface FileWriterPort {
  write(filepath: string, data: Buffer): void;
}
