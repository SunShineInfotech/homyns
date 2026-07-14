// src/pages/quotation/StepSummary.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Package as PackageIcon,
  Phone,
  Mail,
  Calculator,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getQuotationData,
  saveQuotationData,
  clearQuotationData,
} from "../CreateQuotation";

// ─── helpers ────────────────────────────────────────────────────────────────
const roundToTwo = (n: number) => Math.round(n * 100) / 100;

/** Mirror the frontend qty logic for the server payload */
function calcCalculatedQty(item: any): number {
  const qty = item.quantity || 1;
  if (item.qty_type === "Fixed") return qty;

  const toFt = (v: number) =>
    (item.measurement_unit || "feet") === "feet" ? v : v / 12;

  const h = toFt(item.height || 0);
  const w = toFt(item.width || 0);

  if (item.qty_type === "ByHW") return roundToTwo(h * w * qty);
  if (item.qty_type === "ByHWD")
    return roundToTwo(h * w * toFt(item.depth || 0) * qty);
  if (item.qty_type === "ByHWL")
    return roundToTwo(h * w * toFt(item.length || 0) * qty);
  return qty;
}

/** Calculate required_qty for a raw-material line given the product's calculated_qty */
function calcRmRequiredQty(rm: any, calculatedQty: number): number {
  const base = parseFloat(rm.rm_qty) || 0;
  return roundToTwo(base * calculatedQty);
}

// ─── API URL ────────────────────────────────────────────────────────────────
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://sunshineproduct.in/interior_designer/v1_api/";

