export type WallSide = "north" | "east" | "south" | "west";
export type OpeningType = "door" | "window" | "arch";

export interface PlanRoom {
  id: string;
  name: string;
  type: string;
  length_ft: number;
  width_ft: number;
  x_ft: number;
  y_ft: number;
  rotation: 0 | 90 | 180 | 270;
  direction: string;
  facingDeg?: number;
  facingCode?: string;
  doorWallDeg?: number;
  doorWallCode?: string;
  windowWallDeg?: number;
  windowWallCode?: string;
  doorWall: WallSide;
  windowWall: WallSide;
  floorColor: string;
  borderColor?: string;
  wallColors?: Partial<Record<WallSide, string>>;
  wallLengths?: Partial<Record<WallSide, number>>;
  /** One-foot wall segments removed by the wall eraser, indexed from the room edge. */
  openWallSegments?: Partial<Record<WallSide, number[]>>;
  attachedTo?: string;
}

export interface PlanOpening {
  id: string;
  roomId: string;
  type: OpeningType;
  wall: WallSide;
  width_ft: number;
  offset_ft: number;
  isMainEntrance?: boolean;
}

export interface PlanWall {
  id: string;
  x1_ft: number;
  y1_ft: number;
  x2_ft: number;
  y2_ft: number;
}

export interface PlanFurniture {
  id: string;
  roomId: string;
  name: string;
  kind?: string;
  x_ft: number;
  y_ft: number;
  length_ft: number;
  width_ft: number;
  height_ft: number;
  /** Bottom offset above the floor, used for items placed on counters or platforms. */
  elevation_ft?: number;
  rotation: 0 | 90 | 180 | 270;
  color: string;
  wall_side?: WallSide;
  wall_offset_ft?: number;
  /** Vertical placement from floor for wall-mounted items such as a TV. */
  mount_height_ft?: number;
}

export interface RoomTileFinish {
  size_ft: number;
  color: string;
  grout_color: string;
}

export interface PlanAnswer {
  [key: string]: string;
}

export interface PlanData {
  phase: "details" | "questions" | "summary" | "editor";
  questionIndex: number;
  answers: PlanAnswer;
  rooms: PlanRoom[];
  openings: PlanOpening[];
  /** Free-standing wall segments drawn with the wall pen. */
  customWalls?: PlanWall[];
  furniture?: PlanFurniture[];
  showFurnitureLabels?: boolean;
  roomTiles?: Record<string, RoomTileFinish>;
  northAngle: number;
  northCode?: string;
  showDirection?: boolean;
  show32Zones?: boolean;
  wheelScale?: number;
  wheelOpacity?: number;
  wheelOffsetXFt?: number;
  wheelOffsetYFt?: number;
  centerWheelOnRoom?: boolean;
  wheelShowFront?: boolean;
  wheelShowBack?: boolean;
  wheelShowCenter?: boolean;
  wheelShowLines?: boolean;
  wheelBandWidth?: number;
  referencePlanImageData?: string;
  zoom: number;
  mapLabelMode?: "all" | "names" | "sizes" | "none";
  layoutFixed?: boolean;
  /** True after the user has entered the 2D/3D editor at least once. */
  layoutArranged?: boolean;
}

export interface FloorPlan {
  plan_id?: string;
  company_id?: string;
  client_id?: string | null;
  client_name?: string;
  phone1?: string;
  project_title: string;
  bhk: string;
  bedroom_count: number;
  site_type: string;
  ceiling_height_ft: number;
  status: "Draft" | "Completed";
  version: number;
  created_by?: string;
  c_date?: string;
  updated_at?: string;
  thumbnail_path?: string;
  map_image_path?: string;
  plan_data: PlanData;
}

export const ROOM_COLORS: Record<string, string> = {
  Hall: "#d5d2ca", Balcony: "#c8d1c2", Dining: "#d8d0c3", Kitchen: "#cbd2cc",
  Utility: "#c9d1d4", Store: "#d4d0c9", Bedroom: "#d0c9c3", Washroom: "#c1cbd0",
  Foyer: "#d0cec7", Pooja: "#d9d2bd", Study: "#cbd0d4", Passage: "#d2d2cf", Staircase: "#cbd0c4",
};

export const emptyPlanData = (): PlanData => ({ phase: "details", questionIndex: 0, answers: {}, rooms: [], openings: [], customWalls: [], furniture: [], showFurnitureLabels: true, roomTiles: {}, northAngle: 0, northCode: "N", zoom: 1, mapLabelMode: "all", showDirection: false, show32Zones: false, wheelScale: 1, wheelOpacity: 0.65, wheelOffsetXFt: 0, wheelOffsetYFt: 0, centerWheelOnRoom: false, wheelShowFront: true, wheelShowBack: false, wheelShowCenter: true, wheelShowLines: true, wheelBandWidth: 0.23 });

export const parseFeetDimensions = (value: string): { length: number; width: number } | null => {
  const normalized = value.trim().replace(/[×X*]/g, "x");
  const match = normalized.match(/^\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')?\s*x\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')?\s*$/i);
  if (!match) return null;
  const length = Number(match[1]); const width = Number(match[2]);
  if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0 || length > 60 || width > 60) return null;
  return { length, width };
};

export const roomArea = (room: PlanRoom) => room.length_ft * room.width_ft;

