// src/components/quotation/StepItemSelection.tsx
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { QuotationRoom, roundPrice } from "@/pages/CreateQuotation";
import { Product } from "@/services/product.service";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Sofa, Bed, ChefHat, DoorOpen, Baby, Briefcase,
  ChevronDown, Minus, Plus, Package,
} from "lucide-react";

interface StepItemSelectionProps {
  rooms: QuotationRoom[];
  expandedRooms: string[];
  setExpandedRooms: (rooms: string[]) => void;
  updateRoomItem: (
    roomId: string,
    itemId: string,
    updates: Partial<{
      quantity: number;
      included: boolean;
      price: number;
      remark: string;
      height?: number;
      width?: number;
      depth?: number;
      length?: number;
    }>
  ) => void;
  onAddProduct?: (roomId: string, product: Product) => void;
  products?: Product[];
}

const roomIcons: Record<string, React.ElementType> = {
  sofa: Sofa, bed: Bed, chefHat: ChefHat, doorOpen: DoorOpen, baby: Baby, briefcase: Briefcase,
};

export function StepItemSelection({
  rooms,
  expandedRooms,
  setExpandedRooms,
  updateRoomItem,
  onAddProduct,
  products = [],
}: StepItemSelectionProps) {
  const toggleRoom = (roomId: string) => {
    if (expandedRooms.includes(roomId)) {
      setExpandedRooms(expandedRooms.filter((id) => id !== roomId));
    } else {
      setExpandedRooms([...expandedRooms, roomId]);
    }
  };

  const getRoomTotal = (room: QuotationRoom) =>
    roundPrice(room.items.filter((i) => i.included).reduce((sum, i) => sum + i.total_price, 0));

  const productOptions = products.map((p) => ({
    value: p.product_id || "",
    label: `${p.product_name} (${p.category_name || 'No Category'})`,
  }));

  // Format price for display
  const formatPrice = (value: number) => {
    return Math.round(value).toLocaleString('en-IN');
  };

  return (
    <div>
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Select & Customize Items</h2>
        <p className="text-muted-foreground text-sm">Select items for each room, set quantities, and add remarks</p>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const Icon = roomIcons[room.icon] || Sofa;
          const isExpanded = expandedRooms.includes(room.id);
          const roomTotal = getRoomTotal(room);
          const includedCount = room.items.filter(i => i.included).length;

          return (
            <Card key={room.id} className="overflow-hidden border-border bg-card shadow-soft rounded-2xl">
              <div
                onClick={() => toggleRoom(room.id)}
                className={cn(
                  "flex items-center justify-between p-4 md:p-5 cursor-pointer transition-colors",
                  isExpanded && "bg-secondary/50 border-b border-border"
                )}
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0", isExpanded ? "bg-primary/10" : "bg-secondary")}>
                    <Icon className={cn("w-5 h-5 md:w-6 md:h-6", isExpanded ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{room.room_name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{includedCount} items selected • ₹{formatPrice(roomTotal)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">Total</p>
                    <p className="text-base md:text-lg font-semibold text-foreground">₹{formatPrice(roomTotal)}</p>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 md:p-5 space-y-4 animate-fade-in">
                  {onAddProduct && products.length > 0 && (
                    <div className="p-3 bg-muted/30 rounded-xl border border-dashed">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Add Product to {room.room_name}</p>
                      <SearchableSelect
                        options={productOptions}
                        value=""
                        onChange={(v) => {
                          const product = products.find(p => p.product_id === v);
                          if (product) {
                            onAddProduct(room.id, product);
                          }
                        }}
                        placeholder="Search and select product..."
                      />
                    </div>
                  )}

                  {room.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No items added yet</p>
                      <p className="text-xs text-muted-foreground/60">Add products using the dropdown above</p>
                    </div>
                  ) : (
                    room.items.map((item) => {
                      const isByHWD = item.qty_type === 'ByHWD';
                      const isByHWL = item.qty_type === 'ByHWL';
                      const isFixed = item.qty_type === 'Fixed';

                      return (
                        <div key={item.id} className={cn("rounded-xl border border-border p-3 md:p-4 space-y-3 transition-opacity", !item.included && "opacity-60")}>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={item.included}
                              onCheckedChange={(c) => updateRoomItem(room.id, item.id, { included: c as boolean })}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                <div>
                                  <p className="font-semibold text-foreground">{item.product_name}</p>
                                  <p className="text-[11px] text-muted-foreground">Type: {item.qty_type}</p>
                                </div>
                                <p className="font-semibold text-foreground text-right">₹{formatPrice(item.total_price)}</p>
                              </div>
                            </div>
                          </div>

                          {item.included && (
                            <>
                              {(isByHWD || isByHWL) && (
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[11px] text-muted-foreground">Height</label>
                                    <Input
                                      type="number"
                                      value={item.height || 0}
                                      onChange={(e) => updateRoomItem(room.id, item.id, { height: Number(e.target.value) || 0 })}
                                      className="h-9 rounded-lg text-sm mt-1"
                                      min="0"
                                      step="1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] text-muted-foreground">Width</label>
                                    <Input
                                      type="number"
                                      value={item.width || 0}
                                      onChange={(e) => updateRoomItem(room.id, item.id, { width: Number(e.target.value) || 0 })}
                                      className="h-9 rounded-lg text-sm mt-1"
                                      min="0"
                                      step="1"
                                    />
                                  </div>
                                  {isByHWD && (
                                    <div>
                                      <label className="text-[11px] text-muted-foreground">Depth</label>
                                      <Input
                                        type="number"
                                        value={item.depth || 0}
                                        onChange={(e) => updateRoomItem(room.id, item.id, { depth: Number(e.target.value) || 0 })}
                                        className="h-9 rounded-lg text-sm mt-1"
                                        min="0"
                                        step="1"
                                      />
                                    </div>
                                  )}
                                  {isByHWL && (
                                    <div>
                                      <label className="text-[11px] text-muted-foreground">Length</label>
                                      <Input
                                        type="number"
                                        value={item.length || 0}
                                        onChange={(e) => updateRoomItem(room.id, item.id, { length: Number(e.target.value) || 0 })}
                                        className="h-9 rounded-lg text-sm mt-1"
                                        min="0"
                                        step="1"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {isFixed && (
                                <div>
                                  <label className="text-[11px] text-muted-foreground">Quantity</label>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={item.quantity <= 1} onClick={() => updateRoomItem(room.id, item.id, { quantity: item.quantity - 1 })}>
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="flex-1 text-center font-medium text-sm">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateRoomItem(room.id, item.id, { quantity: item.quantity + 1 })}>
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-muted-foreground">Unit Price</label>
                                  <Input
                                    type="number"
                                    value={item.unit_price || 0}
                                    onChange={(e) => updateRoomItem(room.id, item.id, { price: Number(e.target.value) || 0 })}
                                    className="h-9 rounded-lg text-sm mt-1"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-muted-foreground">Calculated Qty</label>
                                  <Input
                                    type="number"
                                    value={roundPrice(item.calculated_qty)}
                                    className="h-9 rounded-lg text-sm mt-1 bg-muted"
                                    readOnly
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[11px] text-muted-foreground">Requirement Remark</label>
                                <Textarea
                                  value={item.remark || ""}
                                  onChange={(e) => updateRoomItem(room.id, item.id, { remark: e.target.value })}
                                  placeholder="Any specific requirement for this item…"
                                  rows={2}
                                  className="rounded-lg text-sm mt-1"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}