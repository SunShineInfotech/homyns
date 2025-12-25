import { Card } from "@/components/ui/card";
import { Room } from "@/data/quotationData";
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
} from "lucide-react";

interface StepRoomSelectionProps {
  rooms: Room[];
  expandedRooms: string[];
  setExpandedRooms: (rooms: string[]) => void;
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
}: StepRoomSelectionProps) {
  const toggleRoom = (roomId: string) => {
    if (expandedRooms.includes(roomId)) {
      setExpandedRooms(expandedRooms.filter((id) => id !== roomId));
    } else {
      setExpandedRooms([...expandedRooms, roomId]);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
          Rooms Included
        </h2>
        <p className="text-muted-foreground">
          Review the rooms included in your selected package
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const Icon = roomIcons[room.icon] || Sofa;
          const isExpanded = expandedRooms.includes(room.id);
          const includedItems = room.items.filter((item) => item.included).length;
          const totalItems = room.items.length;

          return (
            <Card
              key={room.id}
              onClick={() => toggleRoom(room.id)}
              className={cn(
                "p-5 cursor-pointer transition-all duration-300",
                isExpanded
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border hover:border-muted-foreground/30 hover:shadow-soft"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      isExpanded ? "bg-primary/20" : "bg-secondary"
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
                      {includedItems}/{totalItems} items included
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isExpanded && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-90"
                    )}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  <ul className="space-y-2">
                    {room.items.slice(0, 4).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span
                          className={cn(
                            item.included
                              ? "text-foreground"
                              : "text-muted-foreground line-through"
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="text-muted-foreground">
                          ₹{item.price.toLocaleString()}
                        </span>
                      </li>
                    ))}
                    {room.items.length > 4 && (
                      <li className="text-sm text-primary font-medium">
                        +{room.items.length - 4} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
