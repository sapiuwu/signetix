export class SignetixError extends Error {
  readonly code: string;

  constructor(message: string, code = "SIGNETIX_ERROR") {
    super(message);
    this.name = "SignetixError";
    this.code = code;
  }
}

export class InvalidColorError extends SignetixError {
  readonly value: string;

  constructor(value: string) {
    super(
      `Invalid color "${value}". Expected "#RGB" or "#RRGGBB" (or "transparent" for background).`,
      "INVALID_COLOR"
    );
    this.name = "InvalidColorError";
    this.value = value;
  }
}

export class InvalidSizeError extends SignetixError {
  readonly option: string;
  readonly value: number;

  constructor(option: string, value: number, expectation: string) {
    super(`Invalid "${option}": ${value}. Expected ${expectation}.`, "INVALID_SIZE");
    this.name = "InvalidSizeError";
    this.option = option;
    this.value = value;
  }
}

export class InvalidOptionError extends SignetixError {
  readonly option: string;

  constructor(option: string, expectation: string) {
    super(`Invalid "${option}". Expected ${expectation}.`, "INVALID_OPTION");
    this.name = "InvalidOptionError";
    this.option = option;
  }
}

export class UnsupportedFormatError extends SignetixError {
  readonly format: string;

  constructor(format: string) {
    super(`Unsupported format "${format}". Supported formats: svg, bmp, png.`, "UNSUPPORTED_FORMAT");
    this.name = "UnsupportedFormatError";
    this.format = format;
  }
}

export class FontLoadError extends SignetixError {
  readonly source: string;

  constructor(source: string, detail: string) {
    super(`Unable to load font "${source}": ${detail}`, "FONT_LOAD_ERROR");
    this.name = "FontLoadError";
    this.source = source;
  }
}
