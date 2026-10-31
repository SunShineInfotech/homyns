import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OpeningType, PlanData, PlanFurniture, PlanOpening, PlanRoom, PlanWall, WallSide } from "./types";
import { DirectionWheelLayers, drawDirectionWheel } from "./direction-wheel";

type CameraMode = "orbit" | "room" | "top" | "iso" | "walkthrough" | "outside";
interface Props { showFurnitureLabels?: boolean; onShowFurnitureLabels?: (show: boolean) => void; rooms: PlanRoom[]; openings: PlanOpening[]; customWalls?: PlanWall[]; furniture?: PlanFurniture[]; roomTiles?: PlanData["roomTiles"]; layoutFixed?: boolean; onAddFurniture?: (kind: string) => void; onMoveFurniture?: (id: string, x: number, y: number, roomId?: string, wallSide?: WallSide, wallOffsetFt?: number) => void; onEditFurniture?: (id: string) => void; ceilingHeightFt: number; mode: CameraMode; wallOpacity?: number; windowOpacity?: number; showDirection?: boolean; show32Zones?: boolean; northAngle?: number; labelMode?: "all" | "names" | "sizes" | "none"; wheelLayers?: DirectionWheelLayers; wheelScale?: number; wheelOpacity?: number; wheelOffsetXFt?: number; wheelOffsetYFt?: number; centerRoomId?: string; centerWheelOnRoom?: boolean; selectedIds?: string[]; multiSelect?: boolean; onSelectRoom?: (id: string, multi: boolean) => void; onEditRoom?: (id: string) => void; onEditWall?: (roomId: string, side: WallSide) => void; onSnapshotReady?: (getSnapshot: () => string) => void; immersive360?: boolean; clientPresentation?: boolean; currentRoomId?: string; tourRoomId?: string; onTourRoomChange?: (roomId: string) => void; onTourExit?: () => void; }
const FURNITURE_CATALOG = [
  { name: "Sofa", category: "Living" }, { name: "TV Cabinet", category: "Living" }, { name: "Bed", category: "Bedroom" }, { name: "King Size Bed", category: "Bedroom" }, { name: "Double Bed", category: "Bedroom" }, { name: "Single Bed", category: "Bedroom" },
  { name: "Wardrobe", category: "Bedroom" }, { name: "Shoe Rack", category: "Storage" }, { name: "Shoe Cabinet", category: "Storage" }, { name: "Bedside Table", category: "Bedroom" }, { name: "Dressing Area Mirror", category: "Bedroom" }, { name: "Dining Table", category: "Dining" }, { name: "Chair", category: "Dining" },
  { name: "Desk", category: "Work" }, { name: "Study Table", category: "Work" }, { name: "Bookshelf", category: "Storage" }, { name: "Wall Clock", category: "Decor" }, { name: "Wall Art", category: "Decor" }, { name: "Mandir", category: "Pooja" }, { name: "Temple", category: "Pooja" }, { name: "Carpet", category: "Decor" },
  { name: "Pouf", category: "Living" }, { name: "Coffee Table", category: "Living" }, { name: "Hall Center Table", category: "Living" }, { name: "Ottoman", category: "Living" }, { name: "Jhula (Hichko)", category: "Living" },
  { name: "Kitchen Platform", category: "Kitchen" }, { name: "Kitchen Island", category: "Kitchen" }, { name: "Sink", category: "Kitchen" },
  { name: "Stove", category: "Kitchen" }, { name: "Refrigerator", category: "Kitchen" }, { name: "Pantry Cabinet", category: "Kitchen" },
  { name: "Washing Machine", category: "Utility" }, { name: "Utility Sink", category: "Utility" }, { name: "Tall Utility Cabinet", category: "Utility" },
  { name: "Toilet", category: "Bathroom" }, { name: "Bathroom Vanity", category: "Bathroom" }, { name: "Bathroom Sink", category: "Bathroom" },
  { name: "Shower", category: "Bathroom" }, { name: "Bathtub", category: "Bathroom" }, { name: "Towel Rack", category: "Bathroom" },
  { name: "Bathroom Mirror", category: "Bathroom" }, { name: "Bathroom Cabinet", category: "Bathroom" },
];
const ELECTRICAL_CATALOG = [
  { name: "TV", category: "Entertainment" },
  { name: "Air Conditioner (AC)", category: "Cooling" },
  { name: "Ceiling Fan", category: "Cooling" },
  { name: "Exhaust Fan", category: "Ventilation" },
  { name: "Hanging Bulb", category: "Lighting" },
  { name: "Pendant Light", category: "Lighting" },
  { name: "Ceiling Light", category: "Lighting" },
  { name: "Wall Light", category: "Lighting" },
];
const FT = 0.3048;
const OPEN_HEIGHT: Record<OpeningType, number> = { door: 7 * FT, window: 4 * FT, arch: 7.5 * FT };
function bounds(room: PlanRoom) {
  const rotated = room.rotation % 180 !== 0;
  return { x: room.x_ft * FT, z: room.y_ft * FT, width: (rotated ? room.width_ft : room.length_ft) * FT, depth: (rotated ? room.length_ft : room.width_ft) * FT };
}
function roomBoundsFt(room: PlanRoom) {
  const rotated = room.rotation % 180 !== 0;
  return { x: room.x_ft, y: room.y_ft, w: rotated ? room.width_ft : room.length_ft, h: rotated ? room.length_ft : room.width_ft };
}
function wallAllowsPassage(room: PlanRoom, side: WallSide, from: number, to: number, openings: PlanOpening[]) {
  const b = roomBoundsFt(room); const horizontal = side === "north" || side === "south"; const origin = horizontal ? b.x : b.y; const total = horizontal ? b.w : b.h;
  const span = Math.min(total, room.wallLengths?.[side] ?? total); const wallStart = origin + (total - span) / 2;
  const touches = (start: number, end: number) => start < to - .04 && end > from + .04;
  if (from < wallStart - .04 || to > wallStart + span + .04) return true;
  if ((room.openWallSegments?.[side] || []).some(segment => touches(origin + segment, origin + segment + 1))) return true;
  return openings.some(opening => {
    if (opening.roomId !== room.id || opening.wall !== side || opening.type === "window") return false;
    return touches(wallStart + opening.offset_ft, wallStart + opening.offset_ft + opening.width_ft);
  });
}
function roomConnections(room: PlanRoom, rooms: PlanRoom[], openings: PlanOpening[]) {
  const a = roomBoundsFt(room); const sides: { side: WallSide; opposite: WallSide; other: PlanRoom; from: number; to: number }[] = [];
  rooms.forEach(other => {
    if (other.id === room.id) return; const b = roomBoundsFt(other);
    const y0 = Math.max(a.y, b.y); const y1 = Math.min(a.y + a.h, b.y + b.h); const x0 = Math.max(a.x, b.x); const x1 = Math.min(a.x + a.w, b.x + b.w);
    if (Math.abs(a.x + a.w - b.x) < .12 && y1 - y0 > .25) sides.push({ side: "east", opposite: "west", other, from: y0, to: y1 });
    if (Math.abs(a.x - (b.x + b.w)) < .12 && y1 - y0 > .25) sides.push({ side: "west", opposite: "east", other, from: y0, to: y1 });
    if (Math.abs(a.y + a.h - b.y) < .12 && x1 - x0 > .25) sides.push({ side: "south", opposite: "north", other, from: x0, to: x1 });
    if (Math.abs(a.y - (b.y + b.h)) < .12 && x1 - x0 > .25) sides.push({ side: "north", opposite: "south", other, from: x0, to: x1 });
  });
  return sides.filter(({ side, opposite, other, from, to }) => wallAllowsPassage(room, side, from, to, openings) || wallAllowsPassage(other, opposite, from, to, openings));
}

function makeLabel(room: PlanRoom, labelMode: "all" | "names" | "sizes" | "none") {
  if (labelMode === "none") return new THREE.Group();
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 160;
  const ctx = canvas.getContext("2d")!; ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.roundRect(5, 5, 502, 150, 18); ctx.fill();
  ctx.fillStyle = "#0f172a"; ctx.textAlign = "center";
  if (labelMode === "all") { ctx.font = "bold 30px Arial"; ctx.fillText(room.name, 256, 64, 480); ctx.font = "22px Arial"; ctx.fillText(`${room.length_ft}′ × ${room.width_ft}′`, 256, 112, 480); }
  else if (labelMode === "names") { ctx.font = "bold 34px Arial"; ctx.fillText(room.name, 256, 87, 480); }
  else { ctx.font = "24px Arial"; ctx.fillText(`${room.length_ft}′ × ${room.width_ft}′`, 256, 87, 480); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material); sprite.scale.set(4, 1, 1); sprite.renderOrder = 2; return sprite;
}

