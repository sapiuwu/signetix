interface SignatureOptions {
    width?: number;
    height?: number;
    fontSize?: number;
    color?: string;
    fontPath?: string;
    fontFamily?: string;
}
declare function textToSignature(name: string, options?: SignatureOptions): Buffer;

export { type SignatureOptions, textToSignature };