export const autoArrangeRooms = (rooms: PlanRoom[]): PlanRoom[] => {
  if (!rooms.length) return [];
  const keyOf = (room: PlanRoom) => `${room.id} ${room.name} ${room.type}`.toLowerCase().replace(/\s+/g, "-");
  const isHall = (room: PlanRoom) => /(^|[- ])hall($|[- ])/.test(keyOf(room)) && !/balcony/.test(keyOf(room));
  const isHallBalcony = (room: PlanRoom) => /hall.*balcony|balcony.*hall/.test(keyOf(room));
  const bedroomMatch = (room: PlanRoom) => keyOf(room).match(/bedroom[- ]?(\d+)/);
  const roomRank = (room: PlanRoom) => {
    if (isHall(room)) return 0; if (isHallBalcony(room)) return 1;
    if (/dining/.test(keyOf(room))) return 2; if (/kitchen/.test(keyOf(room))) return 3;
    if (bedroomMatch(room)) return /washroom|balcony/.test(keyOf(room)) ? 5 : 4;
    if (/store|utility|wash-area/.test(keyOf(room))) return 6;
    if (/washroom/.test(keyOf(room))) return 7;
    return 8;
  };
  const ordered = rooms.map((room, index) => ({ room, index })).sort((a, b) => roomRank(a.room) - roomRank(b.room) || a.index - b.index).map(item => item.room);
  const arranged: PlanRoom[] = [];
  const rect = (room: PlanRoom) => ({ w: room.rotation % 180 === 0 ? room.length_ft : room.width_ft, h: room.rotation % 180 === 0 ? room.width_ft : room.length_ft });
  const collides = (x: number, y: number, w: number, h: number) => arranged.some(other => {
    const o = rect(other);
    return x < other.x_ft + o.w - .02 && x + w > other.x_ft + .02 && y < other.y_ft + o.h - .02 && y + h > other.y_ft + .02;
  });
  const preferredParent = (room: PlanRoom) => {
    const key = keyOf(room); const bedroom = bedroomMatch(room);
    if (isHallBalcony(room) || /dining/.test(key)) return arranged.find(isHall);
    if (/kitchen/.test(key)) return arranged.find(candidate => /dining/.test(keyOf(candidate))) || arranged.find(isHall);
    if (bedroom) {
      const base = bedroom[0].replace(/-$/, "");
      if (/washroom|balcony/.test(key)) return arranged.find(candidate => keyOf(candidate).split(/-(?:washroom|balcony)/)[0] === base);
      const previous = arranged.filter(candidate => bedroomMatch(candidate) && !/washroom|balcony/.test(keyOf(candidate)));
      return previous[previous.length - 1] || arranged.find(candidate => /kitchen/.test(keyOf(candidate))) || arranged.find(isHall);
    }
    if (/store|utility|wash-area/.test(key)) return arranged.find(candidate => /kitchen/.test(keyOf(candidate))) || arranged.find(isHall);
    if (/washroom/.test(key)) return arranged.filter(candidate => /bedroom/.test(keyOf(candidate)) && !/washroom|balcony/.test(keyOf(candidate))).at(-1) || arranged.find(isHall);
    return arranged.at(-1) || arranged.find(isHall);
  };
  const sideOrder = (room: PlanRoom): WallSide[] => {
    const key = keyOf(room);
    if (isHall(room)) return ["north", "west", "south", "east"];
    if (isHallBalcony(room) || /balcony/.test(key)) return ["south", "east", "west", "north"];
    if (/washroom/.test(key)) return ["north", "west", "east", "south"];
    if (/dining|kitchen|bedroom|store|utility|wash-area/.test(key)) return ["east", "south", "north", "west"];
    return ["east", "south", "west", "north"];
  };
  for (const room of ordered) {
    const { w, h } = rect(room);
    if (!arranged.length) { arranged.push({ ...room, x_ft: 0, y_ft: 0 }); continue; }
    const parent = preferredParent(room) || arranged[0]; const p = rect(parent);
    const sides = sideOrder(room); let position: { x: number; y: number; side: WallSide } | undefined;
    for (const side of sides) {
      const cross = side === "east" || side === "west" ? h : w;
      const parentCross = side === "east" || side === "west" ? p.h : p.w;
      const offsets = [0, ...(Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? 1 : -1) * Math.ceil((i + 1) / 2) * Math.max(1, Math.min(cross, parentCross) / 2)))];
      for (const offset of offsets) {
        let x = parent.x_ft; let y = parent.y_ft;
        if (side === "east") { x += p.w; y += (p.h - h) / 2 + offset; }
        else if (side === "west") { x -= w; y += (p.h - h) / 2 + offset; }
        else if (side === "south") { y += p.h; x += (p.w - w) / 2 + offset; }
        else { y -= h; x += (p.w - w) / 2 + offset; }
        if (x >= 0 && y >= 0 && !collides(x, y, w, h)) { position = { x, y, side }; break; }
      }
      if (position) break;
    }
    if (!position) { const right = Math.max(...arranged.map(item => item.x_ft + rect(item).w)); position = { x: right, y: 0, side: "east" }; }
    arranged.push({ ...room, x_ft: position.x, y_ft: position.y, attachedTo: parent.id });
  }
  return arranged;
};

export const snapFeet = (value: number) => Math.max(0, Math.round(value));
