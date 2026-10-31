// src/components/ui/responsive-sheet.tsx
// One component, two behaviours:
//  - Desktop (>= 1024px): centered modal with fade + zoom
//  - Mobile / Tablet (< 1024px): native-app style bottom sheet
//      • slides up from the bottom with iOS-like easing
//      • drag handle + swipe-down to dismiss
//      • sticky header and sticky footer, only the body scrolls
//      • safe-area padding for notched phones
//      • no auto-focus on open (keyboard does not pop up)
import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function useIsDesktop(query = "(min-width: 1024px)") {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : true,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Optional icon shown in a tinted square before the title */
  icon?: ReactNode;
  children: ReactNode;
  /** Sticky footer (buttons). Rendered inside a safe-area aware bar. */
  footer?: ReactNode;
  /** When true the sheet cannot be dismissed (e.g. while saving) */
  preventClose?: boolean;
  /** Tailwind max-width class for the desktop modal, e.g. "max-w-xl" */
  desktopMaxWidth?: string;
  /** Extra classes for the scrollable body */
  bodyClassName?: string;
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  preventClose = false,
  desktopMaxWidth = "max-w-xl",
  bodyClassName,
}: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop();

  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closingByDrag, setClosingByDrag] = useState(false);
  const dragStart = useRef<{ y: number; t: number } | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setDragY(0);
      setDragging(false);
      setClosingByDrag(false);
    }
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next && preventClose) return;
    onOpenChange(next);
  };

  // ─── Drag-to-dismiss (mobile / tablet) ─────────────────────────────
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDesktop || preventClose) return;
    dragStart.current = { y: e.clientY, t: Date.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    setDragY(Math.max(0, e.clientY - dragStart.current.y));
  };

  const handlePointerUp = () => {
    if (!dragStart.current) return;
    const elapsed = Math.max(1, Date.now() - dragStart.current.t);
    const velocity = dragY / elapsed;
    dragStart.current = null;
    setDragging(false);

    if ((dragY > 120 || velocity > 0.6) && !preventClose) {
      setClosingByDrag(true);
      setDragY(window.innerHeight);
      closeTimer.current = window.setTimeout(() => onOpenChange(false), 260);
    } else {
      setDragY(0);
    }
  };

  // ─── Classes ───────────────────────────────────────────────────────
  const contentClass = isDesktop
    ? cn(
        "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl outline-none",
        desktopMaxWidth,
        "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      )
    : cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border-t bg-background outline-none",
        "shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)]",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-500",
        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:duration-300",
        "ease-[cubic-bezier(0.32,0.72,0,1)]",
        closingByDrag && "data-[state=closed]:animate-none",
      );

  const sheetStyle = !isDesktop
    ? {
        transform: dragY ? `translate3d(0, ${dragY}px, 0)` : undefined,
        transition: dragging
          ? "none"
          : "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
      }
    : undefined;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-300"
          style={
            !isDesktop && dragY
              ? { opacity: Math.max(0.2, 1 - dragY / 600) }
              : undefined
          }
        />
        <DialogPrimitive.Content
          className={contentClass}
          style={sheetStyle}
          onOpenAutoFocus={(e) => {
            if (!isDesktop) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (preventClose) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (preventClose) e.preventDefault();
          }}
        >
          {/* Header (drag area on mobile) */}
          <div
            className={cn(
              "shrink-0 border-b bg-background",
              !isDesktop &&
                "cursor-grab touch-none select-none active:cursor-grabbing",
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {!isDesktop && (
              <div className="flex justify-center pb-1 pt-3">
                <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-2 sm:px-6 lg:pt-5">
              <div className="min-w-0">
                <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  {icon && (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      {icon}
                    </span>
                  )}
                  <span className="truncate">{title}</span>
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full"
                  disabled={preventClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Scrollable body
              On mobile, inputs/textarea use 16px text so iOS does not zoom in on focus */}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6",
              !isDesktop && "[&_input]:text-base [&_textarea]:text-base",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {/* Sticky footer */}
          {footer && (
            <div className="shrink-0 border-t bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6 lg:pb-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default ResponsiveSheet;
