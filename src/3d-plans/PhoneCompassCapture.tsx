import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Compass, Loader2 } from "lucide-react";
import { degreesToDirection, formatDirection, normalize } from "./directions";
import { PLAN_COPY, PlanLanguage } from "./language";

type Props = { language: PlanLanguage; onCapture: (bearing: number) => void };
type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

/** Uses the phone's true-heading sensor when the browser exposes it. Manual direction entry remains available beside this control. */
export function PhoneCompassCapture({ language, onCapture }: Props) {
  const [open, setOpen] = useState(false); const [active, setActive] = useState(false); const [bearing, setBearing] = useState<number | null>(null); const [error, setError] = useState(""); const eventRef = useRef<EventListener | null>(null);
  const copy = PLAN_COPY[language]; const nearest = bearing === null ? null : degreesToDirection(bearing);

  const stop = () => {
    if (eventRef.current) { window.removeEventListener("deviceorientationabsolute", eventRef.current); window.removeEventListener("deviceorientation", eventRef.current); }
    eventRef.current = null; setActive(false);
  };
  useEffect(() => () => { if (eventRef.current) { window.removeEventListener("deviceorientationabsolute", eventRef.current); window.removeEventListener("deviceorientation", eventRef.current); } }, []);

  const start = async () => {
    setError(""); setBearing(null);
    if (!window.isSecureContext) { setError(copy.compassUnsupported); return; }
    const orientationApi = DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
    if (typeof orientationApi.requestPermission === "function") {
      try { if (await orientationApi.requestPermission() !== "granted") { setError(copy.permissionDenied); return; } }
      catch { setError(copy.permissionDenied); return; }
    }
    let seen = false;
    const listener: EventListener = raw => {
      const event = raw as CompassEvent; let heading: number | null = null;
      if (Number.isFinite(event.webkitCompassHeading)) heading = event.webkitCompassHeading!;
      else if (event.absolute && event.alpha !== null && Number.isFinite(event.alpha)) heading = 360 - event.alpha;
      if (heading !== null) { seen = true; setBearing(normalize(heading)); }
    };
    eventRef.current = listener; window.addEventListener("deviceorientationabsolute", listener); window.addEventListener("deviceorientation", listener); setActive(true);
    window.setTimeout(() => { if (!seen) setError(copy.compassUnsupported); }, 1800);
  };
  const close = (value: boolean) => { if (!value) stop(); setOpen(value); };
  return <>
    <Button type="button" variant="outline" className="w-full" onClick={() => { setOpen(true); void start(); }}><Compass className="mr-2 h-4 w-4"/>{copy.startCompass}</Button>
    <Dialog open={open} onOpenChange={close}><DialogContent><DialogHeader><DialogTitle>{copy.compassTitle}</DialogTitle><DialogDescription>{copy.compassHelp}</DialogDescription></DialogHeader>
      <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-center"><p className="text-xs text-muted-foreground">{copy.manual}</p>{active && bearing === null && <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Waiting for phone heading…</div>}{bearing !== null && <><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border bg-background text-2xl font-semibold">{nearest?.code}</div><p className="font-medium">{formatDirection(bearing)}</p>{nearest?.degrees !== bearing && <p className="text-xs text-muted-foreground">Nearest compass point: {nearest?.code} ({nearest?.degrees}°)</p>}</>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => close(false)}>{copy.cancel}</Button><Button type="button" disabled={bearing === null} onClick={() => { if (bearing !== null) onCapture(bearing); close(false); }}>{copy.capture}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