export function House3DView({ showFurnitureLabels = true, onShowFurnitureLabels, rooms, openings, customWalls = [], furniture = [], roomTiles = {}, layoutFixed = false, onAddFurniture, onMoveFurniture, onEditFurniture, ceilingHeightFt, mode, wallOpacity = 1, windowOpacity = .24, immersive360 = false, clientPresentation = false, currentRoomId, tourKey = "plan", onTourRoomChange, onTourExit, showDirection = false, show32Zones = false, northAngle = 0, labelMode = "names", wheelLayers, wheelScale = 1, wheelOpacity = 0.65, wheelOffsetXFt = 0, wheelOffsetYFt = 0, centerRoomId, centerWheelOnRoom = false, selectedIds = [], multiSelect = false, onSelectRoom, onEditRoom, onSnapshotReady }: Props) {
  const renderWallOpacity = immersive360 ? 1 : wallOpacity;
  const hostRef = useRef<HTMLDivElement>(null); const snapshotRef = useRef<(() => string) | null>(null); const tourMoveRef = useRef<(id: string) => void>(() => {}); const joystickMoveRef = useRef<(x: number, y: number) => void>(() => {}); const joystickPointerRef = useRef<{ id: number; x: number; y: number } | null>(null); const lookOrientationRef = useRef<{ yaw: number; pitch: number } | null>(null); const lookRoomRef = useRef<string | null>(null); const roomFloorsRef = useRef(new Map<string, THREE.Mesh>()); const multiSelectRef = useRef(multiSelect); const moveFurnitureRef = useRef(onMoveFurniture); multiSelectRef.current = multiSelect; moveFurnitureRef.current = onMoveFurniture; const [joystick, setJoystick] = useState({ x: 0, y: 0 }); const [unavailable, setUnavailable] = useState(false); const [showEnterHint, setShowEnterHint] = useState(() => !localStorage.getItem(`360-tour-entered:${tourKey}`)); const [clientPlaying, setClientPlaying] = useState(false); const [furnitureCategory, setFurnitureCategory] = useState("All"); const [furnitureSearch,setFurnitureSearch]=useState(""); const [electricalSearch, setElectricalSearch] = useState(""); const [tourMenuMode, setTourMenuMode] = useState<"window" | "slider">("window"); const [tourMenuExpanded, setTourMenuExpanded] = useState(false);
  useEffect(() => { setShowEnterHint(!localStorage.getItem(`360-tour-entered:${tourKey}`)); }, [tourKey]);
  useEffect(() => { roomFloorsRef.current.forEach((mesh, id) => { const material = mesh.material as THREE.MeshStandardMaterial; material.emissive.set(selectedIds.includes(id) ? "#2563eb" : "#000000"); material.emissiveIntensity = selectedIds.includes(id) ? .22 : 0; }); }, [selectedIds]);
  useEffect(() => {
    const host = hostRef.current; if (!host || !rooms.length) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true }); }
    catch { setUnavailable(true); return; }
    setUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cursor = mode === "outside" ? "pointer" : immersive360 && mode === "walkthrough" ? "grab" : "default";
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setClearColor("#eef2f7");
    host.replaceChildren(renderer.domElement); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; renderer.domElement.style.display = "block"; renderer.domElement.style.touchAction = "none";
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#eef2f7"); scene.fog = new THREE.Fog("#eef2f7", 30, 120);
    const camera = new THREE.PerspectiveCamera(immersive360 && mode === "walkthrough" ? 100 : 48, 1, .1, 300);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = mode === "top" ? Math.PI * .99 : Math.PI * .49; controls.minDistance = 2; controls.maxDistance = 100;
    scene.add(new THREE.HemisphereLight("#ffffff", "#94a3b8", 2.2));
    const sun = new THREE.DirectionalLight("#fff4df", 2.6); sun.position.set(-18, 26, -14); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536); scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: "#e5e7eb", roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.05; ground.receiveShadow = true; scene.add(ground);
    const wheelResources: Array<{ geometry: THREE.BufferGeometry; material: THREE.Material; texture?: THREE.Texture }> = []; const interactiveDoors: THREE.Mesh[] = []; const wallMeshes: THREE.Mesh[] = []; const furnitureGroups = new Map<string, THREE.Group>();
    if (showDirection && rooms.length) {
      const maxX = Math.max(...rooms.map(r => (r.x_ft + (r.rotation % 180 ? r.width_ft : r.length_ft)) * FT));
      const maxZ = Math.max(...rooms.map(r => (r.y_ft + (r.rotation % 180 ? r.length_ft : r.width_ft)) * FT));
      const diameter = Math.max(12, Math.max(maxX, maxZ) * 1.45 * wheelScale); const pixels = 1024;
      const canvas = document.createElement("canvas"); canvas.width = pixels; canvas.height = pixels; const ctx = canvas.getContext("2d");
      if (ctx) drawDirectionWheel(ctx, pixels / 2, pixels / 2, pixels * .39, northAngle, show32Zones, wheelOpacity, wheelLayers);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const geometry = new THREE.PlaneGeometry(diameter, diameter); const wheel = new THREE.Mesh(geometry, material); wheel.rotation.x = -Math.PI / 2; wheel.position.set(maxX / 2 + wheelOffsetXFt * FT, .01, maxZ / 2 + wheelOffsetYFt * FT); wheel.renderOrder = 1; scene.add(wheel);
      if (centerWheelOnRoom && centerRoomId) { const target = rooms.find(r => r.id === centerRoomId); if (target) wheel.position.set((target.x_ft + (target.rotation % 180 ? target.width_ft : target.length_ft) / 2 + wheelOffsetXFt) * FT, .01, (target.y_ft + (target.rotation % 180 ? target.length_ft : target.width_ft) / 2 + wheelOffsetYFt) * FT); }
      wheelResources.push({ geometry, material, texture });
    }
    const ceiling = Math.max(2.1, ceilingHeightFt * FT); const group = new THREE.Group(); scene.add(group);
    const openingMaterials = { door: new THREE.MeshStandardMaterial({ color: "#8b5e3c", roughness: .65 }), window: new THREE.MeshStandardMaterial({ color: "#7dd3fc", roughness: .2, metalness: .05, transparent: true, opacity: windowOpacity, depthWrite: false, side: THREE.DoubleSide }), arch: new THREE.MeshStandardMaterial({ color: "#c4b5fd", roughness: .8 }) };
    const meshSegment = (axis: "x" | "z", start: number, end: number, wallPos: number, y: number, height: number, thickness: number, material: THREE.Material) => {
      const len = end - start; if (len < .02 || height < .02) return null;
      const mesh = new THREE.Mesh(axis === "x" ? new THREE.BoxGeometry(len, height, thickness) : new THREE.BoxGeometry(thickness, height, len), material);
      mesh.position.set(axis === "x" ? (start + end) / 2 : wallPos, y + height / 2, axis === "x" ? wallPos : (start + end) / 2); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
    };
    const drawWall = (room: PlanRoom, side: WallSide, start: number, end: number, fixed: number, axis: "x" | "z", thickness: number) => {
      const wallMaterial = new THREE.MeshStandardMaterial({ color: room.wallColors?.[side] || "#f1f5f9", roughness: .86, transparent: renderWallOpacity < 1, opacity: renderWallOpacity, depthWrite: renderWallOpacity >= 1, side: THREE.DoubleSide });
      const wallStart = group.children.length;
      const tourEntranceId = openings.find(o => o.type === "door" && o.isMainEntrance)?.id || openings.find(o => o.type === "door")?.id;
      const wallOpenings: { start: number; end: number; top: number; type: OpeningType | "erased"; openingId?: string; isMainEntrance?: boolean; isTourEntrance?: boolean; roomId?: string }[] = openings.filter(o => o.roomId === room.id && o.wall === side).map(o => {
        const position = start + Math.max(0, Math.min(end - start - o.width_ft * FT, o.offset_ft * FT));
        const width = Math.min(o.width_ft * FT, end - start);
        return { start: position, end: position + width, top: OPEN_HEIGHT[o.type], type: o.type, openingId:o.id, isMainEntrance:Boolean(o.isMainEntrance), isTourEntrance:o.id === tourEntranceId, roomId:o.roomId };
      }).sort((a, b) => a.start - b.start);
      // Wall eraser edits are stored as one-foot segments measured from the room's edge.
      // Render those gaps as full-height openings so they match the 2D editor exactly.
      const roomEdge = side === "north" || side === "south" ? room.x_ft * FT : room.y_ft * FT;
      for (const segment of room.openWallSegments?.[side] || []) {
        const gapStart = Math.max(start, roomEdge + segment * FT);
        const gapEnd = Math.min(end, roomEdge + (segment + 1) * FT);
        if (gapEnd > gapStart + .01) wallOpenings.push({ start: gapStart, end: gapEnd, top: ceiling, type: "erased" });
      }
      wallOpenings.sort((a, b) => a.start - b.start);
      let cursor = start;
      for (const opening of wallOpenings) {
        const left = Math.max(cursor, opening.start); const right = Math.min(end, opening.end);
        meshSegment(axis, cursor, left, fixed, 0, ceiling, thickness, wallMaterial);
        if (opening.type === "window") {
          const sill = 3 * FT;
          meshSegment(axis, left, right, fixed, 0, sill, thickness, wallMaterial);
          meshSegment(axis, left, right, fixed, Math.min(ceiling, sill + opening.top), Math.max(0, ceiling - sill - opening.top), thickness, wallMaterial);
          meshSegment(axis, left, right, fixed, sill, opening.top, thickness, openingMaterials.window);
          const frame = new THREE.MeshStandardMaterial({ color: "#172b3a", roughness: .48 }); const bar = .045;
          const frameBar = (from: number, to: number, y: number, h: number) => {
            const geometry = axis === "x" ? new THREE.BoxGeometry(to - from, h, Math.max(thickness * 1.25, .045)) : new THREE.BoxGeometry(Math.max(thickness * 1.25, .045), h, to - from);
            const mesh = new THREE.Mesh(geometry, frame); mesh.position.set(axis === "x" ? (from + to) / 2 : fixed, y + h / 2, axis === "x" ? fixed : (from + to) / 2); mesh.castShadow = true; group.add(mesh);
          };
          frameBar(left, left + bar, sill, opening.top); frameBar(right - bar, right, sill, opening.top);
          frameBar(left, right, sill, bar); frameBar(left, right, sill + opening.top - bar, bar);
          for (const fraction of [1 / 3, 2 / 3]) { const pos = left + (right - left) * fraction; frameBar(pos - bar / 2, pos + bar / 2, sill, opening.top); }
        } else if (opening.type === "door") {
          meshSegment(axis, left, right, fixed, Math.min(ceiling, opening.top), Math.max(0, ceiling - opening.top), thickness, wallMaterial);
          const door = meshSegment(axis, left, right, fixed, 0, Math.min(ceiling, opening.top), thickness, openingMaterials.door);
          if (door) { door.userData.openingId = opening.openingId; door.userData.roomId = opening.roomId; door.userData.isMainEntrance = opening.isMainEntrance; door.userData.isTourEntrance = opening.isTourEntrance; interactiveDoors.push(door); }
        } else {
          // Arch openings remain open; only the wall above the arch is rendered.
          meshSegment(axis, left, right, fixed, Math.min(ceiling, opening.top), Math.max(0, ceiling - opening.top), thickness, wallMaterial);
        }
        cursor = right;
      }
      meshSegment(axis, cursor, end, fixed, 0, ceiling, thickness, wallMaterial);
      for (const child of group.children.slice(wallStart)) { const mesh = child as THREE.Mesh; if (mesh.isMesh && mesh.material === wallMaterial) { mesh.userData.wallRoomId = room.id; mesh.userData.wallSide = side; wallMeshes.push(mesh); } }
    };
    // Keep the complete plan visible from the selected room's fixed 360° viewpoint.
    // Room changes still happen only through the explicit connected-room buttons.
    const visibleRooms = rooms;
    let maxX = 0; let maxZ = 0; let minX = 0; let minZ = 0; const pickableFloors: THREE.Mesh[] = []; roomFloorsRef.current.clear();
    visibleRooms.forEach(room => {
      const rotated = room.rotation % 180 !== 0; const length = (rotated ? room.width_ft : room.length_ft) * FT; const depth = (rotated ? room.length_ft : room.width_ft) * FT;
      const x = room.x_ft * FT; const z = room.y_ft * FT; maxX = Math.max(maxX, x + length); maxZ = Math.max(maxZ, z + depth); minX = Math.min(minX, x); minZ = Math.min(minZ, z);
      const tile = roomTiles[room.id];
      const floor = new THREE.Mesh(new THREE.BoxGeometry(length, .07, depth), new THREE.MeshStandardMaterial({ color: tile?.color || room.floorColor, roughness: .85 })); floor.position.set(x + length / 2, .035, z + depth / 2); floor.receiveShadow = true; floor.castShadow = false; floor.userData.roomId = room.id; group.add(floor); pickableFloors.push(floor); roomFloorsRef.current.set(room.id, floor);
      if (tile && tile.size_ft > 0) {
        const step = tile.size_ft * FT; const points: THREE.Vector3[] = [];
        for (let lineX = x + step; lineX < x + length - .01; lineX += step) { points.push(new THREE.Vector3(lineX, .071, z + .01), new THREE.Vector3(lineX, .071, z + depth - .01)); }
        for (let lineZ = z + step; lineZ < z + depth - .01; lineZ += step) { points.push(new THREE.Vector3(x + .01, .071, lineZ), new THREE.Vector3(x + length - .01, .071, lineZ)); }
        if (points.length) { const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: tile.grout_color || "#8b8276", transparent: true, opacity: .78 })); group.add(grid); }
      }
      const adjacent = visibleRooms.filter(other => other.id !== room.id).map(bounds);
      const wallThickness = (side: WallSide) => {
        const shared = adjacent.some(other => {
          if (side === "north" || side === "south") {
            const sameWall = side === "north" ? Math.abs(other.z + other.depth - z) < .04 : Math.abs(other.z - (z + depth)) < .04;
            return sameWall && Math.min(x + length, other.x + other.width) - Math.max(x, other.x) > .05;
          }
          const sameWall = side === "west" ? Math.abs(other.x + other.width - x) < .04 : Math.abs(other.x - (x + length)) < .04;
          return sameWall && Math.min(z + depth, other.z + other.depth) - Math.max(z, other.z) > .05;
        });
        return shared ? 3 * .0254 : 4.5 * .0254;
      };
      const wallSpan = (side: WallSide, total: number) => Math.min(total, (room.wallLengths?.[side] ?? total / FT) * FT);
      const northLength = wallSpan("north", length); const southLength = wallSpan("south", length); const westLength = wallSpan("west", depth); const eastLength = wallSpan("east", depth);
      drawWall(room, "north", x + (length - northLength) / 2, x + (length + northLength) / 2, z, "x", wallThickness("north"));
      drawWall(room, "south", x + (length - southLength) / 2, x + (length + southLength) / 2, z + depth, "x", wallThickness("south"));
      drawWall(room, "west", z + (depth - westLength) / 2, z + (depth + westLength) / 2, x, "z", wallThickness("west"));
      drawWall(room, "east", z + (depth - eastLength) / 2, z + (depth + eastLength) / 2, x + length, "z", wallThickness("east"));      const label = makeLabel(room, labelMode); label.position.set(x + length / 2, .13, z + depth / 2); label.scale.set(Math.min(5, length * .8), Math.min(1.3, length * .2), 1); group.add(label);
    });
    customWalls.forEach(wall => {
      const x1 = wall.x1_ft * FT, z1 = wall.y1_ft * FT, x2 = wall.x2_ft * FT, z2 = wall.y2_ft * FT;
      const dx = x2 - x1, dz = z2 - z1, length = Math.hypot(dx, dz);
      if (length < .04) return;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, ceiling, .1143), new THREE.MeshStandardMaterial({ color: "#f1f5f9", roughness: .86, transparent: renderWallOpacity < 1, opacity: renderWallOpacity, depthWrite: renderWallOpacity >= 1, side: THREE.DoubleSide }));
      mesh.position.set((x1 + x2) / 2, ceiling / 2, (z1 + z2) / 2); mesh.rotation.y = -Math.atan2(dz, dx); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    });
    furniture.filter(item => visibleRooms.some(room => room.id === item.roomId)).forEach(item => {
      if (!visibleRooms.some(room => room.id === item.roomId)) return;
      const length = item.length_ft * FT; const depth = item.width_ft * FT; const height = Math.max(.35, item.height_ft * FT); const kind=item.kind||item.name;
      const furnitureRoom = visibleRooms.find(room => room.id === item.roomId); const wallMounted = Boolean(item.wall_side) || ["Wall Clock", "Wall Art", "TV", "Air Conditioner (AC)", "Wall Light", "Exhaust Fan"].includes(kind); const ceilingMounted = ["Ceiling Fan", "Hanging Bulb", "Pendant Light", "Ceiling Light"].includes(kind); const wallSide = item.wall_side || "north"; const roomFt = furnitureRoom ? roomBoundsFt(furnitureRoom) : null; const horizontalWall = wallSide === "north" || wallSide === "south"; const offsetMax = roomFt ? Math.max(0, (horizontalWall ? roomFt.w : roomFt.h) - (horizontalWall ? item.length_ft : item.width_ft)) : 0; const wallOffset = Math.max(0, Math.min(offsetMax, item.wall_offset_ft ?? offsetMax / 2)); const wallX = !furnitureRoom || !roomFt ? (item.x_ft + item.length_ft / 2) * FT : horizontalWall ? (roomFt.x + wallOffset + item.length_ft / 2) * FT : (wallSide === "west" ? roomFt.x + .08 : roomFt.x + roomFt.w - .08) * FT; const wallZ = !furnitureRoom || !roomFt ? (item.y_ft + item.width_ft / 2) * FT : horizontalWall ? (wallSide === "north" ? roomFt.y + .08 : roomFt.y + roomFt.h - .08) * FT : (roomFt.y + wallOffset + item.width_ft / 2) * FT; const wallRotation: Record<WallSide, number> = { north: 0, east: -Math.PI / 2, south: Math.PI, west: Math.PI / 2 }; const furnitureGroup = new THREE.Group(); furnitureGroups.set(item.id, furnitureGroup); furnitureGroup.userData.furnitureId = item.id; const mountY = kind === "TV" ? Math.max(0.2, Math.min(ceiling - item.height_ft * FT, (item.mount_height_ft ?? 3.5) * FT + item.height_ft * FT / 2)) : Math.min(ceiling - .35, 5.5 * FT); furnitureGroup.position.set(wallMounted ? wallX : (item.x_ft + item.length_ft / 2) * FT, wallMounted ? mountY : ceilingMounted ? ceiling : Math.max(0, item.elevation_ft || 0) * FT, wallMounted ? wallZ : (item.y_ft + item.width_ft / 2) * FT); furnitureGroup.rotation.y = wallMounted ? wallRotation[wallSide] : -item.rotation * Math.PI / 180; group.add(furnitureGroup);
      const wood = new THREE.MeshStandardMaterial({ color: item.color || "#9b8068", roughness: .78 }); const fabric = new THREE.MeshStandardMaterial({ color: "#d8cbbc", roughness: .95 }); const dark = new THREE.MeshStandardMaterial({ color: "#493b30", roughness: .7 });
      const part = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; furnitureGroup.add(mesh); };
      const leg = (x: number, z: number, h: number, color: THREE.Material = dark) => part(.055, h, .055, x, h / 2, z, color);
      const topY = height * .72;
      if (kind === "Carpet") {
        part(length, .04, depth, 0, .025, 0, fabric); part(length * .9, .012, depth * .88, 0, .05, 0, wood);
      } else if (kind === "Pouf" || kind === "Ottoman") {
        const pouf = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length,depth)*.43,Math.min(length,depth)*.46,height*.55,24),fabric); pouf.position.y=height*.28; pouf.castShadow=true; pouf.receiveShadow=true; furnitureGroup.add(pouf);
      } else if (kind === "Jhula (Hichko)") {
        const frame = new THREE.MeshStandardMaterial({ color: "#765438", roughness: .58 });
        part(.09, height, .09, -length * .44, height / 2, -depth * .36, frame); part(.09, height, .09, length * .44, height / 2, -depth * .36, frame); part(length * .98, .1, .1, 0, height * .96, -depth * .36, frame);
        part(.035, height * .55, .035, -length * .3, height * .69, -depth * .28, dark); part(.035, height * .55, .035, length * .3, height * .69, -depth * .28, dark);
        part(length * .72, .14, depth * .5, 0, height * .38, 0, wood); part(length * .72, height * .28, .12, 0, height * .55, -depth * .2, wood); part(length * .78, .1, depth * .18, 0, height * .46, depth * .08, fabric);
      } else if (kind === "Washing Machine") {
        part(length, height, depth, 0, height / 2, 0, wood); const ring = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length, height) * .27, Math.min(length, height) * .27, .045, 32), dark); ring.rotation.x = Math.PI / 2; ring.position.set(0, height * .43, depth * .53); furnitureGroup.add(ring); const glass = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length, height) * .2, Math.min(length, height) * .2, .05, 32), new THREE.MeshStandardMaterial({ color: "#8bb7c6", metalness: .35, roughness: .2 })); glass.rotation.x = Math.PI / 2; glass.position.set(0, height * .43, depth * .55); furnitureGroup.add(glass); part(length * .75, .08, .04, 0, height * .86, depth * .53, dark);
      } else if (kind === "Kitchen Platform" || kind === "Kitchen Island" || kind === "Sink" || kind === "Stove" || kind === "Utility Sink") {
        part(length, height * .72, depth, 0, height * .36, 0, wood); part(length * 1.02, .12, depth * 1.04, 0, height * .76, 0, fabric);
        if(kind === "Sink" || kind === "Utility Sink"){part(length*.46,.035,depth*.48,0,height*.83,0,dark); const basin=new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length,depth)*.22,Math.min(length,depth)*.18,.08,24),new THREE.MeshStandardMaterial({color:"#eef5f7",roughness:.2,metalness:.12})); basin.position.y=height*.81; furnitureGroup.add(basin);}
        if(kind === "Stove"){for(const [x,z] of [[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]]){const burner=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.018,16),dark);burner.position.set(length*x,height*.84,depth*z);furnitureGroup.add(burner);}}
      } else if (kind === "Refrigerator" || kind === "Pantry Cabinet" || kind === "Tall Utility Cabinet") {
        part(length,height,depth,0,height/2,0,wood); part(length*.9,height*.91,.035,0,height/2,depth*.51,fabric);
      } else if (kind === "Sofa") {
        part(length * .9, height * .28, depth * .8, 0, height * .27, 0, wood); part(length * .9, height * .48, depth * .18, 0, height * .65, -depth * .31, wood);
        part(length * .72, height * .12, depth * .48, 0, height * .46, depth * .03, fabric); part(length * .1, height * .47, depth * .82, -length * .4, height * .43, 0, wood); part(length * .1, height * .47, depth * .82, length * .4, height * .43, 0, wood);
      } else if (kind === "Bed" || kind === "King Size Bed" || kind === "Double Bed" || kind === "Single Bed") {
        part(length, height * .26, depth, 0, height * .3, 0, wood); part(length * .92, height * .26, depth * .9, 0, height * .55, 0, fabric); part(length * .98, height * .9, .12, 0, height * .48, -depth * .47, wood);
        part(length * .28, height * .1, depth * .19, -length * .25, height * .75, -depth * .3, fabric); part(length * .28, height * .1, depth * .19, length * .25, height * .75, -depth * .3, fabric);
      } else if (kind === "Dining Table" || kind === "Desk" || kind === "Study Table" || kind === "Coffee Table" || kind === "Hall Center Table") {
        part(length, .12, depth, 0, topY, 0, wood); [[-.43,-.38],[.43,-.38],[-.43,.38],[.43,.38]].forEach(([x,z]) => leg(length*x, depth*z, topY));
      } else if (kind === "Bedside Table") {
        part(length, height * .82, depth, 0, height * .41, 0, wood); part(length * .86, .035, .03, 0, height * .62, depth * .51, dark); part(length * .86, .035, .03, 0, height * .37, depth * .51, dark); part(.12, .035, .035, 0, height * .5, depth * .54, fabric); part(length * 1.04, .08, depth * 1.04, 0, height * .84, 0, fabric);
      } else if (kind === "Dressing Area Mirror") {
        const mirror = new THREE.MeshStandardMaterial({ color: "#c9e5ef", metalness: .62, roughness: .12 }); part(length * .82, height * .9, .045, 0, height * .5, 0, mirror); part(length, .12, .09, 0, height * .5, .015, wood); part(.1, height, .09, -length * .45, height / 2, .015, wood); part(.1, height, .09, length * .45, height / 2, .015, wood); part(length, .12, .09, 0, height * .94, .015, wood);
      } else if (kind === "Chair") {
        part(length * .9, .12, depth * .9, 0, height * .42, depth * .04, wood); part(length * .9, height * .5, .12, 0, height * .67, -depth * .4, wood);
        [[-.38,-.35],[.38,-.35],[-.38,.35],[.38,.35]].forEach(([x,z]) => leg(length*x, depth*z, height * .42));
      } else if (kind === "TV Cabinet") {
        part(length, height * .56, depth, 0, height * .28, 0, wood); part(length * .9, .04, depth * .8, 0, height * .57, 0, fabric);
        part(length * .84, height * .56, .035, 0, height * .29, depth * .51, dark);
      } else if (kind === "TV") {
        const screenFrame = new THREE.MeshStandardMaterial({ color: "#111827", roughness: .32 }); const screen = new THREE.MeshStandardMaterial({ color: "#263746", metalness: .28, roughness: .18, emissive: "#102333", emissiveIntensity: .25 });
        part(length, .09, depth * .65, 0, .16, 0, dark); part(length * .08, .34, .07, 0, .37, 0, dark); part(length, height * .7, .1, 0, height * .55, 0, screenFrame); part(length * .94, height * .62, .025, 0, height * .56, depth * .18, screen);
      } else if (kind === "Air Conditioner (AC)") {
        part(length, height * .62, depth * .72, 0, 0, 0, fabric); part(length * .82, .045, .04, 0, -height * .22, depth * .4, dark); part(length * .12, .04, .045, -length * .32, -height * .28, depth * .42, dark); part(length * .12, .04, .045, length * .32, -height * .28, depth * .42, dark);
      } else if (kind === "Ceiling Fan") {
        const metal = new THREE.MeshStandardMaterial({ color: "#555b60", metalness: .65, roughness: .32 });
        part(.045, height * .5, .045, 0, -height * .25, 0, metal); const motor = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .2, 20), metal); motor.position.y = -height * .53; furnitureGroup.add(motor);
        for (let i = 0; i < 4; i++) { const angle = i * Math.PI / 2; const blade = new THREE.Mesh(new THREE.BoxGeometry(length * .47, .035, Math.max(.13, depth * .16)), wood); blade.position.set(Math.cos(angle) * length * .25, -height * .53, Math.sin(angle) * depth * .25); blade.rotation.y = -angle; furnitureGroup.add(blade); }
      } else if (kind === "Hanging Bulb" || kind === "Pendant Light" || kind === "Ceiling Light" || kind === "Wall Light") {
        const lit = new THREE.MeshStandardMaterial({ color: "#fff4bf", emissive: "#ffd66b", emissiveIntensity: 1.1, roughness: .28 }); const fixture = new THREE.MeshStandardMaterial({ color: "#555b60", metalness: .65, roughness: .3 });
        if (kind === "Wall Light") { part(length * .55, .08, .1, 0, 0, 0, fixture); const bulb = new THREE.Mesh(new THREE.SphereGeometry(Math.min(length, height) * .28, 20, 16), lit); bulb.position.set(0, -height * .2, depth * .2); furnitureGroup.add(bulb); }
        else if (kind === "Ceiling Light") { part(length * .74, .08, depth * .74, 0, -.08, 0, fixture); part(length * .6, .045, depth * .6, 0, -.15, 0, lit); }
        else { const cord = Math.max(.2, height * .72); part(.025, cord, .025, 0, -cord / 2, 0, fixture); if (kind === "Pendant Light") { const shade = new THREE.Mesh(new THREE.ConeGeometry(Math.max(.18, length * .34), Math.max(.18, height * .18), 24, 1, true), fixture); shade.position.y = -cord; shade.rotation.x = Math.PI; furnitureGroup.add(shade); } const bulb = new THREE.Mesh(new THREE.SphereGeometry(Math.max(.09, Math.min(length, depth) * .2), 20, 16), lit); bulb.position.y = -cord - .12; furnitureGroup.add(bulb); }
      } else if (kind === "Exhaust Fan") {
        const metal = new THREE.MeshStandardMaterial({ color: "#b9c2c7", metalness: .48, roughness: .38 }); const hub = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length, height) * .12, Math.min(length, height) * .12, .06, 20), dark); hub.rotation.x = Math.PI / 2; furnitureGroup.add(hub);
        for (let i = 0; i < 4; i++) { const blade = new THREE.Mesh(new THREE.BoxGeometry(length * .08, height * .34, .035), metal); blade.rotation.z = i * Math.PI / 2; furnitureGroup.add(blade); }
      } else if (kind === "Toilet") {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(length * .22, length * .25, height * .3, 24), fabric); bowl.position.set(0, height * .18, depth * .12); bowl.castShadow = true; furnitureGroup.add(bowl); part(length * .38, height * .32, depth * .22, 0, height * .66, -depth * .3, wood);
      } else if (kind === "Bathroom Vanity" || kind === "Bathroom Sink") {
        part(length, height * .72, depth, 0, height * .36, 0, wood); part(length * .95, .1, depth * .94, 0, height * .74, 0, fabric); const basin = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length, depth) * .23, Math.min(length, depth) * .19, .09, 24), new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: .2, metalness: .12 })); basin.position.y = height * .81; furnitureGroup.add(basin);
      } else if (kind === "Shower") {
        part(length, .08, depth, 0, .04, 0, fabric); part(.045, height * .82, .045, -length * .38, height * .41, -depth * .38, dark); part(length * .72, .035, .035, 0, height * .82, -depth * .38, dark);
      } else if (kind === "Bathtub") {
        part(length, height * .48, depth, 0, height * .24, 0, fabric); part(length * .82, height * .08, depth * .72, 0, height * .51, 0, new THREE.MeshStandardMaterial({ color: "#bde7f2", roughness: .18, metalness: .08 }));
      } else if (kind === "Towel Rack") {
        part(.045, height, .045, -length * .43, height / 2, 0, dark); part(.045, height, .045, length * .43, height / 2, 0, dark); for (let i = 1; i <= 4; i++) part(length * .86, .035, .035, 0, height * i / 5, 0, dark);
      } else if (kind === "Bathroom Mirror") {
        part(length, height, .045, 0, height / 2, 0, new THREE.MeshStandardMaterial({ color: "#c9e5ef", metalness: .55, roughness: .14 }));
      } else if (kind === "Mandir" || kind === "Temple") { const plinth = height * .18; part(length * 1.08, plinth, depth * 1.08, 0, plinth / 2, 0, dark); part(length * .9, height * .62, depth * .78, 0, plinth + height * .31, -depth * .02, wood); part(length * .74, height * .055, depth * .82, 0, plinth + height * .65, -depth * .02, dark); part(length * .68, height * .12, depth * .68, 0, plinth + height * .73, -depth * .02, wood); const dome = new THREE.Mesh(new THREE.ConeGeometry(length * .34, height * .22, 4), wood); dome.position.set(0, plinth + height * .89, -depth * .02); dome.rotation.y = Math.PI / 4; dome.castShadow = true; furnitureGroup.add(dome); part(length * .34, height * .32, .04, 0, plinth + height * .38, depth * .39, dark); part(length * .25, height * .23, .045, 0, plinth + height * .38, depth * .42, fabric);
      } else if (kind === "Wall Clock") { const clock = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length, height) * .46, Math.min(length, height) * .46, .055, 32), wood); clock.rotation.x = Math.PI / 2; furnitureGroup.add(clock); const face = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(length, height) * .39, Math.min(length, height) * .39, .06, 32), fabric); face.rotation.x = Math.PI / 2; face.position.z = .018; furnitureGroup.add(face); part(.025, height * .3, .03, 0, 0, .05, dark); part(length * .22, .025, .03, length * .08, height * .08, .05, dark);
      } else if (kind === "Wall Art") { part(length, height, .055, 0, height / 2, 0, wood); part(length * .84, height * .8, .025, 0, height / 2, .04, fabric);
      } else if (kind === "Shoe Rack" || kind === "Shoe Cabinet") { part(length, height * .85, depth, 0, height * .43, 0, wood); for (let i = 1; i <= (kind === "Shoe Rack" ? 2 : 3); i++) part(length * .94, .045, depth * .92, 0, height * i / 4, 0, fabric);
      } else if (kind === "Bathroom Cabinet") {
        part(length, height, depth, 0, height / 2, 0, wood); part(length * .88, height * .88, .035, 0, height / 2, depth * .51, fabric);
      } else if (kind === "Wardrobe" || kind === "Bookshelf") {
        part(length, height, depth, 0, height / 2, 0, wood);
        if (kind === "Bookshelf") for (let i = 1; i <= 3; i++) part(length * .94, .035, depth * .92, 0, height * i / 4, 0, fabric);
        else part(.035, height * .88, .035, 0, height / 2, depth * .51, dark);
      } else {
        part(length, height * .7, depth, 0, height * .35, 0, wood); part(length * .94, .06, depth * .9, 0, height * .72, 0, fabric);
      }
      if (showFurnitureLabels) { const labelCanvas = document.createElement("canvas"); labelCanvas.width = 320; labelCanvas.height = 72; const labelContext = labelCanvas.getContext("2d"); if (labelContext) { labelContext.fillStyle = "rgba(255,255,255,.88)"; labelContext.fillRect(0, 0, labelCanvas.width, labelCanvas.height); labelContext.fillStyle = "#1f2937"; labelContext.font = "600 34px sans-serif"; labelContext.textAlign = "center"; labelContext.textBaseline = "middle"; labelContext.fillText(item.name, 160, 36, 300); const texture = new THREE.CanvasTexture(labelCanvas); const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })); label.position.set(0, ceilingMounted ? -height - .12 : height + .24, 0); label.scale.set(Math.min(1.5, Math.max(.6, length * .9)), .28, 1); furnitureGroup.add(label); } }
    });
    furniture.filter(item => visibleRooms.some(room => room.id === item.roomId)).forEach(item => { const x = item.x_ft * FT; const z = item.y_ft * FT; maxX = Math.max(maxX, x + item.length_ft * FT); maxZ = Math.max(maxZ, z + item.width_ft * FT); minX = Math.min(minX, x); minZ = Math.min(minZ, z); });
    const center = new THREE.Vector3((minX + maxX) / 2, ceiling / 2, (minZ + maxZ) / 2); let targetCenter = center; const span = Math.max(maxX - minX, maxZ - minZ, 5); const distance = span * 1.6;
    if (mode === "top") { camera.up.set(0, 0, -1); camera.position.set(center.x, center.y + distance, center.z + .001); }
    else if (mode === "room") { const room = rooms.find(candidate => candidate.id === currentRoomId) || rooms[0]; const b = bounds(room); targetCenter = new THREE.Vector3(b.x + b.width / 2, Math.min(ceiling / 2, 1.4), b.z + b.depth / 2); const roomDistance = Math.max(b.width, b.depth, 2.5) * 1.8; camera.position.set(targetCenter.x + roomDistance, targetCenter.y + roomDistance * .72, targetCenter.z + roomDistance); controls.target.copy(targetCenter); }
    else if (mode === "walkthrough") { const current = rooms.find(room => room.id === currentRoomId) || rooms[0]; const b = bounds(current); camera.position.set(b.x + b.width / 2, Math.min(ceiling - .25, 1.6), b.z + b.depth / 2); camera.rotation.order = "YXZ"; camera.lookAt(camera.position.x, camera.position.y, camera.position.z + 3); controls.enabled = !immersive360; }
    else if (mode === "outside" && immersive360) {
      const entrance = openings.find(opening => opening.type === "door" && opening.isMainEntrance) || openings.find(opening => opening.type === "door");
      const entryRoom = rooms.find(room => room.id === entrance?.roomId) || rooms[0]; const b = bounds(entryRoom); const side = entrance?.wall || "south";
      const horizontal = side === "north" || side === "south"; const total = horizontal ? b.width / FT : b.depth / FT; const span = Math.min(total, entryRoom.wallLengths?.[side] ?? total); const wallStart = (total - span) / 2 + (entrance?.offset_ft || 0) + (entrance?.width_ft || 3) / 2;
      let dx = b.x + b.width / 2, dz = b.z + b.depth / 2;
      if (side === "north" || side === "south") { dx = b.x + wallStart * FT; dz = side === "north" ? b.z - 3 : b.z + b.depth + 3; }
      else { dz = b.z + wallStart * FT; dx = side === "west" ? b.x - 3 : b.x + b.width + 3; }
      camera.position.set(dx, 1.65, dz); camera.lookAt(dx + (side === "west" ? 1 : side === "east" ? -1 : 0), 1.65, dz + (side === "north" ? 1 : side === "south" ? -1 : 0)); controls.target.set(b.x + b.width / 2, 1.2, b.z + b.depth / 2);
    }
    else camera.position.set(center.x + distance, center.y + distance * .8, center.z + distance);
    if (mode === "walkthrough") { const lookTarget = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z + 3); camera.lookAt(lookTarget); controls.target.copy(lookTarget); }
    else if (mode !== "outside") { camera.lookAt(targetCenter); controls.target.copy(targetCenter); }
    controls.update();
    if (immersive360 && mode === "walkthrough") {
      if (lookRoomRef.current === currentRoomId && lookOrientationRef.current) { camera.rotation.order = "YXZ"; camera.rotation.y = lookOrientationRef.current.yaw; camera.rotation.x = lookOrientationRef.current.pitch; }
      else { lookRoomRef.current = currentRoomId || null; lookOrientationRef.current = null; }
    }
    let cameraTween: { from: THREE.Vector3; to: THREE.Vector3; started: number; duration: number } | null = null; let entranceTimer: number | undefined;
    tourMoveRef.current = (id: string) => { if (!immersive360 || mode !== "walkthrough") return; const room = rooms.find(candidate => candidate.id === id); if (!room) return; const b = bounds(room); cameraTween = { from: camera.position.clone(), to: new THREE.Vector3(b.x + b.width / 2, Math.min(ceiling - .25, 1.6), b.z + b.depth / 2), started: performance.now(), duration: 900 }; };
    const syncTourRoom = () => tourMoveRef.current(currentRoomId || ""); syncTourRoom();
    const resize = () => { const w = Math.max(1, host.clientWidth); const h = Math.max(1, host.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const raycaster = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let pointerStart: { x: number; y: number; multi: boolean } | null = null;
    const roomAt = (event: MouseEvent | PointerEvent) => { const rect = renderer.domElement.getBoundingClientRect(); ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera); return raycaster.intersectObjects(pickableFloors, false)[0]?.object.userData.roomId as string | undefined; };
    const wallRotations: Record<WallSide, number> = { north: 0, east: -Math.PI / 2, south: Math.PI, west: Math.PI / 2 }; const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const groundPoint = new THREE.Vector3();
    let furnitureDrag: { pointerId: number; id: string; group: THREE.Group; pending?: { x: number; y: number; roomId: string; wallSide?: WallSide; wallOffset?: number }; moved: boolean } | null = null;
    const dragFurnitureToPointer = (event: PointerEvent) => {
      if (!furnitureDrag) return; const item = furniture.find(candidate => candidate.id === furnitureDrag?.id); if (!item) return;
      const rect = renderer.domElement.getBoundingClientRect(); ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera);
      if (immersive360 && mode === "walkthrough") {
        const room = rooms.find(candidate => candidate.id === currentRoomId); if (!room) return;
        const b = roomBoundsFt(room); const yaw = camera.rotation.y; const dx = Math.sin(yaw); const dz = Math.cos(yaw);
        const candidates: { side: WallSide; t: number }[] = [];
        if (Math.abs(dx) > .0001) { candidates.push({ side: dx > 0 ? "east" : "west", t: ((dx > 0 ? b.x + b.w : b.x) * FT - camera.position.x) / dx }); }
        if (Math.abs(dz) > .0001) { candidates.push({ side: dz > 0 ? "south" : "north", t: ((dz > 0 ? b.y + b.h : b.y) * FT - camera.position.z) / dz }); }
        const front = candidates.filter(candidate => candidate.t > .05).sort((a, c) => a.t - c.t)[0]; if (!front) return;
        const wall: WallSide = front.side; const wallPlane = wall === "north" || wall === "south" ? new THREE.Plane(new THREE.Vector3(0, 0, wall === "north" ? 1 : -1), (wall === "north" ? -b.y * FT : (b.y + b.h) * FT)) : new THREE.Plane(new THREE.Vector3(wall === "west" ? 1 : -1, 0, 0), (wall === "west" ? -b.x * FT : (b.x + b.w) * FT));
        const point = new THREE.Vector3(); if (!raycaster.ray.intersectPlane(wallPlane, point)) return;
        const horizontal = wall === "north" || wall === "south"; const length = horizontal ? b.w : b.h; const itemSpan = horizontal ? item.length_ft : item.width_ft; const along = horizontal ? point.x / FT - b.x : point.z / FT - b.y; const offset = Math.max(0, Math.min(length - itemSpan, along - itemSpan / 2));
        const x = horizontal ? b.x + offset : wall === "west" ? b.x : b.x + b.w - item.length_ft; const y = horizontal ? wall === "north" ? b.y : b.y + b.h - item.width_ft : b.y + offset;
        const centerAlong = offset + itemSpan / 2; furnitureDrag.group.position.x = horizontal ? (b.x + centerAlong) * FT : (wall === "west" ? b.x + .04 : b.x + b.w - .04) * FT; furnitureDrag.group.position.z = horizontal ? (wall === "north" ? b.y + .04 : b.y + b.h - .04) * FT : (b.y + centerAlong) * FT; furnitureDrag.group.position.y = Math.max(.25, Math.min(ceiling - item.height_ft * FT, point.y));
        furnitureDrag.group.rotation.y = wallRotations[wall]; furnitureDrag.pending = { x, y, roomId: room.id, wallSide: wall, wallOffset: offset }; furnitureDrag.moved = true; return;
      }
      if (!raycaster.ray.intersectPlane(floorPlane, groundPoint)) return;
      const centerX = groundPoint.x / FT; const centerY = groundPoint.z / FT; const room = rooms.find(candidate => { const b = roomBoundsFt(candidate); return centerX >= b.x && centerX <= b.x + b.w && centerY >= b.y && centerY <= b.y + b.h; }) || rooms.reduce<PlanRoom | null>((nearest, candidate) => { if (!nearest) return candidate; const a = roomBoundsFt(candidate), b = roomBoundsFt(nearest); return Math.hypot(centerX - (a.x + a.w / 2), centerY - (a.y + a.h / 2)) < Math.hypot(centerX - (b.x + b.w / 2), centerY - (b.y + b.h / 2)) ? candidate : nearest; }, null); if (!room) return;
      const b = roomBoundsFt(room); const kind = item.kind || item.name; const wallMounted = Boolean(item.wall_side) || ["Wall Clock", "Wall Art", "TV", "Air Conditioner (AC)", "Wall Light", "Exhaust Fan"].includes(kind); let x = centerX - item.length_ft / 2; let y = centerY - item.width_ft / 2;
      if (wallMounted) {
        const distances: [WallSide, number][] = [["north", Math.abs(centerY - b.y)], ["east", Math.abs(centerX - (b.x + b.w))], ["south", Math.abs(centerY - (b.y + b.h))], ["west", Math.abs(centerX - b.x)]]; const wallSide = distances.sort((a, c) => a[1] - c[1])[0][0]; const horizontal = wallSide === "north" || wallSide === "south"; const wallOffset = Math.max(0, Math.min((horizontal ? b.w : b.h) - (horizontal ? item.length_ft : item.width_ft), horizontal ? centerX - b.x - item.length_ft / 2 : centerY - b.y - item.width_ft / 2));
        if (wallSide === "north" || wallSide === "south") { x = b.x + wallOffset; y = wallSide === "north" ? b.y : b.y + b.h - item.width_ft; } else { x = wallSide === "west" ? b.x : b.x + b.w - item.length_ft; y = b.y + wallOffset; }
        furnitureDrag.group.position.x = (wallSide === "east" ? b.x + b.w - .08 : wallSide === "west" ? b.x + .08 : b.x + wallOffset + item.length_ft / 2) * FT; furnitureDrag.group.position.z = (wallSide === "north" ? b.y + .08 : wallSide === "south" ? b.y + b.h - .08 : b.y + wallOffset + item.width_ft / 2) * FT; furnitureDrag.group.rotation.y = wallRotations[wallSide]; furnitureDrag.pending = { x, y, roomId: room.id, wallSide, wallOffset };
      } else { furnitureDrag.group.position.x = centerX * FT; furnitureDrag.group.position.z = centerY * FT; furnitureDrag.pending = { x, y, roomId: room.id }; }
      furnitureDrag.moved = true;
    };
    let lookPointer: { id: number; x: number; y: number } | null = null;
    const selectDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect(); ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera); const currentRoomGroups = immersive360 ? [...furnitureGroups.entries()].filter(([id]) => furniture.find(item => item.id === id)?.roomId === currentRoomId).map(([, object]) => object) : [...furnitureGroups.values()]; const hit = raycaster.intersectObjects(clientPresentation ? [] : currentRoomGroups, true)[0]?.object; let hitGroup: THREE.Object3D | null = hit || null; while (hitGroup && !hitGroup.userData.furnitureId) hitGroup = hitGroup.parent; const furnitureId = hitGroup?.userData.furnitureId as string | undefined;
      if (furnitureId && hitGroup instanceof THREE.Group) { onSelectRoom?.(`furniture:${furnitureId}`, false); if (layoutFixed) { event.preventDefault(); return; } furnitureDrag = { pointerId: event.pointerId, id: furnitureId, group: hitGroup, moved: false }; controls.enabled = false; renderer.domElement.setPointerCapture(event.pointerId); event.preventDefault(); return; }
      if (immersive360 && mode === "walkthrough") { lookPointer = { id:event.pointerId, x:event.clientX, y:event.clientY }; renderer.domElement.setPointerCapture(event.pointerId); return; }
      pointerStart = { x: event.clientX, y: event.clientY, multi: event.ctrlKey || event.metaKey || multiSelectRef.current };
    };
    const lookMove = (event: PointerEvent) => { if (furnitureDrag?.pointerId === event.pointerId) { dragFurnitureToPointer(event); return; } if (!lookPointer || lookPointer.id !== event.pointerId) return; const dx = event.clientX - lookPointer.x; const dy = event.clientY - lookPointer.y; lookPointer = { ...lookPointer, x:event.clientX, y:event.clientY }; camera.rotation.order = "YXZ"; camera.rotation.y -= dx * .004; camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x - dy * .004)); lookOrientationRef.current = { yaw: camera.rotation.y, pitch: camera.rotation.x }; };
    const selectUp = (event: PointerEvent) => {
      if (furnitureDrag?.pointerId === event.pointerId) { const drag = furnitureDrag; furnitureDrag = null; if (drag.pending && drag.moved) moveFurnitureRef.current?.(drag.id, drag.pending.x, drag.pending.y, drag.pending.roomId, drag.pending.wallSide, drag.pending.wallOffset); controls.enabled = !(immersive360 && mode === "walkthrough"); if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId); return; }
      if (lookPointer?.id === event.pointerId) { lookPointer = null; if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId); return; }
      const start = pointerStart; pointerStart = null; if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect(); ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera);
      if (immersive360 && mode === "outside") {
        const door = raycaster.intersectObjects(interactiveDoors.filter(item => item.visible), false)[0]?.object as THREE.Mesh | undefined;
        if (door?.userData.isTourEntrance && door.userData.roomId) { door.visible = false; localStorage.setItem(`360-tour-opened:${tourKey}:${door.userData.openingId}`, "1"); localStorage.setItem(`360-tour-entered:${tourKey}`, "1"); setShowEnterHint(false); const roomId = String(door.userData.roomId); const room = rooms.find(candidate => candidate.id === roomId); if (room) { const b = bounds(room); cameraTween = { from: camera.position.clone(), to: new THREE.Vector3(b.x + b.width / 2, Math.min(ceiling - .25, 1.6), b.z + b.depth / 2), started: performance.now(), duration: 900 }; entranceTimer = window.setTimeout(() => { lookRoomRef.current = roomId; lookOrientationRef.current = { yaw: camera.rotation.y, pitch: camera.rotation.x }; onTourRoomChange?.(roomId); }, 900); } else onTourRoomChange?.(roomId); }
        return;
      }
      if (immersive360) return;
      const id = roomAt(event); if (id) onSelectRoom?.(id, start.multi);
    };
    const editDoubleClick = (event: MouseEvent) => { if (clientPresentation) return; const rect = renderer.domElement.getBoundingClientRect(); ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(ndc, camera); const currentRoomGroups = immersive360 ? [...furnitureGroups.entries()].filter(([id]) => furniture.find(item => item.id === id)?.roomId === currentRoomId).map(([, object]) => object) : [...furnitureGroups.values()]; const hit = raycaster.intersectObjects(currentRoomGroups, true)[0]?.object; let object: THREE.Object3D | null = hit || null; while (object && !object.userData.furnitureId) object = object.parent; const furnitureId = object?.userData.furnitureId as string | undefined; if (furnitureId) { onEditFurniture?.(furnitureId); return; } const wallHit = raycaster.intersectObjects(wallMeshes.filter(mesh => !immersive360 || mesh.userData.wallRoomId === currentRoomId), false)[0]?.object as THREE.Mesh | undefined; if (wallHit?.userData.wallRoomId && wallHit.userData.wallSide) { onEditWall?.(String(wallHit.userData.wallRoomId), wallHit.userData.wallSide as WallSide); return; } if (immersive360) return; const id = roomAt(event); if (id) onEditRoom?.(id); };
    renderer.domElement.addEventListener("pointerdown", selectDown); renderer.domElement.addEventListener("pointermove", lookMove); renderer.domElement.addEventListener("pointerup", selectUp); renderer.domElement.addEventListener("dblclick", editDoubleClick);
    snapshotRef.current = () => renderer.domElement.toDataURL("image/png"); onSnapshotReady?.(() => snapshotRef.current?.() || "");
    let frame = 0; let active = true;
    const animate = (now: number) => { if (!active) return; frame = requestAnimationFrame(animate); if (cameraTween) { const progress = Math.min(1, (now - cameraTween.started) / cameraTween.duration); const eased = progress * progress * (3 - 2 * progress); camera.position.lerpVectors(cameraTween.from, cameraTween.to, eased); if (progress >= 1) cameraTween = null; } if (!(immersive360 && mode === "walkthrough")) controls.update(); renderer.render(scene, camera); }; animate(performance.now());
    const keyMove = (e: KeyboardEvent) => {
      if (mode !== "walkthrough" || immersive360 || /INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName || "")) return;
      if (!["w", "a", "s", "d"].includes(e.key.toLowerCase())) return;
      e.preventDefault();
      const step = .32; const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      if (e.key.toLowerCase() === "w") camera.position.addScaledVector(forward, step);
      if (e.key.toLowerCase() === "s") camera.position.addScaledVector(forward, -step);
      if (e.key.toLowerCase() === "a") camera.position.addScaledVector(right, -step);
      if (e.key.toLowerCase() === "d") camera.position.addScaledVector(right, step);
      if (immersive360) { const current = rooms.find(room => room.id === currentRoomId) || rooms[0]; if (current) { const b = bounds(current); camera.position.x = Math.max(b.x + .3, Math.min(b.x + b.width - .3, camera.position.x)); camera.position.z = Math.max(b.z + .3, Math.min(b.z + b.depth - .3, camera.position.z)); } }
      camera.position.y = Math.max(1.25, Math.min(ceiling - .2, camera.position.y)); controls.target.copy(camera.position).add(forward);
    };
    joystickMoveRef.current = (x, y) => {
      if (mode !== "walkthrough" || immersive360) return;
      const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      const delta = forward.multiplyScalar(-y).add(right.multiplyScalar(x)).multiplyScalar(.22);
      camera.position.add(delta); controls.target.add(delta); camera.position.y = Math.max(1.25, Math.min(ceiling - .2, camera.position.y));
    };
    window.addEventListener("keydown", keyMove);
    return () => { active = false; if (entranceTimer) window.clearTimeout(entranceTimer); cancelAnimationFrame(frame); window.removeEventListener("keydown", keyMove); renderer.domElement.removeEventListener("pointerdown", selectDown); renderer.domElement.removeEventListener("pointermove", lookMove); renderer.domElement.removeEventListener("pointerup", selectUp); renderer.domElement.removeEventListener("dblclick", editDoubleClick); observer.disconnect(); controls.dispose(); group.traverse(o => { const mesh = o as THREE.Mesh; mesh.geometry?.dispose(); if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose()); else mesh.material?.dispose(); }); roomFloorsRef.current.clear(); wheelResources.forEach(resource => { resource.geometry.dispose(); resource.material.dispose(); resource.texture?.dispose(); }); renderer.dispose(); renderer.domElement.remove(); snapshotRef.current = null; joystickMoveRef.current = () => {}; };
  }, [rooms, openings, customWalls, furniture, roomTiles, showFurnitureLabels, layoutFixed, ceilingHeightFt, wallOpacity, windowOpacity, mode, immersive360, tourKey, onTourRoomChange, showDirection, show32Zones, northAngle, labelMode, wheelLayers, wheelScale, wheelOpacity, wheelOffsetXFt, wheelOffsetYFt, centerRoomId, centerWheelOnRoom, onSelectRoom, onEditRoom, onSnapshotReady]);

  useEffect(() => { if (immersive360 && mode === "walkthrough" && currentRoomId) tourMoveRef.current(currentRoomId); }, [currentRoomId, immersive360, mode]);

  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => { const rect = event.currentTarget.getBoundingClientRect(); joystickPointerRef.current = { id: event.pointerId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; event.currentTarget.setPointerCapture(event.pointerId); };
  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => { const start = joystickPointerRef.current; if (!start || start.id !== event.pointerId) return; const x = Math.max(-1, Math.min(1, (event.clientX - start.x) / 42)); const y = Math.max(-1, Math.min(1, (event.clientY - start.y) / 42)); setJoystick({ x: x * 30, y: y * 30 }); joystickMoveRef.current(x, y); };
  const pointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => { joystickPointerRef.current = null; setJoystick({ x: 0, y: 0 }); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  const activeTourRoom = rooms.find(room => room.id === currentRoomId) || rooms[0];
  const clientTourRooms = [...rooms].sort((a, b) => { const rank = (room: PlanRoom) => { const name = `${room.name} ${room.type}`.toLowerCase(); if (/hall|living|foyer|entrance/.test(name)) return 0; if (/balcony/.test(name)) return 1; if (/kitchen/.test(name)) return 2; if (/dining/.test(name)) return 3; if (/bed/.test(name)) return 4; if (/bath|wash|toilet/.test(name)) return 5; return 6; }; return rank(a) - rank(b); });
  const tourIndex = Math.max(0, clientTourRooms.findIndex(room => room.id === currentRoomId));
  useEffect(() => { if (!clientPlaying || !clientPresentation || mode !== "walkthrough") return; const timer = window.setInterval(() => { const next = clientTourRooms[tourIndex + 1]; if (next) onTourRoomChange?.(next.id); else setClientPlaying(false); }, 5000); return () => window.clearInterval(timer); }, [clientPlaying, clientPresentation, mode, tourIndex, currentRoomId]);
  useEffect(() => { const name=`${activeTourRoom?.name||""} ${activeTourRoom?.type||""}`.toLowerCase(); if(name.includes("laundry")||name.includes("utility")||name.includes("wash area")||name.includes("washing"))setFurnitureCategory("Utility"); else if(name.includes("bath")||name.includes("wash")||name.includes("toilet")||name.includes("wc"))setFurnitureCategory("Bathroom"); else if(name.includes("kitchen"))setFurnitureCategory("Kitchen"); else if(name.includes("foyer"))setFurnitureCategory("Storage"); else if(name.includes("hall")||name.includes("living"))setFurnitureCategory("Living"); else if(name.includes("bed"))setFurnitureCategory("Bedroom"); else if(name.includes("dining"))setFurnitureCategory("Dining"); else if(name.includes("pooja")||name.includes("mandir")||name.includes("temple"))setFurnitureCategory("Pooja"); }, [activeTourRoom?.id]);
  const tourConnections = immersive360 && mode === "walkthrough" && activeTourRoom ? roomConnections(activeTourRoom, rooms, openings) : [];
  const tourArrow: Record<WallSide, string> = { north:"↑", east:"→", south:"↓", west:"←" };
  const hasEntrance = openings.some(opening => opening.type === "door" && opening.isMainEntrance) || openings.some(opening => opening.type === "door");
  const visibleFurniture = FURNITURE_CATALOG.filter(item => (furnitureCategory === "All" || item.category === furnitureCategory) && item.name.toLowerCase().includes(furnitureSearch.toLowerCase())); const visibleElectrical = ELECTRICAL_CATALOG.filter(item => item.name.toLowerCase().includes(electricalSearch.toLowerCase()));
  return <div className="absolute inset-0"><div ref={hostRef} className="absolute inset-0 overflow-hidden bg-slate-100"/>{unavailable && <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">3D preview is unavailable in this browser. The 2D plan remains available.</div>}
    {immersive360 && mode === "outside" && <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-3"><div className="rounded-xl border bg-background/95 px-4 py-3 text-center shadow-lg"><p className="font-semibold">{clientPresentation ? "360° Client View" : hasEntrance ? "Start your 360° home tour" : "Add a main entrance door to start the tour"}</p>{hasEntrance && <p className="mt-1 text-sm text-muted-foreground">{clientPresentation ? "Select the entrance door to begin the guided tour." : "Click the main entrance door to open it and walk inside."}</p>}</div></div>}
    {immersive360 && mode === "walkthrough" && !clientPresentation && <aside className={tourMenuMode === "slider" ? `absolute inset-x-2 z-30 flex flex-col gap-2 overflow-y-auto rounded-t-xl border bg-card p-3 shadow-xl transition-[top,bottom] ${tourMenuExpanded ? "top-2 bottom-2" : "bottom-2 h-[46dvh]"}` : "absolute right-3 top-3 z-20 flex max-h-[min(70vh,560px)] w-60 flex-col gap-2 overflow-y-auto rounded-xl border bg-card p-3 shadow-sm"}>
      <div className="shrink-0 border-b pb-2"><div className="flex items-center justify-between gap-2"><div><p className="font-semibold">Add to room</p><p className="text-xs text-muted-foreground">For {activeTourRoom?.name || "this room"}</p></div><div className="flex items-center gap-1"><button type="button" aria-pressed={tourMenuMode === "window"} onClick={() => { setTourMenuMode("window"); setTourMenuExpanded(false); }} className="rounded border px-2 py-1 text-[11px] hover:bg-accent">Window</button><button type="button" aria-pressed={tourMenuMode === "slider"} onClick={() => setTourMenuMode("slider")} className="rounded border px-2 py-1 text-[11px] hover:bg-accent">Slider</button>{tourMenuMode === "slider" && <button type="button" aria-label={tourMenuExpanded ? "Collapse room tools" : "Expand room tools"} onClick={() => setTourMenuExpanded(value => !value)} className="rounded border px-2 py-1 text-[11px] hover:bg-accent">{tourMenuExpanded ? "↓" : "↑"}</button>}</div></div><button type="button" aria-pressed={!showFurnitureLabels} disabled={layoutFixed} onClick={() => onShowFurnitureLabels?.(!showFurnitureLabels)} className="mt-2 w-full rounded-md border bg-background px-2 py-1.5 text-left text-xs font-medium hover:bg-accent">{showFurnitureLabels ? "Hide furniture & electrical names" : "Show furniture & electrical names"}</button></div>
      <details open className="rounded-lg border bg-background p-2">
        <summary className="cursor-pointer text-sm font-medium">Furniture</summary>
        <div className="mt-2 space-y-2"><select id="furniture-category" aria-label="Filter furniture category" value={furnitureCategory} onChange={event => setFurnitureCategory(event.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-xs">{["All", "Living", "Bedroom", "Dining", "Kitchen", "Bathroom", "Utility", "Work", "Storage", "Decor", "Pooja"].map(category => <option key={category} value={category}>{category === "All" ? "All furniture" : category}</option>)}</select><input aria-label="Search furniture" placeholder="Search furniture…" value={furnitureSearch} onChange={event => setFurnitureSearch(event.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-xs" /><div className="max-h-36 space-y-1 overflow-y-auto">{visibleFurniture.map(item => <button key={item.name} type="button" disabled={layoutFixed} onClick={() => onAddFurniture?.(item.name)} className="flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-sm hover:bg-accent"><span>{item.name}</span><span className="text-xs text-muted-foreground">Add +</span></button>)}</div></div>
      </details>
      <details className="rounded-lg border bg-background p-2">
        <summary className="cursor-pointer text-sm font-medium">Electrical & lights</summary>
        <div className="mt-2 space-y-2"><input aria-label="Search electrical and lights" placeholder="Search electrical & lights…" value={electricalSearch} onChange={event => setElectricalSearch(event.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-xs" /><div className="max-h-36 space-y-1 overflow-y-auto">{visibleElectrical.map(item => <button key={item.name} type="button" disabled={layoutFixed} onClick={() => onAddFurniture?.(item.name)} className="flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-sm hover:bg-accent"><span>{item.name}</span><span className="text-xs text-muted-foreground">Add +</span></button>)}</div></div>
      </details>
      <div className="rounded-lg border bg-background p-2"><p className="mb-1 text-xs font-medium text-muted-foreground">Jump to connected room</p>{tourConnections.length ? <div className="flex flex-wrap gap-1.5">{tourConnections.map(({ side, other }) => <button key={`jump-${side}-${other.id}`} type="button" onClick={() => onTourRoomChange?.(other.id)} className="rounded-md border bg-background px-2 py-1.5 text-xs font-medium hover:bg-accent"><span className="mr-1">{tourArrow[side]}</span>{other.name}</button>)}</div> : <p className="text-xs text-muted-foreground">No open doorway to another room.</p>}</div>
      <div className="rounded-lg border bg-background p-2"><p className="mb-1 text-xs font-medium">Added items · drag in 3D/360 to move</p><div className="max-h-28 space-y-1 overflow-y-auto">{furniture.filter(item => item.roomId === activeTourRoom?.id).map(item => <button key={`edit-${item.id}`} type="button" onClick={() => onEditFurniture?.(item.id)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"><span className="truncate">{item.name}</span><span className="ml-2 shrink-0 text-muted-foreground">Edit</span></button>)}</div>{!furniture.some(item => item.roomId === activeTourRoom?.id) && <p className="text-xs text-muted-foreground">Add an item above to see it here.</p>}</div>
    </aside>}
    {immersive360 && mode === "walkthrough" && !clientPresentation && <div className="absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-2 px-3"><div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border bg-background/95 px-3 py-2 text-sm font-medium shadow"><span className="whitespace-nowrap">{activeTourRoom?.name || "Inside home"} · 360° view · drag to look; drag an item to place it on the front wall</span><button type="button" onClick={onTourExit} className="rounded border px-2 py-1 text-xs hover:bg-accent">Outside</button></div></div>}
    {immersive360 && clientPresentation && mode === "walkthrough" && <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-3"><div className="flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-xl backdrop-blur"><div className="min-w-40 text-center"><p className="text-sm font-semibold">{activeTourRoom?.name || "Home tour"}</p><p className="text-xs text-muted-foreground">{activeTourRoom ? `${activeTourRoom.length_ft}′ × ${activeTourRoom.width_ft}′` : "Explore the home in 360°"}</p></div><span className="text-xs text-muted-foreground">{tourIndex + 1} / {clientTourRooms.length} rooms</span><button type="button" onClick={() => { const next = clientTourRooms[tourIndex - 1]; if (next) onTourRoomChange?.(next.id); }} disabled={tourIndex <= 0} className="rounded-md border px-3 py-2 text-sm disabled:opacity-40">Previous</button><button type="button" onClick={() => setClientPlaying(value => !value)} className="rounded-md border px-3 py-2 text-sm">{clientPlaying ? "Pause tour" : "Play tour"}</button><button type="button" onClick={() => { const next = clientTourRooms[tourIndex + 1]; if (next) onTourRoomChange?.(next.id); }} disabled={tourIndex >= clientTourRooms.length - 1} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">Next room</button><button type="button" onClick={onTourExit} className="rounded-md border px-3 py-2 text-sm">Exit tour</button></div></div>}
    {mode === "walkthrough" && !immersive360 && <div className="absolute bottom-20 left-4 z-20 md:hidden"><button type="button" aria-label="Touch joystick to walk" className="relative h-24 w-24 touch-none rounded-full border border-slate-500/40 bg-slate-900/20 shadow-inner" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}><span className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 rounded-full border border-white/60 bg-white/70 shadow" style={{ transform: `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))` }}/></button><p className="mt-1 text-center text-[10px] text-slate-700">Move</p></div>}
  </div>;
}

