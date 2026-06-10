import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Room } from "@/data/quotationData";
import { cn } from "@/lib/utils";
import {
  Sofa, Bed, ChefHat, DoorOpen, Baby, Briefcase,
  ChevronDown, Minus, Plus, Layers,
} from "lucide-react";

interface StepItemSelectionProps {
  rooms: Room[];
  expandedRooms: string[];
  setExpandedRooms: (rooms: string[]) => void;
  updateRoomItem: (
    roomId: string,
    itemId: string,
    updates: Partial<{ quantity: number; included: boolean; price: number; remark: string }>
  ) => void;
}

const roomIcons: Record<string, React.ElementType> = {
  sofa: Sofa, bed: Bed, chefHat: ChefHat, doorOpen: DoorOpen, baby: Baby, briefcase: Briefcase,
};

// Mock raw materials per item (display only)
const mockRawByItem: Record<string, { name: string; brand: string }[]> = {
  default: [
    { name: "CenturyPly 18mm", brand: "CenturyPly" },
    { name: "Laminate Sheet", brand: "Merino" },
    { name: "Soft Close Hinges", brand: "Hettich" },
  ],
};

export function StepItemSelection({ rooms, expandedRooms, setExpandedRooms, updateRoomItem }: StepItemSelectionProps) {
  const toggleRoom = (roomId: string) => {
    if (expandedRooms.includes(roomId)) setExpandedRooms(expandedRooms.filter((id) => id !== roomId));
    else setExpandedRooms([...expandedRooms, roomId]);
  };

  const getRoomTotal = (room: Room) =>
    room.items.filter((i) => i.included).reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div>
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Customize Items</h2>
        <p className="text-muted-foreground text-sm">Select items, set quantities, add remarks and review raw materials</p>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const Icon = roomIcons[room.icon] || Sofa;
          const isExpanded = expandedRooms.includes(room.id);
          const roomTotal = getRoomTotal(room);

          return (
            <Card key={room.id} className="overflow-hidden border-border bg-card shadow-soft rounded-2xl">
              <div onClick={() => toggleRoom(room.id)} className={cn("flex items-center justify-between p-4 md:p-5 cursor-pointer transition-colors", isExpanded && "bg-secondary/50 border-b border-border")}>
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0", isExpanded ? "bg-primary/10" : "bg-secondary")}>
                    <Icon className={cn("w-5 h-5 md:w-6 md:h-6", isExpanded ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{room.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{room.items.filter((i) => i.included).length} items selected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">Total</p>
                    <p className="text-base md:text-lg font-semibold text-foreground">₹{roomTotal.toLocaleString()}</p>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 md:p-5 space-y-3 animate-fade-in">
                  {room.items.map((item) => {
                    const raws = mockRawByItem[item.id] || mockRawByItem.default;
                    return (
                      <div key={item.id} className={cn("rounded-xl border border-border p-3 md:p-4 space-y-3", !item.included && "opacity-60")}>
                        {/* Top row */}
                        <div className="flex items-start gap-3">
                          <Checkbox checked={item.included} onCheckedChange={(c) => updateRoomItem(room.id, item.id, { included: c as boolean })} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <div>
                                <p className="font-semibold text-foreground">{item.name}</p>
                                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                <p className="text-[11px] text-muted-foreground mt-0.5">{item.size} {item.unit}</p>
                              </div>
                              <p className="font-semibold text-foreground text-right">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {item.included && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[11px] text-muted-foreground">Unit Price</label>
                                <Input type="number" value={item.price} onChange={(e) => updateRoomItem(room.id, item.id, { price: Number(e.target.value) })} className="h-9 rounded-lg text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-[11px] text-muted-foreground">Quantity</label>
                                <div className="flex items-center gap-1 mt-1">
                                  <Button variant="outline" size="icon" className="h-9 w-9" disabled={item.quantity <= 1} onClick={() => updateRoomItem(room.id, item.id, { quantity: item.quantity - 1 })}><Minus className="w-3 h-3" /></Button>
                                  <span className="flex-1 text-center font-medium text-sm">{item.quantity}</span>
                                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateRoomItem(room.id, item.id, { quantity: item.quantity + 1 })}><Plus className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[11px] text-muted-foreground">Requirement Remark</label>
                              <Textarea
                                value={(item as any).remark ?? ""}
                                onChange={(e) => updateRoomItem(room.id, item.id, { remark: e.target.value } as any)}
                                placeholder="Any specific requirement for this item…"
                                rows={2}
                                className="rounded-lg text-sm mt-1"
                              />
                            </div>

                            <div className="rounded-lg bg-secondary/50 p-2.5">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Raw Materials</p>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {raws.map((r, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px]">
                                    {r.name} <span className="text-muted-foreground">· {r.brand}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
