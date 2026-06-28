// src/components/CountdownGate.tsx
import { useEffect, useMemo, useState } from "react";

interface CountdownGateProps {
  /** Hour (24h format) to unlock at. Default 12 (i.e. 12 PM). */
  targetHour?: number;
  /** Minute to unlock at. Default 39. */
  targetMinute?: number;
  /** Second to unlock at. Default 0. */
  targetSecond?: number;
  /** Rendered once the countdown finishes (your actual app/routes). */
  children: React.ReactNode;
  /** Optional label shown above the countdown. */
  label?: string;
}

function getTargetTime(hour: number, minute: number, second: number): Date {
  const target = new Date();
  target.setHours(hour, minute, second, 0);
  return target;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

const CountdownGate = ({
  targetHour = 12,
  targetMinute = 39,
  targetSecond = 0,
  children,
  label = "Unlocking in",
}: CountdownGateProps) => {
  const target = useMemo(
    () => getTargetTime(targetHour, targetMinute, targetSecond),
    [targetHour, targetMinute, targetSecond],
  );

  const [remaining, setRemaining] = useState(
    () => target.getTime() - Date.now(),
  );
  const [unlocked, setUnlocked] = useState(
    () => target.getTime() - Date.now() <= 0,
  );

  useEffect(() => {
    if (unlocked) return;

    const interval = setInterval(() => {
      const diff = target.getTime() - Date.now();
      setRemaining(diff);

      if (diff <= 0) {
        clearInterval(interval);
        setUnlocked(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target, unlocked]);

  if (unlocked) {
    // Time's up — hand off to the real app. App.tsx's own routing
    // (ProtectedRoute / "/" / "/login") takes over from here, so
    // whoever is logged in lands on Dashboard, otherwise on /login.
    return <>{children}</>;
  }

  const { h, m, s } = formatDuration(remaining);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fff5f4] px-4">
      <div className="flex flex-col items-center gap-8">
        {/* Logo mark - inspired by the uploaded "H" logo */}
        <img
          src="https://homyns.com//images/favicons/HOMYNS-LOGO-19.png"
          alt="Logo"
          style={{ width: "60px", height: "60px" }}
        />

        <p className="text-sm font-medium tracking-wide text-[#ef4444]/70 uppercase">
          {label}
        </p>

        <div className="flex items-center gap-3 sm:gap-5">
          {[
            { value: h, unit: "HRS" },
            { value: m, unit: "MIN" },
            { value: s, unit: "SEC" },
          ].map((block, idx) => (
            <div key={block.unit} className="flex items-center gap-3 sm:gap-5">
              <div className="flex flex-col items-center">
                <div className="bg-[#ef4444] text-white rounded-2xl px-5 py-4 sm:px-7 sm:py-6 shadow-lg shadow-[#ef4444]/20 min-w-[72px] sm:min-w-[96px] text-center">
                  <span className="text-3xl sm:text-5xl font-bold tabular-nums">
                    {block.value}
                  </span>
                </div>
                <span className="mt-2 text-xs font-semibold tracking-widest text-[#ef4444]/60">
                  {block.unit}
                </span>
              </div>
              {idx < 2 && (
                <span className="text-3xl sm:text-5xl font-bold text-[#ef4444]/30 -mt-6">
                  :
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-[#ef4444]/60 text-center max-w-xs">
          Unlocking automatically at {String(targetHour).padStart(2, "0")}:
          {String(targetMinute).padStart(2, "0")} today.
        </p>
      </div>
    </div>
  );
};

export default CountdownGate;
