import { MouseEvent as ReactMouseEvent, PointerEvent, WheelEvent, useCallback, useEffect, useRef, useState } from "react";
import { PlanData, PlanFurniture, PlanOpening, PlanRoom, PlanWall } from "./types";
import { DirectionWheelLayers, drawDirectionWheel } from "./direction-wheel";

interface Props {
  rooms: PlanRoom[];
  openings: PlanOpening[];
  furniture?: PlanFurniture[];
  customWalls?: PlanWall[];
  roomTiles?: PlanData["roomTiles"];
  onMoveFurniture?: (id: string, x: number, y: number, roomId?: string) => void;
  onResizeFurniture?: (id: string, length: number, width: number) => void;
  onDoubleClickFurniture?: (id: string) => void;
  selectedIds: string[];
  zoom: number;
  panX?: number;
  panY?: number;
  windowOpacity?: number;
  northAngle: number;
  showDirection?: boolean;
  show32Zones?: boolean;
  wheelScale?: number;
  wheelOpacity?: number;
  wheelOffsetXFt?: number;
  wheelOffsetYFt?: number;
  wheelLayers?: DirectionWheelLayers;
  labelMode?: "all" | "names" | "sizes" | "none";
  showFurnitureLabels?: boolean;
  multiSelect?: boolean;
  layoutFixed?: boolean;
  wallEditMode?: "off" | "erase" | "restore" | "pen";
  centerWheelOnRoom?: boolean;
  companyName?: string;
  canvasRef?: (canvas: HTMLCanvasElement | null) => void;
  onSelect: (id: string, multi: boolean) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, length: number, width: number) => void;
  onZoom: (value: number) => void;
  onNorthAngle?: (value: number) => void;
  onWheelOffsetChange?: (x: number, y: number) => void;
  onDoubleClickRoom?: (id: string) => void;
  onRotateRoom?: (id: string, rotation: number) => void;
  onMoveOpening?: (id: string, wall: PlanOpening["wall"], offset: number) => void;
  onDoubleClickOpening?: (id: string) => void;
  onWallSegmentToggle?: (id: string, side: "north" | "east" | "south" | "west", segment: number, restore: boolean) => void;
  onAddWall?: (wall: PlanWall) => void;
}

const MARGIN = 54;
function extents(rooms: PlanRoom[]) {
  if (!rooms.length) return { x: 20, y: 15 };
  return rooms.reduce((size, room) => {
    const rotated = room.rotation % 180 !== 0;
    const width = rotated ? room.width_ft : room.length_ft;
    const height = rotated ? room.length_ft : room.width_ft;
    return { x: Math.max(size.x, room.x_ft + width + 2), y: Math.max(size.y, room.y_ft + height + 2) };
  }, { x: 0, y: 0 });
}
function geometry(canvas: HTMLCanvasElement, rooms: PlanRoom[], zoom: number, panX = 0, panY = 0) {
  const bounds = extents(rooms); const w = canvas.clientWidth || 800; const h = canvas.clientHeight || 600;
  const scale = Math.max(2, Math.min(42, (w - MARGIN * 2) / bounds.x, (h - MARGIN * 2) / bounds.y)) * zoom;
  return { scale, w, h, ox: MARGIN + panX, oy: MARGIN + panY };
}
function roomRect(room: PlanRoom, scale: number, ox: number, oy: number) {
  const rotated = room.rotation % 180 !== 0;
  const l = rotated ? room.width_ft : room.length_ft; const w = rotated ? room.length_ft : room.width_ft;
  return { x: ox + room.x_ft * scale, y: oy + room.y_ft * scale, w: l * scale, h: w * scale, l, d: w };
}
function overlaps(a: PlanRoom, b: PlanRoom) {
  const ar = roomRect(a, 1, 0, 0); const br = roomRect(b, 1, 0, 0);
  return ar.x < br.x + br.w - 0.05 && ar.x + ar.w > br.x + 0.05 && ar.y < br.y + br.h - 0.05 && ar.y + ar.h > br.y + 0.05;
}

