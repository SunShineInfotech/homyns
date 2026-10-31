import { COMPASS_POINTS, ENTRANCE_ZONES, normalize } from "./directions";

/** Paints the reusable, north-up direction wheel. Coordinates use screen space (y down). */
export interface DirectionWheelLayers { showFront?: boolean; showBack?: boolean; showCenter?: boolean; showLines?: boolean; bandWidth?: number }
export function drawDirectionWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, northOffset: number, showZones: boolean, opacity = 0.65, layers: DirectionWheelLayers = {}) {
  const { showFront = true, showBack = false, showCenter = true, showLines = true } = layers;
  const r = Math.max(30, radius); const innerRing = r * (1 - Math.min(.38, Math.max(.08, layers.bandWidth ?? .23))); const angle = (deg: number) => (deg - 90) * Math.PI / 180;
  ctx.save(); ctx.globalAlpha = Math.max(0.1, Math.min(1, opacity));
  const arc = (start: number, end: number, color: string) => { ctx.beginPath(); ctx.arc(cx, cy, r, angle(start + northOffset), angle(end + northOffset)); ctx.arc(cx, cy, innerRing, angle(end + northOffset), angle(start + northOffset), true); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); };
  // Main cardinal quadrants and the four yellow diagonal sectors.
  [[315, 360, "#facc15"], [0, 45, "#2563eb"], [45, 90, "#facc15"], [90, 135, "#16a34a"], [135, 180, "#facc15"], [180, 225, "#dc2626"], [225, 270, "#facc15"], [270, 315, "#e5e7eb"]].forEach(([a, b, c]) => arc(a as number, b as number, c as string));
  ctx.globalAlpha = Math.max(0.1, Math.min(1, opacity)); ctx.strokeStyle = "#334155"; ctx.lineWidth = 1;
  if (showLines) for (let deg = 0; deg < 360; deg++) {
    const a = angle(deg + northOffset); const inner = deg % 10 === 0 ? r * .68 : deg % 5 === 0 ? r * .72 : r * .75;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
    if (deg % 10 === 0) { ctx.save(); ctx.translate(cx + Math.cos(a) * (r + 13), cy + Math.sin(a) * (r + 13)); ctx.fillStyle = "#0f172a"; ctx.font = `${Math.max(9, r * .055)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(deg), 0, 0); ctx.restore(); }
  }
  ctx.strokeStyle = "rgba(15,23,42,.45)"; ctx.lineWidth = 1;
  [innerRing, r * .52, r * .34].forEach(rad => { ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke(); });
  const labels: Record<string, string> = { N: "NORTH", E: "EAST", S: "SOUTH", W: "WEST" };
  if (showFront) [[0, "#1d4ed8"], [90, "#15803d"], [180, "#b91c1c"], [270, "#334155"]].forEach(([bearing, color]) => {
    const a = angle((bearing as number) + northOffset); let textAngle = a + Math.PI / 2; if (Math.cos(textAngle) < 0) textAngle += Math.PI; ctx.save(); ctx.translate(cx + Math.cos(a) * r * .88, cy + Math.sin(a) * r * .88); ctx.rotate(textAngle); ctx.fillStyle = color as string; ctx.font = `bold ${Math.max(10, r * .075)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.strokeText(labels[String(bearing)] || "", 0, 0); ctx.fillText(labels[String(bearing)] || "", 0, 0); ctx.restore();
  });
  if (showFront) COMPASS_POINTS.forEach(([code, , degrees]) => { const a = angle(degrees + northOffset); ctx.save(); ctx.translate(cx + Math.cos(a) * (innerRing + (r - innerRing) * .52), cy + Math.sin(a) * (innerRing + (r - innerRing) * .52)); ctx.fillStyle = "#111827"; ctx.font = `bold ${Math.max(9, r * .052)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(code, 0, 0); ctx.restore(); });
  if (showBack) COMPASS_POINTS.forEach(([code, , degrees]) => { const a = angle(degrees + northOffset + 180); ctx.save(); ctx.translate(cx + Math.cos(a) * r * .28, cy + Math.sin(a) * r * .28); ctx.fillStyle = "#475569"; ctx.font = `bold ${Math.max(8, r * .042)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(code, 0, 0); ctx.restore(); });
  if (showZones) {
    ctx.strokeStyle = "rgba(15,23,42,.55)"; ctx.lineWidth = .75; ctx.fillStyle = "#111827"; ctx.font = `bold ${Math.max(7, r * .033)}px sans-serif`;
    ENTRANCE_ZONES.forEach(zone => { const start = normalize(zone.start + northOffset); const a = angle(start); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * .36, cy + Math.sin(a) * r * .36); ctx.lineTo(cx + Math.cos(a) * r * .51, cy + Math.sin(a) * r * .51); ctx.stroke(); const mid = normalize(zone.start + 5.625 + northOffset); const m = angle(mid); ctx.save(); ctx.translate(cx + Math.cos(m) * r * .44, cy + Math.sin(m) * r * .44); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(zone.label, 0, 0); ctx.restore(); });
  }
  // Center point and draggable north handle.
  ctx.globalAlpha = 1;
  if (showCenter) { const box = Math.max(6, r * .075); ctx.fillStyle = "rgba(255,255,255,.94)"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1.5; ctx.fillRect(cx - box, cy - box, box * 2, box * 2); ctx.strokeRect(cx - box, cy - box, box * 2, box * 2); ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, r * .018), 0, Math.PI * 2); ctx.fillStyle = "#0f172a"; ctx.fill(); }
  const na = angle(northOffset); const hx = cx + Math.cos(na) * r * .67; const hy = cy + Math.sin(na) * r * .67;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(hx, hy, Math.max(7, r * .045), 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
  ctx.restore();
}
