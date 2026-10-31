import { COMPASS_POINTS, degreesToDirection, formatDirection, normalize } from "./directions";

type Props = { value: number; onChange: (degrees: number) => void; label?: string; compact?: boolean };
export function DirectionPicker({ value, onChange, label, compact = false }: Props) {
  const point = degreesToDirection(value);
  return <div className="space-y-2">
    {label && <p className="text-xs font-medium">{label}</p>}
    <div className="relative mx-auto aspect-square w-full max-w-[230px] rounded-full border bg-muted/20" role="group" aria-label={label || "Compass direction"}>
      {COMPASS_POINTS.map(([code, , deg]) => {
        const rad = (deg - 90) * Math.PI / 180; const x = 50 + Math.cos(rad) * 41; const y = 50 + Math.sin(rad) * 41;
        return <button key={code} type="button" title={`${code} · ${deg}°`} aria-label={`${code}, ${deg} degrees`} onClick={() => onChange(deg)} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-1.5 py-1 text-[10px] font-semibold ${point.code === code ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`} style={{ left: `${x}%`, top: `${y}%` }}>{code}</button>;
      })}
      <div className="absolute inset-[29%] flex items-center justify-center rounded-full border bg-background text-center text-xs font-medium">{point.code}<br/>{normalize(value).toFixed(1)}°</div>
    </div>
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      <input aria-label={`${label || "Direction"} slider`} type="range" min="0" max="359.9" step="0.1" value={normalize(value)} onChange={e => onChange(normalize(Number(e.target.value)))} className="w-full"/>
      <input aria-label={`${label || "Direction"} degrees`} type="number" min="0" max="359.9" step="0.1" value={Number(normalize(value).toFixed(1))} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0 && n <= 359.9) onChange(n); }} className={`h-9 rounded-md border bg-background px-2 text-sm ${compact ? "w-20" : "w-24"}`}/>
    </div>
    <p className="text-center text-xs text-muted-foreground">{formatDirection(value)}{point.degrees !== normalize(value) && <span className="block">Nearest point: {point.code} ({point.degrees}°)</span>}</p>
  </div>;
}
