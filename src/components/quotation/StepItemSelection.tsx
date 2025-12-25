import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Room, RoomItem } from "@/data/quotationData";
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
} from "lucide-react";

interface StepItemSelectionProps {
  rooms: Room[];
  expandedRooms: string[];
  setExpandedRooms: (rooms: string[]) => void;
  updateRoomItem: (
    roomId: string,
    itemId: string,
    updates: Partial<{ quantity: number; included: boolean; price: number }>
  ) => void;
}

const roomIcons: Record<string, React.ElementType> = {
  sofa: Sofa,
  bed: Bed,
  chefHat: ChefHat,
  doorOpen: DoorOpen,
  baby: Baby,
  briefcase: Briefcase,
};

export function StepItemSelection({
  rooms,
  expandedRooms,
  setExpandedRooms,
  updateRoomItem,
}: StepItemSelectionProps) {
  const toggleRoom = (roomId: string) => {
    if (expandedRooms.includes(roomId)) {
      setExpandedRooms(expandedRooms.filter((id) => id !== roomId));
    } else {
      setExpandedRooms([...expandedRooms, roomId]);
    }
  };

  const getRoomTotal = (room: Room) =>
    room.items
      .filter((item) => item.included)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
          Customize Items
        </h2>
        <p className="text-muted-foreground">
          Select and customize items for each room
        </p>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const Icon = roomIcons[room.icon] || Sofa;
          const isExpanded = expandedRooms.includes(room.id);
          const roomTotal = getRoomTotal(room);

          return (
            <Card
              key={room.id}
              className="overflow-hidden border-border bg-card shadow-soft"
            >
              {/* Room Header */}
              <div
                onClick={() => toggleRoom(room.id)}
                className={cn(
                  "flex items-center justify-between p-5 cursor-pointer transition-colors",
                  isExpanded && "bg-secondary/50 border-b border-border"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isExpanded ? "bg-primary/10" : "bg-secondary"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6",
                        isExpanded ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {room.items.filter((i) => i.included).length} items selected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Room Total</p>
                    <p className="text-lg font-semibold text-foreground">
                      ₹{roomTotal.toLocaleString()}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </div>

              {/* Items Table */}
              {isExpanded && (
                <div className="p-5 animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 w-8">
                            
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">
                            Item
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">
                            Size
                          </th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">
                            Unit Price
                          </th>
                          <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">
                            Qty
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {room.items.map((item) => (
                          <tr
                            key={item.id}
                            className={cn(
                              "transition-colors",
                              !item.included && "opacity-50"
                            )}
                          >
                            <td className="py-4">
                              <Checkbox
                                checked={item.included}
                                onCheckedChange={(checked) =>
                                  updateRoomItem(room.id, item.id, {
                                    included: checked as boolean,
                                  })
                                }
                              />
                            </td>
                            <td className="py-4">
                              <div>
                                <p className="font-medium text-foreground">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {item.size} {item.unit}
                            </td>
                            <td className="py-4">
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updateRoomItem(room.id, item.id, {
                                    price: Number(e.target.value),
                                  })
                                }
                                className="w-28 h-9 text-sm bg-secondary border-0"
                                disabled={!item.included}
                              />
                            </td>
                            <td className="py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={!item.included || item.quantity <= 1}
                                  onClick={() =>
                                    updateRoomItem(room.id, item.id, {
                                      quantity: item.quantity - 1,
                                    })
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-medium text-foreground">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={!item.included}
                                  onClick={() =>
                                    updateRoomItem(room.id, item.id, {
                                      quantity: item.quantity + 1,
                                    })
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-4 text-right font-medium text-foreground">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