// ─── API call ────────────────────────────────────────────────────────────────
async function submitQuotation(payload: any): Promise<any> {
  const url = `${API_URL}quotation.php`;
  console.log("Submitting to:", url);
  console.log("Payload:", payload);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ────────────────────────────────────────────────────────────────────────────
export default function StepSummary() {
  const navigate = useNavigate();

  const [discountType, setDiscountType] = useState<"rs" | "pct">("rs");
  const [discountValue, setDiscountValue] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [roomsData, setRoomsData] = useState<any[]>([]);

  // ── Confirmation Dialog ────────────────────────────────────────────────
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const quotationData = useMemo(() => {
    const data = getQuotationData();
    console.log("📊 StepSummary - Retrieved data:", data);
    return data;
  }, []);

  const { selectedClient, selectedPackage } = quotationData || {};

  // Extract rooms from the saved data - handle both formats
  useEffect(() => {
    const data = getQuotationData();
    if (data) {
      // Check if rooms exist in the data
      let rooms = data.rooms || [];
      
      // If rooms is an array, filter out rooms that are not selected
      // but keep the ones that are selected (or all if no selected flag)
      if (Array.isArray(rooms) && rooms.length > 0) {
        // Check if rooms have a 'selected' flag
        const hasSelectedFlag = rooms.some((room: any) => room.selected !== undefined);
        if (hasSelectedFlag) {
          // Filter to only selected rooms
          rooms = rooms.filter((room: any) => room.selected !== false);
        }
        setRoomsData(rooms);
        
        // Expand first room by default
        if (rooms.length > 0) {
          setExpandedRooms([rooms[0].id]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (quotationData?.discountType)
      setDiscountType(quotationData.discountType);
    if (quotationData?.discountValue != null)
      setDiscountValue(quotationData.discountValue);
    if (quotationData?.gstPercent != null)
      setGstPercent(quotationData.gstPercent);
    if (quotationData?.specialInstructions)
      setSpecialInstructions(quotationData.specialInstructions);
  }, []);

  // ── Totals ──────────────────────────────────────────────────────────────
  const { subtotal, discountAmount, afterDiscount, taxAmount, grandTotal } =
    useMemo(() => {
      console.log("🧮 Calculating totals from roomsData:", roomsData);

      const sub =
        roomsData?.reduce(
          (acc: number, room: any) =>
            acc +
            (room.items
              ?.filter((i: any) => i.included)
              .reduce((s: number, i: any) => s + (i.total_price || 0), 0) || 0),
          0,
        ) || 0;

      console.log("💰 Subtotal calculated:", sub);

      const disc =
        discountType === "pct" ? (sub * discountValue) / 100 : discountValue;
      const after = Math.max(0, sub - disc);
      const tax = (after * (gstPercent || 0)) / 100;

      return {
        subtotal: sub,
        discountAmount: disc,
        afterDiscount: after,
        taxAmount: tax,
        grandTotal: after + tax,
      };
    }, [roomsData, discountType, discountValue, gstPercent]);

  const toggleRoom = (id: string) =>
    setExpandedRooms((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  // ── Save draft ───────────────────────────────────────────────────────────
  const persistSummary = () => {
    saveQuotationData({
      discountType,
      discountValue,
      gstPercent,
      specialInstructions,
    });
  };

  // ── Handle Create Quotation Click ──────────────────────────────────────
  const handleCreateClick = () => {
    // Validate before showing dialog
    if (!selectedClient) {
      toast({
        title: "Missing client",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }
    if (!roomsData || roomsData.length === 0) {
      toast({
        title: "No items",
        description: "Please add at least one item.",
        variant: "destructive",
      });
      return;
    }

    // Check if any items are included
    const hasIncludedItems = roomsData.some((room: any) =>
      room.items?.some((i: any) => i.included),
    );
    if (!hasIncludedItems) {
      toast({
        title: "No included items",
        description: "Please include at least one product.",
        variant: "destructive",
      });
      return;
    }

    persistSummary();
    setConfirmDialogOpen(true);
  };

  // ── Build API payload & submit ────────────────────────────────────────────
  const handleConfirmCreate = async () => {
    setConfirmDialogOpen(false);
    setSubmitting(true);

    try {
      const companyId: string = (() => {
        try {
          const raw = localStorage.getItem("company_data");
          return raw ? JSON.parse(raw)?.company_id || "" : "";
        } catch {
          return "";
        }
      })();

      const generatedBy: string = (() => {
        try {
          const raw = localStorage.getItem("user_data");
          return raw ? JSON.parse(raw)?.emp_id || "" : "";
        } catch {
          return "";
        }
      })();

      // Build rooms payload - use roomsData directly
      const roomsPayload = roomsData
        .map((room: any) => {
          const includedItems =
            room.items?.filter((i: any) => i.included) || [];
          if (includedItems.length === 0) return null;

          const items = includedItems.map((item: any) => {
            const calculated_qty = calcCalculatedQty(item);
            const total_price = roundToTwo(
              calculated_qty * (item.unit_price || 0),
            );

            // Build raw-material lines
            const raw_materials = (item.raw_materials || []).map((rm: any) => ({
              rm_id: rm.rm_id || rm.id || "",
              required_qty: calcRmRequiredQty(rm, calculated_qty),
              unit: rm.unit_name || rm.unit || "",
            }));

            return {
              product_id: item.product_id,
              is_special: item.is_special ? 1 : 0,
              qty_type: item.qty_type || "Fixed",
              qty: item.quantity || 1,
              height: item.height || 0,
              width: item.width || 0,
              depth: item.depth || 0,
              length: item.length || 0,
              dimension_unit: item.measurement_unit || "feet",
              unit_price: item.unit_price || 0,
              calculated_qty,
              total_price,
              remark: item.remark || "",
              raw_materials,
            };
          });

          const room_total = items.reduce(
            (s: number, i: any) => s + i.total_price,
            0,
          );

          return {
            room_id: room.room_id || room.id,
            room_total: roundToTwo(room_total),
            items,
          };
        })
        .filter(Boolean);

      if (roomsPayload.length === 0) {
        toast({
          title: "No included items",
          description: "Please include at least one product.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        type: 1,
        company_id: companyId,
        client_id: selectedClient.client_id,
        package_id: selectedPackage?.package_id || "",
        generated_by: generatedBy,
        subtotal: roundToTwo(subtotal),
        discount_type: discountType === "pct" ? "PCT" : "INR",
        discount_value: discountValue,
        discount_amount: roundToTwo(discountAmount),
        amount_after_discount: roundToTwo(afterDiscount),
        gst_applicable: gstPercent > 0 ? 1 : 0,
        gst_percent: gstPercent,
        gst_amount: roundToTwo(taxAmount),
        final_amount: roundToTwo(grandTotal),
        remark: specialInstructions,
        rooms: roomsPayload,
      };

      const result = await submitQuotation(payload);

      if (result.status === "success") {
        toast({
          title: "Quotation Created!",
          description: `${result.quotation_number} saved successfully.`,
        });

        // ── CLEAR ALL QUOTATION DATA ──────────────────────────────────
        clearQuotationData();

        // Navigate to quotations list
        navigate("/quotations");
      } else {
        toast({
          title: "Failed",
          description: result.message || "Could not create quotation.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({
        title: "Error",
        description: err.message || "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const hasItems =
    roomsData?.some((room: any) => room.items?.some((i: any) => i.included)) ??
    false;

  return (
    <>
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
        {/* ── Left / Main ─────────────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-4">
          {/* Client + Package cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Client */}
            <Card className="p-4 md:p-5 bg-card border-border shadow-soft rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm md:text-base">
                  Client Details
                </h3>
              </div>
              {selectedClient ? (
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    {selectedClient.client_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {selectedClient.phone1}
                  </div>
                  {selectedClient.client_email && (
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {selectedClient.client_email}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No client selected
                </p>
              )}
            </Card>

            {/* Package */}
            <Card className="p-4 md:p-5 bg-card border-border shadow-soft rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <PackageIcon className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-semibold text-foreground text-sm md:text-base">
                  Package
                </h3>
              </div>
              {selectedPackage ? (
                <div>
                  <p className="font-semibold text-foreground">
                    {selectedPackage.package_name}
                  </p>
                  {selectedPackage.details && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {selectedPackage.details}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Custom (no package)
                </p>
              )}
            </Card>
          </div>

          {/* Room-wise breakdown */}
          <Card className="p-4 md:p-5 bg-card border-border shadow-soft rounded-2xl">
            <h3 className="font-semibold text-foreground mb-3">
              Room-wise Cost Breakdown
            </h3>
            {roomsData && roomsData.length > 0 ? (
              <div className="space-y-2">
                {roomsData.map((room: any) => {
                  const included =
                    room.items?.filter((i: any) => i.included) || [];
                  if (included.length === 0) return null;
                  const roomTotal = included.reduce(
                    (s: number, i: any) => s + (i.total_price || 0),
                    0,
                  );
                  const isOpen = expandedRooms.includes(room.id);

                  return (
                    <div
                      key={room.id}
                      className="rounded-xl border border-border overflow-hidden"
                    >
                      {/* Room row */}
                      <button
                        onClick={() => toggleRoom(room.id)}
                        className="w-full flex items-center justify-between p-3 bg-secondary/40 hover:bg-secondary/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {room.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0"
                          >
                            {included.length} item
                            {included.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            ₹{Math.round(roomTotal).toLocaleString()}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Items */}
                      {isOpen && (
                        <div className="p-3 space-y-1.5">
                          {included.map((item: any) => {
                            // Calculate proper display values
                            const isFixed = item.qty_type === "Fixed";
                            const calculatedQty = calcCalculatedQty(item);
                            const unitPrice = item.unit_price || 0;

                            // Determine unit display
                            let unitDisplay = isFixed ? "NOS" : "sq.ft";

                            // For dimension-based items, show dimensions
                            let dimensionsDisplay = "";
                            if (!isFixed) {
                              const h = item.height || 0;
                              const w = item.width || 0;
                              const d = item.depth || 0;
                              const l = item.length || 0;
                              const unit = item.measurement_unit || "inches";
                              const unitLabel = unit === "feet" ? "ft" : "in";

                              if (item.qty_type === "ByHW") {
                                dimensionsDisplay = `${h}×${w} ${unitLabel}`;
                              } else if (item.qty_type === "ByHWD") {
                                dimensionsDisplay = `${h}×${w}×${d} ${unitLabel}`;
                              } else if (item.qty_type === "ByHWL") {
                                dimensionsDisplay = `${h}×${w}×${l} ${unitLabel}`;
                              }
                            }

                            return (
                              <div
                                key={item.id}
                                className="flex items-start justify-between text-sm gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-foreground font-medium truncate block">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-1">
                                    <span>Qty: {item.quantity}</span>
                                    {isFixed ? (
                                      <span>· {unitDisplay}</span>
                                    ) : (
                                      <>
                                        <span>· {dimensionsDisplay}</span>
                                        <span>· {unitDisplay}: {calculatedQty.toFixed(2)}</span>
                                      </>
                                    )}
                                    <span>· ₹{unitPrice}/unit</span>
                                  </span>
                                </div>
                                <span className="text-foreground font-medium shrink-0">
                                  ₹{Math.round(item.total_price || 0).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No items added yet
              </p>
            )}
          </Card>

          {/* Special Instructions */}
          <Card className="p-4 md:p-5 bg-card border-border shadow-soft rounded-2xl">
            <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
              Special Instructions
            </h3>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific notes for this quotation..."
              rows={3}
              className="rounded-xl text-sm"
            />
          </Card>
        </div>

        {/* ── Right / Sidebar ──────────────────────────────────────────── */}
        <div className="md:col-span-1">
          <Card className="p-4 md:p-6 bg-card border-border shadow-elevated rounded-2xl space-y-4 md:sticky md:top-24">
            <h3 className="font-semibold text-foreground text-base md:text-lg">
              Quotation Summary
            </h3>

            {/* Discount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Discount</Label>
              <div className="flex gap-2">
                <div className="flex rounded-xl border border-border overflow-hidden shrink-0">
                  <button
                    onClick={() => setDiscountType("rs")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      discountType === "rs"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    ₹
                  </button>
                  <button
                    onClick={() => setDiscountType("pct")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      discountType === "pct"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    %
                  </button>
                </div>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="h-10 rounded-xl flex-1"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>

            {/* GST */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">GST (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={gstPercent}
                  onChange={(e) =>
                    setGstPercent(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="h-10 rounded-xl pr-8"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  ₹{Math.round(subtotal).toLocaleString()}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount
                    {discountType === "pct" ? ` (${discountValue}%)` : ""}
                  </span>
                  <span className="font-medium text-destructive">
                    − ₹{Math.round(discountAmount).toLocaleString()}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After Discount</span>
                  <span className="font-medium">
                    ₹{Math.round(afterDiscount).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  GST ({gstPercent}%)
                </span>
                <span className="font-medium">
                  ₹{Math.round(taxAmount).toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base font-semibold">
                  Final Total
                </span>
                <span className="text-xl md:text-2xl font-bold text-primary">
                  ₹{Math.round(grandTotal).toLocaleString()}
                </span>
              </div>
            </div>

            {/* CTA - Create Quotation Button */}
            <Button
              onClick={handleCreateClick}
              className="w-full gap-2"
              size="lg"
              disabled={!selectedClient || !hasItems || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Quotation
                </>
              )}
            </Button>

            {!selectedClient && (
              <p className="text-xs text-destructive text-center">
                Select a client to continue
              </p>
            )}
            {!hasItems && selectedClient && (
              <p className="text-xs text-destructive text-center">
                Add at least one item to continue
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* ─── CONFIRMATION DIALOG ─────────────────────────────────────────── */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Quotation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to create this quotation?</p>
              <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">
                    {selectedClient?.client_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-primary">
                    ₹{Math.round(grandTotal).toLocaleString()}
                  </span>
                </div>
                {roomsData && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium">
                      {roomsData.reduce(
                        (acc: number, room: any) =>
                          acc +
                          (room.items?.filter((i: any) => i.included).length ||
                            0),
                        0,
                      )}{" "}
                      products
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. The quotation will be saved and
                all current data will be cleared.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel
              disabled={submitting}
              className="rounded-xl h-10 flex-1 sm:flex-none"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="rounded-xl h-10 flex-1 sm:flex-none gap-2"
              onClick={handleConfirmCreate}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Yes, Create
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}