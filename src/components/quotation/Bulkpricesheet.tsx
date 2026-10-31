// src/components/quotation/BulkPriceSheet.tsx
// Responsive "Change Bulk Price" UI
//  - Desktop (>= 1024px): centered modal with full table (incl. dimensions)
//  - Mobile / Tablet (< 1024px): native-app style bottom sheet with smooth
//    slide-up transition, drag-to-dismiss handle, card layout per product,
//    sticky header + sticky footer (grand total + save).
import {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Calculator,
  ChevronDown,
  IndianRupee,
  Loader2,
  Plus,
  Ruler,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Shared types & helpers (also used by QuotationEdit) ─────────────────
export type DimensionKey = "height" | "width" | "depth" | "length";

export type BulkItemEdit = {
  qty_type?: string;
  qty?: string;
  dimension_unit?: string;
  height?: string;
  width?: string;
  depth?: string;
  length?: string;
};

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  height: "Height",
  width: "Width",
  depth: "Depth",
  length: "Length",
};

const DIMENSION_SHORT: Record<DimensionKey, string> = {
  height: "H",
  width: "W",
  depth: "D",
  length: "L",
};

const QTY_TYPES = ["Fixed", "ByHW", "ByHWD", "ByHWL"];

export const toNumber = (value: unknown, fallback = 0): number => {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Which dimension inputs are needed for a qty type. */
export const getDimensionKeys = (qtyType?: string): DimensionKey[] => {
  switch (qtyType) {
    case "ByHW":
      return ["height", "width"];
    case "ByHWD":
      return ["height", "width", "depth"];
    case "ByHWL":
      return ["height", "width", "length"];
    default:
      return [];
  }
};

/** Merge the saved item with the user's unsaved bulk edits (numbers normalised). */
export const mergeBulkItem = (item: any, edit: BulkItemEdit = {}) => ({
  ...item,
  qty_type: edit.qty_type ?? item.qty_type ?? "Fixed",
  dimension_unit: edit.dimension_unit ?? item.dimension_unit ?? "feet",
  qty: toNumber(edit.qty ?? item.qty ?? item.quantity ?? 1, 0),
  height: Math.max(0, toNumber(edit.height ?? item.height)),
  width: Math.max(0, toNumber(edit.width ?? item.width)),
  depth: Math.max(0, toNumber(edit.depth ?? item.depth)),
  length: Math.max(0, toNumber(edit.length ?? item.length)),
});

/** True when anything other than unit price was changed for this item. */
export const isBulkItemChanged = (
  item: any,
  edit: BulkItemEdit = {},
): boolean => {
  if (
    edit.qty_type !== undefined &&
    edit.qty_type !== (item.qty_type || "Fixed")
  )
    return true;
  if (
    edit.dimension_unit !== undefined &&
    edit.dimension_unit !== (item.dimension_unit || "feet")
  )
    return true;
  if (
    edit.qty !== undefined &&
    toNumber(edit.qty) !== toNumber(item.qty || item.quantity || 1, 1)
  )
    return true;
  return (["height", "width", "depth", "length"] as DimensionKey[]).some(
    (key) =>
      edit[key] !== undefined &&
      Math.abs(toNumber(edit[key]) - toNumber(item[key])) > 0.0001,
  );
};

const unitLabel = (unit: string) => {
  if (unit === "feet") return "Feet";
  if (unit === "inches" || unit === "inch") return "Inches";
  return unit;
};

const getUnitOptions = (current: string) =>
  Array.from(new Set(["feet", "inches", current].filter(Boolean)));

// ─── Media query hook ───────────────────────────────────────────────────
function useIsDesktop(query = "(min-width: 1024px)") {
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

// ─── Props ──────────────────────────────────────────────────────────────
export interface BulkPriceSummary {
  subtotal: number;
  discount: number;
  afterDiscount: number;
  gst: number;
  total: number;
}

interface BulkPriceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  rooms: any[];

  unitPrices: Record<string, string>;
  onUnitPricesChange: Dispatch<SetStateAction<Record<string, string>>>;
  itemEdits: Record<string, BulkItemEdit>;
  onItemEditsChange: Dispatch<SetStateAction<Record<string, BulkItemEdit>>>;
  deletedItemIds: string[];
  onDeletedItemIdsChange: Dispatch<SetStateAction<string[]>>;

  discountType: "Percent" | "INR";
  onDiscountTypeChange: (value: "Percent" | "INR") => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  gstPercent: number;
  onGstPercentChange: (value: number) => void;
  isGstApplicable: boolean;
  onGstApplicableChange: (value: boolean) => void;

  summary: BulkPriceSummary;
  calculateItemTotal: (item: any) => number;
  calculateTotalMeasure: (item: any) => number;
  formatCurrency: (amount: number) => string;
  getQtyTypeLabel: (type: string) => string;

  onAddRoom: () => void;
  onAddProduct: (qrId: string) => void;
  onSave: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────
export function BulkPriceSheet({
  open,
  onOpenChange,
  saving,
  rooms,
  unitPrices,
  onUnitPricesChange,
  itemEdits,
  onItemEditsChange,
  deletedItemIds,
  onDeletedItemIdsChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  gstPercent,
  onGstPercentChange,
  isGstApplicable,
  onGstApplicableChange,
  summary,
  calculateItemTotal,
  calculateTotalMeasure,
  formatCurrency,
  getQtyTypeLabel,
  onAddRoom,
  onAddProduct,
  onSave,
}: BulkPriceSheetProps) {
  const isDesktop = useIsDesktop();

  // Drag-to-dismiss state (mobile/tablet only)
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closingByDrag, setClosingByDrag] = useState(false);
  const dragStart = useRef<{ y: number; t: number } | null>(null);
  const closeTimer = useRef<number | null>(null);

  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setDragY(0);
      setDragging(false);
      setClosingByDrag(false);
      setCollapsedRooms(new Set());
    }
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  // ─── Item helpers ──────────────────────────────────────────────────
  const visibleItems = (room: any) =>
    (room.items || []).filter(
      (item: any) => !deletedItemIds.includes(String(item.qp_id)),
    );

  const getMerged = (item: any) =>
    mergeBulkItem(item, itemEdits[String(item.qp_id)]);
  const getUnitPrice = (item: any) =>
    toNumber(unitPrices[String(item.qp_id)] ?? item.unit_price);
  const getLineTotal = (item: any) =>
    calculateItemTotal({ ...getMerged(item), unit_price: getUnitPrice(item) });

  const updateEdit = (key: string, patch: Partial<BulkItemEdit>) =>
    onItemEditsChange((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));

  const editValue = (item: any, field: keyof BulkItemEdit): string => {
    const edited = itemEdits[String(item.qp_id)]?.[field];
    if (edited !== undefined) return edited;
    if (field === "qty") return String(item.qty ?? item.quantity ?? 1);
    const raw = item[field];
    if (raw === undefined || raw === null) return "";
    if (
      ["height", "width", "depth", "length"].includes(field) &&
      toNumber(raw) === 0
    )
      return "";
    return String(raw);
  };

  const removeItem = (key: string) =>
    onDeletedItemIdsChange((current) => [...current, key]);

  const toggleRoom = (qrId: string) =>
    setCollapsedRooms((current) => {
      const next = new Set(current);
      if (next.has(qrId)) next.delete(qrId);
      else next.add(qrId);
      return next;
    });

  const totalItems = rooms.reduce(
    (count: number, room: any) => count + visibleItems(room).length,
    0,
  );

  // ─── Drag handlers ─────────────────────────────────────────────────
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDesktop || saving) return;
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

    if ((dragY > 120 || velocity > 0.6) && !saving) {
      setClosingByDrag(true);
      setDragY(window.innerHeight);
      closeTimer.current = window.setTimeout(() => onOpenChange(false), 260);
    } else {
      setDragY(0);
    }
  };

  // ─── Shared field renderers ────────────────────────────────────────
  const inputCls = "h-11 rounded-xl text-base lg:h-9 lg:rounded-lg lg:text-sm";
  // Hide native number spinners so the full value is visible in narrow cells
  const noSpinCls =
    "tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const triggerCls = "h-11 rounded-xl lg:h-9 lg:rounded-lg";

  const renderQtyTypeSelect = (item: any, merged: any, key: string) => (
    <Select
      value={merged.qty_type || "Fixed"}
      onValueChange={(value) => updateEdit(key, { qty_type: value })}
    >
      <SelectTrigger
        aria-label={`${item.product_name || item.name} quantity type`}
        className={triggerCls}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {QTY_TYPES.map((value) => (
          <SelectItem key={value} value={value}>
            {getQtyTypeLabel(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderUnitSelect = (item: any, merged: any, key: string) => (
    <Select
      value={merged.dimension_unit}
      onValueChange={(value) => updateEdit(key, { dimension_unit: value })}
    >
      <SelectTrigger
        aria-label={`${item.product_name || item.name} unit`}
        className={triggerCls}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {getUnitOptions(merged.dimension_unit).map((value) => (
          <SelectItem key={value} value={value}>
            {unitLabel(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderDimensionInput = (
    item: any,
    merged: any,
    key: string,
    dim: DimensionKey,
    compact = false,
  ) => {
    const missing = toNumber(merged[dim]) <= 0;
    return (
      <div key={dim} className={cn("space-y-1", compact && "min-w-0 flex-1")}>
        {!compact && (
          <Label className="text-[11px] text-muted-foreground">
            {DIMENSION_LABELS[dim]}
          </Label>
        )}
        <div className="relative">
          {compact && (
            <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">
              {DIMENSION_SHORT[dim]}
            </span>
          )}
          <Input
            aria-label={`${item.product_name || item.name} ${DIMENSION_LABELS[dim]}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0"
            value={editValue(item, dim)}
            onChange={(e) => updateEdit(key, { [dim]: e.target.value })}
            className={cn(
              inputCls,
              compact &&
                "w-full pl-5 pr-1.5 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              missing && "border-amber-400 focus-visible:ring-amber-400",
            )}
          />
        </div>
      </div>
    );
  };

  const renderQtyInput = (item: any, key: string) => (
    <Input
      aria-label={`${item.product_name || item.name} quantity`}
      type="number"
      inputMode="decimal"
      min="0.001"
      step="0.001"
      value={editValue(item, "qty")}
      onChange={(e) => updateEdit(key, { qty: e.target.value })}
      className={cn(inputCls, noSpinCls, "lg:px-2.5")}
    />
  );

  const renderPriceInput = (item: any, key: string) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <Input
        aria-label={`${item.product_name || item.name} unit price`}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={unitPrices[key] ?? String(item.unit_price || 0)}
        onChange={(e) =>
          onUnitPricesChange((current) => ({
            ...current,
            [key]: e.target.value,
          }))
        }
        className={cn(inputCls, noSpinCls, "pl-7 lg:pr-2")}
      />
    </div>
  );

  const measureText = (merged: any) =>
    merged.qty_type === "Fixed"
      ? `${merged.qty || 0} NOS`
      : `${calculateTotalMeasure(merged).toFixed(2)} sq.ft`;

  // ─── Mobile / tablet card ──────────────────────────────────────────
  const renderItemCard = (item: any) => {
    const key = String(item.qp_id);
    const merged = getMerged(item);
    const dims = getDimensionKeys(merged.qty_type);
    const total = getLineTotal(item);
    const hasMissingDim = dims.some((d) => toNumber(merged[d]) <= 0);

    return (
      <div
        key={key}
        className="rounded-2xl border bg-background p-3.5 shadow-sm transition-shadow animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-semibold leading-snug text-foreground">
              {item.product_name || item.name || "Product"}
            </p>
            <Badge variant="outline" className="mt-1 text-[10px]">
              {getQtyTypeLabel(merged.qty_type)}
            </Badge>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Remove ${item.product_name || item.name}`}
            className="h-9 w-9 shrink-0 rounded-full text-destructive hover:bg-destructive/10"
            onClick={() => removeItem(key)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">
              Qty Type
            </Label>
            {renderQtyTypeSelect(item, merged, key)}
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Unit</Label>
            {renderUnitSelect(item, merged, key)}
          </div>
        </div>

        {dims.length > 0 && (
          <div className="mt-2.5 rounded-xl border border-dashed bg-muted/30 p-2.5 animate-in fade-in-0 duration-300">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Ruler className="h-3.5 w-3.5 text-primary" />
              Dimensions ({unitLabel(merged.dimension_unit)})
            </div>
            <div
              className={cn(
                "grid gap-2",
                dims.length === 3 ? "grid-cols-3" : "grid-cols-2",
              )}
            >
              {dims.map((dim) => renderDimensionInput(item, merged, key, dim))}
            </div>
            {hasMissingDim && (
              <p className="mt-1.5 text-[11px] text-amber-600">
                Enter all dimensions to calculate the measure.
              </p>
            )}
          </div>
        )}

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">
              Quantity
            </Label>
            {renderQtyInput(item, key)}
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">
              Unit Price
            </Label>
            {renderPriceInput(item, key)}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {measureText(merged)}
          </span>
          <span className="text-base font-bold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    );
  };

  // ─── Desktop table row ─────────────────────────────────────────────
  const renderItemRow = (item: any) => {
    const key = String(item.qp_id);
    const merged = getMerged(item);
    const dims = getDimensionKeys(merged.qty_type);
    const total = getLineTotal(item);

    return (
      <tr
        key={key}
        className="align-middle transition-colors hover:bg-muted/30"
      >
        <td className="py-2 pl-4 pr-2">
          <p
            className="line-clamp-2 font-medium leading-snug"
            title={item.product_name || item.name}
          >
            {item.product_name || item.name || "Product"}
          </p>
        </td>
        <td className="px-1.5 py-2">
          {renderQtyTypeSelect(item, merged, key)}
        </td>
        <td className="px-1.5 py-2">{renderUnitSelect(item, merged, key)}</td>
        <td className="px-1.5 py-2">
          {dims.length > 0 ? (
            <div className="flex gap-1.5">
              {dims.map((dim) =>
                renderDimensionInput(item, merged, key, dim, true),
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-1.5 py-2">{renderQtyInput(item, key)}</td>
        <td className="px-1.5 py-2">{renderPriceInput(item, key)}</td>
        <td className="px-2 py-2 text-right">
          <p className="truncate font-semibold" title={formatCurrency(total)}>
            {formatCurrency(total)}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {measureText(merged)}
          </p>
        </td>
        <td className="py-2 pl-0 pr-2 text-center">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-destructive/10"
            aria-label={`Remove ${item.product_name || item.name}`}
            onClick={() => removeItem(key)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </td>
      </tr>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────
  const contentClass = isDesktop
    ? cn(
        "fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl outline-none",
        "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      )
    : cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border-t bg-background outline-none",
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
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
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
          // Avoid the keyboard popping up on mobile as soon as the sheet opens
          onOpenAutoFocus={(e) => {
            if (!isDesktop) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (saving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (saving) e.preventDefault();
          }}
        >
          {/* ── Header (drag area on mobile) ── */}
          <div className="shrink-0 border-b bg-background">
            <div
              className={cn(
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
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <IndianRupee className="h-4 w-4" />
                    </span>
                    Change Bulk Price
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Update qty type, dimensions, quantity and price room by
                    room, then apply discount & GST.
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full"
                    disabled={saving}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogPrimitive.Close>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-4 pb-3 sm:px-6">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
                </Badge>
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  {totalItems} {totalItems === 1 ? "product" : "products"}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-full"
                onClick={onAddRoom}
                disabled={saving}
              >
                <Plus className="h-4 w-4" />
                Add Room
              </Button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-muted/20 px-3 py-4 sm:px-6">
            {rooms.length === 0 ? (
              <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
                This quotation has no rooms yet. Add a room to begin.
              </div>
            ) : (
              rooms.map((room: any) => {
                const qrId = String(room.qr_id);
                const items = visibleItems(room);
                const collapsed = collapsedRooms.has(qrId);
                const roomTotal = items.reduce(
                  (sum: number, item: any) => sum + getLineTotal(item),
                  0,
                );

                return (
                  <section
                    key={qrId}
                    className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                  >
                    <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2.5 sm:px-4">
                      <button
                        type="button"
                        onClick={() => toggleRoom(qrId)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                            collapsed && "-rotate-90",
                          )}
                        />
                        <Building2 className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {room.room_name || "Room"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {items.length} products ·{" "}
                            {formatCurrency(roomTotal)}
                          </p>
                        </div>
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0 gap-1 rounded-full px-3 text-xs"
                        onClick={() => onAddProduct(qrId)}
                        disabled={saving}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Product
                      </Button>
                    </div>

                    {/* Smooth collapse */}
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out",
                        collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        {items.length === 0 ? (
                          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No products in this room.
                          </p>
                        ) : isDesktop ? (
                          // table-fixed + colgroup widths → table always fits the modal, no horizontal scroll
                          <table className="w-full table-fixed text-sm">
                            <colgroup>
                              <col />
                              <col className="w-[124px]" />
                              <col className="w-[100px]" />
                              <col className="w-[252px] xl:w-[312px]" />
                              <col className="w-[88px] xl:w-[100px]" />
                              <col className="w-[120px] xl:w-[136px]" />
                              <col className="w-[104px]" />
                              <col className="w-[44px]" />
                            </colgroup>
                            <thead>
                              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                {[
                                  "Product",
                                  "Qty Type",
                                  "Unit",
                                  "Dimensions",
                                  "Qty",
                                  "Unit Price",
                                  "Total",
                                  "",
                                ].map((title, i) => (
                                  <th
                                    key={`${title}-${i}`}
                                    className={cn(
                                      "px-1.5 py-2.5 font-medium first:pl-4",
                                      title === "Total" && "pr-2 text-right",
                                    )}
                                  >
                                    {title}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {items.map(renderItemRow)}
                            </tbody>
                          </table>
                        ) : (
                          <div className="grid gap-3 p-3 md:grid-cols-2">
                            {items.map(renderItemCard)}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })
            )}

            {/* Discount & GST + Summary */}
            <section className="grid gap-5 rounded-2xl border bg-card p-4 shadow-sm lg:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <div>
                    <h3 className="font-semibold">Discount & GST</h3>
                    <p className="text-xs text-muted-foreground">
                      Update discount and GST for this quotation.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Discount Type</Label>
                    <Select
                      value={discountType}
                      onValueChange={(v) =>
                        onDiscountTypeChange(v as "Percent" | "INR")
                      }
                    >
                      <SelectTrigger className={triggerCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">Fixed (₹)</SelectItem>
                        <SelectItem value="Percent">Percent (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {discountType === "Percent"
                        ? "Discount (%)"
                        : "Discount (₹)"}
                    </Label>
                    <Input
                      aria-label="Discount amount"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={discountType === "Percent" ? 100 : undefined}
                      step="0.01"
                      value={discountValue}
                      onChange={(e) =>
                        onDiscountValueChange(Number(e.target.value) || 0)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">GST (%)</Label>
                    <Input
                      aria-label="GST percentage"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="0.01"
                      value={gstPercent}
                      onChange={(e) =>
                        onGstPercentChange(Number(e.target.value) || 0)
                      }
                      className={inputCls}
                    />
                  </div>
                  <label className="flex h-11 items-center gap-2 self-end rounded-xl border px-3 text-sm lg:h-9">
                    <input
                      type="checkbox"
                      checked={isGstApplicable}
                      onChange={(e) => onGstApplicableChange(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                    GST Applicable
                  </label>
                </div>
              </div>

              <div className="space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
                <h3 className="mb-3 font-semibold">Summary</h3>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <b>{formatCurrency(summary.subtotal)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <b className="text-destructive">
                    - {formatCurrency(summary.discount)}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After Discount</span>
                  <b>{formatCurrency(summary.afterDiscount)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    GST (
                    {isGstApplicable
                      ? `${Number(gstPercent).toFixed(2)}%`
                      : "Not applicable"}
                    )
                  </span>
                  <b>{formatCurrency(summary.gst)}</b>
                </div>
                <div className="mt-2 flex justify-between border-t pt-3 text-base">
                  <span className="font-semibold">Total</span>
                  <b className="text-primary">
                    {formatCurrency(summary.total)}
                  </b>
                </div>
              </div>
            </section>
          </div>

          {/* ── Sticky footer ── */}
          <div className="shrink-0 border-t bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6 lg:pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Grand Total
                </p>
                <p className="truncate text-xl font-bold text-primary">
                  {formatCurrency(summary.total)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-11 gap-2 rounded-xl px-5"
                  onClick={onSave}
                  disabled={saving || !rooms.length}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="sm:hidden">
                    {saving ? "Saving…" : "Save"}
                  </span>
                  <span className="hidden sm:inline">
                    {saving ? "Saving…" : "Save Prices & Totals"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default BulkPriceSheet;
