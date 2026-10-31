import { createWorker } from "tesseract.js";
import { degreesToDirection } from "./directions";
import { PlanRoom, ROOM_COLORS, WallSide } from "./types";

type OCRBox = { x0: number; y0: number; x1: number; y1: number };
type OCRLine = { text: string; confidence?: number; bbox?: OCRBox; words?: { text: string; bbox: OCRBox }[] };
export type PlanImageAnalysis = { rooms: PlanRoom[]; recognizedText: string; warnings: string[] };

function parseDimensionPair(text: string) {
  const normalized = text.toUpperCase()
    .replace(/[OQ]/g, "0").replace(/[I|]/g, "1")
    .replace(/[‐‑–—]/g, "-").replace(/[×*]/g, "X");
  // Plans commonly omit one or more marks during OCR: 10'-0"X12'-7",
  // 10'0X12'7, and even 100X127 should all be readable.
  const measurement = String.raw`(\d{1,3}(?:(?:\s*['′’°]\s*-?\s*|\s*-\s*)\d{1,2})?)`;
  const match = normalized.match(new RegExp(`${measurement}\\s*["″'′’°]?\\s*X\\s*${measurement}`));

  const toFeet = (raw: string) => {
    const value = raw.trim().replace(/["″]/g, "").replace(/\s+/g, "");
    const compound = value.match(/^(\d{1,2})(?:['′’°.-]\s*-?|-)(\d{1,2})$/);
    if (compound) {
      const feet = Number(compound[1]); const inches = Number(compound[2]);
      return inches < 12 ? feet + inches / 12 : null;
    }
    // OCR often drops apostrophes from compact feet/inches, e.g. 10'0 -> 100.
    if (/^\d{3}$/.test(value)) {
      const feet = Number(value.slice(0, -1)); const inches = Number(value.slice(-1));
      return feet + inches / 12;
    }
    if (/^\d{1,2}$/.test(value)) return Number(value);
    return null;
  };
  const validPair = (length: number | null, width: number | null) => length !== null && width !== null && length >= 1 && width >= 1 && length <= 80 && width <= 80;
  if (match) {
    const length = toFeet(match[1]); const width = toFeet(match[2]);
    if (validPair(length, width)) return { length, width };
  }

  // Some scans drop the multiplication sign and put each dimension on its own line.
  const tokens = [...normalized.matchAll(/(?<![A-Z])(?:\d{1,2}(?:\s*['′’°.-]\s*-?\s*\d{1,2})?|\d{3})(?!\d)/g)].map(item => toFeet(item[0]));
  const usable = tokens.filter((value): value is number => value !== null && value >= 1 && value <= 80);
  if (usable.length >= 2 && validPair(usable[0], usable[1])) return { length: usable[0], width: usable[1] };
  return null;
}

function roomLabelBox(line: OCRLine) {
  const roomWords = line.words?.filter(word => /balcon|toilet|washroom|bath|kitchen|bed|foyer|entrance|store|utility|wash|living|dining|hall|pooja|study/i.test(word.text));
  if (!roomWords?.length) return line.bbox;
  return {
    x0: Math.min(...roomWords.map(word => word.bbox.x0)), y0: Math.min(...roomWords.map(word => word.bbox.y0)),
    x1: Math.max(...roomWords.map(word => word.bbox.x1)), y1: Math.max(...roomWords.map(word => word.bbox.y1)),
  };
}

function classifyRoom(text: string) {
  const value = text.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  if (/balcon/.test(value)) return { type: "Balcony", name: "Balcony" };
  if (/toilet|washroom|bath(room)?/.test(value)) return { type: "Washroom", name: "Washroom" };
  if (/kitchen/.test(value)) return { type: "Kitchen", name: "Kitchen" };
  if (/bed\s*room|bedroom/.test(value)) return { type: "Bedroom", name: "Bedroom" };
  if (/foyer|entrance/.test(value)) return { type: "Foyer", name: "Foyer" };
  if (/store/.test(value)) return { type: "Store", name: "Store" };
  if (/wash|utility/.test(value)) return { type: "Utility", name: "Wash Area" };
  if (/living|dining|hall/.test(value)) return { type: "Hall", name: /dining/.test(value) ? "Living / Dining" : "Living Room" };
  if (/pooja/.test(value)) return { type: "Pooja", name: "Pooja" };
  if (/study/.test(value)) return { type: "Study", name: "Study" };
  return null;
}

function preprocessImage(source: string) {
  return new Promise<{ canvas: HTMLCanvasElement; originalCanvas: HTMLCanvasElement; scale: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(2.6, Math.max(1, 2200 / image.width));
      const originalCanvas = document.createElement("canvas"); originalCanvas.width = image.width; originalCanvas.height = image.height;
      const originalContext = originalCanvas.getContext("2d");
      if (!originalContext) return reject(new Error("Could not prepare the uploaded image for reading."));
      originalContext.drawImage(image, 0, 0);
      const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return reject(new Error("Could not prepare the image for local reading."));
      context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const gray = pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114;
        const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.65 + 128));
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = contrast;
      }
      context.putImageData(pixels, 0, 0); resolve({ canvas, originalCanvas, scale });
    };
    image.onerror = () => reject(new Error("Could not open the uploaded floor-plan image.")); image.src = source;
  });
}

export async function analyzeFloorPlanImage(source: string, onProgress: (progress: number, message: string) => void): Promise<PlanImageAnalysis> {
  const { canvas, originalCanvas, scale } = await preprocessImage(source);
  const worker = await createWorker("eng", 1, {
    workerPath: `${import.meta.env.BASE_URL}ocr/worker.min.js`,
    corePath: `${import.meta.env.BASE_URL}ocr/tesseract-core.wasm.js`,
    langPath: `${import.meta.env.BASE_URL}ocr/lang`,
    gzip: true,
    logger: event => {
      if (event.status === "loading tesseract core") onProgress(12, "Starting local image reader…");
      if (event.status === "loading language traineddata") onProgress(24, "Loading offline English recognition data…");
      if (event.status === "recognizing text") onProgress(48 + Math.round((event.progress || 0) * 38), "Reading room labels and dimensions…");
    },
  });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: "11" as any }); // Sparse text layout is better suited to labels inside a floor plan.
    const readLines = async (image: HTMLCanvasElement, multiplier: number) => {
      const { data } = await worker.recognize(image, {}, { text: true, blocks: true });
      // Tesseract.js v7 nests line output under blocks > paragraphs > lines.
      return ((data as any).blocks || []).flatMap((block: any) =>
        (block.paragraphs || []).flatMap((paragraph: any) =>
          (paragraph.lines || []).map((line: any) => ({
            text: (line.text || (line.words || []).map((word: any) => word.text).join(" ")).trim(),
            confidence: line.confidence,
            bbox: line.bbox ? { x0: line.bbox.x0 * multiplier, y0: line.bbox.y0 * multiplier, x1: line.bbox.x1 * multiplier, y1: line.bbox.y1 * multiplier } : undefined,
            words: (line.words || []).filter((word: any) => word.bbox).map((word: any) => ({
              text: word.text || "",
              bbox: { x0: word.bbox.x0 * multiplier, y0: word.bbox.y0 * multiplier, x1: word.bbox.x1 * multiplier, y1: word.bbox.y1 * multiplier },
            })),
          })),
        ),
      ).filter((line: OCRLine) => line.text && line.bbox) as OCRLine[];
    };
    onProgress(38, "Reading room labels and dimensions…");
    const originalLines = await readLines(originalCanvas, scale);
    onProgress(64, "Checking small dimension marks…");
    const enhancedLines = await readLines(canvas, 1);
    await worker.setParameters({ tessedit_pageseg_mode: "4" as any }); // A column-aware pass recovers text missed by sparse mode.
    onProgress(79, "Cross-checking room labels…");
    const layoutLines = await readLines(originalCanvas, scale);
    const lines = [...originalLines, ...enhancedLines, ...layoutLines];
    const recognizedText = lines.map(line => line.text).join("\n");
    const dimensions = lines.map(line => ({ line, size: parseDimensionPair(line.text) })).filter((item): item is { line: typeof lines[number]; size: { length: number; width: number } } => Boolean(item.size));
    const labels = lines.map(line => ({ line: { ...line, bbox: roomLabelBox(line) }, room: classifyRoom(line.text) }))
      .filter(item => Boolean(item.room) && Boolean(item.line.bbox)) as { line: OCRLine & { bbox: OCRBox }; room: { type: string; name: string } }[];
    const uniqueLabels = labels
      .filter((item, index, all) => !all.slice(0, index).some(previous => previous.room.type === item.room.type &&
        Math.hypot(((previous.line.bbox!.x0 + previous.line.bbox!.x1) - (item.line.bbox!.x0 + item.line.bbox!.x1)) / 2,
          ((previous.line.bbox!.y0 + previous.line.bbox!.y1) - (item.line.bbox!.y0 + item.line.bbox!.y1)) / 2) < canvas.width * .02));
    const rawRecords = dimensions.map(({ line, size }, index) => {
      const centerX = (line.bbox.x0 + line.bbox.x1) / 2; const centerY = (line.bbox.y0 + line.bbox.y1) / 2;
      const nearest = labels.map(label => ({ ...label, distance: Math.hypot(((label.line.bbox.x0 + label.line.bbox.x1) / 2) - centerX, ((label.line.bbox.y0 + label.line.bbox.y1) / 2) - centerY) })).sort((a, b) => a.distance - b.distance)[0];
      return { ...size, line, centerX, centerY, name: nearest && nearest.distance < canvas.width * .13 ? nearest.room.name : `Room ${index + 1}`, type: nearest && nearest.distance < canvas.width * .13 ? nearest.room.type : "Hall" };
    });
    const cropRecords: typeof rawRecords = [];
    await worker.setParameters({ tessedit_pageseg_mode: "6" as any });
    for (const [index, label] of uniqueLabels.entries()) {
      if (!label.line.bbox) continue;
      onProgress(82 + Math.round((index / Math.max(1, uniqueLabels.length)) * 10), `Reading dimensions near ${label.room.name}…`);
      const left = Math.max(0, (label.line.bbox.x0 + label.line.bbox.x1) / (2 * scale) - 100);
      const top = Math.max(0, label.line.bbox.y0 / scale - 16);
      const right = Math.min(originalCanvas.width, left + 200);
      const bottom = Math.min(originalCanvas.height, label.line.bbox.y1 / scale + 112);
      const crop = document.createElement("canvas"); crop.width = Math.max(1, Math.round((right - left) * 3)); crop.height = Math.max(1, Math.round((bottom - top) * 3));
      const cropContext = crop.getContext("2d", { willReadFrequently: true });
      if (!cropContext) continue;
      cropContext.drawImage(originalCanvas, left, top, right - left, bottom - top, 0, 0, crop.width, crop.height);
      const cropPixels = cropContext.getImageData(0, 0, crop.width, crop.height);
      for (let i = 0; i < cropPixels.data.length; i += 4) {
        const gray = cropPixels.data[i] * .299 + cropPixels.data[i + 1] * .587 + cropPixels.data[i + 2] * .114;
        const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.65 + 128));
        cropPixels.data[i] = cropPixels.data[i + 1] = cropPixels.data[i + 2] = contrast;
      }
      cropContext.putImageData(cropPixels, 0, 0);
      const { data } = await worker.recognize(crop);
      const size = parseDimensionPair(data.text || ""); crop.width = 0; crop.height = 0;
      if (!size) continue;
      const box = label.line.bbox;
      cropRecords.push({ ...size, line: { text: data.text || "", confidence: data.confidence, bbox: box },
        centerX: (box.x0 + box.x1) / 2, centerY: (box.y0 + box.y1) / 2, name: label.room.name, type: label.room.type });
    }
    const allRecords = [...rawRecords, ...cropRecords];
    const records = allRecords.filter((record, index) => !allRecords.slice(0, index).some(previous =>
      Math.hypot(previous.centerX - record.centerX, previous.centerY - record.centerY) < Math.max(45, canvas.width * .035) &&
      Math.abs(previous.length - record.length) < .15 && Math.abs(previous.width - record.width) < .15,
    ));
    if (!records.length) return { rooms: [], recognizedText, warnings: ["The image text was read, but room dimensions could not be matched. Try a sharper plan image or adjust room sizes in Summary."] };

    // Estimate drawing scale from adjacent dimension labels aligned on a row or column.
    const scales: number[] = [];
    for (let i = 0; i < records.length; i++) for (let j = i + 1; j < records.length; j++) {
      const a = records[i], b = records[j]; const dx = Math.abs(a.centerX - b.centerX), dy = Math.abs(a.centerY - b.centerY);
      if (dx > dy * 1.65 && dx < canvas.width * .6) scales.push(dx / ((a.length + b.length) / 2));
      else if (dy > dx * 1.65 && dy < canvas.height * .6) scales.push(dy / ((a.width + b.width) / 2));
    }
    const sortedScales = scales.filter(value => value > 2 && value < 300).sort((a, b) => a - b);
    const pixelsPerFoot = sortedScales.length ? sortedScales[Math.floor(sortedScales.length / 2)] : Math.max(8, Math.min(36, Math.min(canvas.width, canvas.height) / 32));
    const minimumX = Math.min(...records.map(record => record.centerX - record.length * pixelsPerFoot / 2));
    const minimumY = Math.min(...records.map(record => record.centerY - record.width * pixelsPerFoot / 2));
    const seen = new Map<string, number>();
    const rooms: PlanRoom[] = records.map(record => {
      const count = (seen.get(record.name) || 0) + 1; seen.set(record.name, count);
      const id = `${record.type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${count}`;
      const direction = degreesToDirection(0);
      const length = Math.round(record.length * 10) / 10; const width = Math.round(record.width * 10) / 10;
      return { id, name: count > 1 ? `${record.name} ${count}` : record.name, type: record.type, length_ft: length, width_ft: width, x_ft: Math.max(0, (record.centerX - length * pixelsPerFoot / 2 - minimumX) / pixelsPerFoot), y_ft: Math.max(0, (record.centerY - width * pixelsPerFoot / 2 - minimumY) / pixelsPerFoot), rotation: 0, direction: direction.code, facingDeg: 0, facingCode: direction.code, doorWall: "south" as WallSide, windowWall: "north" as WallSide, floorColor: ROOM_COLORS[record.type] || "#dbeafe" };
    });
    onProgress(94, `${rooms.length} room${rooms.length === 1 ? "" : "s"} found. Preparing the review…`);
    return { rooms, recognizedText, warnings: ["Room names and dimensions are read locally. Check the detected sizes and positions in Summary before continuing."] };
  } finally { await worker.terminate(); }
}
