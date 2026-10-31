/** Shared compass convention: 0° is North and bearings increase clockwise. */
export const DIRECTION_GROUP_STARTS = { N: 315, E: 45, S: 135, W: 225 } as const;
export const COMPASS_POINTS = [
  ["N", "North", 0], ["NNE", "North-North-East", 22.5], ["NE", "North-East", 45], ["ENE", "East-North-East", 67.5],
  ["E", "East", 90], ["ESE", "East-South-East", 112.5], ["SE", "South-East", 135], ["SSE", "South-South-East", 157.5],
  ["S", "South", 180], ["SSW", "South-South-West", 202.5], ["SW", "South-West", 225], ["WSW", "West-South-West", 247.5],
  ["W", "West", 270], ["WNW", "West-North-West", 292.5], ["NW", "North-West", 315], ["NNW", "North-North-West", 337.5],
] as const;
export type DirectionCode = typeof COMPASS_POINTS[number][0];
export const ENTRANCE_ZONES = (["N", "E", "S", "W"] as const).flatMap(group => Array.from({ length: 8 }, (_, i) => ({
  label: `${group}${i + 1}`, start: normalize(DIRECTION_GROUP_STARTS[group] + i * 11.25), end: normalize(DIRECTION_GROUP_STARTS[group] + (i + 1) * 11.25),
})));
export function normalize(deg: number) { const wrapped = ((Number(deg) % 360) + 360) % 360; return Math.min(359.9, wrapped); }
export function directionToDegrees(code: string) { return COMPASS_POINTS.find(point => point[0] === code)?.[2] ?? 0; }
export function degreesToDirection(deg: number) {
  const value = normalize(deg); return COMPASS_POINTS.reduce((best, point) => {
    const delta = Math.abs(((value - point[2] + 540) % 360) - 180); return delta < best.delta ? { code: point[0], name: point[1], degrees: point[2], exactDegrees: value, delta } : best;
  }, { code: "N" as DirectionCode, name: "North", degrees: 0, exactDegrees: value, delta: 360 });
}
export function degreesToZone(deg: number) {
  const value = normalize(deg); return ENTRANCE_ZONES.find(zone => {
    // The table is grouped for readability, so compare circular half-open intervals.
    return zone.start <= zone.end ? value >= zone.start && value < zone.end : value >= zone.start || value < zone.end;
  })?.label ?? "N1";
}
export function wallBearing(planAngle: number, northOffset: number) { return normalize(planAngle + northOffset); }
export function formatDirection(deg: number) { const d = degreesToDirection(deg); return `${d.name} (${d.code}) - ${Number(normalize(deg).toFixed(1))} degrees`; }
