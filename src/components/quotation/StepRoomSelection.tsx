// src/components/quotation/StepRoomSelection.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotationRoom } from "@/pages/CreateQuotation";
import { cn } from "@/lib/utils";
import {
  Sofa,
  Bed,
  ChefHat,
  DoorOpen,
  Baby,
  Briefcase,
  Check,
  ChevronRight,
  Loader2,
  SkipForward,
  Home,
} from "lucide-react";

interface StepRoomSelectionProps {
  rooms: QuotationRoom[];
  expandedRooms: string[];
  setExpandedRooms: (rooms: string[]) => void;
  loading?: boolean;
  onSkip?: () => void;
}

const roomIcons: Record<string, React.ElementType> = {
  sofa: Sofa,
  bed: Bed,
  chefHat: ChefHat,
  doorOpen: DoorOpen,
  baby: Baby,
  briefcase: Briefcase,
};

export function StepRoomSelection({
  rooms,
  expandedRooms,
  setExpandedRooms,
  loading = false,
  onSkip,
}: StepRoomSelectionProps) {
  const toggleRoom = (roomId: string) => {
    if (expandedRooms.includes(roomId)) {
      setExpandedRooms(expandedRooms.filter((id) => id !== roomId));
    } else {
      setExpandedRooms([...expandedRooms, roomId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Home className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Rooms Available</h3>
        <p className="text-muted-foreground mb-4">No rooms have been created yet. You can skip this step and add items directly.</p>
        {onSkip && <Button onClick={onSkip} className="gap-2"><SkipForward className="w-4 h-4" /> Skip to Items</Button>}
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Rooms Included</h2>
        <p className="text-muted-foreground">Review the rooms included in your selected package</p>
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="mt-2 gap-1">
            <SkipForward className="w-3 h-3" /> Skip this step
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const Icon = roomIcons[room.icon] || Sofa;
          const isExpanded = expandedRooms.includes(room.id);
          const roomTotal = room.room_total || 0;

          return (
            <Card
              key={room.id}
              className={cn(
                "p-5 transition-all duration-300",
                isExpanded ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-muted-foreground/30 hover:shadow-soft"
              )}
            >
              <div className="cursor-pointer" onClick={() => toggleRoom(room.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", isExpanded ? "bg-primary/20" : "bg-secondary")}>
                      <Icon className={cn("w-6 h-6", isExpanded ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{room.room_name}</h3>
                      <p className="text-sm text-muted-foreground">₹{roomTotal.toLocaleString()} total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <ChevronRight className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-90")} />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Status</span>
                      <span className="text-foreground font-medium">{room.items.filter(i => i.included).length} items selected</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Room Total</span>
                      <span className="text-foreground font-semibold">₹{roomTotal.toLocaleString()}</span>
                    </div>
                    {room.items.filter(i => i.included).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Selected Items:</p>
                        <div className="space-y-1">
                          {room.items.filter(i => i.included).slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{item.product_name}</span>
                              <span className="text-muted-foreground">×{item.qty}</span>
                            </div>
                          ))}
                          {room.items.filter(i => i.included).length > 3 && (
                            <p className="text-xs text-muted-foreground">+{room.items.filter(i => i.included).length - 3} more items</p>
                          )}
                        </div>
                      </div>
                    )}
                    {room.items.filter(i => i.included).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">No items selected yet</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}