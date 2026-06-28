// src/pages/quotation/StepItems.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sofa,
  Bed,
  ChefHat,
  DoorOpen,
  Baby,
  Briefcase,
  ChevronDown,
  Minus,
  Plus,
  Package,
  Ruler,
  Loader2,
  Layers,
  Info,
  Calculator,
  X,
} from "lucide-react";
import { productService, Product } from "@/services/product.service";
import { toast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getQuotationData, saveQuotationData } from "../CreateQuotation";

const roomIcons: Record<string, React.ElementType> = {
  sofa: Sofa,
  bed: Bed,
  chefHat: ChefHat,
  doorOpen: DoorOpen,
  baby: Baby,
  briefcase: Briefcase,
};

const roundToTwo = (num: number): number => Math.round(num * 100) / 100;
const roundToInteger = (num: number): number => Math.round(num);

export default function StepItems() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
    return "";
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        toast({
          title: "Error",
          description: "Company not found",
          variant: "destructive",
        });
        return;
      }

      let formattedProducts: Product[] = [];
      const res = await productService.getProducts(companyId);
      if (res.status === "success" && res.data) {
        formattedProducts = res.data.map((p: any) => ({
          ...p,
          price: parseFloat(p.price) || 0,
          height: parseFloat(p.height) || 0,
          width: parseFloat(p.width) || 0,
          depth: parseFloat(p.depth) || 0,
          length: parseFloat(p.length) || 0,
          qty_type: p.qty_type || "Fixed",
          product_details: p.product_details || [],
        }));
        setProducts(formattedProducts);
      }

      const saved = getQuotationData();

      // Get selected room IDs from StepRooms
      const savedRooms = saved?.rooms || [];
      const selectedRoomIds = savedRooms.map((room: any) => room.id);
      setSelectedRooms(selectedRoomIds);

      if (saved?.rooms && saved.rooms.length > 0) {
        // Only use rooms that were selected in StepRooms
        const updatedRooms = saved.rooms.map((room: any) => {
          const updatedItems = room.items.map((item: any) => {
            const freshProduct = formattedProducts.find(
              (p: any) => p.product_id === item.product_id,
            );
            if (freshProduct) {
              const merged = {
                ...item,
                name: freshProduct.product_name,
                unit_price: freshProduct.price,
                qty_type: freshProduct.qty_type || "Fixed",
                height: item.height ?? freshProduct.height ?? 0,
                width: item.width ?? freshProduct.width ?? 0,
                depth: item.depth ?? freshProduct.depth ?? 0,
                length: item.length ?? freshProduct.length ?? 0,
                raw_materials: freshProduct.product_details || [],
              };
              merged.total_price = calculateItemTotalStatic(merged);
              return merged;
            }
            return item;
          });

          const roomTotal = updatedItems
            .filter((i: any) => i.included)
            .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);

          return {
            ...room,
            items: updatedItems,
            room_total: roundToTwo(roomTotal),
          };
        });
        setRooms(updatedRooms);
        setExpandedRooms(saved.expandedRooms || []);
      } else {
        // If no saved rooms, check if we have rooms from package
        const roomsFromPackage = saved?.roomsFromPackage || [];
        if (roomsFromPackage.length > 0) {
          const initialRooms = roomsFromPackage.map((room: any) => ({
            ...room,
            items: room.items || [],
            room_total: 0,
          }));
          setRooms(initialRooms);
          setExpandedRooms(initialRooms.length > 0 ? [initialRooms[0].id] : []);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save to localStorage whenever rooms change
  // Save to localStorage whenever rooms change - with debounce
  useEffect(() => {
    if (!loading && rooms.length > 0) {
      console.log("🔄 Auto-saving rooms to localStorage:", {
        roomsCount: rooms.length,
        total: rooms.reduce((acc, room) => acc + getRoomTotal(room), 0),
      });

      // Use a timeout to prevent too many saves
      const timeoutId = setTimeout(() => {
        saveQuotationData({ rooms, expandedRooms });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [rooms, expandedRooms, loading]);

  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  // Static version for use outside component state
  const calculateTotalMeasureStatic = (item: any): number => {
    const qty = item.quantity || 1;
    if (item.qty_type === "Fixed") return qty;

    const height = item.height || 0;
    const width = item.width || 0;
    const depth = item.depth || 0;
    const length = item.length || 0;
    const unit = item.measurement_unit || "feet";

    const toFt = (v: number) => (unit === "feet" ? v : v / 12);

    if (item.qty_type === "ByHW") {
      return roundToTwo(toFt(width) * toFt(height) * qty);
    }
    if (item.qty_type === "ByHWD") {
      return roundToTwo(toFt(width) * toFt(height) * toFt(depth) * qty);
    }
    if (item.qty_type === "ByHWL") {
      return roundToTwo(toFt(width) * toFt(height) * toFt(length) * qty);
    }
    return qty;
  };

  const calculateItemTotalStatic = (item: any): number => {
    const totalMeasure = calculateTotalMeasureStatic(item);
    return roundToTwo(totalMeasure * (item.unit_price || 0));
  };

  const calculateTotalMeasure = (item: any): number =>
    calculateTotalMeasureStatic(item);

  const updateRoomItem = (roomId: string, itemId: string, updates: any) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        const updatedItems = room.items.map((item: any) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, ...updates };
          updated.total_price = calculateItemTotalStatic(updated);
          return updated;
        });
        const roomTotal = updatedItems
          .filter((i: any) => i.included)
          .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);
        return {
          ...room,
          items: updatedItems,
          room_total: roundToTwo(roomTotal),
        };
      }),
    );
  };

  const addProductToRoom = (roomId: string, product: Product) => {
    const productQtyType = product.qty_type || "Fixed";
    const height = parseFloat(String(product.height)) || 0;
    const width = parseFloat(String(product.width)) || 0;
    const depth = parseFloat(String(product.depth)) || 0;
    const length = parseFloat(String(product.length)) || 0;
    const unit_price = parseFloat(String(product.price)) || 0;

    const newItem: any = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product_id: product.product_id,
      name: product.product_name,
      qty_type: productQtyType,
      quantity: 1,
      height,
      width,
      depth,
      length,
      measurement_unit: "feet",
      unit_price,
      total_price: 0,
      included: true,
      remark: "",
      raw_materials: product.product_details || [],
    };

    // Calculate total price immediately on add
    newItem.total_price = calculateItemTotalStatic(newItem);

    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        const updatedItems = [...room.items, newItem];
        const roomTotal = updatedItems
          .filter((i: any) => i.included)
          .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);
        return {
          ...room,
          items: updatedItems,
          room_total: roundToTwo(roomTotal),
        };
      }),
    );

    setSelectedProductId((prev) => ({ ...prev, [roomId]: "" }));
  };

  const removeProductFromRoom = (roomId: string, itemId: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        const updatedItems = room.items.filter((i: any) => i.id !== itemId);
        const roomTotal = updatedItems
          .filter((i: any) => i.included)
          .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);
        return {
          ...room,
          items: updatedItems,
          room_total: roundToTwo(roomTotal),
        };
      }),
    );
  };

  const getRoomTotal = (room: any) =>
    roundToTwo(
      room.items
        ?.filter((i: any) => i.included)
        .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0) || 0,
    );

  const getAvailableProducts = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    const addedProductIds = room?.items?.map((i: any) => i.product_id) || [];
    return products.filter((p) => !addedProductIds.includes(p.product_id));
  };

  const handleSave = () => {
    // Make sure we have the latest state
    const latestRooms = rooms;
    const latestExpandedRooms = expandedRooms;

    console.log("💾 Saving StepItems data:", {
      rooms: latestRooms,
      roomsCount: latestRooms.length,
      expandedRooms: latestExpandedRooms,
      total: latestRooms.reduce((acc, room) => acc + getRoomTotal(room), 0),
    });

    // Save with explicit data
    saveQuotationData({
      rooms: latestRooms,
      expandedRooms: latestExpandedRooms,
    });

    toast({
      title: "Saved",
      description: `Items saved: ₹${latestRooms.reduce((acc, room) => acc + getRoomTotal(room), 0).toLocaleString()}`,
    });

    // Navigate to summary
    navigate("/create-quotation/summary");
  };

  const getQtyTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      Fixed: "Fixed",
      ByHW: "H × W",
      ByHWD: "H × W × D",
      ByHWL: "H × W × L",
    };
    return labels[type] || type;
  };

  const getUnitLabel = (unit: string): string =>
    unit === "feet" ? "ft" : "in";

  // Filter rooms to only show selected ones
  const filteredRooms = rooms.filter((room) => selectedRooms.includes(room.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no rooms are selected, show a message
  if (filteredRooms.length === 0 && rooms.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Rooms Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          You haven't selected any rooms in the previous step. Please go back
          and select at least one room to add items.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/create-quotation/rooms")}
        >
          Go back to Rooms
        </Button>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Rooms Available</h3>
        <p className="text-sm text-muted-foreground">
          No rooms have been added to this quotation yet.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/create-quotation/rooms")}
        >
          Go back to Rooms
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {filteredRooms.map((room) => {
        const Icon = roomIcons[room.icon as keyof typeof roomIcons] || Sofa;
        const isExpanded = expandedRooms.includes(room.id);
        const roomTotal = getRoomTotal(room);
        const includedCount =
          room.items?.filter((i: any) => i.included).length || 0;

        return (
          <Card
            key={room.id}
            className="overflow-hidden border-border bg-card shadow-soft rounded-2xl"
          >
            {/* Room Header */}
            <div
              onClick={() => toggleRoom(room.id)}
              className={cn(
                "flex items-center justify-between p-3 md:p-5 cursor-pointer transition-colors select-none",
                isExpanded && "bg-secondary/50 border-b border-border",
              )}
            >
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <div
                  className={cn(
                    "w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0",
                    isExpanded ? "bg-primary/10" : "bg-secondary",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 md:w-6 md:h-6",
                      isExpanded ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                    {room.name}
                  </h3>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {includedCount} item{includedCount !== 1 ? "s" : ""} • ₹
                    {roomTotal.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-sm md:text-lg font-semibold text-foreground">
                    ₹{roomTotal.toLocaleString()}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 md:w-5 md:h-5 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </div>
            </div>

            {/* Room Content */}
            {isExpanded && (
              <div className="p-3 md:p-5 space-y-3 md:space-y-4 animate-fade-in">
                {/* Add Product */}
                <div className="p-3 md:p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Add Product to {room.name}
                  </p>
                  <SearchableSelect
                    options={getAvailableProducts(room.id).map((p) => ({
                      value: p.product_id || "",
                      label: `${p.product_name} (${p.category_name || "No Category"})`,
                    }))}
                    value={selectedProductId[room.id] || ""}
                    onChange={(v) => {
                      setSelectedProductId((prev) => ({
                        ...prev,
                        [room.id]: v,
                      }));
                      const product = products.find((p) => p.product_id === v);
                      if (product) addProductToRoom(room.id, product);
                    }}
                    placeholder="Search and select product..."
                  />
                </div>

                {/* Items */}
                {!room.items || room.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Package className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No items added yet
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Search and select a product above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {room.items.map((item: any, index: number) => {
                      const isDimensionBased = item.qty_type !== "Fixed";
                      const totalMeasure = calculateTotalMeasure(item);

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "rounded-xl border transition-all duration-200",
                            item.included
                              ? "border-border bg-card"
                              : "border-dashed border-muted-foreground/30 bg-muted/10 opacity-60",
                          )}
                        >
                          {/* Item Header */}
                          <div
                            className={cn(
                              "p-3 flex items-start gap-2",
                              item.included && "border-b border-border",
                            )}
                          >
                            <Checkbox
                              checked={item.included}
                              onCheckedChange={(c) =>
                                updateRoomItem(room.id, item.id, {
                                  included: c as boolean,
                                })
                              }
                              className="mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-semibold text-foreground text-sm truncate">
                                      {item.name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1.5 py-0 shrink-0"
                                    >
                                      #{index + 1}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px] px-1.5 py-0"
                                    >
                                      {getQtyTypeLabel(item.qty_type)}
                                    </Badge>
                                    {item.included && (
                                      <span className="text-[10px] text-muted-foreground">
                                        Qty: {item.quantity}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {item.included && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-sm font-bold text-primary">
                                      ₹
                                      {roundToInteger(
                                        item.total_price || 0,
                                      ).toLocaleString()}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        removeProductFromRoom(room.id, item.id)
                                      }
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Item Details */}
                          {item.included && (
                            <div className="p-3 space-y-3">
                              {/* Responsive grid: stacks on mobile, side by side on lg */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Left: Config */}
                                <div className="space-y-3">
                                  {/* Measurement Unit */}
                                  {isDimensionBased && (
                                    <div className="bg-muted/20 rounded-lg p-3">
                                      <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5">
                                        <Ruler className="w-3 h-3" />
                                        Measurement Unit
                                      </Label>
                                      <RadioGroup
                                        value={item.measurement_unit || "feet"}
                                        onValueChange={(v) =>
                                          updateRoomItem(room.id, item.id, {
                                            measurement_unit: v,
                                          })
                                        }
                                        className="flex gap-4"
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <RadioGroupItem
                                            value="feet"
                                            id={`feet-${item.id}`}
                                          />
                                          <Label
                                            htmlFor={`feet-${item.id}`}
                                            className="text-xs cursor-pointer"
                                          >
                                            Feet
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <RadioGroupItem
                                            value="inches"
                                            id={`inches-${item.id}`}
                                          />
                                          <Label
                                            htmlFor={`inches-${item.id}`}
                                            className="text-xs cursor-pointer"
                                          >
                                            Inches
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                  )}

                                  {/* Dimensions */}
                                  {isDimensionBased && (
                                    <div className="bg-muted/20 rounded-lg p-3">
                                      <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5">
                                        <Calculator className="w-3 h-3" />
                                        Dimensions (
                                        {getUnitLabel(
                                          item.measurement_unit || "feet",
                                        )}
                                        )
                                      </Label>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <Label className="text-[9px] text-muted-foreground block mb-0.5">
                                            Height
                                          </Label>
                                          <Input
                                            type="number"
                                            value={item.height || 0}
                                            onChange={(e) =>
                                              updateRoomItem(room.id, item.id, {
                                                height: Math.max(
                                                  0,
                                                  Number(e.target.value) || 0,
                                                ),
                                              })
                                            }
                                            className="h-8 rounded-lg text-xs px-2"
                                            min="0"
                                            step="0.01"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-[9px] text-muted-foreground block mb-0.5">
                                            Width
                                          </Label>
                                          <Input
                                            type="number"
                                            value={item.width || 0}
                                            onChange={(e) =>
                                              updateRoomItem(room.id, item.id, {
                                                width: Math.max(
                                                  0,
                                                  Number(e.target.value) || 0,
                                                ),
                                              })
                                            }
                                            className="h-8 rounded-lg text-xs px-2"
                                            min="0"
                                            step="0.01"
                                          />
                                        </div>
                                        {item.qty_type === "ByHWD" && (
                                          <div>
                                            <Label className="text-[9px] text-muted-foreground block mb-0.5">
                                              Depth
                                            </Label>
                                            <Input
                                              type="number"
                                              value={item.depth || 0}
                                              onChange={(e) =>
                                                updateRoomItem(
                                                  room.id,
                                                  item.id,
                                                  {
                                                    depth: Math.max(
                                                      0,
                                                      Number(e.target.value) ||
                                                        0,
                                                    ),
                                                  },
                                                )
                                              }
                                              className="h-8 rounded-lg text-xs px-2"
                                              min="0"
                                              step="0.01"
                                            />
                                          </div>
                                        )}
                                        {item.qty_type === "ByHWL" && (
                                          <div>
                                            <Label className="text-[9px] text-muted-foreground block mb-0.5">
                                              Length
                                            </Label>
                                            <Input
                                              type="number"
                                              value={item.length || 0}
                                              onChange={(e) =>
                                                updateRoomItem(
                                                  room.id,
                                                  item.id,
                                                  {
                                                    length: Math.max(
                                                      0,
                                                      Number(e.target.value) ||
                                                        0,
                                                    ),
                                                  },
                                                )
                                              }
                                              className="h-8 rounded-lg text-xs px-2"
                                              min="0"
                                              step="0.01"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Quantity */}
                                  <div className="bg-muted/20 rounded-lg p-3">
                                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5">
                                      <Package className="w-3 h-3" />
                                      Quantity
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg shrink-0"
                                        disabled={item.quantity <= 1}
                                        onClick={() =>
                                          updateRoomItem(room.id, item.id, {
                                            quantity: Math.max(
                                              1,
                                              item.quantity - 1,
                                            ),
                                          })
                                        }
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="flex-1 text-center font-semibold text-sm">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg shrink-0"
                                        onClick={() =>
                                          updateRoomItem(room.id, item.id, {
                                            quantity: item.quantity + 1,
                                          })
                                        }
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Price */}
                                <div className="space-y-3">
                                  <div className="bg-muted/20 rounded-lg p-3">
                                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5">
                                      <span className="font-semibold">₹</span>
                                      Unit Price
                                    </Label>
                                    <Input
                                      type="number"
                                      value={item.unit_price || 0}
                                      onChange={(e) =>
                                        updateRoomItem(room.id, item.id, {
                                          unit_price: Math.max(
                                            0,
                                            Number(e.target.value) || 0,
                                          ),
                                        })
                                      }
                                      className="h-8 rounded-lg text-sm"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>

                                  {/* Calculation Summary */}
                                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 border border-primary/20">
                                    <div className="flex items-center gap-1 mb-2">
                                      <Calculator className="w-3 h-3 text-primary" />
                                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                                        Price Breakdown
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      {isDimensionBased ? (
                                        <>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                              Total Measure
                                            </span>
                                            <span className="font-mono font-medium">
                                              {roundToTwo(totalMeasure)} sq.ft
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                              Unit Price
                                            </span>
                                            <span className="font-mono font-medium">
                                              ₹
                                              {roundToTwo(item.unit_price || 0)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                              Quantity
                                            </span>
                                            <span className="font-mono font-medium">
                                              × {item.quantity}
                                            </span>
                                          </div>
                                          <div className="border-t border-primary/20 pt-1.5 mt-1">
                                            <div className="flex justify-between text-sm font-bold text-primary">
                                              <span>Final Amount</span>
                                              <span>
                                                ₹
                                                {roundToInteger(
                                                  item.total_price || 0,
                                                ).toLocaleString()}
                                              </span>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                              Unit Price
                                            </span>
                                            <span className="font-mono font-medium">
                                              ₹
                                              {roundToTwo(item.unit_price || 0)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                              Quantity
                                            </span>
                                            <span className="font-mono font-medium">
                                              × {item.quantity}
                                            </span>
                                          </div>
                                          <div className="border-t border-primary/20 pt-1.5 mt-1">
                                            <div className="flex justify-between text-sm font-bold text-primary">
                                              <span>Total</span>
                                              <span>
                                                ₹
                                                {roundToInteger(
                                                  item.total_price || 0,
                                                ).toLocaleString()}
                                              </span>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Raw Materials */}
                              {item.raw_materials &&
                                item.raw_materials.length > 0 && (
                                  <div className="bg-secondary/20 rounded-lg p-3 space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Raw Materials
                                      </p>
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] px-1.5 py-0"
                                      >
                                        {item.raw_materials.length}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {item.raw_materials.map(
                                        (rm: any, idx: number) => (
                                          <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="text-[10px] px-2 py-0.5 rounded-md"
                                          >
                                            {rm.rm_name || rm.name}
                                            {rm.rm_qty &&
                                              ` (${rm.rm_qty} ${rm.unit_name || ""})`}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Remark */}
                              <div>
                                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                                  <Info className="w-3 h-3" />
                                  Remark
                                </Label>
                                <Textarea
                                  value={item.remark || ""}
                                  onChange={(e) =>
                                    updateRoomItem(room.id, item.id, {
                                      remark: e.target.value,
                                    })
                                  }
                                  placeholder="Any specific requirement..."
                                  rows={2}
                                  className="rounded-lg text-sm resize-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Bottom Save Bar */}
      {filteredRooms.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3 md:p-4 -mx-4 md:mx-0 md:rounded-2xl md:border md:shadow-elevated">
          <div className="flex items-center justify-between gap-3 max-w-full">
            <div>
              <p className="text-xs text-muted-foreground">Grand Total</p>
              <p className="text-lg font-bold text-primary">
                ₹
                {filteredRooms
                  .reduce((acc, room) => acc + getRoomTotal(room), 0)
                  .toLocaleString()}
              </p>
            </div>
            <Button
              onClick={handleSave}
              className="gap-2 shrink-0"
              size="default"
            >
              Continue to Summary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
