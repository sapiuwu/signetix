import { textToSignature } from "signetix";
import fs from "fs";

const buffer = textToSignature("Wahyu Saputra", {
  fontPath: "./GreatVibes-Regular.ttf",
});

fs.writeFileSync("signature.png", buffer);
