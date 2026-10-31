import { autoArrangeRooms, parseFeetDimensions, PlanAnswer, PlanRoom, ROOM_COLORS, WallSide } from "./types";
import { degreesToDirection } from "./directions";

export type WizardQuestion = { key: string; type: "size" | "choice"; title: string; description?: string; choices?: string[]; roomName?: string; optional?: boolean };
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function roomSteps(list: WizardQuestion[], key: string, name: string, optional = false) {
  if (optional) list.push({ key: `${key}-enabled`, type: "choice", title: `Add ${name}?`, choices: ["Yes", "No"], roomName: name });
  list.push({ key: `${key}-size`, type: "size", title: `${name} size`, description: "Enter the length and width separately in feet.", roomName: name, optional });
}

export function buildWizardQuestions(bedroomCount: number, answers: PlanAnswer): WizardQuestion[] {
  const questions: WizardQuestion[] = [];
  roomSteps(questions, "hall", "Main room / Hall");
  roomSteps(questions, "hall-balcony", "Hall Balcony", true);
  roomSteps(questions, "dining", "Dining Space", true);
  roomSteps(questions, "kitchen", "Kitchen");
  roomSteps(questions, "store", "Store Room", true);
  roomSteps(questions, "wash-area", "Wash Area", true);
  for (let index = 1; index <= bedroomCount; index++) {
    const bedroom = `bedroom-${index}`;
    roomSteps(questions, bedroom, `Bedroom ${index}`);
    roomSteps(questions, `${bedroom}-balcony`, `Bedroom ${index} Balcony`, true);
    roomSteps(questions, `${bedroom}-washroom`, `Bedroom ${index} Attached Washroom`, true);
  }
  roomSteps(questions, "common-washroom", "Common Washroom", true);
  roomSteps(questions, "foyer", "Main Entrance / Foyer", true);
  for (const [key, name] of [["pooja", "Pooja Room"], ["study", "Study Room"], ["passage", "Passage / Corridor"], ["staircase", "Staircase"]]) roomSteps(questions, key, name, true);
  return questions.filter(question => {
    const match = question.key.match(/^(.*)-(size|direction|door|window)$/);
    if (!match) return true;
    const enabled = answers[`${match[1]}-enabled`];
    return !question.optional || enabled === "Yes";
  });
}

function displayName(key: string) {
  if (key === "hall") return "Hall";
  if (key.startsWith("bedroom-")) {
    const match = key.match(/^bedroom-(\d+)/); const n = match?.[1] || "1";
    if (key.includes("-balcony")) return `Bedroom ${n} Balcony`;
    if (key.includes("-washroom")) return `Bedroom ${n} Attached Washroom`;
    return `Bedroom ${n}`;
  }
  return ({ "hall-balcony": "Hall Balcony", dining: "Dining", kitchen: "Kitchen", "kitchen-utility": "Kitchen Utility", store: "Store", "wash-area": "Wash Area", "common-washroom": "Common Washroom", foyer: "Entrance / Foyer", pooja: "Pooja Room", study: "Study Room", passage: "Passage", staircase: "Staircase" } as Record<string, string>)[key] || key;
}
function roomType(key: string): string {
  if (key === "hall") return "Hall"; if (key.includes("balcony")) return "Balcony"; if (key === "dining") return "Dining"; if (key === "kitchen") return "Kitchen";
  if (key.includes("utility") || key === "wash-area") return "Utility"; if (key.includes("washroom")) return "Washroom"; if (key === "foyer") return "Foyer";
  if (key.startsWith("bedroom")) return "Bedroom"; if (key === "pooja") return "Pooja"; if (key === "study") return "Study"; if (key === "passage") return "Passage"; if (key === "staircase") return "Staircase"; return "Store";
}
function parentKey(key: string) { const match = key.match(/^(bedroom-\d+)(?:-(?:balcony|washroom))?$/); return match?.[1]; }

export function buildRoomsFromAnswers(answers: PlanAnswer): PlanRoom[] {
  const rooms: PlanRoom[] = [];
  const keys = ["hall", "hall-balcony", "dining", "kitchen", "store", "wash-area"];
  const bedroomKeys = Object.keys(answers).map(key => key.match(/^(bedroom-\d+)(?:-|$)/)?.[1]).filter(Boolean) as string[];
  keys.push(...Array.from(new Set(bedroomKeys)).sort((a,b) => Number(a.split("-")[1])-Number(b.split("-")[1])).flatMap(key => [key, `${key}-balcony`, `${key}-washroom`]));
  keys.push("common-washroom", "foyer", "pooja", "study", "passage", "staircase");
  keys.forEach(key => {
    if (answers[`${key}-enabled`] === "No") return;
    const length = answers[`${key}-length`] ?? answers[`${key}-size-length`];
    const width = answers[`${key}-width`] ?? answers[`${key}-size-width`];
    const separateSize = length && width ? `${length}x${width}` : "";
    const size = parseFeetDimensions(separateSize || answers[`${key}-size`] || ""); if (!size) return;
    const facingDeg = Number(answers[`${key}-direction`] || 0); const dir = degreesToDirection(facingDeg);
    const doorWallDeg = Number(answers[`${key}-door`] ?? 180); const windowWallDeg = Number(answers[`${key}-window`] ?? 0);
    const wallFromBearing = (deg: number): WallSide => {
      const i = Math.round((((deg % 360) + 360) % 360) / 90) % 4;
      return (["north", "east", "south", "west"] as WallSide[])[i];
    };
    const wallValues: WallSide[] = ["north", "east", "south", "west"];
    const doorWall = wallValues.includes(answers[`${key}-door`] as WallSide) ? answers[`${key}-door`] as WallSide : "south";
    const windowWall = wallValues.includes(answers[`${key}-window`] as WallSide) ? answers[`${key}-window`] as WallSide : "north";
    const type = roomType(key); const parent = parentKey(key);
    const storedDoorWall = answers[`${key}-door`] === undefined ? doorWall : wallFromBearing(doorWallDeg);
    const storedWindowWall = answers[`${key}-window`] === undefined ? windowWall : wallFromBearing(windowWallDeg);
    rooms.push({ id: slug(key), name: displayName(key), type, length_ft: size.length, width_ft: size.width, x_ft: 0, y_ft: 0, rotation: 0, direction: dir.code, facingDeg, facingCode: dir.code, doorWall: storedDoorWall, doorWallDeg, doorWallCode: degreesToDirection(doorWallDeg).code, windowWall: storedWindowWall, windowWallDeg, windowWallCode: degreesToDirection(windowWallDeg).code, floorColor: ROOM_COLORS[type] || "#dbeafe", ...(parent && key !== parent ? { attachedTo: slug(parent) } : {}) });
  });
  return autoArrangeRooms(rooms);
}

export const extraRoomDefaults = { direction: "N", doorWall: "south" as WallSide, windowWall: "north" as WallSide };
