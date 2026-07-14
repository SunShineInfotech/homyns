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
  ChevronRight,
  Layers,
  Info,
  Calculator,
  X,
  PlusCircle,
  Eye,
  EyeOff,
  Home,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { productService, Product } from "@/services/product.service";
import {
  productCategoryService,
  ProductCategory,
} from "@/services/product-category.service";
import { unitService, Unit } from "@/services/unit.service";
import { toast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getQuotationData, saveQuotationData } from "../CreateQuotation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const roomIcons: Record<string, React.ElementType> = {
  sofa: Sofa,
  bed: Bed,
  chefHat: ChefHat,
  doorOpen: DoorOpen,
  baby: Baby,
  briefcase: Briefcase,
};

const ADD_NEW_PRODUCT_VALUE = "__add_new_product__";

const QTY_TYPES = [
  { value: "Fixed", label: "Fixed" },
  { value: "ByHW", label: "By Height × Width" },
  { value: "ByHWD", label: "By Height × Width × Depth" },
  { value: "ByHWL", label: "By Height × Width × Length" },
];

const EMPTY_QUICK_ADD = {
  product_name: "",
  category_id: "",
  qty_type: "Fixed",
  height: 0,
  width: 0,
  depth: 0,
  length: 0,
  dimension_unit_id: "",
  price: 0,
  gst_percent: 0,
  description: "",
};

const roundToTwo = (num: number): number => Math.round(num * 100) / 100;
const roundToInteger = (num: number): number => Math.round(num);