export function drawPlanOnCanvas(canvas: HTMLCanvasElement, rooms: PlanRoom[], openings: PlanOpening[], selectedIds: string[], zoom = 1, companyName = "", northAngle = 0, showDirection = false, show32Zones = false, wheelScale = 1, centerWheelOnRoom = false, wheelOpacity = 0.65, wheelOffsetXFt = 0, wheelOffsetYFt = 0, labelMode: "all" | "names" | "sizes" | "none" = "all", wheelLayers: DirectionWheelLayers = {}, furniture: PlanFurniture[] = [], panX = 0, panY = 0, windowOpacity = .24, roomTiles: PlanData["roomTiles"] = {}, showFurnitureLabels = true, customWalls: PlanWall[] = [], wallDraft?: PlanWall | null) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); const { scale, w, h, ox, oy } = geometry(canvas, rooms, zoom, panX, panY);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(100,116,139,.12)"; ctx.lineWidth = 1;
  for (let x = ox; x < w; x += scale) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = oy; y < h; y += scale) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const bounds = extents(rooms); const wheelCenter = centerWheelOnRoom && selectedIds.length ? rooms.find(room => room.id === selectedIds[0]) : null;
  const centerRoomRect = wheelCenter ? roomRect(wheelCenter, scale, ox, oy) : null;
  const wcx = (centerRoomRect ? centerRoomRect.x + centerRoomRect.w / 2 : ox + bounds.x * scale / 2) + wheelOffsetXFt * scale;
  const wcy = (centerRoomRect ? centerRoomRect.y + centerRoomRect.h / 2 : oy + bounds.y * scale / 2) + wheelOffsetYFt * scale;
  const fittedRadius = Math.max(70, Math.min((w - MARGIN * 2) / 2, (h - MARGIN * 2) / 2, bounds.x * scale / 2 + 38, bounds.y * scale / 2 + 38) * wheelScale);
  if (showDirection) drawDirectionWheel(ctx, wcx, wcy, fittedRadius, northAngle, show32Zones, wheelOpacity, wheelLayers);
  ctx.save(); ctx.translate(ox + 4, oy + 14); ctx.rotate(northAngle * Math.PI / 180);
  ctx.fillStyle = "#334155"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("N", 0, -4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, 10); ctx.lineTo(0, 7); ctx.lineTo(5, 10); ctx.closePath(); ctx.fill(); ctx.restore();
  const conflicts = new Set<string>();
  rooms.forEach((a, i) => rooms.slice(i + 1).forEach((b) => { if (overlaps(a, b)) { conflicts.add(a.id); conflicts.add(b.id); } }));
  rooms.forEach((room) => {
    const r = roomRect(room, scale, ox, oy); const selected = selectedIds.includes(room.id);
    // Muted room-type colors make the plan easier to scan while keeping a CAD-like drawing style.
    const tile = roomTiles?.[room.id];
    ctx.fillStyle = tile?.color || room.floorColor || "#e5e7eb"; ctx.fillRect(r.x, r.y, r.w, r.h);
    // Draw a restrained tile grid so room-specific tile sizes are visible in the 2D plan.
    if (tile && tile.size_ft > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      ctx.strokeStyle = tile.grout_color || "rgba(71,85,105,.42)"; ctx.lineWidth = Math.max(.7, scale * .025);
      for (let x = r.x + tile.size_ft * scale; x < r.x + r.w; x += tile.size_ft * scale) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); }
      for (let y = r.y + tile.size_ft * scale; y < r.y + r.h; y += tile.size_ft * scale) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
      ctx.restore();
    }
    ctx.lineWidth = selected ? 3.5 : 3; ctx.strokeStyle = conflicts.has(room.id) ? "#dc2626" : selected ? "#2563eb" : (room.borderColor || "#263238");
    const drawWall = (side: "north" | "east" | "south" | "west", dimension: number, horizontal: boolean) => {
      ctx.strokeStyle = conflicts.has(room.id) ? "#dc2626" : room.wallColors?.[side] || (selected ? "#2563eb" : room.borderColor || "#263238");
      const span = Math.min(dimension, room.wallLengths?.[side] ?? dimension); const start = (dimension - span) / 2;
      const gaps = new Set(room.openWallSegments?.[side] || []);
      const count = Math.ceil(dimension);
      for (let segment = 0; segment < count; segment++) {
        const segmentStart = segment; const segmentEnd = Math.min(dimension, segment + 1);
        if (segmentEnd <= start || segmentStart >= start + span || gaps.has(segment)) continue;
        const from = Math.max(segmentStart, start); const to = Math.min(segmentEnd, start + span);
        if (horizontal) { const y = side === "north" ? r.y : r.y + r.h; ctx.beginPath(); ctx.moveTo(r.x + from * scale, y); ctx.lineTo(r.x + to * scale, y); ctx.stroke(); }
        else { const x = side === "west" ? r.x : r.x + r.w; ctx.beginPath(); ctx.moveTo(x, r.y + from * scale); ctx.lineTo(x, r.y + to * scale); ctx.stroke(); }
      }
    };
    drawWall("north", r.l, true); drawWall("south", r.l, true); drawWall("east", r.d, false); drawWall("west", r.d, false);
    if (selected) {
      const hx = r.x + r.w - 9, hy = r.y + 9;
      ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#2563eb"; ctx.stroke();
      ctx.beginPath(); ctx.arc(hx, hy, 5, -.75, 1.15); ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 2, hy - 5); ctx.lineTo(hx + 6, hy - 5); ctx.lineTo(hx + 5, hy - 1); ctx.fillStyle = "#2563eb"; ctx.fill();
    }
    const font = Math.max(10, Math.min(15, scale * .38)); ctx.fillStyle = "#0f172a"; ctx.textAlign = "center"; ctx.font = `600 ${font}px sans-serif`;
    if (labelMode === "all" || labelMode === "names") ctx.fillText(room.name, r.x + r.w / 2, r.y + r.h / 2 - (labelMode === "all" ? 7 : 0), Math.max(30, r.w - 5));
    if (labelMode === "all" || labelMode === "sizes") { ctx.font = `${Math.max(9, font * .82)}px sans-serif`; ctx.fillText(`${r.l}′ × ${r.d}′`, r.x + r.w / 2, r.y + r.h / 2 + (labelMode === "all" ? 10 : 0), Math.max(28, r.w - 5)); }
  });
  furniture.forEach(item => { const room = rooms.find(r => r.id === item.roomId); if (!room) return; const x = ox + item.x_ft * scale, y = oy + item.y_ft * scale, fw = item.length_ft * scale, fh = item.width_ft * scale; ctx.save(); ctx.translate(x + fw / 2, y + fh / 2); ctx.rotate(item.rotation * Math.PI / 180); ctx.fillStyle = item.color || "#c5a47e"; ctx.strokeStyle = selectedIds.includes(`furniture:${item.id}`) ? "#2563eb" : "#47372a"; ctx.lineWidth = selectedIds.includes(`furniture:${item.id}`) ? 3 : 1.5; ctx.beginPath(); ctx.roundRect(-fw / 2, -fh / 2, fw, fh, Math.min(6, scale * .12)); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "rgba(36,29,22,.55)"; ctx.lineWidth = 1; if ((item.kind||item.name) === "Bed" || (item.kind||item.name) === "Sofa") { ctx.beginPath(); ctx.moveTo(-fw * .38, -fh * .27); ctx.lineTo(fw * .38, -fh * .27); ctx.stroke(); } else if ((item.kind||item.name).includes("Table") || (item.kind||item.name) === "Desk") { ctx.beginPath(); ctx.moveTo(-fw * .35, 0); ctx.lineTo(fw * .35, 0); ctx.stroke(); } if (showFurnitureLabels) { ctx.fillStyle = "#241d16"; ctx.font = `600 ${Math.max(8, Math.min(12, scale * .26))}px sans-serif`; ctx.textAlign = "center"; ctx.fillText(item.name, 0, 3, Math.max(20, fw - 4)); } if(selectedIds.includes(`furniture:${item.id}`)){ctx.fillStyle="#2563eb";ctx.strokeStyle="white";ctx.lineWidth=2;ctx.beginPath();ctx.arc(fw/2,fh/2,6,0,Math.PI*2);ctx.fill();ctx.stroke();} ctx.restore(); });
  openings.forEach((opening) => {
    const room = rooms.find((r) => r.id === opening.roomId); if (!room) return;
    const r = roomRect(room, scale, ox, oy); const width = Math.min(opening.width_ft * scale, opening.wall === "north" || opening.wall === "south" ? r.w : r.h);
    let x = r.x + r.w / 2; let y = r.y + r.h / 2;
    if (opening.wall === "north") { x = r.x + opening.offset_ft * scale; y = r.y; }
    if (opening.wall === "south") { x = r.x + opening.offset_ft * scale; y = r.y + r.h; }
    if (opening.wall === "west") { x = r.x; y = r.y + opening.offset_ft * scale; }
    if (opening.wall === "east") { x = r.x + r.w; y = r.y + opening.offset_ft * scale; }
    ctx.save(); ctx.lineWidth = Math.max(5, Math.min(10, scale * .2)); ctx.strokeStyle = opening.type === "door" ? "#92400e" : opening.type === "window" ? "#0284c7" : "#7c3aed"; ctx.beginPath();
    if (opening.type === "window") ctx.globalAlpha = windowOpacity;
    if (opening.wall === "north" || opening.wall === "south") { ctx.moveTo(x, y); ctx.lineTo(x + width, y); } else { ctx.moveTo(x, y); ctx.lineTo(x, y + width); }
    ctx.stroke();
    if (opening.type === "window") {
      ctx.save(); ctx.strokeStyle = "#172b3a"; ctx.lineWidth = Math.max(1.5, Math.min(3, scale * .075));
      const vertical = opening.wall === "north" || opening.wall === "south";
      const drawPaneLine = (offset: number) => { ctx.beginPath(); if (vertical) { ctx.moveTo(x + offset, y - 5); ctx.lineTo(x + offset, y + 5); } else { ctx.moveTo(x - 5, y + offset); ctx.lineTo(x + 5, y + offset); } ctx.stroke(); };
      drawPaneLine(width / 2); drawPaneLine(width / 3); drawPaneLine(width * 2 / 3);
      ctx.restore();
    }
    if (opening.type === "door") {
      // Keep the swing arc proportional to the opening so it doesn't dominate a compact plan.
      const swing = Math.min(width * .42, scale * .62, 18);
      ctx.save(); ctx.strokeStyle = "#92400e"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath();
      if (opening.wall === "north" || opening.wall === "south") {
        const hingeX = opening.wall === "north" ? x : x + width;
        const hingeY = y;
        const endX = opening.wall === "north" ? hingeX + swing : hingeX - swing;
        const endY = opening.wall === "north" ? hingeY + swing : hingeY - swing;
        ctx.moveTo(hingeX, hingeY); ctx.lineTo(endX, endY);
        ctx.arc(hingeX, hingeY, swing, opening.wall === "north" ? 0 : Math.PI, opening.wall === "north" ? Math.PI / 2 : Math.PI * 1.5, opening.wall === "south");
      } else {
        const hingeX = x; const hingeY = opening.wall === "west" ? y : y + width;
        const endX = opening.wall === "west" ? hingeX + swing : hingeX - swing;
        const endY = opening.wall === "west" ? hingeY - swing : hingeY + swing;
        ctx.moveTo(hingeX, hingeY); ctx.lineTo(endX, endY);
        ctx.arc(hingeX, hingeY, swing, opening.wall === "west" ? -Math.PI / 2 : Math.PI / 2, opening.wall === "west" ? 0 : Math.PI, opening.wall === "east");
      }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  });
  const drawCustomWall = (wall: PlanWall, preview = false) => { const x1 = ox + wall.x1_ft * scale, y1 = oy + wall.y1_ft * scale, x2 = ox + wall.x2_ft * scale, y2 = oy + wall.y2_ft * scale; ctx.save(); ctx.strokeStyle = preview ? "#2563eb" : "#263238"; ctx.lineWidth = preview ? 4 : 5; ctx.lineCap = "square"; ctx.setLineDash(preview ? [7, 5] : []); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); };
  customWalls.forEach(wall => drawCustomWall(wall)); if (wallDraft) drawCustomWall(wallDraft, true);
  if (companyName) { ctx.fillStyle = "rgba(15,23,42,.45)"; ctx.font = "11px sans-serif"; ctx.textAlign = "right"; ctx.fillText(companyName, w - 14, h - 12); }
}

