import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "public", "ocr");
const copy = async (source, target) => {
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(root, "node_modules", source), target);
};

await copy("tesseract.js/dist/worker.min.js", join(output, "worker.min.js"));
await copy("tesseract.js-core/tesseract-core.wasm.js", join(output, "tesseract-core.wasm.js"));
await copy("tesseract.js-core/tesseract-core.wasm", join(output, "tesseract-core.wasm"));
await copy("@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", join(output, "lang", "eng.traineddata.gz"));