export default function StepItems() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Add Room Dialog
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);

  // Quick Add Product Dialog
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [quickAddRoomId, setQuickAddRoomId] = useState<string>("");
  const [quickAddData, setQuickAddData] = useState<any>({ ...EMPTY_QUICK_ADD });
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddError, setQuickAddError] = useState("");

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
        setLoading(false);
        return;
      }

      let formattedProducts: Product[] = [];

      const [prodRes, catRes, unitRes] = await Promise.all([
        productService.getProducts(companyId),
        productCategoryService.getCategories(companyId),
        unitService.getUnits(companyId),
      ]);

      if (prodRes.status === "success" && prodRes.data) {
        formattedProducts = prodRes.data.map((p: any) => ({
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

      if (catRes.status === "success" && catRes.data) {
        setCategories(catRes.data);
      }

      if (unitRes.status === "success" && unitRes.data) {
        setUnits(unitRes.data);
      }

      const saved = getQuotationData();

      // Get all rooms from saved data
      const allSavedRooms = saved?.rooms || [];
      setAllRooms(allSavedRooms);

      // Get selected room IDs from StepRooms (rooms that were selected in StepRooms)
      const selectedRoomIdsFromSave = allSavedRooms
        .filter((room: any) => room.selected === true)
        .map((room: any) => room.id);

      // If no rooms were selected in StepRooms, use the first room as default
      const roomIds = selectedRoomIdsFromSave.length > 0
        ? selectedRoomIdsFromSave
        : allSavedRooms.length > 0 
          ? [allSavedRooms[0].id] 
          : [];

      setSelectedRoomIds(roomIds);

      if (allSavedRooms.length > 0) {
        // Process ALL rooms - show all rooms from the package
        const processedRooms = allSavedRooms.map((room: any) => {
          const isSelected = roomIds.includes(room.id);
          
          // Update items with fresh product data
          const updatedItems = room.items.map((item: any) => {
            const freshProduct = formattedProducts.find(
              (p: any) => p.product_id === item.product_id,
            );

            const merged = {
              ...item,
              name: freshProduct?.product_name || item.name || 'Unknown',
              unit_price: item.unit_price ?? freshProduct?.price ?? 0,
              qty_type: item.qty_type || freshProduct?.qty_type || "Fixed",
              height: item.height ?? freshProduct?.height ?? 0,
              width: item.width ?? freshProduct?.width ?? 0,
              depth: item.depth ?? freshProduct?.depth ?? 0,
              length: item.length ?? freshProduct?.length ?? 0,
              raw_materials: freshProduct?.product_details || item.raw_materials || [],
              measurement_unit: item.measurement_unit || "inches",
              quantity: item.quantity || item.default_qty || 1,
              // IMPORTANT: Only checked if room is selected
              included: isSelected ? true : false,
            };
            merged.total_price = calculateItemTotalStatic(merged);
            return merged;
          });

          const roomTotal = updatedItems
            .filter((i: any) => i.included !== false)
            .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);

          return {
            ...room,
            items: updatedItems,
            room_total: roundToTwo(roomTotal),
            selected: isSelected,
          };
        });

        setRooms(processedRooms);
        
        // Expand the first selected room, or first room if none selected
        const firstSelected = processedRooms.find((r: any) => r.selected);
        setExpandedRooms(saved.expandedRooms || (firstSelected ? [firstSelected.id] : processedRooms.length > 0 ? [processedRooms[0].id] : []));
      }
    } catch (error) {
      console.error('Fetch data error:', error);
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
  useEffect(() => {
    if (!loading && rooms.length > 0) {
      const timeoutId = setTimeout(() => {
        const updatedAllRooms = rooms.map(room => ({
          ...room,
          selected: room.selected || false,
        }));
        saveQuotationData({
          rooms: updatedAllRooms,
          expandedRooms
        });
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

  // Toggle room selection (add/remove room from quotation)
  const toggleRoomSelection = (roomId: string) => {
    setRooms(prev => 
      prev.map(room => {
        if (room.id === roomId) {
          const newSelected = !room.selected;
          
          // Update all items in the room - if selected, check all products; if deselected, uncheck all
          const updatedItems = room.items.map((item: any) => ({
            ...item,
            included: newSelected ? true : false,
          }));
          
          const roomTotal = updatedItems
            .filter((i: any) => i.included)
            .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);

          return {
            ...room,
            selected: newSelected,
            items: updatedItems,
            room_total: roundToTwo(roomTotal),
          };
        }
        return room;
      })
    );

    // Update selectedRoomIds state
    setSelectedRoomIds(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const convertUnit = (value: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return value;
    if (fromUnit === "inches" && toUnit === "feet") return value / 12;
    if (fromUnit === "feet" && toUnit === "inches") return value * 12;
    return value;
  };

  const calculateTotalMeasureStatic = (item: any): number => {
    const qty = item.quantity || 1;

    if (item.qty_type === "Fixed") return qty;

    const unit = item.measurement_unit || "inches";

    let h = item.height || 0;
    let w = item.width || 0;
    let d = item.depth || 0;
    let l = item.length || 0;

    const hFt = convertUnit(h, unit, "feet");
    const wFt = convertUnit(w, unit, "feet");
    const dFt = convertUnit(d, unit, "feet");
    const lFt = convertUnit(l, unit, "feet");

    let measure = 0;
    if (item.qty_type === "ByHW") {
      measure = wFt * hFt * qty;
    } else if (item.qty_type === "ByHWD") {
      measure = wFt * hFt * dFt * qty;
    } else if (item.qty_type === "ByHWL") {
      measure = wFt * hFt * lFt * qty;
    } else {
      measure = qty;
    }

    return roundToTwo(measure);
  };

  const calculateItemTotalStatic = (item: any): number => {
    const totalMeasure = calculateTotalMeasureStatic(item);
    const unitPrice = item.unit_price || 0;
    return roundToTwo(totalMeasure * unitPrice);
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
          .filter((i: any) => i.included !== false)
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
      measurement_unit: "inches",
      unit_price,
      total_price: 0,
      included: true,
      remark: "",
      raw_materials: product.product_details || [],
    };

    newItem.total_price = calculateItemTotalStatic(newItem);

    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        // Make sure the room is marked selected (so its UI/section is unlocked)
        const isAlreadySelected = room.selected;
        const updatedItems = [...room.items, newItem];
        const roomTotal = updatedItems
          .filter((i: any) => i.included)
          .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);
        return {
          ...room,
          selected: true,
          items: updatedItems,
          room_total: roundToTwo(roomTotal),
        };
      }),
    );

    setSelectedRoomIds((prev) => (prev.includes(roomId) ? prev : [...prev, roomId]));
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

  // Options for the room's product dropdown, always prefixed with "+ Add New Product"
  const getProductDropdownOptions = (roomId: string) => [
    { value: ADD_NEW_PRODUCT_VALUE, label: "+ Add New Product" },
    ...getAvailableProducts(roomId).map((p) => ({
      value: p.product_id || "",
      label: `${p.product_name} (${p.category_name || "No Category"})`,
    })),
  ];

  const handleProductDropdownChange = (roomId: string, value: string) => {
    if (value === ADD_NEW_PRODUCT_VALUE) {
      openQuickAddDialog(roomId);
      return;
    }
    setSelectedProductId((prev) => ({ ...prev, [roomId]: value }));
    const product = products.find((p) => p.product_id === value);
    if (product) addProductToRoom(roomId, product);
  };

  // ── Quick Add Product ──────────────────────────────────────────────────
  const openQuickAddDialog = (roomId: string) => {
    setQuickAddRoomId(roomId);
    setQuickAddData({ ...EMPTY_QUICK_ADD });
    setQuickAddError("");
    setQuickAddDialogOpen(true);
  };

  const closeQuickAddDialog = () => {
    if (quickAddSaving) return;
    setQuickAddDialogOpen(false);
    setQuickAddRoomId("");
    setQuickAddData({ ...EMPTY_QUICK_ADD });
    setQuickAddError("");
  };

  const categoryOptions = categories.map((c) => ({
    value: c.category_id || "",
    label: c.category_name,
  }));
  const unitOptions = units.map((u) => ({
    value: u.unit_id || "",
    label: u.unit_name,
  }));

  const quickAddShowDimensions = quickAddData.qty_type !== "Fixed";
  const quickAddShowDepth = quickAddData.qty_type === "ByHWD";
  const quickAddShowLength = quickAddData.qty_type === "ByHWL";

  const handleQuickAddProduct = async () => {
    if (!quickAddData.product_name?.trim()) {
      setQuickAddError("Product name is required.");
      return;
    }
    if (!quickAddData.category_id) {
      setQuickAddError("Please select a category.");
      return;
    }
    if (!quickAddData.price || quickAddData.price <= 0) {
      setQuickAddError("Price must be greater than 0.");
      return;
    }

    const companyId = getCompanyId();
    if (!companyId) {
      setQuickAddError("Company not found.");
      return;
    }

    setQuickAddError("");
    setQuickAddSaving(true);

    try {
      const fd = new FormData();
      fd.append("type", "1"); // add
      fd.append("company_id", companyId);
      fd.append("product_name", quickAddData.product_name.trim());
      fd.append("category_id", quickAddData.category_id);
      fd.append("qty_type", quickAddData.qty_type || "Fixed");
      fd.append("height", String(quickAddData.height || 0));
      fd.append("width", String(quickAddData.width || 0));
      fd.append("depth", String(quickAddData.depth || 0));
      fd.append("length", String(quickAddData.length || 0));
      fd.append("dimension_unit_id", quickAddData.dimension_unit_id || "");
      fd.append("price", String(quickAddData.price || 0));
      fd.append("gst_percent", String(quickAddData.gst_percent || 0));
      fd.append("description", quickAddData.description?.trim() || "");
      fd.append("status", "Active");
      fd.append("product_details", JSON.stringify([]));

      const res = await productService.addProduct(fd);

      if (res.status === "success") {
        // Refresh master product list so the new product (and its category name) is available everywhere
        const refreshed = await productService.getProducts(companyId);
        let newProduct: Product | undefined;

        if (refreshed.status === "success" && refreshed.data) {
          const formatted: Product[] = refreshed.data.map((p: any) => ({
            ...p,
            price: parseFloat(p.price) || 0,
            height: parseFloat(p.height) || 0,
            width: parseFloat(p.width) || 0,
            depth: parseFloat(p.depth) || 0,
            length: parseFloat(p.length) || 0,
            qty_type: p.qty_type || "Fixed",
            product_details: p.product_details || [],
          }));
          setProducts(formatted);

          // Prefer an explicit id returned by the API, else fall back to matching by name
          const returnedId = (res as any)?.product_id || (res as any)?.data?.product_id;
          if (returnedId) {
            newProduct = formatted.find(
              (p) => String(p.product_id) === String(returnedId),
            );
          }
          if (!newProduct) {
            const matches = formatted.filter(
              (p) => p.product_name === quickAddData.product_name.trim(),
            );
            newProduct = matches.sort(
              (a, b) => Number(b.product_id) - Number(a.product_id),
            )[0];
          }
        }

        toast({
          title: "Success",
          description: "Product created successfully",
        });

        if (newProduct && quickAddRoomId) {
          addProductToRoom(quickAddRoomId, newProduct);
        }

        closeQuickAddDialog();
      } else {
        setQuickAddError(res.message || "Failed to create product");
      }
    } catch (e: any) {
      setQuickAddError(
        e?.response?.data?.message || "Something went wrong while creating the product",
      );
    } finally {
      setQuickAddSaving(false);
    }
  };

  const handleNext = () => {
    const latestRooms = rooms;

    saveQuotationData({
      rooms: latestRooms,
      expandedRooms,
    });

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

  // Get rooms that are available to add (not already selected)
  const getAvailableRoomsToAdd = () => {
    return rooms.filter(room => !room.selected);
  };

  const handleAddRoom = (roomId: string) => {
    setRooms(prev => 
      prev.map(room => {
        if (room.id === roomId) {
          // When adding a room, select it and check all products
          const updatedItems = room.items.map((item: any) => ({
            ...item,
            included: true,
          }));
          
          const roomTotal = updatedItems
            .filter((i: any) => i.included)
            .reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);

          return {
            ...room,
            selected: true,
            items: updatedItems,
            room_total: roundToTwo(roomTotal),
          };
        }
        return room;
      })
    );

    setSelectedRoomIds(prev => [...prev, roomId]);
    setAddRoomDialogOpen(false);
    
    toast({
      title: "Room Added",
      description: "Room has been added to your quotation with all products selected.",
    });
  };

  const getRoomIcon = (room: any) => {
    const Icon = roomIcons[room.icon as keyof typeof roomIcons] || Sofa;
    return Icon;
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
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Home className="w-10 h-10 text-muted-foreground/40" />
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

  const availableRoomsToAdd = getAvailableRoomsToAdd();
  
  // Calculate grand total - only from selected rooms
  const grandTotal = rooms.reduce((acc, room) => {
    if (room.selected) {
      return acc + getRoomTotal(room);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Add Room Button - show if there are rooms available to add */}
      {availableRoomsToAdd.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="gap-2 rounded-xl text-sm md:text-base"
            onClick={() => setAddRoomDialogOpen(true)}
          >
            <PlusCircle className="w-4 h-4" />
            Add Room
          </Button>
        </div>
      )}

      {rooms.map((room) => {
        const Icon = getRoomIcon(room);
        const isExpanded = expandedRooms.includes(room.id);
        const roomTotal = getRoomTotal(room);
        const includedCount =
          room.items?.filter((i: any) => i.included).length || 0;
        const totalItems = room.items?.length || 0;
        const isSelected = room.selected ?? false;

        return (
          <Card
            key={room.id}
            className={cn(
              "overflow-hidden border-border bg-card shadow-soft rounded-2xl transition-all duration-300",
              isSelected ? "border-primary/40 shadow-md" : "border-muted-foreground/20 opacity-90"
            )}
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
                    !isSelected && "opacity-60"
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                      {room.name}
                    </h3>
                    {!isSelected && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        Not Added
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge variant="default" className="text-[10px] shrink-0 bg-primary">
                        Added
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {includedCount}/{totalItems} items selected • ₹
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
                {/* Room Actions - Select/Deselect */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-secondary/30 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="gap-2 rounded-lg text-xs md:text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRoomSelection(room.id);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add Room
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isSelected ? (
                      <span>All products are checked</span>
                    ) : (
                      <span>Products are unchecked</span>
                    )}
                  </div>
                </div>

                {/* Products Section - Always show products but with checkboxes reflecting selection state */}
                <>
                  {/* Add Product - Always available so a room can be created via product add too */}
                  <div className="p-3 md:p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Add Product to {room.name}
                    </p>
                    <SearchableSelect
                      options={getProductDropdownOptions(room.id)}
                      value={selectedProductId[room.id] || ""}
                      onChange={(v) => handleProductDropdownChange(room.id, v)}
                      placeholder="Search existing product or add a new one..."
                    />
                  </div>

                  {/* Items */}
                  {!room.items || room.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <Package className="w-7 h-7 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No items in this room
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Search and select a product above, or add a new one
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {room.items.map((item: any, index: number) => {
                        const isDimensionBased = item.qty_type !== "Fixed";
                        const totalMeasure = calculateTotalMeasure(item);
                        const unit = item.measurement_unit || "inches";
                        const unitLabel = getUnitLabel(unit);

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "rounded-xl border transition-all duration-200",
                              item.included
                                ? "border-border bg-card"
                                : "border-dashed border-muted-foreground/30 bg-muted/10 opacity-70",
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
                                onCheckedChange={(c) => {
                                  if (!isSelected) {
                                    // If room is not selected, selecting a product should select the room
                                    toggleRoomSelection(room.id);
                                  }
                                  updateRoomItem(room.id, item.id, {
                                    included: c as boolean,
                                  });
                                }}
                                className="mt-0.5 shrink-0"
                                disabled={!isSelected}
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
                                      {isDimensionBased && (
                                        <span className="text-[10px] text-muted-foreground">
                                          Unit: {unitLabel}
                                        </span>
                                      )}
                                      {!isSelected && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                                          Locked
                                        </Badge>
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
                                      {isSelected && (
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
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Item Details - Only show if included */}
                            {item.included && isSelected && (
                              <div className="p-3 space-y-3">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  {/* Left: Config */}
                                  <div className="space-y-3">
                                    {isDimensionBased && (
                                      <div className="bg-muted/20 rounded-lg p-3">
                                        <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5">
                                          <Ruler className="w-3 h-3" />
                                          Measurement Unit
                                        </Label>
                                        <RadioGroup
                                          value={item.measurement_unit || "inches"}
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

                                    {isDimensionBased && (
                                      <div className="bg-muted/20 rounded-lg p-3">
                                        <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5">
                                          <Calculator className="w-3 h-3" />
                                          Dimensions ({unitLabel})
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
                                                    }
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
                                                    }
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
                                                ₹{roundToTwo(item.unit_price || 0)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                              <span className="text-muted-foreground">
                                                Formula
                                              </span>
                                              <span className="font-mono font-medium text-[10px]">
                                                {item.qty_type === "ByHW" && "W × H × Qty"}
                                                {item.qty_type === "ByHWD" && "W × H × D × Qty"}
                                                {item.qty_type === "ByHWL" && "W × H × L × Qty"}
                                              </span>
                                            </div>
                                            <div className="border-t border-primary/20 pt-1.5 mt-1">
                                              <div className="flex justify-between text-sm font-bold text-primary">
                                                <span>Final Amount</span>
                                                <span>
                                                  ₹{roundToInteger(
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
                                                ₹{roundToTwo(item.unit_price || 0)}
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
                                                  ₹{roundToInteger(
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
                </>
              </div>
            )}
          </Card>
        );
      })}

      {/* Bottom Save Bar */}
      {rooms.some(r => r.selected) && (
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3 md:p-4 -mx-4 md:mx-0 md:rounded-2xl md:border md:shadow-elevated">
          <div className="flex items-center justify-between gap-3 max-w-full">
            <div>
              <p className="text-xs text-muted-foreground">Grand Total</p>
              <p className="text-lg font-bold text-primary">
                ₹{grandTotal.toLocaleString()}
              </p>
            </div>
            <Button
              onClick={handleNext}
              className="gap-2 shrink-0"
              size="default"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Room Dialog */}
      <Dialog open={addRoomDialogOpen} onOpenChange={setAddRoomDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Select a room to add to your quotation. All products will be automatically selected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {availableRoomsToAdd.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">
                All rooms have been added already.
              </p>
            ) : (
              <div className="space-y-2">
                {availableRoomsToAdd.map((room) => {
                  const Icon = getRoomIcon(room);
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleAddRoom(room.id)}
                      className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {room.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {room.items?.length || 0} products available
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-primary shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddRoomDialogOpen(false)}
              className="rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Product Dialog */}
      <Dialog open={quickAddDialogOpen} onOpenChange={(open) => !open && closeQuickAddDialog()}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Add New Product
            </DialogTitle>
            <DialogDescription>
              This creates a new product in your product master and adds it to this room right away.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={quickAddData.product_name}
                onChange={(e) => {
                  setQuickAddData((p: any) => ({ ...p, product_name: e.target.value }));
                  if (quickAddError) setQuickAddError("");
                }}
                className="h-10 rounded-xl"
                placeholder="e.g. Premium Wood Table"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={categoryOptions}
                value={quickAddData.category_id}
                onChange={(v) => {
                  setQuickAddData((p: any) => ({ ...p, category_id: v }));
                  if (quickAddError) setQuickAddError("");
                }}
                placeholder="Select category..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Quantity Type</Label>
              <SearchableSelect
                options={QTY_TYPES}
                value={quickAddData.qty_type}
                onChange={(v) => setQuickAddData((p: any) => ({ ...p, qty_type: v }))}
                placeholder="Select quantity type..."
              />
            </div>

            {quickAddShowDimensions && (
              <div className="p-3 bg-muted/20 rounded-xl border border-dashed space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Ruler className="w-3.5 h-3.5 text-primary" />
                  Dimensions (feet)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Height</Label>
                    <Input
                      type="number"
                      value={quickAddData.height}
                      onChange={(e) =>
                        setQuickAddData((p: any) => ({
                          ...p,
                          height: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-9 rounded-lg text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Width</Label>
                    <Input
                      type="number"
                      value={quickAddData.width}
                      onChange={(e) =>
                        setQuickAddData((p: any) => ({
                          ...p,
                          width: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-9 rounded-lg text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {quickAddShowDepth && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Depth</Label>
                      <Input
                        type="number"
                        value={quickAddData.depth}
                        onChange={(e) =>
                          setQuickAddData((p: any) => ({
                            ...p,
                            depth: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="h-9 rounded-lg text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  {quickAddShowLength && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Length</Label>
                      <Input
                        type="number"
                        value={quickAddData.length}
                        onChange={(e) =>
                          setQuickAddData((p: any) => ({
                            ...p,
                            length: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="h-9 rounded-lg text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Unit</Label>
                    <SearchableSelect
                      options={unitOptions}
                      value={quickAddData.dimension_unit_id}
                      onChange={(v) =>
                        setQuickAddData((p: any) => ({ ...p, dimension_unit_id: v }))
                      }
                      placeholder="Unit..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  Price (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={quickAddData.price}
                  onChange={(e) => {
                    setQuickAddData((p: any) => ({
                      ...p,
                      price: parseFloat(e.target.value) || 0,
                    }));
                    if (quickAddError) setQuickAddError("");
                  }}
                  className="h-10 rounded-xl"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <Label>GST %</Label>
                <Input
                  type="number"
                  value={quickAddData.gst_percent}
                  onChange={(e) =>
                    setQuickAddData((p: any) => ({
                      ...p,
                      gst_percent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-10 rounded-xl"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Description{" "}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Textarea
                value={quickAddData.description}
                onChange={(e) =>
                  setQuickAddData((p: any) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                className="rounded-xl resize-none"
                placeholder="Short description (optional)"
              />
            </div>

            {quickAddError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {quickAddError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl h-10 flex-1 sm:flex-none"
              onClick={closeQuickAddDialog}
              disabled={quickAddSaving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-10 flex-1 sm:flex-none gap-2"
              onClick={handleQuickAddProduct}
              disabled={quickAddSaving}
            >
              {quickAddSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create & Add
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}