export function FloorPlanCanvas({ rooms, openings, furniture = [], customWalls = [], roomTiles = {}, showFurnitureLabels = true, selectedIds, zoom, panX = 0, panY = 0, windowOpacity = .24, northAngle, showDirection = false, show32Zones = false, wheelScale = 1, centerWheelOnRoom = false, wheelOpacity = 0.65, wheelOffsetXFt = 0, wheelOffsetYFt = 0, wheelLayers, labelMode = "names", multiSelect = false, layoutFixed = false, wallEditMode = "off", companyName, canvasRef, onSelect, onMove, onResize, onZoom, onNorthAngle, onWheelOffsetChange, onDoubleClickRoom, onRotateRoom, onMoveOpening, onDoubleClickOpening, onWallSegmentToggle, onAddWall, onMoveFurniture, onResizeFurniture, onDoubleClickFurniture }: Props) {
  const internalRef = useRef<HTMLCanvasElement>(null); const dragRef = useRef<{ id: string; mode: "move" | "rotate" | "north" | "wheel" | "opening" | "furniture" | "furniture-resize" | "wall-pen"; x: number; y: number; oxFt?: number; oyFt?: number; startAngle?: number; startRotation?: number; room?: PlanRoom; opening?: PlanOpening; furniture?: PlanFurniture; wallStart?: { x: number; y: number } } | null>(null); const lastRoomTapRef = useRef<{ id: string; x: number; y: number; at: number } | null>(null); const [wallDraft, setWallDraft] = useState<PlanWall | null>(null); const [size, setSize] = useState(0);
  const setRef = useCallback((node: HTMLCanvasElement | null) => { internalRef.current = node; canvasRef?.(node); }, [canvasRef]);
  useEffect(() => {
    const canvas = internalRef.current; if (!canvas) return;
    const redraw = () => { drawPlanOnCanvas(canvas, rooms, openings, selectedIds, zoom, companyName, northAngle, showDirection, show32Zones, wheelScale, centerWheelOnRoom, wheelOpacity, wheelOffsetXFt, wheelOffsetYFt, labelMode, wheelLayers, furniture, panX, panY, windowOpacity, roomTiles, showFurnitureLabels, customWalls, wallDraft); setSize(canvas.clientWidth); };
    redraw(); const observer = new ResizeObserver(redraw); if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [rooms, openings, furniture, customWalls, wallDraft, roomTiles, showFurnitureLabels, selectedIds, zoom, northAngle, showDirection, show32Zones, wheelScale, centerWheelOnRoom, wheelOpacity, wheelOffsetXFt, wheelOffsetYFt, labelMode, wheelLayers, companyName, panX, panY, windowOpacity]);
  const localPoint = (e: PointerEvent<HTMLCanvasElement>) => { const rect = e.currentTarget.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = internalRef.current; if (!canvas) return; const p = localPoint(e); const { scale, ox, oy } = geometry(canvas, rooms, zoom, panX, panY);
    if (wallEditMode === "pen") { const start = { x: (p.x - ox) / scale, y: (p.y - oy) / scale }; dragRef.current = { id: "__wall__", mode: "wall-pen", x: p.x, y: p.y, wallStart: start }; setWallDraft({ id: "preview", x1_ft: start.x, y1_ft: start.y, x2_ft: start.x, y2_ft: start.y }); e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); return; }
    const roomUnderPointer = [...rooms].reverse().find((r) => { const b = roomRect(r, scale, ox, oy); return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; });
    lastRoomTapRef.current = roomUnderPointer ? { id: roomUnderPointer.id, x: p.x, y: p.y, at: Date.now() } : null;
    if (showDirection && onNorthAngle) {
      const bounds = extents(rooms); const selected = centerWheelOnRoom ? rooms.find(r => r.id === selectedIds[0]) : null; const sr = selected ? roomRect(selected, scale, ox, oy) : null;
      const cx = (sr ? sr.x + sr.w / 2 : ox + bounds.x * scale / 2) + wheelOffsetXFt * scale; const cy = (sr ? sr.y + sr.h / 2 : oy + bounds.y * scale / 2) + wheelOffsetYFt * scale;
      const radius = Math.max(70, Math.min((canvas.clientWidth - MARGIN * 2) / 2, (canvas.clientHeight - MARGIN * 2) / 2, bounds.x * scale / 2 + 38, bounds.y * scale / 2 + 38) * wheelScale);
      const handleAngle = (northAngle - 90) * Math.PI / 180; const hx = cx + Math.cos(handleAngle) * radius * .67; const hy = cy + Math.sin(handleAngle) * radius * .67;
      if (Math.hypot(p.x - hx, p.y - hy) < Math.max(18, radius * .065)) { dragRef.current = { id: "__north__", mode: "north", x: cx, y: cy }; e.currentTarget.setPointerCapture(e.pointerId); return; }
      const wheelDistance = Math.hypot(p.x - cx, p.y - cy);
      if (onWheelOffsetChange && wheelDistance >= radius * .78 && wheelDistance <= radius * 1.08) { dragRef.current = { id: "__wheel__", mode: "wheel", x: p.x, y: p.y, oxFt: wheelOffsetXFt, oyFt: wheelOffsetYFt }; e.currentTarget.setPointerCapture(e.pointerId); return; }
    }
    const room = roomUnderPointer;
    const furnitureHit = [...furniture].reverse().find(item => {
      const centerX = MARGIN + panX + (item.x_ft + item.length_ft / 2) * scale; const centerY = MARGIN + panY + (item.y_ft + item.width_ft / 2) * scale;
      const angle = -item.rotation * Math.PI / 180; const dx = p.x - centerX; const dy = p.y - centerY;
      const localX = dx * Math.cos(angle) - dy * Math.sin(angle); const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
      return Math.abs(localX) <= item.length_ft * scale / 2 && Math.abs(localY) <= item.width_ft * scale / 2;
    });
    if (furnitureHit && onMoveFurniture) { onSelect(`furniture:${furnitureHit.id}`, e.ctrlKey || e.metaKey || multiSelect); if (layoutFixed) { e.preventDefault(); return; } const centerX=MARGIN+panX+(furnitureHit.x_ft+furnitureHit.length_ft/2)*scale; const centerY=MARGIN+panY+(furnitureHit.y_ft+furnitureHit.width_ft/2)*scale; const dx=p.x-centerX; const dy=p.y-centerY; const angle=-furnitureHit.rotation*Math.PI/180; const localX=dx*Math.cos(angle)-dy*Math.sin(angle); const localY=dx*Math.sin(angle)+dy*Math.cos(angle); const selected=selectedIds.includes(`furniture:${furnitureHit.id}`); const resize=selected&&onResizeFurniture&&Math.hypot(localX-furnitureHit.length_ft*scale/2,localY-furnitureHit.width_ft*scale/2)<14; dragRef.current = { id:furnitureHit.id, mode:resize?"furniture-resize":"furniture", x:p.x, y:p.y, furniture:furnitureHit }; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); return; }
    if (!room) return;
    if (layoutFixed && wallEditMode !== "off" && onWallSegmentToggle) {
      const b = roomRect(room, scale, ox, oy);
      const edges: { side: "north" | "east" | "south" | "west"; distance: number; along: number; dimension: number }[] = [
        { side: "north", distance: Math.abs(p.y - b.y), along: p.x - b.x, dimension: b.l },
        { side: "south", distance: Math.abs(p.y - (b.y + b.h)), along: p.x - b.x, dimension: b.l },
        { side: "west", distance: Math.abs(p.x - b.x), along: p.y - b.y, dimension: b.d },
        { side: "east", distance: Math.abs(p.x - (b.x + b.w)), along: p.y - b.y, dimension: b.d },
      ];
      const edge = edges.sort((a, b) => a.distance - b.distance)[0];
      if (edge.distance <= 18) {
        onSelect(room.id, e.ctrlKey || e.metaKey || multiSelect);
        onWallSegmentToggle(room.id, edge.side, Math.max(0, Math.min(Math.ceil(edge.dimension) - 1, Math.floor(edge.along / scale))), wallEditMode === "restore");
        e.preventDefault(); return;
      }
    }
    const openingHit = [...openings].reverse().map(opening => ({ opening, room: rooms.find(r => r.id === opening.roomId) })).find(item => {
      if (!item.room) return false; const b = roomRect(item.room, scale, ox, oy); const o = item.opening; const horizontal = o.wall === "north" || o.wall === "south";
      const x = horizontal ? b.x + o.offset_ft * scale : o.wall === "west" ? b.x : b.x + b.w; const y = horizontal ? o.wall === "north" ? b.y : b.y + b.h : b.y + o.offset_ft * scale;
      const length = Math.min(o.width_ft * scale, horizontal ? b.w : b.h);
      const hitRadius = o.type === "window" ? 30 : 18;
      return horizontal ? Math.abs(p.y-y) < hitRadius && p.x >= x-20 && p.x <= x+length+20 : Math.abs(p.x-x) < hitRadius && p.y >= y-20 && p.y <= y+length+20;
    });
    if (openingHit && onMoveOpening && !layoutFixed) { dragRef.current = { id: openingHit.opening.id, mode: "opening", x:p.x, y:p.y, opening:openingHit.opening, room:openingHit.room }; e.currentTarget.style.cursor = "grabbing"; e.currentTarget.setPointerCapture(e.pointerId); return; }
    if (layoutFixed) { onSelect(room.id, e.ctrlKey || e.metaKey || multiSelect); e.preventDefault(); return; }
    const b = roomRect(room, scale, ox, oy);
    const rotateX = b.x + b.w - 9, rotateY = b.y + 9;
    const rotate = selectedIds.includes(room.id) && Math.hypot(p.x - rotateX, p.y - rotateY) <= 17;
    onSelect(room.id, e.ctrlKey || e.metaKey || multiSelect);
    dragRef.current = { id: room.id, mode: rotate ? "rotate" : "move", x: p.x, y: p.y, room, startAngle: Math.atan2(p.y - (b.y + b.h / 2), p.x - (b.x + b.w / 2)) * 180 / Math.PI, startRotation: room.rotation }; e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current; const canvas = internalRef.current; if (!canvas) return;
    if (!drag) { const p = localPoint(e); const { scale, ox, oy } = geometry(canvas, rooms, zoom, panX, panY); const overWindow = openings.some(opening => { if (opening.type !== "window") return false; const room = rooms.find(candidate => candidate.id === opening.roomId); if (!room) return false; const b = roomRect(room, scale, ox, oy); const horizontal = opening.wall === "north" || opening.wall === "south"; const x = horizontal ? b.x + opening.offset_ft * scale : opening.wall === "west" ? b.x : b.x + b.w; const y = horizontal ? opening.wall === "north" ? b.y : b.y + b.h : b.y + opening.offset_ft * scale; const length = Math.min(opening.width_ft * scale, horizontal ? b.w : b.h); return horizontal ? Math.abs(p.y - y) < 30 && p.x >= x - 20 && p.x <= x + length + 20 : Math.abs(p.x - x) < 30 && p.y >= y - 20 && p.y <= y + length + 20; }); canvas.style.cursor = overWindow ? "grab" : "crosshair"; return; }
    if (drag.mode === "north" && onNorthAngle) { const p = localPoint(e); onNorthAngle(((Math.atan2(p.x - drag.x, -(p.y - drag.y)) * 180 / Math.PI) + 360) % 360); return; }
    if (drag.mode === "wall-pen" && drag.wallStart) { const p = localPoint(e); const { scale, ox, oy } = geometry(canvas, rooms, zoom, panX, panY); const end = { x: (p.x - ox) / scale, y: (p.y - oy) / scale }; setWallDraft({ id: "preview", x1_ft: drag.wallStart.x, y1_ft: drag.wallStart.y, x2_ft: end.x, y2_ft: end.y }); return; }
    if (drag.mode === "wheel" && onWheelOffsetChange) { const p = localPoint(e); if (Math.hypot(p.x - drag.x, p.y - drag.y) > 5) lastRoomTapRef.current = null; const { scale } = geometry(canvas, rooms, zoom, panX, panY); onWheelOffsetChange((drag.oxFt || 0) + (p.x - drag.x) / scale, (drag.oyFt || 0) + (p.y - drag.y) / scale); return; }
    if (drag.mode === "furniture" && drag.furniture && onMoveFurniture) { const p = localPoint(e); if (Math.hypot(p.x - drag.x, p.y - drag.y) > 5) lastRoomTapRef.current = null; const { scale, ox, oy } = geometry(canvas, rooms, zoom, panX, panY); const item=drag.furniture; const rawX=item.x_ft+(p.x-drag.x)/scale; const rawY=item.y_ft+(p.y-drag.y)/scale; const centerX=ox+(rawX+item.length_ft/2)*scale; const centerY=oy+(rawY+item.width_ft/2)*scale; const containingRoom=[...rooms].reverse().find(candidate=>{const b=roomRect(candidate,scale,ox,oy);return centerX>=b.x&&centerX<=b.x+b.w&&centerY>=b.y&&centerY<=b.y+b.h;}); const destination=containingRoom || rooms.reduce<PlanRoom|null>((nearest,candidate)=>{if(!nearest)return candidate;const a=roomRect(candidate,scale,ox,oy),b=roomRect(nearest,scale,ox,oy);return Math.hypot(centerX-(a.x+a.w/2),centerY-(a.y+a.h/2))<Math.hypot(centerX-(b.x+b.w/2),centerY-(b.y+b.h/2))?candidate:nearest;},null); if(!destination)return; onMoveFurniture(drag.id,Math.round(rawX*4)/4,Math.round(rawY*4)/4,destination.id); return; }
    if (drag.mode === "furniture-resize" && drag.furniture && onResizeFurniture) { const scale=geometry(canvas,rooms,zoom,panX,panY).scale; const item=drag.furniture; const angle=-item.rotation*Math.PI/180; const dx=e.clientX-(canvas.getBoundingClientRect().left+MARGIN+panX+(item.x_ft+item.length_ft/2)*scale); const dy=e.clientY-(canvas.getBoundingClientRect().top+MARGIN+panY+(item.y_ft+item.width_ft/2)*scale); const localX=dx*Math.cos(angle)-dy*Math.sin(angle); const localY=dx*Math.sin(angle)+dy*Math.cos(angle); const length=Math.max(.25,Math.min(60,localX*2/scale)); const width=Math.max(.25,Math.min(60,localY*2/scale)); onResizeFurniture(drag.id,Math.round(length*4)/4,Math.round(width*4)/4); return; }
    if (drag.mode === "opening" && drag.opening && drag.room && onMoveOpening) { const p = localPoint(e); if (Math.hypot(p.x - drag.x, p.y - drag.y) > 5) lastRoomTapRef.current = null; const scale = geometry(canvas, rooms, zoom, panX, panY).scale; const b = roomRect(drag.room, scale, MARGIN + panX, MARGIN + panY); const edgeDistances: [PlanOpening["wall"], number][] = [["north", Math.abs(p.y - b.y)], ["east", Math.abs(p.x - (b.x + b.w))], ["south", Math.abs(p.y - (b.y + b.h))], ["west", Math.abs(p.x - b.x)]]; const wall = edgeDistances.sort((a, b) => a[1] - b[1])[0][0]; const offset = wall === "north" || wall === "south" ? (p.x - b.x) / scale : (p.y - b.y) / scale; onMoveOpening(drag.id, wall, Math.max(0, offset)); return; }
    if (drag.mode === "rotate" && drag.room && onRotateRoom) { const p = localPoint(e); if (Math.hypot(p.x - drag.x, p.y - drag.y) > 5) lastRoomTapRef.current = null; const b = roomRect(drag.room, geometry(canvas, rooms, zoom, panX, panY).scale, MARGIN + panX, MARGIN + panY); const angle = Math.atan2(p.y - (b.y + b.h / 2), p.x - (b.x + b.w / 2)) * 180 / Math.PI; const delta = ((angle - (drag.startAngle || 0) + 540) % 360) - 180; onRotateRoom(drag.id, (Math.round(((drag.startRotation || 0) + delta) / 90) * 90 + 360) % 360); return; }
    if (!drag.room || drag.mode !== "move") return;
    const { scale } = geometry(canvas, rooms, zoom, panX, panY); const p = localPoint(e);
    if (Math.hypot(p.x - drag.x, p.y - drag.y) > 5) lastRoomTapRef.current = null;
    onMove(drag.id, Math.max(0, Math.round(drag.room.x_ft + (p.x - drag.x) / scale)), Math.max(0, Math.round(drag.room.y_ft + (p.y - drag.y) / scale)));
  };
  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => { const drag = dragRef.current; if (drag?.mode === "wall-pen" && drag.wallStart && wallDraft && Math.hypot(wallDraft.x2_ft-wallDraft.x1_ft, wallDraft.y2_ft-wallDraft.y1_ft) > .15) onAddWall?.({ ...wallDraft, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}` }); setWallDraft(null); dragRef.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); };
  const onDoubleClick = (e: ReactMouseEvent<HTMLCanvasElement>) => { const canvas = internalRef.current; if (!canvas) return; const rect = e.currentTarget.getBoundingClientRect(); const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }; const { scale, ox, oy } = geometry(canvas, rooms, zoom, panX, panY); const furnitureHit=[...furniture].reverse().find(item=>{const centerX=ox+(item.x_ft+item.length_ft/2)*scale,centerY=oy+(item.y_ft+item.width_ft/2)*scale,angle=-item.rotation*Math.PI/180,dx=point.x-centerX,dy=point.y-centerY,lx=dx*Math.cos(angle)-dy*Math.sin(angle),ly=dx*Math.sin(angle)+dy*Math.cos(angle);return Math.abs(lx)<=item.length_ft*scale/2&&Math.abs(ly)<=item.width_ft*scale/2;}); if(furnitureHit){onDoubleClickFurniture?.(furnitureHit.id);return;} const openingHit = [...openings].reverse().find(o => { const room=rooms.find(r=>r.id===o.roomId); if(!room)return false; const b=roomRect(room,scale,ox,oy); const horizontal=o.wall==="north"||o.wall==="south"; const x=horizontal?b.x+o.offset_ft*scale:o.wall==="west"?b.x:b.x+b.w; const y=horizontal?(o.wall==="north"?b.y:b.y+b.h):b.y+o.offset_ft*scale; const length=Math.min(o.width_ft*scale,horizontal?b.w:b.h); return horizontal?Math.abs(point.y-y)<17&&point.x>=x-8&&point.x<=x+length+8:Math.abs(point.x-x)<17&&point.y>=y-8&&point.y<=y+length+8; }); if(openingHit){onDoubleClickOpening?.(openingHit.id);return;} const room = [...rooms].reverse().find(r => { const bounds = roomRect(r, scale, ox, oy); return point.x >= bounds.x && point.x <= bounds.x + bounds.w && point.y >= bounds.y && point.y <= bounds.y + bounds.h; }); if (room) onDoubleClickRoom?.(room.id); };
  const onWheel = (e: WheelEvent<HTMLCanvasElement>) => { e.preventDefault(); };
  return <canvas ref={setRef} className="block h-full min-h-0 w-full touch-none cursor-crosshair" style={{ minWidth: size > 0 ? "100%" : undefined }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onDoubleClick={onDoubleClick} onWheel={onWheel} aria-label="Interactive 2D floor plan. Drag rooms to move them; double-click a room to edit its size."/>;
}
