// src/pages/quotation/StepRooms.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sofa, Bed, ChefHat, DoorOpen, Baby, Briefcase,
  Check, ChevronRight, Loader2, SkipForward, Home,
  Package, Plus, ChevronLeft
} from "lucide-react";
import { quotationFilterService, QuotationRoom } from "@/services/quotation_filter.service";
import { toast } from "@/hooks/use-toast";
import { getQuotationData, saveQuotationData } from "../CreateQuotation";

const roomIcons: Record<string, React.ElementType> = {
  sofa: Sofa,
  bed: Bed,
  chefHat: ChefHat,
  doorOpen: DoorOpen,
  baby: Baby,
  briefcase: Briefcase,
};

// Map room names to icons
const getIconForRoom = (roomName: string): React.ElementType => {
  const name = roomName.toLowerCase();
  if (name.includes('living') || name.includes('hall')) return Sofa;
  if (name.includes('bed') || name.includes('master')) return Bed;
  if (name.includes('kitchen')) return ChefHat;
  if (name.includes('dining')) return DoorOpen;
  if (name.includes('kid') || name.includes('child') || name.includes('baby')) return Baby;
  if (name.includes('study') || name.includes('office')) return Briefcase;
  return DoorOpen;
};

export default function StepRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Get saved quotation data to get selected package
      const saved = getQuotationData();
      if (saved?.resumeCart && Array.isArray(saved.rooms) && saved.rooms.length > 0) {
        setRooms(saved.rooms);
        setExpandedRooms(saved.expandedRooms || [saved.rooms[0].id]);
        setLoading(false);
        return;
      }
      const selectedPackage = saved?.selectedPackage;

      if (!selectedPackage || !selectedPackage.package_id) {
        toast({ title: "Info", description: "Please select a package first" });
        navigate("/create-quotation/package");
        setLoading(false);
        return;
      }

      // Fetch full quotation data using the new service
      const res = await quotationFilterService.getFullQuotationData(
        companyId,
        selectedPackage.package_id
      );

      if (res.status === "success" && res.data) {
        const quotationData = res.data;
        const packageRooms = quotationData.rooms || [];

        // Transform rooms to the format expected by the component
        const roomList = packageRooms.map((room: QuotationRoom) => {
          const products = room.products || [];
          
          // Map products with proper structure
          const mappedProducts = products.map((product: any) => ({
            id: product.rp_id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            product_id: product.product_id,
            name: product.product_name || 'Unknown Product',
            default_qty: product.default_qty || 1,
            quantity: product.default_qty || 1,
            price: product.price || 0,
            total_price: 0,
            included: true,
            category_name: product.category_name || '',
            sort_order: product.sort_order || 0,
            qty_type: product.qty_type || 'Fixed',
            height: product.height || 0,
            width: product.width || 0,
            depth: product.depth || 0,
            length: product.length || 0,
          }));

          return {
            id: room.room_id,
            room_id: room.room_id,
            name: room.room_name,
            icon: 'doorOpen',
            description: room.description || '',
            image: room.image || '',
            room_products: products,
            items: mappedProducts,
            selected: true, // All rooms from package are selected
            room_total: mappedProducts
              .filter((i: any) => i.included)
              .reduce((sum: number, i: any) => sum + (i.price || 0), 0),
          };
        });

        setRooms(roomList);
        if (roomList.length > 0) {
          setExpandedRooms([roomList[0].id]);
        }

        // Save the rooms data
        saveQuotationData({ rooms: roomList, expandedRooms: [] });
      } else {
        toast({ 
          title: "Error", 
          description: res.message || "Failed to load rooms", 
          variant: "destructive" 
        });
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
      toast({ 
        title: "Error", 
        description: e?.response?.data?.message || "Something went wrong", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSkip = () => {
    saveQuotationData({ rooms: [], expandedRooms: [] });
    navigate("/create-quotation/items");
    toast({ title: "Skipped", description: "Rooms selection skipped" });
  };

  const handleNext = () => {
    if (rooms.length === 0) {
      toast({ title: "Please select at least one room", variant: "destructive" });
      return;
    }
    navigate("/create-quotation/items");
  };

  // Save rooms to quotation data when they change
  useEffect(() => {
    if (rooms.length > 0) {
      saveQuotationData({ rooms, expandedRooms });
    }
  }, [rooms, expandedRooms]);

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
        <p className="text-muted-foreground mb-4">This package has no rooms assigned.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={() => navigate("/create-quotation/package")} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Go Back to Packages
          </Button>
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip to Items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Rooms Included</h2>
        <p className="text-muted-foreground">Review the rooms and their products</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const Icon = roomIcons[room.icon as keyof typeof roomIcons] || getIconForRoom(room.name) || DoorOpen;
          const isExpanded = expandedRooms.includes(room.id);
          const productCount = room.items?.length || 0;

          return (
            <Card
              key={room.id}
              className={cn(
                "p-5 transition-all duration-300",
                isExpanded
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border hover:border-muted-foreground/30 hover:shadow-soft"
              )}
            >
              <div
                className="cursor-pointer"
                onClick={() => toggleRoom(room.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isExpanded ? "bg-primary/20" : "bg-secondary"
                      )}
                    >
                      <Icon className={cn("w-6 h-6", isExpanded ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{room.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {productCount} product{productCount !== 1 ? 's' : ''}
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
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  {productCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No products in this room</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {room.items.map((product: any, index: number) => (
                        <div
                          key={product.id || index}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {product.name}
                            </p>
                            {product.category_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {product.category_name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Price: ₹{parseFloat(product.price || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-muted-foreground">Qty:</span>
                            <span className="text-sm font-semibold text-foreground">
                              {parseFloat(product.default_qty || 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {productCount} product{productCount !== 1 ? 's' : ''} will be available for selection
                    </p>
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
